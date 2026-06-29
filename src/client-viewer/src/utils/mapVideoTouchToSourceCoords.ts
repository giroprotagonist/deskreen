export type NormalizedSourceCoords = {
	x: number;
	y: number;
};

export type MapVideoTouchOptions = {
	/** Host-reported logical display size — preferred over videoWidth/Height on tablets. */
	sourceWidth?: number;
	sourceHeight?: number;
};

/**
 * Maps a pointer position on a video element to normalized (0–1) coordinates
 * on the visible media content, accounting for object-fit: contain letterboxing.
 */
export default function mapVideoTouchToSourceCoords(
	video: HTMLVideoElement,
	clientX: number,
	clientY: number,
	options: MapVideoTouchOptions = {},
): NormalizedSourceCoords | null {
	const rect = video.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return null;
	}

	const localX = clientX - rect.left;
	const localY = clientY - rect.top;

	const hostWidth = options.sourceWidth;
	const hostHeight = options.sourceHeight;

	let contentWidth = hostWidth && hostWidth > 0 ? hostWidth : video.videoWidth;
	let contentHeight =
		hostHeight && hostHeight > 0 ? hostHeight : video.videoHeight;

	if (contentWidth <= 0 || contentHeight <= 0) {
		return {
			x: Math.min(1, Math.max(0, localX / rect.width)),
			y: Math.min(1, Math.max(0, localY / rect.height)),
		};
	}

	const elementAspect = rect.width / rect.height;
	const contentAspect = contentWidth / contentHeight;

	let visibleWidth = rect.width;
	let visibleHeight = rect.height;
	let offsetX = 0;
	let offsetY = 0;

	if (contentAspect > elementAspect) {
		visibleHeight = rect.width / contentAspect;
		offsetY = (rect.height - visibleHeight) / 2;
	} else {
		visibleWidth = rect.height * contentAspect;
		offsetX = (rect.width - visibleWidth) / 2;
	}

	const contentLocalX = localX - offsetX;
	const contentLocalY = localY - offsetY;

	if (
		contentLocalX < 0 ||
		contentLocalY < 0 ||
		contentLocalX > visibleWidth ||
		contentLocalY > visibleHeight
	) {
		return null;
	}

	return {
		x: contentLocalX / visibleWidth,
		y: contentLocalY / visibleHeight,
	};
}
