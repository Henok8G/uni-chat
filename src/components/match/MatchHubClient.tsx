"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Video, 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  Users, 
  Sliders, 
  ChevronDown, 
  RefreshCw, 
  ArrowRight, 
  Radio, 
  GraduationCap, 
  Check, 
  Flame,
  Search,
  BookOpen,
  Coffee,
  Code2,
  X,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { AppMenu } from "@/components/AppMenu";
import { AAU_DEPARTMENTS, KNOWN_HOBBIES } from "@/app/profile/constants";
import { resolveUserAvatar } from "@/lib/avatars";
import { getThemeGradient, DEFAULT_THEME_COLOR } from "@/lib/themes";

interface MatchUser {
  id: string;
  email: string;
  displayName?: string | null;
  gender: string;
  department?: string | null;
  year?: number | null;
  hobbies?: string[];
  avatarUrl?: string | null;
  plan: string;
  university?: { name: string; domain?: string } | null;
  emailVerified?: boolean;
  role?: string;
  themeColor?: string | null;
}

interface MatchHubClientProps {
  user: MatchUser;
  onlineCount?: number;
}

// Campuses list (Addis Ababa University pilot)
const UNIVERSITIES = [
  { id: "all", name: "All AAU Campuses", short: "All Campuses" },
  { id: "4kilo", name: "AAU 4 Kilo (Natural Sciences)", short: "4 Kilo" },
  { id: "5kilo", name: "AAU 5 Kilo (AAiT Engineering)", short: "5 Kilo" },
  { id: "6kilo", name: "AAU 6 Kilo (Main Campus / Social Sciences)", short: "6 Kilo" },
  { id: "chs", name: "AAU Tikur Anbessa (Health Sciences)", short: "Tikur Anbessa" },
  { id: "fbe", name: "AAU FBE (Business & Economics)", short: "FBE" },
  { id: "eiabc", name: "AAU EiABC (Architecture & Urban Planning)", short: "EiABC" },
  { id: "commerce", name: "AAU College of Commerce", short: "Commerce" },
];

// Quick match presets
const MATCH_PRESETS = [
  {
    title: "Code & Projects",
    icon: Code2,
    hobbies: ["Coding", "Gaming"],
    dept: "Computer Science",
    desc: "CS, SWE & tech project peers",
  },
  {
    title: "Exam & Midterm Prep",
    icon: BookOpen,
    hobbies: ["Reading"],
    dept: "all",
    desc: "Mutual focus & study partners",
  },
  {
    title: "Coffee & Campus Chat",
    icon: Coffee,
    hobbies: ["Movies", "Music"],
    dept: "all",
    desc: "Casual conversation & friends",
  },
  {
    title: "Fitness & Sports",
    icon: Flame,
    hobbies: ["Sports", "Fitness"],
    dept: "all",
    desc: "Workout partners & athletics",
  },
];

// Simulated radar peers with realistic Ethiopian university profiles
const MOCK_RADAR_BLIPS = [
  {
    id: "blip-1",
    name: "Selamawit T.",
    gender: "FEMALE",
    university: "Addis Ababa University",
    department: "Computer Science",
    year: 3,
    hobbies: ["Coding", "Gaming", "Anime"],
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Selamawit",
    x: 28,
    y: 35,
    distance: "Near 4 Kilo",
  },
  {
    id: "blip-2",
    name: "Bereket M.",
    gender: "MALE",
    university: "Addis Ababa University",
    department: "Software Engineering (AAiT)",
    year: 4,
    hobbies: ["Coding", "Fitness", "Music"],
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Bereket",
    x: 72,
    y: 28,
    distance: "5 Kilo (AAiT)",
  },
  {
    id: "blip-3",
    name: "Hellen K.",
    gender: "FEMALE",
    university: "Addis Ababa University",
    department: "Medicine",
    year: 2,
    hobbies: ["Reading", "Art", "Cooking"],
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Hellen",
    x: 65,
    y: 70,
    distance: "Tikur Anbessa",
  },
  {
    id: "blip-4",
    name: "Yohannes A.",
    gender: "MALE",
    university: "Addis Ababa University",
    department: "Economics",
    year: 3,
    hobbies: ["Coding", "Movies", "Photography"],
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Yohannes",
    x: 32,
    y: 65,
    distance: "FBE Campus",
  },
  {
    id: "blip-5",
    name: "Eden D.",
    gender: "FEMALE",
    university: "Addis Ababa University",
    department: "Architecture (EiABC)",
    year: 4,
    hobbies: ["Art", "Design", "Music"],
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Eden",
    x: 75,
    y: 50,
    distance: "EiABC (Lideta)",
  },
  {
    id: "blip-6",
    name: "Natnael G.",
    gender: "MALE",
    university: "Addis Ababa University",
    department: "Electrical & Computer Eng",
    year: 5,
    hobbies: ["Gaming", "Coding", "Sports"],
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Natnael",
    x: 20,
    y: 48,
    distance: "5 Kilo (AAiT)",
  },
];

