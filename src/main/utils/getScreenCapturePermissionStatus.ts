import { systemPreferences } from 'electron';

export type ScreenCapturePermissionStatus =
	| 'granted'
	| 'denied'
	| 'not-determined'
	| 'restricted'
	| 'unknown'
	| 'unsupported';

export default function getScreenCapturePermissionStatus(): ScreenCapturePermissionStatus {
	if (process.platform !== 'darwin') {
		return 'unsupported';
	}
	try {
		return systemPreferences.getMediaAccessStatus(
			'screen',
		) as ScreenCapturePermissionStatus;
	} catch {
		return 'unknown';
	}
}
