export default function setSdpMediaBitrate(
	sdp: string,
	mediaType: string,
	bitrateKbps: number,
): string {
	const sdpLines = sdp.split('\n');
	const mediaLine = `m=${mediaType}`;
	const mediaLineIndex = sdpLines.findIndex((line) => line.startsWith(mediaLine));

	if (mediaLineIndex < 0 || mediaLineIndex >= sdpLines.length) {
		return sdp;
	}

	let bitrateLineIndex = mediaLineIndex + 1;
	const bitrateLine = `b=AS:${bitrateKbps}`;

	while (
		bitrateLineIndex < sdpLines.length &&
		(sdpLines[bitrateLineIndex].startsWith('i=') ||
			sdpLines[bitrateLineIndex].startsWith('c='))
	) {
		bitrateLineIndex += 1;
	}

	if (
		bitrateLineIndex < sdpLines.length &&
		sdpLines[bitrateLineIndex].startsWith('b=')
	) {
		sdpLines[bitrateLineIndex] = bitrateLine;
	} else {
		sdpLines.splice(bitrateLineIndex, 0, bitrateLine);
	}

	return sdpLines.join('\n');
}
