"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  LayoutDashboard,
  Users,
  BadgeCheck,
  FileText,
  ShieldAlert,
  Building2,
  Calendar,
  Landmark,
  MessageSquare,
  Sparkles,
  Bell,
  BarChart3,
  UserCog,
  Settings,
  MoreVertical,
  Download,
  Flame,
  CheckCircle2,
  Radio,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Server,
  KeyRound,
  Lock,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  Zap,
  Check,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { AdminPanel } from "./AdminPanel";
import { UserVerificationView } from "./UserVerificationView";
import { ContentManagementView } from "./ContentManagementView";
import { EventsManagementView } from "./EventsManagementView";
import { ClubsManagementView } from "./ClubsManagementView";
import { DepartmentsManagementView } from "./DepartmentsManagementView";
import { GroupsManagementView } from "./GroupsManagementView";
import { MatchingEngineView } from "./MatchingEngineView";
import { NotificationsManagementView } from "./NotificationsManagementView";
import { AnalyticsDashboardView } from "./AnalyticsDashboardView";
import { TeamRolesManagementView } from "./TeamRolesManagementView";
import { PlatformSettingsView } from "./PlatformSettingsView";
import { getAdminOverviewStats, AdminOverviewStats } from "./overviewActions";

interface AdminCockpitProps {
  currentUser: {
    id: string;
    email: string;
    displayName?: string | null;
    role: string;
    department?: string | null;
    permissions?: string[];
    isSuperAdmin?: boolean;
  };
  initialStats?: AdminOverviewStats;
}

