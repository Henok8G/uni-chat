"use client";

import React, { useState } from "react";
import {
  Radar,
  Shield,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  Check,
  X,
  Share2,
  Lock,
  Compass,
  Download,
  Loader2,
} from "lucide-react";
import { useMatchingMetrics } from "./matching/hooks";

interface MatchingEngineViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function MatchingEngineView({
  onBackToOverview,
  onShowToast,
}: MatchingEngineViewProps) {
  const {
    metrics,
    pairs,
    guardrails,
    algorithmModel,
    crossCampusMobilityRate,
    lastReindexedTime,
    cohortFilter,
    setCohortFilter,
    toggleCrossGenderCooldown,
    updateProximityWeight,
    updateDailyMatchCap,
    toggleFreshmanMentorship,
    dismissAnomaly,
    reindexEmbeddings,
    saveWeights,
    exportAuditCsv,
    refresh,
    loading,
  } = useMatchingMetrics();

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form weights state for modal
  const [formWeights, setFormWeights] = useState({
    academicWeight: 40,
    projectWeight: 30,
    mentorshipWeight: 20,
    hobbiesWeight: 10,
  });

  const handleOpenConfig = () => {
    // Populate form with current active weights
    const ac = metrics.affinityVectors.find((v) => v.category === "Academic Study")?.weightPercentage ?? 40;
    const pr = metrics.affinityVectors.find((v) => v.category === "Hackathon & Project")?.weightPercentage ?? 30;
    const me = metrics.affinityVectors.find((v) => v.category === "Department Peer Mentorship")?.weightPercentage ?? 20;
    const ho = metrics.affinityVectors.find((v) => v.category === "Hobby & Cultural")?.weightPercentage ?? 10;
    setFormWeights({
      academicWeight: ac,
      projectWeight: pr,
      mentorshipWeight: me,
      hobbiesWeight: ho,
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveWeights = async () => {
    try {
      const res = await saveWeights(formWeights);
      setIsConfigModalOpen(false);
      onShowToast(res.message || "Weights updated successfully");
    } catch (err: any) {
      onShowToast("Failed to save weights: " + (err?.message || "Unknown error"));
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const res = await reindexEmbeddings();
      onShowToast(res.message || "Re-indexing complete");
    } catch (err: any) {
      onShowToast("Re-indexing failed: " + (err?.message || "Unknown error"));
    } finally {
      setIsReindexing(false);
    }
  };

  const handleExportAuditLog = async () => {
    setIsExporting(true);
    onShowToast("Generating matching audit trail CSV...");
    try {
      const res = await exportAuditCsv();
      const csvData = typeof res === "string" ? res : res.csv;
      if (!csvData) {
        throw new Error(typeof res === "object" && res.error ? res.error : "No CSV data returned");
      }
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        typeof res === "object" && res.filename
          ? res.filename
          : `uni_chat_matching_audit_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast("Matching audit log downloaded successfully.");
    } catch (err: any) {
      onShowToast("Export failed: " + (err?.message || "Unauthorized"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HEADER & QUICK ACTION BAR */}
      {/* ========================================================================= */}
      <section className="space-y-3.5">
        {/* Breadcrumbs & Eyebrow */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span
              onClick={onBackToOverview}
              className="hover:text-slate-700 cursor-pointer transition"
            >
              Admin Console
            </span>
            <span>&gt;</span>
            <span>Intelligent Discovery</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-bold">Student Matching Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Calibration: {lastReindexedTime}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {algorithmModel}
            </span>
          </div>
        </div>

        {/* Title, Subtitle & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              <span className="text-blue-600">⇄</span>
              <span>ALGORITHMIC TELEMETRY &amp; COHORT DISCOVERY</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Student Matching Engine &amp; Discovery Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Monitor autonomous peer discovery health, connection conversion rates, interest vectors, and algorithmic safety across all AAU campuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Refresh Telemetry */}
            <button
              onClick={() => {
                refresh();
                onShowToast("Matching analytics telemetry refreshed.");
              }}
              disabled={loading}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-600"}`} />
            </button>

            {/* Re-index Affinity Embeddings */}
            <button
              onClick={handleReindex}
              disabled={isReindexing}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isReindexing ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Re-index Affinity Matrix</span>
            </button>

            {/* Matching Safeguards Policy */}
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Matching Safeguards Policy</span>
            </button>

            {/* View Matching Audit Log (CSV) */}
            <button
              onClick={handleExportAuditLog}
              disabled={isExporting}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Download CSV audit trail of matching configuration changes"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Audit Log (CSV)</span>
            </button>

            {/* Algorithm Configuration */}
            <button
              onClick={handleOpenConfig}
              className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-slate-800 flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 transition"
            >
              <Sliders className="w-4 h-4" />
              <span>Algorithm Configuration</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOP KPI METRIC STRIP (4 Equal Cards) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: TOTAL MATCHES INITIATED */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL MATCHES INITIATED
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.totalMatches.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-400">sessions</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {metrics.monthlyPerStudent} matches / active student this month
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radar className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: MUTUAL ACCEPTANCE RATE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                MUTUAL ACCEPTANCE RATE
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.acceptanceRate}%
                </span>
                {metrics.acceptanceRateDelta !== 0 && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                    {metrics.acceptanceRateDelta > 0 ? `+${metrics.acceptanceRateDelta}%` : `${metrics.acceptanceRateDelta}%`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Sessions sustained &gt;10s without instant exit
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: POST-MATCH CHAT INITIATION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                POST-MATCH CHAT INITIATION
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.chatInitiationRate}%
                </span>
                {metrics.chatInitiationDelta !== 0 && (
                  <span className="text-xs font-bold text-emerald-600">
                    {metrics.chatInitiationDelta > 0 ? `↑ +${metrics.chatInitiationDelta}%` : `↓ ${metrics.chatInitiationDelta}%`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Conversations exceeding 5 exchanges
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200/60">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: MATCHING DISCIPLINARY FLAGS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                MATCHING DISCIPLINARY FLAGS
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.disciplinaryFlagRate}%
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {metrics.semesterReportsCount === 0 ? "Zero flags" : `${metrics.semesterReportsCount} flags`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {metrics.semesterReportsCount} report(s) filed this semester
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN WORKSPACE (~65% Left, ~35% Right Controls) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT / CENTER COLUMN (~65% - 8 Columns) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* ===================================================================== */}
          {/* Module A: Matching Algorithm Performance & Conversion Funnel */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            {/* Header & Cohort Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Matching Algorithm Performance &amp; Conversion Funnel
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live funnel trace from peer heuristic discovery to sustained collaborative DM exchanges.
                </p>
              </div>

              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold shrink-0">
                <button
                  onClick={() => setCohortFilter("ALL")}
                  className={`px-3 py-1 rounded-lg transition ${
                    cohortFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All AAU
                </button>
                <button
                  onClick={() => setCohortFilter("UNDERGRAD")}
                  className={`px-3 py-1 rounded-lg transition ${
                    cohortFilter === "UNDERGRAD"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Undergrad
                </button>
                <button
                  onClick={() => setCohortFilter("POSTGRAD")}
                  className={`px-3 py-1 rounded-lg transition ${
                    cohortFilter === "POSTGRAD"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Postgrad
                </button>
              </div>
            </div>

            {/* Funnel Stage Bars (5 Steps) */}
            {loading ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Computing live conversion funnel...</p>
              </div>
            ) : metrics.funnelStages.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No matching events recorded for this cohort period.
              </div>
            ) : (
              <div className="space-y-3.5">
                {metrics.funnelStages.map((stage) => {
                  const barWidth = `${Math.min(100, Math.max(stage.count > 0 ? 5 : 0, stage.conversionPercentage))}%`;

                  return (
                    <div key={stage.step} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {stage.step}
                          </span>
                          <span className="font-bold text-slate-800 truncate">
                            {stage.name}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 shrink-0">
                          <span className="text-sm font-extrabold text-slate-900">
                            {stage.count.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {stage.description}
                          </span>
                        </div>
                      </div>

                      {/* Funnel Bar */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stage.step === 1
                              ? "bg-slate-900"
                              : stage.step === 2
                              ? "bg-blue-600"
                              : stage.step === 3
                              ? "bg-blue-500"
                              : stage.step === 4
                              ? "bg-blue-400"
                              : "bg-slate-300"
                          }`}
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Telemetry Driver Breakdowns (2-Column Sub-panel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              {/* Left: Affinity Vector Drivers */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Affinity Vector Drivers</span>
                  <span className="text-[11px] text-slate-400 font-semibold">Active Weights</span>
                </div>

                <div className="space-y-2 text-xs">
                  {metrics.affinityVectors.map((vec, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium text-slate-600">{vec.category}</span>
                        <span className="font-bold text-slate-900">{vec.weightPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-800 h-full rounded-full transition-all"
                          style={{ width: `${vec.weightPercentage * 2}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Campus Activity Share */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Campus Activity Share</span>
                  <span className="text-[11px] text-slate-400 font-semibold">AAU Nodes</span>
                </div>

                <div className="space-y-2 text-xs">
                  {metrics.campusShare.map((node, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${node.tagColor}`} />
                        <span className="font-medium text-slate-700">{node.campusName}</span>
                      </div>
                      <span className="font-bold text-slate-900">{node.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* Module B: Cross-Department Connection Matrix */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cross-Department Connection Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-affinity pair dynamics reflecting interdisciplinary student peer discovery.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full">
                {pairs.length} Active Hub Pairings
              </span>
            </div>

            {pairs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No cross-department pairing activity recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {pairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
                  >
                    {/* Pair Campus Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {pair.sourceCampus}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">⇄</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {pair.targetCampus}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pair.volumeTier === "High Volume"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {pair.volumeTier}
                      </span>
                    </div>

                    {/* Departments Name */}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {pair.sourceDept} ⇄ {pair.targetDept}
                    </h4>

                    {/* Themes */}
                    <p className="text-xs text-slate-500 leading-normal">
                      {pair.commonThemes.join(", ")}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 font-semibold">
                      <span className="text-slate-600">
                        {pair.totalMatchesThisTerm.toLocaleString()} matches this term
                      </span>
                      <span className="text-emerald-700">
                        {pair.mutualRate}% mutual rate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cross-Campus Mobility Index Footer */}
            <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 font-medium">
                  Cross-Campus Mobility Index:{" "}
                  <strong className="text-slate-900 font-bold">
                    Students engaging across campus boundaries: {crossCampusMobilityRate}%
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 font-bold self-end sm:self-auto">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Active Inter-Campus Telemetry</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: STICKY GUARDRAILS DRAWER (~35% - 4 Columns) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Algorithmic Guardrails
                </h3>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Live Server Controls
              </span>
            </div>

            {/* Integrity Shield Callout Box */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
              <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Safety Integrity Shield Active:</strong> Strict AAU Student Verification enforced. Unregistered guest profiles cannot access peer matching queues.
              </p>
            </div>

            {/* Dynamic Policy Parameters */}
            <div className="space-y-4 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                DYNAMIC POLICY PARAMETERS
              </span>

              {/* Control 1: Cross-Gender Match Verification Cooldown */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/60">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Cross-Gender Match Cooldown
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Throttles rapid sequential swipes to prevent harassment
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await toggleCrossGenderCooldown();
                    onShowToast("Cross-gender verification cooldown updated.");
                  }}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-200 cursor-pointer ${
                    guardrails.crossGenderCooldown
                      ? "bg-slate-900 justify-end"
                      : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Control 2: Same-Campus Proximity Priority Bias */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Same-Campus Proximity Priority Bias</p>
                    <p className="text-[10px] text-slate-500">Weight given to matching within identical campus gates</p>
                  </div>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {guardrails.proximityBiasWeight}% Weight
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={guardrails.proximityBiasWeight}
                  onChange={(e) => updateProximityWeight(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Broader Inter-Campus</span>
                  <span>Intra-Campus Only</span>
                </div>
              </div>

              {/* Control 3: Daily Matching Cap per Student */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Daily Matching Cap per Student</p>
                  <p className="text-[10px] text-slate-500">Prevents spamming, botting, and swipe fatigue</p>
                </div>

                <div className="relative">
                  <select
                    value={guardrails.dailyMatchCap}
                    onChange={(e) => {
                      updateDailyMatchCap(Number(e.target.value));
                      onShowToast(`Daily matching cap updated to ${e.target.value}/day.`);
                    }}
                    className="appearance-none pl-3 pr-7 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-800"
                  >
                    <option value={3}>3 / day</option>
                    <option value={5}>5 / day</option>
                    <option value={10}>10 / day</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Control 4: Freshman Mentorship Prioritization */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Freshman Mentorship Prioritization</p>
                  <p className="text-[10px] text-slate-500">Prioritizes 4th/5th year seniors pairing with 1st years</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await toggleFreshmanMentorship();
                    onShowToast("Freshman mentorship setting updated.");
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                    guardrails.freshmanMentorshipEnabled
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {guardrails.freshmanMentorshipEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>

            {/* Recent Anomaly Flags Queue */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  RECENT ANOMALY FLAGS QUEUE
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {guardrails.activeAnomalies.length} Active
                </span>
              </div>

              {guardrails.activeAnomalies.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No active anomaly flags detected. All queues within normal boundaries.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {guardrails.activeAnomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-rose-900">{anom.alertCode}</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span>{anom.timeAgo}</span>
                          <button
                            onClick={async () => {
                              await dismissAnomaly(anom.id);
                              onShowToast(`Dismissed anomaly alert ${anom.alertCode}.`);
                            }}
                            className="hover:text-slate-700 p-0.5 cursor-pointer"
                            title="Dismiss Alert"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {anom.description}
                      </p>
                      <p className="text-[10px] font-bold text-rose-700">
                        • {anom.actionTaken}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guardrails Action Footer */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleOpenConfig}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-full shadow-sm transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Update Algorithmic Weights</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportAuditLog}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>View Matching Audit Log (CSV)</span>
              </button>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[10px] text-slate-500 leading-relaxed">
                Adheres to Higher Education Digital Communication Standards (Strict Data Protection Mode).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ALGORITHM CONFIGURATION */}
      {/* ========================================================================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">
                  Discovery Matrix Parameter Tuning
                </h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold uppercase text-[11px] text-slate-400 block mb-1">
                  Active Algorithm Model
                </label>
                <input
                  type="text"
                  disabled
                  value={algorithmModel}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700"
                />
              </div>

              <div className="space-y-3 pt-1">
                <span className="font-bold uppercase text-[11px] text-slate-500 block">
                  Affinity Feature Weights
                </span>

                {/* Academic Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Academic Course &amp; Major Affinity</span>
                    <span className="text-slate-900 font-bold">{formWeights.academicWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={formWeights.academicWeight}
                    onChange={(e) =>
                      setFormWeights((prev) => ({ ...prev, academicWeight: Number(e.target.value) }))
                    }
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* Project Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Hackathon &amp; Project Collaboration</span>
                    <span className="text-slate-900 font-bold">{formWeights.projectWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={formWeights.projectWeight}
                    onChange={(e) =>
                      setFormWeights((prev) => ({ ...prev, projectWeight: Number(e.target.value) }))
                    }
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* Mentorship Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Senior-Freshman Peer Mentorship</span>
                    <span className="text-slate-900 font-bold">{formWeights.mentorshipWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={formWeights.mentorshipWeight}
                    onChange={(e) =>
                      setFormWeights((prev) => ({ ...prev, mentorshipWeight: Number(e.target.value) }))
                    }
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* Hobbies Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Shared Hobbies &amp; Cultural Passions</span>
                    <span className="text-slate-900 font-bold">{formWeights.hobbiesWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={formWeights.hobbiesWeight}
                    onChange={(e) =>
                      setFormWeights((prev) => ({ ...prev, hobbiesWeight: Number(e.target.value) }))
                    }
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWeights}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MATCHING SAFEGUARDS POLICY */}
      {/* ========================================================================= */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Campus Peer Discovery Safeguards
                </h3>
              </div>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">1. Verified Student Queue Only</h4>
                <p>
                  Only verified enrolled students with validated university credentials may access peer discovery queues. Anonymous and unregistered guest sessions are completely prevented.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">2. Mutual Consent &amp; Ephemeral Sessions</h4>
                <p>
                  Matches are 1-on-1 peer chats. Either student may terminate or report the session at any moment. Messages are exchanged ephemerally through secure WebSockets.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">3. Harassment Prevention &amp; Rate Limiting</h4>
                <p>
                  Daily matching caps and cooldown mechanisms throttle rapid sequential requests, preventing botting, swipe exhaustion, and spamming.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800">4. Zero Physical Meetup Surveillance</h4>
                <p>
                  Uni-Chat does not track or infer student physical location or in-person meetings. Privacy is strictly protected.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Acknowledge Safeguards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
