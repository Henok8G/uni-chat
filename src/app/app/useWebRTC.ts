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
  const roomIdRef = useRef<string | null>(null);

  // DataChannel State
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [dataChannelState, setDataChannelState] = useState<"closed" | "connecting" | "open" | "closing">("closed");
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [lastReaction, setLastReaction] = useState<ReactionEvent | null>(null);

  // Sync state cleanly
  const syncStream = (stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  };

  const cleanupWebRTC = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
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
        setRemoteStream(event.streams[0] ?? null);
      },
      onConnectionStateChange: (state) => {
        console.log("[WebRTC] Connection state:", state);
        if (state === "failed" || state === "disconnected") {
          setVideoError("Video connection interrupted. Text chat still works.");
          socket.emit("analytics_event", { type: "WEBRTC_FAILED", properties: { state } });
        }
        if (state === "connected") {
          setVideoError(null);
          socket.emit("analytics_event", { type: "WEBRTC_STARTED", properties: { state } });
        }
      },
      onDataChannel: (event) => {
        console.log("[WebRTC] Received remote data channel");
        setupDataChannel(event.channel);
      },
    });
  }, [setupDataChannel]);

  const startCall = useCallback(
    async (roomId: string, isInitiator: boolean, socket: Socket) => {
      setVideoError(null);
      roomIdRef.current = roomId;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        setVideoError("Could not access camera/mic - you can still use text chat.");
        return;
      }
      syncStream(stream);

      const pc = createPC(socket);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pcRef.current = pc;

      if (isInitiator) {
        try {
          const dc = pc.createDataChannel("collab", { ordered: true });
          setupDataChannel(dc);
          socket.emit("analytics_event", { type: "COLLAB_CHANNEL_OPENED" });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", { roomId, sdp: offer } satisfies WebRTCOfferPayload);
          console.log("[WebRTC] Offer sent");
        } catch (err) {
          console.error("[WebRTC] Failed to create offer:", err);
          setVideoError("Could not start video call. Text chat still works.");
        }
      }
    },
    [createPC]
  );

  const handleOffer = useCallback(
    async (payload: WebRTCOfferPayload, socket: Socket) => {
      console.log("[WebRTC] Received offer");
      if (!roomIdRef.current) return;

      let pc = pcRef.current;
      if (!pc) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          syncStream(stream);
          pc = createPC(socket);
          stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
          pcRef.current = pc;
        } catch {
          setVideoError("Could not access camera/mic - you can still use text chat.");
          return;
        }
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          roomId: roomIdRef.current,
          sdp: answer,
        } satisfies WebRTCAnswerPayload);
        console.log("[WebRTC] Answer sent");
      } catch (err) {
        console.error("[WebRTC] Error handling offer:", err);
        setVideoError("Video negotiation failed. Text chat still works.");
      }
    },
    [createPC]
  );

  const handleAnswer = useCallback(async (payload: WebRTCAnswerPayload) => {
    console.log("[WebRTC] Received answer");
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    } catch (err) {
      console.error("[WebRTC] Error setting remote description:", err);
    }
  }, []);

  const handleIceCandidate = useCallback(
    async (payload: WebRTCIceCandidatePayload) => {
      const pc = pcRef.current;
      if (!pc || !payload.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.warn("[WebRTC] ICE add failed (may be non-fatal):", err);
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
  };
}
