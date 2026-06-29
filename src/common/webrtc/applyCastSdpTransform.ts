import setSdpMediaBitrate from './setSdpMediaBitrate';
import setSdpOpusAudioConfig from './setSdpOpusAudioConfig';

/** ~256 kbps Opus stereo — high-quality audio over WebRTC. */
export const CAST_AUDIO_MAX_BITRATE = 256000;

/** Video cap for cast sessions (kbps in b=AS). */
export const CAST_VIDEO_MAX_BITRATE_KBPS = 8000;

export default function applyCastSdpTransform(sdp: string): string {
	let result = sdp;
	result = setSdpMediaBitrate(result, 'video', CAST_VIDEO_MAX_BITRATE_KBPS);
	result = setSdpOpusAudioConfig(result, CAST_AUDIO_MAX_BITRATE, true);
	return result;
}
