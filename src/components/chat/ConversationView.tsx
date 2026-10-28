"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { GroupItem } from "./types";
import type { ChatMessageRecord } from "@/lib/chatService";
import { ArrowLeft } from "lucide-react";

// ── Emoji data (same set as the video chat page) ─────────────────────────────
const EMOJIS = [
  { emoji: "❤️", label: "Love",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/2665_fe0f/512.webp",            gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/2665_fe0f/512.gif" },
  { emoji: "😂", label: "Haha",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif" },
  { emoji: "😍", label: "Wow",       webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif" },
  { emoji: "🔥", label: "Fire",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif" },
  { emoji: "👍", label: "Like",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fc/512.webp",         gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fc/512.gif" },
  { emoji: "🎉", label: "Party",     webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif" },
  { emoji: "💯", label: "100",       webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.gif" },
  { emoji: "🥺", label: "Pleading",  webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.gif" },
  { emoji: "😭", label: "Cry",       webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif" },
  { emoji: "🥵", label: "Hot",       webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f975/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f975/512.webp" },
  { emoji: "🤬", label: "Mad",       webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92c/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92c/512.gif" },
  { emoji: "🫣", label: "Peeking",   webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae3/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae3/512.gif" },
  { emoji: "💅", label: "Nails",     webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f485_1f3fd/512.webp",         gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f485_1f3fd/512.gif" },
  { emoji: "✨", label: "Sparkles",  webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp",                gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif" },
  { emoji: "🌹", label: "Rose",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f339/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f339/512.gif" },
  { emoji: "🙈", label: "Monkey1",   webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.gif" },
  { emoji: "🙉", label: "Monkey2",   webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f649/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f649/512.gif" },
  { emoji: "🙊", label: "Monkey3",   webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64a/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64a/512.gif" },
  { emoji: "😶‍🌫️", label: "CloudFace",webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f636_200d_1f32b_fe0f/512.webp",gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f636_200d_1f32b_fe0f/512.gif" },
  { emoji: "😹", label: "Cat1",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f639/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f639/512.gif" },
  { emoji: "😻", label: "Cat2",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f63b/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f63b/512.gif" },
  { emoji: "💃", label: "Dancer",    webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f483_1f3fd/512.webp",         gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f483_1f3fd/512.gif" },
  { emoji: "☄️", label: "Comet",     webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/2604_fe0f/512.webp",           gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/2604_fe0f/512.gif" },
  { emoji: "💍", label: "Ring",      webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48d/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48d/512.webp" },
  { emoji: "🥸", label: "Disguise",  webp: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f978/512.webp",               gif: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f978/512.gif" },
];

// ── Animated WebP/GIF emoji (same helper as video page) ──────────────────────
function AnimatedEmoji({
  emoji,
  className,
  size = 32,
}: {
  emoji: typeof EMOJIS[0];
  className?: string;
  size?: number;
}) {
  return (
    <picture className={cn("inline-block", className)}>
      <source srcSet={emoji.webp} type="image/webp" />
      <img
        src={emoji.gif}
        alt={emoji.label}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain"

      />
    </picture>
  );
}

// ── Local message type ────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  senderName?: string;
  senderAvatar?: string;
}

interface ConversationViewProps {
  chat: GroupItem;
  currentUserId?: string;
  onMessageSent?: (chatId: string, text: string) => void;
  onBack?: () => void;
  initialMessages?: ChatMessageRecord[];
}

/**
 * Full chat conversation panel — matches the mockup design exactly:
 *  • Rounded rectangle card
 *  • Header: small circular avatar + name + thin divider line
 *  • Scrollable messages area with left/right bubbles
 *  • Bottom input bar: smiley button (animated emoji picker) + text + send arrow
 */
export function ConversationView({
  chat,
  currentUserId,
  onMessageSent,
  onBack,
  initialMessages,
}: ConversationViewProps) {
  // Helper to map message record into local Message format
  const mapRecord = (m: any): Message => ({
    id: m.id,
    text: m.text,
    fromMe: currentUserId ? m.senderId === currentUserId : false,
    time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    senderName: m.senderName,
    senderAvatar: m.senderAvatar,
  });

  // Track initial messages for this specific chat ID so we skip redundant fetch on first mount
  const initialChatIdRef = useRef<string | null>(
    initialMessages !== undefined ? chat.id : null
  );

  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages !== undefined) {
      return initialMessages.map(mapRecord);
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return initialMessages === undefined;
  });

  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Fetch real messages from API when chat changes
  useEffect(() => {
    // If initial messages were already provided on the server for this exact chat, consume and skip redundant fetch
    if (initialChatIdRef.current === chat.id) {
      initialChatIdRef.current = null;
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/messages?targetId=${encodeURIComponent(chat.id)}&kind=${chat.kind || "personal"}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (cancelled) return;

        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages.map(mapRecord));
        } else {
          setMessages([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading chat messages:", err);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMessages();
    setInputText("");
    setShowEmojiPicker(false);

    return () => {
      cancelled = true;
    };
  }, [chat.id, chat.kind, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [showEmojiPicker]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const tempId = `temp-${Date.now()}`;

    // Optimistic UI update
    setMessages((prev) => [...prev, { id: tempId, text, fromMe: true, time }]);
    setInputText("");
    setShowEmojiPicker(false);
    onMessageSent?.(chat.id, text);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: chat.id,
          kind: chat.kind || "personal",
          text,
        }),
      });

      if (!res.ok) {
        console.error("Failed to persist message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const appendEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Initials fallback
  const initials = chat.name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      key={chat.id}
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      /* ── Outer rounded rectangle — matches mockup shape ── */
      className="flex flex-col w-full h-full overflow-hidden rounded-none md:rounded-3xl bg-zinc-400/50 dark:bg-zinc-700/60 backdrop-blur-2xl border-0 md:border md:border-zinc-300/40 dark:md:border-zinc-600/40 shadow-2xl font-sf-pro"
    >
      {/* ══ Header ══════════════════════════════════════════════════════════════ */}
      <div
        className="shrink-0 flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden -ml-1 w-11 h-11 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Back to conversations"
            title="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Circular avatar — same size & style as the mockup */}
        <div className="relative shrink-0 w-8 h-8">
          <div className="w-full h-full rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center ring-[1.5px] ring-black/10 dark:ring-white/10 shadow-sm">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 select-none">
                {initials}
              </span>
            )}
          </div>
          {chat.isOnline && (
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-[1.5px] ring-zinc-400 dark:ring-zinc-700" />
          )}
        </div>

        {/* Name & status */}
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            {chat.name}
          </span>
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
            {chat.kind === "group" ? "Group Chat" : "Personal Conversation"}
          </span>
        </div>
      </div>

      {/* ── Divider line (exact match to mockup horizontal rule) ── */}
      <div className="shrink-0 h-px bg-zinc-400/50 dark:bg-zinc-500/40 mx-0" />

      {/* ══ Messages area ════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 custom-scrollbar">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Loading conversation...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 dark:text-zinc-400">
            <p className="text-sm font-medium mb-1">No messages yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[240px]">
              {chat.kind === "group"
                ? `Say hello to everyone in ${chat.name}!`
                : `Send a message to start chatting with ${chat.name}.`}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={cn(
                    "max-w-[70%] px-4 py-2.5 text-[14px] leading-snug shadow-sm",
                    msg.fromMe
                      ? "bg-white/90 dark:bg-zinc-200/95 text-zinc-900 rounded-2xl rounded-br-[6px]"
                      : "bg-white/80 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-[6px]"
                  )}
                >
                  {!msg.fromMe && chat.kind === "group" && msg.senderName && (
                    <span className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                      {msg.senderName}
                    </span>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <span className={`block mt-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 ${msg.fromMe ? "text-right" : ""}`}>
                    {msg.time}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Thin divider above input ── */}
      <div className="shrink-0 h-px bg-zinc-400/40 dark:bg-zinc-500/30 mx-0" />

      {/* ══ Input bar ════════════════════════════════════════════════════════════ */}
      <div
        className="shrink-0 relative px-3 py-2.5"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* ── Animated emoji picker tray ── */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={emojiRef}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-[calc(56px+env(safe-area-inset-bottom,0px))] left-3 z-50 bg-zinc-800/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-white/8"
            >
              <div className="grid grid-cols-5 gap-1.5" role="listbox" aria-label="Quick reactions">
                {EMOJIS.map((item, i) => (
                  <button
                    key={item.emoji}
                    type="button"
                    aria-label={`Insert ${item.label} emoji`}
                    onClick={() => appendEmoji(item.emoji)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 p-1.5 cursor-pointer"
                  >
                    <AnimatedEmoji emoji={item} size={28} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row — matches mockup: smiley | text field | arrow send */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Smiley / emoji toggle */}
          <button
            type="button"
            aria-expanded={showEmojiPicker}
            aria-haspopup="true"
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Insert emoji"
            className={cn(
              "shrink-0 w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500",
              showEmojiPicker
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
            )}
            title="Emoji"
          >
            {/* Smiley face SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Text input */}
          <input
            type="text"
            aria-label="Type a message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message....."
            className="flex-1 bg-transparent border-none outline-none text-base sm:text-[14.5px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded-lg px-2"
          />

          {/* Send arrow */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            aria-label="Send message"
            className={cn(
              "shrink-0 w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500",
              inputText.trim()
                ? "text-zinc-800 dark:text-zinc-100 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                : "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
            )}
            title="Send"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h7" />
              <path d="M3 21l19-9L3 3l1.5 9L3 21z" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
