/**
 * Adds Chrome x-google-min/max-bitrate hints to video fmtp lines so LAN casts
 * maintain a usable quality floor instead of collapsing to blocky low bitrate.
 */
export default function setSdpVideoGoogleBitrateHints(
	sdp: string,
	minKbps: number,
	maxKbps: number,
): string {
	const lines = sdp.split('\n');
	const videoLineIndex = lines.findIndex((line) => line.startsWith('m=video'));
	if (videoLineIndex < 0) {
		return sdp;
	}

	let videoSectionEnd = lines.length;
	for (let i = videoLineIndex + 1; i < lines.length; i += 1) {
		if (lines[i].startsWith('m=')) {
			videoSectionEnd = i;
			break;
		}
	}

	const minHint = `x-google-min-bitrate=${minKbps}`;
	const maxHint = `x-google-max-bitrate=${maxKbps}`;

	for (let i = videoLineIndex + 1; i < videoSectionEnd; i += 1) {
		if (!lines[i].startsWith('a=fmtp:')) {
			continue;
		}

		let fmtp = lines[i];
		if (!fmtp.includes('x-google-min-bitrate')) {
			fmtp = `${fmtp};${minHint}`;
		}
		if (!fmtp.includes('x-google-max-bitrate')) {
			fmtp = `${fmtp};${maxHint}`;
		}
		lines[i] = fmtp;
	}

	return lines.join('\n');
}
