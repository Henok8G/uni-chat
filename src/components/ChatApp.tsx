"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSocket } from "@/lib/socketClient";
import type { Socket } from "socket.io-client";
import { useWebRTC } from "@/app/app/useWebRTC";
import { ArrowRight, Square, MessageSquare, Video, VideoOff, Mic, MicOff, User as UserIcon, Menu, Plus, Play, Smile, SendHorizontal, Settings as SettingsIcon, Check, X, Sparkles, AlertCircle, Loader2, Home, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AppMenu } from "@/components/AppMenu";
import { cn } from "@/lib/utils";
import { resolveUserAvatar } from "@/lib/avatars";
import { toggleThemeMode } from "@/lib/themeTransition";

// ── Profile Major Emoji & Year Helpers ─────────────────────────────────────────
function getMajorEmoji(major?: string | null): { src: string; alt: string } {
  if (!major) return { src: "/assets/emojis/technologist.png", alt: "🧑🏽‍💻" };
  const m = major.toLowerCase();
  if (m.includes("math") || m.includes("statistic") || m.includes("physics")) return { src: "/assets/emojis/man-student.png", alt: "🧑‍🏫" };
  if (m.includes("computer") || m.includes("software") || m.includes("information technology") || m.includes("cyber") || m.includes("computing")) return { src: "/assets/emojis/technologist.png", alt: "🧑🏽‍💻" };
  if (m.includes("engineering") || m.includes("architecture") || m.includes("construction") || m.includes("urban")) return { src: "/assets/emojis/graduation-cap.png", alt: "🎓" };
  if (m.includes("art") || m.includes("theater") || m.includes("film") || m.includes("music") || m.includes("painting")) return { src: "/assets/emojis/artist-palette.png", alt: "🎨" };
  if (m.includes("medicine") || m.includes("pharmacy") || m.includes("nursing") || m.includes("dental") || m.includes("medical") || m.includes("midwife") || m.includes("anesthesia") || m.includes("radiolog")) return { src: "/assets/emojis/woman-student.png", alt: "👩‍⚕️" };
  if (m.includes("journalism") || m.includes("communication") || m.includes("public relations") || m.includes("broadcast")) return { src: "/assets/emojis/megaphone.png", alt: "📣" };
  if (m.includes("political") || m.includes("international") || m.includes("geography") || m.includes("development")) return { src: "/assets/emojis/globe.png", alt: "🌍" };
  if (m.includes("language") || m.includes("literature") || m.includes("english") || m.includes("amharic") || m.includes("arabic") || m.includes("chinese") || m.includes("oromo") || m.includes("history")) return { src: "/assets/emojis/graduation-cap.png", alt: "🎓" };
  if (m.includes("business") || m.includes("accounting") || m.includes("management") || m.includes("economics") || m.includes("marketing") || m.includes("logistics") || m.includes("supply chain") || m.includes("public admin")) return { src: "/assets/emojis/id-card.png", alt: "💼" };
  if (m.includes("social") || m.includes("psychology") || m.includes("sociology") || m.includes("education") || m.includes("civics") || m.includes("sport") || m.includes("physical education") || m.includes("exercise")) return { src: "/assets/emojis/man-student.png", alt: "🧑‍🎓" };
  return { src: "/assets/emojis/technologist.png", alt: "🧑🏽‍💻" };
}

function yearLabel(y?: number | null) {
  if (!y) return "3rd Year";
  const map: Record<number, string> = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year", 5: "5th Year", 6: "6th Year" };
  return map[y] ?? `${y}th Year`;
}


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
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain" 
      />
    </picture>
  );
}


// ── Particle burst spawner ────────────────────────────────────────────────────
type Particle = { id: string; emoji: string; x: number; angle: number; dist: number; rot: number };

function ReactionOverlay({ reaction }: { reaction: { emoji: string; key: string } | null }) {
  const [bursts, setBursts] = useState<Particle[][]>([]);
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!reaction) return;
    if (prefersReducedMotion) {
      const particles: Particle[] = [{
        id: `${reaction.key}-0`,
        emoji: reaction.emoji,
        x: 50,
        angle: 0,
        dist: 0,
        rot: 0,
      }];
      setBursts((prev) => [...prev, particles]);
      const timer = setTimeout(() => setBursts((prev) => prev.slice(1)), 1800);
      return () => clearTimeout(timer);
    }

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
    const timer = setTimeout(() => setBursts((prev) => prev.slice(1)), 2200);
    return () => clearTimeout(timer);
  }, [reaction, prefersReducedMotion]);

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">
        {reaction ? `Reaction: ${reaction.emoji}` : null}
      </div>
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
                  x: prefersReducedMotion ? 0 : dx,
                  y: prefersReducedMotion ? 0 : -dy,
                  scale: prefersReducedMotion ? [0.8, 1.2, 1, 0.8] : [0.2, 1.4, 1, 0.6],
                  rotate: prefersReducedMotion ? 0 : p.rot,
                }}
                transition={{ duration: prefersReducedMotion ? 1.2 : 1.8, ease: "easeOut" }}
              >
                <AnimatedEmoji emoji={p.emoji} className="w-10 h-10" size={40} />
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </>
  );
}

type UserProps = {
  userId: string;
  plan: string;
  gender: string;
  displayName?: string;
  email?: string;
  bio?: string;
  department?: string;
  year?: number;
  hobbies?: string[];
  avatarUrl?: string;
  emailVerified?: boolean;
  role?: string;
};

