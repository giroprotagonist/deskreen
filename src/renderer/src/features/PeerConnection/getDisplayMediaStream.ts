import captureDesktopMediaStream from './captureDesktopMediaStream';

export default async function getDisplayMediaStream(
	includeSystemAudio = true,
): Promise<MediaStream> {
	return captureDesktopMediaStream(
		{
			frameRate: { ideal: 30, max: 60 },
		},
		includeSystemAudio,
	);
}
