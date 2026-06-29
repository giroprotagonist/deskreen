import PeerConnection from '../../features/PeerConnection';
import PeerConnectionUIHandler from '../../features/PeerConnection/PeerConnectionUIHandler';
import VideoAutoQualityOptimizer from '../../features/VideoAutoQualityOptimizer';
import changeLanguage from './changeLanguage';
import ConnectionIcon from './ConnectionIconEnum';

const REMOTE_INPUT_FAILURE_MESSAGES: Record<string, string> = {
	accessibility:
		'Mac Accessibility permission required — enable Deskreen CE in System Settings → Privacy & Security → Accessibility.',
	screenShare: 'Share a full screen on the Mac (not a single window) to use control.',
	disabled: 'Enable "Allow tablet control while casting" in Deskreen CE settings on the Mac.',
};

export default (params: CreatePeerConnectionUseEffectParams) => {
	const {
		peer,
		connectionRoomId,
		setMyDeviceDetails,
		setConnectionIconType,
		setIsShownTextPrompt,
		setPromptStep,
		setScreenSharingSourceType,
		setRemoteControlCapability,
		setRemoteInputFeedback,
		setDialogErrorMessage,
		setIsErrorDialogOpen,
		setUrl,
		setPeer,
	} = params;

	// return the effect function
	return () => {
		let createdPeer: PeerConnection | undefined;

		if (!peer) {
			if (connectionRoomId === '') {
				return;
			}
			const UIHandler = new PeerConnectionUIHandler(
				setMyDeviceDetails,
				() => {
					setConnectionIconType(ConnectionIcon.FEED_SUBSCRIBED);

					setIsShownTextPrompt(false);
					setIsShownTextPrompt(true);
					setPromptStep(2);

					setTimeout(() => {
						setIsShownTextPrompt(false);
						setIsShownTextPrompt(true);
						setPromptStep(3);
					}, 2000);
				},
				setScreenSharingSourceType,
				setRemoteControlCapability,
				(result) => {
					if (result.ok) {
						setRemoteInputFeedback(null);
						return;
					}
					const message =
						REMOTE_INPUT_FAILURE_MESSAGES[result.reason ?? ''] ??
						`Control failed: ${result.reason ?? 'unknown error'}`;
					setRemoteInputFeedback(message);
				},
				changeLanguage,
				setDialogErrorMessage,
				setIsErrorDialogOpen,
			);

			const _peer = new PeerConnection(
				connectionRoomId,
				setUrl,
				new VideoAutoQualityOptimizer(),
				UIHandler,
			);

			createdPeer = _peer;

			setPeer(_peer);

			setTimeout(() => {
				setIsShownTextPrompt(true);
			}, 100);
		}

		// return cleanup function - cleanup when connectionRoomId changes or component unmounts
		return () => {
			createdPeer?.destroy();
			if (peer) {
				peer.destroy();
			}
			setPeer(undefined);
		};
	};
};
