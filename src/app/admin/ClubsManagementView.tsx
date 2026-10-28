"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  FileText,
  Plus,
  Users,
  Inbox,
  AlertTriangle,
  Scale,
  Search,
  ChevronDown,
  Building,
  CheckCircle2,
  Check,
  X,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  SlidersHorizontal,
  ChevronRight,
  Settings,
  MoreVertical,
  KeyRound,
  GraduationCap,
  Award,
  FileCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  FolderOpen,
  Loader2,
  RefreshCw,
  Ban,
  RotateCcw
} from "lucide-react";
import {
  getClubsManagementData,
  reviewClubApplicationAction,
  toggleClubRestrictionAction,
  updateClubStatusAction,
  registerOfficialClubAction,
  exportClubRegistryCsvAction,
  ClubMetricsDTO,
  CharterApplicationDTO,
  ClubSummaryDTO,
  ClubsDashboardData
} from "./clubActions";

interface ClubsManagementViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function ClubsManagementView({
  onBackToOverview,
  onShowToast
}: ClubsManagementViewProps) {
  // Live server data
  const [data, setData] = useState<ClubsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectedDocketId, setSelectedDocketId] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Filters & Search state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    "ALL" | "CHARTERS" | "ACADEMIC" | "ARTS"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState("All Campuses (AAU)");
  const [sponsorFilter, setSponsorFilter] = useState("Sponsor: Any Status");

  // Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgCategory, setNewOrgCategory] = useState("Academic & Tech");
  const [newOrgCampus, setNewOrgCampus] = useState("5 Kilo (AAiT)");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [newOrgLeadEmail, setNewOrgLeadEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Guidelines Modal State
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);

  // Rejection & Revision Modals
  const [rejectionModalApp, setRejectionModalApp] = useState<CharterApplicationDTO | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [revisionModalApp, setRevisionModalApp] = useState<CharterApplicationDTO | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Fetch live database records
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const result = await getClubsManagementData();
      setData(result);

      // Auto-select first application if none selected
      if (!selectedDocketId && result.applications.length > 0) {
        setSelectedDocketId(result.applications[0].docketId);
      }
    } catch (err: any) {
      console.error("Failed to load clubs data:", err);
      setError(err?.message || "Failed to load clubs records");
      onShowToast(err?.message || "Error connecting to club directory");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onShowToast, selectedDocketId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = data?.metrics || {
    totalRecognizedClubs: 0,
    newClubsThisSem: 0,
    collegiateZones: 6,
    complianceRate: 100,
    pendingCharters: 0,
    oldestPendingDays: 0,
    avgReviewDays: 0,
    studentParticipation: 0,
    verifiedParticipationRate: 0,
    totalStudents: 0,
    probationCount: 0,
    suspendedCount: 0,
    annualAuditClear: true
  };

  const applications = data?.applications || [];
  const clubs = data?.clubs || [];

  // Filtered Clubs
  const filteredClubs = clubs.filter((club) => {
    if (activeCategoryFilter === "ACADEMIC" && !club.category.toLowerCase().includes("academic") && !club.category.toLowerCase().includes("tech")) {
      return false;
    }
    if (activeCategoryFilter === "ARTS" && !club.category.toLowerCase().includes("arts") && !club.category.toLowerCase().includes("culture")) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = club.name.toLowerCase().includes(q);
      const matchCampus = club.campus.toLowerCase().includes(q);
      const matchLead = club.leadStudent.name.toLowerCase().includes(q);
      if (!matchName && !matchCampus && !matchLead) return false;
    }
    if (campusFilter !== "All Campuses (AAU)") {
      const cleanCampus = campusFilter.toLowerCase().replace(" (aait)", "").replace(" (cncs)", "").replace(" (main)", "");
      if (!club.campus.toLowerCase().includes(cleanCampus)) {
        return false;
      }
    }
    if (sponsorFilter === "Official Verified" && club.status !== "Official Verified") {
      return false;
    }
    if (sponsorFilter === "Restricted / Probationary" && !club.isRestricted && club.status !== "Probationary") {
      return false;
    }
    return true;
  });

  // Active selected item in drawer
  const selectedApplication = applications.find((a) => a.docketId === selectedDocketId) || null;
  const selectedClub = clubs.find((c) => c.id === selectedClubId) || null;

  // Action: Approve Charter
  const handleApproveCharter = async (app: CharterApplicationDTO) => {
    try {
      setIsActionSubmitting(true);
      await reviewClubApplicationAction(app.id, "APPROVE");
      onShowToast(`Charter Granted! "${app.clubName}" is now an Official Recognized Organization.`);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to approve charter");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Action: Request Revisions
  const handleConfirmRequestRevisions = async () => {
    if (!revisionModalApp) return;
    try {
      setIsActionSubmitting(true);
      await reviewClubApplicationAction(
        revisionModalApp.id,
        "REQUEST_REVISIONS",
        revisionNote.trim() || "Please provide additional details on club bylaws and membership."
      );
      onShowToast(`Revision notice sent to "${revisionModalApp.clubName}" leadership.`);
      setRevisionModalApp(null);
      setRevisionNote("");
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to submit revision request");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Action: Reject Charter
  const handleConfirmRejection = async () => {
    if (!rejectionModalApp) return;
    try {
      setIsActionSubmitting(true);
      await reviewClubApplicationAction(
        rejectionModalApp.id,
        "REJECT",
        rejectionReason.trim() || "Application does not meet student organization requirements."
      );
      onShowToast(`Charter docket "${rejectionModalApp.clubName}" rejected.`);
      setRejectionModalApp(null);
      setRejectionReason("");
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to reject charter");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Action: Toggle Club Restriction
  const handleToggleRestriction = async (club: ClubSummaryDTO) => {
    try {
      setIsActionSubmitting(true);
      const nextState = !club.isRestricted;
      await toggleClubRestrictionAction(
        club.id,
        nextState,
        nextState ? "Administrative policy review" : undefined
      );
      onShowToast(nextState ? `Restricted "${club.name}"` : `Lifted restriction on "${club.name}"`);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update restriction state");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Action: Toggle Suspension
  const handleToggleSuspension = async (club: ClubSummaryDTO) => {
    try {
      setIsActionSubmitting(true);
      const newStatus = club.status === "Suspended" ? "APPROVED" : "SUSPENDED";
      await updateClubStatusAction(club.id, newStatus, newStatus === "SUSPENDED" ? "Governance suspension" : undefined);
      onShowToast(newStatus === "SUSPENDED" ? `Suspended "${club.name}"` : `Restored "${club.name}" to Active status`);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update club status");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Action: Submit manual registration
  const handleCreateOfficialOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      onShowToast("Please enter the organization name");
      return;
    }

    try {
      setIsRegistering(true);
      await registerOfficialClubAction({
        name: newOrgName,
        description: newOrgDescription || "Official recognized student organization on Uni-Chat.",
        category: newOrgCategory,
        campus: newOrgCampus,
        leadStudentEmail: newOrgLeadEmail || undefined,
      });

      onShowToast(`Successfully registered "${newOrgName}" into AAU Official Directory!`);
      setIsRegisterModalOpen(false);
      setNewOrgName("");
      setNewOrgDescription("");
      setNewOrgLeadEmail("");
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to register organization");
    } finally {
      setIsRegistering(false);
    }
  };

  // Action: Export Registry to CSV
  const handleExportRegistry = async () => {
    try {
      onShowToast("Exporting official registry records (CSV)...");
      const csvData = await exportClubRegistryCsvAction();

      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `aau_clubs_registry_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast("CSV registry export downloaded successfully!");
    } catch (err: any) {
      onShowToast(err?.message || "Failed to export registry");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading student organizations registry...</p>
          <p className="text-xs text-slate-400">Connecting to PostgreSQL and live charter dockets</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Unable to load club records</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sf-pro tracking-[-0.01em]">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER & BREADCRUMBS & TOP ACTIONS */}
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
            Organizations &amp; Extracurriculars
          </span>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">Club Registry &amp; Charters</span>
        </div>

        {/* Title, Subtext & Action Cluster */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Clubs &amp; Student Organizations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Review student club charter applications, manage official recognized student organizations, and monitor club health across AAU campuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Refresh */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              title="Refresh Data"
              className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* Export Registry (CSV) */}
            <button
              onClick={handleExportRegistry}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Registry (CSV)</span>
            </button>

            {/* Charter Guidelines */}
            <button
              onClick={() => setIsGuidelinesModalOpen(true)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Charter Guidelines</span>
            </button>

            {/* + Register Official Org */}
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register Official Org</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI SUMMARY METRIC STRIP (4 Equal Cards) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: TOTAL RECOGNIZED CLUBS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                TOTAL RECOGNIZED CLUBS
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900">
                {metrics.totalRecognizedClubs}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-full">
                +{metrics.newClubsThisSem} this sem
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Across {metrics.collegiateZones} collegiate zones</span>
              <span className="text-emerald-600 font-semibold">{metrics.complianceRate}% compliance</span>
            </div>
          </div>

          {/* Card 2: PENDING CHARTERS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                PENDING CHARTERS
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900">
                {metrics.pendingCharters}
              </span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-full">
                Awaiting Action
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Oldest: {metrics.oldestPendingDays}d ago</span>
              <span className="text-rose-600 font-semibold">Triage queue active</span>
            </div>
          </div>

          {/* Card 3: STUDENT PARTICIPATION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                STUDENT PARTICIPATION
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900">
                {metrics.studentParticipation.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {metrics.verifiedParticipationRate}% verified
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-slate-900 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, metrics.verifiedParticipationRate))}%` }}
                />
              </div>
              <div className="flex justify-end text-[10px] text-slate-400 font-semibold">
                <span>{metrics.totalStudents} Registered Students</span>
              </div>
            </div>
          </div>

          {/* Card 4: DISCIPLINARY STATUS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                DISCIPLINARY STATUS
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900">
                {metrics.probationCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">restricted</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="text-slate-400">{metrics.suspendedCount} Suspended</span>
              <span className={metrics.annualAuditClear ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                {metrics.annualAuditClear ? "All records clear" : "Action required"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN WORKSPACE (~65% Left / Center, ~35% Right Drawer) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT / CENTER COLUMN (~65% - 8 Columns) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Segmented Filter Bar & Search Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            {/* Category Segmented Control */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCategoryFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategoryFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Clubs ({metrics.totalRecognizedClubs})
              </button>
              <button
                onClick={() => setActiveCategoryFilter("CHARTERS")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeCategoryFilter === "CHARTERS"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Charter Applications</span>
                <span className="bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {applications.length}
                </span>
              </button>
              <button
                onClick={() => setActiveCategoryFilter("ACADEMIC")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategoryFilter === "ACADEMIC"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Academic &amp; Tech
              </button>
              <button
                onClick={() => setActiveCategoryFilter("ARTS")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategoryFilter === "ARTS"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Arts &amp; Culture
              </button>
            </div>

            {/* Search & Selectors Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
              {/* Search Bar */}
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clubs, student leads, campuses..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Campus Selector */}
              <div className="sm:col-span-3 relative">
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="All Campuses (AAU)">All Campuses (AAU)</option>
                  <option value="5 Kilo (AAiT)">5 Kilo (AAiT)</option>
                  <option value="4 Kilo (CNCS)">4 Kilo (CNCS)</option>
                  <option value="Sidist Kilo (Main)">Sidist Kilo (Main)</option>
                  <option value="Black Lion">Tikur Anbessa (Health)</option>
                  <option value="Yared Music">Yared Music School</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Sponsor Status Selector */}
              <div className="sm:col-span-3 relative">
                <select
                  value={sponsorFilter}
                  onChange={(e) => setSponsorFilter(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="Sponsor: Any Status">Sponsor: Any Status</option>
                  <option value="Official Verified">Official Verified</option>
                  <option value="Restricted / Probationary">Restricted / Probationary</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION A: "Pending Charter Applications" (Action Cards) */}
          {/* ======================================================================= */}
          {(activeCategoryFilter === "ALL" || activeCategoryFilter === "CHARTERS") && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-slate-800" />
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Pending Charter Applications
                  </h2>
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {applications.length} triage needed
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/50">
                  Uni-Chat Charter Guidelines Regulated
                </span>
              </div>

              {/* Application Cards List */}
              {applications.length === 0 ? (
                <div className="py-8 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">All charter applications processed!</h4>
                  <p className="text-xs text-slate-500">No student organization dockets currently require triage.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const isSelected = selectedDocketId === app.docketId && !selectedClubId;

                    return (
                      <div
                        key={app.docketId}
                        onClick={() => {
                          setSelectedDocketId(app.docketId);
                          setSelectedClubId(null);
                        }}
                        className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500/80 bg-blue-50/20 ring-1 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Left Side: Avatar + Details */}
                          <div className="flex items-start gap-3.5">
                            {/* Avatar Icon Container */}
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                                app.status === "Pending Clearance"
                                  ? "bg-blue-100 text-blue-800"
                                  : app.status === "Under Review"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              <Sparkles className="w-5 h-5 text-blue-600" />
                            </div>

                            {/* Content Details */}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 leading-snug">
                                  {app.clubName}
                                </h3>
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    app.status === "Pending Clearance"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : app.status === "Under Review"
                                      ? "bg-slate-100 text-slate-700 border border-slate-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {app.status}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {app.submittedAgo}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600">
                                Submitted by{" "}
                                <span className="font-semibold text-slate-900">
                                  {app.submitterName}
                                </span>{" "}
                                • {app.submitterDept} •{" "}
                                <span className="font-bold text-slate-800">
                                  {app.signatoriesCount} student signatories
                                </span>
                              </p>

                              {/* Warning or Revision Notice */}
                              {app.warningNotice ? (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-50/70 p-2 rounded-xl border border-rose-200/50 mt-1">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{app.warningNotice}</span>
                                </div>
                              ) : null}

                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{app.proposedHub}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Action Buttons */}
                          <div className="flex flex-row sm:flex-col items-end gap-2 shrink-0 self-end sm:self-start">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocketId(app.docketId);
                                setSelectedClubId(null);
                                onShowToast(`Docket ${app.docketId} opened in Inspection Drawer.`);
                              }}
                              className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Review Application
                            </button>

                            <button
                              disabled={isActionSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveCharter(app);
                              }}
                              className="px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION B: "Recognized Organization Directory" Data Table */}
          {/* ======================================================================= */}
          {(activeCategoryFilter === "ALL" || activeCategoryFilter === "ACADEMIC" || activeCategoryFilter === "ARTS") && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-slate-800" />
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Recognized Organization Directory
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Showing {filteredClubs.length} of {clubs.length} Registered
                </span>
              </div>

              {/* Table */}
              {filteredClubs.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Building className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No organizations match filter</h4>
                  <p className="text-xs text-slate-500">
                    Approve charter applications or register an organization above to populate the directory.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop / Tablet Table (md+) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-3">CLUB / CHAPTER</th>
                          <th className="py-3 px-3">CAMPUS</th>
                          <th className="py-3 px-3">LEADERSHIP LEAD</th>
                          <th className="py-3 px-3">ACTIVE MEMBERS</th>
                          <th className="py-3 px-3">ADMIN STATUS</th>
                          <th className="py-3 px-3 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClubs.map((club) => {
                          const initials = club.name.charAt(0);
                          const isSelected = selectedClubId === club.id;

                          return (
                            <tr
                              key={club.id}
                              className={`transition-colors group cursor-pointer ${
                                isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                              }`}
                              onClick={() => {
                                setSelectedClubId(club.id);
                                onShowToast(`Selected organization: ${club.name} (${club.charterId})`);
                              }}
                            >
                              {/* Club / Chapter */}
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 border border-slate-200/60">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 text-xs">
                                        {club.name}
                                      </span>
                                      {club.status === "Official Verified" && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      )}
                                      {club.status === "Probationary" && (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      {club.category} • {club.charterId}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Campus */}
                              <td className="py-3.5 px-3 font-semibold text-slate-700">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                                  {club.campus}
                                </span>
                              </td>

                              {/* Leadership Lead */}
                              <td className="py-3.5 px-3">
                                <div className="font-semibold text-slate-800">
                                  {club.leadStudent.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {club.leadStudent.studentId}
                                </div>
                              </td>

                              {/* Active Members */}
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-slate-900">
                                  {club.activeMembers.toLocaleString()}
                                </div>
                                {club.auditNotice ? (
                                  <div className="text-[10px] font-semibold text-rose-600">
                                    {club.auditNotice}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400">
                                    {club.postsCount} posts
                                  </div>
                                )}
                              </td>

                              {/* Admin Status */}
                              <td className="py-3.5 px-3">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    club.status === "Official Verified"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                      : club.status === "Probationary"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                      : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  }`}
                                >
                                  {club.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClubId(club.id);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  title="Inspect Organization"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Responsive Cards (< md) */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredClubs.map((club) => {
                      const initials = club.name.charAt(0);
                      const isSelected = selectedClubId === club.id;

                      return (
                        <div
                          key={club.id}
                          className={`p-3.5 transition-colors cursor-pointer ${
                            isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                          }`}
                          onClick={() => {
                            setSelectedClubId(club.id);
                            onShowToast(`Selected organization: ${club.name} (${club.charterId})`);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 border border-slate-200/60 text-xs">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {club.name}
                                  </span>
                                  {club.status === "Official Verified" && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                  {club.status === "Probationary" && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {club.category} • {club.charterId}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClubId(club.id);
                              }}
                              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                              title="Inspect Organization"
                              aria-label={`Inspect ${club.name}`}
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Campus</span>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium mt-0.5">
                                {club.campus}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                                  club.status === "Official Verified"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                    : club.status === "Probationary"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                    : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                }`}
                              >
                                {club.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead</span>
                              <span className="font-semibold text-slate-800 text-[11px] block truncate">{club.leadStudent.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{club.leadStudent.studentId}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Members</span>
                              <span className="font-bold text-slate-900 text-[11px] block">{club.activeMembers.toLocaleString()} active</span>
                              {club.auditNotice ? (
                                <span className="text-[10px] font-semibold text-rose-600 block">{club.auditNotice}</span>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">{club.postsCount} posts</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: STICKY INSPECTION DRAWER - 4 Cols */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          {/* Mode A: Selected Recognized Club Dossier */}
          {selectedClub ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm animate-in fade-in">
              {/* Dossier Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {selectedClub.charterId}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  selectedClub.status === "Official Verified"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : selectedClub.status === "Probationary"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}>
                  {selectedClub.status}
                </span>
              </div>

              {/* Title & Category */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedClub.name}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {selectedClub.campus} • {selectedClub.category}
                </p>
              </div>

              {/* Mission / Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  MISSION &amp; PURPOSE
                </span>
                <p className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;{selectedClub.description}&rdquo;
                </p>
              </div>

              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block uppercase">Active Members</span>
                  <span className="text-slate-900 font-bold">{selectedClub.activeMembers}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block uppercase">Published Posts</span>
                  <span className="text-blue-700 font-bold">{selectedClub.postsCount} Posts</span>
                </div>
              </div>

              {/* Leadership Contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Lead Student: {selectedClub.leadStudent.name}</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-5">
                  {selectedClub.leadStudent.email} • {selectedClub.leadStudent.studentId}
                </div>
              </div>

              {/* Governance & Restriction Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isActionSubmitting}
                  onClick={() => handleToggleRestriction(selectedClub)}
                  className={`w-full py-2.5 px-4 rounded-full font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                    selectedClub.isRestricted
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{selectedClub.isRestricted ? "Lift Restriction" : "Place on Administrative Probation"}</span>
                </button>

                <button
                  type="button"
                  disabled={isActionSubmitting}
                  onClick={() => handleToggleSuspension(selectedClub)}
                  className={`w-full py-2 px-3 rounded-full border font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedClub.status === "Suspended"
                      ? "border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                      : "border-rose-200 text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  {selectedClub.status === "Suspended" ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore to Active</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspend Organization</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : selectedApplication ? (
            /* Mode B: Selected Pending Charter Application Dossier */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm animate-in fade-in">
              {/* Dossier Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {selectedApplication.docketId}
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Charter Docket
                </span>
              </div>

              {/* Title & Department */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedApplication.clubName}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {selectedApplication.campusHub} • {selectedApplication.department}
                </p>
              </div>

              {/* Charter Scope & Facilities Box */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  CHARTER SCOPE &amp; FACILITIES
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-700 italic leading-relaxed">
                  &ldquo;{selectedApplication.scopeMission}&rdquo;
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Proposed Hub</span>
                    <span className="text-slate-800">{selectedApplication.proposedHub}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Sign-ups</span>
                    <span className="text-blue-700">{selectedApplication.signatoriesCount} Verified</span>
                  </div>
                </div>
              </div>

              {/* Verified Executive Board List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    VERIFIED EXECUTIVE BOARD
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {selectedApplication.strikesLogged} Strikes Logged
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedApplication.executiveBoard.map((officer, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                          {officer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900">
                              {officer.name}
                            </span>
                            {officer.verified && (
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {officer.role} • {officer.studentId}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {officer.dept || "Regular"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Advisor Clearance Card */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <GraduationCap className="w-4 h-4 text-blue-700" />
                  <span>Charter Sponsor Clearance</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {selectedApplication.facultyAdvisor.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {selectedApplication.facultyAdvisor.title}
                </div>
              </div>

              {/* Audit Info Callout */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
                <KeyRound className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Approval provisions isolated <strong>Club Owner</strong> permissions for {selectedApplication.submitterName} to publish official campus announcements to student feeds.
                </span>
              </div>

              {/* Action Footer */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isActionSubmitting}
                  onClick={() => handleApproveCharter(selectedApplication)}
                  className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve &amp; Grant Official Charter</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isActionSubmitting}
                    onClick={() => {
                      setRevisionModalApp(selectedApplication);
                      setRevisionNote("");
                    }}
                    className="py-2 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    Request Revisions
                  </button>
                  <button
                    type="button"
                    disabled={isActionSubmitting}
                    onClick={() => {
                      setRejectionModalApp(selectedApplication);
                      setRejectionReason("");
                    }}
                    className="py-2 px-3 rounded-full text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Charter</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Mode C: Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No organization selected</h4>
              <p className="text-xs text-slate-500">
                Select a pending charter application or recognized club to view its dossier.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER OFFICIAL ORG */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register Official Organization</h3>
                  <p className="text-xs text-slate-400">Direct administrative registration</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficialOrg} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Organization / Chapter Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. AAU Aerospace Society"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  required
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  placeholder="Brief summary of club mission..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Category
                  </label>
                  <select
                    value={newOrgCategory}
                    onChange={(e) => setNewOrgCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"
                  >
                    <option value="Academic & Tech">Academic &amp; Tech</option>
                    <option value="Arts & Culture">Arts &amp; Culture</option>
                    <option value="Civic">Civic</option>
                    <option value="Service">Service</option>
                    <option value="Sports & Wellness">Sports &amp; Wellness</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Primary Campus Hub
                  </label>
                  <select
                    value={newOrgCampus}
                    onChange={(e) => setNewOrgCampus(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"
                  >
                    <option value="5 Kilo (AAiT)">5 Kilo (AAiT)</option>
                    <option value="4 Kilo (CNCS)">4 Kilo (CNCS)</option>
                    <option value="Sidist Kilo">Sidist Kilo</option>
                    <option value="Black Lion">Black Lion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Student Lead Email (Optional)
                </label>
                <input
                  type="email"
                  value={newOrgLeadEmail}
                  onChange={(e) => setNewOrgLeadEmail(e.target.value)}
                  placeholder="e.g. dawit@aau.edu.et (Defaults to current admin if empty)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRegistering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHARTER GUIDELINES */}
      {/* ========================================================================= */}
      {isGuidelinesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Student Charter Guidelines</h3>
                  <p className="text-xs text-slate-400">Uni-Chat Extracurricular Governance Policy</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuidelinesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Charter Eligibility Standards:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                  <li><strong>Clear Statement of Purpose:</strong> Defined non-commercial mission contributing to academic, cultural, or collegiate student life.</li>
                  <li><strong>Active Student Leadership:</strong> Minimum 1 verified student applicant who assumes administrative ownership and publishing responsibility.</li>
                  <li><strong>University Affiliation:</strong> Open to enrolled students across accredited collegiate campuses.</li>
                  <li><strong>Platform Publishing:</strong> Approved clubs gain authorization to broadcast official events and opportunities directly to the student Home feed.</li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                All club activities and broadcasts are subject to Uni-Chat Community Standards. Administrative restrictions or suspensions may be applied for violations.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsGuidelinesModalOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REQUEST REVISIONS MODAL */}
      {/* ========================================================================= */}
      {revisionModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Revisions</h3>
                  <p className="text-xs text-slate-400">{revisionModalApp.clubName}</p>
                </div>
              </div>
              <button
                onClick={() => setRevisionModalApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Revision Instructions</label>
              <textarea
                rows={3}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Specify what bylaws, executive board information, or details need clarification..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRevisionModalApp(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionSubmitting}
                onClick={handleConfirmRequestRevisions}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isActionSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Send Revision Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REJECT CHARTER MODAL */}
      {/* ========================================================================= */}
      {rejectionModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Charter Application</h3>
                  <p className="text-xs text-slate-400">{rejectionModalApp.clubName}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectionModalApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this charter was rejected. The applicant will receive this notice..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalApp(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionSubmitting}
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isActionSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
