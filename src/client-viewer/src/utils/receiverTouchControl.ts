import type { RemoteInputPayload } from '../../../common/RemoteInputTypes';
import mapVideoTouchToSourceCoords from './mapVideoTouchToSourceCoords';

export type TouchControlSendInput = (payload: RemoteInputPayload) => void;

export type TouchRipple = {
	x: number;
	y: number;
	id: number;
};

export type TouchControlOverlayState = {
	ripples: TouchRipple[];
};

type AttachTouchControlOptions = {
	video: HTMLVideoElement;
	overlay: HTMLElement;
	enabled: boolean;
	sourceWidth?: number;
	sourceHeight?: number;
	onSendInput: TouchControlSendInput;
	onRipple?: (ripple: TouchRipple) => void;
};

const MIN_SCROLL_DELTA_PX = 8;

export function attachReceiverTouchControl(
	options: AttachTouchControlOptions,
): () => void {
	const { video, overlay, enabled, onSendInput, onRipple, sourceWidth, sourceHeight } =
		options;
	let active = enabled;
	let lastTouchY: number | null = null;
	let rippleId = 0;

	const addRipple = (clientX: number, clientY: number) => {
		const rect = overlay.getBoundingClientRect();
		const ripple: TouchRipple = {
			x: clientX - rect.left,
			y: clientY - rect.top,
			id: rippleId++,
		};
		onRipple?.(ripple);
	};

	const sendAtPoint = (clientX: number, clientY: number, action: 'click') => {
		const coords = mapVideoTouchToSourceCoords(video, clientX, clientY, {
			sourceWidth,
			sourceHeight,
		});
		if (!coords) {
			return;
		}
		onSendInput({
			action,
			x: coords.x,
			y: coords.y,
			button: 'left',
		});
	};

	let lastTapAt = 0;

	const handleTap = (clientX: number, clientY: number) => {
		if (!active) return;
		const now = Date.now();
		if (now - lastTapAt < 250) {
			return;
		}
		lastTapAt = now;
		addRipple(clientX, clientY);
		sendAtPoint(clientX, clientY, 'click');
	};

	const onClick = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		handleTap(event.clientX, event.clientY);
	};

	const onTouchStart = (event: TouchEvent) => {
		if (!active) return;
		if (event.touches.length === 1) {
			lastTouchY = event.touches[0].clientY;
			return;
		}
		if (event.touches.length === 2) {
			lastTouchY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
		}
	};

	const onTouchMove = (event: TouchEvent) => {
		if (!active || event.touches.length !== 2 || lastTouchY === null) {
			return;
		}
		event.preventDefault();
		const currentY =
			(event.touches[0].clientY + event.touches[1].clientY) / 2;
		const deltaY = lastTouchY - currentY;
		lastTouchY = currentY;

		if (Math.abs(deltaY) < MIN_SCROLL_DELTA_PX) {
			return;
		}

		const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
		const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
		const coords = mapVideoTouchToSourceCoords(video, centerX, centerY, {
			sourceWidth,
			sourceHeight,
		});
		if (!coords) {
			return;
		}

		onSendInput({
			action: 'scroll',
			x: coords.x,
			y: coords.y,
			deltaY: deltaY * 2,
		});
	};

	const onTouchEnd = (event: TouchEvent) => {
		if (!active) return;
		if (event.touches.length > 0) {
			return;
		}
		const touch = event.changedTouches[0];
		if (!touch) {
			lastTouchY = null;
			return;
		}
		if (lastTouchY !== null && Math.abs(touch.clientY - lastTouchY) > 12) {
			lastTouchY = null;
			return;
		}
		lastTouchY = null;
		event.preventDefault();
		handleTap(touch.clientX, touch.clientY);
	};

	const onPointerUp = (event: PointerEvent) => {
		if (!active || event.pointerType === 'mouse') {
			return;
		}
		event.preventDefault();
		handleTap(event.clientX, event.clientY);
	};

	overlay.addEventListener('click', onClick);
	overlay.addEventListener('pointerup', onPointerUp);
	overlay.addEventListener('touchstart', onTouchStart, { passive: true });
	overlay.addEventListener('touchmove', onTouchMove, { passive: false });
	overlay.addEventListener('touchend', onTouchEnd, { passive: false });

	return () => {
		overlay.removeEventListener('click', onClick);
		overlay.removeEventListener('pointerup', onPointerUp);
		overlay.removeEventListener('touchstart', onTouchStart);
		overlay.removeEventListener('touchmove', onTouchMove);
		overlay.removeEventListener('touchend', onTouchEnd);
	};
}

export function setReceiverTouchControlEnabled(
	cleanup: (() => void) | null,
	options: AttachTouchControlOptions,
): () => void {
	cleanup?.();
	return attachReceiverTouchControl(options);
}
