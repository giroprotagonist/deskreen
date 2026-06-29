import DesktopCapturerSourceType from '../../../../common/DesktopCapturerSourceType';

export default function prepareDataMessageRemoteControlCapability(
	enabled: boolean,
	desktopCapturerSourceID: string,
	sourceWidth?: number,
	sourceHeight?: number,
): string {
	const screenShare = desktopCapturerSourceID.includes(
		DesktopCapturerSourceType.SCREEN,
	);
	return JSON.stringify({
		type: 'remote_control_capability',
		payload: {
			enabled,
			screenShare,
			...(sourceWidth && sourceHeight
				? { sourceWidth, sourceHeight }
				: {}),
		},
	});
}
