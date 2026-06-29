import DesktopCapturerSourceType from '../../../../common/DesktopCapturerSourceType';
import prepareDataMessageToSendScreenSourceType from './prepareDataMessageToSendScreenSourceType';

export default async function handlePeerOnData(
	peerConnection: PeerConnection,
	data: string,
): Promise<void> {
	const dataJSON = JSON.parse(data);

	if (dataJSON.type === 'set_video_quality') {
		// getDisplayMedia capture cannot apply the legacy chromeMediaSource
		// resolution multipliers. Recreating the stream only stops the live track
		// and caused white-screen crashes on the tablet viewer.
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

		peerConnection.peer.send(
			prepareDataMessageToSendScreenSourceType(sourceType),
		);
	}
}
