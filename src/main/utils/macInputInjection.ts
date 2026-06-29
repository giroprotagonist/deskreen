import { spawnSync } from 'node:child_process';
import { screen, systemPreferences } from 'electron';
import type { RemoteInputPayload } from '../../common/RemoteInputTypes';
import type { Display } from 'electron';

const MAX_EVENTS_PER_SECOND = 60;
let eventTimestamps: number[] = [];
let accessibilityPromptShown = false;

export type RemoteInputInjectResult = {
	ok: boolean;
	reason?: 'accessibility' | 'rate_limited' | 'display' | 'platform' | 'swift';
};

export function isMacPlatform(): boolean {
	return process.platform === 'darwin';
}

export function isAccessibilityTrusted(prompt = false): boolean {
	if (!isMacPlatform()) {
		return false;
	}
	return systemPreferences.isTrustedAccessibilityClient(prompt);
}

export function parseDisplayIdFromScreenSourceId(sourceId: string): string {
	const match = sourceId.match(/^screen:(\d+):/i);
	return match?.[1] ?? '';
}

export function getDisplayLogicalSize(display: Display): {
	width: number;
	height: number;
} {
	return {
		width: display.bounds.width,
		height: display.bounds.height,
	};
}

function isRateLimited(): boolean {
	const now = Date.now();
	eventTimestamps = eventTimestamps.filter((ts) => now - ts < 1000);
	if (eventTimestamps.length >= MAX_EVENTS_PER_SECOND) {
		return true;
	}
	eventTimestamps.push(now);
	return false;
}

function resolveTargetDisplay(
	displayID: string,
	desktopCapturerSourceID: string,
): Display | null {
	const displays = screen.getAllDisplays();
	if (displayID) {
		const match = displays.find((d) => `${d.id}` === displayID);
		if (match) {
			return match;
		}
	}

	const parsedDisplayId = parseDisplayIdFromScreenSourceId(desktopCapturerSourceID);
	if (parsedDisplayId) {
		const match = displays.find((d) => `${d.id}` === parsedDisplayId);
		if (match) {
			return match;
		}
	}

	return screen.getPrimaryDisplay();
}

/**
 * Map normalized (0–1) touch coords to global screen points.
 * Uses display.bounds (logical DIP) — never display.size (physical pixels on Retina).
 * macOS CGEvent screen coords: origin top-left of the primary display (same as Electron bounds).
 */
function resolveAbsolutePoint(
	display: Display,
	xFraction: number,
	yFraction: number,
): { x: number; y: number } {
	const x = display.bounds.x + xFraction * display.bounds.width;
	const y = display.bounds.y + yFraction * display.bounds.height;

	return {
		x: Math.round(x),
		y: Math.round(y),
	};
}

function runSwiftInputScript(scriptBody: string): boolean {
	const result = spawnSync('swift', ['-e', scriptBody], {
		timeout: 3000,
		encoding: 'utf-8',
	});
	if (result.error || result.status !== 0) {
		console.warn(
			'macOS input injection failed',
			result.stderr || result.error || result.stdout,
		);
		return false;
	}
	return true;
}

export function injectRemoteInputOnMac(
	displayID: string,
	desktopCapturerSourceID: string,
	payload: RemoteInputPayload,
): RemoteInputInjectResult {
	if (!isMacPlatform()) {
		return { ok: false, reason: 'platform' };
	}

	if (!isAccessibilityTrusted(false)) {
		if (!accessibilityPromptShown) {
			accessibilityPromptShown = true;
			isAccessibilityTrusted(true);
		}
		return { ok: false, reason: 'accessibility' };
	}

	if (isRateLimited()) {
		return { ok: false, reason: 'rate_limited' };
	}

	const display = resolveTargetDisplay(displayID, desktopCapturerSourceID);
	if (!display) {
		return { ok: false, reason: 'display' };
	}

	const point = resolveAbsolutePoint(display, payload.x, payload.y);

	if (payload.action === 'click') {
		const ok = runSwiftInputScript(`
import CoreGraphics
let p = CGPoint(x: ${point.x}, y: ${point.y})
func post(_ t: CGEventType) {
  let e = CGEvent(mouseEventSource: nil, mouseType: t, mouseCursorPosition: p, mouseButton: .left)!
  e.post(tap: .cghidEventTap)
}
post(.mouseMoved)
post(.leftMouseDown)
post(.leftMouseUp)
`);
		return ok ? { ok: true } : { ok: false, reason: 'swift' };
	}

	if (payload.action === 'scroll') {
		const deltaY = payload.deltaY ?? 0;
		const lines = Math.max(-10, Math.min(10, Math.round(deltaY / 40)));
		if (lines === 0) {
			return { ok: true };
		}
		const ok = runSwiftInputScript(`
import CoreGraphics
let p = CGPoint(x: ${point.x}, y: ${point.y})
let move = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: p, mouseButton: .left)!
move.post(tap: .cghidEventTap)
let scroll = CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 1, wheel1: Int32(${lines}), wheel2: 0, wheel3: 0)!
scroll.location = p
scroll.post(tap: .cghidEventTap)
`);
		return ok ? { ok: true } : { ok: false, reason: 'swift' };
	}

	return { ok: false, reason: 'platform' };
}
