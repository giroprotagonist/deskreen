/** True when the address looks like a private LAN IPv4 (typical Deskreen cast). */
export default function isPrivateLanIp(ip: string): boolean {
	if (!ip) {
		return false;
	}

	const trimmed = ip.trim();
	if (trimmed.startsWith('10.')) {
		return true;
	}
	if (trimmed.startsWith('192.168.')) {
		return true;
	}

	const match = /^172\.(\d+)\./.exec(trimmed);
	if (match) {
		const secondOctet = Number.parseInt(match[1], 10);
		return secondOctet >= 16 && secondOctet <= 31;
	}

	return false;
}
