import { IpcEvents } from '../../../../common/IpcEvents.enum';

export default async function syncHostCastAudioOutput(
	stream: MediaStream | null,
	castingActive: boolean,
): Promise<void> {
	if (process.env.RUN_MODE === 'test') {
		return;
	}

	const hasAudio = Boolean(stream?.getAudioTracks().some((t) => t.readyState === 'live'));

	try {
		await window.electron.ipcRenderer.invoke(
			IpcEvents.SyncMacCastAudioOutput,
			castingActive && hasAudio,
		);
	} catch (error) {
		console.warn('failed to sync Mac cast audio output', error);
	}
}
