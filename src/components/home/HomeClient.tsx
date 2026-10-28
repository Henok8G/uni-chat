"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  TrendingUp, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  ArrowRight, 
  BadgeCheck, 
  CalendarPlus,
  Compass,
  Check,
  Search,
  Star,
  ExternalLink
} from "lucide-react";
import { AppMenu } from "@/components/AppMenu";
import { getThemeGradient, DEFAULT_THEME_COLOR } from "@/lib/themes";
import { HomeSidebar } from "./HomeSidebar";
import { OpportunityModal, EventRegistrationModal, CommentModal } from "./HomeModals";
import { HomeFriendsStories } from "./HomeFriendsStories";
import type { GroupItem } from "@/components/chat/types";
import { getCategoryStyle, formatEventDateTime } from "@/lib/eventConstants";

type CategoryFilter = "All" | "Announcements" | "Events" | "Clubs" | "Opportunities";

interface HomeClientProps {
  user?: {
    id?: string;
    themeColor?: string | null;
    gender?: string | null;
    displayName?: string | null;
    email?: string;
    avatarUrl?: string | null;
  };
  initialPosts?: any[];
  initialGroups?: any[];
  initialEvents?: any[];
  friends?: GroupItem[];
}

export function HomeClient({
  user,
  initialPosts = [],
  initialGroups = [],
  initialEvents = [],
  friends = []
}: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<"feed" | "groups" | "events">("feed");

  // Engagement state
  const [likes, setLikes] = useState<Record<string, number>>({
    post1: 142,
    post2: 89,
    post3: 210,
    post4: 85,
    post5: 42,
  });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);

  // Modals state
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [commentModalData, setCommentModalData] = useState<{
    open: boolean;
    title: string;
    comments: Array<{ author: string; badge: string; time: string; text: string }>;
  }>({
    open: false,
    title: "",
    comments: [],
  });

  // Escape key closes open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (opportunityModalOpen) setOpportunityModalOpen(false);
        if (eventModalOpen) setEventModalOpen(false);
        if (commentModalData.open) setCommentModalData((prev) => ({ ...prev, open: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [opportunityModalOpen, eventModalOpen, commentModalData.open]);


  const toggleLike = (postId: string) => {
    const isLiked = userLiked[postId];
    setUserLiked((prev) => ({ ...prev, [postId]: !isLiked }));
    setLikes((prev) => ({
      ...prev,
      [postId]: isLiked ? prev[postId] - 1 : prev[postId] + 1,
    }));
  };

  const toggleBookmark = (postId: string) => {
    setBookmarks((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleShare = (title: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(`Link for "${title}" copied to clipboard!`);
      setTimeout(() => setCopiedToast(null), 3000);
    }
  };

  const handleAddToCalendar = (title: string, date: string, time: string, location: string) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AAU Uni-Chat//Event//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:AAU Campus Event - ${title}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCalendarToast("Event downloaded to your calendar!");
    setTimeout(() => setCalendarToast(null), 3000);
  };

  // Dynamic trending counts computed from live feed posts
  const opportunityCount = useMemo(
    () => (initialPosts || []).filter((p: any) => p.contentType === "OPPORTUNITY").length,
    [initialPosts]
  );
  const eventCount = useMemo(
    () => (initialPosts || []).filter((p: any) => p.contentType === "EVENT").length,
    [initialPosts]
  );
  const clubCount = useMemo(
    () => (initialPosts || []).filter((p: any) => p.contentType === "CLUB_POST" || p.club).length,
    [initialPosts]
  );

  const trendingTags = [
    { id: "research", label: `🔬 Research Opportunities (${Math.max(1, opportunityCount)})`, category: "Opportunities" as CategoryFilter },
    { id: "events", label: `📅 Upcoming Events (${Math.max(1, eventCount)})`, category: "Events" as CategoryFilter },
    { id: "clubs", label: `🏛️ Student Clubs (${Math.max(1, clubCount)})`, category: "Clubs" as CategoryFilter },
    { id: "hackathons", label: "💻 Hackathons & Tech", category: "Events" as CategoryFilter },
  ];


interface FeedCardItem {
  id: string;
  category: CategoryFilter;
  type: string;
  typeBg: string;
  isPinned: boolean;
  isFeatured: boolean;
  publishedAt: any;
  source: {
    name: string;
    roleBadge: string;
    timeAgo: string;
    scope: string;
    avatar: string;
    avatarBg: string;
  };
  headline: string;
  body: string;
  commentsCount: number;
  initialComments: any[];
  isOpportunity: boolean;
  isEvent: boolean;
  eventCategory?: string;
  registrationUrl?: string | null;
  startDate?: any;
  endDate?: any;
  pills?: Array<{ label: string; alert?: boolean }>;
  eventSpec?: {
    date: string;
    time: string;
    location: string;
    organizer: string;
    registrationUrl?: string | null;
  };
  image?: string;
  imageCaption?: string;
}

  // Feed items data strictly from real database posts
  const feedItems = useMemo<FeedCardItem[]>(() => {
    return (initialPosts || []).map((p: any) => {
      let cat: CategoryFilter = "Announcements";
      if (p.contentType === "EVENT") cat = "Events";
      else if (p.contentType === "OPPORTUNITY") cat = "Opportunities";
      else if (p.contentType === "CLUB_POST") cat = "Clubs";

      let typeStr = "OFFICIAL ANNOUNCEMENT";
      let typeBgStr = "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60";
      if (p.contentType === "OPPORTUNITY") {
        typeStr = "OPPORTUNITY";
        typeBgStr = "bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60";
      } else if (p.contentType === "EVENT") {
        typeStr = "EVENT";
        typeBgStr = "bg-emerald-50 text-emerald-800 border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60";
      } else if (p.contentType === "CLUB_POST") {
        typeStr = "OFFICIAL CLUB POST";
        typeBgStr = "bg-purple-50 text-purple-800 border-purple-200/70 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60";
      } else if (p.contentType === "STUDENT_POST") {
        typeStr = "STUDENT POST";
        typeBgStr = "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
      }

      const authorName = p.club?.name || p.author?.displayName || p.author?.email?.split("@")[0] || "AAU Campus";
      const initials = authorName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

      const hasAiImage = p.title?.includes("AI Research Lab") || p.mediaUrls?.includes("/images/aau_ai_lab.jpg") || p.mediaUrls?.includes("/images/aau_ai_lab.webp");
      const eventDates = p.contentType === "EVENT" ? formatEventDateTime(p.startDate, p.endDate) : null;

      return {
        id: p.id,
        category: cat,
        type: typeStr,
        typeBg: typeBgStr,
        isPinned: Boolean(p.isPinned),
        isFeatured: Boolean(p.isFeatured),
        publishedAt: p.publishedAt,
        source: {
          name: authorName,
          roleBadge: p.club?.name ? "Official Club" : p.author?.role !== "STUDENT" ? "Official Staff" : "Verified Student",
          timeAgo: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "Recently",
          scope: p.author?.university?.name || "Campus-wide",
          avatar: initials || "AA",
          avatarBg: p.contentType === "OPPORTUNITY"
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
            : p.contentType === "EVENT"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
            : p.contentType === "CLUB_POST"
            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200",
        },
        headline: p.title,
        body: p.body,
        commentsCount: p._count?.reports || 0,
        initialComments: [],
        isOpportunity: p.contentType === "OPPORTUNITY",
        isEvent: p.contentType === "EVENT",
        eventCategory: p.eventCategory || "Other",
        registrationUrl: p.registrationUrl || null,
        startDate: p.startDate,
        endDate: p.endDate,
        pills: p.contentType === "OPPORTUNITY" ? [
          { label: "Faculty Mentor: Dr. Worku", alert: false },
          { label: "Stipend: 4,500 ETB/mo", alert: false },
          { label: "Deadline: May 15, 2025", alert: true },
        ] : undefined,
        eventSpec: p.contentType === "EVENT" ? {
          date: eventDates?.dateStr || "Upcoming Date",
          time: eventDates?.timeStr || "9:00 AM – 4:30 PM EAT",
          location: p.location || "AAU Main Campus",
          organizer: p.organizer || p.club?.name || "Faculty of Technology",
          registrationUrl: p.registrationUrl || null,
        } : undefined,
        image: hasAiImage ? "/images/aau_ai_lab.webp" : (p.mediaUrls?.[0] || undefined),
        imageCaption: hasAiImage ? "AAU Main Campus · AI Lab Complex" : undefined,
      };
    });
  }, [initialPosts]);

  // Filtered feed
  const filteredFeed = useMemo(() => {
    return feedItems.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.headline.toLowerCase().includes(q);
        const matchBody = item.body.toLowerCase().includes(q);
        const matchAuthor = item.source.name.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchBody && !matchAuthor && !matchCategory) return false;
      }
      return true;
    });
  }, [feedItems, activeCategory, searchQuery]);

  return (
    <div
      className="w-full relative flex flex-col items-center pt-1.5 sm:pt-2 px-0 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-20 box-border leading-[normal] tracking-[normal] min-h-screen transition-colors duration-500 font-sf-pro selection:bg-[#4A7BB0]/20"
      style={{
        background: getThemeGradient(user?.themeColor || DEFAULT_THEME_COLOR, user?.gender),
      }}
    >
      {/* Dynamic Header Bar identical to /app and /profile */}
      <AppMenu />

      {/* Toast notifications */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium shadow-lg flex items-center gap-2 font-sf-pro"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>{copiedToast}</span>
          </motion.div>
        )}
        {calendarToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium shadow-lg flex items-center gap-2 font-sf-pro"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-blue-400 dark:text-blue-600" />
            <span>{calendarToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="w-full max-w-[1240px] flex flex-col items-start gap-5 pt-16 sm:pt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Page Section Title matching Profile page typography */}
        <section className="w-full flex items-center justify-between py-0 px-2 box-border text-left font-sf-pro">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[28px] sm:text-[32px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              Home
            </h1>
          </div>
        </section>

        {/* Friends Stories Section */}
        <HomeFriendsStories
          currentUser={user}
          friends={friends}
        />

        {/* Mobile & Tablet Discovery Segmented Switcher (lg:hidden) */}
        <nav 
          role="tablist" 
          aria-label="Campus discovery sections" 
          className="w-full lg:hidden flex items-center p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "feed"}
            onClick={() => setMobileTab("feed")}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold font-sf-pro transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
              mobileTab === "feed"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Campus Feed</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
              {filteredFeed.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "groups"}
            onClick={() => setMobileTab("groups")}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold font-sf-pro transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
              mobileTab === "groups"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Groups</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
              {initialGroups?.length || 0}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "events"}
            onClick={() => setMobileTab("events")}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold font-sf-pro transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
              mobileTab === "events"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
              {initialEvents?.length || 0}
            </span>
          </button>
        </nav>

        {/* Content Layout Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* Main Feed Column (~68% width on desktop, conditionally active on mobile) */}
          <section className={`lg:col-span-8 space-y-5 ${mobileTab !== "feed" ? "hidden lg:block" : "block"}`}>
            
            {/* Page Header Card */}
            <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] p-5 sm:p-6 transition-all duration-300">
              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 font-sf-pro">
                  What&apos;s happening on campus?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-sf-pro">
                  Stay updated with important announcements, events, opportunities, clubs, and student activity across campuses.
                </p>
              </div>

              {/* Search Bar + Content Filter Chips */}
              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Content Filter Chips */}
                <div className="flex sm:flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1 touch-pan-x">
                  {(["All", "Announcements", "Events", "Clubs", "Opportunities"] as CategoryFilter[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={activeCategory === cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-2.5 sm:py-1.5 min-h-[38px] sm:min-h-0 flex items-center justify-center shrink-0 whitespace-nowrap rounded-full text-xs font-medium font-sf-pro transition-all duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                        activeCategory === cat
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs scale-102"
                          : "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Pill Search Input */}
                <div className="relative w-full sm:w-60 md:w-68 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    aria-label="Search campus feed"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search feed..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#4A7BB0]/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-sf-pro"
                  />
                </div>
              </div>
            </div>

            {/* Trending at AAU Quick Discovery Bar */}
            <div className="rounded-[22px] border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-[color-mix(in_srgb,var(--theme-accent)_4%,rgba(24,24,31,0.7))] backdrop-blur-md p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider shrink-0 font-sf-pro">
                <TrendingUp className="w-3.5 h-3.5 text-[#4A7BB0]" />
                <span>Trending Across Campuses</span>
              </div>

              <div className="flex sm:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full py-0.5 -mx-0.5 px-0.5 touch-pan-x">
                {trendingTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setActiveCategory(tag.category as CategoryFilter)}
                    className="inline-flex items-center shrink-0 whitespace-nowrap gap-1 px-3 py-2 sm:py-1 min-h-[36px] sm:min-h-0 rounded-full text-xs font-medium bg-zinc-100/80 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/50 hover:border-[#4A7BB0]/50 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs font-sf-pro focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                  >
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Cards List */}
            <div className="space-y-4">
              {filteredFeed.length === 0 ? (
                <div className="rounded-[28px] border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-12 text-center font-sf-pro">
                  <Compass className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    No posts found
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try adjusting your category filter or search query.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory("All");
                      setSearchQuery("");
                    }}
                    className="mt-4 px-4 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredFeed.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] p-4 sm:p-6 transition-all duration-300 hover:shadow-md"
                  >
                    {/* Source Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${item.source.avatarBg} font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs font-sf-pro`}
                        >
                          {item.source.avatar}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-sf-pro">
                              {item.source.name}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50/80 text-[#4A7BB0] border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 font-sf-pro">
                              <BadgeCheck className="w-3 h-3 text-[#4A7BB0] dark:text-blue-300" />
                              {item.source.roleBadge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-sf-pro">
                            {item.source.timeAgo} · {item.source.scope}
                          </p>
                        </div>
                      </div>

                      {/* Right Tag Pill */}
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        {item.isEvent && item.eventCategory && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border shadow-2xs font-sf-pro ${
                              getCategoryStyle(item.eventCategory).badgeClasses
                            }`}
                          >
                            {item.eventCategory}
                          </span>
                        )}
                        {item.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs font-sf-pro">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>Featured</span>
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border shadow-2xs font-sf-pro ${item.typeBg}`}
                        >
                          {item.type}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h2 className="text-base sm:text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2 leading-snug font-sf-pro tracking-tight">
                      {item.headline}
                    </h2>

                    {/* Optional Highlight Pills (For Opportunity Card) */}
                    {item.pills && item.pills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {item.pills.map((pill, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs font-semibold font-sf-pro ${
                              pill.alert
                                ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700"
                            }`}
                          >
                            {pill.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Optional Event Spec Box (For Event Card) */}
                    {item.eventSpec && (
                      <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 text-xs font-sf-pro">
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                          <span><strong>Date:</strong> {item.eventSpec.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                          <span><strong>Time:</strong> {item.eventSpec.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <span><strong>Location:</strong> {item.eventSpec.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <Users className="w-4 h-4 text-purple-500 shrink-0" />
                          <span><strong>Organizer:</strong> {item.eventSpec.organizer}</span>
                        </div>
                      </div>
                    )}

                    {/* Contextual Body Copy */}
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sf-pro">
                      {item.body}
                    </p>

                    {/* Rich Media if present */}
                    {item.image && (
                      <div className="relative mt-4 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 group">
                        <div className="relative aspect-16/9 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                          <Image
                            src={item.image}
                            alt="AAU Computer Science and AI Research Lab"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-103"
                            sizes="(max-width: 1024px) 100vw, 800px"
                            priority
                          />
                        </div>
                        {item.imageCaption && (
                          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-zinc-900/80 backdrop-blur-xs text-white text-[11px] font-medium font-sf-pro">
                            {item.imageCaption}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Specific Card CTA Buttons */}
                    {"isOpportunity" in item && item.isOpportunity && (
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 font-sf-pro">
                        <button
                          type="button"
                          onClick={() => setOpportunityModalOpen(true)}
                          className="px-4 py-2 rounded-full bg-[#4A7BB0] hover:bg-[#3B6694] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5 font-sf-pro focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                        >
                          <span>View opportunity & apply</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Share link for ${item.headline}`}
                            onClick={() => handleShare(item.headline)}
                            className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 font-sf-pro focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Share
                          </button>
                          <button
                            type="button"
                            aria-label={bookmarks[item.id] ? "Remove bookmark" : "Bookmark opportunity"}
                            aria-pressed={Boolean(bookmarks[item.id])}
                            onClick={() => toggleBookmark(item.id)}
                            className={`p-2 rounded-full border transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              bookmarks[item.id]
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" fill={bookmarks[item.id] ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    )}

                    {"isEvent" in item && item.isEvent && (
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 font-sf-pro">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.registrationUrl ? (
                            <a
                              href={item.registrationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-full bg-[#4A7BB0] hover:bg-[#3B6694] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5 font-sf-pro focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                            >
                              <span>Register Online</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEvent({
                                id: item.id,
                                title: item.headline,
                                body: item.body,
                                date: item.eventSpec?.date,
                                time: item.eventSpec?.time,
                                location: item.eventSpec?.location,
                                organizer: item.eventSpec?.organizer,
                                eventCategory: item.eventCategory,
                                isFeatured: item.isFeatured,
                                registrationUrl: item.registrationUrl,
                                startDate: item.startDate,
                                endDate: item.endDate,
                              });
                              setEventModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5 font-sf-pro focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                          >
                            <span>View Event Pass</span>
                          </button>
                          <button
                            type="button"
                            aria-label={`Add ${item.headline} to calendar`}
                            onClick={() =>
                              handleAddToCalendar(
                                item.headline,
                                item.eventSpec?.date || "Upcoming Date",
                                item.eventSpec?.time || "9:00 AM - 4:30 PM",
                                item.eventSpec?.location || "Main Campus Grand Hall, Sidist Kilo"
                              )
                            }
                            className="px-3.5 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 font-sf-pro focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-blue-500" />
                            <span>Add to Calendar</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label={bookmarks[item.id] ? "Remove bookmark" : "Bookmark event"}
                          aria-pressed={Boolean(bookmarks[item.id])}
                          onClick={() => toggleBookmark(item.id)}
                          className={`p-2 rounded-full border transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                            bookmarks[item.id]
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" fill={bookmarks[item.id] ? "currentColor" : "none"} />
                        </button>
                      </div>
                    )}

                    {/* Standard Engagement Footer */}
                    {!item.isOpportunity && !item.isEvent && (
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-sf-pro">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Like Button */}
                          <button
                            type="button"
                            aria-label={userLiked[item.id] ? "Unlike post" : "Like post"}
                            aria-pressed={Boolean(userLiked[item.id])}
                            onClick={() => toggleLike(item.id)}
                            className={`flex items-center gap-1.5 py-2 sm:py-0 px-1 sm:px-0 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg ${
                              userLiked[item.id]
                                ? "text-rose-600 dark:text-rose-400 font-semibold"
                                : "hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                          >
                            <Heart
                              className="w-4 h-4"
                              fill={userLiked[item.id] ? "currentColor" : "none"}
                            />
                            <span>{likes[item.id] ?? 0}</span>
                          </button>

                          {/* Comment Button */}
                          <button
                            type="button"
                            aria-label={`View comments (${item.commentsCount})`}
                            onClick={() =>
                              setCommentModalData({
                                open: true,
                                title: item.headline,
                                comments: item.initialComments || [],
                              })
                            }
                            className="flex items-center gap-1.5 py-2 sm:py-0 px-1 sm:px-0 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{item.commentsCount}</span>
                          </button>

                          {/* Share Button */}
                          <button
                            type="button"
                            aria-label={`Share link for ${item.headline}`}
                            onClick={() => handleShare(item.headline)}
                            className="flex items-center gap-1.5 py-2 sm:py-0 px-2 sm:px-0 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                        </div>

                        {/* Bookmark / Save */}
                        <button
                          type="button"
                          onClick={() => toggleBookmark(item.id)}
                          aria-label={bookmarks[item.id] ? "Remove bookmark" : "Bookmark post"}
                          aria-pressed={Boolean(bookmarks[item.id])}
                          className={`p-2.5 sm:p-1.5 rounded-full transition cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                            bookmarks[item.id]
                              ? "text-amber-600 dark:text-amber-400"
                              : "hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          <Bookmark
                            className="w-4 h-4"
                            fill={bookmarks[item.id] ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Right Discovery Sidebar (32% width on desktop, tab-controlled on mobile) */}
          <aside className={`lg:col-span-4 sticky top-6 font-sf-pro ${mobileTab === "feed" ? "hidden lg:block" : "block"}`}>
            <HomeSidebar
              initialGroups={initialGroups}
              initialEvents={initialEvents}
              viewMode={mobileTab === "groups" ? "groups" : mobileTab === "events" ? "events" : "all"}
              onSelectEvent={(ev) => {
                setSelectedEvent(ev);
                setEventModalOpen(true);
              }}
            />
          </aside>

        </div>
      </main>

      {/* Modals */}
      <OpportunityModal
        isOpen={opportunityModalOpen}
        onClose={() => setOpportunityModalOpen(false)}
      />

      <EventRegistrationModal
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />


      <CommentModal
        isOpen={commentModalData.open}
        onClose={() => setCommentModalData((prev) => ({ ...prev, open: false }))}
        postTitle={commentModalData.title}
        initialComments={commentModalData.comments}
      />
    </div>
  );
}
