import { IpcEvents } from '../../../../common/IpcEvents.enum';
import captureDesktopMediaStream from './captureDesktopMediaStream';

export default async function getDesktopSourceStreamBySourceID(
	sourceID: string,
	_width: number | null | undefined = undefined,
	_height: number | null | undefined = undefined,
	_minSizeMultiplier = 1,
	_maxSizeMultiplier = 1,
	minFrameRate = 24,
	maxFrameRate = 30,
	includeSystemAudio = true,
): Promise<MediaStream> {
	const trimmedSourceId = sourceID.trim();
	if (trimmedSourceId !== '') {
		await window.electron.ipcRenderer.invoke(
			IpcEvents.SetPreferredCapturerSourceIdForDisplayMedia,
			trimmedSourceId,
		);
	}

	return captureDesktopMediaStream(
		{
			frameRate: { min: minFrameRate, ideal: maxFrameRate, max: maxFrameRate },
		},
		includeSystemAudio,
	);
}
