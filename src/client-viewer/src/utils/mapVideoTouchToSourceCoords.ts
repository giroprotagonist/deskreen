export type NormalizedSourceCoords = {
	x: number;
	y: number;
};

/**
 * Maps a pointer position on a video element to normalized (0–1) coordinates
 * on the visible media content, accounting for object-fit: contain letterboxing.
 */
export default function mapVideoTouchToSourceCoords(
	video: HTMLVideoElement,
	clientX: number,
	clientY: number,
): NormalizedSourceCoords | null {
	const rect = video.getBoundingClientRect();
	const videoWidth = video.videoWidth;
	const videoHeight = video.videoHeight;

	if (
		rect.width <= 0 ||
		rect.height <= 0 ||
		videoWidth <= 0 ||
		videoHeight <= 0
	) {
		return null;
	}

	const elementAspect = rect.width / rect.height;
	const videoAspect = videoWidth / videoHeight;

	let contentWidth = rect.width;
	let contentHeight = rect.height;
	let offsetX = 0;
	let offsetY = 0;

	if (videoAspect > elementAspect) {
		contentHeight = rect.width / videoAspect;
		offsetY = (rect.height - contentHeight) / 2;
	} else {
		contentWidth = rect.height * videoAspect;
		offsetX = (rect.width - contentWidth) / 2;
	}

	const localX = clientX - rect.left - offsetX;
	const localY = clientY - rect.top - offsetY;

	if (
		localX < 0 ||
		localY < 0 ||
		localX > contentWidth ||
		localY > contentHeight
	) {
		return null;
	}

	return {
		x: localX / contentWidth,
		y: localY / contentHeight,
	};
}
