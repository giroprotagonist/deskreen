import setSdpMediaBitrate from './setSdpMediaBitrate';
import setSdpOpusAudioConfig from './setSdpOpusAudioConfig';
import setSdpVideoGoogleBitrateHints from './setSdpVideoGoogleBitrateHints';

/** ~256 kbps Opus stereo — high-quality audio over WebRTC. */
export const CAST_AUDIO_MAX_BITRATE = 256000;

/** Video cap for cast sessions (kbps in b=AS). */
export const CAST_VIDEO_MAX_BITRATE_KBPS = 8000;

/** Floor at 70% of max so LAN casts avoid collapsing to unusable quality. */
export const CAST_VIDEO_MIN_BITRATE_KBPS = Math.floor(
	CAST_VIDEO_MAX_BITRATE_KBPS * 0.7,
);

export default function applyCastSdpTransform(sdp: string): string {
	let result = sdp;
	result = setSdpMediaBitrate(result, 'video', CAST_VIDEO_MAX_BITRATE_KBPS);
	result = setSdpVideoGoogleBitrateHints(
		result,
		CAST_VIDEO_MIN_BITRATE_KBPS,
		CAST_VIDEO_MAX_BITRATE_KBPS,
	);
	result = setSdpOpusAudioConfig(result, CAST_AUDIO_MAX_BITRATE, true);
	return result;
}
