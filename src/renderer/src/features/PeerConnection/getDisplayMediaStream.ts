import setHostCaptureSessionActive from './setHostCaptureSessionActive';

export default async function getDisplayMediaStream(
	includeSystemAudio = false,
): Promise<MediaStream> {
	await setHostCaptureSessionActive(true);
	try {
		return await navigator.mediaDevices.getDisplayMedia({
			video: {
				frameRate: { ideal: 30, max: 60 },
			},
			audio: includeSystemAudio,
		});
	} catch (error) {
		await setHostCaptureSessionActive(false);
		throw error;
	}
}
