export type RemoteInputAction = 'click' | 'scroll';

export type RemoteInputPayload = {
	action: RemoteInputAction;
	/** Normalized horizontal position on shared source (0–1). */
	x: number;
	/** Normalized vertical position on shared source (0–1). */
	y: number;
	button?: 'left';
	/** Scroll delta in CSS pixels; negative = scroll up. */
	deltaY?: number;
};

export type RemoteControlCapabilityPayload = {
	enabled: boolean;
	screenShare: boolean;
	/** Logical display width (DIP) of the shared screen — for touch mapping on the receiver. */
	sourceWidth?: number;
	/** Logical display height (DIP) of the shared screen — for touch mapping on the receiver. */
	sourceHeight?: number;
};
