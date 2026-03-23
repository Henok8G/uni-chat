"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socketClient";
import { createPeerConnection } from "@/lib/webrtc";
import type {
  WebRTCOfferPayload,
  WebRTCAnswerPayload,
  WebRTCIceCandidatePayload,
} from "@/lib/webrtc";
import type { Socket } from "socket.io-client";

type UserProps = {
  userId: string;
  plan: string;
  gender: string;
};

type Message = {
  id: string;
  from: "me" | "partner" | "system";
  text: string;
  createdAt: Date;
};

const statusMessages = {
  idle: "Not searching",
  searching: "Searching...",
  matched: "Matched – you're chatting now",
};

export default function ChatApp({ user }: { user: UserProps }) {
  // ── Text chat state ──────────────────────────────────────────────────────
  const [status, setStatus] = useState<"idle" | "searching" | "matched">("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showNoOppositeGenderPrompt, setShowNoOppositeGenderPrompt] = useState(false);

  // ── WebRTC / media state ─────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // Stable ref to peerConnection so callbacks don't close over stale state
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // ── Sync refs with state ─────────────────────────────────────────────────
  useEffect(() => { pcRef.current = peerConnection; }, [peerConnection]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // ── Attach streams to video elements ─────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // ── Auto-scroll on new message ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── cleanupWebRTC: close PC and stop all tracks ─────────────────────────
  const cleanupWebRTC = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
      setPeerConnection(null);
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
  }, []);

  // ── WebRTC startup: getUserMedia → create PC → maybe send offer ──────────
  const startWebRTC = useCallback(
    async (currentRoomId: string, isInitiator: boolean, socket: Socket) => {
      setVideoError(null);

      // 1. Get local camera/mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        setVideoError(
          "Could not access camera/mic – you can still use text chat."
        );
        return; // Text chat continues normally
      }
      setLocalStream(stream);

      // 2. Create peer connection
      const pc = createPeerConnection({
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
          }
          if (state === "connected") {
            setVideoError(null);
          }
        },
      });

      // 3. Add local tracks to PC
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setPeerConnection(pc);
      pcRef.current = pc;

      // 4. Only the initiator creates & sends the offer
      if (isInitiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", {
            roomId: currentRoomId,
            sdp: offer,
          } satisfies WebRTCOfferPayload);
          console.log("[WebRTC] Offer sent");
        } catch (err) {
          console.error("[WebRTC] Failed to create offer:", err);
          setVideoError("Could not start video call. Text chat still works.");
        }
      }
    },
    []
  );

  // ── Socket.IO connect & event listeners ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    getSocket().then((s) => {
      if (!mounted) return;
      socketRef.current = s;

      // ── Text chat events ───────────────────────────────────────────────
      const onMatchFound = ({
        roomId,
        isInitiator,
      }: {
        roomId: string;
        isInitiator: boolean;
      }) => {
        setStatus("matched");
        setRoomId(roomId);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            from: "system",
            text: "You are now connected with a partner.",
            createdAt: new Date(),
          },
        ]);
        setShowNoOppositeGenderPrompt(false);

        // Start WebRTC after establishing text match
        startWebRTC(roomId, isInitiator, s);
      };

      const onMessage = (text: string) => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            from: "partner",
            text,
            createdAt: new Date(),
          },
        ]);
      };

      const onPartnerLeft = () => {
        cleanupWebRTC();
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            from: "system",
            text: "Your partner left the chat.",
            createdAt: new Date(),
          },
        ]);
        setStatus("idle");
        setRoomId(null);
      };

      const onNoOppositeGender = () => {
        setShowNoOppositeGenderPrompt(true);
      };

      // ── WebRTC signaling events ────────────────────────────────────────
      const onWebRTCOffer = async ({ sdp }: WebRTCOfferPayload) => {
        console.log("[WebRTC] Received offer");
        const currentRoomId = roomIdRef.current;
        if (!currentRoomId) return;

        let pc = pcRef.current;

        // Non-initiator may not have started WebRTC yet (rare race)
        if (!pc) {
          console.warn("[WebRTC] PC not ready on offer receipt – attempting getUserMedia");
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            const newPc = createPeerConnection({
              onIceCandidate: (candidate) => {
                const rId = roomIdRef.current;
                if (rId) s.emit("webrtc:ice_candidate", { roomId: rId, candidate: candidate.toJSON() });
              },
              onRemoteTrack: (event) => setRemoteStream(event.streams[0] ?? null),
              onConnectionStateChange: (state) => {
                if (state === "failed" || state === "disconnected") {
                  setVideoError("Video connection interrupted. Text chat still works.");
                }
              },
            });
            stream.getTracks().forEach((t) => newPc.addTrack(t, stream));
            setPeerConnection(newPc);
            pcRef.current = newPc;
            pc = newPc;
          } catch {
            setVideoError("Could not access camera/mic – you can still use text chat.");
            return;
          }
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          s.emit("webrtc:answer", { roomId: currentRoomId, sdp: answer } satisfies WebRTCAnswerPayload);
          console.log("[WebRTC] Answer sent");
        } catch (err) {
          console.error("[WebRTC] Error handling offer:", err);
          setVideoError("Video negotiation failed. Text chat still works.");
        }
      };

      const onWebRTCAnswer = async ({ sdp }: WebRTCAnswerPayload) => {
        console.log("[WebRTC] Received answer");
        const pc = pcRef.current;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (err) {
          console.error("[WebRTC] Error setting remote description:", err);
        }
      };

      const onWebRTCIceCandidate = async ({ candidate }: WebRTCIceCandidatePayload) => {
        const pc = pcRef.current;
        if (!pc || !candidate) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          // Non-fatal: ICE candidates may arrive before remote description is set
          console.warn("[WebRTC] ICE add failed (may be non-fatal):", err);
        }
      };

      // ── Disconnect ─────────────────────────────────────────────────────
      const onDisconnect = () => {
        cleanupWebRTC();
        setConnectionLost(true);
        setStatus("idle");
        setRoomId(null);
      };

      s.on("match_found", onMatchFound);
      s.on("message", onMessage);
      s.on("partner_left", onPartnerLeft);
      s.on("no_opposite_gender_available", onNoOppositeGender);
      s.on("webrtc:offer", onWebRTCOffer);
      s.on("webrtc:answer", onWebRTCAnswer);
      s.on("webrtc:ice_candidate", onWebRTCIceCandidate);
      s.on("disconnect", onDisconnect);
    });

    return () => {
      mounted = false;
      cleanupWebRTC();
      if (socketRef.current) {
        socketRef.current.off("match_found");
        socketRef.current.off("message");
        socketRef.current.off("partner_left");
        socketRef.current.off("no_opposite_gender_available");
        socketRef.current.off("webrtc:offer");
        socketRef.current.off("webrtc:answer");
        socketRef.current.off("webrtc:ice_candidate");
        socketRef.current.off("disconnect");
      }
    };
  }, [cleanupWebRTC, startWebRTC]);

  // ── Control handlers ──────────────────────────────────────────────────────
  const handleStartChat = () => {
    if (!socketRef.current) return;
    setConnectionLost(false);
    setStatus("searching");
    setMessages([]);
    socketRef.current.emit("join_queue", {
      userId: user.userId,
      plan: user.plan,
      gender: user.gender,
    });
  };

  const handleNext = () => {
    if (!socketRef.current) return;
    cleanupWebRTC();
    setStatus("searching");
    setRoomId(null);
    setMessages([]);
    socketRef.current.emit("next");
  };

  const handleEndChat = () => {
    if (!socketRef.current) return;
    cleanupWebRTC();
    socketRef.current.emit("leave_queue");
    setStatus("idle");
    setRoomId(null);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        from: "system",
        text: "You ended the chat.",
        createdAt: new Date(),
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current || !roomId) return;

    socketRef.current.emit("message", { roomId, text });
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        from: "me",
        text,
        createdAt: new Date(),
      },
    ]);
    setInput("");
  };

  const handleProFallback = (choice: "anyone" | "wait") => {
    if (!socketRef.current) return;
    setShowNoOppositeGenderPrompt(false);
    if (choice === "anyone") {
      socketRef.current.emit("pro_fallback_anyone");
    } else {
      socketRef.current.emit("pro_keep_waiting");
    }
  };

  const handleToggleCamera = () => {
    if (!localStream) return;
    const enabled = !isVideoEnabled;
    localStream.getVideoTracks().forEach((t) => { t.enabled = enabled; });
    setIsVideoEnabled(enabled);
  };

  const handleToggleMic = () => {
    if (!localStream) return;
    const enabled = !isAudioEnabled;
    localStream.getAudioTracks().forEach((t) => { t.enabled = enabled; });
    setIsAudioEnabled(enabled);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const hasVideo = status === "matched" && (localStream !== null || remoteStream !== null);

  return (
    <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">

      {/* ── Video Area (shown only when matched and streams exist) ───────── */}
      {hasVideo && (
        <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
          {/* Remote video – full area */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
            aria-label="Remote video"
          />

          {/* Local video – small overlay top-right */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute right-3 top-3 h-24 w-36 rounded-xl border-2 border-white/20 object-cover shadow-lg"
            aria-label="Your video"
          />

          {/* Remote stream placeholder (partner's camera off / loading) */}
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
                Waiting for partner&apos;s video…
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Camera/mic error banner ──────────────────────────────────────── */}
      {videoError && (
        <div className="flex items-center justify-between gap-3 border-b border-yellow-200 bg-yellow-50 px-4 py-2 dark:border-yellow-900/40 dark:bg-yellow-950/40">
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ {videoError}
          </span>
          <button
            onClick={() => setVideoError(null)}
            className="shrink-0 text-xs text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Connection-lost banner ───────────────────────────────────────── */}
      {connectionLost && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2 dark:border-red-900/40 dark:bg-red-950/40">
          <span className="text-sm text-red-800 dark:text-red-200">
            🔌 Connection lost. Please reload or start a new chat.
          </span>
          <button
            onClick={() => setConnectionLost(false)}
            className="shrink-0 text-xs text-red-600 hover:text-red-900 dark:text-red-400"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Top Status Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              status === "idle"
                ? "bg-zinc-400"
                : status === "searching"
                ? "animate-pulse bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {statusMessages[status]}
          </span>
        </div>

        {/* Chat Controls */}
        <div className="flex items-center gap-2">
          {status === "idle" ? (
            <button
              onClick={handleStartChat}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start Chat
            </button>
          ) : (
            <button
              onClick={handleEndChat}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              End Chat
            </button>
          )}

          {status === "matched" && (
            <button
              onClick={handleNext}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              Next
            </button>
          )}

          {/* Camera & Mic toggles (only when matched and stream available) */}
          {status === "matched" && localStream && (
            <>
              <button
                onClick={handleToggleCamera}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isVideoEnabled
                    ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-900/60"
                }`}
                aria-label={isVideoEnabled ? "Disable camera" : "Enable camera"}
              >
                {isVideoEnabled ? "📹" : "🚫📹"}
              </button>

              <button
                onClick={handleToggleMic}
                title={isAudioEnabled ? "Mute" : "Unmute"}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isAudioEnabled
                    ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-900/60"
                }`}
                aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {isAudioEnabled ? "🎤" : "🔇"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ──────────────────────────────────────────────── */}
      <div className="relative flex min-h-[300px] flex-1 flex-col overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-950">
        {/* Pro Fallback Modal/Banner */}
        {showNoOppositeGenderPrompt && user.plan === "PRO" && (
          <div className="absolute inset-x-0 top-0 z-10 m-4 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-900/50 dark:bg-blue-950/80">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              No preferred match available
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              There are no matching users online right now. What would you like to do?
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleProFallback("anyone")}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Match with anyone
              </button>
              <button
                onClick={() => handleProFallback("wait")}
                className="rounded-md border border-blue-300 bg-transparent px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/50"
              >
                Keep waiting
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-end">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${
                  msg.from === "me"
                    ? "justify-end"
                    : msg.from === "partner"
                    ? "justify-start"
                    : "justify-center"
                }`}
              >
                {msg.from === "system" ? (
                  <div className="rounded-full bg-zinc-200/50 px-3 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                    {msg.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      msg.from === "me"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* ── Input Row ────────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "matched"}
            placeholder={
              status === "matched"
                ? "Type a message..."
                : "Match with someone to chat"
            }
            className="flex-1 rounded-xl border-0 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-900 disabled:opacity-50 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100"
          />
          <button
            type="submit"
            disabled={status !== "matched" || !input.trim()}
            className="flex h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
