import setSdpMediaBitrate from './setSdpMediaBitrate';

const DEFAULT_OPUS_MAX_AVERAGE_BITRATE = 128000;

export default function setSdpOpusAudioConfig(
	sdp: string,
	maxAverageBitrate = DEFAULT_OPUS_MAX_AVERAGE_BITRATE,
	stereo = true,
): string {
	const lines = sdp.split('\n');
	let opusPayloadType: string | null = null;

	for (const line of lines) {
		const match = line.match(/^a=rtpmap:(\d+) opus\/48000/i);
		if (match) {
			opusPayloadType = match[1];
			break;
		}
	}

	if (!opusPayloadType) {
		return sdp;
	}

	const fmtpPrefix = `a=fmtp:${opusPayloadType} `;
	const fmtpIndex = lines.findIndex((line) => line.startsWith(fmtpPrefix));
	const stereoParam = stereo ? ';stereo=1' : '';
	const fmtpValue = `minptime=10;useinbandfec=1;maxaveragebitrate=${maxAverageBitrate}${stereoParam}`;

	if (fmtpIndex >= 0) {
		lines[fmtpIndex] = `${fmtpPrefix}${fmtpValue}`;
	} else {
		const rtpmapIndex = lines.findIndex((line) =>
			line.startsWith(`a=rtpmap:${opusPayloadType} opus/`),
		);
		if (rtpmapIndex >= 0) {
			lines.splice(rtpmapIndex + 1, 0, `${fmtpPrefix}${fmtpValue}`);
		}
	}

	const withBitrateCap = setSdpMediaBitrate(
		lines.join('\n'),
		'audio',
		Math.max(64, Math.ceil(maxAverageBitrate / 1000)),
	);

	return withBitrateCap;
}
