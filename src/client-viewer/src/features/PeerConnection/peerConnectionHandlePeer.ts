import {
	prepareDataMessageToChangeQuality,
	prepareDataMessageToGetSharingSourceType,
} from './simplePeerDataMessages';
import { VideoQuality } from '../VideoAutoQualityOptimizer/VideoQualityEnum';
import { ErrorMessage } from '../../components/ErrorDialog/ErrorMessageEnum';
import {
	DEFAULT_TRACK_ENDED_GRACE_MS,
	RECEIVER_TRACK_ENDED_GRACE_MS,
} from '../../constants/castReliabilityConstants';
import PeerConnectionPeerIsNullError from './errors/PeerConnectionPeerIsNullError';
import { ScreenSharingSource } from './ScreenSharingSourceEnum';
import isReceiverMode, {
	isMobilePlaybackDevice,
} from '../../utils/isReceiverMode';

export function getSharingShourceType(peerConnection: PeerConnection) {
	try {
		peerConnection.peer?.send(prepareDataMessageToGetSharingSourceType());
	} catch (e) {
		console.log(e);
	}
}

export default (peerConnection: PeerConnection) => {
	if (peerConnection.peer === null) {
		throw new PeerConnectionPeerIsNullError();
	}
	peerConnection.peer.on('stream', (stream) => {
		peerConnection.setUrlCallback(stream);

		let remoteTrackEndedTimeout: ReturnType<typeof setTimeout> | null = null;
		const trackEndedGraceMs = isReceiverMode()
			? RECEIVER_TRACK_ENDED_GRACE_MS
			: DEFAULT_TRACK_ENDED_GRACE_MS;

		const clearRemoteTrackEndedTimeout = () => {
			if (remoteTrackEndedTimeout) {
				clearTimeout(remoteTrackEndedTimeout);
				remoteTrackEndedTimeout = null;
			}
		};

		const scheduleRemoteTrackEndedDisconnect = () => {
			clearRemoteTrackEndedTimeout();
			remoteTrackEndedTimeout = setTimeout(() => {
				remoteTrackEndedTimeout = null;
				if (!peerConnection.isStreamStarted) {
					return;
				}
				const currentTrack = stream.getVideoTracks()[0];
				if (currentTrack && currentTrack.readyState === 'live') {
					return;
				}
				peerConnection.stopStream();
				peerConnection.UIHandler.setIsErrorDialogOpen(true);
				peerConnection.UIHandler.errorDialogMessage =
					ErrorMessage.DISCONNECTED;
			}, trackEndedGraceMs);
		};

		const bindRemoteVideoTrackHandlers = (track: MediaStreamTrack) => {
			track.onended = () => {
				console.error('remote video track ended');
				scheduleRemoteTrackEndedDisconnect();
			};

			track.onunmute = () => {
				clearRemoteTrackEndedTimeout();
			};

			track.onmute = () => {
				// Host may briefly mute during capture recovery; wait before disconnecting.
				scheduleRemoteTrackEndedDisconnect();
			};
		};

		const videoTrack = stream.getVideoTracks()[0];
		if (videoTrack) {
			bindRemoteVideoTrackHandlers(videoTrack);
		}

		stream.onaddtrack = (event) => {
			if (event.track.kind === 'video') {
				clearRemoteTrackEndedTimeout();
				bindRemoteVideoTrackHandlers(event.track);
			}
		};

		// Canvas pixel-readback every second crashes Android WebView renderers.
		const skipAutoQualityOptimizer =
			isReceiverMode() || isMobilePlaybackDevice();

		if (!skipAutoQualityOptimizer) {
			setTimeout(() => {
				peerConnection.videoAutoQualityOptimizer.setGoodQualityCallback(() => {
					if (peerConnection.videoQuality === VideoQuality.Q_AUTO) {
						try {
							peerConnection.peer?.send(prepareDataMessageToChangeQuality(1));
						} catch (e) {
							console.log(e);
						}
					}
				});

				peerConnection.videoAutoQualityOptimizer.setHalfQualityCallbak(() => {
					if (peerConnection.videoQuality === VideoQuality.Q_AUTO) {
						try {
							peerConnection.peer?.send(
								prepareDataMessageToChangeQuality(0.5),
							);
						} catch (e) {
							console.log(e);
						}
					}
				});
			}, 1000);

			if (peerConnection.videoQuality === VideoQuality.Q_AUTO) {
				peerConnection.videoAutoQualityOptimizer.startOptimizationLoop();
			}
		}

		setTimeout(getSharingShourceType, 1000, peerConnection);

		peerConnection.isStreamStarted = true;

		// if any transient error dialog was shown earlier, close it now
		try {
			peerConnection.UIHandler.setIsErrorDialogOpen(false);
			peerConnection.UIHandler.errorDialogMessage = ErrorMessage.UNKNOWN_ERROR;
		} catch (_) {
			// ignore
		}
	});

	peerConnection.peer.on('signal', (data) => {
		// fired when webrtc done preparation to start call on peerConnection machine
		peerConnection.sendEncryptedMessage({
			type: 'CALL_ACCEPTED',
			payload: {
				signalData: data,
			},
		});
	});

	peerConnection.peer.on('data', (data) => {
		const dataJSON = JSON.parse(data);

		if (dataJSON.type === 'screen_sharing_source_type') {
			peerConnection.screenSharingSourceType = dataJSON.payload.value;
			if (
				peerConnection.screenSharingSourceType === ScreenSharingSource.SCREEN ||
				peerConnection.screenSharingSourceType === ScreenSharingSource.WINDOW
			) {
				peerConnection.UIHandler.setScreenSharingSourceTypeCallback(
					peerConnection.screenSharingSourceType,
				);
			}
		}
	});
};
