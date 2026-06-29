import {
	applyReceiverJitterBufferTargets,
	getActiveReceiverPeerConnection,
} from './receiverJitterBuffer';

/** Low-latency playout for control mode — input is decoupled from video buffer. */
export const RECEIVER_CONTROL_MODE_LATENCY_MS = 0;

export function applyReceiverControlModeLatency(): void {
	const pc = getActiveReceiverPeerConnection();
	if (!pc) {
		return;
	}
	applyReceiverJitterBufferTargets(pc, RECEIVER_CONTROL_MODE_LATENCY_MS);
}
