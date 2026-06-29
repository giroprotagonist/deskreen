import { Device } from '../../../common/Device';

export function isTrustedReceiverDevice(device: Device): boolean {
	const browser = device.deviceBrowser?.toLowerCase() ?? '';
	const deviceType = device.deviceType?.toLowerCase() ?? '';
	return (
		browser.includes('deskreenreceiver') ||
		deviceType.includes('tablet') ||
		deviceType.includes('mobile')
	);
}
