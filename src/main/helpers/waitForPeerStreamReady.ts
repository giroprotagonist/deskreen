import type { WebContents } from 'electron';
import SharingSession from '../../features/SharingSessionService/SharingSession';

async function waitForStreamOnWebContents(
	webContents: WebContents,
	timeoutMs: number,
): Promise<boolean> {
	if (webContents.isDestroyed()) {
		return false;
	}

	try {
		return await webContents.executeJavaScript(
			`(async () => {
				const pc = window.__deskreenPeerConnection;
				if (!pc) return false;
				if (pc.localStream && pc.localStream.getVideoTracks().length > 0) {
					return true;
				}
				return await new Promise((resolve) => {
					const started = Date.now();
					const interval = setInterval(() => {
						if (
							pc.localStream &&
							pc.localStream.getVideoTracks().length > 0
						) {
							clearInterval(interval);
							resolve(true);
							return;
						}
						if (Date.now() - started > ${timeoutMs}) {
							clearInterval(interval);
							resolve(false);
						}
					}, 100);
				});
			})()`,
			true,
		);
	} catch (error) {
		console.error('waitForPeerStreamReady failed', error);
		return false;
	}
}

export default async function waitForPeerStreamReady(
	sharingSession: SharingSession | null | undefined,
	timeoutMs = 20000,
): Promise<boolean> {
	if (!sharingSession?.peerConnectionHelperRenderer) {
		return false;
	}
	const { webContents } = sharingSession.peerConnectionHelperRenderer;
	if (!webContents || webContents.isDestroyed()) {
		return false;
	}
	return waitForStreamOnWebContents(webContents, timeoutMs);
}
