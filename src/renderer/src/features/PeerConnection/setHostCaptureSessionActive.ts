import { IpcEvents } from '../../../../common/IpcEvents.enum';

export default async function setHostCaptureSessionActive(
	active: boolean,
): Promise<void> {
	if (process.env.RUN_MODE === 'test') return;
	try {
		await window.electron.ipcRenderer.invoke(
			IpcEvents.SetHostCaptureSessionActive,
			active,
		);
	} catch (error) {
		console.error('failed to update host capture session state', error);
	}
}