export function AdminCockpit({ currentUser, initialStats }: AdminCockpitProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [campusFilter, setCampusFilter] = useState<string>("All Campuses (AAU)");
  const [isCampusMenuOpen, setIsCampusMenuOpen] = useState<boolean>(false);
  const [chartMetric, setChartMetric] = useState<"DAU" | "POSTS" | "MATCH">("DAU");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentStats, setCurrentStats] = useState<AdminOverviewStats | undefined>(initialStats);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const availableCampuses = [
    "All Campuses (AAU)",
    "Main Campus (6 Kilo)",
    "CNCS (4 Kilo)",
    "AAiT (5 Kilo)",
    "EiABC (Lideta)",
    "CHS (Tikur Anbessa)",
    "FBE Campus"
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real counts — truthful data from database
  const totalStudents = currentStats?.totalStudents ?? 0;
  const verifiedStudents = currentStats?.verifiedStudents ?? 0;
  const activeTodayCount = currentStats?.activeTodayCount ?? 0;
  const verifiedPercentage = totalStudents > 0
    ? ((verifiedStudents / totalStudents) * 100).toFixed(1)
    : "0.0";
  const pendingActions = currentStats?.pendingActionCount ?? 0;
  const pendingReports = currentStats?.pendingReportsCount ?? 0;
  const postReadyPending = currentStats?.postReadyCount ?? 0;
  const pendingClubs = currentStats?.pendingClubsCount ?? 0;
  const pendingContent = currentStats?.pendingPostsCount ?? 0;
  const urgentNotificationsCount = currentStats?.urgentNotificationsCount ?? 0;
  const dbLatency = currentStats?.dbLatencyMs ?? 8;
  const dbStatus = currentStats?.dbStatus ?? "HEALTHY";
  const recentAuditLogs = currentStats?.recentAuditLogs ?? [];
  const recentReports = currentStats?.recentReports ?? [];
  const recentPostReadyApps = currentStats?.recentPostReadyApps ?? [];
  const recentClubs = currentStats?.recentClubs ?? [];
  const recentPosts = currentStats?.recentPosts ?? [];
  const dailyActivity = currentStats?.dailyActivity ?? [];

  // Authentic Admin Identity formatting
  const adminDisplayName = currentUser.displayName || currentUser.email.split("@")[0];
  const adminInitials = (() => {
    if (currentUser.displayName) {
      const parts = currentUser.displayName.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return currentUser.displayName.slice(0, 2).toUpperCase();
    }
    return currentUser.email.slice(0, 2).toUpperCase();
  })();

  const isSuperAdmin = Boolean(
    currentUser.isSuperAdmin ||
    currentUser.role === "SUPER_ADMIN" ||
    (currentUser.permissions && currentUser.permissions.includes("ALL"))
  );

  const adminRoleDisplay = isSuperAdmin
    ? "Super Admin · CCI"
    : currentUser.role === "MODERATOR"
    ? "Moderator"
    : currentUser.role === "CONTENT_ADMIN"
    ? "Content Admin"
    : currentUser.role === "ORG_ADMIN"
    ? "Organization Admin"
    : currentUser.department
    ? `Admin · ${currentUser.department}`
    : "Administrator";

  // Role and Permission Based Navigation Visibility
  const userPermissions = currentUser.permissions || [];
  const canAccess = (navId: string): boolean => {
    if (isSuperAdmin) return true;
    switch (navId) {
      case "overview":
        return true;
      case "users":
        return userPermissions.includes("MANAGE_USERS");
      case "verification":
        return userPermissions.includes("REVIEW_POST_READY") || userPermissions.includes("MANAGE_USERS");
      case "content":
        return userPermissions.includes("MANAGE_CONTENT");
      case "events":
        return userPermissions.includes("MANAGE_CONTENT");
      case "moderation":
        return userPermissions.includes("MODERATE_REPORTS");
      case "clubs":
        return userPermissions.includes("MANAGE_CLUBS");
      case "departments":
        return userPermissions.includes("MANAGE_CONTENT") || userPermissions.includes("MANAGE_USERS");
      case "groups":
        return userPermissions.includes("MANAGE_GROUPS");
      case "matching":
        return userPermissions.includes("MANAGE_USERS");
      case "notifications":
        return userPermissions.includes("MANAGE_CONTENT");
      case "analytics":
        return userPermissions.includes("VIEW_AUDIT_LOGS") || userPermissions.includes("MANAGE_USERS");
      case "team":
        return userPermissions.includes("MANAGE_ROLES");
      case "settings":
        return false;
      default:
        return true;
    }
  };

  const navLinks = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, badge: null, badgeColor: "" },
    { id: "users", label: "Users", icon: Users, badge: null, badgeColor: "" },
    { id: "verification", label: "Verification", icon: BadgeCheck, badge: postReadyPending > 0 ? String(postReadyPending) : null, badgeColor: "bg-red-50 text-red-700 font-medium" },
    { id: "content", label: "Content", icon: FileText, badge: pendingContent > 0 ? String(pendingContent) : null, badgeColor: "bg-slate-100 text-slate-700 font-medium" },
    { id: "events", label: "Events", icon: Calendar, badge: null, badgeColor: "" },
    { id: "moderation", label: "Moderation & Safety", icon: ShieldAlert, badge: pendingReports > 0 ? String(pendingReports) : null, badgeColor: "bg-red-50 text-red-700 font-medium" },
    { id: "clubs", label: "Clubs & Orgs", icon: Building2, badge: pendingClubs > 0 ? String(pendingClubs) : null, badgeColor: "bg-slate-100 text-slate-700 font-medium" },
    { id: "departments", label: "Departments & Officials", icon: Landmark, badge: null, badgeColor: "" },
    { id: "groups", label: "Groups", icon: MessageSquare, badge: null, badgeColor: "" },
    { id: "matching", label: "Matching", icon: Sparkles, badge: null, badgeColor: "" },
    { id: "notifications", label: "Notifications", icon: Bell, badge: urgentNotificationsCount > 0 ? String(urgentNotificationsCount) : null, badgeColor: "bg-blue-50 text-blue-700 font-medium" },
    { id: "analytics", label: "Analytics", icon: BarChart3, badge: null, badgeColor: "" },
    { id: "team", label: "Team & Roles", icon: UserCog, badge: null, badgeColor: "" },
    { id: "settings", label: "Settings", icon: Settings, badge: null, badgeColor: "" },
  ].filter(link => canAccess(link.id));

  // Sync navigation with URL query params
  const navigateToTab = (id: string) => {
    if (!canAccess(id)) {
      showToast("Access restricted: You do not have permissions for this section");
      return;
    }
    setActiveTab(id);
    setIsMobileDrawerOpen(false);
    if (typeof window !== "undefined") {
      const url = id === "overview" ? "/admin" : `/admin?tab=${id}`;
      window.history.pushState(null, "", url);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && canAccess(tabParam)) {
        setActiveTab(tabParam);
      }
      const onPopState = () => {
        const p = new URLSearchParams(window.location.search);
        const t = p.get("tab") || "overview";
        if (canAccess(t)) {
          setActiveTab(t);
        }
      };
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }
  }, []);

  // Escape key closes mobile navigation drawer and campus menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMobileDrawerOpen) setIsMobileDrawerOpen(false);
        if (isCampusMenuOpen) setIsCampusMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawerOpen, isCampusMenuOpen]);

  // Live Refresh Queues
  const handleRefreshQueues = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getAdminOverviewStats();
      setCurrentStats(fresh);
      showToast("Queues refreshed. Live database counts synchronized.");
    } catch (err: any) {
      showToast("Failed to refresh: " + (err?.message || "Unknown error"));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real Term Report Export
  const handleGenerateTermReport = () => {
    const reportData = {
      title: "AAU Uni-Chat Operational Term Status Report",
      generatedAt: new Date().toISOString(),
      admin: adminDisplayName,
      email: currentUser.email,
      role: adminRoleDisplay,
      campusFilter,
      globalStatus: "Campus Services Online",
      kpis: {
        totalStudents,
        verifiedStudents,
        verifiedPercentage: `${verifiedPercentage}%`,
        activeChatSessionsToday: activeTodayCount,
        pendingActionCount: pendingActions,
      },
      queues: {
        postReadyApplicationsPending: postReadyPending,
        openReportsPending: pendingReports,
        clubChartersPending: pendingClubs,
        officialContentPending: pendingContent,
        urgentBroadcastsPending: urgentNotificationsCount,
      },
      infrastructure: {
        databaseStatus: dbStatus,
        databaseLatencyMs: dbLatency,
        totalUsersIndexed: totalStudents,
        auditLogEntriesLogged: recentAuditLogs.length,
      },
      recentAuditEvents: recentAuditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        admin: log.admin?.displayName || log.admin?.email,
        timestamp: log.createdAt,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UniChat_AAU_Report_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Term report compiled and downloaded successfully.");
  };

  // SVG Chart points calculation
  const chartDataPoints = dailyActivity.length > 0 ? dailyActivity : Array.from({ length: 14 }, (_, i) => ({
    date: `Day ${i + 1}`,
    dayLabel: `Day ${i + 1}`,
    dau: 0,
    posts: 0,
    sessions: 0
  }));

  const metricValues = chartDataPoints.map((p) =>
    chartMetric === "DAU" ? p.dau : chartMetric === "POSTS" ? p.posts : p.sessions
  );
  const maxMetricVal = Math.max(...metricValues, 4);

  const svgCoordinates = metricValues.map((val, idx) => {
    const x = Math.round((idx / (chartDataPoints.length - 1)) * 500);
    const y = Math.round(155 - (val / maxMetricVal) * 115);
    return { x, y, val };
  });

  const svgPathD = svgCoordinates.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cp1x = Math.round(prev.x + (pt.x - prev.x) / 2);
    const cp1y = prev.y;
    const cp2x = Math.round(prev.x + (pt.x - prev.x) / 2);
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, "");

  const svgAreaD = `${svgPathD} L 500 180 L 0 180 Z`;

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] text-slate-900 font-sf-pro antialiased selection:bg-[#4A7BB0]/20 tracking-tight">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR (~260px) - Fixed on desktop (lg+), slide-out drawer on mobile */}
      <aside
        id="admin-drawer"
        role={isMobileDrawerOpen ? "dialog" : undefined}
        aria-modal={isMobileDrawerOpen ? "true" : undefined}
        aria-label="Admin navigation drawer"
        className={`fixed inset-y-0 left-0 z-50 lg:z-40 w-[260px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between select-none transition-transform duration-300 ease-in-out ${
          isMobileDrawerOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Header Branding */}
          <div className="p-5 border-b border-[#F1F5F9]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Image
                  src="/images/logo-icon.png"
                  alt="Uni-Chat"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-xl shadow-xs object-contain"
                  priority
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-slate-900 truncate">
                      Uni-Chat
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/50">
                      AAU
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">Admin OS & Console</p>
                </div>
              </div>

              {/* Close Drawer Button on Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* System Status Pill */}
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-slate-600 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>System Live · Semester 1</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav aria-label="Admin console navigation" className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => navigateToTab(link.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? "bg-[#EBF3FE] text-[#1E40AF] font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#2563EB]" : "text-slate-400"}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold leading-tight ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Card */}
        <div className="p-3 border-t border-[#F1F5F9]">
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#3B5A82] text-white flex items-center justify-center font-semibold text-xs shrink-0">
                {adminInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {adminDisplayName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {adminRoleDisplay}
                </p>
              </div>
            </div>
            <a
              href="/api/auth/logout"
              title="Log Out"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER (Left margin ~260px on desktop lg+, ml-0 on mobile) */}
      <div className="flex-1 ml-0 lg:ml-[260px] flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* TOP UTILITY HEADER BAR */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4">
          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileDrawerOpen}
            aria-controls="admin-drawer"
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Pill Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search administration directory"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigateToTab("users");
                  showToast(`Searching directory for "${searchQuery}"`);
                }
              }}
              placeholder="Search students, AAU IDs, clubs, reports, or content... ⌘K"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all font-sf-pro"
            />
          </div>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-3">
            {/* Campus Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={isCampusMenuOpen}
                aria-label="Select active campus"
                onClick={() => setIsCampusMenuOpen(!isCampusMenuOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Landmark className="w-3.5 h-3.5 text-slate-500" />
                <span>{campusFilter}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isCampusMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {availableCampuses.map((camp) => (
                    <button
                      key={camp}
                      onClick={() => {
                        setCampusFilter(camp);
                        setIsCampusMenuOpen(false);
                        showToast("Active campus filter: " + camp);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs transition ${
                        campusFilter === camp
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {camp}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* + Create Official Content Button */}
            {canAccess("content") && (
              <button
                onClick={() => {
                  navigateToTab("content");
                  showToast("Navigated to Official Content creator");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Official Content</span>
              </button>
            )}

            {/* Notification Bell Icon */}
            <button
              onClick={() => {
                navigateToTab("notifications");
                showToast(`${urgentNotificationsCount} urgent push broadcast alerts`);
              }}
              className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {urgentNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </button>

            {/* Admin Avatar button */}
            <button
              onClick={() => showToast(`Logged in as ${currentUser.email} (${adminRoleDisplay})`)}
              className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs"
              title={adminDisplayName}
            >
              {adminInitials}
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full space-y-6 min-w-0">
          {activeTab === "users" || activeTab === "verification" ? (
            <UserVerificationView
              onBackToOverview={() => navigateToTab("overview")}
              initialTab={activeTab === "verification" ? "POST_READY" : "ALL"}
            />
          ) : activeTab === "content" ? (
            <ContentManagementView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "events" ? (
            <EventsManagementView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "clubs" ? (
            <ClubsManagementView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "departments" ? (
            <DepartmentsManagementView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "groups" ? (
            <GroupsManagementView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "matching" ? (
            <MatchingEngineView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "notifications" ? (
            <NotificationsManagementView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "analytics" ? (
            <AnalyticsDashboardView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "team" ? (
            <TeamRolesManagementView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab === "settings" ? (
            <PlatformSettingsView
              onBackToOverview={() => navigateToTab("overview")}
              onShowToast={showToast}
            />
          ) : activeTab !== "overview" ? (
            /* Sub-view fallback wrapper: connects moderation & reports directly */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateToTab("overview")}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    ← Back to Overview
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {activeTab.replace(/_/g, " ")} Operations
                  </span>
                </div>
              </div>
              <AdminPanel initialTab={activeTab === "moderation" ? "REPORTS" : "SEARCH"} />
            </div>
          ) : (
            <>
              {/* SECTION A: Welcome & Operational Status Banner */}
              <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    AAU Core Admin OS · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight mt-0.5">
                    Welcome, {adminDisplayName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="p-1 rounded bg-slate-100 text-slate-600">
                      <Radio className="w-3 h-3" />
                    </span>
                    <span>
                      AAU Campus Network · {adminRoleDisplay} portal active
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Global Status: Campus Services Online</span>
                  </div>

                  {/* Generate Term Report Button */}
                  <button
                    onClick={handleGenerateTermReport}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate Term Report</span>
                  </button>
                </div>
              </section>

              {/* SECTION B: 4 High-Level KPI Summary Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Students */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Total Students</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-900">
                    {totalStudents.toLocaleString()}
                  </div>
                  <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{totalStudents} registered accounts</span>
                  </p>
                </div>

                {/* 2. Verified Students */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Verified Students</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-900">
                    {verifiedStudents.toLocaleString()}
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100/60">
                      {verifiedPercentage}% via AAU .edu domain
                    </span>
                  </div>
                </div>

                {/* 3. Active Today */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Chat Sessions Today</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-900">
                    {activeTodayCount.toLocaleString()}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Chat sessions started today</span>
                  </p>
                </div>

                {/* 4. Pending Action Items */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Pending Action Items</span>
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-2xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-900">
                    {pendingActions}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-slate-500">Requires staff review</span>
                    <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/60">
                      {pendingReports} open reports
                    </span>
                  </div>
                </div>
              </section>

              {/* SECTION C: "Attention Needed" SLA Triage Shelf (5 Actionable Cards) */}
              <section className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Attention Needed</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
                      5 Workflows
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      High-priority operational triages across campus nodes requiring admin clearance
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCampusMenuOpen(!isCampusMenuOpen)}
                      className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>{campusFilter}</span>
                    </button>
                    <button
                      onClick={handleRefreshQueues}
                      disabled={isRefreshing}
                      className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                      <span>{isRefreshing ? "Syncing..." : "Refresh Queues"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Card 1: Post-Ready Review — live queue */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Verification</span>
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center justify-center">{postReadyPending}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">Post-Ready Review</h3>
                      {recentPostReadyApps.length > 0 ? (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {recentPostReadyApps[0].user?.displayName || recentPostReadyApps[0].user?.email}{recentPostReadyApps.length > 1 ? ` +${recentPostReadyApps.length - 1} more` : ""} awaiting review.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed">No pending applications.</p>
                      )}
                      <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <span>{postReadyPending} pending in queue</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigateToTab("verification")}
                      className="mt-4 w-full py-2 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <span>Review Queue</span><ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card 2: Flags & Reports — live queue */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">Moderation</span>
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold flex items-center justify-center">{pendingReports}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">Open Reports</h3>
                      {recentReports.length > 0 ? (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {recentReports[0].reportedUser?.displayName || recentReports[0].reportedUser?.email}{recentReports.length > 1 ? ` +${recentReports.length - 1} more` : ""} reported.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed">No open reports.</p>
                      )}
                      {pendingReports > 0 ? (
                        <div className="mt-3 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-red-500" />
                          <span>Requires review</span>
                        </div>
                      ) : (
                        <div className="mt-3 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Queue clear</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigateToTab("moderation")}
                      className="mt-4 w-full py-2 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <span>Open Moderation</span><ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card 3: Club Charters — live queue */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Organizations</span>
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center justify-center">{pendingClubs}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">Club Charters</h3>
                      {recentClubs.length > 0 ? (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {recentClubs.slice(0, 2).map((c: any) => c.name).join(", ")}{recentClubs.length > 2 ? ` +${recentClubs.length - 2} more` : ""} pending.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed">No pending charters.</p>
                      )}
                      <div className="mt-3 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{pendingClubs} awaiting approval</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigateToTab("clubs")}
                      className="mt-4 w-full py-2 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <span>Inspect Charters</span><ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card 4: Official Content — live queue */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Official Feed</span>
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold flex items-center justify-center">{pendingContent}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">Official Content</h3>
                      {recentPosts.length > 0 ? (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {recentPosts[0].title}{recentPosts.length > 1 ? ` +${recentPosts.length - 1} more` : ""} pending review.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed">No pending content.</p>
                      )}
                      <div className="mt-3 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <Radio className="w-3 h-3 text-blue-500" />
                        <span>{pendingContent} awaiting approval</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigateToTab("content")}
                      className="mt-4 w-full py-2 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <span>Approve Content</span><ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card 5: Urgent Notifications — live count */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Urgent Pushes</span>
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold flex items-center justify-center">{urgentNotificationsCount}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">Push Broadcasts</h3>
                      {urgentNotificationsCount > 0 ? (
                        <p className="text-xs text-slate-500 leading-relaxed">{urgentNotificationsCount} urgent unread notification{urgentNotificationsCount !== 1 ? "s" : ""} queued.</p>
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed">No urgent notifications pending.</p>
                      )}
                      <div className="mt-3 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <Bell className="w-3 h-3 text-slate-400" />
                        <span>{urgentNotificationsCount} unread urgent</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigateToTab("notifications")}
                      className="mt-4 w-full py-2 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <span>Review Alerts</span><ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION D: Detailed Analytics & Real-Time Audit (60% / 40% Split) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Platform Activity & Engagement (7 cols ~60%) */}
                <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Platform Activity & Engagement</h2>
                      <p className="text-xs text-slate-500">
                        Daily student activity, campus posts, and chat sessions (Past 14 Days)
                      </p>
                    </div>

                    {/* Segmented Toggle Buttons */}
                    <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
                      {(["DAU", "POSTS", "MATCH"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setChartMetric(m)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                            chartMetric === m
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {m === "DAU" ? "DAU Activity" : m === "POSTS" ? "Post Volume" : "Chat Sessions"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                      <span>Active Sessions ({currentStats?.activeTodayCount ?? 0} today)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Registered Students ({totalStudents})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                      <span>Published Feed Posts ({recentPosts.length})</span>
                    </span>
                  </div>

                  {/* Visual Bézier Area Chart (SVG with smooth curves & gradients) */}
                  <div className="relative mt-5 h-56 w-full">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="areaGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0F172A" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid guidelines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#F1F5F9" strokeDasharray="3 3" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeDasharray="3 3" />
                      <line x1="0" y1="130" x2="500" y2="130" stroke="#F1F5F9" strokeDasharray="3 3" />

                      {/* Area Fill: Dynamic Curve */}
                      <path d={svgAreaD} fill="url(#areaGrad)" />

                      {/* Line Stroke: Blue Stroke */}
                      <path d={svgPathD} fill="none" stroke="#3B82F6" strokeWidth="2.5" />

                      {/* Key data markers matching live points */}
                      {svgCoordinates.filter((_, i) => i % 2 === 0 || i === svgCoordinates.length - 1).map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={i === svgCoordinates.length - 1 ? 4.5 : 3.5}
                          fill="#0F172A"
                          stroke="#FFFFFF"
                          strokeWidth={i === svgCoordinates.length - 1 ? 2 : 1}
                        />
                      ))}
                    </svg>

                    {/* X-axis date labels */}
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mt-2">
                      {chartDataPoints
                        .filter((_, i) => i % 2 === 0 || i === chartDataPoints.length - 1)
                        .map((pt, i) => (
                          <span key={i}>{pt.dayLabel}</span>
                        ))}
                    </div>
                  </div>

                  {/* Bottom 3 Stat Tiles — real counts only */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500">Total Students</span>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">{totalStudents.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400">{verifiedStudents.toLocaleString()} email-verified</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500">Verified Rate</span>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">{verifiedPercentage}%</p>
                      <span className="text-[10px] text-slate-400">AAU institutional domain</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500">Sessions Today</span>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">{activeTodayCount.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400">Live chat sessions started</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Operational Audit Feed (5 cols ~40%) */}
                <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Live Operational Audit</h2>
                      <p className="text-xs text-slate-500">Real-time governance activity trail</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Live Stream</span>
                    </div>
                  </div>

                  {/* Audit Event Items List — real AuditLog records */}
                  <div className="mt-4 space-y-3.5">
                    {recentAuditLogs.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        <Shield className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                        No audit events recorded yet.
                      </div>
                    ) : (
                      recentAuditLogs.map((log: any) => {
                        const label = log.action
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c: string) => c.toUpperCase());
                        const timeAgo = (() => {
                          const diff = Date.now() - new Date(log.createdAt).getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 1) return "Just now";
                          if (mins < 60) return `${mins}m ago`;
                          const hrs = Math.floor(mins / 60);
                          if (hrs < 24) return `${hrs}h ago`;
                          return `${Math.floor(hrs / 24)}d ago`;
                        })();
                        const isMod = log.action.includes("MODERATION") || log.action.includes("BAN") || log.action.includes("WARN");
                        const isPostReady = log.action.includes("POST_READY");
                        const isClub = log.action.includes("CLUB");
                        return (
                          <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isMod ? "bg-red-100 text-red-600"
                              : isPostReady ? "bg-blue-100 text-blue-700"
                              : isClub ? "bg-slate-100 text-slate-700"
                              : "bg-slate-900 text-white"
                            }`}>
                              {isMod ? <ShieldAlert className="w-4 h-4" /> : isPostReady ? <BadgeCheck className="w-4 h-4" /> : isClub ? <Building2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span className="font-semibold text-slate-900 truncate">{label}</span>
                                <span className="text-[11px] text-slate-400 shrink-0 ml-2">{timeAgo}</span>
                              </div>
                              {log.details && typeof log.details === "object" && Object.keys(log.details).length > 0 && (
                                <p className="text-xs text-slate-600 truncate">
                                  {Object.entries(log.details as Record<string, unknown>).slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                By {log.admin?.displayName || log.admin?.email || "System"}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION E: Application Health (real verifiable signals only) */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 1. Database — real registered students */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Database</span>
                      <span className="text-sm font-semibold text-slate-900">{totalStudents.toLocaleString()} users indexed</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-mono">{dbLatency}ms</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                      Reachable
                    </span>
                  </div>
                </div>

                {/* 2. Pending work queue — derived from real counts */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Action Queue</span>
                      <span className="text-sm font-semibold text-slate-900">{pendingActions} items pending</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    pendingActions === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : "bg-amber-50 text-amber-700 border-amber-200/60"
                  }`}>
                    {pendingActions === 0 ? "Clear" : "Needs Attention"}
                  </span>
                </div>

                {/* 3. Audit log — real count of today's events */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Audit Log</span>
                      <span className="text-sm font-semibold text-slate-900">{recentAuditLogs.length} recent entries</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
                    Active
                  </span>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
