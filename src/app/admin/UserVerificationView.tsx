"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Download,
  Share2,
  MoreVertical,
  RotateCcw,
  Sparkles,
  Check,
  X,
  GraduationCap,
  FileBadge,
  Ban,
  Eye,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2
} from "lucide-react";
import {
  getStudentDirectory,
  reviewStudentPostReady,
  moderateStudentUser,
  exportStudentRegistryCSV,
  StudentRecordView
} from "./userDirectoryActions";
import { ModerationActionType } from "@prisma/client";

interface UserVerificationViewProps {
  onBackToOverview?: () => void;
  initialTab?: "ALL" | "POST_READY" | "RESTRICTED" | "FACULTY";
}

export function UserVerificationView({
  onBackToOverview,
  initialTab = "ALL"
}: UserVerificationViewProps) {
  // Tab and Filters
  const [activeKpiTab, setActiveKpiTab] = useState<"ALL" | "POST_READY" | "RESTRICTED" | "FACULTY">(
    initialTab
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("All AAU Campuses");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedYear, setSelectedYear] = useState("All Academic Years");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name" | "post_ready">("recent");

  // Pagination & Data State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    postReady: 0,
    restricted: 0,
    faculty: 0
  });
  const [studentsList, setStudentsList] = useState<StudentRecordView[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecordView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("Violation of community safety guidelines");
  const [suspendDays, setSuspendDays] = useState(2);
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  const [requestInfoNotes, setRequestInfoNotes] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveKpiTab(initialTab);
      setCurrentPage(1);
    }
  }, [initialTab]);

  // Fetch Directory Data
  const fetchDirectory = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getStudentDirectory({
        page: currentPage,
        pageSize,
        tab: activeKpiTab,
        search: debouncedSearch,
        department: selectedDept,
        year: selectedYear,
        status: selectedStatus,
        sortBy
      });

      setStudentsList(result.students);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setTabCounts(result.tabCounts);

      // Keep selection or default to first
      if (result.students.length > 0) {
        setSelectedStudent((prev) => {
          if (!prev) return result.students[0];
          const matched = result.students.find((s) => s.id === prev.id);
          return matched || result.students[0];
        });
      } else {
        setSelectedStudent(null);
      }
    } catch (err: any) {
      triggerToast("Failed to load directory: " + (err?.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    activeKpiTab,
    debouncedSearch,
    selectedDept,
    selectedYear,
    selectedStatus,
    sortBy
  ]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Action: Approve Post-Ready
  const handleApprovePostReady = async () => {
    if (!selectedStudent || !selectedStudent.postReadyApp) return;
    setIsActionLoading(true);
    try {
      await reviewStudentPostReady(
        selectedStudent.postReadyApp.id,
        selectedStudent.id,
        "APPROVE",
        "Approved by Admin inspection drawer"
      );
      triggerToast(`Post-Ready access approved for ${selectedStudent.name}.`);
      fetchDirectory();
    } catch (err: any) {
      triggerToast("Approval failed: " + (err?.message || "Error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Reject Post-Ready
  const handleRejectPostReady = async () => {
    if (!selectedStudent || !selectedStudent.postReadyApp) return;
    setIsActionLoading(true);
    try {
      await reviewStudentPostReady(
        selectedStudent.postReadyApp.id,
        selectedStudent.id,
        "REJECT",
        "Does not meet editorial guidelines"
      );
      triggerToast(`Post-Ready application for ${selectedStudent.name} rejected.`);
      fetchDirectory();
    } catch (err: any) {
      triggerToast("Rejection failed: " + (err?.message || "Error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Request Info
  const handleRequestInfoSubmit = async () => {
    if (!selectedStudent || !selectedStudent.postReadyApp) return;
    setIsActionLoading(true);
    try {
      await reviewStudentPostReady(
        selectedStudent.postReadyApp.id,
        selectedStudent.id,
        "REQUEST_INFO",
        requestInfoNotes || "Please provide supporting documentation regarding campus leadership."
      );
      triggerToast(`Information requested from ${selectedStudent.name}.`);
      setIsRequestInfoModalOpen(false);
      setRequestInfoNotes("");
      fetchDirectory();
    } catch (err: any) {
      triggerToast("Failed to request info: " + (err?.message || "Error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Suspend Account
  const handleSuspendSubmit = async () => {
    if (!selectedStudent) return;
    setIsActionLoading(true);
    try {
      await moderateStudentUser({
        userId: selectedStudent.id,
        actionType: ModerationActionType.SUSPENSION,
        reason: suspendReason,
        durationDays: suspendDays
      });
      triggerToast(`Account for ${selectedStudent.name} suspended (${suspendDays}d duration).`);
      const suspendedDate = new Date();
      suspendedDate.setDate(suspendedDate.getDate() + suspendDays);
      setSelectedStudent((prev) => prev ? { ...prev, restrictedUntil: suspendedDate } : null);
      setIsSuspendModalOpen(false);
      fetchDirectory();
    } catch (err: any) {
      triggerToast("Suspension failed: " + (err?.message || "Error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Lift Suspension / Restore Account
  const handleLiftSuspension = async () => {
    if (!selectedStudent) return;
    setIsActionLoading(true);
    try {
      await moderateStudentUser({
        userId: selectedStudent.id,
        actionType: ModerationActionType.UNBAN,
        reason: "Administrative suspension lifted / account restored"
      });
      triggerToast(`Suspension lifted for ${selectedStudent.name}. Account active.`);
      setSelectedStudent((prev) => prev ? { ...prev, banned: false, restrictedUntil: null } : null);
      fetchDirectory();
    } catch (err: any) {
      triggerToast("Failed to lift suspension: " + (err?.message || "Error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Warn Account
  const handleWarnStudent = async () => {
    if (!selectedStudent) return;
    setIsActionLoading(true);
    try {
      await moderateStudentUser({
        userId: selectedStudent.id,
        actionType: ModerationActionType.WARNING,
        reason: "Official conduct warning issued via student inspector"
      });
      triggerToast(`Warning issued to ${selectedStudent.name}.`);
      fetchDirectory();
    } catch (err: any) {
      triggerToast("Warning failed: " + (err?.message || "Error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: CSV Export
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvString = await exportStudentRegistryCSV({
        tab: activeKpiTab,
        search: debouncedSearch,
        department: selectedDept,
        year: selectedYear,
        status: selectedStatus
      });

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `AAU_UniChat_Students_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      triggerToast("Student registry CSV exported successfully.");
    } catch (err: any) {
      triggerToast("Export failed: " + (err?.message || "Error"));
    } finally {
      setIsExporting(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedCampus("All AAU Campuses");
    setSelectedDept("All Departments");
    setSelectedYear("All Academic Years");
    setSelectedStatus("All Statuses");
    setSortBy("recent");
    setCurrentPage(1);
    triggerToast("Filters reset to default.");
  };

  return (
    <div className="w-full space-y-5 font-sf-pro tracking-[-0.01em]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Verification Rules Policy Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Uni-Chat Verification Architecture</h3>
              </div>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-1">Tier 1: Student Identity Verification</h4>
                <p>
                  Requires confirmation of an official Ethiopian university email address (e.g.{" "}
                  <code>@aau.edu.et</code>). Verification tokens are cryptographically signed and expire after 24 hours.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Tier 2: Post-Ready Publisher Certification</h4>
                <p>
                  Separate from basic student verification. Trusted creators, club leaders, and campus representatives apply
                  for editorial approval to post announcements on the official campus feed.
                </p>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Note: Uni-Chat publishing certification is an internal platform policy and not a direct AAU Registrar accreditation.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {isSuspendModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Suspend Account: {selectedStudent.name}</h3>
            </div>
            <p className="text-xs text-slate-600">
              This action temporarily restricts the student from chatting, matching, and publishing for the selected duration.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Duration</label>
                <select
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value={2}>2 Days (48 Hours Cooldown)</option>
                  <option value={7}>7 Days (1 Week Suspension)</option>
                  <option value={14}>14 Days (2 Weeks Suspension)</option>
                  <option value={30}>30 Days (1 Month Suspension)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Reason for Record</label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Reason for suspension..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendSubmit}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isActionLoading ? "Processing..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {isRequestInfoModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Request Information: {selectedStudent.name}</h3>
            </div>
            <p className="text-xs text-slate-600">
              Send an official notification to the student requesting clarification regarding their Post-Ready application.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Notes / Instructions</label>
              <textarea
                value={requestInfoNotes}
                onChange={(e) => setRequestInfoNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Please provide a link to your student club page or department recommendation letter..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsRequestInfoModalOpen(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfoSubmit}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isActionLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. BREADCRUMBS & MAIN PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button onClick={onBackToOverview} className="hover:text-slate-800 hover:underline cursor-pointer">
              Admin Console
            </button>
            <span className="text-slate-300">&gt;</span>
            <span className="hover:text-slate-800 cursor-pointer">Students &amp; Verification</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-700 font-semibold">Directory Registry</span>
          </nav>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 tracking-tight mt-1">
            Student Directory &amp; Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage verified student identities, post-ready publishing credentials, academic credentials, and community safety standing across AAU campuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Verification Rules</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Exporting..." : `Export Student Registry (${totalCount})`}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI STATUS TABS & INTEGRATION BANNER */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => {
              setActiveKpiTab("ALL");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeKpiTab === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>All Students</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeKpiTab === "ALL" ? "bg-slate-700 text-white" : "bg-white text-slate-700"}`}>
              {tabCounts.all}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveKpiTab("POST_READY");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeKpiTab === "POST_READY"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
            }`}
          >
            <span>Post-Ready Applications</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeKpiTab === "POST_READY" ? "bg-blue-800 text-white" : "bg-blue-200/80 text-blue-800"}`}>
              {tabCounts.postReady} Pending
            </span>
          </button>

          <button
            onClick={() => {
              setActiveKpiTab("RESTRICTED");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeKpiTab === "RESTRICTED"
                ? "bg-red-600 text-white shadow-2xs"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60"
            }`}
          >
            <span>Restricted / Flagged</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${activeKpiTab === "RESTRICTED" ? "bg-red-800 text-white" : "bg-red-200/80 text-red-800"}`}>
              {tabCounts.restricted}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveKpiTab("FACULTY");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeKpiTab === "FACULTY"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Staff &amp; Officials</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeKpiTab === "FACULTY" ? "bg-slate-700 text-white" : "bg-white text-slate-700"}`}>
              {tabCounts.faculty}
            </span>
          </button>
        </div>

        {/* Truthful System Authentication Banner */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Authentication Handshake: Institutional Domain Verification</span>
        </div>
      </div>

      {/* 3. FILTER CONTROLS & ACTIVE CHIPS TOOLBAR */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, @email handle..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white"
            />
          </div>

          {/* Dropdown 1: Campus */}
          <select
            value={selectedCampus}
            onChange={(e) => {
              setSelectedCampus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="All AAU Campuses">Campus: All AAU Campuses</option>
            <option value="4 Kilo">4 Kilo (CNCS)</option>
            <option value="5 Kilo">5 Kilo (AAiT)</option>
            <option value="6 Kilo">Sidist Kilo</option>
            <option value="Black Lion">Black Lion (CHS)</option>
            <option value="Lideta">Lideta (EiABC)</option>
          </select>

          {/* Dropdown 2: Dept */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="All Departments">Dept: All Departments</option>
            <option value="Computer Science">Dept: Computer Science</option>
            <option value="Software Engineering">Dept: Software Engineering</option>
            <option value="Electrical Engineering">Dept: Electrical Engineering</option>
            <option value="Biomedical Engineering">Dept: Biomedical Engineering</option>
            <option value="Architecture">Dept: Architecture</option>
            <option value="School of Law">Dept: School of Law</option>
            <option value="Medicine">Dept: Medicine</option>
          </select>

          {/* Dropdown 3: Year */}
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="All Academic Years">Year: All Academic Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="5th Year">5th Year</option>
          </select>

          {/* Dropdown 4: Status */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-blue-50/80 border border-blue-200 text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="All Statuses">Status: All Statuses</option>
            <option value="Post-Ready Applicant">Status: Post-Ready Applicant</option>
            <option value="Verified Standard">Status: Verified Standard</option>
            <option value="Approved Post-Ready">Status: Approved Post-Ready</option>
            <option value="Unverified">Status: Unverified</option>
            <option value="Suspended">Status: Suspended</option>
          </select>

          {/* Reset Filters Icon */}
          <button
            onClick={handleResetFilters}
            title="Reset Filters"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Filter Criteria Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Active Criteria:</span>
          {debouncedSearch && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs">
              <span>Query: &quot;{debouncedSearch}&quot;</span>
              <button onClick={() => setSearchQuery("")} className="hover:text-slate-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDept !== "All Departments" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <span>Dept: {selectedDept}</span>
              <button onClick={() => setSelectedDept("All Departments")} className="hover:text-slate-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedYear !== "All Academic Years" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <span>Year: {selectedYear}</span>
              <button onClick={() => setSelectedYear("All Academic Years")} className="hover:text-slate-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStatus !== "All Statuses" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              <span>Status: {selectedStatus}</span>
              <button onClick={() => setSelectedStatus("All Statuses")} className="hover:text-blue-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 ml-2 hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      </div>

      {/* 2-PANE RESPONSIVE SPLIT: Table (65%) + Sticky Inspection Drawer (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER MAIN COLUMN (~65% - 7 of 12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
            {/* Table Metadata Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Showing {studentsList.length} of {totalCount} platform records
              </span>
              <div className="flex items-center gap-1 font-medium">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  <option value="recent">Recent Join Date</option>
                  <option value="oldest">Oldest Accounts</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="post_ready">Recent Post-Ready Application</option>
                </select>
              </div>
            </div>

            {/* Desktop / Tablet Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Student Identity</th>
                    <th className="py-3 px-3">Dept &amp; Year</th>
                    <th className="py-3 px-3">Verification</th>
                    <th className="py-3 px-3">Post-Ready</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading database directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : studentsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        No student records match your query.
                      </td>
                    </tr>
                  ) : (
                    studentsList.map((student) => {
                      const isSelected = selectedStudent?.id === student.id;
                      const isSuspended = student.banned || (student.restrictedUntil ? new Date(student.restrictedUntil) > new Date() : false);
                      return (
                        <tr
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          className={`group cursor-pointer transition-colors duration-150 ${
                            isSelected ? "bg-slate-100/90 font-medium" : "hover:bg-slate-50/70"
                          }`}
                        >
                          {/* Student Identity */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                                }`}
                              >
                                {student.avatar}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 truncate">{student.name}</span>
                                  {student.verified && !isSuspended && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {student.handle} · {student.studentId}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Dept & Campus */}
                          <td className="py-3.5 px-3">
                            <p className="font-medium text-slate-800 truncate max-w-[140px]">{student.dept}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {student.campus} · {student.year}
                            </p>
                          </td>

                          {/* Verification */}
                          <td className="py-3.5 px-3">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-semibold border border-red-200/60">
                                Suspended
                              </span>
                            ) : student.verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200/60">
                                Unverified
                              </span>
                            )}
                          </td>

                          {/* Post-Ready Status */}
                          <td className="py-3.5 px-3">
                            {student.postReadyStatus === "APPROVED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/60">
                                ✓ Approved
                              </span>
                            )}
                            {(student.postReadyStatus === "PENDING" || student.postReadyStatus === "UNDER_REVIEW") && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold border border-blue-200">
                                ⏳ Pending
                              </span>
                            )}
                            {student.postReadyStatus === "NOT_APPLIED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/60">
                                Standard
                              </span>
                            )}
                            {student.postReadyStatus === "REJECTED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-medium border border-red-200/60">
                                Rejected
                              </span>
                            )}
                            {student.postReadyStatus === "MORE_INFO_REQUESTED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200">
                                Info Needed
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-3 text-right">
                            {isSelected ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs">
                                &gt;
                              </span>
                            ) : (
                              <span className="text-slate-400 group-hover:text-slate-700 p-1 rounded">
                                ···
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {isLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs">Loading database directory...</span>
                  </div>
                </div>
              ) : studentsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No student records match your query.
                </div>
              ) : (
                studentsList.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  const isSuspended = student.banned || (student.restrictedUntil ? new Date(student.restrictedUntil) > new Date() : false);
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`p-3.5 transition-colors cursor-pointer ${
                        isSelected ? "bg-slate-100/90 font-medium" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {student.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs truncate">{student.name}</span>
                              {student.verified && !isSuspended && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {student.handle} · {student.studentId}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
                            isSelected
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isSelected ? "Active" : "Inspect"}
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-800">{student.dept}</span>
                        <span className="text-slate-400"> · {student.campus} · {student.year}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold border border-red-200/60">
                            Suspended
                          </span>
                        ) : student.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200/60">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200/60">
                            Unverified
                          </span>
                        )}

                        {student.postReadyStatus === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200/60">
                            Post-Ready: Approved
                          </span>
                        )}
                        {(student.postReadyStatus === "PENDING" || student.postReadyStatus === "UNDER_REVIEW") && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold border border-blue-200">
                            Post-Ready: ⏳ Pending
                          </span>
                        )}
                        {student.postReadyStatus === "NOT_APPLIED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/60">
                            Post-Ready: Standard
                          </span>
                        )}
                        {student.postReadyStatus === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium border border-red-200/60">
                            Post-Ready: Rejected
                          </span>
                        )}
                        {student.postReadyStatus === "MORE_INFO_REQUESTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">
                            Post-Ready: Info Needed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1 font-medium">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline" /> Previous
                </button>
                <span className="px-2 font-bold text-slate-800">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 inline" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN INSPECTION DRAWER / DETAIL PANE (~35% - 5 of 12 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
          {selectedStudent ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-5 shadow-xs">
              {/* Module A: Header & Profile Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {selectedStudent.avatar}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        selectedStudent.banned || (selectedStudent.restrictedUntil && new Date(selectedStudent.restrictedUntil) > new Date())
                          ? "bg-red-500"
                          : selectedStudent.verified
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    ></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedStudent.name}</h2>
                      {selectedStudent.verified && !(selectedStudent.banned || (selectedStudent.restrictedUntil && new Date(selectedStudent.restrictedUntil) > new Date())) && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedStudent.handle} · Joined {selectedStudent.joinedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(selectedStudent.email);
                      triggerToast("Copied email address to clipboard");
                    }}
                    title="Copy Email"
                    className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedStudent.banned || (selectedStudent.restrictedUntil && new Date(selectedStudent.restrictedUntil) > new Date()) ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/70">
                    <Ban className="w-3.5 h-3.5 text-red-500" />
                    Suspended Account
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      selectedStudent.verified
                        ? "bg-blue-50 text-blue-700 border-blue-200/60"
                        : "bg-amber-50 text-amber-700 border-amber-200/60"
                    }`}
                  >
                    🎓 {selectedStudent.verified ? "Verified AAU Student" : "Pending Email Verification"}
                  </span>
                )}
                {selectedStudent.postReadyStatus === "PENDING" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200">
                    📝 Post-Ready Applicant
                  </span>
                )}
                {selectedStudent.postReadyStatus === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    ✓ Post-Ready Publisher
                  </span>
                )}
                {selectedStudent.banned && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                    ⛔ Banned Account
                  </span>
                )}
              </div>

              {/* Module B: Post-Ready Application Triage Box (If applicable) */}
              {selectedStudent.postReadyApp &&
                (selectedStudent.postReadyStatus === "PENDING" ||
                  selectedStudent.postReadyStatus === "UNDER_REVIEW") && (
                  <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Post-Ready Application Triage</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                        Queue {selectedStudent.postReadyApp.queueNumber}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">
                      Submitted {selectedStudent.postReadyApp.submittedAgo} · Needs Admin Clearance
                    </div>

                    {/* Motivation quote */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Student Motivation &amp; Publishing Intent
                      </span>
                      <p className="text-xs text-slate-700 italic bg-white/80 p-3 rounded-lg border border-blue-100 leading-relaxed">
                        &quot;{selectedStudent.postReadyApp.motivation}&quot;
                      </p>
                      {selectedStudent.postReadyApp.sampleLink && (
                        <a
                          href={selectedStudent.postReadyApp.sampleLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline mt-1"
                        >
                          <span>View Sample Content / Portfolio</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* 3-Button Action Bar */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={handleApprovePostReady}
                        disabled={isActionLoading}
                        className="col-span-1 py-2 px-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => setIsRequestInfoModalOpen(true)}
                        disabled={isActionLoading}
                        className="col-span-1 py-2 px-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        Request Info
                      </button>
                      <button
                        onClick={handleRejectPostReady}
                        disabled={isActionLoading}
                        className="col-span-1 py-2 px-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

              {/* Module C: Campus Credentials & Institutional Email */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Campus Credentials &amp; Verification
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">Institutional ID</span>
                    <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{selectedStudent.studentId}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block">University Email</span>
                    <span className="text-xs font-bold text-slate-900 truncate mt-0.5 block" title={selectedStudent.email}>
                      {selectedStudent.email}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">Department / College</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedStudent.dept}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">Academic Status</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedStudent.academicStanding}</span>
                  </div>
                </div>
              </div>

              {/* Module D: Engagement & Social Graph Metrics */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Uni-Chat Activity Metrics
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-medium block">Clubs</span>
                    <span className="text-base font-bold text-slate-900">{selectedStudent.metrics.clubs}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-medium block">Groups</span>
                    <span className="text-base font-bold text-slate-900">{selectedStudent.metrics.created}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-medium block">Sessions</span>
                    <span className="text-base font-bold text-slate-900">{selectedStudent.metrics.matches}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-medium block">Flags</span>
                    <span className={`text-base font-bold ${selectedStudent.metrics.flags > 0 ? "text-red-600" : "text-slate-900"}`}>
                      {selectedStudent.metrics.flags}
                    </span>
                  </div>
                </div>

                {/* Affiliated groups sub-item */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700 truncate">
                      Groups:{" "}
                      <strong>
                        {selectedStudent.groups.length > 0
                          ? selectedStudent.groups.join(", ")
                          : "No group memberships"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Module E: Safety & Integrity Footprint */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Safety &amp; Moderation Record
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      selectedStudent.warningCount > 0
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    ● {selectedStudent.warningCount > 0 ? `${selectedStudent.warningCount} Warnings` : "Clean Record"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Session Security</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {selectedStudent.deviceNode}
                    </p>
                  </div>
                </div>

                {/* Moderation History List */}
                {selectedStudent.moderationHistory.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Recent Moderation Actions:</span>
                    {selectedStudent.moderationHistory.map((m) => (
                      <div key={m.id} className="text-[11px] text-slate-700">
                        <span className="font-bold text-red-600">{m.actionType}</span> · {m.reason} ({m.createdAt} by {m.adminName})
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  {selectedStudent.banned || (selectedStudent.restrictedUntil && new Date(selectedStudent.restrictedUntil) > new Date()) ? (
                    <button
                      onClick={handleLiftSuspension}
                      disabled={isActionLoading}
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Lift Suspension / Restore</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsSuspendModalOpen(true)}
                      className="text-red-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspend Account</span>
                    </button>
                  )}
                  <button
                    onClick={handleWarnStudent}
                    disabled={isActionLoading}
                    className="text-amber-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Issue Warning</span>
                  </button>
                </div>
              </div>

              {/* Module F: Truthful Platform Security Handshake */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 text-[11px]">
                    Identity Handshake: Institutional domain verification active
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200/60">
                  Active
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-400">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Select a student record from the directory to inspect profile dossiers and credentials.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
