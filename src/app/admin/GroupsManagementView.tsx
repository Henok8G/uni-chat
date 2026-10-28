"use client";

import React, { useState } from "react";
import {
  Shield,
  Search,
  Download,
  AlertTriangle,
  MessageSquare,
  Users,
  CheckCircle2,
  Lock,
  Globe,
  Pin,
  BookOpen,
  HeartPulse,
  Compass,
  GraduationCap,
  ChevronDown,
  X,
  ExternalLink,
  Flag,
  MoreVertical,
  Activity,
  Sliders,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  FolderOpen,
  RefreshCw,
  Loader2,
  Info,
  Calendar,
  Eye,
  Unlock,
  Plus,
} from "lucide-react";
import { GroupCaseDetail, GovernanceAction } from "./groups/types";
import { useGroupsManagement } from "./groups/hooks";
import { scanInactiveGroups, exportGroupAuditTrailCsv } from "./groupActions";
import { createGroup } from "./backendActions";

interface GroupsManagementViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function GroupsManagementView({
  onBackToOverview,
  onShowToast,
}: GroupsManagementViewProps) {
  const {
    metrics,
    groupCases,
    triageBanners,
    selectedCase,
    selectedCaseId,
    totalFilteredCount,
    currentPage,
    totalPages,
    loading,
    error,
    activeTabFilter,
    setActiveTabFilter,
    searchQuery,
    setSearchQuery,
    campusFilter,
    setCampusFilter,
    sortOption,
    setSortOption,
    goToPage,
    selectCaseById,
    dismissTriage,
    applySanction,
    dismissFlags,
    liftFreeze,
    relist,
    refresh,
  } = useGroupsManagement();

  // Sanction selection & reason input in drawer
  const [selectedSanction, setSelectedSanction] = useState<GovernanceAction>("freeze_48h");
  const [sanctionReason, setSanctionReason] = useState("");
  const [isSubmittingSanction, setIsSubmittingSanction] = useState(false);

  // Create Group Modal State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("Academic & Tech");
  const [newGroupCampus, setNewGroupCampus] = useState("All AAU Campuses");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      onShowToast("Please enter a group name");
      return;
    }
    try {
      setIsCreatingGroup(true);
      await createGroup(newGroupName, newGroupDescription, newGroupCategory, newGroupCampus);
      onShowToast(`🎉 Created community group "${newGroupName}"! It is now live on the student front page.`);
      setShowCreateGroupModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      await refresh();
    } catch (err: any) {
      onShowToast(err?.message || "Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };


  // Modals state
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerResult, setScannerResult] = useState<{
    totalScanned: number;
    daysThreshold: number;
    inactiveCount: number;
    inactiveGroups: Array<{
      id: string;
      name: string;
      campus: string;
      memberCount: number;
      lastActive: string;
    }>;
  } | null>(null);

  // Handle Inactive Groups Scan
  const handleOpenScanner = async () => {
    setShowScannerModal(true);
    setScannerLoading(true);
    try {
      const res = await scanInactiveGroups(60);
      setScannerResult(res);
    } catch (err: any) {
      onShowToast("Scan failed: " + (err?.message || "Unknown error"));
    } finally {
      setScannerLoading(false);
    }
  };

  // Handle Export Audit Trail CSV
  const handleExportAuditTrail = async () => {
    onShowToast("Generating sanitized governance audit trail CSV...");
    try {
      const csv = await exportGroupAuditTrailCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `uni_chat_groups_governance_audit_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast("Audit trail CSV downloaded successfully.");
    } catch (err: any) {
      onShowToast("Export failed: " + (err?.message || "Unauthorized"));
    }
  };

  // Apply governance action
  const handleApplySanction = async () => {
    if (!selectedCase) return;
    setIsSubmittingSanction(true);
    try {
      const res = await applySanction(selectedCase.id, selectedSanction, sanctionReason);
      setSanctionReason("");
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast("Sanction failed: " + (err?.message || "Unknown error"));
    } finally {
      setIsSubmittingSanction(false);
    }
  };

  // Dismiss all flags
  const handleDismissAll = async () => {
    if (!selectedCase) return;
    try {
      const res = await dismissFlags(selectedCase.id);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast("Failed to dismiss flags: " + (err?.message || "Unknown error"));
    }
  };

  // Lift freeze
  const handleLiftFreeze = async () => {
    if (!selectedCase) return;
    try {
      const res = await liftFreeze(selectedCase.id);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast("Failed to lift freeze: " + (err?.message || "Unknown error"));
    }
  };

  // Relist to discovery
  const handleRelist = async () => {
    if (!selectedCase) return;
    try {
      const res = await relist(selectedCase.id);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast("Failed to relist group: " + (err?.message || "Unknown error"));
    }
  };

  const getGroupIcon = (iconType: GroupCaseDetail["iconType"], isFlagged?: boolean) => {
    if (isFlagged) {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
          <Lock className="w-5 h-5 text-rose-600" />
        </div>
      );
    }

    switch (iconType) {
      case "globe":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
        );
      case "lock":
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <Lock className="w-5 h-5" />
          </div>
        );
      case "book":
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
        );
      case "health":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <Users className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. BREADCRUMB & ACTION HEADER BAR */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span
            onClick={onBackToOverview}
            className="hover:text-slate-700 cursor-pointer transition"
          >
            Admin Console
          </span>
          <span>&gt;</span>
          <span className="hover:text-slate-700 cursor-pointer transition">
            Student Communities
          </span>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">Campus Groups Governance</span>
        </div>

        {/* Title, Subtitle & Action Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Groups &amp; Student Communities
              </h1>
              {/* Privacy Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Targeted Safety Review Only · Zero General Surveillance</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Monitor decentralized peer groups, enforce the 3-group creation quota per student, inspect flagged discussions, and moderate community health with zero general surveillance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Create Group Button */}
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Community Group</span>
            </button>

            {/* Refresh Data */}
            <button
              onClick={() => {
                refresh();
                onShowToast("Groups directory & metrics refreshed.");
              }}
              disabled={loading}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh live data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-600"}`} />
            </button>


            {/* Community Guidelines Policy */}
            <button
              onClick={() => setShowPolicyModal(true)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Community Guidelines Policy</span>
            </button>

            {/* Scan Inactive Groups */}
            <button
              onClick={handleOpenScanner}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Scan Inactive Groups</span>
            </button>

            {/* Export Audit Trail */}
            <button
              onClick={handleExportAuditTrail}
              className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-slate-800 flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. KPI SUMMARY METRIC STRIP (4 Equal Cards) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: TOTAL ACTIVE GROUPS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL ACTIVE GROUPS
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.totalActiveGroups.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">peer groups</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                +{metrics.newGroupsThisWeek} created this week across campuses
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: AVERAGE GROUP SIZE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                AVERAGE GROUP SIZE
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.averageGroupSize}
                </span>
                <span className="text-xs font-semibold text-slate-500">students / group</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Median: {metrics.medianGroupSize} · Active membership roster
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: QUOTA COMPLIANCE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                QUOTA COMPLIANCE
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.quotaComplianceRate}%
                </span>
                <span className="text-xs font-semibold text-slate-500">Strict Rule</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Max 3 groups/creator automated lock enforced
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: FLAGGED COMMUNITIES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                FLAGGED COMMUNITIES
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.flaggedCommunitiesCount}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    metrics.flaggedCommunitiesCount > 0
                      ? "text-rose-700 bg-rose-50 border border-rose-200/60"
                      : "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                  }`}
                >
                  {metrics.flaggedCommunitiesCount > 0 ? "under safety review" : "zero flags"}
                </span>
              </div>
              <p className="text-[11px] text-rose-600 mt-2 font-medium">
                {metrics.flaggedCommunitiesCount > 0
                  ? "Requires review or sanction decision"
                  : "All communities comply with policy"}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                metrics.flaggedCommunitiesCount > 0
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN WORKSPACE (~65% Left, ~35% Right Drawer) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT / CENTER COLUMN (~65% - 8 Columns) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          {/* ===================================================================== */}
          {/* Section A: Flagged Urgent Action Banners (Real Triage Only) */}
          {/* ===================================================================== */}
          {triageBanners.length > 0 && (
            <div className="space-y-3">
              {triageBanners.map((banner) => {
                const isRose = banner.theme === "rose";

                return (
                  <div
                    key={banner.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isRose
                        ? "bg-rose-50/70 border-rose-200 text-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    } flex flex-col sm:flex-row items-start justify-between gap-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isRose
                            ? "bg-rose-600 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {isRose ? (
                          <Flag className="w-4 h-4 fill-white" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {banner.title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isRose
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {banner.badgeLabel}
                          </span>
                          <span className="text-xs text-slate-500">
                            Created by{" "}
                            <span className="font-semibold text-slate-800">
                              {banner.creatorHandle}
                            </span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {banner.description}
                        </p>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          selectCaseById(banner.groupId);
                          onShowToast(`Opened inspection case for "${banner.title}"`);
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                      >
                        Inspect Case
                      </button>

                      {isRose ? (
                        <button
                          onClick={async () => {
                            await applySanction(banner.groupId, "freeze_48h", "Urgent safety report triage freeze");
                            dismissTriage(banner.id);
                            onShowToast(`Frozen "${banner.title}" for 48 hours.`);
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition cursor-pointer"
                        >
                          Freeze Group
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await applySanction(banner.groupId, "delist", "Discovery triage restriction");
                            dismissTriage(banner.id);
                            onShowToast(`Delisted "${banner.title}" from discovery.`);
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition cursor-pointer"
                        >
                          Delist
                        </button>
                      )}

                      <button
                        onClick={() => dismissTriage(banner.id)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/80 transition"
                        title="Dismiss Banner"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===================================================================== */}
          {/* Section B: Group Directory & Filter Controls */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            {/* Segmented Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTabFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTabFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Communities ({metrics.totalActiveGroups.toLocaleString()})
              </button>

              <button
                onClick={() => setActiveTabFilter("FLAGGED")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === "FLAGGED"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Flagged for Moderation</span>
                <span className="bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {metrics.flaggedCommunitiesCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTabFilter("HIGH_VELOCITY")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTabFilter === "HIGH_VELOCITY"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                High Activity (&gt;20 Members)
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search group name, creator handle, ID..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div className="sm:col-span-3 relative">
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="All AAU Campuses">Campus: All AAU Campuses</option>
                  <option value="5 Kilo">5 Kilo (AAiT)</option>
                  <option value="4 Kilo">4 Kilo (CNCS)</option>
                  <option value="Sidist Kilo">Sidist Kilo (Main)</option>
                  <option value="Black Lion">Black Lion (Health)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="sm:col-span-3 relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="Recent Activity">Sort: Recent Activity</option>
                  <option value="Highest Spam Score">Sort: Highest Reports</option>
                  <option value="Most Members">Sort: Most Members</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Group Data Table / List */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Querying verified PostgreSQL group roster...
                </p>
              </div>
            ) : groupCases.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  {totalFilteredCount === 0 && metrics.totalActiveGroups === 0
                    ? "No student communities created yet"
                    : "No communities match your current filters"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {totalFilteredCount === 0 && metrics.totalActiveGroups === 0
                    ? "When students create peer groups in the app within the 3-group quota, they will appear here with automated compliance tracking."
                    : "Try adjusting your search terms, campus filter, or tab selection to view student groups."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop / Tablet Table (md+) */}
                <div className="hidden md:block overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">GROUP NAME &amp; CONTEXT</th>
                        <th className="py-3 px-3">CREATOR &amp; AAU ID</th>
                        <th className="py-3 px-3">COMMUNITY HEALTH</th>
                        <th className="py-3 px-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupCases.map((item) => {
                        const isSelected = selectedCaseId === item.id;
                        const isFlagged = item.flagsCount > 0;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => selectCaseById(item.id)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/50"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            {/* Group Name & Context */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-3">
                                {getGroupIcon(item.iconType, isFlagged)}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-xs">
                                      {item.name}
                                    </span>
                                    {item.isPrivate && (
                                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    {item.activeFlagLabel ? (
                                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                        {item.activeFlagLabel}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-400">
                                        {item.context}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Creator & AAU ID */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-800 text-xs">
                                {item.creator.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {item.creator.studentId} • {item.creator.department}
                              </div>
                            </td>

                            {/* Community Health */}
                            <td className="py-3.5 px-3">
                              {isFlagged ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  {item.flagsCount} Active Report{item.flagsCount > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Healthy (0 Flags)
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectCaseById(item.id);
                                  onShowToast(`Inspect dossier for "${item.name}"`);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                title="Inspect Policy File"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards (< md) */}
                <div className="md:hidden divide-y divide-slate-100 pt-2">
                  {groupCases.map((item) => {
                    const isSelected = selectedCaseId === item.id;
                    const isFlagged = item.flagsCount > 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => selectCaseById(item.id)}
                        className={`p-3.5 transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getGroupIcon(item.iconType, isFlagged)}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {item.name}
                                </span>
                                {item.isPrivate && (
                                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {item.activeFlagLabel ? (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                    {item.activeFlagLabel}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 truncate">
                                    {item.context}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectCaseById(item.id);
                              onShowToast(`Inspect dossier for "${item.name}"`);
                            }}
                            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Inspect Policy File"
                            aria-label={`Inspect ${item.name}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-50">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Creator</span>
                            <span className="font-semibold text-slate-800 text-[11px]">{item.creator.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({item.creator.studentId} · {item.creator.department})</span>
                          </div>
                          <div className="text-right shrink-0">
                            {isFlagged ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {item.flagsCount} Active Report{item.flagsCount > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Healthy (0 Flags)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Server-Backed Pagination Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span>
                  Showing {groupCases.length} of {totalFilteredCount.toLocaleString()} groups
                </span>
                <span>•</span>
                <span className="text-slate-400">Strict server pagination active</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        currentPage === p
                          ? "bg-slate-900 text-white font-bold"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* Section C: Quota Policy Explainer Banner */}
          {/* ===================================================================== */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Decentralized 3-Group Quota Policy Active
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Verified students may create up to 3 peer groups concurrently to prevent server clogging and spam. Inactive groups with zero messages for &gt;60 days are queued for automatic soft archiving.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowQuotaModal(true)}
              className="px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shrink-0 transition cursor-pointer"
            >
              Configure Quota Rules
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: STICKY POLICY INSPECTOR DRAWER (~35% - 4 Columns) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          {selectedCase ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${selectedCase.flagsCount > 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
                  <span>CASE FILE {selectedCase.caseFileId}</span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedCase.flagsCount > 0
                      ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                  }`}
                >
                  {selectedCase.flagsCount > 0
                    ? `Flagged ${selectedCase.flagsCount}x`
                    : "Zero Active Flags"}
                </span>
              </div>

              {/* Title & Mode */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  Group Policy Inspector
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Targeted review mode · End-to-end audit logged
                </p>
              </div>

              {/* Community Snapshot Card */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {selectedCase.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {selectedCase.isPrivate ? "Private / Unlisted" : "Open Public"} • {selectedCase.campus}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Created</span>
                    <span className="font-semibold text-slate-800">{selectedCase.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Members</span>
                    <span className="font-semibold text-slate-800">{selectedCase.memberCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Volume</span>
                    <span className="font-semibold text-slate-800">{selectedCase.messageVolume} msgs</span>
                  </div>
                </div>
              </div>

              {/* Creator Quota & Standing Card */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Creator Quota Status
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      selectedCase.creatorQuota.standing === "Quota OK"
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                        : "text-amber-700 bg-amber-50 border border-amber-200"
                    }`}
                  >
                    {selectedCase.creatorQuota.standing}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedCase.creator.avatarInitials || "ST"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      {selectedCase.creator.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      AAU ID: {selectedCase.creator.studentId} • {selectedCase.creator.department}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 font-semibold bg-white p-2 rounded-lg border border-slate-200/60">
                  Groups Created: {selectedCase.creatorQuota.used} of {selectedCase.creatorQuota.allowed} Allowed (
                  {Math.max(0, selectedCase.creatorQuota.allowed - selectedCase.creatorQuota.used)} slot left)
                </div>

                {selectedCase.creatorQuota.strikeWarning && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200/60 text-[11px] text-rose-700 font-medium leading-relaxed">
                    ⚠️ {selectedCase.creatorQuota.strikeWarning}
                  </div>
                )}
              </div>

              {/* Status Restoration Controls if already Frozen or Delisted */}
              {(selectedCase.activeFlagLabel?.includes("Frozen") || selectedCase.isPrivate) && (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
                    Active Governance State
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedCase.activeFlagLabel?.includes("Frozen") && (
                      <button
                        onClick={handleLiftFreeze}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition"
                      >
                        <Unlock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lift Freeze Now</span>
                      </button>
                    )}
                    {selectedCase.isPrivate && (
                      <button
                        onClick={handleRelist}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Restore Discovery</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Community Health Signals */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Community Health Signal
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      selectedCase.flagsCount > 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {selectedCase.flagsCount > 0
                      ? `Flags: ${selectedCase.flagsCount} Pending`
                      : "Verified Healthy"}
                  </span>
                </div>

                <div className="space-y-1">
                  {selectedCase.telemetrySignals.map((signal, idx) => (
                    <p
                      key={idx}
                      className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60"
                    >
                      {signal}
                    </p>
                  ))}
                </div>
              </div>

              {/* Reported Student Flags (Anonymized Feed) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Reported Student Flags ({selectedCase.flaggedReports.length})
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Privacy Anonymized</span>
                </div>

                {selectedCase.flaggedReports.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No active reports flagged.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCase.flaggedReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                          <span>Reporter: {report.reporterPseudonym}</span>
                          <span className="text-[10px] text-slate-400">{report.time}</span>
                        </div>
                        <p className="text-xs text-slate-700 italic leading-relaxed">
                          &ldquo;{report.reason}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Administrative Sanctions Form (Radio Selection) */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  ADMINISTRATIVE SANCTION
                </span>

                <div className="space-y-2 text-xs">
                  {/* Option 1 */}
                  <label
                    onClick={() => setSelectedSanction("freeze_48h")}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                      selectedSanction === "freeze_48h"
                        ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900"
                        : "border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sanction"
                      checked={selectedSanction === "freeze_48h"}
                      onChange={() => setSelectedSanction("freeze_48h")}
                      className="mt-0.5 accent-slate-900"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Make Read-Only / Freeze Chat (48 Hours)</p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Halts message flow immediately on server with automatic expiration.
                      </p>
                    </div>
                  </label>

                  {/* Option 2 */}
                  <label
                    onClick={() => setSelectedSanction("delist")}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                      selectedSanction === "delist"
                        ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900"
                        : "border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sanction"
                      checked={selectedSanction === "delist"}
                      onChange={() => setSelectedSanction("delist")}
                      className="mt-0.5 accent-slate-900"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Remove Group from Public Discovery</p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Unlists the community; existing members stay but new joins are blocked.
                      </p>
                    </div>
                  </label>

                  {/* Option 3 */}
                  <label
                    onClick={() => setSelectedSanction("creator_strike")}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                      selectedSanction === "creator_strike"
                        ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900"
                        : "border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sanction"
                      checked={selectedSanction === "creator_strike"}
                      onChange={() => setSelectedSanction("creator_strike")}
                      className="mt-0.5 accent-slate-900"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Issue Creator Warning (Strike)</p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Records official moderation strike and delivers in-app notice to creator.
                      </p>
                    </div>
                  </label>

                  {/* Option 4 */}
                  <label
                    onClick={() => setSelectedSanction("disband_archive")}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                      selectedSanction === "disband_archive"
                        ? "border-rose-600 bg-rose-50/50 ring-1 ring-rose-600"
                        : "border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sanction"
                      checked={selectedSanction === "disband_archive"}
                      onChange={() => setSelectedSanction("disband_archive")}
                      className="mt-0.5 accent-rose-600"
                    />
                    <div>
                      <p className="font-bold text-rose-600">Archive &amp; Disband Group Permanently</p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Soft-archives group and frees 1 creator quota slot.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Optional Sanction Reason Input */}
                <div className="pt-2">
                  <input
                    type="text"
                    value={sanctionReason}
                    onChange={(e) => setSanctionReason(e.target.value)}
                    placeholder="Administrative rationale (logged to audit trail)..."
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Drawer Action Footer */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingSanction}
                  onClick={handleApplySanction}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-full shadow-sm transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmittingSanction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Apply Governance Action</span>
                </button>

                {selectedCase.flagsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDismissAll}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Dismiss All Flags
                  </button>
                )}

                <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Action logged to Uni-Chat Audit Trail</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No community selected for policy inspection.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. POLICY MODAL */}
      {/* ========================================================================= */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Campus Peer Communities Policy
                </h3>
              </div>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">1. Academic Integrity &amp; Material Sharing</h4>
                <p>
                  Groups formed for capstone, course study, or revision must not solicit commercial sales of leaked exam keys, faculty grading rubrics, or unauthorized assessment materials.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">2. Financial Integrity &amp; Anti-Scam Rules</h4>
                <p>
                  Off-campus dorm rentals, book exchanges, and peer marketplaces must not request non-escrow advance payment deposits or distribute suspicious redirection links.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">3. 3-Group Quota Policy</h4>
                <p>
                  Each verified student account can create up to 3 active communities. Inactive groups (&gt;60 days without messages) are soft-archived to free slots.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">4. Privacy-Preserving Moderation</h4>
                <p>
                  Zero general surveillance: administrative inspection occurs exclusively upon receipt of verified student flags, targeting only reported metadata.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. QUOTA CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Decentralized Quota Configuration
                </h3>
              </div>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <span className="font-bold text-blue-900 block">Current Standard Policy</span>
                <p className="text-blue-800">
                  Maximum creation limit: <strong className="font-bold">3 active groups</strong> per verified student account.
                </p>
              </div>

              <div className="space-y-1.5 text-slate-600 leading-relaxed">
                <p>
                  • <strong>Concurrency Protection:</strong> Server-side interactive transactions lock the creator slot during creation.
                </p>
                <p>
                  • <strong>Membership Isolation:</strong> Joining another student&apos;s community does not consume creation quota.
                </p>
                <p>
                  • <strong>Soft-Archival Slot Release:</strong> Archiving a group releases 1 creation slot immediately.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowQuotaModal(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                Acknowledge Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INACTIVE GROUPS SCANNER MODAL */}
      {/* ========================================================================= */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Inactive Groups Audit Scan
                </h3>
              </div>
              <button
                onClick={() => setShowScannerModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scannerLoading ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Scanning database for &gt;60 days inactive groups...</p>
              </div>
            ) : scannerResult ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Scanned</span>
                    <span className="text-lg font-bold text-slate-900">{scannerResult.totalScanned} groups</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">&gt;60d Inactive Found</span>
                    <span className="text-lg font-bold text-slate-900">{scannerResult.inactiveCount} groups</span>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {scannerResult.inactiveGroups.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Zero inactive groups found. All existing communities have recent activity.
                    </p>
                  ) : (
                    scannerResult.inactiveGroups.map((g) => (
                      <div
                        key={g.id}
                        className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{g.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {g.campus} • {g.memberCount} members • Last active: {g.lastActive}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            await applySanction(g.id, "disband_archive", "Soft-archived via Inactive Groups Scan");
                            onShowToast(`Archived inactive group "${g.name}".`);
                            setShowScannerModal(false);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                        >
                          Archive
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowScannerModal(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create Community Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Community Group</h3>
                  <p className="text-[11px] text-slate-400">Institutional or student peer community</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. 5 Kilo AI & Machine Learning Club"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Academic & Tech">Academic & Tech</option>
                    <option value="Academic & Debate">Academic & Debate</option>
                    <option value="Arts & Media">Arts & Media</option>
                    <option value="Health & Sciences">Health & Sciences</option>
                    <option value="General Peer">General Peer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Campus</label>
                  <select
                    value={newGroupCampus}
                    onChange={(e) => setNewGroupCampus(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="All AAU Campuses">All AAU Campuses</option>
                    <option value="AAiT (5 Kilo)">AAiT (5 Kilo)</option>
                    <option value="Sidist Kilo (Main)">Sidist Kilo (Main)</option>
                    <option value="CNCS (4 Kilo)">CNCS (4 Kilo)</option>
                    <option value="CHS (Tikur Anbessa)">CHS (Tikur Anbessa)</option>
                    <option value="EiABC (Lideta)">EiABC (Lideta)</option>
                    <option value="FBE Campus">FBE Campus</option>
                    <option value="Yared School">Yared School</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Describe the group purpose, meeting details, and goals..."
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGroup}
                  className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isCreatingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

