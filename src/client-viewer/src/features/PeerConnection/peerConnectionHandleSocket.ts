import { ErrorMessage } from '../../components/ErrorDialog/ErrorMessageEnum';
import {
	getBrowserFromUAParser,
	getDeviceTypeFromUAParser,
	getOSFromUAParser,
} from '../../utils/userAgentParserHelpers';
import PeerConnectionSocketNotDefined from './errors/PeerConnectionSocketNotDefined';
import setAndShowErrorDialogMessage from './setAndShowErrorDialogMessage';

export function getMyIPCallback(
	peerConnection: PeerConnection,
	ip: string,
	userAgent: string,
) {
	peerConnection.myDeviceDetails.myIP = ip;

	peerConnection.uaParser.setUA(userAgent);
	peerConnection.myDeviceDetails.myOS = getOSFromUAParser(
		peerConnection.uaParser,
	);
	peerConnection.myDeviceDetails.myDeviceType = getDeviceTypeFromUAParser(
		peerConnection.uaParser,
	);
	peerConnection.myDeviceDetails.myBrowser = getBrowserFromUAParser(
		peerConnection.uaParser,
	);

	peerConnection.initApp(peerConnection.user, ip);
}

export default (peerConnection: PeerConnection) => {
	let disconnectCount = 0;
	let isAllowed = true;
	let streamDisconnectGraceTimeout: ReturnType<typeof setTimeout> | null = null;
	const socket = peerConnection.socket;
	if (!socket) {
		throw new PeerConnectionSocketNotDefined();
	}

	const clearStreamDisconnectGrace = () => {
		if (streamDisconnectGraceTimeout) {
			clearTimeout(streamDisconnectGraceTimeout);
			streamDisconnectGraceTimeout = null;
		}
	};

	socket.on('disconnect', () => {
		disconnectCount++;
		// Brief socket reconnects are common; do not white-screen the viewer instantly.
		if (peerConnection.isStreamStarted) {
			if (!streamDisconnectGraceTimeout) {
				streamDisconnectGraceTimeout = setTimeout(() => {
					streamDisconnectGraceTimeout = null;
					if (!peerConnection.isStreamStarted) {
						return;
					}
					if (peerConnection.socket?.connected) {
						return;
					}
					peerConnection.stopStream();
					setAndShowErrorDialogMessage(
						peerConnection,
						ErrorMessage.DISCONNECTED,
					);
				}, 8000);
			}
			return;
		}
		// for pre-stream disconnects, wait for sustained disconnection before showing error
		if (disconnectCount > 6 && isAllowed) {
			setAndShowErrorDialogMessage(peerConnection, ErrorMessage.DISCONNECTED);
		}
	});

	socket.on('connect', () => {
		clearStreamDisconnectGrace();
		let ipCallbackReceived = false;

		// clear any existing reconnect timeout
		if (peerConnection.reconnectTimeout) {
			clearTimeout(peerConnection.reconnectTimeout);
		}

		peerConnection.reconnectTimeout = setTimeout(() => {
			if (!ipCallbackReceived && isAllowed) {
				console.log('GET_MY_IP callback not received, reconnecting socket');
				socket.disconnect();
				socket.connect();
			}
		}, 2500); // 2 seconds timeout to wait for callback

		// clear any existing getMyIP timeout
		if (peerConnection.getMyIPTimeout) {
			clearTimeout(peerConnection.getMyIPTimeout);
		}

		peerConnection.getMyIPTimeout = setTimeout(() => {
			if (!isAllowed) return;
			socket.emit('GET_MY_IP', (ip: string) => {
				console.log('GET_MY_IP', ip);
				ipCallbackReceived = true;
				if (peerConnection.reconnectTimeout) {
					clearTimeout(peerConnection.reconnectTimeout);
					peerConnection.reconnectTimeout = null;
				}
				getMyIPCallback(peerConnection, ip, window.navigator.userAgent);
			});
		}, 500);
	});

	socket.on('NOT_ALLOWED', () => {
		isAllowed = false;
		setAndShowErrorDialogMessage(peerConnection, ErrorMessage.NOT_ALLOWED);
	});

	socket.on('USER_ENTER', (payload: { users: PartnerPeerUser[] }) => {
		if (!isAllowed) return;
		const filteredPartner = payload.users.filter((v) => {
			return peerConnection.user.username !== v.username;
		});

		peerConnection.partner = filteredPartner[0];

		if (!peerConnection.partner) return;

		const userAgent = window.navigator.userAgent;
		const isDeskreenReceiverApp = userAgent.includes('DeskreenReceiver');

		peerConnection.sendEncryptedMessage({
			type: 'DEVICE_DETAILS',
			// TODO: add deviceIP in this payload
			payload: {
				os: peerConnection.myDeviceDetails.myOS,
				deviceType: isDeskreenReceiverApp
					? 'tablet'
					: peerConnection.myDeviceDetails.myDeviceType,
				browser: isDeskreenReceiverApp
					? 'DeskreenReceiver'
					: peerConnection.myDeviceDetails.myBrowser,
				deviceScreenWidth: window.screen.width,
				deviceScreenHeight: window.screen.height,
			},
		});

		peerConnection.sendEncryptedMessage({
			type: 'GET_APP_LANGUAGE',
			payload: {},
		});

		// clear any existing timeout
		if (peerConnection.setMyDeviceDetailsTimeout) {
			clearTimeout(peerConnection.setMyDeviceDetailsTimeout);
		}

		peerConnection.setMyDeviceDetailsTimeout = setTimeout(() => {
			peerConnection.UIHandler.setMyDeviceDetails({
				myIP: peerConnection.myDeviceDetails.myIP,
				myOS: peerConnection.myDeviceDetails.myOS,
				myBrowser: peerConnection.myDeviceDetails.myBrowser,
				myDeviceType: peerConnection.myDeviceDetails.myDeviceType,
				myRoomId: peerConnection.roomId,
			});
		}, 100);
	});

	// peerConnection.socket.on('USER_EXIT', (payload: any) => {
	//   // peerConnection.props.receiveUnencryptedMessage('USER_EXIT', payload);
	// });

	socket.on('MESSAGE', (payload: ReceiveEncryptedMessagePayload) => {
		if (!isAllowed) return;
		peerConnection.receiveEncryptedMessage(payload);
	});

	socket.on('ROOM_LOCKED', () => {
		setAndShowErrorDialogMessage(peerConnection, ErrorMessage.DENY_TO_CONNECT);
	});
};
