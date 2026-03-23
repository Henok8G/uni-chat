/**
 * webrtc.ts – Phase 9 helper
 * WebRTC type definitions and RTCPeerConnection factory.
 * All matching/signaling logic stays in socket.ts; this file only touches WebRTC.
 */

// ── Signaling payload types (must match server/socket.ts) ───────────────────
export type WebRTCOfferPayload = {
  roomId: string;
  sdp: RTCSessionDescriptionInit;
};

export type WebRTCAnswerPayload = {
  roomId: string;
  sdp: RTCSessionDescriptionInit;
};

export type WebRTCIceCandidatePayload = {
  roomId: string;
  candidate: RTCIceCandidateInit;
};

// ── ICE configuration ────────────────────────────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ── Peer connection factory options ─────────────────────────────────────────
export interface PCOptions {
  /** Called whenever a local ICE candidate is ready to be sent to the peer. */
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  /** Called when the remote peer adds a media track. */
  onRemoteTrack: (event: RTCTrackEvent) => void;
  /** Called whenever the ICE/connection state changes (for error handling). */
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

/**
 * Create a fully configured RTCPeerConnection, wired up with the callbacks
 * the component needs.  Callers are responsible for:
 *  1. Adding local MediaStreamTracks via pc.addTrack(track, stream).
 *  2. Closing the connection via pc.close() when done.
 */
export function createPeerConnection(opts: PCOptions): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      opts.onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    opts.onRemoteTrack(event);
  };

  pc.onconnectionstatechange = () => {
    opts.onConnectionStateChange(pc.connectionState);
  };

  // Additional state for debugging
  pc.oniceconnectionstatechange = () => {
    console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
  };

  pc.onsignalingstatechange = () => {
    console.log("[WebRTC] Signaling state:", pc.signalingState);
  };

  return pc;
}
