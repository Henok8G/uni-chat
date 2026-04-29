"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSocket } from "@/lib/socketClient";
import type { Socket } from "socket.io-client";
import { useWebRTC } from "@/app/app/useWebRTC";
import { MenuBar } from "@/components/ui/bottom-menu";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Sun,
  Moon,
  ArrowRight,
  Square,
  MessageSquare,
  Video,
  User as UserIcon,
  CreditCard,
  Settings as SettingsIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";


// ── Emoji Reaction Configuration ─────────────────────────────────────────────
const EMOJIS = [
  { emoji: "❤️", label: "Love", color: "#ff4d6d", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/2665_fe0f/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/2665_fe0f/512.gif" },
  { emoji: "😂", label: "Haha", color: "#ffd60a", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif" },
  { emoji: "😍", label: "Wow", color: "#f72585", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif" },
  { emoji: "🔥", label: "Fire", color: "#fb5607", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif" },
  { emoji: "👍", label: "Like", color: "#4cc9f0", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fc/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fc/512.gif" },
  { emoji: "🎉", label: "Party", color: "#B0C4DE", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif" },
  { emoji: "💯", label: "100", color: "#06d6a0", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.gif" },
  { emoji: "🥺", label: "Pleading", color: "#B0C4DE", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.gif" },
  { emoji: "😭", label: "Cry", color: "#3a86ff", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif" },
  { emoji: "🥵", label: "Hot", color: "#ff8c00", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f975/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f975/512.gif" },
  { emoji: "🤬", label: "Mad", color: "#e63946", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92c/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92c/512.gif" },
  { emoji: "🫣", label: "Peeking", color: "#f4a261", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae3/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae3/512.gif" },
  { emoji: "💅", label: "Nails", color: "#ff006e", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f485_1f3fd/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f485_1f3fd/512.gif" },
  { emoji: "✨", label: "Sparkles", color: "#ffd60a", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif" },
  { emoji: "🌹", label: "Rose", color: "#d00000", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f339/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f339/512.gif" },
  { emoji: "🙈", label: "Monkey1", color: "#8b5e3c", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.gif" },
  { emoji: "🙉", label: "Monkey2", color: "#8b5e3c", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f649/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f649/512.gif" },
  { emoji: "🙊", label: "Monkey3", color: "#8b5e3c", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64a/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64a/512.gif" },
  { emoji: "😶‍🌫️", label: "CloudFace", color: "#a8dadc", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f636_200d_1f32b_fe0f/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f636_200d_1f32b_fe0f/512.gif" },
  { emoji: "🫪", label: "Distorted", color: "#fca311", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1faea/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1faea/512.gif" },
  { emoji: "😹", label: "Cat1", color: "#f4a261", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f639/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f639/512.gif" },
  { emoji: "😻", label: "Cat2", color: "#f4a261", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f63b/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f63b/512.gif" },
  { emoji: "😽", label: "Cat3", color: "#f4a261", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f63d/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f63d/512.gif" },
  { emoji: "😮‍💨", label: "Exhale", color: "#457b9d", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e_200d_1f4a8/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e_200d_1f4a8/512.gif" },
  { emoji: "😤", label: "Triumph", color: "#e63946", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f624/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f624/512.gif" },
  { emoji: "😒", label: "Unamused", color: "#f4a261", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f612/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f612/512.gif" },
  { emoji: "🫢", label: "HandMouth", color: "#e76f51", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae2/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae2/512.gif" },
  { emoji: "🤤", label: "Drool", color: "#2a9d8f", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f924/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f924/512.gif" },
  { emoji: "💃", label: "Dancer", color: "#e63946", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f483_1f3fd/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f483_1f3fd/512.gif" },
  { emoji: "☄️", label: "Comet", color: "#fca311", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/2604_fe0f/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/2604_fe0f/512.gif" },
  { emoji: "💍", label: "Ring", color: "#8ecae6", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48d/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48d/512.gif" },
  { emoji: "🥸", label: "Disguise", color: "#264653", webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f978/512.webp", gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f978/512.gif" },
];

// ── Helper Component for Animated Emojis ──────────────────────────────────────
function AnimatedEmoji({ 
  emoji, 
  className, 
  size = 32 
}: { 
  emoji: typeof EMOJIS[0] | string, 
  className?: string,
  size?: number
}) {
  const data = typeof emoji === "string" ? EMOJIS.find(e => e.emoji === emoji) : emoji;
  
  if (!data?.webp) return <span className={className}>{typeof emoji === "string" ? emoji : emoji.emoji}</span>;
  
  return (
    <picture className={cn("inline-block", className)}>
      <source srcSet={data.webp} type="image/webp" />
      <img 
        src={data.gif} 
        alt={data.label} 
        width={size} 
        height={size} 
        loading="eager"
        fetchPriority="high"
        className="w-full h-full object-contain" 
      />
    </picture>
  );
}

const MENU_ITEMS = [
  { icon: Video, label: "Vid Chat", href: "/app" },
  { icon: UserIcon, label: "Profile", href: "/profile" },
  { icon: CreditCard, label: "Plan", href: "/payment" },
  { icon: SettingsIcon, label: "Settings", href: "/settings" }
];

// ── Particle burst spawner ────────────────────────────────────────────────────
type Particle = { id: string; emoji: string; x: number; angle: number; dist: number; rot: number };

function ReactionOverlay({ reaction }: { reaction: { emoji: string; key: string } | null }) {
  const [bursts, setBursts] = useState<Particle[][]>([]);

  useEffect(() => {
    if (!reaction) return;
    const count = 8;
    const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: `${reaction.key}-${i}`,
      emoji: reaction.emoji,
      x: Math.random() * 60 + 20,       // % from left
      angle: (360 / count) * i + Math.random() * 20 - 10,
      dist: Math.random() * 120 + 80,   // px travel distance
      rot: Math.random() * 720 - 360,   // degrees spin
    }));
    setBursts((prev) => [...prev, particles]);
    setTimeout(() => setBursts((prev) => prev.slice(1)), 2200);
  }, [reaction]);

  return (
    <AnimatePresence>
      {bursts.map((group, gi) =>
        group.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const dx = Math.cos(rad) * p.dist;
          const dy = Math.sin(rad) * p.dist;
          return (
            <motion.div
              key={p.id}
              className="pointer-events-none absolute select-none text-4xl"
              style={{ left: `${p.x}%`, bottom: "15%", zIndex: 60 }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.2, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: dx,
                y: -dy,
                scale: [0.2, 1.4, 1, 0.6],
                rotate: p.rot,
              }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              <AnimatedEmoji emoji={p.emoji} className="w-10 h-10" size={40} />
            </motion.div>
          );
        })
      )}
    </AnimatePresence>
  );
}

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
  matched: "Matched - you're chatting now",
};

const MOCK_PROFILES = [
  { name: "Henok", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Henok" },
  { name: "Sara", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sara" },
  { name: "Robel", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Robel" },
  { name: "Yonas", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Yonas" },
  { name: "Lydia", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lydia" }
];

export default function ChatApp({ user }: { user: UserProps }) {
  // ── Text chat state ──────────────────────────────────────────────────────
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "searching" | "matched">("idle");
  const [isDark, setIsDark] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<{ name: string, avatar: string } | null>(null);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [addFriendState, setAddFriendState] = useState<"idle" | "added" | "hidden">("idle");
  const [genderFilter, setGenderFilter] = useState<"any" | "female" | "male">("any");
  const [genderDir, setGenderDir] = useState<1 | -1>(1);
  const [showNoOppositeGenderPrompt, setShowNoOppositeGenderPrompt] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    if (addFriendState === "added") {
      const timer = setTimeout(() => {
        setAddFriendState("hidden");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [addFriendState]);

  // ── Reporting State ──────────────────────────────────────────────────────
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("OTHER");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // ── WebRTC Hook ──────────────────────────────────────────────────────────
  const {
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
  } = useWebRTC();

  // ── Refs ─────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Attach streams to video elements ─────────────────────────────────────
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

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

  // ── Socket.IO connect & event listeners ──────────────────────────────────
  useEffect(() => {
    // Phase 11: getSocket() is now synchronous (single-port same-origin server)
    const s = getSocket();
    socketRef.current = s;

    // ── Text chat events ───────────────────────────────────────────────
    const onMatchFound = ({
      roomId,
      chatSessionId,
      isInitiator,
    }: {
      roomId: string;
      chatSessionId: string;
      isInitiator: boolean;
    }) => {
      setStatus("matched");
      setRoomId(roomId);
      setChatSessionId(chatSessionId);
      setPartnerProfile(MOCK_PROFILES[Math.floor(Math.random() * MOCK_PROFILES.length)]);
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
      startCall(roomId, isInitiator, s);
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
      setChatSessionId(null);
      setPartnerProfile(null);
      setAddFriendState("idle");
    };

    const onNoOppositeGender = () => {
      setShowNoOppositeGenderPrompt(true);
    };

    // ── WebRTC signaling events ──────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onWebRTCOffer = (payload: any) => handleOffer(payload, s);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onWebRTCAnswer = (payload: any) => handleAnswer(payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onWebRTCIceCandidate = (payload: any) => handleIceCandidate(payload);

    // ── Disconnect ───────────────────────────────────────────────────────
    const onDisconnect = () => {
      cleanupWebRTC();
      setConnectionLost(true);
      setStatus("idle");
      setRoomId(null);
      setChatSessionId(null);
      setPartnerProfile(null);
      setAddFriendState("idle");
    };

    s.on("match_found", onMatchFound);
    s.on("message", onMessage);
    s.on("partner_left", onPartnerLeft);
    s.on("no_opposite_gender_available", onNoOppositeGender);
    s.on("webrtc:offer", onWebRTCOffer);
    s.on("webrtc:answer", onWebRTCAnswer);
    s.on("webrtc:ice_candidate", onWebRTCIceCandidate);
    s.on("disconnect", onDisconnect);

    return () => {
      cleanupWebRTC();
      s.off("match_found", onMatchFound);
      s.off("message", onMessage);
      s.off("partner_left", onPartnerLeft);
      s.off("no_opposite_gender_available", onNoOppositeGender);
      s.off("webrtc:offer", onWebRTCOffer);
      s.off("webrtc:answer", onWebRTCAnswer);
      s.off("webrtc:ice_candidate", onWebRTCIceCandidate);
      s.off("disconnect", onDisconnect);
    };
  }, [cleanupWebRTC, startCall, handleOffer, handleAnswer, handleIceCandidate]);

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
    setChatSessionId(null);
    setPartnerProfile(null);
    setAddFriendState("idle");
    setMessages([]);
    socketRef.current.emit("next");
  };

  const handleEndChat = () => {
    if (!socketRef.current) return;
    cleanupWebRTC();
    socketRef.current.emit("leave_queue");
    setStatus("idle");
    setRoomId(null);
    setChatSessionId(null);
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

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (dataChannelState === "open") {
      sendCollabMessage({ type: "typing", isTyping: false });
    }

    setShowEmojiPicker(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (dataChannelState === "open") {
      sendCollabMessage({ type: "typing", isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendCollabMessage({ type: "typing", isTyping: false });
      }, 2000);
    }
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

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatSessionId) {
      alert("No active session to report.");
      return;
    }
    setIsSubmittingReport(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatSessionId, reasonCategory: reportReason, details: reportDetails }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsReportModalOpen(false);
        setReportDetails("");
        alert("Report submitted successfully. We will review this shortly.");
        // Instantly leave the room for safety
        handleNext();
      } else {
        alert(data.error || "Failed to submit report.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const hasVideo = status === "matched" && (localStream !== null || remoteStream !== null);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden relative">

      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <header className="flex w-full items-center justify-between px-6 py-4 z-40">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Uni-Chat
        </h1>

        <div className="absolute left-1/2 -translate-x-1/2">
          <MenuBar items={MENU_ITEMS} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-10 items-center justify-center rounded-full bg-white px-3 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700"
          >
            {isDark ? <Moon className="h-5 w-5 text-zinc-200" /> : <Sun className="h-5 w-5 text-zinc-800" />}
          </button>

          <button
            onClick={() => router.push("/auth/login")}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* ── Content Area (Videos + Chat) ──────────────────────────────────────────────── */}
      <div className="flex-1 flex w-full relative z-10 transition-all p-4 lg:p-6 pb-2 gap-4 lg:gap-6 overflow-hidden">
        <motion.div layout className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
          {!hasVideo && status === "idle" && (
            <div className="text-center flex flex-col items-center animate-in fade-in duration-500">
              <div className="h-24 w-24 rounded-full bg-white shadow-xl dark:bg-zinc-800 flex items-center justify-center mb-6">
                <Video className="w-10 h-10" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Ready to meet someone new?</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-sm">
                Join the queue to instantly connect with university students worldwide.
              </p>
              <button
                onClick={handleStartChat}
                className="rounded-xl bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-900 border-[2.5px] border-zinc-900 dark:border-white"
              >
                Start Chat
              </button>
            </div>
          )}

          {status === "searching" && (
            <div className="text-center flex flex-col items-center animate-in fade-in duration-500">
              <div className="relative flex items-center justify-center h-24 w-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 animate-ping" style={{ borderColor: 'var(--theme-accent)', opacity: 0.4 }}></div>
                <div className="absolute inset-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-accent)', opacity: 0.2 }}></div>
                <div className="absolute inset-4 rounded-full z-10 flex items-center justify-center" style={{ backgroundColor: 'var(--theme-accent)' }}>
                  <UserIcon className="w-6 h-6 text-zinc-900" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Searching...</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                Finding the perfect match for you.
              </p>
              <button
                onClick={handleEndChat}
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700"
              >
                Cancel
              </button>
            </div>
          )}

          {hasVideo && (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full h-[60vh] max-h-[600px] animate-in zoom-in-95 duration-500">
              {/* Left (Local Video) */}
              <div className="relative h-full w-full rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-xl border-[4px] border-white/60 dark:border-zinc-700/50 mix-blend-normal">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />

                {/* Embedded Reactions Toolbar */}
                {dataChannelState === "open" && (
                  <div className="absolute top-4 left-4 z-40 flex flex-col gap-1.5 opacity-0 hover:opacity-100 transition-opacity">
                    {EMOJIS.slice(0, 4).map(({ emoji, color }) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          sendCollabMessage({ type: "reaction", emoji });
                          socketRef.current?.emit("analytics_event", { type: "REACTION_SENT", properties: { emoji } });
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-xl hover:scale-110 border border-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
                    <Video className="w-12 h-12 text-zinc-500" />
                  </div>
                )}
              </div>

              {/* Right (Remote Video) */}
              <div className="relative h-full w-full rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-xl border-[4px] border-white/60 dark:border-zinc-700/50 mix-blend-normal">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />

                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium bg-white/80 dark:bg-zinc-900/80 px-4 py-2 rounded-full shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></div>
                      Connecting...
                    </span>
                  </div>
                )}
                <ReactionOverlay reaction={lastReaction} />
              </div>
            </motion.div>
          )}

          {/* ── Bottom Controls ──────────────────────────────────────────────── */}
          {status === "matched" && (
            <div className="flex w-full items-center justify-center px-6 pb-6 pt-2 z-40 gap-4 sm:gap-6 relative animate-in slide-in-from-bottom-8 duration-500">

              <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-center">
                <button
                  onClick={handleNext}
                  className="group flex h-14 w-20 sm:h-16 sm:w-28 items-center justify-center rounded-[20px] border-[3px] border-zinc-900 bg-white transition-all hover:bg-zinc-50 hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:hover:shadow-[4px_4px_0px_0px_rgba(244,244,245,1)]"
                >
                  <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-900 dark:text-zinc-100 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={handleEndChat}
                  className="group flex h-14 w-20 sm:h-16 sm:w-28 items-center justify-center rounded-[20px] border-[3px] border-zinc-900 bg-white transition-all hover:bg-zinc-50 hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:hover:shadow-[4px_4px_0px_0px_rgba(244,244,245,1)]"
                >
                  <Square className="h-5 w-5 sm:h-6 sm:w-6 fill-zinc-900 text-zinc-900 dark:fill-zinc-100 dark:text-zinc-100 rounded-[4px] transition-transform group-hover:scale-110" />
                </button>
                <button
                  onClick={() => {
                    const cycle: Array<"any" | "female" | "male"> = ["any", "female", "male"];
                    const currentIdx = cycle.indexOf(genderFilter);
                    const nextIdx = (currentIdx + 1) % cycle.length;
                    setGenderDir(nextIdx > currentIdx ? 1 : -1);
                    setGenderFilter(cycle[nextIdx]);
                  }}
                  className="group relative flex h-14 w-24 sm:h-16 sm:w-32 items-center justify-center rounded-[20px] border-[3px] border-zinc-900 bg-white text-2xl sm:text-3xl transition-all hover:bg-zinc-50 hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:hover:shadow-[4px_4px_0px_0px_rgba(244,244,245,1)] overflow-hidden"
                >
                  <AnimatePresence mode="wait" custom={genderDir}>
                    {genderFilter === "any" && (
                      <motion.span
                        key="any"
                        custom={genderDir}
                        initial={{ opacity: 0, y: genderDir === 1 ? 30 : -30, rotate: genderDir === 1 ? -15 : 15 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: genderDir === 1 ? -30 : 30, rotate: genderDir === 1 ? 15 : -15 }}
                        transition={{ type: "spring", stiffness: 350, damping: 22 }}
                        className="flex items-center absolute"
                      >
                        👨 <span className="mx-1 text-base text-zinc-300 dark:text-zinc-700">|</span> 👩
                      </motion.span>
                    )}
                    {genderFilter === "female" && (
                      <motion.span
                        key="female"
                        custom={genderDir}
                        initial={{ opacity: 0, y: genderDir === 1 ? 30 : -30, x: genderDir === 1 ? 20 : -20, rotate: genderDir === 1 ? -20 : 20 }}
                        animate={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: genderDir === 1 ? -30 : 30, x: genderDir === 1 ? -20 : 20, rotate: genderDir === 1 ? 20 : -20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 22 }}
                        className="absolute text-3xl"
                      >
                        👩
                      </motion.span>
                    )}
                    {genderFilter === "male" && (
                      <motion.span
                        key="male"
                        custom={genderDir}
                        initial={{ opacity: 0, y: genderDir === 1 ? 30 : -30, x: genderDir === 1 ? -20 : 20, rotate: genderDir === 1 ? 20 : -20 }}
                        animate={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: genderDir === 1 ? -30 : 30, x: genderDir === 1 ? 20 : -20, rotate: genderDir === 1 ? -20 : 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 22 }}
                        className="absolute text-3xl"
                      >
                        👨
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              <div className="absolute right-6 top-1/2 -translate-y-1/2 mt-2">
                {!isChatOpen && (
                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="flex h-12 sm:h-[60px] items-center justify-center gap-2 rounded-full bg-zinc-800 px-5 sm:px-8 shadow-xl transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-100 dark:shadow-white/5"
                  >
                    <MessageSquare className="h-5 w-5 text-white dark:text-zinc-900" />
                    <span className="font-semibold text-white dark:text-zinc-900 text-[15px] hidden sm:inline">Text</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Slide-Out Text Chat Panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {isChatOpen && status === "matched" && (
            <motion.div
              initial={{ opacity: 0, width: 0, scale: 0.95 }}
              animate={{ opacity: 1, width: 340, scale: 1 }}
              exit={{ opacity: 0, width: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="hidden md:flex flex-col h-full max-h-[60vh] rounded-[24px] bg-[#3a3b45] shadow-2xl overflow-hidden shrink-0"
              style={{ originX: 1 }}
            >
              <div className="flex items-center justify-between px-4 mt-4">
                <div className="flex items-center gap-3 bg-white/10 rounded-full pr-4 pl-1 py-1">
                  {partnerProfile ? (
                    <img src={partnerProfile.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-zinc-600" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-white text-xs">?</div>
                  )}
                  <span className="text-sm font-semibold text-white">{partnerProfile?.name || "Stranger"}</span>
                  <AnimatePresence>
                    {addFriendState !== "hidden" && (
                      <motion.button
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: addFriendState === "added" ? 24 : 20, marginLeft: 1 }}
                        exit={{ opacity: 0, width: 0, marginLeft: -8 }}
                        onClick={() => setAddFriendState("added")}
                        disabled={addFriendState === "added"}
                        className={`relative flex items-center justify-center rounded-full transition-all duration-300 border-2 overflow-hidden shrink-0 ${addFriendState === "added" ? "border-green-500 bg-green-500 h-6" : "border-white bg-transparent hover:scale-110 active:scale-95 h-[20px]"}`}
                      >
                        <AnimatePresence mode="wait">
                          {addFriendState === "idle" ? (
                            <motion.svg key="plus" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }} viewBox="0 0 24 24" stroke="white" strokeWidth="3" className="w-3 h-3 absolute"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></motion.svg>
                          ) : (
                            <motion.svg key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, type: "spring", bounce: 0.5 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-4 h-4 absolute"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="h-[2px] bg-white/10 mx-5 mt-4 rounded-full relative">
                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-white/40 rounded-full"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-sm text-white/40 px-4">
                    <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                    Say hi! 👋
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex w-full ${msg.from === "me"
                        ? "justify-end"
                        : msg.from === "partner"
                          ? "justify-start"
                          : "justify-center"
                        }`}
                    >
                      {msg.from === "system" ? (
                        <div className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-medium text-white/50">
                          {msg.text}
                        </div>
                      ) : (
                        <div
                          className={`max-w-[85%] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm flex items-center justify-center min-h-[44px] ${msg.from === "me"
                            ? "bg-accent text-white rounded-[20px] rounded-br-[4px]"
                            : "bg-[#559df4] text-white rounded-[20px] rounded-bl-[4px]"
                            }`}
                        >
                          {EMOJIS.find(e => e.emoji === msg.text.trim()) ? (
                            <div className="inline-block origin-center w-10 h-10">
                              <AnimatedEmoji emoji={msg.text.trim()} size={40} />
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isRemoteTyping && (
                  <div className="text-xs text-white/50 italic ml-2">
                    Partner is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-transparent pb-4 relative">
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute bottom-[70px] left-3 z-50 bg-[#2d2f36]/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-white/5"
                    >
                      <div className="grid grid-cols-5 gap-2">
                        {EMOJIS.map((item, i) => (
                          <motion.button
                            key={item.emoji}
                            type="button"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.02 } }}
                            onClick={() => setInput(prev => prev + item.emoji)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 hover:shadow-lg hover:scale-110 active:scale-95 transition-all outline-none p-1.5"
                          >
                            <AnimatedEmoji emoji={item} size={32} />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 bg-black/20 rounded-full px-4 py-2 relative shadow-inner ring-1 ring-white/5 focus-within:ring-[var(--theme-accent)]/50 focus-within:bg-black/30 transition-all">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`text-white/60 hover:text-white pb-[2px] transition-colors ${showEmojiPicker ? "scale-110" : "hover:scale-110 active:scale-95"}`}
                    style={showEmojiPicker ? { color: 'var(--theme-accent)' } : {}}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-0 text-[15px] font-medium text-white placeholder:text-white/40 focus:ring-0 px-2 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="text-white/70 disabled:opacity-30 transition-colors flex items-center justify-center p-1 hover:scale-110 active:scale-95 disabled:hover:scale-100"
                    style={{ color: input.trim() ? 'var(--theme-accent)' : undefined }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h7" />
                      <path d="M3 21l19-9L3 3l1.5 9L3 21z" />
                    </svg>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* ── Additional Modals/Banners ───────────────────────────────────────── */}
      {showNoOppositeGenderPrompt && user.plan === "PRO" && (
        <div className="absolute inset-x-0 top-20 z-50 mx-auto max-w-sm rounded-3xl border border-blue-200 bg-white/90 backdrop-blur-xl p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xl">
              👀
            </div>
          </div>
          <h3 className="font-semibold text-center text-zinc-900 dark:text-zinc-100 text-lg mb-1">
            No exact match right now
          </h3>
          <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mb-6">
            There are no matching users online currently. How would you like to proceed?
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleProFallback("anyone")}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Match with anyone
            </button>
            <button
              onClick={() => handleProFallback("wait")}
              className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Keep waiting
            </button>
          </div>
        </div>
      )}

      {videoError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-3 rounded-full border border-yellow-200/50 bg-yellow-50/90 backdrop-blur-md px-5 py-3 shadow-xl dark:border-yellow-900/40 dark:bg-zinc-900/90">
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
            ⚠️ {videoError}
          </span>
          <button
            onClick={() => setVideoError(null)}
            className="shrink-0 text-xs font-semibold text-yellow-600 hover:text-yellow-900 dark:text-yellow-500"
          >
            Dismiss
          </button>
        </div>
      )}

      {connectionLost && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-3 rounded-full border border-red-200/50 bg-red-50/90 backdrop-blur-md px-5 py-3 shadow-xl dark:border-red-900/40 dark:bg-zinc-900/90">
          <span className="text-sm font-medium text-red-800 dark:text-red-400">
            🔌 Connection lost. Please reload or start a new chat.
          </span>
          <button
            onClick={() => setConnectionLost(false)}
            className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-900 dark:text-red-500"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Report Modal Reference Placeholder (Kept in Render Tree) ── */}
      {isReportModalOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Report User</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                Please describe the issue. Submitting a report skips to a sub-sequent match.
              </p>
              <form onSubmit={submitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white/50 dark:bg-zinc-950/50 dark:border-zinc-800 p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 outline-none"
                    required
                  >
                    <option value="NUDITY">Nudity or Sexual Content</option>
                    <option value="HARASSMENT">Harassment or Bullying</option>
                    <option value="HATE">Hate Speech</option>
                    <option value="SPAM">Spam or Scams</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Details (Optional)</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 bg-white/50 dark:bg-zinc-950/50 dark:border-zinc-800 p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 outline-none resize-none"
                    placeholder="Provide any context..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmittingReport ? "Sending..." : "Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Preload Emojis (Hidden) ── */}
      <div className="hidden" aria-hidden="true">
        {EMOJIS.map(e => <AnimatedEmoji key={e.emoji} emoji={e} />)}
      </div>
    </div>
  );
}
