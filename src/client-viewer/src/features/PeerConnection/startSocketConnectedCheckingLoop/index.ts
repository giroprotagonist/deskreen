import PeerConnection from '..';
import { ErrorMessage } from '../../../components/ErrorDialog/ErrorMessageEnum';
import {
	DEFAULT_DISCONNECT_STREAK_THRESHOLD,
	RECEIVER_DISCONNECT_STREAK_THRESHOLD,
	SOCKET_HEALTH_CHECK_INTERVAL_MS,
	SOCKET_PING_TIMEOUT_MS,
} from '../../../constants/castReliabilityConstants';
import {
	isCastStreamHealthy,
	shouldUseReceiverRelaxedDisconnect,
} from '../../../utils/receiverStreamHealth';
import setAndShowErrorDialogMessage from '../setAndShowErrorDialogMessage';

export default (peerConnection: PeerConnection): NodeJS.Timeout => {
	let disconnectedStreak = 0;
	let pingTimeout: NodeJS.Timeout | null = null;
	const relaxedDisconnect = shouldUseReceiverRelaxedDisconnect();
	const streakThreshold = relaxedDisconnect
		? RECEIVER_DISCONNECT_STREAK_THRESHOLD
		: DEFAULT_DISCONNECT_STREAK_THRESHOLD;

	const checkConnection = () => {
		const socket = peerConnection.socket;
		if (!socket) {
			disconnectedStreak++;
			handleDisconnection();
			return;
		}
		const isSocketConnected = !!socket.connected;

		if (isSocketConnected) {
			try {
				if (pingTimeout) {
					clearTimeout(pingTimeout);
				}

				const timeout = setTimeout(() => {
					disconnectedStreak++;
					handleDisconnection();
				}, SOCKET_PING_TIMEOUT_MS);

				pingTimeout = timeout;

				socket.emit('PING', (response: string) => {
					if (pingTimeout) {
						clearTimeout(pingTimeout);
						pingTimeout = null;
					}

					if (response === 'PONG') {
						disconnectedStreak = 0;
					} else {
						disconnectedStreak++;
						handleDisconnection();
					}
				});
			} catch {
				disconnectedStreak++;
				handleDisconnection();
			}
		} else {
			disconnectedStreak++;
			handleDisconnection();
		}
	};

	const handleDisconnection = () => {
		if (disconnectedStreak < streakThreshold) {
			return;
		}

		// WebRTC can keep delivering frames while signaling socket is briefly down.
		if (
			peerConnection.isStreamStarted &&
			isCastStreamHealthy() &&
			relaxedDisconnect
		) {
			disconnectedStreak = Math.max(
				0,
				streakThreshold - 2,
			);
			return;
		}

		if (peerConnection.isStreamStarted) {
			peerConnection.stopStream();
		}
		setAndShowErrorDialogMessage(peerConnection, ErrorMessage.DISCONNECTED);
	};

	return setInterval(checkConnection, SOCKET_HEALTH_CHECK_INTERVAL_MS);
};
