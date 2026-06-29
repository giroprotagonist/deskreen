import DesktopCapturerSourceType from '../../../../common/DesktopCapturerSourceType';
import type { RemoteInputPayload } from '../../../../common/RemoteInputTypes';
import { IpcEvents } from '../../../../common/IpcEvents.enum';
import prepareDataMessageToSendScreenSourceType from './prepareDataMessageToSendScreenSourceType';
import prepareDataMessageRemoteControlCapability from './prepareDataMessageRemoteControlCapability';

let remoteControlSessionNotified = false;

async function getAllowTabletControlSetting(): Promise<boolean> {
	try {
		return Boolean(
			await window.electron.ipcRenderer.invoke(
				IpcEvents.GetAllowTabletControlWhileCasting,
			),
		);
	} catch {
		return false;
	}
}

async function sendRemoteControlCapability(
	peerConnection: PeerConnection,
): Promise<void> {
	if (!peerConnection.peer) {
		return;
	}
	const enabled = await getAllowTabletControlSetting();
	peerConnection.peer.send(
		prepareDataMessageRemoteControlCapability(
			enabled,
			peerConnection.desktopCapturerSourceID,
		),
	);
}

async function handleRemoteInput(
	peerConnection: PeerConnection,
	payload: RemoteInputPayload,
): Promise<void> {
	const allowed = await getAllowTabletControlSetting();
	if (!allowed) {
		return;
	}

	if (
		!peerConnection.desktopCapturerSourceID.includes(
			DesktopCapturerSourceType.SCREEN,
		)
	) {
		return;
	}

	const result = await window.electron.ipcRenderer.invoke(
		IpcEvents.InjectRemoteInput,
		{
			displayID: peerConnection.displayID,
			desktopCapturerSourceID: peerConnection.desktopCapturerSourceID,
			sourceDisplaySize: peerConnection.sourceDisplaySize,
			payload,
		},
	);

	const injected = Boolean(result?.ok ?? result);

	if (injected && !remoteControlSessionNotified) {
		remoteControlSessionNotified = true;
		window.electron.ipcRenderer.send(IpcEvents.RemoteControlSessionActive, true);
	}

	if (!injected && peerConnection.peer) {
		peerConnection.peer.send(
			JSON.stringify({
				type: 'remote_input_result',
				payload: {
					ok: false,
					reason: result?.reason ?? 'unknown',
				},
			}),
		);
	}
}

export default async function handlePeerOnData(
	peerConnection: PeerConnection,
	data: string,
): Promise<void> {
	const dataJSON = JSON.parse(data);

	if (dataJSON.type === 'set_video_quality') {
		const videoTrack = peerConnection.localStream?.getVideoTracks()[0];
		if (!videoTrack) {
			return;
		}

		const maxVideoQualityMultiplier = dataJSON.payload.value;
		if (maxVideoQualityMultiplier >= 1) {
			return;
		}

		try {
			await videoTrack.applyConstraints({
				frameRate: { max: 30, ideal: 24 },
			});
		} catch (error) {
			console.warn('failed to apply video quality constraints', error);
		}
	}

	if (dataJSON.type === 'get_sharing_source_type') {
		const sourceType = peerConnection.desktopCapturerSourceID.includes(
			DesktopCapturerSourceType.SCREEN,
		)
			? DesktopCapturerSourceType.SCREEN
			: DesktopCapturerSourceType.WINDOW;

		peerConnection.peer?.send(
			prepareDataMessageToSendScreenSourceType(sourceType),
		);
		await sendRemoteControlCapability(peerConnection);
	}

	if (dataJSON.type === 'get_remote_control_capability') {
		await sendRemoteControlCapability(peerConnection);
	}

	if (dataJSON.type === 'remote_input') {
		await handleRemoteInput(peerConnection, dataJSON.payload as RemoteInputPayload);
	}
}

export function resetRemoteControlSessionNotification(): void {
	remoteControlSessionNotified = false;
}
