/**
 * webrtc.ts – Phase 9 helper (updated in Phase 11 for production ICE config)
 * WebRTC type definitions and RTCPeerConnection factory.
 * All matching/signaling logic stays in socket.ts; this file only touches WebRTC.
 *
 * ── STUN/TURN Configuration (Phase 11) ─────────────────────────────────────
 *
 * ICE servers are built from environment variables at module load time.
 * Set the following in your .env / hosting env config:
 *
 *   NEXT_PUBLIC_STUN_SERVERS
 *       Comma-separated STUN URLs. Example:
 *       NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
 *
 * ── CAPACITY PLANNING (Phase 12) ───────────────────────────────────────────
 * As concurrent user load exceeds ~500-1000 users, public STUN servers
 * will start ratelimiting or fail to safely bridge symmetrical NAT routers.
 * You MUST configure `NEXT_PUBLIC_TURN_SERVERS` for production reliability.
 * 
 * - A single Coturn instance typically handles 2,000 to 5,000 concurrent relays.
 * - For multi-university deployments aiming for 10,000+ concurrent students,
 *   you should configure a load-balanced array of TURN servers or use a managed
 *   cloud TURN provider (Twilio, Metered.ca, Xirsys) integrated with GeoDNS.
 *   NEXT_PUBLIC_TURN_SERVERS
 *       Comma-separated TURN URLs. TURN is required for users behind symmetric
 *       NAT or corporate firewalls that block direct peer-to-peer UDP traffic.
 *       Example:
 *       NEXT_PUBLIC_TURN_SERVERS=turn:your-turn-server.example.com:3478
 *
 *   NEXT_PUBLIC_TURN_USERNAME         (optional, single credential for all TURN servers)
 *   NEXT_PUBLIC_TURN_PASSWORD         (optional)
 *
 * If none of these are set, the app falls back to Google's free public STUN
 * servers, which work fine on most home networks but will fail behind strict NAT.
 *
 * Never hardcode TURN credentials here – always use environment variables.
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

// ── ICE server configuration built from env vars ─────────────────────────────

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [];

  // STUN servers
  const stunRaw = process.env.NEXT_PUBLIC_STUN_SERVERS;
  if (stunRaw) {
    stunRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((url) => servers.push({ urls: url }));
  } else {
    // Default: Google's free public STUN servers
    servers.push({ urls: "stun:stun.l.google.com:19302" });
    servers.push({ urls: "stun:stun1.l.google.com:19302" });
  }

  // TURN servers (optional – strongly recommended for production deployments)
  const turnRaw = process.env.NEXT_PUBLIC_TURN_SERVERS;
  if (turnRaw) {
    const username = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const credential = process.env.NEXT_PUBLIC_TURN_PASSWORD;
    turnRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((url) => {
        const entry: RTCIceServer = { urls: url };
        if (username) entry.username = username;
        if (credential) entry.credential = credential;
        servers.push(entry);
      });
  }

  return servers;
}

const ICE_SERVERS: RTCIceServer[] = buildIceServers();

// ── Peer connection factory options ─────────────────────────────────────────
export interface PCOptions {
  /** Called whenever a local ICE candidate is ready to be sent to the peer. */
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  /** Called when the remote peer adds a media track. */
  onRemoteTrack: (event: RTCTrackEvent) => void;
  /** Called whenever the ICE/connection state changes (for error handling). */
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  /** Optional callback when the remote peer opens a data channel. */
  onDataChannel?: (event: RTCDataChannelEvent) => void;
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

  pc.oniceconnectionstatechange = () => {
    console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
  };

  pc.onsignalingstatechange = () => {
    console.log("[WebRTC] Signaling state:", pc.signalingState);
  };

  pc.ondatachannel = (event) => {
    if (opts.onDataChannel) {
      opts.onDataChannel(event);
    }
  };

  return pc;
}
