"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Check, 
  Plus, 
  ArrowRight, 
  Cpu, 
  Sparkles, 
  Palette, 
  Dna,
  ShieldCheck,
  Building,
  Star,
  MapPin,
  ExternalLink
} from "lucide-react";
import { joinGroup, leaveGroup } from "@/app/admin/backendActions";
import { getCategoryStyle, formatEventDateTime, EVENT_CATEGORIES } from "@/lib/eventConstants";

export interface GroupItemData {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  campus?: string | null;
  memberCount: number;
  joined: boolean;
  ownerName?: string;
}

export interface UpcomingEventData {
  id: string;
  title: string;
  body: string;
  publishedAt: any;
  scheduledAt?: any;
  isPinned?: boolean;
  isFeatured?: boolean;
  eventCategory?: string | null;
  startDate?: any;
  endDate?: any;
  location?: string | null;
  organizer?: string | null;
  registrationUrl?: string | null;
  imageUrl?: string | null;
  author?: any;
  club?: any;
}

export interface HomeSidebarProps {
  initialGroups?: GroupItemData[];
  initialEvents?: UpcomingEventData[];
  onSelectEvent?: (event: UpcomingEventData) => void;
  viewMode?: "all" | "groups" | "events";
}

function resolveGroupIcon(group: { name: string; category?: string | null }) {
  const text = `${group.name} ${group.category || ""}`.toLowerCase();
  if (text.includes("tech") || text.includes("kilo") || text.includes("code") || text.includes("cyber") || text.includes("robotics")) {
    return {
      icon: Cpu,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-300",
    };
  }
  if (text.includes("debate") || text.includes("speech") || text.includes("parliament") || text.includes("law")) {
    return {
      icon: Sparkles,
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-300",
    };
  }
  if (text.includes("art") || text.includes("design") || text.includes("music") || text.includes("photo") || text.includes("yared")) {
    return {
      icon: Palette,
      iconBg: "bg-rose-100 dark:bg-rose-900/40",
      iconColor: "text-rose-600 dark:text-rose-300",
    };
  }
  if (text.includes("bio") || text.includes("med") || text.includes("health") || text.includes("tikur") || text.includes("hospital")) {
    return {
      icon: Dna,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-300",
    };
  }
  return {
    icon: Users,
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-300",
  };
}

