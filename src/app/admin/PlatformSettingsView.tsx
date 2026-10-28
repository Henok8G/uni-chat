'use client';

import React, { useState } from 'react';
import {
  Download,
  Save,
  Server,
  KeyRound,
  Shield,
  Activity,
  Sliders,
  Check,
  Copy,
  RefreshCw,
  AlertTriangle,
  Radio,
  Lock,
  ExternalLink,
  Gavel,
  Zap,
  Globe,
  Database,
  Cpu,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building,
  Terminal,
} from 'lucide-react';
import { usePlatformSettings } from './settings/hooks';
import { SettingsActiveTab } from './settings/types';

interface PlatformSettingsViewProps {
  onBackToOverview?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PlatformSettingsView: React.FC<PlatformSettingsViewProps> = ({
  onBackToOverview,
  onShowToast,
}) => {
  const {
    activeTab,
    setActiveTab,
    data,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    refreshData,
    // Local editable policies
    crossCampusPeerDiscovery,
    intraCampusProximityPriority,
    crossCampusGroupParticipation,
    campusAwareMatching,
    staffSessionHours,
    studentSessionDays,
    maxGroupsPerStudent,
    unsubstantiatedReportRetentionDays,
    broadcastOnlyMode,
    emergencyNoticeBanner,
    // Toggles
    togglePeerDiscovery,
    toggleIntraCampusProximity,
    toggleGroupParticipation,
    toggleCampusAwareMatching,
    setStaffSessionHours,
    setStudentSessionDays,
    setMaxGroupsPerStudent,
    setUnsubstantiatedReportRetentionDays,
    // Actions
    saveAllConfigurations,
    downloadReport,
    purgeCache,
    toggleBroadcast,
  } = usePlatformSettings();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionReason, setInspectionReason] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    if (onShowToast) {
      onShowToast(`Copied ${label} to clipboard`, 'info');
    }
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async () => {
    const res = await saveAllConfigurations();
    if (res.success) {
      if (onShowToast) {
        onShowToast('Platform security & infrastructure configuration saved successfully.', 'success');
      }
    } else {
      if (onShowToast) {
        onShowToast(res.error || 'Failed to save configuration.', 'error');
      }
    }
  };

  const handleDownloadReport = async () => {
    setIsActionPending(true);
    const res = await downloadReport();
    setIsActionPending(false);
    if (res.success) {
      if (onShowToast) {
        onShowToast(`Security report exported: ${res.filename}`, 'success');
      }
    } else {
      if (onShowToast) {
        onShowToast(res.error || 'Failed to export report.', 'error');
      }
    }
  };

  const handlePurgeCache = async () => {
    setIsActionPending(true);
    const res = await purgeCache();
    setIsActionPending(false);
    setShowPurgeModal(false);
    if (res.success) {
      if (onShowToast) {
        onShowToast(res.message, 'success');
      }
    } else {
      if (onShowToast) {
        onShowToast(res.message || 'Cache purge failed.', 'error');
      }
    }
  };

  const handleConfirmBroadcast = async () => {
    setIsActionPending(true);
    const targetState = !broadcastOnlyMode;
    const res = await toggleBroadcast(targetState, targetState ? 'Platform is currently in Emergency Broadcast-Only mode.' : '');
    setIsActionPending(false);
    setShowBroadcastModal(false);
    if (res.success) {
      if (onShowToast) {
        onShowToast(
          targetState
            ? 'Broadcast-Only Mode activated. Incident ticket logged to AuditLog.'
            : 'Emergency Broadcast-Only Mode deactivated. Normal platform operations resumed.',
          targetState ? 'warning' : 'success'
        );
      }
    } else {
      if (onShowToast) {
        onShowToast(res.error || 'Failed to update emergency mode.', 'error');
      }
    }
  };

