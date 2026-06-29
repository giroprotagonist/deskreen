import { getDeskreenGlobal } from '../main/helpers/getDeskreenGlobal';
import { deskreenApp } from '../main';
import { Device } from '../common/Device';
import SharingSessionStatusEnum from '../features/SharingSessionService/SharingSessionStatusEnum';
import { IpcEvents } from '../common/IpcEvents.enum';
import waitForPeerStreamReady from '../main/helpers/waitForPeerStreamReady';

export function onDeviceConnectedCallback(device: Device): void {
	const deskreenGlobal = getDeskreenGlobal();
	const { connectedDevicesService, sharingSessionService } = deskreenGlobal;

	if (!connectedDevicesService.isSlotAvailable()) {
		const activeSession = [
			...sharingSessionService.sharingSessions.values(),
		].find(
			(session) =>
				session.status === SharingSessionStatusEnum.SHARING &&
				session.roomID === device.deviceRoomId,
		);

		if (activeSession) {
			connectedDevicesService.setPendingConnectionDevice(device);
			deskreenApp.mainWindow?.webContents.send(
				IpcEvents.SetPendingConnectionDevice,
				device,
			);
			void waitForPeerStreamReady(activeSession).then((ready) => {
				if (ready) {
					activeSession.callPeer();
				}
			});
			return;
		}

		const waitingSession =
			sharingSessionService.waitingForConnectionSharingSession;
		waitingSession?.denyConnectionForPartner();
		waitingSession?.setStatus(SharingSessionStatusEnum.NOT_CONNECTED);
		sharingSessionService.waitingForConnectionSharingSession = null;
		connectedDevicesService.resetPendingConnectionDevice();
		return;
	}
	connectedDevicesService.setPendingConnectionDevice(device);
	deskreenApp.mainWindow?.webContents.send(
		IpcEvents.SetPendingConnectionDevice,
		device,
	);
}