export function MatchHubClient({ user, onlineCount = 142 }: MatchHubClientProps) {
  const router = useRouter();

  // Criteria & filter state
  const [targetGender, setTargetGender] = useState<"any" | "female" | "male">("any");
  const [selectedUni, setSelectedUni] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("any");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(
    user.hobbies && user.hobbies.length > 0 ? user.hobbies.slice(0, 3) : ["Coding", "Reading"]
  );
  const [matchMode, setMatchMode] = useState<"video" | "text">("video");

  // Department searchable dropdown
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");

  // Radar animation & blip inspection state
  const [activeBlip, setActiveBlip] = useState<any | null>(null);

  // Searching modal state
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState<number>(0);
  const [matchedCandidate, setMatchedCandidate] = useState<any | null>(null);
  const [searchFailed, setSearchFailed] = useState<boolean>(false);
  const [isCriteriaExpanded, setIsCriteriaExpanded] = useState<boolean>(false);

  // Dynamic user avatar fallback
  const userAvatar = useMemo(() => {
    return (
      user.avatarUrl ||
      resolveUserAvatar({
        id: user.id,
        email: user.email,
        displayName: user.displayName || undefined,
        gender: user.gender,
        emailVerified: user.emailVerified ?? true,
        role: user.role || "STUDENT",
      })
    );
  }, [user]);

  // Filtered department list for searchable selector
  const filteredDepartments = useMemo(() => {
    if (!deptSearch.trim()) return AAU_DEPARTMENTS;
    return AAU_DEPARTMENTS.filter((d) =>
      d.toLowerCase().includes(deptSearch.toLowerCase())
    );
  }, [deptSearch]);

  // Toggle hobby selection
  const toggleHobby = (hobby: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  // Select all user's profile hobbies
  const selectMyProfileHobbies = () => {
    if (user.hobbies && user.hobbies.length > 0) {
      setSelectedHobbies([...new Set([...selectedHobbies, ...user.hobbies])]);
    }
  };

  // Apply a preset
  const applyPreset = (preset: (typeof MATCH_PRESETS)[0]) => {
    if (preset.dept !== "all") setSelectedDept(preset.dept);
    setSelectedHobbies((prev) => [...new Set([...prev, ...preset.hobbies])]);
  };

  // Reset filters to defaults
  const handleResetFilters = () => {
    setTargetGender("any");
    setSelectedUni("all");
    setSelectedDept("all");
    setSelectedYear("any");
    setSelectedHobbies(user.hobbies && user.hobbies.length > 0 ? user.hobbies.slice(0, 3) : ["Coding"]);
  };

  // Launch matching flow
  const handleStartMatching = () => {
    setIsSearching(true);
    setSearchStep(0);
    setMatchedCandidate(null);
    setSearchFailed(false);
  };

  // Radar scanning sequence simulation
  useEffect(() => {
    if (!isSearching) return;

    const timer1 = setTimeout(() => setSearchStep(1), 1000);
    const timer2 = setTimeout(() => setSearchStep(2), 2200);
    const timer3 = setTimeout(() => {
      setSearchStep(3);

      // Filter pool based on selected criteria
      let pool = MOCK_RADAR_BLIPS;
      if (targetGender === "female") {
        pool = pool.filter((b) => b.gender === "FEMALE");
      } else if (targetGender === "male") {
        pool = pool.filter((b) => b.gender === "MALE");
      }

      if (selectedDept !== "all") {
        const strictMatch = pool.filter((b) => b.department.toLowerCase().includes(selectedDept.toLowerCase()));
        if (strictMatch.length > 0) pool = strictMatch;
      }

      if (pool.length === 0) {
        setSearchFailed(true);
        return;
      }

      const candidate = pool[Math.floor(Math.random() * pool.length)] || MOCK_RADAR_BLIPS[0];

      // Calculate compatibility
      const shared = candidate.hobbies.filter((h) => selectedHobbies.includes(h));
      const score = Math.min(
        99,
        65 + shared.length * 10 + (selectedDept === candidate.department ? 15 : 0)
      );

      setMatchedCandidate({
        ...candidate,
        compatibilityScore: score,
        sharedHobbies: shared,
      });
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isSearching, targetGender, selectedDept, selectedHobbies]);

  // Escape key closes modals, radar details, and dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDeptDropdownOpen) {
          setIsDeptDropdownOpen(false);
        } else if (activeBlip) {
          setActiveBlip(null);
        } else if (isSearching) {
          setIsSearching(false);
        } else if (matchedCandidate) {
          setMatchedCandidate(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeptDropdownOpen, activeBlip, isSearching, matchedCandidate]);

  // Direct launch into the live chat/video room with parameters
  const launchLiveRoom = (modeOverride?: "video" | "text") => {
    const finalMode = modeOverride || matchMode;
    const params = new URLSearchParams();
    if (targetGender !== "any") params.set("gender", targetGender);
    if (selectedDept !== "all") params.set("dept", selectedDept);
    if (selectedYear !== "any") params.set("year", selectedYear);
    if (selectedHobbies.length > 0) params.set("hobbies", selectedHobbies.join(","));
    params.set("mode", finalMode);
    params.set("autostart", "1");

    if (finalMode === "text") {
      router.push(`/app/chat?${params.toString()}`);
    } else {
      router.push(`/app?${params.toString()}`);
    }
  };

  return (
    <div
      className="w-full relative flex flex-col items-center pt-1.5 sm:pt-2 px-0 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] sm:pb-20 box-border leading-[normal] tracking-[normal] min-h-screen transition-colors duration-500 font-sf-pro selection:bg-[#4A7BB0]/20"
      style={{
        background: getThemeGradient(user?.themeColor || DEFAULT_THEME_COLOR, user?.gender),
      }}
    >
      {/* Dynamic Header */}
      <AppMenu />

      <main className="w-full max-w-[1240px] flex flex-col items-start gap-5 pt-16 sm:pt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Page Section Title matching Home and Profile */}
        <section className="w-full flex items-center justify-between py-0 px-1 box-border text-left font-sf-pro">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[28px] sm:text-[32px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              Match Hub
            </h1>
          </div>
        </section>

        {/* ── HERO BANNER & STATS CARD ── */}
        <section className="w-full rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] p-5 sm:p-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#4A7BB0] border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 font-sf-pro">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Campus Peer Discovery</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 font-sf-pro">
                Find study partners and project collaborators
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-sf-pro">
                Connect 1-on-1 with verified AAU students based on shared hobbies, department interests, and study preferences.
              </p>
            </div>

            {/* Quick Live Stats Pill */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 p-2.5 sm:p-3 rounded-2xl shadow-2xs font-sf-pro">
              <div className="flex items-center gap-2 px-2.5 border-r border-zinc-200 dark:border-zinc-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white leading-none">{onlineCount}+ Online</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Verified Peers</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white leading-none">~3.8s</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Avg Match</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2.5 border-l border-zinc-200 dark:border-zinc-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A7BB0] dark:text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white leading-none">.edu.et Only</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">AAU Verified</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TWO COLUMN MAIN LAYOUT ── */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* LEFT COLUMN: CRITERIA & FILTERS (7 cols on desktop, ordered after Radar on mobile) */}
          <div className="lg:col-span-7 space-y-5 order-2 lg:order-1 font-sf-pro">

            {/* 1. Quick Presets Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
                <span>Quick Match Presets</span>
                <span className="text-[11px] font-normal lowercase">Click to auto-configure</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {MATCH_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="p-3 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 transition-all hover:border-[#4A7BB0]/50 shadow-2xs cursor-pointer group text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                    >
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#4A7BB0] dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-[#4A7BB0] transition-colors leading-tight">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                        {preset.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Filter Configuration Container */}
            <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] p-5 sm:p-6 space-y-5 transition-all duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCriteriaExpanded((prev) => !prev)}
                  aria-expanded={isCriteriaExpanded}
                  aria-controls="matching-criteria-body"
                  className="flex items-center gap-2 font-medium text-base text-zinc-900 dark:text-zinc-100 text-left cursor-pointer sm:cursor-default focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] rounded-lg"
                >
                  <Sliders className="w-4 h-4 text-[#4A7BB0]" />
                  <span>Matching Criteria &amp; Filters</span>
                  <ChevronDown
                    className={`sm:hidden w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      isCriteriaExpanded ? "rotate-180 text-[#4A7BB0]" : ""
                    }`}
                  />
                  <span className="sm:hidden text-xs text-[#4A7BB0] font-normal ml-1">
                    {isCriteriaExpanded ? "(Collapse)" : "(Customize)"}
                  </span>
                </button>
                {user.plan === "PRO" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                    PRO Priority Enabled
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800">
                    Standard Match
                  </span>
                )}
              </div>

              {/* Collapsible Filter Body on Mobile, Always Visible on Desktop */}
              <div 
                id="matching-criteria-body"
                className={`${isCriteriaExpanded ? "block" : "hidden sm:block"} space-y-5 pt-1`}
              >

                {/* Target Gender */}
                <div className="space-y-1.5">
                  <label id="target-gender-label" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Target Gender Preference
                  </label>
                  <div 
                    role="radiogroup" 
                    aria-labelledby="target-gender-label" 
                    className="grid grid-cols-3 gap-2"
                  >
                    {[
                      { id: "any", label: "Any Peer", sub: "Fastest match", icon: Users },
                      { id: "female", label: "Women Only", sub: "Priority match", icon: Sparkles },
                      { id: "male", label: "Men Only", sub: "Priority match", icon: Sparkles },
                    ].map((item) => {
                      const isSelected = targetGender === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setTargetGender(item.id as any)}
                          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                            isSelected
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs"
                              : "bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-200/60"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 mb-1 ${isSelected ? "text-white dark:text-zinc-900" : "text-[#4A7BB0]"}`} />
                          <span className="text-xs font-semibold">{item.label}</span>
                          <span className={`text-[10px] ${isSelected ? "opacity-80" : "text-zinc-400"}`}>
                            {item.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* University / Campus Selection */}
                <div className="space-y-1.5">
                  <label id="campus-label" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    University / Campus
                  </label>
                  <div 
                    role="radiogroup" 
                    aria-labelledby="campus-label" 
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                  >
                    {UNIVERSITIES.map((uni) => {
                      const isSelected = selectedUni === uni.id;
                      return (
                        <button
                          key={uni.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedUni(uni.id)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                            isSelected
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs font-semibold"
                              : "bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-200/60"
                          }`}
                        >
                          {uni.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Department Selector */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label id="dept-label" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Target Department / Major
                    </label>
                    {selectedDept !== "all" && (
                      <button
                        type="button"
                        onClick={() => setSelectedDept("all")}
                        className="text-[11px] text-[#4A7BB0] hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#4A7BB0] rounded"
                      >
                        Reset to All
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isDeptDropdownOpen}
                      aria-label="Target department selector"
                      onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-left text-xs font-medium hover:border-[#4A7BB0]/50 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GraduationCap className="w-4 h-4 text-[#4A7BB0] shrink-0" />
                        <span className="truncate text-zinc-800 dark:text-zinc-200 font-medium">
                          {selectedDept === "all" ? "Any Department (All Fields)" : selectedDept}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    </button>

                    {isDeptDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 shadow-2xl backdrop-blur-2xl max-h-60 flex flex-col">
                        <div className="relative p-1 mb-1.5">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            aria-label="Filter target departments"
                            placeholder="Search department..."
                            value={deptSearch}
                            onChange={(e) => setDeptSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-[#4A7BB0]"
                          />
                        </div>
                        <div 
                          role="listbox" 
                          aria-label="Select Target Department"
                          className="overflow-y-auto space-y-0.5 flex-1 pr-1"
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={selectedDept === "all"}
                            onClick={() => {
                              setSelectedDept("all");
                              setIsDeptDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                              selectedDept === "all"
                                ? "bg-[#4A7BB0] text-white"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            Any Department (All Fields)
                          </button>
                          {filteredDepartments.map((dept) => (
                            <button
                              key={dept}
                              type="button"
                              role="option"
                              aria-selected={selectedDept === dept}
                              onClick={() => {
                                setSelectedDept(dept);
                                setIsDeptDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                                selectedDept === dept
                                  ? "bg-[#4A7BB0] text-white font-semibold"
                                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                              }`}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Year Filter */}
                <div className="space-y-1.5">
                  <label id="academic-year-label" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Academic Year
                  </label>
                  <div 
                    role="radiogroup" 
                    aria-labelledby="academic-year-label" 
                    className="grid grid-cols-3 sm:grid-cols-6 gap-2"
                  >
                    {[
                      { id: "any", label: "Any Year" },
                      { id: "1", label: "Year 1" },
                      { id: "2", label: "Year 2" },
                      { id: "3", label: "Year 3" },
                      { id: "4", label: "Year 4" },
                      { id: "5", label: "Year 5+" },
                    ].map((y) => {
                      const isSelected = selectedYear === y.id;
                      return (
                        <button
                          key={y.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedYear(y.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                            isSelected
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs"
                              : "bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-200/60"
                          }`}
                        >
                          {y.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shared Interests & Hobbies */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Shared Hobbies &amp; Interests
                      </label>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold border border-emerald-200/60">
                        +5 Score Each
                      </span>
                    </div>

                    {user.hobbies && user.hobbies.length > 0 && (
                      <button
                        type="button"
                        onClick={selectMyProfileHobbies}
                        className="text-[11px] text-[#4A7BB0] hover:underline font-medium cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#4A7BB0] rounded"
                      >
                        Use Profile Hobbies
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {KNOWN_HOBBIES.map((hobby) => {
                      const isSelected = selectedHobbies.includes(hobby);
                      return (
                        <button
                          key={hobby}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleHobby(hobby)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                            isSelected
                              ? "bg-[#4A7BB0] text-white shadow-2xs scale-102 font-semibold"
                              : "bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/50"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{hobby}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Match Mode Selection (Video vs Text) */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <label id="match-mode-label" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Initial Match Mode
                  </label>
                  <div 
                    role="radiogroup" 
                    aria-labelledby="match-mode-label" 
                    className="grid grid-cols-2 gap-2.5"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={matchMode === "video"}
                      onClick={() => setMatchMode("video")}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                        matchMode === "video"
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border-[#4A7BB0] text-zinc-900 dark:text-zinc-100 ring-1 ring-[#4A7BB0]/30 shadow-2xs"
                          : "bg-zinc-100/80 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60"
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${matchMode === "video" ? "bg-[#4A7BB0] text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"}`}>
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Live Video Meet</div>
                        <div className="text-[10px] text-zinc-400">Direct WebRTC connection</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={matchMode === "text"}
                      onClick={() => setMatchMode("text")}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0] ${
                        matchMode === "text"
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border-[#4A7BB0] text-zinc-900 dark:text-zinc-100 ring-1 ring-[#4A7BB0]/30 shadow-2xs"
                          : "bg-zinc-100/80 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60"
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${matchMode === "text" ? "bg-[#4A7BB0] text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"}`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Quick Text Match</div>
                        <div className="text-[10px] text-zinc-400">Break the ice first</div>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE RADAR & MATCH ACTION (5 cols on desktop, ordered first on mobile) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24 order-1 lg:order-2 font-sf-pro">
            
            {/* Live Interactive Sonar Radar Card */}
            <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] p-5 sm:p-6 flex flex-col items-center relative overflow-hidden transition-all duration-300">
              <div className="w-full flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                    Active Campus Sonar
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">360° Real-time</span>
              </div>

              {/* The Radar Disc Display */}
              <div className="relative w-[260px] h-[260px] sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border border-blue-500/25 bg-gradient-to-b from-blue-950/10 via-transparent to-slate-950/15 dark:from-blue-950/25 dark:to-zinc-950/35 flex items-center justify-center overflow-hidden my-2 shadow-inner">
                
                {/* Concentric Circles */}
                <div className="absolute inset-4 rounded-full border border-blue-500/15 pointer-events-none" />
                <div className="absolute inset-16 rounded-full border border-blue-500/20 pointer-events-none" />
                <div className="absolute inset-28 rounded-full border border-blue-500/25 pointer-events-none" />

                {/* Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-blue-500/15" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-full w-[1px] bg-blue-500/15" />
                </div>

                {/* Rotating Radar Sweeper */}
                <div className="absolute inset-0 rounded-full animate-spin [animation-duration:5s] [animation-timing-function:linear] pointer-events-none origin-center">
                  <div className="w-1/2 h-1/2 absolute top-0 right-0 bg-gradient-to-br from-blue-500/20 via-emerald-500/10 to-transparent rounded-tr-full" />
                </div>

                {/* Center User Avatar */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="relative">
                    <span className="animate-ping absolute inset-0 rounded-full bg-[#4A7BB0]/50 opacity-75" />
                    <div className="relative w-12 h-12 rounded-full ring-2 ring-[#4A7BB0] overflow-hidden bg-blue-900 shadow-lg">
                      <Image
                        src={userAvatar}
                        alt="Your avatar"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900/80 text-white backdrop-blur-md">
                    You (Center)
                  </span>
                </div>

                {/* Mock Student Blips on Radar */}
                {MOCK_RADAR_BLIPS.map((blip) => {
                  return (
                    <button
                      key={blip.id}
                      type="button"
                      aria-label={`Student radar ping: ${blip.name}, ${blip.department}`}
                      aria-expanded={activeBlip?.id === blip.id}
                      onClick={() => setActiveBlip(blip)}
                      onMouseEnter={() => setActiveBlip(blip)}
                      onMouseLeave={() => setActiveBlip(null)}
                      style={{ top: `${blip.y}%`, left: `${blip.x}%` }}
                      className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full cursor-pointer"
                    >
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 shadow-sm"></span>
                      </span>
                    </button>
                  );
                })}

                {/* Tooltip Overlay when Hovering a Radar Blip */}
                <AnimatePresence>
                  {activeBlip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-4 left-4 right-4 z-40 p-3 rounded-2xl bg-zinc-900/90 text-white border border-white/10 shadow-2xl backdrop-blur-xl text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={activeBlip.avatar}
                          alt={activeBlip.name}
                          className="w-9 h-9 rounded-full ring-1 ring-white/20 bg-zinc-800"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs truncate">{activeBlip.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                              Year {activeBlip.year}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-300 truncate">
                            {activeBlip.department} • {activeBlip.distance}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Radar Status info */}
              <div className="w-full mt-2 flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>Campuses: AAU (4 Kilo, 5 Kilo, 6 Kilo, CHS)</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              {/* Primary Match CTA Button */}
              <button
                type="button"
                id="primary-match-cta"
                onClick={handleStartMatching}
                className="w-full mt-5 py-3.5 px-6 rounded-2xl bg-[#4A7BB0] hover:bg-[#386292] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer group select-none"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>Launch Match Radar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>

              <button
                type="button"
                onClick={() => launchLiveRoom()}
                className="w-full mt-2 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Or jump straight into instant queue →
              </button>
            </div>

            {/* Safety & Student Integrity Card */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-white/10 flex items-start gap-3 text-xs text-zinc-500 dark:text-zinc-400 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#4A7BB0] dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Safe University Space: </span>
                Every peer is verified using official institution credentials. Harassment results in permanent suspension.
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Floating Quick Match Action Bar (lg:hidden) */}
        {!isSearching && (
          <div className="lg:hidden fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-4 pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
              <button
                type="button"
                id="mobile-floating-match-cta"
                onClick={handleStartMatching}
                className="w-full py-3.5 px-5 rounded-2xl bg-zinc-900/90 dark:bg-white/95 text-white dark:text-zinc-900 font-semibold text-xs shadow-xl backdrop-blur-md border border-white/20 dark:border-black/10 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer select-none font-sf-pro"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Launch Match Radar</span>
                </div>
                <span className="text-[11px] bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded-full font-mono font-semibold">
                  ~3.8s match
                </span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ── SEARCHING, MATCHED & EMPTY STATE MODAL OVERLAY ── */}
      <AnimatePresence>
        {isSearching && (
          <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="match-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sf-pro"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-2xl relative overflow-hidden text-center"
            >
              {/* Close Button */}
              <button
                type="button"
                aria-label="Close match dialog"
                onClick={() => setIsSearching(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A7BB0]"
              >
                <X className="w-5 h-5" />
              </button>

              {searchFailed ? (
                /* Empty / No Match Found State */
                <div className="space-y-5 py-4">
                  <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 id="match-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
                      No Exact Match Right Now
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      No online peers match all your strict filters at this moment. Broaden your department or year preferences to connect immediately.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleResetFilters();
                        handleStartMatching();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#4A7BB0] hover:bg-[#386292] text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Broaden Filters &amp; Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => launchLiveRoom()}
                      className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    >
                      Jump into Instant Queue
                    </button>
                  </div>
                </div>
              ) : !matchedCandidate ? (
                /* Scanning State */
                <div className="space-y-6 py-4">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <span className="animate-ping absolute inset-0 rounded-full bg-blue-500/20" />
                    <span className="animate-pulse absolute inset-2 rounded-full bg-blue-500/15" />
                    <div className="relative w-16 h-16 rounded-full bg-blue-50 text-[#4A7BB0] dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center shadow-md">
                      <RefreshCw className="w-7 h-7 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 id="match-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {searchStep === 0 && "Scanning AAU Campus Network..."}
                      {searchStep === 1 && "Filtering Target Department & Year..."}
                      {searchStep === 2 && "Calculating Compatibility Score..."}
                      {searchStep === 3 && "Finalizing Match Connection..."}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                      Searching active Ethiopian student nodes based on your chosen criteria.
                    </p>
                  </div>

                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-[#4A7BB0] h-full rounded-full"
                      initial={{ width: "10%" }}
                      animate={{
                        width:
                          searchStep === 0 ? "30%" : searchStep === 1 ? "60%" : searchStep === 2 ? "85%" : "100%",
                      }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSearching(false)}
                    className="text-xs font-semibold text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    Cancel Search
                  </button>
                </div>
              ) : (
                /* Match Found State! */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 py-2"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Match Found!</span>
                  </div>

                  {/* Profile Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3.5 shadow-2xs">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={matchedCandidate.avatar}
                          alt={matchedCandidate.name}
                          className="w-18 h-18 rounded-full ring-3 ring-[#4A7BB0]/40 object-cover shadow-md bg-zinc-800"
                        />
                        <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                      </div>
                      <h4 className="mt-2.5 font-bold text-base text-zinc-900 dark:text-white">
                        {matchedCandidate.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {matchedCandidate.university} • Year {matchedCandidate.year}
                      </p>
                      <p className="text-xs font-semibold text-[#4A7BB0] dark:text-blue-400 mt-0.5">
                        {matchedCandidate.department}
                      </p>
                    </div>

                    {/* Compatibility Pill */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-xs">
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Mutual Compatibility</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                        {matchedCandidate.compatibilityScore}%
                      </span>
                    </div>

                    {/* Shared Hobbies */}
                    {matchedCandidate.sharedHobbies && matchedCandidate.sharedHobbies.length > 0 && (
                      <div className="space-y-1 text-left">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">Shared Interests</div>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedCandidate.sharedHobbies.map((h: string) => (
                            <span
                              key={h}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60"
                            >
                              ★ {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => launchLiveRoom("video")}
                      className="w-full py-3 px-4 rounded-xl bg-[#4A7BB0] hover:bg-[#386292] text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Connect via Live Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => launchLiveRoom("text")}
                      className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Start Text Chat Instead</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartMatching()}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium pt-1 cursor-pointer"
                    >
                      Skip &amp; Find Another Match
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
