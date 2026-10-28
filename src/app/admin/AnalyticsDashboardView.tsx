"use client";

import React, { useState } from "react";
import {
  Users,
  Activity,
  Shield,
  MessageSquare,
  TrendingUp,
  Download,
  ChevronDown,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useCampusMetrics } from "./analytics/hooks";
import { TelemetryPoint } from "./analytics/types";

interface AnalyticsDashboardViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function AnalyticsDashboardView({
  onBackToOverview,
  onShowToast,
}: AnalyticsDashboardViewProps) {
  const {
    data,
    loading,
    error,
    timeRange,
    setTimeRange,
    campusFilter,
    setCampusFilter,
    refresh,
    exportCsv,
    isExporting,
  } = useCampusMetrics(onShowToast);

  // Chart Metric Toggles
  const [showDau, setShowDau] = useState(true);
  const [showFeed, setShowFeed] = useState(true);
  const [showPeer, setShowPeer] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);

  // Helper for matrix contrast colors
  const getRetentionCellClass = (percentage: number | null) => {
    if (percentage === null) return "bg-slate-100 text-slate-400 font-medium";
    if (percentage >= 90) return "bg-slate-900 text-white font-bold";
    if (percentage >= 80) return "bg-blue-700 text-white font-semibold";
    if (percentage >= 60) return "bg-blue-600 text-white font-medium";
    if (percentage >= 30) return "bg-blue-100 text-blue-900 font-medium";
    if (percentage > 0) return "bg-slate-200 text-slate-800 font-medium";
    return "bg-slate-100 text-slate-500 font-normal";
  };

  // Safe fallback if data is still loading
  const kpis = data?.kpis;
  const telemetrySeries = data?.telemetrySeries || [];
  const campusNodes = data?.campusNodes || [];
  const cohortRetention = data?.cohortRetention || [];
  const modulePenetration = data?.modulePenetration || [];
  const highlights = data?.highlights;
  const lastRefreshed = data?.lastRefreshed || "Refreshing...";

  // SVG Chart Geometry Calculations
  const chartWidth = 800;
  const chartHeight = 220;
  const paddingX = 30;
  const paddingTop = 25;
  const paddingBottom = 30;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(
    1,
    ...telemetrySeries.flatMap((pt) => [
      showDau ? pt.dau : 0,
      showFeed ? pt.feedViews : 0,
      showPeer ? pt.peerInteractions : 0,
    ])
  );

  const getCoordinates = (val: number, idx: number, total: number) => {
    const x = paddingX + (idx / Math.max(1, total - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (val / maxVal) * innerHeight;
    return { x, y };
  };

  const buildPathD = (key: "dau" | "feedViews" | "peerInteractions") => {
    if (telemetrySeries.length === 0) return "";
    const points = telemetrySeries.map((pt, idx) =>
      getCoordinates(pt[key], idx, telemetrySeries.length)
    );
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${chartWidth - paddingX} ${points[0].y}`;
    }
    return points.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[idx - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, "");
  };

  const buildAreaD = (key: "dau" | "feedViews" | "peerInteractions") => {
    const linePath = buildPathD(key);
    if (!linePath) return "";
    const baselineY = paddingTop + innerHeight;
    const lastX = paddingX + innerWidth;
    return `${linePath} L ${lastX} ${baselineY} L ${paddingX} ${baselineY} Z`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HEADER & QUICK CONTROLS */}
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
          <span>Platform Metrics</span>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">Campus Analytics &amp; Retention</span>
        </div>

        {/* Title Block & Right Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Campus Analytics &amp; Cohort Retention
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Telemetry Live</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Defensible growth, cross-campus engagement, cohort retention curves, and communication telemetry for Addis Ababa University.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Campus Selector */}
            <div className="relative">
              <select
                value={campusFilter}
                onChange={(e) => {
                  setCampusFilter(e.target.value);
                  onShowToast(`Filtered analytics to: ${e.target.value}`);
                }}
                className="appearance-none pl-3.5 pr-8 py-2.5 text-xs font-bold rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <option value="All AAU Campuses">All AAU Campuses (5K, 4K, 6K, CHS)</option>
                <option value="5 Kilo">5 Kilo (AAiT Engineering)</option>
                <option value="4 Kilo">4 Kilo (CNCS Natural Sciences)</option>
                <option value="Sidist Kilo">Sidist Kilo (Main &amp; Humanities)</option>
                <option value="Tikur Anbessa">Tikur Anbessa (Medical &amp; Health)</option>
                <option value="Unassigned">Unassigned / General Student Body</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Action Button: Refresh */}
            <button
              onClick={() => {
                refresh();
                onShowToast("Refreshing live metrics from database...");
              }}
              disabled={loading}
              className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs transition disabled:opacity-50"
              title="Refresh database metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* Action Button: Download Institutional Report */}
            <button
              onClick={exportCsv}
              disabled={isExporting || loading}
              className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-slate-800 flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "Generating CSV..." : "Export Institutional Report (CSV)"}</span>
            </button>
          </div>
        </div>

        {/* Time Range & Refresh Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
            {["Today", "7 Days", "30 Days", "90 Days", "Academic Year 2024-2025"].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  onShowToast(`Analytics view shifted to ${range}.`);
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  timeRange === range
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Last refreshed: {lastRefreshed}</span>
          </span>
        </div>

        {/* Error notification banner if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Failed to load analytics: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TOP KPI METRIC STRIP (4 Equal Cards) */}
        {/* ========================================================================= */}
        {loading && !kpis ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Card 1: MONTHLY ACTIVE STUDENTS (MAU) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  MONTHLY ACTIVE STUDENTS (MAU)
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {kpis.mau.count.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {kpis.mau.percentageOfStudentBody}% of verified
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Verified Base: {kpis.mau.totalEligibleStudents.toLocaleString()}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{kpis.mau.trendVsLastTerm}% vs prior term</span>
                </span>
              </div>
            </div>

            {/* Card 2: DAILY ACTIVE STUDENTS (DAU) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  DAILY ACTIVE STUDENTS (DAU)
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {kpis.dau.count.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                  {kpis.dau.stickinessRate}% Stickiness
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium truncate" title={kpis.dau.benchmarkNotice}>
                <span>{kpis.dau.benchmarkNotice}</span>
              </div>
            </div>

            {/* Card 3: 30-DAY COHORT RETENTION */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  30-DAY COHORT RETENTION
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {kpis.retention30Day.rate}%
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  {kpis.retention30Day.rankNotice}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Attrition: {kpis.retention30Day.attritionRate}%</span>
                <span>Cohort: {kpis.retention30Day.cohortSize} students</span>
              </div>
            </div>

            {/* Card 4: TOTAL END-TO-END MESSAGES */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  TOTAL PEER COMMUNICATIONS
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {kpis.messaging.totalVolume}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {kpis.messaging.activeStudyGroups.toLocaleString()} groups active
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>P2P Sessions: {kpis.messaging.p2pPercentage}%</span>
                <span>Group Hubs: {kpis.messaging.groupPercentage}%</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION: PLATFORM ENGAGEMENT & TELEMETRY VOLUME CHART */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-sm">
        {/* Header & Interactive Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Platform Engagement &amp; Telemetry Volume
            </h2>
            <p className="text-xs text-slate-500">
              Cross-channel comparison of active students, institutional feed posts, and collaborative peer sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            {/* Toggle DAU */}
            <button
              onClick={() => setShowDau(!showDau)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer ${
                showDau ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-slate-100" />
              <span>Daily Active Students (DAU)</span>
            </button>

            {/* Toggle Feed Views */}
            <button
              onClick={() => setShowFeed(!showFeed)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer ${
                showFeed ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-200" />
              <span>Posts &amp; Announcements</span>
            </button>

            {/* Toggle Peer Sessions */}
            <button
              onClick={() => setShowPeer(!showPeer)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer ${
                showPeer ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
              <span>Peer Chat Sessions</span>
            </button>
          </div>
        </div>

        {/* Interactive Multi-Area Chart Canvas */}
        <div className="relative h-64 w-full bg-gradient-to-b from-slate-50/70 to-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between overflow-hidden">
          {/* Top Milestone Callout */}
          {highlights?.peakDau && highlights.peakDau > 0 ? (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Peak Activity: {highlights.peakDay}</span>
              </div>
            </div>
          ) : null}

          {/* Hover Details Card */}
          {hoveredPoint && (
            <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-xl p-2.5 text-xs text-slate-700 pointer-events-none space-y-1">
              <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">{hoveredPoint.dayLabel}</div>
              <div className="flex items-center justify-between gap-3 text-slate-900 font-semibold">
                <span>DAU:</span>
                <span>{hoveredPoint.dau} students</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-blue-700">
                <span>Posts/Announcements:</span>
                <span>{hoveredPoint.feedViews} events</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-700">
                <span>Peer Sessions:</span>
                <span>{hoveredPoint.peerInteractions} sessions</span>
              </div>
            </div>
          )}

          {/* Real Dynamic SVG Wave Graphic */}
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            <defs>
              <linearGradient id="gradDAU" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradPeers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal guidelines */}
            <line x1={paddingX} y1={paddingTop} x2={chartWidth - paddingX} y2={paddingTop} stroke="#E2E8F0" strokeDasharray="3 3" />
            <line x1={paddingX} y1={paddingTop + innerHeight / 2} x2={chartWidth - paddingX} y2={paddingTop + innerHeight / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
            <line x1={paddingX} y1={paddingTop + innerHeight} x2={chartWidth - paddingX} y2={paddingTop + innerHeight} stroke="#CBD5E1" />

            {/* Feed Views Area & Line */}
            {showFeed && (
              <>
                <path d={buildAreaD("feedViews")} fill="url(#gradViews)" />
                <path d={buildPathD("feedViews")} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
              </>
            )}

            {/* Peer Sessions Area & Line */}
            {showPeer && (
              <>
                <path d={buildAreaD("peerInteractions")} fill="url(#gradPeers)" />
                <path d={buildPathD("peerInteractions")} fill="none" stroke="#10B981" strokeWidth="2.5" />
              </>
            )}

            {/* DAU Area & Line */}
            {showDau && (
              <>
                <path d={buildAreaD("dau")} fill="url(#gradDAU)" />
                <path d={buildPathD("dau")} fill="none" stroke="#0F172A" strokeWidth="2.5" />
              </>
            )}

            {/* Interactive Circles */}
            {telemetrySeries.map((pt, idx) => {
              const coords = getCoordinates(pt.dau, idx, telemetrySeries.length);
              return (
                <g key={idx} className="cursor-pointer">
                  {showDau && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={pt.isPeak ? 5 : 3.5}
                      fill="#0F172A"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  )}
                  {/* Invisible hit-area */}
                  <rect
                    x={coords.x - 20}
                    y={0}
                    width={40}
                    height={chartHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Spacer */}
          <div className="flex-1" />

          {/* X-Axis Day Labels */}
          <div className="relative z-10 flex justify-between text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-200">
            {telemetrySeries.length > 0 ? (
              telemetrySeries.map((pt, idx) => (
                <span
                  key={idx}
                  className={`hover:text-slate-900 cursor-pointer transition ${
                    hoveredPoint?.dayLabel === pt.dayLabel ? "text-slate-900 font-bold" : ""
                  }`}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {pt.dayLabel}
                </span>
              ))
            ) : (
              <span className="text-slate-400">No telemetry recorded for selected window</span>
            )}
          </div>
        </div>

        {/* Bottom Chart Metric Highlights (3-Column Sub-grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Peak Engagement Day
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {highlights?.peakDay || "None"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Average Session Duration
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {highlights?.avgSessionDurationMins !== null && highlights?.avgSessionDurationMins !== undefined
                  ? `${highlights.avgSessionDurationMins} mins`
                  : "N/A (No ended sessions in window)"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Single-Session Exit Rate
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {highlights?.singleSessionExitRate !== undefined
                  ? `${highlights.singleSessionExitRate}% (0 messages)`
                  : "0%"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BOTTOM GRID: CAMPUS DISTRIBUTION (50%) VS COHORT & PENETRATION (50%) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Campus Node Distribution (50% - 6 Columns) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Campus Node Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Attributed student population and topical intensity across Addis Ababa University clusters.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {campusNodes.length} Clusters
            </span>
          </div>

          <div className="space-y-3.5">
            {campusNodes.map((node) => (
              <div
                key={node.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{node.name}</span>
                  <span className="font-bold text-slate-700">
                    {node.studentCount.toLocaleString()} students ({node.percentageShare}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, node.percentageShare)}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded">
                    Activity Index: {node.activityIndex}/100
                  </span>
                  <span className="text-slate-500 font-medium">
                    {node.dominantThemes}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Attribution notice */}
          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Campus attribution is derived from student department records; unassigned profiles are grouped in General Student Body.</span>
          </div>
        </div>

        {/* Right Column: Cohort Retention Matrix & Key Module Penetration (50% - 6 Columns) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Module A: Cohort Retention Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cohort Retention Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Weekly persistence curves for onboarding cohorts from Week 1 to Week 8.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Academic Year 2024-2025
              </span>
            </div>

            {/* Controlled Horizontal Scroll Matrix on Mobile/Tablet */}
            <div className="space-y-1.5">
              <div className="md:hidden flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <span>Weekly retention matrix</span>
                <span className="flex items-center gap-1">Swipe &rarr;</span>
              </div>
              <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[460px] text-center text-xs border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-2 text-left px-2">COHORT</th>
                      <th className="py-2 px-1">W1</th>
                      <th className="py-2 px-1">W2</th>
                      <th className="py-2 px-1">W3</th>
                      <th className="py-2 px-1">W4</th>
                      <th className="py-2 px-1">W5</th>
                      <th className="py-2 px-1">W8</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cohortRetention.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-2 text-left">
                          <span className="font-bold text-slate-800 block text-xs">
                            {row.cohortName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {row.registeredCount.toLocaleString()} registered
                          </span>
                        </td>

                        {row.weeklyRetention.map((val, wIdx) => (
                          <td key={wIdx} className="py-2.5 px-1">
                            <span
                              title={
                                val === null
                                  ? "Observation window has not arrived yet (not churned)"
                                  : `${val}% retained`
                              }
                              className={`inline-block w-8 py-1 rounded text-[11px] ${getRetentionCellClass(
                                val
                              )}`}
                            >
                              {val === null ? "—" : `${val}%`}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              <span>Note: Cells marked &apos;—&apos; represent immature observation periods that have not elapsed and are excluded from churn calculations.</span>
            </div>
          </div>

          {/* Module B: Key Module Penetration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Key Module Penetration
              </h3>
              <p className="text-xs text-slate-500">
                Active usage share across core platform engines during the selected observation window.
              </p>
            </div>

            <div className="space-y-3.5">
              {modulePenetration.map((mod, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{mod.moduleName}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        ({mod.activeUsersCount} of {mod.totalEligibleCount} students)
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {mod.usageSharePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${mod.barColorClass} transition-all duration-500`}
                      style={{ width: `${Math.min(100, mod.usageSharePercentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DISCLAIMERS & AUDIT TRANSPARENCY STRIP */}
      {/* ========================================================================= */}
      <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 space-y-1.5">
        <div className="font-bold text-slate-700 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span>Institutional Telemetry Integrity &amp; Privacy Notice</span>
        </div>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
          {data?.telemetryDisclaimers?.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
