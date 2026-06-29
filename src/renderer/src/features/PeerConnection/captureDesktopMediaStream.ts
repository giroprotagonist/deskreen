import setHostCaptureSessionActive from './setHostCaptureSessionActive';

type VideoConstraints = {
	frameRate: {
		min?: number;
		ideal?: number;
		max?: number;
	};
};

export default async function captureDesktopMediaStream(
	videoConstraints: VideoConstraints,
	includeSystemAudio = true,
): Promise<MediaStream> {
	await setHostCaptureSessionActive(true);

	const systemAudioConstraints = {
		echoCancellation: false,
		noiseSuppression: false,
		autoGainControl: false,
		channelCount: 2,
		sampleRate: 48000,
	} as MediaTrackConstraints;

	const captureVideoOnly = async (): Promise<MediaStream> => {
		return navigator.mediaDevices.getDisplayMedia({
			video: videoConstraints,
			audio: false,
		});
	};

	try {
		if (!includeSystemAudio) {
			return await captureVideoOnly();
		}

		try {
			const streamWithAudio = await navigator.mediaDevices.getDisplayMedia({
				video: videoConstraints,
				audio: systemAudioConstraints,
			});
			if (streamWithAudio.getVideoTracks().length > 0) {
				return streamWithAudio;
			}
			streamWithAudio.getTracks().forEach((track) => track.stop());
		} catch (error) {
			console.warn(
				'system audio capture unavailable, falling back to video only',
				error,
			);
		}

		return await captureVideoOnly();
	} catch (error) {
		await setHostCaptureSessionActive(false);
		throw error;
	}
}
