import { IpcEvents } from '../../../../common/IpcEvents.enum';
import setHostCaptureSessionActive from './setHostCaptureSessionActive';

export default async function getDesktopSourceStreamBySourceID(
	sourceID: string,
	_width: number | null | undefined = undefined,
	_height: number | null | undefined = undefined,
	_minSizeMultiplier = 1,
	_maxSizeMultiplier = 1,
	minFrameRate = 15,
	maxFrameRate = 60,
	includeSystemAudio = false,
): Promise<MediaStream> {
	const trimmedSourceId = sourceID.trim();
	if (trimmedSourceId !== '') {
		await window.electron.ipcRenderer.invoke(
			IpcEvents.SetPreferredCapturerSourceIdForDisplayMedia,
			trimmedSourceId,
		);
	}

	await setHostCaptureSessionActive(true);
	try {
		return await navigator.mediaDevices.getDisplayMedia({
			video: {
				frameRate: { min: minFrameRate, ideal: maxFrameRate, max: maxFrameRate },
			},
			audio: includeSystemAudio,
		});
	} catch (error) {
		await setHostCaptureSessionActive(false);
		throw error;
	}
}