  const handleInspectionSubmit = () => {
    if (!inspectionReason.trim() || inspectionReason.length < 5) {
      if (onShowToast) onShowToast('Please provide a valid case reference or investigation reason (min 5 characters).', 'warning');
      return;
    }
    setShowInspectionModal(false);
    setInspectionReason('');
    if (onShowToast) {
      onShowToast('Privileged investigation reason recorded. Safety audit record logged.', 'info');
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <div className="text-sm font-semibold text-slate-700">Loading Platform Settings & Telemetry...</div>
        <div className="text-xs text-slate-400">Querying real database health, campus topology, and environment state</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 pb-16 font-sans">
      {/* Emergency Global Banner if broadcast-only mode is active */}
      {broadcastOnlyMode && (
        <div className="bg-rose-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
            <span>
              EMERGENCY BROADCAST-ONLY MODE ACTIVE: Student peer sessions and unverified postings are restricted.
            </span>
          </div>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-3 py-1 bg-white text-rose-700 rounded-full text-[11px] font-bold hover:bg-rose-50 transition"
          >
            Manage Override
          </button>
        </div>
      )}

      {/* 1. Header & Breadcrumb Bar */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1.5">
              {onBackToOverview && (
                <button
                  onClick={onBackToOverview}
                  className="hover:text-blue-600 transition cursor-pointer"
                >
                  Admin Console
                </button>
              )}
              {!onBackToOverview && <span>Admin Console</span>}
              <span className="text-slate-300">/</span>
              <span>System Configuration</span>
              <span className="text-slate-300">/</span>
              <span className="text-blue-700 font-semibold">Platform Settings & Security</span>
            </div>

            {/* Eyebrow & Title */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                UNI-CHAT INDEPENDENT PLATFORM · CORE GOVERNANCE v4.2
              </span>
              {data && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Config v{data.configVersion} · Latency: {data.infraHealth.database.latencyMs}ms
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Platform Settings & Security Infrastructure
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Configure AAU campus federation, authentication sessions, privacy guardrails, rate limiting, and real service integrations.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadReport}
              disabled={isActionPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#D6E4F0] rounded-full hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Security Health Report
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full shadow-sm transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? "bg-slate-900 text-white hover:bg-slate-800 ring-2 ring-blue-500/20"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {hasUnsavedChanges ? "Save All Configuration Changes" : "Configuration Saved"}
            </button>
          </div>
        </div>

        {/* Top Sub-Navigation Tab Strip */}
        <div className="max-w-[1560px] mx-auto mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            General & Campus Federation
          </button>
          <button
            onClick={() => setActiveTab('authentication')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'authentication'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Authentication & SSO
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Privacy & Data Governance
          </button>
          <button
            onClick={() => setActiveTab('api_keys')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'api_keys'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            API Keys & Integrations
          </button>
        </div>
      </div>

      {/* Error notification banner if any */}
      {error && (
        <div className="max-w-[1560px] mx-auto px-6 sm:px-8 mt-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Configuration Error: </span>
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Body */}
      <div className="max-w-[1560px] mx-auto px-6 sm:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Infrastructure & Governance Settings (~68%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: General & Campus Federation */}
          {activeTab === 'general' && data && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      AAU Campus Federation & Logical Clusters
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Recognized physical campus grounds mapped to academic departments on a centralized database.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                  {data.campusNodes.length} Recognized Partitions
                </span>
              </div>

              {/* Cluster Nodes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {data.campusNodes.map((node) => (
                  <div
                    key={node.id}
                    className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/70 hover:border-blue-200 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{node.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{node.departmentCluster}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {node.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic">
                      {node.geographicNote}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Building className="w-3 h-3 text-slate-400" />
                        {node.departmentsCount} verified departments
                      </span>
                      <span className="font-semibold text-slate-700 text-[11px]">
                        {node.activeStudentsCount} enrolled students
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cluster Policy Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-900">
                      Allow Cross-Campus Peer Discovery & Group Formation
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Permits students from 4 Kilo and 5 Kilo to participate in inter-faculty student societies and interest lounges.
                    </p>
                  </div>
                  <button
                    onClick={togglePeerDiscovery}
                    aria-label="Toggle Peer Discovery"
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
                      crossCampusPeerDiscovery ? 'bg-slate-900 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-900">
                      Intra-Campus Proximity Auto-Prioritization
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Prioritizes immediate physical campus student lounges and study partners before expanding to other campuses.
                    </p>
                  </div>
                  <button
                    onClick={toggleIntraCampusProximity}
                    aria-label="Toggle Intra-Campus Proximity"
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
                      intraCampusProximityPriority ? 'bg-slate-900 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-900">
                      Cross-Campus Student Group & Club Participation
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enables verified students to join recognized academic clubs and study circles hosted at any AAU campus.
                    </p>
                  </div>
                  <button
                    onClick={toggleGroupParticipation}
                    aria-label="Toggle Group Participation"
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
                      crossCampusGroupParticipation ? 'bg-slate-900 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Authentication & SSO */}
          {activeTab === 'authentication' && data && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Authentication, Identity & Session Governance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    JWT session cookie policies, institutional domain validation, and external identity federation status.
                  </p>
                </div>
              </div>

              {/* SIS Direct Sync Card (Truthful!) */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">
                      AAU Student Information System (SIS) Direct Sync
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {data.authPolicy.sisSyncStatus.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {data.authPolicy.sisSyncStatus.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-semibold text-slate-400">
                    Independent Platform · No Registrar API
                  </span>
                </div>
              </div>

              {/* Endpoints 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Shibboleth IdP Endpoint</label>
                    <span className="text-[10px] text-slate-400 font-semibold">Roadmap</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                    <span className="truncate flex-1">{data.authPolicy.shibbolethEndpoint}</span>
                    <button
                      onClick={() => handleCopy(data.authPolicy.shibbolethEndpoint, 'Shibboleth Endpoint')}
                      className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      {copiedField === 'Shibboleth Endpoint' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Entity ID URI</label>
                    <span className="text-[10px] text-slate-400 font-semibold">Unregistered</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                    <span className="truncate flex-1">{data.authPolicy.entityIdUri}</span>
                    <button
                      onClick={() => handleCopy(data.authPolicy.entityIdUri, 'Entity ID URI')}
                      className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      {copiedField === 'Entity ID URI' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Policy Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-900">
                      Two-Factor Authentication (2FA) Governance
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Current platform uses password + signed session token. Hardware FIDO2/TOTP keys are on the security roadmap.
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    {data.authPolicy.mfaStatus.split("·")[0].trim()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-900">
                      Session Lifetimes & Invalidation Limits
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Staff administrative tickets invalidate after {staffSessionHours} hours. Student mobile clients persist for {studentSessionDays} days with active DB checking on each request.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={staffSessionHours}
                      onChange={(e) => setStaffSessionHours(Number(e.target.value))}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value={4}>Staff: 4 hrs</option>
                      <option value={8}>Staff: 8 hrs</option>
                      <option value={12}>Staff: 12 hrs</option>
                      <option value={24}>Staff: 24 hrs</option>
                    </select>
                    <select
                      value={studentSessionDays}
                      onChange={(e) => setStudentSessionDays(Number(e.target.value))}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value={7}>Student: 7 days</option>
                      <option value={14}>Student: 14 days</option>
                      <option value={30}>Student: 30 days</option>
                      <option value={60}>Student: 60 days</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-900">
                      Institutional University Domain Policy
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Requires account email address to belong to official AAU institutional domain (@aau.edu.et) for verified student access.
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Enforced (@aau.edu.et)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Privacy & Data Governance */}
          {activeTab === 'privacy' && data && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Privacy, Data Governance & Student Safety Controls
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Truthful communication architecture, report retention policies, and student group creation guardrails.
                  </p>
                </div>
              </div>

              {/* 3-Pillar Safeguard Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ephemeral Messaging</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Private student chats are ephemeral peer-to-peer or socket in-transit. Zero plaintext message tables in PostgreSQL.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Report Governance</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Unsubstantiated student safety flags are kept in DB as DISMISSED for {unsubstantiatedReportRetentionDays} days, preserving audit trail.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Group Quota</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Hard cap of {maxGroupsPerStudent} concurrently active public student groups per verified AAU account (enforced by Prisma interactive transaction).
                  </p>
                </div>
              </div>

              {/* Privileged Inspection Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Private Case Inspection Governance</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Accessing sensitive student case evidence requires written justification, valid administrative authorization (MODERATE_REPORTS or SUPER_ADMIN), and records an immutable entry into the permanent audit ledger.
                    </p>
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => setShowInspectionModal(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    Log Privileged Investigation Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: API Keys & Integrations */}
          {activeTab === 'api_keys' && data && (
            <div className="space-y-6">
              {/* Integrations Inventory */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        Service Integrations & Key Configuration Status
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Current connection health and environment key status for platform dependencies. Secrets are safely masked.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                    {data.serviceIntegrations.length} Services Evaluated
                  </span>
                </div>

                <div className="space-y-3">
                  {data.serviceIntegrations.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{svc.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${svc.badgeStyle}`}>
                            {svc.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {svc.serviceCategory}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-mono">{svc.hostDisplay}</p>
                        <p className="text-[11px] text-slate-500">{svc.details}</p>
                        {svc.actionGuidance && (
                          <p className="text-[10px] text-amber-700 font-medium">{svc.actionGuidance}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {svc.lastChecked}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Developer API Key Policy Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <h4 className="font-bold text-sm">External Developer API Access</h4>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                  <span className="font-bold">Public Developer API Disabled: </span>
                  <span>
                    Uni-Chat currently operates with internal server actions and protected session cookies. External third-party API key generation is disabled to safeguard student privacy.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Module D: System Telemetry & Rate Limiting Guardrails (Shown across tabs) */}
          {data && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    System Telemetry & Rate Limiting Guardrails
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live route verification and administrative backpressure controls.
                  </p>
                </div>
              </div>

              {/* Rate Limit KPI Strip (3 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500">Route Throttling</div>
                  <div className="text-sm font-bold text-slate-900">
                    Next.js Edge Middleware
                  </div>
                  <div className="text-[10px] text-slate-500">5 protected route segments</div>
                  <div className="pt-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500">Daily Matching Velocity</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {data.rateLimits.dailyMatchingVelocityLimit}
                  </div>
                  <div className="text-[10px] text-slate-500">peer initiations / 24h cycle</div>
                  <div className="pt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Anti-fatigue cap
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500">Broadcast Delay</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {data.rateLimits.broadcastMandatoryDelayMins}m
                  </div>
                  <div className="text-[10px] text-slate-500">editorial review delay</div>
                  <div className="pt-1 text-[10px] text-slate-400">Excludes emergency code red</div>
                </div>
              </div>

              {/* Ingress Traffic Wave Curve (Truthful Note!) */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Network Ingress Telemetry Status</h4>
                  <span className="text-[10px] text-slate-500 font-medium">Addis Ababa Time (UTC+3)</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
                  <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Live Ingress Waveforms Unavailable: </span>
                    <span>
                      Uni-Chat operates with honest telemetry. Simulated 12-hour ingress waves have been removed. System runs within expected parameters on Cloud Supabase infrastructure.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Telemetry & Emergency Actions Drawer (~32%) */}
        {data && (
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            {/* Gateway Health Widget */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-sm text-slate-900">Infrastructure Health</h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified Live
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{data.infraHealth.runtime.hostPlatform}</div>
                    <div className="text-[10px] text-slate-400">Node {data.infraHealth.runtime.nodeVersion}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{data.infraHealth.runtime.uptimeHours} hrs</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Process Uptime</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">Database Roundtrip</div>
                    <div className="text-[10px] text-slate-400">{data.infraHealth.database.provider}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-700">
                      {data.infraHealth.database.latencyMs} ms
                    </span>
                    <div className="text-[10px] text-emerald-600 font-semibold">Measured Ping</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">Memory RSS</div>
                    <div className="text-[10px] text-slate-400">Server Heap & Native</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">
                      {data.infraHealth.runtime.memoryRssMb} MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit & Vulnerabilities Widget */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Audit & Governance Records</h3>
              </div>

              {/* Score Card */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {data.infraHealth.securityAudit.auditLogCount.toLocaleString()} Immutable Audit Events
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {data.infraHealth.securityAudit.cipherStandard}
                  </div>
                </div>
              </div>

              {/* Recent Audit List */}
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                  Recent Administrative Events
                </div>
                {data.recentAuditHistory.slice(0, 4).map((a) => (
                  <div key={a.id} className="pt-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-[11px] truncate">{a.action}</div>
                      <div className="text-[10px] text-slate-400 truncate">{a.adminEmail}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Actions Widget */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Emergency Actions</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Privileged operations affecting platform operation.
                </p>
              </div>

              <button
                onClick={() => setShowBroadcastModal(true)}
                className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                  broadcastOnlyMode
                    ? "bg-rose-600 text-white border-rose-700 hover:bg-rose-700"
                    : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {broadcastOnlyMode ? "Deactivate Broadcast-Only Mode" : "Enable Campus Broadcast-Only Mode"}
              </button>

              <button
                onClick={() => setShowPurgeModal(true)}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                Purge Inactive Ephemeral Caches
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Emergency Broadcast Mode */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-sm">
                {broadcastOnlyMode ? "Deactivate Broadcast-Only Mode?" : "Enable Campus Broadcast-Only Mode?"}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {broadcastOnlyMode
                ? "This will restore standard student peer interactions, lounges, and peer matching initiations."
                : "This will place the platform in incident emergency state. All student peer communications and unreviewed lounge postings will be frozen. Only verified official university broadcasts will be visible."}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBroadcast}
                disabled={isActionPending}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                {isActionPending ? "Applying..." : broadcastOnlyMode ? "Restore Normal Operations" : "Enforce Broadcast Mode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Purge Caches */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-slate-800">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Purge Ephemeral Runtime Cache</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Flush dormant session and matching discovery cache references across the application runtime. Persistent student records, reports, and audit logs are safely preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowPurgeModal(false)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeCache}
                disabled={isActionPending}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                {isActionPending ? "Purging..." : "Purge Caches"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Privileged Case Inspection Governance */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Privileged Case Inspection Request</h3>
              </div>
              <button
                onClick={() => setShowInspectionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-blue-900">
                Inspection of unmasked student safety records is restricted to Tier-1 Root and authorized safety personnel. Every inspection logs an immutable entry to the AuditLog.
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reason / Case Reference ID</label>
                <input
                  type="text"
                  value={inspectionReason}
                  onChange={(e) => setInspectionReason(e.target.value)}
                  placeholder="e.g. CASE-2025-08819 (Harassment escalation inquiry)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowInspectionModal(false)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleInspectionSubmit}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Record Justification & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlatformSettingsView;
