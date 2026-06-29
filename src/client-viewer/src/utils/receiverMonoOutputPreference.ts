const STORAGE_KEY = 'deskreenReceiverMonoOutput';

export function getReceiverMonoOutputPreference(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	try {
		return localStorage.getItem(STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

export function setReceiverMonoOutputPreference(enabled: boolean): void {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
	} catch {
		// ignore quota / private mode errors
	}
}
