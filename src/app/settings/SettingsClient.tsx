"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, Edit, Globe, GraduationCap, Lock, Loader2, X, User, FileText, Sparkles, RefreshCw } from "lucide-react";
import { AppMenu } from "@/components/AppMenu";
import { updateVisibility, updateThemeColor, VisibilityType, changePassword, updateProfile, updateAvatar, rollRandomAvatar } from "./actions";
import { getThemeGradient } from "@/lib/themes";
import { updatePersonalDetails } from "@/app/profile/actions";
import { AAU_DEPARTMENTS } from "@/app/profile/constants";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { resolveUserAvatar, getAvatarPool } from "@/lib/avatars";

export default function SettingsClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("account");
  const [chatPreference, setChatPreference] = useState(true);
  const [visibility, setVisibility] = useState<VisibilityType>(user?.visibility || "PUBLIC");
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [themeColor, setThemeColor] = useState(user?.themeColor || "#9fb8d3");
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  // Avatar state
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>(() => resolveUserAvatar(user));
  const [isRollingAvatar, setIsRollingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const avatarPool = getAvatarPool(user?.gender);

  // Bio / display name (local state synced with DB)
  const [bio, setBio] = useState(user?.bio || "");
  const [displayName, setDisplayName] = useState(
    user?.displayName ||
    (user?.email?.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "")
  );

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalBio, setModalBio] = useState(bio);
  const [modalDisplayName, setModalDisplayName] = useState(displayName);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Inline editing state (Major / Year)
  const [isEditingMajor, setIsEditingMajor] = useState(false);
  const [dept, setDept] = useState(user?.department || "");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  const [isEditingYear, setIsEditingYear] = useState(false);
  const [year, setYear] = useState<number | null>(user?.year || null);

  const [savingDetails, setSavingDetails] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Escape key closes open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPasswordModal) setShowPasswordModal(false);
        if (showAvatarModal) setShowAvatarModal(false);
        if (showEditModal) setShowEditModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPasswordModal, showAvatarModal, showEditModal]);

  const THEME_COLORS = [
    "#9fb8d3", "#93cfb3", "#9ee5a8", "#dbdef2", "#7e8fa6",
    "#fcb7b6", "#fbbb8b", "#fee296", "#e3cbdc", "#f2f1fa"
  ];

  // Scroll reveal refs
  const profileCardRef = useScrollReveal<HTMLDivElement>();
  const uniCardRef = useScrollReveal<HTMLDivElement>();
  const colorCardRef = useScrollReveal<HTMLDivElement>();
  const securityCardRef = useScrollReveal<HTMLDivElement>();
  const visibilityCardRef = useScrollReveal<HTMLDivElement>();
  const chatPrefCardRef = useScrollReveal<HTMLDivElement>();

  const avatarUrl = currentAvatarUrl;

  const handleRollAvatar = async () => {
    if (isRollingAvatar) return;
    setIsRollingAvatar(true);
    try {
      const res = await rollRandomAvatar();
      if (res?.avatarUrl) {
        setCurrentAvatarUrl(res.avatarUrl);
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRollingAvatar(false);
    }
  };

  const handleSelectAvatar = async (url: string) => {
    setIsRollingAvatar(true);
    try {
      await updateAvatar(url);
      setCurrentAvatarUrl(url);
      setShowAvatarModal(false);
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRollingAvatar(false);
    }
  };


  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleThemeChange = async (color: string) => {
    if (themeColor === color) return;
    setThemeColor(color);
    setIsUpdatingTheme(true);
    try { await updateThemeColor(color); } catch (e) { console.error(e); }
    setIsUpdatingTheme(false);
  };

  const handleVisibilityChange = async (newVisibility: VisibilityType) => {
    if (visibility === newVisibility) return;
    setIsUpdatingVisibility(true);
    try {
      await updateVisibility(newVisibility);
      setVisibility(newVisibility);
    } catch (e) { console.error(e); }
    setIsUpdatingVisibility(false);
  };

  const handleSaveMajor = async () => {
    setSavingDetails(true);
    try {
      await updatePersonalDetails({ department: dept, year: user?.year });
      setIsEditingMajor(false);
      if (user) user.department = dept;
    } catch (e) { console.error(e); }
    setSavingDetails(false);
  };

  const handleSaveYear = async () => {
    setSavingDetails(true);
    try {
      await updatePersonalDetails({ department: dept, year });
      setIsEditingYear(false);
      if (user) user.year = year;
    } catch (e) { console.error(e); }
    setSavingDetails(false);
  };

  const openEditModal = () => {
    setModalBio(bio);
    setModalDisplayName(displayName);
    setProfileSaved(false);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ bio: modalBio, displayName: modalDisplayName });
      setBio(modalBio);
      setDisplayName(modalDisplayName);
      setProfileSaved(true);
      setTimeout(() => {
        setShowEditModal(false);
        setProfileSaved(false);
      }, 1200);
    } catch (e) { console.error(e); }
    setSavingProfile(false);
  };

  const handlePasswordSubmit = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setIsSubmittingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (e: any) {
      setPasswordError(e.message || "Failed to change password");
    }
    setIsSubmittingPassword(false);
  };

  // ── Decorative SVG components ──────────────────────────────────────────

  const DecorativeWaves = () => (
    <div className="absolute bottom-[-15%] left-[-15%] w-[130%] h-[85%] z-0 pointer-events-none overflow-hidden rounded-b-[28px]">
      <svg viewBox="0 0 300 150" preserveAspectRatio="none" className="w-full h-full" style={{ transform: 'rotate(-23.04deg) scale(1.15)', transformOrigin: 'center' }}>
        <path d="M0,50 Q25,0 50,50 T100,50 T150,50 T200,50 T250,50 T300,50 L300,150 L0,150 Z" fill="#9B8AE0" />
        <path d="M0,70 Q25,20 50,70 T100,70 T150,70 T200,70 T250,70 T300,70 L300,150 L0,150 Z" fill="#B7B0EB" />
        <path d="M0,90 Q25,40 50,90 T100,90 T150,90 T200,90 T250,90 T300,90 L300,150 L0,150 Z" fill="#8DD2E3" />
        <path d="M0,110 Q25,60 50,110 T100,110 T150,110 T200,110 T250,110 T300,110 L300,150 L0,150 Z" fill="#90D8D4" />
      </svg>
    </div>
  );

  const PrivacyWaves = () => (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[32px]">
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="w-full h-full scale-[1.05] origin-bottom">
        <path d="M250,400 C 350,250, 500,280, 600,320 C 700,360, 850,0, 1000,0 L1000,400 Z" fill="#8F82D9" />
        <path d="M300,400 C 400,300, 550,320, 650,360 C 750,400, 900,50, 1000,50 L1000,400 Z" fill="#9D92E3" />
        <path d="M350,400 C 450,350, 600,350, 700,390 C 800,430, 950,100, 1000,100 L1000,400 Z" fill="#AFAAEB" />
        <path d="M400,400 C 500,380, 650,380, 750,420 C 850,460, 980,180, 1000,180 L1000,400 Z" fill="#8BB1E7" />
      </svg>
    </div>
  );

  const ChatWaves = () => (
    <div className="absolute bottom-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden rounded-b-[24px]">
      <svg viewBox="0 0 501 158" preserveAspectRatio="none" className="absolute left-0 w-full h-[158px] translate-y-[40px]" style={{ bottom: '38px', zIndex: 1 }}>
        <path d="M0,158 L0,110 C 40,100 80,30 150,30 C 220,30 280,130 360,130 C 420,130 460,70 501,90 L501,158 Z" fill="#7D79D0" />
      </svg>
      <svg viewBox="0 0 501 158" preserveAspectRatio="none" className="absolute left-0 w-full h-[158px] translate-y-[40px]" style={{ bottom: '19px', zIndex: 2 }}>
        <path d="M0,158 L0,110 C 40,100 80,30 150,30 C 220,30 280,130 360,130 C 420,130 460,70 501,90 L501,158 Z" fill="#7989D0" />
      </svg>
      <svg viewBox="0 0 501 158" preserveAspectRatio="none" className="absolute left-0 w-full h-[158px] translate-y-[40px]" style={{ bottom: '0px', zIndex: 3 }}>
        <path d="M0,158 L0,110 C 40,100 80,30 150,30 C 220,30 280,130 360,130 C 420,130 460,70 501,90 L501,158 Z" fill="#799FD0" />
      </svg>
    </div>
  );

  const bgGradient = getThemeGradient(themeColor, user?.gender);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative z-10 w-full flex flex-col items-center min-h-screen transition-colors duration-500 font-sf-pro"
      style={{ background: bgGradient }}
    >
      <AppMenu />

      <main className="max-w-[1040px] mx-auto pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-20 px-4 md:px-8 w-full pt-12 mt-4 font-sf-pro">

        {/* Header & Tabs */}
        <div className="mb-6 pl-2 flex flex-col md:flex-row md:items-baseline gap-6 md:gap-24 justify-center md:justify-start">
          <h1 className="text-[28px] sm:text-[32px] leading-tight font-medium tracking-tight text-zinc-900 dark:text-zinc-100 font-sf-pro">Settings</h1>
          <div className="flex gap-12 mt-2 md:mt-0 justify-center">
            {["account", "privacy"].map((tab) => (
              <div key={tab} className="relative pb-2.5 cursor-pointer group select-none" onClick={() => setActiveTab(tab)}>
                <span className={`text-[17px] transition-colors capitalize ${activeTab === tab ? "text-zinc-900 dark:text-white font-semibold" : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-medium"}`}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#8E97F8] dark:bg-[#A5B4FC] rounded-full shadow-xs" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── ACCOUNT TAB ── */}
        {activeTab === "account" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* Profile Card */}
            <div ref={profileCardRef} className="reveal bg-white dark:bg-[rgba(24,24,31,0.82)] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[28px] p-6 sm:p-8 md:p-10 mb-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center gap-8 md:gap-10 relative z-20">

              {/* Avatar */}
              <div className="relative shrink-0 ml-4 group">
                <div
                  onClick={() => setShowAvatarModal(true)}
                  className="w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-[6px] border-white dark:border-zinc-800 overflow-hidden bg-gradient-to-br from-[#e8edf5] to-[#d5def2] cursor-pointer relative"
                  title="Click to choose from the avatar collection"
                >
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                    }}
                  />
                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[12px] font-bold gap-1 backdrop-blur-[2px]">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Change</span>
                  </div>
                  {/* Fallback initial */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6b7ff0] to-[#5b8dee] hidden items-center justify-center text-[48px] font-bold text-white">
                    {displayName?.[0]?.toUpperCase() || "A"}
                  </div>
                </div>
                {/* Small verified badge */}
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-[#3b82f6] rounded-full border-[3px] border-white dark:border-zinc-800 flex items-center justify-center shadow-sm pointer-events-none">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>

              {/* Info & Actions */}
              <div className="flex-1 w-full text-center md:text-left mt-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                  <h2 className="text-[30px] font-medium tracking-tight text-[var(--foreground)]">{displayName}</h2>
                  {avatarSuccess && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Avatar Updated
                    </motion.span>
                  )}
                </div>

                {/* Bio preview */}
                <p className="text-[14px] text-[var(--muted)] mb-4 max-w-[420px] leading-relaxed min-h-[20px]">
                  {bio || <span className="italic text-[var(--muted)]">No bio yet — add one in Edit Profile</span>}
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {/* Edit Profile Button */}
                  <button
                    onClick={openEditModal}
                    className="relative px-7 py-2.5 rounded-full overflow-hidden text-[15px] font-semibold text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #8E97F8 0%, #6b7ff0 50%, #5b8dee 100%)" }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </span>
                  </button>

                  {/* Shuffle Avatar Button */}
                  <button
                    onClick={handleRollAvatar}
                    disabled={isRollingAvatar}
                    className="relative px-5 py-2.5 rounded-full text-[14px] font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/60 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                    title="Roll random avatar based on gender"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#8E97F8] ${isRollingAvatar ? "animate-spin" : ""}`} />
                    <span>{isRollingAvatar ? "Randomizing..." : "Shuffle Avatar"}</span>
                  </button>

                  {/* Choose Avatar Button */}
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="relative px-5 py-2.5 rounded-full text-[14px] font-semibold text-zinc-700 dark:text-zinc-200 bg-white/90 dark:bg-zinc-800/90 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/60 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Choose Avatar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(140px,220px)_1fr] gap-6 items-stretch">

              {/* Left Card: University Information */}
              <div ref={uniCardRef} className="reveal reveal-delay-1 card-float bg-white dark:bg-[rgba(24,24,31,0.82)] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[24px] shadow-[0_10px_20px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] relative flex flex-col h-auto min-h-[309px]">
                <div className="absolute bottom-0 left-0 w-full h-[85%] z-[1] pointer-events-none">
                  <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,250 C 150,250 200,400 350,400 C 500,400 550,250 650,250 C 750,250 800,450 900,450 C 950,450 950,150 1000,200 L1000,600 L0,600 Z" fill="#7D79D0" />
                    <path d="M0,340 C 150,340 200,490 350,490 C 500,490 550,340 650,340 C 750,340 800,540 900,540 C 950,540 950,240 1000,290 L1000,600 L0,600 Z" fill="#7989D0" />
                    <path d="M0,430 C 150,430 200,580 350,580 C 500,580 550,430 650,430 C 750,430 800,630 900,630 C 950,630 950,330 1000,380 L1000,600 L0,600 Z" fill="#799FD0" />
                    <path d="M0,520 C 150,520 200,670 350,670 C 500,670 550,520 650,520 C 750,520 800,670 900,670 C 950,670 950,420 1000,470 L1000,600 L0,600 Z" fill="#79C4D0" />
                  </svg>
                </div>

                <div className="relative z-10 p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-[10px] mb-1">
                    <img src="/assets/emojis/unamused-face.png" className="w-[30px] h-[30px] drop-shadow-sm" alt="😒" />
                    <h3 className="text-[20px] font-bold text-[var(--foreground)] tracking-tight">University Information</h3>
                  </div>

                  <div className="flex flex-col gap-[10px] w-full">
                    {/* University sub-card */}
                    <div className="w-full bg-white/60 dark:bg-zinc-900/70 backdrop-blur-[10px] border border-white/50 dark:border-white/10 rounded-[16px] px-4 py-3 shadow-xs flex flex-col gap-1">
                      <div className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 leading-none">University</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-[4px] h-[4px] rounded-full bg-zinc-900 dark:bg-zinc-100" />
                        <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">{user?.university?.name || "Not Set"}</div>
                      </div>
                    </div>

                    {/* Major sub-card */}
                    <div className="w-full bg-white/60 dark:bg-zinc-900/70 backdrop-blur-[10px] border border-white/50 dark:border-white/10 rounded-[16px] px-4 py-3 relative shadow-xs flex flex-col gap-1">
                      <div className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 leading-none">Major</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-[4px] h-[4px] rounded-full bg-zinc-900 dark:bg-zinc-100 shrink-0" />
                        <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 truncate pr-6">{dept || "Not Set"}</div>
                      </div>
                      <button
                        disabled={savingDetails}
                        onClick={() => isEditingMajor ? handleSaveMajor() : setIsEditingMajor(true)}
                        className="absolute top-[12px] right-[14px] text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-opacity disabled:opacity-30 cursor-pointer"
                      >
                        {isEditingMajor
                          ? (savingDetails ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Check className="w-[14px] h-[14px]" strokeWidth={2.5} />)
                          : <Edit className="w-[14px] h-[14px]" strokeWidth={2} />}
                      </button>
                    </div>

                    {/* Major inline editor — shows ALL departments immediately on open, with search filter */}
                    <AnimatePresence>
                      {isEditingMajor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          style={{ overflow: "visible" }}
                          className="w-full"
                        >
                          <div className="relative">
                            <input
                              value={dept}
                              onChange={e => { setDept(e.target.value); setShowDeptDropdown(true); }}
                              onFocus={() => setShowDeptDropdown(true)}
                              onBlur={() => setTimeout(() => setShowDeptDropdown(false), 220)}
                              placeholder="Search or pick a department..."
                              className="w-full bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-2.5 text-[14px] font-medium text-[#111111] outline-none focus:border-[#9fb8d3] focus:bg-white/80 transition-all placeholder:text-[#999]"
                              autoFocus
                            />
                            {/* Dropdown — always shows when focused, filtered by typed text */}
                            <AnimatePresence>
                              {showDeptDropdown && (
                                <motion.ul
                                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-zinc-900 border border-[#e5e7eb] dark:border-zinc-700 rounded-2xl shadow-2xl max-h-52 overflow-y-auto z-[200] p-2 space-y-0.5 list-none m-0 font-sf-pro"
                                >
                                  {AAU_DEPARTMENTS
                                    .filter(d => !dept || d.toLowerCase().includes(dept.toLowerCase()))
                                    .map(d => (
                                    <li
                                      key={d}
                                      onMouseDown={(e) => { e.preventDefault(); setDept(d); setShowDeptDropdown(false); }}
                                      className={`px-3 py-2 rounded-xl cursor-pointer transition-colors font-medium text-[13px] flex items-center justify-between group ${d === dept ? 'bg-[#eef1ff] dark:bg-zinc-800 text-[#8E97F8]' : 'hover:bg-[#f5f7ff] dark:hover:bg-zinc-800/60 text-zinc-900 dark:text-zinc-200'}`}
                                    >
                                      <span>{d}</span>
                                      {d === dept && <Check className="w-3.5 h-3.5 text-[#8E97F8] shrink-0" strokeWidth={2.5} />}
                                    </li>
                                  ))}
                                  {AAU_DEPARTMENTS.filter(d => !dept || d.toLowerCase().includes(dept.toLowerCase())).length === 0 && (
                                    <li className="px-3 py-3 text-center text-[13px] text-zinc-400 dark:text-zinc-500 font-medium font-sf-pro">No matching department</li>
                                  )}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Status sub-card */}
                    <div className="w-full bg-white/60 dark:bg-zinc-900/70 backdrop-blur-[10px] border border-white/50 dark:border-white/10 rounded-[16px] px-4 py-3 relative shadow-xs flex flex-col gap-1">
                      <div className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 leading-none">Status</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-[4px] h-[4px] rounded-full bg-zinc-900 dark:bg-zinc-100 shrink-0" />
                        <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 pr-6">
                          {year ? (['1st', '2nd', '3rd', '4th', '5th', '6th'][year - 1] + ' Year') : "Not Set"}
                        </div>
                      </div>
                      <button
                        disabled={savingDetails}
                        onClick={() => isEditingYear ? handleSaveYear() : setIsEditingYear(true)}
                        className="absolute top-[12px] right-[14px] text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-opacity disabled:opacity-30 cursor-pointer"
                      >
                        {isEditingYear
                          ? (savingDetails ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Check className="w-[14px] h-[14px]" strokeWidth={2.5} />)
                          : <Edit className="w-[14px] h-[14px]" strokeWidth={2} />}
                      </button>
                    </div>

                    {/* Year picker */}
                    <AnimatePresence>
                      {isEditingYear && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="w-full overflow-hidden"
                        >
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            {[1, 2, 3, 4, 5, 6].map(y => {
                              const labels = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
                              const isSelected = year === y;
                              return (
                                <button
                                  key={y}
                                  onClick={() => setYear(y)}
                                  className={`py-2 rounded-xl text-[13px] font-bold transition-all ${isSelected ? 'bg-[#111111] text-white shadow-md scale-[1.04]' : 'bg-white/50 text-[#111111] border border-white/60 hover:bg-white/80'}`}
                                >
                                  {labels[y - 1]} Year
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Middle Card: Color */}
              <div ref={colorCardRef} className="reveal reveal-delay-2 card-float bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,rgba(24,24,31,0.82))] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[28px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center h-[309px]">
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <img src="/assets/emojis/artist-palette.png" className="inline-block w-[28px] h-[28px] align-middle" alt="🎨" />
                    <h3 className="text-[17px] font-semibold text-[var(--foreground)]">Color</h3>
                  </div>
                  <p className="text-[11px] font-medium text-[var(--muted)] leading-tight max-w-[120px]">Choose your preference color</p>
                </div>

                <div className="flex gap-6 items-stretch justify-center h-[180px]">
                  <div className="flex flex-col justify-between py-1">
                    {THEME_COLORS.slice(0, 5).map(color => (
                      <div
                        key={color}
                        onClick={() => handleThemeChange(color)}
                        className={`w-[28px] h-[28px] rounded-full cursor-pointer hover:scale-110 transition-transform ${themeColor === color ? 'border-[3px] border-[var(--foreground)] shadow-md scale-110' : 'border border-[rgba(0,0,0,0.05)]'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="w-[1px] bg-[var(--border)] h-full" />
                  <div className="flex flex-col justify-between py-1">
                    {THEME_COLORS.slice(5, 10).map(color => (
                      <div
                        key={color}
                        onClick={() => handleThemeChange(color)}
                        className={`w-[28px] h-[28px] rounded-full cursor-pointer hover:scale-110 transition-transform ${themeColor === color ? 'border-[3px] border-[var(--foreground)] shadow-md scale-110' : 'border border-[rgba(0,0,0,0.05)]'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Card: Security */}
              <div ref={securityCardRef} className="reveal reveal-delay-3 card-float bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,rgba(24,24,31,0.82))] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[28px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] relative flex flex-col overflow-hidden h-[309px]">
                <DecorativeWaves />
                <div className="p-5 relative z-10 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <img src="/assets/emojis/id-card.png" className="inline-block w-[28px] h-[28px] align-middle" alt="🪪" />
                    <h3 className="text-[17px] font-semibold text-[var(--foreground)]">Security</h3>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center mt-1">
                    <h4 className="text-[24px] font-medium text-[var(--foreground)] mb-1.5 tracking-tight">Password</h4>
                    <p className="text-[13px] text-[#748cc1] font-medium mb-4">Last changed 1 month ago</p>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="px-8 py-3 rounded-full bg-white/80 dark:bg-white/15 backdrop-blur-[7px] border border-white/60 dark:border-white/20 shadow-md hover:bg-white dark:hover:bg-white/25 transition-all btn-lift cursor-pointer"
                    >
                      <span className="text-[14px] font-bold text-zinc-900 dark:text-white">Change Password</span>
                    </button>
                  </div>
                  <div className="w-full h-[1px] bg-[#9ca3af] my-3 opacity-50" />
                  <div className="flex items-center gap-2 justify-center pb-1">
                    <img src="/assets/emojis/megaphone.png" className="inline-block w-[24px] h-[24px] align-middle" alt="📣" />
                    <span className="text-[14px] font-bold text-[var(--foreground)]">Status: Active Student</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRIVACY TAB ── */}
        {activeTab === "privacy" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Profile Visibility */}
            <div ref={visibilityCardRef} className="reveal bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,rgba(24,24,31,0.82))] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[32px] p-8 md:p-10 mb-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] relative overflow-hidden z-20 min-h-[360px] flex flex-col card-float">
              <PrivacyWaves />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8 pl-2">
                  <img src="/assets/emojis/eye.png" className="inline-block w-[32px] h-[32px] align-middle" alt="👁️" />
                  <h2 className="text-[24px] font-bold text-[var(--foreground)] tracking-tight">Profile Visibility</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-stretch">
                  {(["PUBLIC", "CAMPUS", "PRIVATE"] as VisibilityType[]).map((vis) => {
                    const isSelected = visibility === vis;
                    const Icon = vis === "PUBLIC" ? Globe : vis === "CAMPUS" ? GraduationCap : Lock;
                    const desc = vis === "PUBLIC" ? "Anyone on the app\ncan see you" : vis === "CAMPUS" ? "Only peoples from\nyour university" : "You won't be seen\non the app";
                    return (
                      <div
                        key={vis}
                        onClick={() => handleVisibilityChange(vis)}
                        className={`bg-white/30 dark:bg-white/10 backdrop-blur-[10px] rounded-[16px] border-[2px] p-6 min-h-[160px] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.3)] flex flex-col justify-between relative overflow-hidden h-full cursor-pointer transition-all ${isSelected ? "border-[var(--foreground)] bg-white/50 dark:bg-white/20 scale-[1.02]" : "border-[rgba(255,255,255,0.2)] hover:bg-white/40 dark:hover:bg-white/15 hover:scale-[1.02]"}`}
                      >
                        <div className="relative z-10 flex flex-col items-center flex-1">
                          <Icon className="w-8 h-8 mb-3 text-[var(--foreground)]" />
                          <h3 className="text-[17px] font-bold mb-2 text-[var(--foreground)]">{vis.charAt(0) + vis.slice(1).toLowerCase()}</h3>
                          <p className="text-[13px] text-center font-medium leading-[1.3] text-[var(--muted-strong)] whitespace-pre-line">{desc}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 bg-[var(--foreground)] rounded-full p-1 shadow-md z-10">
                            <Check className="w-3.5 h-3.5 text-[var(--background)]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex flex-col md:flex-row justify-between items-end mt-8">
              <div ref={chatPrefCardRef} className="reveal reveal-delay-1 bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,rgba(24,24,31,0.82))] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[24px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] relative overflow-hidden w-[360px] min-h-[200px] card-float">
                <ChatWaves />
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-6 text-[#87786B]">
                    <img src="/assets/emojis/chat-bubble.png" className="inline-block w-[32px] h-[32px] align-middle" alt="💬" />
                    <h3 className="text-[17px] font-bold text-[var(--foreground)]">Chat Preference</h3>
                  </div>
                  <div className="flex justify-between items-start pr-2">
                    <div>
                      <h4 className="text-[15px] font-bold text-[var(--foreground)] mb-1">Allow direct chat</h4>
                      <p className="text-[12px] text-white font-semibold leading-[1.4] max-w-[160px] drop-shadow-sm">Receive message while<br />meeting new people's</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={chatPreference}
                      aria-label="Allow direct chat"
                      className={`w-[46px] h-[26px] rounded-full flex items-center px-1 cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${chatPreference ? 'bg-[#8E97F8]' : 'bg-[#E5E7EB]'}`}
                      onClick={() => setChatPreference(!chatPreference)}
                    >
                      <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transform transition-transform ${chatPreference ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <button className="bg-[#EA7C7C] text-[#222222] font-semibold text-[14px] px-8 py-3 rounded-full hover:bg-[#E36868] transition-colors mt-6 md:mt-0 shadow-sm mr-8 btn-lift">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ── PASSWORD MODAL ── */}
        <AnimatePresence>
          {showPasswordModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl flex flex-col gap-5 relative overflow-hidden font-sf-pro"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#f4f4f8] dark:bg-zinc-800 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-sf-pro">Change Password</h2>
                </div>
                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 dark:bg-red-950/40 dark:border-red-800 text-red-600 dark:text-red-300 text-sm font-medium">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-100 dark:bg-green-950/40 dark:border-green-800 text-green-700 dark:text-green-300 text-sm font-medium">Password updated successfully!</div>
                )}
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Current Password", value: currentPassword, setter: setCurrentPassword, placeholder: "Enter current password" },
                    { label: "New Password", value: newPassword, setter: setNewPassword, placeholder: "Enter new password" },
                    { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, placeholder: "Confirm new password" },
                  ].map(({ label, value, setter, placeholder }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1 font-sf-pro">{label}</label>
                      <input
                        type="password"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full bg-[#f8fafc] dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl px-5 py-4 text-[15px] font-medium outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#9fb8d3] transition-colors font-sf-pro"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowPasswordModal(false)} className="px-6 py-3 rounded-full text-[15px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-sf-pro">Cancel</button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isSubmittingPassword}
                    className="px-8 py-3 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[15px] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2 font-sf-pro cursor-pointer"
                  >
                    {isSubmittingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Password
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EDIT PROFILE MODAL ── */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[6px]"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.88, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.88, y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[520px] rounded-[36px] overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25)] bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 font-sf-pro"
              >
                {/* Modal gradient background */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-[#f8f6ff] via-[#eef2ff] to-[#f0faf5] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950"
                />
                {/* Decorative blobs */}
                <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[#8E97F8]/30 to-[#5b8dee]/20 blur-[40px] pointer-events-none" />
                <div className="absolute bottom-[-40px] left-[-40px] w-[160px] h-[160px] rounded-full bg-gradient-to-tr from-[#90D8D4]/30 to-[#9B8AE0]/20 blur-[35px] pointer-events-none" />

                <div className="relative z-10 p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8E97F8, #5b8dee)" }}>
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight font-sf-pro">Edit Profile</h2>
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium font-sf-pro">Update how others see you</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setShowEditModal(false)}
                      className="w-9 h-9 rounded-full bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border border-white/50 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                    >
                      <X className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                    </motion.button>
                  </div>

                  {/* Avatar preview */}
                  <div className="flex flex-col items-center justify-center mb-6 gap-2">
                    <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                        className="w-[100px] h-[100px] rounded-full overflow-hidden border-[5px] border-white dark:border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-gradient-to-br from-[#e8edf5] to-[#d5def2]"
                      >
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold backdrop-blur-[1px]">
                          <span>Choose</span>
                        </div>
                      </motion.div>
                      {/* Verified badge */}
                      <div className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-[#3b82f6] rounded-full border-[3px] border-white dark:border-zinc-800 flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRollAvatar}
                        disabled={isRollingAvatar}
                        className="text-[12px] font-semibold text-[#8E97F8] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRollingAvatar ? "animate-spin" : ""}`} />
                        Shuffle
                      </button>
                      <span className="text-zinc-300 dark:text-zinc-600">•</span>
                      <button
                        type="button"
                        onClick={() => setShowAvatarModal(true)}
                        className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer"
                      >
                        Choose from 30
                      </button>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="flex flex-col gap-4">
                    {/* Display Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 text-[13px] font-bold text-zinc-600 dark:text-zinc-300 ml-1 uppercase tracking-wide font-sf-pro">
                        <User className="w-3.5 h-3.5" />
                        Display Name
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.15 }}
                        type="text"
                        value={modalDisplayName}
                        onChange={(e) => setModalDisplayName(e.target.value)}
                        placeholder="How should people call you?"
                        maxLength={40}
                        className="w-full bg-white/80 dark:bg-zinc-800/90 backdrop-blur-sm rounded-2xl px-5 py-3.5 text-[15px] font-medium outline-none border-[2px] border-transparent focus:border-[#8E97F8] dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-sf-pro"
                      />
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 ml-1 text-right">{modalDisplayName.length}/40</span>
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 text-[13px] font-bold text-zinc-600 dark:text-zinc-300 ml-1 uppercase tracking-wide font-sf-pro">
                        <FileText className="w-3.5 h-3.5" />
                        Bio
                      </label>
                      <motion.textarea
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.15 }}
                        value={modalBio}
                        onChange={(e) => setModalBio(e.target.value)}
                        placeholder="Tell people a little about yourself…"
                        maxLength={160}
                        rows={4}
                        className="w-full bg-white/80 dark:bg-zinc-800/90 backdrop-blur-sm rounded-2xl px-5 py-3.5 text-[15px] font-medium outline-none border-[2px] border-transparent focus:border-[#8E97F8] dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none leading-relaxed font-sf-pro"
                      />
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 ml-1 text-right">{modalBio.length}/160</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-3 rounded-full text-[15px] font-bold text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-zinc-800 hover:bg-white/90 dark:hover:bg-zinc-700 transition-colors border border-white/40 dark:border-zinc-700 font-sf-pro cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="relative px-10 py-3 rounded-full text-[15px] font-bold text-white shadow-lg disabled:opacity-60 flex items-center gap-2 overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #8E97F8 0%, #6b7ff0 50%, #5b8dee 100%)" }}
                    >
                      {savingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : profileSaved ? (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4" strokeWidth={3} />
                          Saved!
                        </div>
                      ) : (
                        "Save Profile"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Avatar Picker Modal */}
          {showAvatarModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setShowAvatarModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="relative w-full max-w-2xl bg-white/95 dark:bg-[#18181f]/95 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative glows */}
                <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[#8E97F8]/30 to-[#5b8dee]/20 blur-[40px] pointer-events-none" />
                <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] rounded-full bg-gradient-to-tr from-[#90D8D4]/30 to-[#9B8AE0]/20 blur-[40px] pointer-events-none" />

                <div className="relative z-10 p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #8E97F8, #5b8dee)" }}>
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight font-sf-pro">
                          Choose Your Avatar
                        </h2>
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium font-sf-pro">
                          {user?.gender === "FEMALE" ? "Female" : user?.gender === "MALE" ? "Male" : "Official"} Verified Student Collection • 30 High-Res Avatars
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRollAvatar}
                        disabled={isRollingAvatar}
                        className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-[#8E97F8] bg-[#8E97F8]/10 hover:bg-[#8E97F8]/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Randomize avatar"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRollingAvatar ? "animate-spin" : ""}`} />
                        <span>Surprise Me</span>
                      </button>

                      <button
                        onClick={() => setShowAvatarModal(false)}
                        className="w-9 h-9 rounded-full bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border border-white/50 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                      </button>
                    </div>
                  </div>

                  {/* Avatars Grid */}
                  <div className="max-h-[52vh] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 sm:gap-4 p-1">
                      {avatarPool.map((url, idx) => {
                        const isSelected = currentAvatarUrl === url;
                        return (
                          <button
                            key={url}
                            onClick={() => handleSelectAvatar(url)}
                            className={`group relative aspect-square rounded-full p-1 transition-colors cursor-pointer ${
                              isSelected
                                ? "ring-3 ring-[#8E97F8] shadow-lg bg-[#8E97F8]/10"
                                : "hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-600"
                            }`}
                          >
                            <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#e8edf5] to-[#d5def2] border-2 border-white dark:border-zinc-800">
                              <img
                                src={url}
                                alt={`Avatar ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                            {isSelected && (
                              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#3b82f6] rounded-full border-2 border-white dark:border-zinc-800 flex items-center justify-center shadow-sm">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[12px] text-zinc-500 dark:text-zinc-400">
                    <span>Click any avatar to instantly set as your profile picture</span>
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(false)}
                      className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
