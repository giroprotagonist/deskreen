type MonoGraphNodes = {
	splitter: ChannelSplitterNode;
	monoMix: GainNode;
	merger: ChannelMergerNode;
};

/**
 * Routes receiver <video> audio through Web Audio when mono downmix is enabled.
 * Stereo passthrough uses source → destination once a MediaElementSource exists.
 */
export class ReceiverMonoAudioController {
	private audioContext: AudioContext | null = null;

	private source: MediaElementAudioSourceNode | null = null;

	private monoGraph: MonoGraphNodes | null = null;

	private videoElement: HTMLVideoElement | null = null;

	private isMonoEnabled = false;

	attach(video: HTMLVideoElement, monoEnabled: boolean): void {
		if (this.videoElement && this.videoElement !== video) {
			this.release();
		}
		this.videoElement = video;
		this.isMonoEnabled = monoEnabled;
		if (!monoEnabled && !this.source) {
			return;
		}
		this.ensureContext();
		this.ensureSource();
		this.applyRouting();
	}

	async setMonoEnabled(enabled: boolean): Promise<void> {
		this.isMonoEnabled = enabled;
		if (!enabled && !this.source) {
			return;
		}
		if (!this.videoElement) {
			return;
		}
		await this.ensureContextRunning();
		this.ensureSource();
		this.applyRouting();
	}

	release(): void {
		this.disconnectSource();
		this.monoGraph = null;
		this.source = null;
		if (this.audioContext) {
			void this.audioContext.close();
			this.audioContext = null;
		}
		this.videoElement = null;
		this.isMonoEnabled = false;
	}

	private ensureContext(): void {
		if (this.audioContext) {
			return;
		}
		const AudioContextCtor =
			window.AudioContext ||
			(window as Window & { webkitAudioContext?: typeof AudioContext })
				.webkitAudioContext;
		if (!AudioContextCtor) {
			console.warn('Web Audio API is unavailable');
			return;
		}
		this.audioContext = new AudioContextCtor();
	}

	private async ensureContextRunning(): Promise<void> {
		this.ensureContext();
		if (this.audioContext?.state === 'suspended') {
			await this.audioContext.resume();
		}
	}

	private ensureSource(): void {
		if (this.source || !this.audioContext || !this.videoElement) {
			return;
		}
		try {
			this.source = this.audioContext.createMediaElementSource(
				this.videoElement,
			);
		} catch (error) {
			console.warn('Unable to create MediaElementSource for mono audio', error);
		}
	}

	private ensureMonoGraph(): MonoGraphNodes {
		if (this.monoGraph) {
			return this.monoGraph;
		}
		if (!this.audioContext) {
			throw new Error('AudioContext is not initialized');
		}
		const splitter = this.audioContext.createChannelSplitter(2);
		const monoMix = this.audioContext.createGain();
		monoMix.gain.value = 0.5;
		const merger = this.audioContext.createChannelMerger(2);

		splitter.connect(monoMix, 0);
		splitter.connect(monoMix, 1);
		monoMix.connect(merger, 0, 0);
		monoMix.connect(merger, 0, 1);

		this.monoGraph = { splitter, monoMix, merger };
		return this.monoGraph;
	}

	private disconnectSource(): void {
		if (!this.source) {
			return;
		}
		try {
			this.source.disconnect();
		} catch {
			// already disconnected
		}
		if (this.monoGraph) {
			try {
				this.monoGraph.splitter.disconnect();
				this.monoGraph.monoMix.disconnect();
				this.monoGraph.merger.disconnect();
			} catch {
				// ignore
			}
		}
	}

	private applyRouting(): void {
		if (!this.source || !this.audioContext) {
			return;
		}
		this.disconnectSource();
		if (this.isMonoEnabled) {
			const graph = this.ensureMonoGraph();
			this.source.connect(graph.splitter);
			graph.merger.connect(this.audioContext.destination);
			return;
		}
		this.source.connect(this.audioContext.destination);
	}
}
