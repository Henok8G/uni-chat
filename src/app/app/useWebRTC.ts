"use client";

import { useState, useRef, useCallback } from "react";
import { createPeerConnection } from "@/lib/webrtc";
import type { Socket } from "socket.io-client";
import type {
  WebRTCOfferPayload,
  WebRTCAnswerPayload,
  WebRTCIceCandidatePayload,
} from "@/lib/webrtc";

export type CollabMessage =
  | { type: "typing"; isTyping: boolean }
  | { type: "reaction"; emoji: string; variant?: "burst" | "float" }
  | { type: "profile"; profile: any }
  | { type: "custom"; key: string; payload: any };

export type ReactionEvent = {
  emoji: string;
  variant?: "burst" | "float";
  receivedAt: number;
  key: string;
};

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaPromiseRef = useRef<Promise<MediaStream> | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const roomIdRef = useRef<string | null>(null);

  // DataChannel State
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [dataChannelState, setDataChannelState] = useState<"closed" | "connecting" | "open" | "closing">("closed");
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [lastReaction, setLastReaction] = useState<ReactionEvent | null>(null);
  const [remotePeerProfile, setRemotePeerProfile] = useState<any | null>(null);

  // Sync state cleanly
  const syncStream = (stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  };

  const cleanupWebRTC = useCallback(() => {
    pendingIceCandidatesRef.current = [];
    mediaPromiseRef.current = null;
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.ondatachannel = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      syncStream(null);
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    setDataChannelState("closed");
    setIsRemoteTyping(false);
    setLastReaction(null);
    setRemotePeerProfile(null);
    setRemoteStream(null);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    roomIdRef.current = null;
  }, []);

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dataChannelRef.current = channel;
    setDataChannelState(channel.readyState as any);

    channel.onopen = () => setDataChannelState("open");
    channel.onclose = () => {
      setDataChannelState("closed");
      setIsRemoteTyping(false);
    };
    channel.onerror = (err) => console.error("[WebRTC] Data channel error", err);
    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as CollabMessage;
        if (msg.type === "typing") {
          setIsRemoteTyping(msg.isTyping);
        } else if (msg.type === "reaction") {
          setLastReaction({
            emoji: msg.emoji,
            variant: msg.variant,
            receivedAt: Date.now(),
            key: Math.random().toString(36).substring(7),
          });
        } else if (msg.type === "profile") {
          console.log("[WebRTC] Received peer profile via DataChannel:", msg.profile);
          setRemotePeerProfile(msg.profile);
        }
      } catch (err) {
        console.error("[WebRTC] Failed to parse data channel message", err);
      }
    };
  }, []);

  const sendCollabMessage = useCallback((msg: CollabMessage) => {
    if (dataChannelRef.current?.readyState === "open") {
      try {
        dataChannelRef.current.send(JSON.stringify(msg));
      } catch (err) {
        console.error("[WebRTC] Error sending collab message:", err);
      }
    }
  }, []);

  const createPC = useCallback((socket: Socket) => {
    return createPeerConnection({
      onIceCandidate: (candidate) => {
        const roomId = roomIdRef.current;
        if (roomId) {
          socket.emit("webrtc:ice_candidate", {
            roomId,
            candidate: candidate.toJSON(),
          } satisfies WebRTCIceCandidatePayload);
        }
      },
      onRemoteTrack: (event) => {
        console.log("[WebRTC:Track] Received remote stream track:", event.track.kind);
        setRemoteStream(event.streams[0] ?? null);
      },
      onConnectionStateChange: (state) => {
        console.log(`[WebRTC:State] Room: ${roomIdRef.current || "none"} -> connectionState: ${state}`);
        if (state === "failed" || state === "disconnected") {
          setVideoError("Video connection interrupted. Text chat still works.");
          socket.emit("analytics_event", { type: "WEBRTC_FAILED", properties: { state, roomId: roomIdRef.current } });
        }
        if (state === "connected") {
          setVideoError(null);
          socket.emit("analytics_event", { type: "WEBRTC_STARTED", properties: { state, roomId: roomIdRef.current } });
        }
      },
      onDataChannel: (event) => {
        console.log("[WebRTC] Received remote data channel");
        setupDataChannel(event.channel);
      },
    });
  }, [setupDataChannel]);

  // Synchronized media acquisition with multi-tab camera sharing fallback
  const getOrCreateLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }
    if (mediaPromiseRef.current) {
      return mediaPromiseRef.current;
    }

    const acquireStream = async (): Promise<MediaStream> => {
      try {
        // Attempt full video and audio first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        syncStream(stream);
        return stream;
      } catch (err: any) {
        console.warn("[WebRTC] Primary getUserMedia failed (device in use or restricted), attempting fallback:", err);
        // Fallback: If camera is locked by another window/tab, try audio-only with a synthetic video track
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });

          // Create synthetic canvas video track so video elements/WebRTC do not reject negotiation
          if (typeof document !== "undefined") {
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#1e293b";
              ctx.fillRect(0, 0, 640, 480);
              ctx.fillStyle = "#94a3b8";
              ctx.font = "20px system-ui, sans-serif";
              ctx.textAlign = "center";
              ctx.fillText("Camera busy in another window", 320, 240);
            }
            const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(5) : null;
            const canvasVideoTrack = canvasStream?.getVideoTracks()[0];
            if (canvasVideoTrack) {
              audioStream.addTrack(canvasVideoTrack);
            }
          }

          syncStream(audioStream);
          setVideoError("Camera active in another tab. Audio active with placeholder video.");
          return audioStream;
        } catch (fallbackErr) {
          console.error("[WebRTC] Both primary and fallback media acquisition failed:", fallbackErr);
          setVideoError("Could not access camera/mic - you can still use text chat.");
          throw fallbackErr;
        }
      } finally {
        mediaPromiseRef.current = null;
      }
    };

    mediaPromiseRef.current = acquireStream();
    return mediaPromiseRef.current;
  }, []);

  // Synchronized Peer Connection creation ensuring tracks are added once
  const getOrCreatePeerConnection = useCallback(
    (socket: Socket, stream: MediaStream): RTCPeerConnection => {
      if (pcRef.current) return pcRef.current;
      const pc = createPC(socket);
      stream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, stream);
        } catch (e) {
          console.warn("[WebRTC] Notice: track already attached:", e);
        }
      });
      pcRef.current = pc;
      return pc;
    },
    [createPC]
  );

  // Helper to drain buffered early ICE candidates once remoteDescription is set
  const drainIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidateInit = pendingIceCandidatesRef.current.shift();
      if (candidateInit) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          console.log("[WebRTC] Drained buffered ICE candidate successfully");
        } catch (err) {
          console.warn("[WebRTC] Non-fatal ICE candidate buffering drain warning:", err);
        }
      }
    }
  }, []);

  const startCall = useCallback(
    async (roomId: string, isInitiator: boolean, socket: Socket) => {
      setVideoError(null);
      roomIdRef.current = roomId;
      pendingIceCandidatesRef.current = [];

      let stream: MediaStream;
      try {
        stream = await getOrCreateLocalStream();
      } catch {
        // Handled in getOrCreateLocalStream
        return;
      }

      const pc = getOrCreatePeerConnection(socket, stream);

      if (isInitiator) {
        try {
          const dc = pc.createDataChannel("collab", { ordered: true });
          setupDataChannel(dc);
          socket.emit("analytics_event", { type: "COLLAB_CHANNEL_OPENED", properties: { roomId } });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", { roomId, sdp: offer } satisfies WebRTCOfferPayload);
          console.log(`[WebRTC:Initiator] Offer sent for room: ${roomId}`);
        } catch (err) {
          console.error("[WebRTC] Failed to create offer:", err);
          setVideoError("Could not start video call. Text chat still works.");
        }
      } else {
        console.log(`[WebRTC:Receiver] Ready and awaiting offer for room: ${roomId}`);
      }
    },
    [getOrCreateLocalStream, getOrCreatePeerConnection, setupDataChannel]
  );

  const handleOffer = useCallback(
    async (payload: WebRTCOfferPayload, socket: Socket) => {
      console.log(`[WebRTC:Receiver] Received offer for room: ${payload.roomId}`);
      if (!roomIdRef.current || payload.roomId !== roomIdRef.current) {
        roomIdRef.current = payload.roomId;
      }

      let stream: MediaStream;
      try {
        stream = await getOrCreateLocalStream();
      } catch {
        return;
      }

      const pc = getOrCreatePeerConnection(socket, stream);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        // Drain any ICE candidates that arrived before the offer was processed
        await drainIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          roomId: payload.roomId,
          sdp: answer,
        } satisfies WebRTCAnswerPayload);
        console.log(`[WebRTC:Receiver] Answer sent for room: ${payload.roomId}`);

        // Drain any candidates that arrived during answer generation
        await drainIceCandidates(pc);
      } catch (err) {
        console.error("[WebRTC] Error handling offer:", err);
        setVideoError("Video negotiation failed. Text chat still works.");
      }
    },
    [getOrCreateLocalStream, getOrCreatePeerConnection, drainIceCandidates]
  );

  const handleAnswer = useCallback(
    async (payload: WebRTCAnswerPayload) => {
      console.log(`[WebRTC:Initiator] Received answer for room: ${payload.roomId}`);
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (pc.signalingState !== "have-local-offer") {
          console.warn("[WebRTC] Unexpected signaling state when applying answer:", pc.signalingState);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        // Drain any ICE candidates that arrived before the answer was processed
        await drainIceCandidates(pc);
        console.log(`[WebRTC:Initiator] Remote description set from answer for room: ${payload.roomId}`);
      } catch (err) {
        console.error("[WebRTC] Error setting remote description from answer:", err);
      }
    },
    [drainIceCandidates]
  );

  const handleIceCandidate = useCallback(
    async (payload: WebRTCIceCandidatePayload) => {
      if (!payload.candidate) return;
      const pc = pcRef.current;

      // If peer connection or remoteDescription is not ready yet, buffer candidate
      if (!pc || !pc.remoteDescription) {
        pendingIceCandidatesRef.current.push(payload.candidate);
        console.log(`[WebRTC] Buffered early ICE candidate (total queued: ${pendingIceCandidatesRef.current.length})`);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.warn("[WebRTC] ICE candidate add warning (may be non-fatal):", err);
      }
    },
    []
  );

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !isVideoEnabled;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
    setIsVideoEnabled(enabled);
  }, [isVideoEnabled]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !isAudioEnabled;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
    setIsAudioEnabled(enabled);
  }, [isAudioEnabled]);

  return {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    videoError,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupWebRTC,
    toggleCamera,
    toggleMic,
    setVideoError,
    sendCollabMessage,
    isRemoteTyping,
    lastReaction,
    dataChannelState,
    remotePeerProfile,
  };
}
