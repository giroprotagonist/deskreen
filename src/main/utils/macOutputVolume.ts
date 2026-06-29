import { execFileSync } from 'child_process';

let savedOutputVolume: number | null = null;

function runOsascript(script: string): string {
	return execFileSync('osascript', ['-e', script], {
		encoding: 'utf8',
	}).trim();
}

export function getMacOutputVolume(): number | null {
	if (process.platform !== 'darwin') {
		return null;
	}
	try {
		const raw = runOsascript('output volume of (get volume settings)');
		const volume = Number.parseInt(raw, 10);
		return Number.isFinite(volume) ? volume : null;
	} catch {
		return null;
	}
}

export function setMacOutputVolume(volume: number): boolean {
	if (process.platform !== 'darwin') {
		return false;
	}
	try {
		const clamped = Math.max(0, Math.min(100, Math.round(volume)));
		runOsascript(`set volume output volume ${clamped}`);
		return true;
	} catch {
		return false;
	}
}

export function muteMacOutputVolume(): boolean {
	if (process.platform !== 'darwin') {
		return false;
	}
	const current = getMacOutputVolume();
	if (current === null) {
		return false;
	}
	if (savedOutputVolume === null) {
		savedOutputVolume = current;
	}
	return setMacOutputVolume(0);
}

export function restoreMacOutputVolume(): boolean {
	if (process.platform !== 'darwin' || savedOutputVolume === null) {
		return false;
	}
	const restored = setMacOutputVolume(savedOutputVolume);
	savedOutputVolume = null;
	return restored;
}
