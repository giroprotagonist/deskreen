/// <reference types="vite/client" />

import type PeerConnection from './features/PeerConnection';

declare global {
	interface Window {
		__deskreenPeerConnection?: PeerConnection;
	}
}

export {};
