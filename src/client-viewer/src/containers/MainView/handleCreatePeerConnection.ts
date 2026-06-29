import PeerConnection from '../../features/PeerConnection';
import PeerConnectionUIHandler from '../../features/PeerConnection/PeerConnectionUIHandler';
import VideoAutoQualityOptimizer from '../../features/VideoAutoQualityOptimizer';
import changeLanguage from './changeLanguage';
import ConnectionIcon from './ConnectionIconEnum';

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