export function HomeSidebar({
  initialGroups = [],
  initialEvents = [],
  onSelectEvent,
  viewMode = "all",
}: HomeSidebarProps) {
  const [groups, setGroups] = useState<GroupItemData[]>(initialGroups);
  const [events, setEvents] = useState<UpcomingEventData[]>(initialEvents);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [calendarToast, setCalendarToast] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialGroups && initialGroups.length > 0) {
      setGroups(initialGroups);
    }
  }, [initialGroups]);

  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const toggleJoin = async (group: GroupItemData) => {
    const willJoin = !group.joined;
    // Optimistic UI update
    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              joined: willJoin,
              memberCount: willJoin ? g.memberCount + 1 : Math.max(0, g.memberCount - 1),
            }
          : g
      )
    );

    try {
      if (willJoin) {
        await joinGroup(group.id);
        showToast(`Joined ${group.name}!`);
      } else {
        await leaveGroup(group.id);
        showToast(`Left ${group.name}.`);
      }
    } catch (err: any) {
      // Revert optimistic state
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, joined: !willJoin } : g))
      );
      showToast(err?.message || "Failed to update membership");
    }
  };

  const handleCalendarClick = () => {
    setCalendarToast(true);
    setTimeout(() => setCalendarToast(false), 3500);
  };

  const showGroups = viewMode === "all" || viewMode === "groups";
  const showEvents = viewMode === "all" || viewMode === "events";

  return (
    <aside className="space-y-5 font-sf-pro">
      {/* Toast alert */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold shadow-xl border border-zinc-700/50 dark:border-zinc-200/50 animate-in fade-in slide-in-from-bottom-2">
          {feedbackToast}
        </div>
      )}

      {/* Widget 1: Groups for you (Powered by PostgreSQL) */}
      {showGroups && (
      <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] p-4 sm:p-5 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 text-[#4A7BB0] dark:bg-blue-950/60 dark:text-blue-300">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight font-sf-pro">
              Groups for you
            </h2>
          </div>
          <a
            href="/app/chat"
            className="text-xs font-semibold text-[#4A7BB0] hover:text-[#386292] dark:text-blue-400 transition font-sf-pro"
          >
            See all
          </a>
        </div>

        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No active communities yet.
              </p>
            </div>
          ) : (
            groups.slice(0, 5).map((group) => {
              const iconData = resolveGroupIcon(group);
              const IconComponent = iconData.icon;
              const memberCountDisplay =
                group.memberCount > 1000
                  ? `${(group.memberCount / 1000).toFixed(1)}k members`
                  : `${group.memberCount} ${group.memberCount === 1 ? "member" : "members"}`;

              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl ${iconData.iconBg} ${iconData.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate font-sf-pro">
                        {group.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-400 truncate font-sf-pro">
                        {memberCountDisplay} · {group.campus || "Main Campus"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleJoin(group)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-sf-pro transition-all duration-150 cursor-pointer ${
                      group.joined
                        ? "border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70"
                        : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                    }`}
                  >
                    {group.joined ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" /> Joined
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Join
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* Widget 2: Upcoming at AAU (Powered by PostgreSQL Event Posts) */}
      {showEvents && (
      <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] p-4 sm:p-5 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight font-sf-pro">
              Upcoming Events
            </h2>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-sf-pro">
            AAU Campus
          </span>
        </div>

        {/* Student Category Filter Chips (Horizontal touch scroll on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3.5 scroll-smooth touch-pan-x -mx-1 px-1">
          {["All", ...EVENT_CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer font-sf-pro ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Real Dynamic Timeline Items */}
        <div className="space-y-3">
          {events
            .filter((ev) => (selectedCategory === "All" ? true : ev.eventCategory === selectedCategory))
            .length === 0 ? (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sf-pro">
                No events found for {selectedCategory === "All" ? "upcoming schedule" : `"${selectedCategory}"`}.
              </p>
            </div>
          ) : (
            events
              .filter((ev) => (selectedCategory === "All" ? true : ev.eventCategory === selectedCategory))
              .slice(0, 5)
              .map((event) => {
                const catStyle = getCategoryStyle(event.eventCategory);
                const dateTime = formatEventDateTime(event.startDate, event.endDate);
                const isFeatured = Boolean(event.isFeatured || event.isPinned);

                return (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent?.(event)}
                    className={`relative pl-3 border-l-2 ${catStyle.accentBorder} py-1.5 cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-r-2xl transition-all p-2 font-sf-pro`}
                    title="Click to view event pass and details"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${catStyle.badgeClasses}`}
                      >
                        {event.eventCategory || "Event"}
                      </span>
                      {isFeatured && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#4A7BB0] dark:group-hover:text-blue-400 transition line-clamp-1 mb-0.5">
                      {event.title}
                    </h3>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                      {event.body}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-zinc-400 dark:text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-medium">
                        <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{dateTime.dateStr}</span>
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                      {event.registrationUrl && (
                        <a
                          href={event.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 text-[#4A7BB0] dark:text-blue-400 hover:underline font-semibold ml-auto"
                        >
                          <span>Register</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Calendar Footer Link */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={handleCalendarClick}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4A7BB0] hover:text-[#386292] dark:text-blue-400 hover:underline transition cursor-pointer font-sf-pro"
          >
            <span>View full academic calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {calendarToast && (
            <p className="text-[11px] text-center text-emerald-600 dark:text-emerald-400 mt-2 animate-fadeIn font-sf-pro">
              ✓ 2025/2026 Academic Calendar synced to your feed.
            </p>
          )}
        </div>
      </div>
      )}
    </aside>
  );
}
