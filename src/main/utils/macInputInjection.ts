import { spawnSync } from 'node:child_process';
import { screen, systemPreferences } from 'electron';
import type { RemoteInputPayload } from '../../common/RemoteInputTypes';

const MAX_EVENTS_PER_SECOND = 60;
let eventTimestamps: number[] = [];

export function isMacPlatform(): boolean {
	return process.platform === 'darwin';
}

export function isAccessibilityTrusted(prompt = false): boolean {
	if (!isMacPlatform()) {
		return false;
	}
	return systemPreferences.isTrustedAccessibilityClient(prompt);
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

function electronYToCgGlobalY(electronY: number): number {
	const primary = screen.getPrimaryDisplay();
	return primary.bounds.height - electronY;
}

function resolveAbsolutePoint(
	displayID: string,
	sourceDisplaySize: { width: number; height: number } | undefined,
	xFraction: number,
	yFraction: number,
): { x: number; y: number } | null {
	const display = screen.getAllDisplays().find((d) => `${d.id}` === displayID);
	if (!display) {
		return null;
	}

	const width = sourceDisplaySize?.width ?? display.size.width;
	const height = sourceDisplaySize?.height ?? display.size.height;
	const electronX = display.bounds.x + xFraction * width;
	const electronY = display.bounds.y + yFraction * height;

	return {
		x: Math.round(electronX),
		y: Math.round(electronYToCgGlobalY(electronY)),
	};
}

function runSwiftInputScript(scriptBody: string): boolean {
	const result = spawnSync('swift', ['-e', scriptBody], {
		timeout: 3000,
		encoding: 'utf-8',
	});
	if (result.error || result.status !== 0) {
		console.warn('macOS input injection failed', result.stderr || result.error);
		return false;
	}
	return true;
}

export function injectRemoteInputOnMac(
	displayID: string,
	sourceDisplaySize: { width: number; height: number } | undefined,
	payload: RemoteInputPayload,
): boolean {
	if (!isMacPlatform()) {
		return false;
	}
	if (!isAccessibilityTrusted(false)) {
		return false;
	}
	if (isRateLimited()) {
		return false;
	}

	const point = resolveAbsolutePoint(
		displayID,
		sourceDisplaySize,
		payload.x,
		payload.y,
	);
	if (!point) {
		return false;
	}

	if (payload.action === 'click') {
		return runSwiftInputScript(`
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
	}

	if (payload.action === 'scroll') {
		const deltaY = payload.deltaY ?? 0;
		const lines = Math.max(-10, Math.min(10, Math.round(deltaY / 40)));
		if (lines === 0) {
			return true;
		}
		return runSwiftInputScript(`
import CoreGraphics
let p = CGPoint(x: ${point.x}, y: ${point.y})
let move = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: p, mouseButton: .left)!
move.post(tap: .cghidEventTap)
let scroll = CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 1, wheel1: Int32(${lines}), wheel2: 0, wheel3: 0)!
scroll.location = p
scroll.post(tap: .cghidEventTap)
`);
	}

	return false;
}
