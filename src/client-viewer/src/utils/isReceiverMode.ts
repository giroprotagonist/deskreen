export default function isReceiverMode(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	const params = new URLSearchParams(window.location.search);
	if (params.get('receiver') === '1') {
		return true;
	}

	const ua = navigator.userAgent || '';
	if (/DeskreenReceiver|wv\)/i.test(ua)) {
		return true;
	}

	try {
		return localStorage.getItem('deskreen_receiver') === '1';
	} catch {
		return false;
	}
}

export function isMobilePlaybackDevice(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
