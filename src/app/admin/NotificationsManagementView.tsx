"use client";

import React, { useState } from "react";
import {
  Bell,
  Radio,
  RadioTower,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Download,
  ExternalLink,
  Shield,
  Zap,
  Clock,
  ChevronDown,
  Layers,
  Sparkles,
  X,
  Check,
  MoreVertical,
  Activity,
  Calendar,
  Lock,
  MessageSquare,
  Share2,
  Info,
  Filter,
  CheckCheck
} from "lucide-react";
import { useBroadcastMetrics } from "./notifications/hooks";
import { PendingClearanceItem, BroadcastHistoryItem } from "./notifications/types";

interface NotificationsManagementViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function NotificationsManagementView({
  onBackToOverview,
  onShowToast,
}: NotificationsManagementViewProps) {
  const {
    metrics,
    clearanceQueue,
    history,
    targetingOptions,
    currentAdmin,
    composerDraft,
    setComposerDraft,
    filterScope,
    setFilterScope,
    loading,
    isExporting,
    estimatedRecipients,
    estimationNote,
    refreshData,
    saveDraft,
    approveClearance,
    rejectClearance,
    dispatchBroadcast,
    cancelBroadcast,
    exportAuditCsv,
  } = useBroadcastMetrics();

  const [deviceSimMode, setDeviceSimMode] = useState<"iOS" | "Android">("iOS");
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<PendingClearanceItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deep link options
  const DEEP_LINK_OPTIONS = [
    { label: "Home Feed (/)", value: "/" },
    { label: "Peer Chat (/app/chat)", value: "/app/chat" },
    { label: "Student Profile (/profile)", value: "/profile" },
    { label: "ID Verification Portal (/verify)", value: "/verify" },
    { label: "Account Settings (/settings)", value: "/settings" },
    { label: "Admin Cockpit (/admin)", value: "/admin" },
  ];

  const handleCreateDraft = async (submitNow: boolean) => {
    if (!composerDraft.title.trim()) {
      onShowToast("Please enter a broadcast notification title");
      return;
    }
    if (!composerDraft.body.trim()) {
      onShowToast("Please enter broadcast body text");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveDraft(submitNow);
      if (res.success) {
        onShowToast(res.message || "Draft saved successfully.");
      } else {
        onShowToast(`Error: ${res.error || "Failed to save draft"}`);
      }
    } catch (err: any) {
      onShowToast(`Failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (item: PendingClearanceItem) => {
    setIsSubmitting(true);
    try {
      const res = await approveClearance(item.id);
      if (res.success) {
        onShowToast(res.message || "Broadcast approved.");
      } else {
        onShowToast(`Approval failed: ${res.error || "Failed to approve"}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReasonInput.trim() || rejectionReasonInput.trim().length < 5) {
      onShowToast("Please provide a reason with at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rejectClearance(rejectingItem.id, rejectionReasonInput.trim());
      if (res.success) {
        onShowToast(res.message || "Broadcast rejected.");
        setRejectingItem(null);
        setRejectionReasonInput("");
      } else {
        onShowToast(`Rejection failed: ${res.error || "Failed to reject"}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (item: BroadcastHistoryItem) => {
    setIsSubmitting(true);
    try {
      const res = await dispatchBroadcast(item.id);
      if (res.success) {
        onShowToast(res.message || "Broadcast dispatched.");
      } else {
        onShowToast(`Dispatch failed: ${res.error || "Failed to dispatch"}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (item: BroadcastHistoryItem) => {
    setIsSubmitting(true);
    try {
      const res = await cancelBroadcast(item.id);
      if (res.success) {
        onShowToast(res.message || "Broadcast cancelled.");
      } else {
        onShowToast(`Cancel failed: ${res.error || "Failed to cancel"}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      onShowToast("Generating broadcast audit CSV...");
      const res = await exportAuditCsv();
      if (res.success) {
        onShowToast(`Downloaded ${res.count} broadcast audit records.`);
      } else {
        onShowToast(`Export failed: ${(res as any).error || "Unknown export error"}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HEADER & QUICK ACTION BAR */}
      {/* ========================================================================= */}
      <section className="space-y-3.5">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span
            onClick={onBackToOverview}
            className="hover:text-slate-700 cursor-pointer transition"
          >
            Admin Console
          </span>
          <span>&gt;</span>
          <span>Communications</span>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">Notifications &amp; Broadcast Operations</span>
        </div>

        {/* Title, Subtitle & Action Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Campus Notifications &amp; Broadcast Operations
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-0.5 leading-relaxed">
                Author, review, approve, and distribute verified in-app communications and urgent campus notices across registered Uni-Chat student accounts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Delivery Policy */}
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Delivery Policy &amp; Scope</span>
            </button>

            {/* Export Audit CSV */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isExporting ? "Exporting..." : "Export Audit CSV"}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={loading}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-full font-medium transition flex items-center justify-center shadow-2xs cursor-pointer active:scale-95"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* + Author Broadcast */}
            <button
              onClick={() => {
                const composerElem = document.getElementById("push-composer-card");
                if (composerElem) {
                  composerElem.scrollIntoView({ behavior: "smooth" });
                }
                onShowToast("Focused on Broadcast Composer.");
              }}
              className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-full hover:bg-slate-800 flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 transition"
            >
              <Bell className="w-4 h-4" />
              <span>+ Author Broadcast</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. REAL METRIC KPI STRIP (Truthful Data from PostgreSQL) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: TOTAL BROADCASTS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                BROADCASTS RECORDED
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics ? metrics.totalBroadcastsCreated : 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">Operations</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>{metrics ? metrics.registeredStudentsCount : 0} student accounts</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: CLEARANCE QUEUE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div>
              <div className={`text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                (metrics?.pendingClearanceCount || 0) > 0 ? "text-rose-600" : "text-slate-400"
              }`}>
                {(metrics?.pendingClearanceCount || 0) > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                )}
                <span>AWAITING CLEARANCE</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics ? metrics.pendingClearanceCount : 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">Pending Review</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {(metrics?.pendingClearanceCount || 0) > 0 ? (
                  <span className="text-rose-600 font-bold">Action Required</span>
                ) : (
                  <span className="text-emerald-600 font-medium">Clearance Queue Clear</span>
                )}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              (metrics?.pendingClearanceCount || 0) > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
            }`}>
              <Bell className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: IN-APP DELIVERIES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                IN-APP NOTIFICATIONS
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics ? metrics.inAppNotificationsDelivered.toLocaleString() : 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">Records</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                <span className="text-emerald-600 font-bold">{metrics ? metrics.readRatePercentage : 0}%</span>
                <span>in-app read rate ({metrics ? metrics.inAppNotificationsRead : 0} read)</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: URGENT ACTIVE ALERTS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                URGENT ACTIVE ALERTS
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics ? metrics.urgentUnreadCount : 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">Unread</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                High-priority notifications currently unread by students
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* HONEST GATEWAY STATUS BANNER */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">Delivery Channel Infrastructure: </span>
              <span>In-App Persisted Notification Engine is <span className="font-bold text-emerald-700">LIVE</span>. External Native Mobile Push (FCM/APNs), University SIS Email, and SMS are currently unconnected/unsupported.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              ● In-App Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold">
              ○ Push/SMS Planned
            </span>
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
        <div className="lg:col-span-8 space-y-6">
          {/* ===================================================================== */}
          {/* Module A: Urgent Broadcast Clearance Queue */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                    Administrative Clearance Queue
                  </h2>
                  <p className="text-xs text-slate-500">
                    {clearanceQueue.length} broadcast{clearanceQueue.length === 1 ? "" : "s"} submitted for independent administrative review
                  </p>
                </div>
              </div>

              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                clearanceQueue.length > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
              }`}>
                {clearanceQueue.length} Pending
              </span>
            </div>

            {clearanceQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Clearance Queue is Empty</p>
                <p className="mt-0.5">All broadcast requests have been reviewed. New submissions from administrators will appear here for review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clearanceQueue.map((item) => {
                  const isEmergency = item.severity === "EMERGENCY";
                  const isAuthor = currentAdmin?.id === item.author.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-5 space-y-3.5 transition-all ${
                        isEmergency
                          ? "bg-rose-50/40 border-rose-200/80 shadow-2xs"
                          : "bg-blue-50/30 border-blue-200/80 shadow-2xs"
                      }`}
                    >
                      {/* Badge Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isEmergency
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : item.severity === "IMPORTANT"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {item.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            Requested by {item.author.name} ({item.author.department})
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>

                      {/* Body */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {item.body}
                      </p>

                      {/* Meta Chips */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Scope: {item.audienceScope} {item.targetDepartment ? `(${item.targetDepartment})` : item.targetCohort ? `(Year ${item.targetCohort})` : ""}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          <span>Link: {item.deepLink || "/"}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-200/60">
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={isSubmitting}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full font-semibold text-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Approve &amp; Clear for Dispatch</span>
                        </button>

                        <button
                          onClick={() => {
                            setComposerDraft({
                              title: item.title,
                              body: item.body,
                              severity: item.severity,
                              audienceScope: item.audienceScope,
                              targetDepartment: item.targetDepartment || "",
                              targetCohort: item.targetCohort || 1,
                              targetCampus: item.targetCampus || "All Campuses",
                              deepLink: item.deepLink || "/",
                              timing: "immediate",
                            });
                            onShowToast(`Loaded copy for "${item.title}" into composer.`);
                          }}
                          className="px-3.5 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          Review in Composer
                        </button>

                        <button
                          onClick={() => {
                            setRejectingItem(item);
                            setRejectionReasonInput("");
                          }}
                          disabled={isSubmitting}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1 transition cursor-pointer"
                        >
                          ✕ Reject with Reason
                        </button>

                        {isAuthor && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Note: You authored this draft
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* Module B: Past Broadcast History & Telemetry Data Table */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Broadcast History &amp; Delivery Telemetry
                </h3>
                <p className="text-xs text-slate-500">
                  Persistent PostgreSQL records with verified in-app delivery counts
                </p>
              </div>

              {/* Segmented Filter */}
              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                {(["ALL", "SENT", "PENDING", "DRAFT"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterScope(s)}
                    className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
                      filterScope === s
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {s === "ALL" ? "All Broadcasts" : s === "SENT" ? "Sent" : s === "PENDING" ? "Clearance" : "Drafts"}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Table */}
            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Radio className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800">No Broadcast Records Found</p>
                <p className="mt-0.5">Author a new draft in the composer on the right to start an administrative broadcast.</p>
              </div>
            ) : (
              <>
                {/* Desktop / Tablet Table (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">NOTIFICATION / SCOPE</th>
                        <th className="py-3 px-3">AUTHOR / REVIEWER</th>
                        <th className="py-3 px-3">DELIVERY TELEMETRY</th>
                        <th className="py-3 px-3">STATUS &amp; ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((item) => {
                        const isSent = item.status === "SENT";
                        const isApproved = item.status === "APPROVED";
                        const isPending = item.status === "PENDING_APPROVAL";
                        const isRejected = item.status === "REJECTED";

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Title & Scope */}
                            <td className="py-3.5 px-3 max-w-xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                    item.severity === "EMERGENCY"
                                      ? "bg-rose-100 text-rose-800"
                                      : item.severity === "IMPORTANT"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {item.severity}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                Scope: {item.audienceScope} {item.targetDepartment ? `(${item.targetDepartment})` : item.targetCohort ? `(Year ${item.targetCohort})` : ""}
                              </p>
                            </td>

                            {/* Author & Reviewer */}
                            <td className="py-3.5 px-3 text-slate-600">
                              <div className="font-semibold text-slate-900">{item.authorName}</div>
                              <div className="text-[11px] text-slate-400">
                                {item.reviewerName ? `Reviewed: ${item.reviewerName}` : "Unreviewed"}
                              </div>
                            </td>

                            {/* Telemetry */}
                            <td className="py-3.5 px-3">
                              {isSent ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900">
                                    {item.recipientCount.toLocaleString()} In-App Records
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {item.failureCount > 0 ? (
                                      <span className="text-rose-600 font-semibold">{item.failureCount} failed</span>
                                    ) : (
                                      <span className="text-emerald-600 font-semibold">100% delivered to target</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-slate-400 text-[11px]">
                                  {isApproved ? "Cleared · Ready to dispatch" : isPending ? "In Clearance Review" : "Draft / Unsent"}
                                </div>
                              )}
                            </td>

                            {/* Status & Actions */}
                            <td className="py-3.5 px-3">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isSent
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isApproved
                                      ? "bg-blue-100 text-blue-800"
                                      : isPending
                                      ? "bg-amber-100 text-amber-800"
                                      : isRejected
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {item.status}
                                </span>

                                {isApproved && (
                                  <button
                                    onClick={() => handleDispatch(item)}
                                    disabled={isSubmitting}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Dispatch Now</span>
                                  </button>
                                )}

                                {(isPending || isApproved) && (
                                  <button
                                    onClick={() => handleCancel(item)}
                                    disabled={isSubmitting}
                                    className="text-slate-500 hover:text-slate-700 text-[10px] font-medium underline cursor-pointer"
                                  >
                                    Cancel Broadcast
                                  </button>
                                )}

                                {isRejected && item.rejectionReason && (
                                  <div className="text-[10px] text-rose-600 max-w-xs">
                                    Reason: {item.rejectionReason}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {history.map((item) => {
                    const isSent = item.status === "SENT";
                    const isApproved = item.status === "APPROVED";
                    const isPending = item.status === "PENDING_APPROVAL";
                    const isRejected = item.status === "REJECTED";

                    return (
                      <div key={item.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                  item.severity === "EMERGENCY"
                                    ? "bg-rose-100 text-rose-800"
                                    : item.severity === "IMPORTANT"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {item.severity}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">{item.title}</p>
                            <p className="text-[11px] text-slate-500">
                              Scope: {item.audienceScope} {item.targetDepartment ? `(${item.targetDepartment})` : item.targetCohort ? `(Year ${item.targetCohort})` : ""}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSent
                                ? "bg-emerald-100 text-emerald-800"
                                : isApproved
                                ? "bg-blue-100 text-blue-800"
                                : isPending
                                ? "bg-amber-100 text-amber-800"
                                : isRejected
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-slate-50">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Author &amp; Reviewer</span>
                            <span className="font-semibold text-slate-900 text-[11px] block">{item.authorName}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {item.reviewerName ? `Rev: ${item.reviewerName}` : "Unreviewed"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Telemetry</span>
                            {isSent ? (
                              <div>
                                <span className="font-bold text-slate-900 text-[11px] block">
                                  {item.recipientCount.toLocaleString()} In-App Records
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {item.failureCount > 0 ? (
                                    <span className="text-rose-600 font-semibold">{item.failureCount} failed</span>
                                  ) : (
                                    <span className="text-emerald-600 font-semibold">100% delivered</span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] block">
                                {isApproved ? "Cleared · Ready to dispatch" : isPending ? "In Clearance Review" : "Draft / Unsent"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {(isApproved || isPending || (isRejected && item.rejectionReason)) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {isApproved && (
                              <button
                                onClick={() => handleDispatch(item)}
                                disabled={isSubmitting}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition"
                              >
                                <Send className="w-3 h-3" />
                                <span>Dispatch Now</span>
                              </button>
                            )}
                            {(isPending || isApproved) && (
                              <button
                                onClick={() => handleCancel(item)}
                                disabled={isSubmitting}
                                className="text-slate-500 hover:text-slate-700 text-[10px] font-medium underline cursor-pointer"
                              >
                                Cancel Broadcast
                              </button>
                            )}
                            {isRejected && item.rejectionReason && (
                              <div className="text-[10px] text-rose-600">
                                Reason: {item.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT DRAWER COLUMN (~35% - 4 Columns) - Push Composer & Simulation */}
        {/* ======================================================================= */}
        <div id="push-composer-card" className="lg:col-span-4 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateDraft(true);
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Broadcast Composer</h3>
                  <p className="text-[11px] text-slate-500">Author &amp; Target Notifications</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                In-App Engine
              </span>
            </div>

            {/* Audience Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Target Audience Scope
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    { id: "ALL", label: "All Students" },
                    { id: "DEPARTMENT", label: "Academic Dept" },
                    { id: "COHORT", label: "Year Cohort" },
                    { id: "CAMPUS", label: "Campus" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.id}
                    onClick={() =>
                      setComposerDraft((prev) => ({ ...prev, audienceScope: opt.id as any }))
                    }
                    className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition text-xs ${
                      composerDraft.audienceScope === opt.id
                        ? "border-slate-900 bg-slate-50 font-bold text-slate-900 shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={composerDraft.audienceScope === opt.id}
                      onChange={() => {}}
                      className="accent-slate-900"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Contextual Target Pickers */}
            {composerDraft.audienceScope === "DEPARTMENT" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Select Department
                </label>
                <div className="relative">
                  <select
                    value={composerDraft.targetDepartment}
                    onChange={(e) =>
                      setComposerDraft((prev) => ({ ...prev, targetDepartment: e.target.value }))
                    }
                    className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Department --</option>
                    {targetingOptions?.availableDepartments.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.studentCount} students)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {composerDraft.audienceScope === "COHORT" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Select Year Cohort
                </label>
                <div className="relative">
                  <select
                    value={composerDraft.targetCohort}
                    onChange={(e) =>
                      setComposerDraft((prev) => ({
                        ...prev,
                        targetCohort: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
                  >
                    {targetingOptions?.availableCohorts.map((c) => (
                      <option key={c.year} value={c.year}>
                        {c.name} ({c.studentCount} students)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {composerDraft.audienceScope === "CAMPUS" && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Campus Association Notice
                </span>
                <p className="text-[11px] leading-relaxed">
                  Student accounts are not directly tagged by campus in the primary User table. To deliver targeted notices reliably, please select <strong>Academic Dept</strong> or <strong>Year Cohort</strong>.
                </p>
              </div>
            )}

            {/* Audience Estimate Chip */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
              <span className="font-semibold text-slate-600">Estimated Reach:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {estimatedRecipients.toLocaleString()} Account{estimatedRecipients === 1 ? "" : "s"}
              </span>
            </div>

            {/* Severity Tier */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Priority Severity Tier
              </label>
              <div className="relative">
                <select
                  value={composerDraft.severity}
                  onChange={(e) =>
                    setComposerDraft((prev) => ({
                      ...prev,
                      severity: e.target.value as any,
                    }))
                  }
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
                >
                  <option value="INFORMATIONAL">Informational Notice (Default Priority)</option>
                  <option value="IMPORTANT">Important Campus Alert</option>
                  <option value="EMERGENCY">Emergency Notice (High Priority Badge)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Notification Title */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Notification Title
                </label>
                <span className="text-slate-400">{composerDraft.title.length} / 120</span>
              </div>
              <input
                type="text"
                maxLength={120}
                required
                value={composerDraft.title}
                onChange={(e) =>
                  setComposerDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g. AAU Library Maintenance Schedule"
                className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Body Copy Text */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label className="font-bold uppercase tracking-wider text-slate-500">
                  Body Copy Text
                </label>
                <span className="text-slate-400">{composerDraft.body.length} / 1,000</span>
              </div>
              <textarea
                rows={3}
                maxLength={1000}
                required
                value={composerDraft.body}
                onChange={(e) =>
                  setComposerDraft((prev) => ({ ...prev, body: e.target.value }))
                }
                placeholder="Write the full broadcast message content..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
              />
            </div>

            {/* In-App Destination (Deep Link) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                In-App Destination (Permitted Route)
              </label>
              <div className="relative">
                <select
                  value={composerDraft.deepLink}
                  onChange={(e) =>
                    setComposerDraft((prev) => ({ ...prev, deepLink: e.target.value }))
                  }
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
                >
                  {DEEP_LINK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Delivery Timing Mode */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Delivery Timing
              </label>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={composerDraft.timing === "immediate"}
                    onChange={() =>
                      setComposerDraft((prev) => ({ ...prev, timing: "immediate" }))
                    }
                    className="accent-slate-900"
                  />
                  <span>Immediate (Upon Clearance)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer opacity-60">
                  <input
                    type="radio"
                    name="timing"
                    disabled
                    checked={composerDraft.timing === "scheduled"}
                    className="accent-slate-900 cursor-not-allowed"
                  />
                  <span>Scheduled (Background Worker Required)</span>
                </label>
              </div>
            </div>

            {/* Live Lock Screen / In-App Simulation */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Live Notification Preview</span>
                <button
                  type="button"
                  onClick={() =>
                    setDeviceSimMode((prev) => (prev === "iOS" ? "Android" : "iOS"))
                  }
                  className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>{deviceSimMode} Frame</span>
                </button>
              </div>

              {/* Phone Mockup Frame */}
              <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/80 text-center space-y-3 shadow-inner">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Uni-Chat Student Notification</span>
                </div>

                {/* Simulated Notification Banner */}
                <div className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-md border border-slate-200 text-left space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">
                        U
                      </div>
                      <span className="font-bold text-xs text-slate-900">Uni-Chat</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          composerDraft.severity === "EMERGENCY"
                            ? "bg-rose-100 text-rose-800"
                            : composerDraft.severity === "IMPORTANT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {composerDraft.severity}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>

                  <p className="font-bold text-xs text-slate-900 leading-snug">
                    {composerDraft.title || "Notification Title"}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                    {composerDraft.body || "Notification body copy will appear here."}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 text-blue-600 font-semibold">
                    <span>Target: {composerDraft.deepLink || "/"} →</span>
                    <span className="text-slate-400 font-mono">
                      ~{estimatedRecipients} recipients
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateDraft(false)}
                className="px-3 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Save as Draft
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm transition cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Submit for Clearance</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. REJECTION MODAL */}
      {/* ========================================================================= */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Reject Broadcast Request
              </h3>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please specify why broadcast <strong>"{rejectingItem.title}"</strong> is being rejected or what revisions are required.
            </p>

            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Tone too urgent for regular schedule; please adjust wording before re-submitting."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2 rounded-full shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELIVERY POLICY MODAL */}
      {/* ========================================================================= */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Communications &amp; Broadcast Policy
                </h3>
              </div>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>Independent Student Platform:</strong> Uni-Chat is an independent peer communications system. Broadcasts are distributed strictly to enrolled, registered Uni-Chat student accounts and do not represent official statements from Addis Ababa University unless authored by a verified institutional department delegate.
              </p>
              <p>
                <strong>Approval &amp; Clearance:</strong> To prevent notification fatigue and maintain communication safety, high-priority announcements and broad student broadcasts require independent administrative review before dispatch. Authors cannot self-approve their own broadcasts.
              </p>
              <p>
                <strong>Supported Delivery Channels:</strong> All broadcasts are delivered in-app via the persistent Notification table and real-time socket alerts. External cellular SMS, SIS university email relays, and operating-system emergency overrides are intentionally disconnected.
              </p>
              <p>
                <strong>Audit Immutability:</strong> Every draft creation, clearance review, approval, dispatch, and cancellation is permanently logged in the PostgreSQL AuditLog table with the responsible administrator's ID and timestamp.
              </p>
            </div>

            <div className="pt-2 text-right border-t border-slate-100">
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-full shadow-sm transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