export type PartnerProfile = {
  userId: string;
  name: string;
  avatar: string;
  bio?: string | null;
  university?: string | null;
  department?: string | null;
  year?: number | null;
  hobbies?: string[];
  gender?: string;
  verified?: boolean;
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

export interface InitialMatchPreferences {
  prefGender?: string;
  prefDept?: string;
  prefYear?: string;
  prefHobbies?: string[];
  autoStart?: boolean;
}

export default function ChatApp({
  user,
  initialFriendIds = [],
  initialPreferences,
}: {
  user: UserProps;
  initialFriendIds?: string[];
  initialPreferences?: InitialMatchPreferences;
}) {
  // ── Text chat state ──────────────────────────────────────────────────────
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "preferences" | "searching" | "matched">("idle");
  const [prefHobby, setPrefHobby] = useState(() => initialPreferences?.prefHobbies?.[0] || "any");
  const [prefYear, setPrefYear] = useState(() => initialPreferences?.prefYear || "any");
  const [prefCampus, setPrefCampus] = useState(() => initialPreferences?.prefDept || "any");
  const [isDark, setIsDark] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [friendIds, setFriendIds] = useState<Set<string>>(() => new Set(initialFriendIds));
  const [partnerFriendship, setPartnerFriendship] = useState<{
    isFriend: boolean;
    pendingSent?: boolean;
    pendingReceived?: boolean;
    requestId?: string;
    loading?: boolean;
  }>({ isFriend: false });
  const [addFriendState, setAddFriendState] = useState<"idle" | "added" | "hidden">("idle");
  const [genderFilter, setGenderFilter] = useState<"any" | "female" | "male">(() =>
    initialPreferences?.prefGender === "female" ? "female" : initialPreferences?.prefGender === "male" ? "male" : "any"
  );
  const [genderDir, setGenderDir] = useState<1 | -1>(1);
  const [showNoOppositeGenderPrompt, setShowNoOppositeGenderPrompt] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cancelAnimPhase, setCancelAnimPhase] = useState<"text" | "square">("text");
  const [unreadCount, setUnreadCount] = useState(0);

  // Reset unread count when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Reset unread count when match changes or ends
  useEffect(() => {
    if (status !== "matched") {
      setUnreadCount(0);
    }
  }, [status]);

  // Cancel button: show "Cancel" text, then animate to red square after 1.5s
  useEffect(() => {
    if (status === "searching") {
      setCancelAnimPhase("text");
      const timer = setTimeout(() => setCancelAnimPhase("square"), 1500);
      return () => clearTimeout(timer);
    } else {
      setCancelAnimPhase("text");
    }
  }, [status]);

  // Close mobile menu when tapping outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = () => setMobileMenuOpen(false);
    const timer = setTimeout(() => document.addEventListener("click", handleClick), 50);
    return () => { clearTimeout(timer); document.removeEventListener("click", handleClick); };
  }, [mobileMenuOpen]);

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

  // ── Keyboard Accessibility: Escape key handling ────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
          return;
        }
        if (isReportModalOpen) {
          setIsReportModalOpen(false);
          return;
        }
        if (showPartnerModal) {
          setShowPartnerModal(false);
          return;
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          return;
        }
        if (isChatOpen) {
          setIsChatOpen(false);
          return;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEmojiPicker, isReportModalOpen, showPartnerModal, mobileMenuOpen, isChatOpen]);

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
    remotePeerProfile,
  } = useWebRTC();

  // ── Local User Real Profile ──────────────────────────────────────────────
  const myRealProfile: PartnerProfile = {
    userId: user.userId,
    name: user.displayName || user.email?.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Student",
    avatar:
      user.avatarUrl ||
      resolveUserAvatar({
        id: user.userId,
        email: user.email,
        displayName: user.displayName,
        gender: user.gender,
        emailVerified: user.emailVerified ?? true,
        role: user.role || "STUDENT",
      }),
    bio: user.bio || null,
    university: "Addis Ababa University",
    department: user.department || "Student",
    year: user.year || null,
    hobbies: user.hobbies || [],
    gender: user.gender,
    verified: true,
  };

  const isPartnerFriend = Boolean(
    partnerProfile?.userId && (friendIds.has(partnerProfile.userId) || partnerFriendship.isFriend)
  );

  // Sync friend and request status with server whenever partner changes
  useEffect(() => {
    if (!partnerProfile?.userId) {
      setPartnerFriendship({ isFriend: false });
      return;
    }
    if (friendIds.has(partnerProfile.userId)) {
      setPartnerFriendship({ isFriend: true });
      return;
    }

    let isMounted = true;
    fetch(`/api/chat/friend?check=${encodeURIComponent(partnerProfile.userId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setPartnerFriendship({
          isFriend: Boolean(data?.isFriend),
          pendingSent: Boolean(data?.pendingSent),
          pendingReceived: Boolean(data?.pendingReceived),
          requestId: data?.requestId,
        });
        if (data?.isFriend) {
          setFriendIds((prev) => new Set(prev).add(partnerProfile.userId));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [partnerProfile?.userId, friendIds]);

  const handleSendFriendRequest = async () => {
    if (!partnerProfile?.userId || isPartnerFriend || partnerFriendship.loading) return;
    setPartnerFriendship((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/chat/friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", friendId: partnerProfile.userId }),
      });
      const data = await res.json();
      if (data?.isFriend) {
        setPartnerFriendship({ isFriend: true, loading: false });
        setFriendIds((prev) => new Set(prev).add(partnerProfile.userId));
      } else if (data?.success) {
        setPartnerFriendship({ isFriend: false, pendingSent: true, loading: false });
      } else {
        setPartnerFriendship((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Failed to send friend request:", err);
      setPartnerFriendship((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!partnerProfile?.userId || !partnerFriendship.requestId || partnerFriendship.loading) return;
    setPartnerFriendship((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/chat/friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", requestId: partnerFriendship.requestId }),
      });
      const data = await res.json();
      if (data?.success) {
        setPartnerFriendship({ isFriend: true, loading: false });
        setFriendIds((prev) => new Set(prev).add(partnerProfile.userId));
      } else {
        setPartnerFriendship((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      setPartnerFriendship((prev) => ({ ...prev, loading: false }));
    }
  };

  // Sync profile received from partner via direct WebRTC DataChannel
  useEffect(() => {
    if (remotePeerProfile) {
      setPartnerProfile(remotePeerProfile);
    }
  }, [remotePeerProfile]);

  // Send our real profile immediately when DataChannel opens
  useEffect(() => {
    if (dataChannelState === "open") {
      sendCollabMessage({
        type: "profile",
        profile: myRealProfile,
      });
    }
  }, [dataChannelState]);

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
      partner,
    }: {
      roomId: string;
      chatSessionId: string;
      isInitiator: boolean;
      partner?: PartnerProfile;
    }) => {
      setStatus("matched");
      setRoomId(roomId);
      setChatSessionId(chatSessionId);
      setShowPartnerModal(false);
      if (partner) {
        setPartnerProfile(partner);
      }
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
      console.log(`[ChatApp] Match established for room ${roomId}. Role: ${isInitiator ? "initiator" : "receiver"}`);
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
      setUnreadCount((prev) => (isChatOpen ? 0 : prev + 1));
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
      setShowPartnerModal(false);
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
      setShowPartnerModal(false);
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
  // Monetization hold: free access for all students, direct random match
  const ENABLE_PREMIUM_MATCH = false;

  const handleStartChat = () => {
    startSearching();
  };

  const startSearching = () => {
    const s = socketRef.current || getSocket();
    if (!s) return;
    socketRef.current = s;
    setConnectionLost(false);
    setStatus("searching");
    setMessages([]);

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[ChatApp:Queue] Emitting join_queue with attemptId: ${attemptId} for user: ${user.userId}`);
    s.emit("join_queue", {
      attemptId,
      userId: user.userId,
      plan: user.plan,
      gender: user.gender,
      prefHobby: prefHobby || "any",
      prefYear: prefYear || "any",
      prefCampus: prefCampus || "any",
      prefGender: genderFilter || "any",
      profile: myRealProfile,
    });
  };

  const autoStartDone = useRef(false);
  useEffect(() => {
    if (initialPreferences?.autoStart && !autoStartDone.current) {
      autoStartDone.current = true;
      const timer = setTimeout(() => {
        startSearching();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialPreferences?.autoStart]);

  const handleNext = () => {
    const s = socketRef.current || getSocket();
    if (!s) return;
    cleanupWebRTC();
    setStatus("searching");
    setRoomId(null);
    setChatSessionId(null);
    setPartnerProfile(null);
    setShowPartnerModal(false);
    setAddFriendState("idle");
    setMessages([]);
    s.emit("next");
  };

  const handleEndChat = () => {
    const s = socketRef.current || getSocket();
    if (!s) return;
    cleanupWebRTC();
    s.emit("leave_queue");
    setStatus("idle");
    setRoomId(null);
    setChatSessionId(null);
    setShowPartnerModal(false);
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

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
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

  const toggleTheme = (e?: React.MouseEvent) => {
    const next = !isDark;
    toggleThemeMode(next, e, () => {
      setIsDark(next);
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden relative font-sf-pro">

      {/* ── Top Header (Spans full width so logo is pinned top-left) ─────────── */}
      <AppMenu isActiveChat={status === "searching" || status === "matched"} />

      {/* ── Content Area (Videos + Chat) ────────────────────────────────────── */}
      <div className="flex-1 flex w-full max-w-[1620px] mx-auto relative z-10 transition-all px-4 sm:px-6 lg:px-8 pt-1 sm:pt-2 pb-3 gap-4 lg:gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-0">
          {!hasVideo && status === "idle" && (
            <div className="text-center flex flex-col items-center animate-in fade-in duration-500">
              <div className="h-24 w-24 rounded-full bg-white shadow-xl dark:bg-zinc-800 flex items-center justify-center mb-6">
                <Video className="w-10 h-10" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Ready to meet someone new?</h2>
              <p className="text-zinc-700 dark:text-zinc-100 font-medium mb-8 max-w-sm">
                Join the queue to instantly connect with university students worldwide.
              </p>
              <button
                onClick={handleStartChat}
                className="rounded-xl bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 border-[2.5px] border-zinc-900 dark:border-white cursor-pointer"
              >
                Start Chat
              </button>
            </div>
          )}

          {/* Held for future monetization: Premium Match modal */}
          {ENABLE_PREMIUM_MATCH && !hasVideo && status === "preferences" && (
            <div className="text-center flex flex-col items-center animate-in zoom-in-95 duration-500 bg-white/50 dark:bg-zinc-900/50 p-8 rounded-3xl shadow-xl backdrop-blur-md border border-white/20 dark:border-white/10 w-full max-w-md">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <span className="text-2xl">✨</span> Premium Match
              </h2>
              
              <div className="flex flex-col gap-4 w-full mb-8">
                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Gender</label>
                  <select 
                    value={genderFilter} 
                    onChange={e => setGenderFilter(e.target.value as any)}
                    className="w-full bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-[15px] font-medium outline-none border border-zinc-200 dark:border-zinc-700 shadow-sm focus:border-[#8E97F8]"
                  >
                    <option value="any">Any Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Year</label>
                  <select 
                    value={prefYear} 
                    onChange={e => setPrefYear(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-[15px] font-medium outline-none border border-zinc-200 dark:border-zinc-700 shadow-sm focus:border-[#8E97F8]"
                  >
                    <option value="any">Any Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                    <option value="6">6th Year</option>
                  </select>
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Campus / University</label>
                  <select 
                    value={prefCampus} 
                    onChange={e => setPrefCampus(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-[15px] font-medium outline-none border border-zinc-200 dark:border-zinc-700 shadow-sm focus:border-[#8E97F8]"
                  >
                    <option value="any">Any AAU Campus</option>
                    <option value="4 Kilo">4 Kilo (Natural Sciences)</option>
                    <option value="5 Kilo">5 Kilo (AAiT Engineering)</option>
                    <option value="6 Kilo">6 Kilo (Main Campus)</option>
                    <option value="Tikur Anbessa">Tikur Anbessa (Health Sciences)</option>
                    <option value="FBE">FBE (Business & Economics)</option>
                    <option value="EiABC">EiABC (Architecture)</option>
                    <option value="Commerce">College of Commerce</option>
                  </select>
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Hobby (Optional)</label>
                  <input 
                    type="text"
                    value={prefHobby}
                    onChange={e => setPrefHobby(e.target.value)}
                    placeholder="e.g. Football, Reading..."
                    className="w-full bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-[15px] font-medium outline-none border border-zinc-200 dark:border-zinc-700 shadow-sm focus:border-[#8E97F8]"
                  />
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setStatus("idle")}
                  className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3.5 text-[15px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startSearching}
                  className="flex-1 rounded-xl px-4 py-3.5 text-[15px] font-bold text-white shadow-md hover:-translate-y-0.5 transition-transform"
                  style={{ background: "linear-gradient(135deg, #8E97F8 0%, #6b7ff0 50%, #5b8dee 100%)" }}
                >
                  Begin Search
                </button>
              </div>
            </div>
          )}

          {/* ── Desktop Layout ────────────────────────────────────────────── */}
          {(status === "searching" || status === "matched" || hasVideo) && (
            <div className="hidden md:flex flex-col flex-1 relative animate-in zoom-in-95 duration-500 w-full h-full min-h-[480px]">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full flex-1 h-[68vh] lg:h-[74vh] max-h-[820px] min-h-[460px]">
                {/* Left (Local Video) */}
                <div className="relative h-full w-full rounded-[32px] overflow-hidden bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black/95 dark:from-[#14141e] dark:via-[#0e0e16] dark:to-[#08080c] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] dark:shadow-[0_25px_70px_-20px_rgba(0,0,0,0.7)] border border-black/10 dark:border-white/12 ring-1 ring-black/5 dark:ring-white/5">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover scale-x-[-1] rounded-[30px] transition-opacity duration-300 ${localStream ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  />

                  {/* Local Stream User Capsule */}
                  <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-black/50 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 rounded-full text-white text-xs font-semibold shadow-md font-sf-pro">
                    <span>You {user?.displayName ? `(${user.displayName})` : ""}</span>
                  </div>

                  {/* Embedded Reactions Toolbar */}
                  {dataChannelState === "open" && (
                    <div className="absolute bottom-4 left-4 z-40 flex items-center gap-1.5 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
                      {EMOJIS.slice(0, 4).map(({ emoji }) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            sendCollabMessage({ type: "reaction", emoji });
                            socketRef.current?.emit("analytics_event", { type: "REACTION_SENT", properties: { emoji } });
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 text-lg transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {!localStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                        <VideoOff className="w-8 h-8 text-zinc-400" />
                      </div>
                      <p className="text-xs font-medium text-zinc-400 font-sf-pro">
                        {isVideoEnabled ? "Starting camera preview..." : "Camera is turned off"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right (Remote Video) */}
                <div className="relative h-full w-full rounded-[32px] overflow-hidden bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black/95 dark:from-[#14141e] dark:via-[#0e0e16] dark:to-[#08080c] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] dark:shadow-[0_25px_70px_-20px_rgba(0,0,0,0.7)] border border-black/10 dark:border-white/12 ring-1 ring-black/5 dark:ring-white/5">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`h-full w-full object-cover rounded-[30px] transition-opacity duration-300 ${remoteStream ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  />

                  {/* Partner Profile Badge on Remote Video */}
                  {status === "matched" && partnerProfile && (
                    <button
                      onClick={() => setShowPartnerModal(true)}
                      className="absolute top-4 left-4 z-40 flex items-center gap-2.5 bg-black/55 dark:bg-zinc-900/75 backdrop-blur-xl border border-white/20 text-white pl-1.5 pr-4 py-1.5 rounded-full shadow-lg hover:bg-black/70 dark:hover:bg-zinc-900/90 transition-colors cursor-pointer group"
                      title="View Student Profile"
                    >
                      <div className="relative">
                        <img
                          src={partnerProfile.avatar || resolveUserAvatar({ id: partnerProfile.userId, gender: partnerProfile.gender, emailVerified: true, role: "STUDENT", displayName: partnerProfile.name })}
                          alt={partnerProfile.name}
                          className="w-7 h-7 rounded-full object-cover bg-zinc-700 ring-1 ring-white/30"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3b82f6] rounded-full border border-black flex items-center justify-center">
                          <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold leading-tight flex items-center gap-1.5 group-hover:text-blue-300 transition-colors font-sf-pro">
                          {partnerProfile.name}
                          {isPartnerFriend && (
                            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full leading-none">
                              Friends
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-300 leading-tight font-sf-pro">
                          {partnerProfile.department || partnerProfile.university || "View Profile"}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Live Status Badge */}
                  {status === "matched" && remoteStream && (
                    <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-black/50 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/15 text-white px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase shadow-sm font-sf-pro">
                      <span>Live</span>
                    </div>
                  )}

                  {!remoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 backdrop-blur-sm">
                      {status === "searching" ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-white tracking-tight font-sf-pro">
                              Searching for students...
                            </p>
                            <p className="text-xs text-zinc-400 font-sf-pro">
                              Matching across verified university campuses
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2.5 text-zinc-300 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/15 shadow-sm font-sf-pro text-xs font-semibold">
                          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                          <span>Connecting peer stream...</span>
                        </div>
                      )}
                    </div>
                  )}
                  <ReactionOverlay reaction={lastReaction} />
                </div>
              </div>

              {/* Action Buttons for Desktop */}
              <div className="flex w-full items-center justify-center pt-4 pb-2 z-40 gap-3 sm:gap-4 relative">
                {status === "matched" && (
                  <button
                    onClick={handleNext}
                    aria-label="Find next match"
                    className="h-12 sm:h-14 px-7 sm:px-9 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-sm sm:text-[15px] shadow-[0_8px_25px_-4px_rgba(79,70,229,0.4)] border border-indigo-300/40 flex items-center gap-2.5 cursor-pointer font-sf-pro transition-colors select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Next Match</span>
                    <span className="sm:hidden">Next</span>
                  </button>
                )}

                {(status === "searching" || status === "matched") && (
                  <button
                    onClick={handleEndChat}
                    aria-label={status === "searching" ? "Cancel searching for match" : "End chat session"}
                    className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-rose-500/15 hover:bg-rose-600 dark:bg-rose-500/20 dark:hover:bg-rose-600 border border-rose-500/35 hover:border-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white font-bold text-sm sm:text-[15px] shadow-[0_8px_25px_-6px_rgba(244,63,94,0.3)] backdrop-blur-xl flex items-center gap-2.5 cursor-pointer font-sf-pro transition-colors select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    <span className="hidden sm:inline">{status === "searching" ? "Cancel Search" : "End Chat"}</span>
                    <span className="sm:hidden">{status === "searching" ? "Cancel" : "End"}</span>
                  </button>
                )}

                {/* Media Control Buttons for Desktop: Camera & Mic */}
                {(status === "matched" || status === "searching") && (
                  <>
                    <button
                      onClick={toggleCamera}
                      aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                      aria-pressed={isVideoEnabled}
                      className={`h-12 sm:h-14 w-12 sm:w-14 rounded-full flex items-center justify-center shadow-md backdrop-blur-xl transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isVideoEnabled
                          ? "bg-white/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-700"
                          : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                      }`}
                      title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                    >
                      {isVideoEnabled ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    <button
                      onClick={toggleMic}
                      aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                      aria-pressed={isAudioEnabled}
                      className={`h-12 sm:h-14 w-12 sm:w-14 rounded-full flex items-center justify-center shadow-md backdrop-blur-xl transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isAudioEnabled
                          ? "bg-white/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-700"
                          : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                      }`}
                      title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                    >
                      {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                  </>
                )}

                {status === "matched" && (
                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    aria-label={isChatOpen ? "Close text chat" : "Open text chat"}
                    aria-expanded={isChatOpen}
                    className={`h-12 sm:h-14 px-6 sm:px-8 rounded-full text-white shadow-lg text-sm sm:text-[15px] font-bold flex items-center gap-2 cursor-pointer font-sf-pro transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      isChatOpen
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 ring-2 ring-blue-400/50 shadow-indigo-500/30"
                        : "bg-zinc-900/90 dark:bg-zinc-800/90 hover:bg-zinc-800 dark:hover:bg-zinc-700 border border-white/10 shadow-md"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Chat</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Mobile Layout (Portrait-First Live Video UX) ───────────────────── */}
          {(status === "searching" || status === "matched" || hasVideo) && (
            <div className="flex md:hidden font-sf-pro flex-col w-full h-[calc(100dvh-5.5rem)] max-h-[850px] mx-auto animate-in zoom-in-95 duration-500 relative select-none">
              
              {/* ── STATE 1: SEARCHING ON MOBILE ── */}
              {status === "searching" && (
                <div className="relative w-full flex-1 rounded-[28px] overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-white/10 shadow-2xl flex flex-col items-center justify-between p-5">
                  {/* Full Local Preview Camera */}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    id="mobile-local-video"
                    className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${localStream ? "opacity-60" : "opacity-0 pointer-events-none"}`}
                  />

                  {/* Top Header: Navigation Menu + You badge */}
                  <div className="relative z-30 w-full flex items-center justify-between">
                    <div className="relative">
                      <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Navigation menu"
                        className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/10 text-white cursor-pointer"
                      >
                        <Menu className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {mobileMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: -8 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute top-12 left-0 bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden min-w-[170px] z-50"
                          >
                            {[
                              { icon: Home, label: "Home", href: "/home" },
                              { icon: Sparkles, label: "Match", href: "/match" },
                              { icon: MessageSquare, label: "Chat", href: "/app/chat" },
                              { icon: UserIcon, label: "Profile", href: "/profile" },
                              { icon: SettingsIcon, label: "Settings", href: "/settings" },
                            ].map((item) => (
                              <button
                                key={item.href}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  handleEndChat();
                                  router.push(item.href);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <item.icon className="w-4 h-4 text-zinc-300" />
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>You {user?.displayName ? `(${user.displayName})` : ""}</span>
                    </div>
                  </div>

                  {/* Center: Sonar Pulse Animation & Search Status */}
                  <div className="relative z-20 flex flex-col items-center justify-center gap-5 my-auto text-center px-4">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                      <div className="absolute inset-2 rounded-full border-2 border-indigo-400/40 animate-[spin_3s_linear_infinite]" />
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                      <div className="w-14 h-14 bg-indigo-600/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-indigo-400/30">
                        <Sparkles className="w-7 h-7 text-indigo-300 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-1.5 max-w-xs">
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        Searching for university students...
                      </h3>
                      <p className="text-xs text-zinc-300/90 leading-relaxed font-medium">
                        Matching across verified campus communities by academic department & interests
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Cancel Search Button */}
                  <div className="relative z-30 w-full flex justify-center pb-2">
                    <button
                      onClick={handleEndChat}
                      aria-label="Cancel search"
                      className="h-12 px-8 rounded-full bg-rose-500/25 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 font-bold text-sm shadow-xl backdrop-blur-xl flex items-center gap-2.5 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Cancel Search</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STATE 2: MATCHED ACTIVE CALL (PORTRAIT-FIRST VIDEO + PIP + CONTROLS) ── */}
              {status === "matched" && (
                <div className="relative w-full flex-1 rounded-[28px] sm:rounded-[32px] overflow-hidden bg-zinc-950 border border-black/10 dark:border-white/10 shadow-2xl flex flex-col justify-between">
                  {/* Full-Bleed Remote Video (Primary Visual Focus) */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    id="mobile-remote-video"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${remoteStream ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  />

                  {/* Remote Video Loading / Connecting Fallback */}
                  {!remoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/85 backdrop-blur-md text-white z-10">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <span className="text-sm font-semibold tracking-wide">Connecting peer stream...</span>
                    </div>
                  )}

                  {/* Top Floating Bar: Navigation + Partner Profile Pill (Left) + Top-Right Local PIP Preview */}
                  <div className="relative z-30 p-3.5 flex items-start justify-between w-full pointer-events-none">
                    <div className="flex items-center gap-2 pointer-events-auto">
                      {/* Top-Left Hamburger Menu (Call Guarded) */}
                      <div className="relative">
                        <button
                          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                          aria-label="Navigation menu"
                          className="w-9 h-9 rounded-full bg-black/60 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-lg cursor-pointer"
                        >
                          <Menu className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {mobileMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.85, y: -8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.85, y: -8 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className="absolute top-11 left-0 bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden min-w-[170px] z-50"
                            >
                              {[
                                { icon: Home, label: "Home", href: "/home" },
                                { icon: Sparkles, label: "Match", href: "/match" },
                                { icon: MessageSquare, label: "Chat", href: "/app/chat" },
                                { icon: UserIcon, label: "Profile", href: "/profile" },
                                { icon: SettingsIcon, label: "Settings", href: "/settings" },
                              ].map((item) => (
                                <button
                                  key={item.href}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    if (status === "matched") {
                                      const confirmed = window.confirm("Leave video chat? Your active call will end.");
                                      if (!confirmed) return;
                                      handleEndChat();
                                    } else if (status === "searching") {
                                      handleEndChat();
                                    }
                                    router.push(item.href);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                  <item.icon className="w-4 h-4 text-zinc-300" />
                                  <span>{item.label}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Partner Profile Badge (Clickable) */}
                      {partnerProfile && (
                        <button
                          onClick={() => setShowPartnerModal(true)}
                          className="flex items-center gap-2 bg-black/60 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 text-white pl-1.5 pr-3.5 py-1.5 rounded-full shadow-lg hover:bg-black/75 transition-colors group cursor-pointer"
                        >
                        <img
                          src={partnerProfile.avatar || resolveUserAvatar({ id: partnerProfile.userId, gender: partnerProfile.gender, emailVerified: true, role: "STUDENT", displayName: partnerProfile.name })}
                          alt={partnerProfile.name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-white/30"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold leading-tight flex items-center gap-1 group-hover:text-blue-300">
                            {partnerProfile.name}
                            {isPartnerFriend && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded-full font-medium">
                                Friends
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-300 leading-tight">
                            {partnerProfile.department || partnerProfile.university || "Verified Student"}
                          </span>
                        </div>
                      </button>
                    )}
                    </div>

                    {/* Picture-in-Picture (PIP) Local Video Preview (Top-Right) */}
                    <div
                      id="mobile-pip-preview"
                      className="pointer-events-auto w-24 h-36 sm:w-28 sm:h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/25 bg-zinc-900/90 backdrop-blur-md relative z-30 flex flex-col items-center justify-center transition-transform active:scale-95"
                    >
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${localStream && isVideoEnabled ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                      />
                      {(!localStream || !isVideoEnabled) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-1.5 text-zinc-400">
                          <VideoOff className="w-5 h-5" />
                          <span className="text-[10px] font-medium">Camera Off</span>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full py-0.5">
                        <span className="text-[10px] font-semibold text-white/90">You</span>
                      </div>
                    </div>
                  </div>

                  {/* Reaction Particle Overlay */}
                  <ReactionOverlay reaction={lastReaction} />

                  {/* Live Indicator (Bottom Left of Video) */}
                  {remoteStream && (
                    <div className="absolute bottom-20 left-4 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/15 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live</span>
                    </div>
                  )}

                  {/* One-Handed Mobile Call Controls Dock */}
                  <div
                    id="mobile-call-controls"
                    className="relative z-40 w-full px-4 pt-2 pb-3 flex items-center justify-between gap-2.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
                    style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
                  >
                    {/* Mute Mic */}
                    <button
                      onClick={toggleMic}
                      aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                      aria-pressed={isAudioEnabled}
                      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl shadow-lg border transition-all active:scale-95 cursor-pointer ${
                        isAudioEnabled
                          ? "bg-white/85 text-zinc-900 border-white/30 hover:bg-white"
                          : "bg-rose-500/80 text-white border-rose-400"
                      }`}
                    >
                      {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>

                    {/* Toggle Camera */}
                    <button
                      onClick={toggleCamera}
                      aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                      aria-pressed={isVideoEnabled}
                      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl shadow-lg border transition-all active:scale-95 cursor-pointer ${
                        isVideoEnabled
                          ? "bg-white/85 text-zinc-900 border-white/30 hover:bg-white"
                          : "bg-rose-500/80 text-white border-rose-400"
                      }`}
                    >
                      {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>

                    {/* Toggle In-Call Chat (with Unread Badge) */}
                    <button
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      aria-label="Toggle in-call chat"
                      aria-expanded={isChatOpen}
                      aria-controls="mobile-chat-sheet"
                      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl shadow-lg border relative transition-all active:scale-95 cursor-pointer ${
                        isChatOpen
                          ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50"
                          : "bg-zinc-800/80 text-white border-white/15 hover:bg-zinc-700/80"
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                      {unreadCount > 0 && !isChatOpen && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-md animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Next Match */}
                    <button
                      onClick={handleNext}
                      aria-label="Next match"
                      className="flex-1 h-12 px-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl border border-indigo-300/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Next</span>
                    </button>

                    {/* End Call */}
                    <button
                      onClick={handleEndChat}
                      aria-label="End call"
                      className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Mobile In-Call Chat Bottom Sheet ──────────────────────────────── */}
              <AnimatePresence>
                {isChatOpen && status === "matched" && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      key="mobile-chat-backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsChatOpen(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                    />
                    {/* Bottom Sheet */}
                    <motion.div
                      key="mobile-chat-sheet"
                      id="mobile-chat-sheet"
                      role="dialog"
                      aria-modal="true"
                      aria-label="In-call chat"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 28, stiffness: 300 }}
                      className="fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col h-[75vh] max-h-[640px] rounded-t-[28px] bg-white/95 dark:bg-[#151520]/95 backdrop-blur-2xl border-t border-black/10 dark:border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] overflow-hidden font-sf-pro"
                    >
                      {/* Pull Grabber Handle */}
                      <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-2.5 shrink-0" />

                      {/* Sheet Header */}
                      <div className="flex items-center justify-between px-5 pb-3 border-b border-zinc-200/70 dark:border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                          <img
                            src={partnerProfile?.avatar || resolveUserAvatar({ id: partnerProfile?.userId, gender: partnerProfile?.gender, emailVerified: true, role: "STUDENT", displayName: partnerProfile?.name })}
                            alt="Partner"
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/30"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                              {partnerProfile?.name || "Student Partner"}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {partnerProfile?.department || "Verified Campus Peer"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsChatOpen(false)}
                          aria-label="Close in-call chat"
                          className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sheet Messages List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-400 px-4 space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                              <MessageSquare className="w-6 h-6 opacity-30" />
                            </div>
                            <p className="font-semibold text-zinc-700 dark:text-zinc-300">Connected with {partnerProfile?.name || "student"}!</p>
                            <p className="text-[11px] text-zinc-400">Send a message to start chatting 👋</p>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex w-full",
                                msg.from === "me" ? "justify-end" : msg.from === "partner" ? "justify-start" : "justify-center"
                              )}
                            >
                              {msg.from === "system" ? (
                                <div className="rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                  {msg.text}
                                </div>
                              ) : (
                                <div
                                  className={cn(
                                    "max-w-[85%] px-4 py-2.5 text-[14.5px] leading-relaxed rounded-2xl font-medium shadow-xs",
                                    msg.from === "me"
                                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs"
                                      : "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 rounded-bl-xs border border-black/5 dark:border-white/5"
                                  )}
                                >
                                  {EMOJIS.find((e) => e.emoji === msg.text.trim()) ? (
                                    <div className="inline-block origin-center w-9 h-9">
                                      <AnimatedEmoji emoji={msg.text.trim()} size={36} />
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
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 italic ml-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>Partner is typing...</span>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Sheet Composer */}
                      <form
                        onSubmit={handleSendMessage}
                        className="p-3 bg-white/90 dark:bg-zinc-900/90 border-t border-zinc-200/70 dark:border-white/10 shrink-0"
                        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
                      >
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-1.5 border border-black/5 dark:border-white/10">
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message..."
                            className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 text-base sm:text-sm placeholder:text-zinc-400 font-medium py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            aria-label="Insert emoji"
                            className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 p-1.5 cursor-pointer"
                          >
                            <Smile className="w-5 h-5" />
                          </button>
                          <button
                            type="submit"
                            disabled={!input.trim()}
                            aria-label="Send message"
                            className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                          >
                            <SendHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>

        {/* ── Slide-Out Text Chat Panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {isChatOpen && status === "matched" && (
            <motion.div
              initial={{ opacity: 0, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="hidden md:flex flex-col md:w-[360px] lg:w-[390px] shrink-0 h-[68vh] lg:h-[74vh] max-h-[820px] rounded-[32px] bg-white/85 dark:bg-[#151520]/90 backdrop-blur-2xl border border-black/8 dark:border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden relative z-auto font-sf-pro"
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-zinc-200/60 dark:border-white/8">
                <button
                  onClick={() => partnerProfile && setShowPartnerModal(true)}
                  className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded-full pr-3.5 pl-1.5 py-1 cursor-pointer group"
                  title="View Student Profile"
                >
                  <div className="relative">
                    <img
                      src={partnerProfile?.avatar || resolveUserAvatar({ id: partnerProfile?.userId, gender: partnerProfile?.gender, emailVerified: true, role: "STUDENT", displayName: partnerProfile?.name })}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full bg-zinc-600 object-cover ring-1 ring-white/30"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors font-sf-pro">
                      {partnerProfile?.name || "Partner"}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sf-pro">
                      Verified Student
                    </span>
                  </div>
                  {isPartnerFriend ? (
                    <span
                      className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 select-none cursor-default"
                      title="You are already friends in personal chat"
                    >
                      Friends
                    </span>
                  ) : partnerFriendship.pendingReceived ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptFriendRequest();
                      }}
                      className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                      title="Accept friend request"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Accept</span>
                    </button>
                  ) : partnerFriendship.pendingSent ? (
                    <span
                      className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 select-none cursor-default"
                      title="Friend request sent"
                    >
                      Sent
                    </span>
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendFriendRequest();
                      }}
                      className="relative flex items-center justify-center rounded-full transition-colors border-2 overflow-hidden shrink-0 border-zinc-400 dark:border-white/70 bg-transparent h-[22px] w-[22px] hover:border-emerald-500 hover:text-emerald-500 cursor-pointer ml-1.5"
                      title="Send Friend Request"
                    >
                      <Plus className="w-3.5 h-3.5 text-zinc-700 dark:text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-400 dark:text-zinc-500 px-4 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 opacity-30" />
                    </div>
                    <p className="font-medium">Connected with {partnerProfile?.name || "student"}!</p>
                    <p className="text-[11px] text-zinc-400">Say hi to get the conversation started 👋</p>
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
                        <div className="rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                          {msg.text}
                        </div>
                      ) : (
                        <div
                          className={`max-w-[85%] px-4 py-2.5 text-[14px] leading-relaxed shadow-xs flex items-center min-h-[38px] ${msg.from === "me"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-xs font-medium"
                            : "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-xs font-medium border border-black/5 dark:border-white/5"
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
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 italic ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Partner is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-transparent pb-3.5 relative border-t border-zinc-200/60 dark:border-white/8">
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute bottom-[66px] left-3 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl p-3 shadow-2xl border border-black/10 dark:border-white/10"
                    >
                      <div className="grid grid-cols-5 gap-2">
                        {EMOJIS.map((item, i) => (
                          <button
                            key={item.emoji}
                            type="button"
                            onClick={() => setInput(prev => prev + item.emoji)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 transition-colors outline-none p-1.5 cursor-pointer"
                          >
                            <AnimatedEmoji emoji={item} size={30} />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 bg-zinc-100/90 dark:bg-zinc-800/80 rounded-full px-3.5 py-1.5 relative border border-black/5 dark:border-white/10 focus-within:ring-2 focus-within:ring-blue-500/40 transition-all">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer ${showEmojiPicker ? "text-blue-500 dark:text-blue-400" : ""}`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-0 text-[14px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-0 px-2 outline-none font-sf-pro"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    <SendHorizontal className="w-4 h-4 ml-0.5" />
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

      {/* ── Sleek Dynamic Island Glassmorphic Camera Notice ────────────────── */}
      <AnimatePresence>
        {videoError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute top-20 sm:top-22 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md font-sf-pro select-none"
          >
            <div className="flex items-center gap-3.5 rounded-2xl border border-amber-500/25 bg-zinc-950/85 dark:bg-zinc-900/90 backdrop-blur-2xl px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <VideoOff className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold tracking-tight text-white leading-snug">
                  Camera & Mic Notice
                </p>
                <p className="text-[11.5px] font-medium text-zinc-300 dark:text-zinc-400 leading-snug truncate">
                  {videoError}
                </p>
              </div>
              <button
                onClick={() => setVideoError(null)}
                className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {connectionLost && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute top-20 sm:top-22 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md font-sf-pro select-none"
          >
            <div className="flex items-center gap-3.5 rounded-2xl border border-red-500/25 bg-zinc-950/85 dark:bg-zinc-900/90 backdrop-blur-2xl px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold tracking-tight text-white leading-snug">
                  Connection Notice
                </p>
                <p className="text-[11.5px] font-medium text-zinc-300 dark:text-zinc-400 leading-snug truncate">
                  Connection interrupted. Re-matching or refresh to continue.
                </p>
              </div>
              <button
                onClick={() => setConnectionLost(false)}
                className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Modal Reference Placeholder (Kept in Render Tree) ── */}
      {isReportModalOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            aria-describedby="report-modal-desc"
            className="w-full max-w-sm flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="p-6">
              <h2 id="report-modal-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Report User</h2>
              <p id="report-modal-desc" className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
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

      {/* ── Partner Profile Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showPartnerModal && partnerProfile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPartnerModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-xl bg-[#f8fafc] dark:bg-[#18181f] rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/10 overflow-hidden z-10 p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPartnerModal(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Hero Profile Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
                <div className="relative shrink-0">
                  <div className="w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] rounded-full flex items-center justify-center font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-[4px] border-white dark:border-zinc-700 overflow-hidden bg-gradient-to-br from-[#e8edf5] to-[#d5def2]">
                    <img
                      src={partnerProfile.avatar || resolveUserAvatar({ id: partnerProfile.userId, gender: partnerProfile.gender, emailVerified: true, role: "STUDENT", displayName: partnerProfile.name })}
                      alt={partnerProfile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Verified Checkmark Badge */}
                  <div className="absolute bottom-1 right-1 w-8 h-8 bg-[#3b82f6] rounded-full border-[3px] border-white dark:border-zinc-800 flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h2 className="text-2xl sm:text-[26px] font-bold text-zinc-900 dark:text-white tracking-tight leading-tight m-0">
                      {partnerProfile.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Verified Student
                    </span>
                  </div>

                  <p className="text-[14.5px] font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-[420px] m-0">
                    {partnerProfile.bio || "Hi there! I am on Uni-Chat to connect with university students."}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    {isPartnerFriend ? (
                      <div
                        className="px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-400/30 select-none shadow-sm cursor-default"
                        title="You are already friends in personal chat"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Friends</span>
                      </div>
                    ) : partnerFriendship.pendingReceived ? (
                      <button
                        onClick={handleAcceptFriendRequest}
                        disabled={partnerFriendship.loading}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Accept Friend Request</span>
                      </button>
                    ) : partnerFriendship.pendingSent ? (
                      <div
                        className="px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 select-none shadow-sm cursor-default"
                        title="Friend request pending recipient's approval"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Request Sent</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={partnerFriendship.loading}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add Friend</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-base">
                  <span className="text-xl">🤴🏽</span>
                  <span>Personal Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* University */}
                  <div className="relative rounded-[22px] overflow-hidden p-4 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs min-h-[140px]">
                    <div className="w-10 h-10 flex items-center justify-center mb-1.5">
                      <img src="/assets/emojis/school.png" className="w-full h-full object-contain" alt="🏫" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      University
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 leading-tight line-clamp-2">
                      {partnerProfile.university || "University"}
                    </span>
                  </div>

                  {/* Major */}
                  <div className="relative rounded-[22px] overflow-hidden p-4 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs min-h-[140px]">
                    <div className="w-10 h-10 flex items-center justify-center mb-1.5">
                      <img src={getMajorEmoji(partnerProfile.department).src} className="w-full h-full object-contain" alt="🎓" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Major
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 leading-tight line-clamp-2">
                      {partnerProfile.department || "Student"}
                    </span>
                  </div>

                  {/* Status / Year */}
                  <div className="relative rounded-[22px] overflow-hidden p-4 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs min-h-[140px]">
                    <div className="w-10 h-10 flex items-center justify-center mb-1.5">
                      <img src="/assets/emojis/calendar.png" className="w-full h-full object-contain" alt="🗓️" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Status
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 leading-tight">
                      {yearLabel(partnerProfile.year)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hobbies Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-base">
                  <span className="text-xl">🔥</span>
                  <span>Hobbies</span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {partnerProfile.hobbies && partnerProfile.hobbies.length > 0 ? (
                    partnerProfile.hobbies.map((hobby) => (
                      <span
                        key={hobby}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-xs"
                      >
                        {hobby}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-zinc-400 dark:text-zinc-500 italic py-1">
                      No hobbies listed.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
