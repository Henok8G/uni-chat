"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Plus, Check } from "lucide-react";
import { updatePersonalDetails, addHobby, removeHobby } from "./actions";
import { KNOWN_HOBBIES, AAU_DEPARTMENTS } from "./constants";
import UserInfo from "@/components/profile/UserInfo";
import FrameComponent from "@/components/profile/FrameComponent";
import { AppMenu } from "@/components/AppMenu";
import { getThemeGradient, DEFAULT_THEME_COLOR } from "@/lib/themes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { resolveUserAvatar } from "@/lib/avatars";

/* ─── helpers ─── */

function yearLabel(y: number | null) {
  if (!y) return "—";
  const map: Record<number, string> = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year", 5: "5th Year", 6: "6th Year" };
  return map[y] ?? `${y}th Year`;
}

/* ─── types ─── */
interface ProfileData {
  id: string;
  email: string;
  plan: string;
  gender: string;
  department: string | null;
  hobbies: string[];
  year: number | null;
  university: { name: string } | null;
  themeColor: string | null;
  bio: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean | null;
  role?: string | null;
}

interface Props {
  profile: ProfileData;
  isDarkInit: boolean;
}

export default function ProfileClient({ profile, isDarkInit }: Props) {
  const router = useRouter();
  const [hobbies, setHobbies] = useState<string[]>(() => [...new Set(profile.hobbies)]);
  const [showAddHobby, setShowAddHobby] = useState(false);
  const [hobbyInput, setHobbyInput] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [dept, setDept] = useState(profile.department ?? "");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [year, setYear] = useState<number | null>(profile.year);
  const [saving, setSaving] = useState(false);
  const hobbyRef = useRef<HTMLInputElement>(null);

  // Scroll reveal refs
  const titleRef = useScrollReveal();
  const userInfoRef = useScrollReveal<HTMLDivElement>();
  const detailsRef = useScrollReveal<HTMLDivElement>();
  const hobbyCardRef = useScrollReveal<HTMLDivElement>();

  const [savedDept, setSavedDept] = useState(profile.department ?? "");
  const [savedYear, setSavedYear] = useState<number | null>(profile.year);

  /* Derived display values */
  const emailFallbackName = profile.email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const displayName = profile.displayName || emailFallbackName;
  const avatarUrl = resolveUserAvatar({
    ...profile,
    displayName,
  });
  const uniName = profile.university?.name ?? "Unknown University";
  const majorName = savedDept || "Not Set";

  /* ─── handlers ─── */
  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      await updatePersonalDetails({ department: dept, year });
      setSavedDept(dept);
      setSavedYear(year);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    setIsEditingDetails(false);
  };

  const handleAddHobby = async () => {
    const trimmed = hobbyInput.trim();
    if (!trimmed || hobbies.includes(trimmed)) return;
    const res = await addHobby(trimmed);
    if (res.ok) setHobbies(res.hobbies);
    setHobbyInput("");
    setShowAddHobby(false);
  };

  const handleRemoveHobby = async (h: string) => {
    const res = await removeHobby(h);
    if (res.ok) setHobbies(res.hobbies);
  };

  return (
    <div
      className="w-full relative flex flex-col items-center pt-1.5 sm:pt-2 px-0 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-16 box-border leading-[normal] tracking-[normal] min-h-screen transition-colors duration-500"
      style={{ background: getThemeGradient(profile.themeColor || DEFAULT_THEME_COLOR, profile.gender) }}
    >
      <AppMenu />

      {/* Main Profile Content */}
      <main className="w-full max-w-[1240px] flex flex-col items-start gap-6 sm:gap-7 pt-16 sm:pt-8 px-4 sm:px-6 lg:px-8 box-border">
        {/* Title */}
        <section ref={titleRef} className="reveal w-full flex items-start py-0 px-1 box-border text-left font-sf-pro">
          <h1 className="m-0 text-3xl sm:text-[34px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">Profile</h1>
        </section>

        {/* User Hero Info */}
        <div ref={userInfoRef} className="reveal reveal-delay-1 w-full">
          <UserInfo
            name={displayName}
            bio={profile.bio}
            avatarUrl={avatarUrl}
            avatarFallback={displayName[0]}
            onDetailsClick={() => document.getElementById("personal-details-card")?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
          />
        </div>

        {/* Details and Hobbies Row */}
        <section className="w-full flex flex-col mq750:flex-row items-stretch justify-center gap-6">

          {/* Personal Details Card */}
          <div
            id="personal-details-card"
            ref={detailsRef}
            className="reveal reveal-delay-2 flex-[2.5] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] rounded-[28px] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,rgba(24,24,31,0.82))] dark:backdrop-blur-xl dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] flex flex-col items-start pt-6 pb-6 px-5 sm:px-7 gap-5 min-w-0 overflow-hidden transition-all duration-300 card-float"
          >
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <img src="/assets/emojis/prince.png" className="inline-block w-[32px] h-[32px] align-middle drop-shadow-sm" alt="🤴🏽" />
                <h2 className="m-0 text-[22px] font-medium text-zinc-900 dark:text-zinc-100">Personal Details</h2>
              </div>
              <button
                onClick={() => isEditingDetails ? handleSaveDetails() : setIsEditingDetails(true)}
                className="cursor-pointer transition-all rounded-full px-6 py-2 text-[15px] font-medium text-[#15161c] dark:text-zinc-100 bg-white/30 dark:bg-white/10 backdrop-blur-[10px] border-[1px] border-[rgba(255,255,255,0.2)] dark:border-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.3)] hover:bg-white/40 dark:hover:bg-white/15 btn-lift"
              >
                {saving ? "..." : (isEditingDetails ? "Save" : "Edit")}
              </button>
            </div>

            {isEditingDetails ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-6">
                <div className="flex flex-col gap-2 relative">
                  <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Department</label>
                  <input
                    value={dept}
                    onChange={e => { setDept(e.target.value); setShowDeptDropdown(true); }}
                    onFocus={() => setShowDeptDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDeptDropdown(false), 220)}
                    placeholder="Search or pick a department..."
                    className="w-full bg-[#f8fafc] dark:bg-zinc-800 dark:border-zinc-700 dark:text-white rounded-xl p-4 text-base outline-none border border-zinc-200 focus:border-blue-400 transition-colors"
                  />
                  <AnimatePresence>
                    {showDeptDropdown && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto z-50 p-2 space-y-1 list-none m-0"
                      >
                        {AAU_DEPARTMENTS
                          .filter(d => !dept || d.toLowerCase().includes(dept.toLowerCase()))
                          .map(d => (
                          <li
                            key={d}
                            onMouseDown={() => { setDept(d); setShowDeptDropdown(false); }}
                            className={`p-3 rounded-lg cursor-pointer transition-colors font-medium text-[15px] flex items-center justify-between ${d === dept ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200'}`}
                          >
                            <span>{d}</span>
                            {d === dept && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                          </li>
                        ))}
                        {AAU_DEPARTMENTS.filter(d => !dept || d.toLowerCase().includes(dept.toLowerCase())).length === 0 && (
                          <li className="p-3 text-center text-[15px] text-zinc-400">No matching department</li>
                        )}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Year</label>
                  <select
                    value={year ?? ""}
                    onChange={e => setYear(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-[#f8fafc] dark:bg-zinc-800 dark:border-zinc-700 dark:text-white rounded-xl p-4 text-base outline-none border border-zinc-200 focus:border-blue-400 transition-colors"
                  >
                    {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y} className="dark:bg-zinc-805">{yearLabel(y)}</option>)}
                  </select>
                </div>
              </motion.div>
            ) : (
              <FrameComponent
                university={uniName}
                major={majorName}
                year={yearLabel(savedYear)}
              />
            )}
          </div>

          {/* Hobby Card */}
          <div
            ref={hobbyCardRef}
            className="reveal reveal-delay-3 flex-1 shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] rounded-[28px] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,rgba(24,24,31,0.82))] dark:backdrop-blur-xl dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] flex flex-col items-start pt-6 pb-6 px-6 sm:px-8 gap-5 min-w-[280px] overflow-hidden transition-all duration-300 card-float"
          >
            <div className="flex items-center gap-3.5">
              <img src="/assets/emojis/fire.png" className="inline-block w-[32px] h-[32px] align-middle drop-shadow-sm" alt="🔥" />
              <h2 className="m-0 text-[22px] font-medium text-zinc-900 dark:text-zinc-100">Hobby</h2>
            </div>

            <div className="w-full flex flex-wrap gap-3">
              <AnimatePresence>
                {hobbies.map((h) => (
                  <motion.div
                    key={h}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group relative rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-[10px] border-[1px] border-[rgba(255,255,255,0.2)] dark:border-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.3)] flex items-center py-2 px-5 cursor-default hover:bg-white/40 dark:hover:bg-white/15 transition-all duration-200"
                  >
                    <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 mix-blend-color-burn dark:mix-blend-normal">{h}</span>
                    <button
                      type="button"
                      aria-label={`Remove hobby ${h}`}
                      onClick={() => handleRemoveHobby(h)}
                      className="ml-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-red-500 rounded"
                    >
                      <X size={14} className="text-zinc-400 hover:text-red-500" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Hobby */}
              <div className="flex-shrink-0">
                {showAddHobby ? (
                  <div className="flex gap-2 items-center bg-white/30 dark:bg-white/10 backdrop-blur-[10px] rounded-full px-3 py-1 border-[1px] border-[rgba(255,255,255,0.2)] dark:border-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.3)]">
                    <select
                      value={hobbyInput}
                      onChange={e => setHobbyInput(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-24 py-1 text-zinc-800 dark:text-zinc-100 font-medium"
                    >
                      <option value="" disabled className="dark:bg-zinc-800">Select...</option>
                      {KNOWN_HOBBIES.map(hobby => (
                        <option key={hobby} value={hobby} className="dark:bg-zinc-800">{hobby}</option>
                      ))}
                    </select>
                    <button onClick={handleAddHobby} className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:text-blue-800 dark:hover:text-blue-300 mix-blend-color-burn dark:mix-blend-normal transition-colors">Add</button>
                    <button onClick={() => setShowAddHobby(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 mix-blend-color-burn dark:mix-blend-normal"><X size={12} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowAddHobby(true); setTimeout(() => hobbyRef.current?.focus(), 50); }}
                    className="cursor-pointer py-2 px-5 rounded-full flex items-center gap-2 transition-all bg-white/30 dark:bg-white/10 backdrop-blur-[10px] border-[1px] border-[rgba(255,255,255,0.2)] dark:border-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.3)] hover:bg-white/40 dark:hover:bg-white/15 btn-lift"
                  >
                    <Plus size={16} className="text-zinc-600 dark:text-zinc-300" />
                    <span className="text-[15px] font-medium text-zinc-700 dark:text-zinc-200">Add</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
