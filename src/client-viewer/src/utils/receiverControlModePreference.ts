const STORAGE_KEY = 'deskreenReceiverControlMode';

export function getReceiverControlModePreference(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === 'true';
	} catch {
		return false;
	}
}

export function setReceiverControlModePreference(enabled: boolean): void {
	try {
		localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
	} catch {
		// ignore
	}
}
