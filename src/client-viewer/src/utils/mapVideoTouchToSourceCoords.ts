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
	if (rect.width <= 0 || rect.height <= 0) {
		return null;
	}

	const localX = clientX - rect.left;
	const localY = clientY - rect.top;

	let videoWidth = video.videoWidth;
	let videoHeight = video.videoHeight;

	// WebView/Android may not expose intrinsic dimensions immediately — fall back
	// to the visible element box so taps still register.
	if (videoWidth <= 0 || videoHeight <= 0) {
		return {
			x: Math.min(1, Math.max(0, localX / rect.width)),
			y: Math.min(1, Math.max(0, localY / rect.height)),
		};
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

	const contentLocalX = localX - offsetX;
	const contentLocalY = localY - offsetY;

	if (
		contentLocalX < 0 ||
		contentLocalY < 0 ||
		contentLocalX > contentWidth ||
		contentLocalY > contentHeight
	) {
		return null;
	}

	return {
		x: contentLocalX / contentWidth,
		y: contentLocalY / contentHeight,
	};
}
