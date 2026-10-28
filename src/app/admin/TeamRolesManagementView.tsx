"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  Lock,
  Clock,
  Plus,
  ArrowRight,
  Check,
  RefreshCw,
  Users,
  Megaphone,
  Activity,
  FileText,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  Layers,
  Search,
  Trash2,
  X,
  Info,
} from "lucide-react";
import { useTeamRoles } from "./team/hooks";
import { PermissionItem, PermissionFilter } from "./team/types";
import { UserRole } from "@prisma/client";
import { searchEligiblePersonnel } from "./teamActions";

interface TeamRolesManagementViewProps {
  onBackToOverview?: () => void;
  onShowToast?: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export const TeamRolesManagementView: React.FC<TeamRolesManagementViewProps> = ({
  onBackToOverview,
  onShowToast,
}) => {
  const {
    roleArchetypes,
    selectedRole,
    selectedRoleKey,
    selectRole,
    permissionCategories,
    inspectorData,
    filterMode,
    setFilterMode,
    totalStats,
    hasPendingChanges,
    togglePermission,
    saveRolePolicy,
    discardChanges,
    assignedStaff,
    recentAuditHistory,
    assignStaff,
    removeStaff,
    refreshData,
    loading,
    isSaving,
    error,
  } = useTeamRoles(onShowToast);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<{ id: string; email: string; name: string } | null>(null);

  // Staff Search inside Assign Modal
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [candidateList, setCandidateList] = useState<Array<{
    id: string;
    email: string;
    displayName: string | null;
    department: string | null;
    role: UserRole;
  }>>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [isSearchingPersonnel, setIsSearchingPersonnel] = useState(false);

  // Trigger search when query changes in modal
  useEffect(() => {
    if (!showAssignModal) return;
    const handler = setTimeout(async () => {
      setIsSearchingPersonnel(true);
      try {
        const results = await searchEligiblePersonnel(personnelSearch);
        setCandidateList(results);
        if (results.length > 0 && !selectedCandidateId) {
          setSelectedCandidateId(results[0].id);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearchingPersonnel(false);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [showAssignModal, personnelSearch, selectedCandidateId]);

  // Role Card Icon selector
  const renderRoleIcon = (iconName: string) => {
    switch (iconName) {
      case "lock":
        return <Lock className="w-4 h-4 text-rose-600" />;
      case "shield":
        return <Shield className="w-4 h-4 text-amber-600" />;
      case "megaphone":
        return <Megaphone className="w-4 h-4 text-indigo-600" />;
      case "users":
        return <Users className="w-4 h-4 text-emerald-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  // Helper for rendering status badges
  const renderPermissionStatus = (catId: string, perm: PermissionItem) => {
    if (selectedRole.isSystemLocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200/60 text-rose-700 text-[11px] font-bold">
          <Lock className="w-3 h-3" />
          <span>Root Granted</span>
        </span>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
            perm.status === "granted"
              ? "bg-blue-50 text-blue-700 border border-blue-200/60"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {perm.statusLabel}
        </span>
        <button
          onClick={() => togglePermission(catId, perm.id)}
          aria-label={`Toggle ${perm.title}`}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
            perm.toggleValue ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
        </button>
      </div>
    );
  };

  // Filter permission categories by search query
  const displayedCategories = permissionCategories
    .map((cat) => {
      const filtered = cat.permissions.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q)
        );
      });
      return {
        ...cat,
        permissions: filtered,
      };
    })
    .filter((cat) => cat.permissions.length > 0);

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
          <span>Security &amp; Governance</span>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">Administrative Roles &amp; Granular Permissions</span>
        </div>

        {/* Title Block & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Administrative Roles &amp; Granular Permissions
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>RBAC Enforced · PostgreSQL</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Assign roles, audit operational scopes, configure granular capability matrices, and enforce least-privilege security across Addis Ababa University administrative personnel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Action: Audit History */}
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-4 py-2.5 text-xs font-bold rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs cursor-pointer transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Security Audit Trail</span>
            </button>

            {/* Action: Refresh Data */}
            <button
              onClick={() => {
                refreshData();
                if (onShowToast) onShowToast("Refreshed team roles and permissions from database.", "info");
              }}
              disabled={loading}
              className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs transition disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* Action: Assign Staff Member */}
            <button
              onClick={() => {
                setShowAssignModal(true);
                setPersonnelSearch("");
              }}
              className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-slate-800 flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Staff to {selectedRole.name.split("(")[0].trim()}</span>
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Team Governance Error: </span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. TOP ROLE ARCHETYPE CARDS STRIP */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
          SELECT ADMINISTRATIVE ROLE ARCHETYPE
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 xl:gap-3.5">
          {roleArchetypes.map((role) => {
            const isSelected = role.roleKey === selectedRoleKey;
            return (
              <div
                key={role.id}
                onClick={() => selectRole(role.id)}
                className={`p-3 xl:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 overflow-hidden min-w-0 ${
                  isSelected
                    ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      {renderRoleIcon(role.iconName)}
                    </div>
                    <div className="min-w-0 flex-1 min-h-[30px] flex items-center">
                      <span
                        className="text-[11px] xl:text-xs font-bold text-slate-900 leading-tight line-clamp-2 break-words"
                        title={role.name.split("(")[0].trim()}
                      >
                        {role.name.split("(")[0].trim()}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span
                      className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 self-center shadow-xs ring-2 ring-blue-100 ml-1"
                      title="Selected Archetype"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div>
                  <div
                    className="text-[10.5px] xl:text-[11px] font-semibold text-slate-500 line-clamp-1 truncate"
                    title={role.scopeSummary}
                  >
                    {role.scopeSummary}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                    <span className={`px-1.5 py-0.5 rounded font-bold ${role.badgeStyle}`}>
                      {role.tierLabel}
                    </span>
                    <span className="font-semibold text-slate-700 shrink-0">
                      {role.memberCount} {role.memberCount === 1 ? "staff" : "staff"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PERMISSION FILTER & SEARCH STRIP */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === "all"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Capabilities ({totalStats.total})
          </button>
          <button
            onClick={() => setFilterMode("granted")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === "granted"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Granted ({totalStats.granted})
          </button>
          <button
            onClick={() => setFilterMode("restricted")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === "restricted"
                ? "bg-slate-200 text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Restricted ({totalStats.restricted})
          </button>
        </div>

        {/* Search bar & Pending changes alert */}
        <div className="flex items-center gap-3">
          {hasPendingChanges && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Unsaved Policy Changes</span>
            </span>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search capability or module..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAIN TWO-COLUMN CONTENT GRID */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Granular Permission Matrix (7 Columns ~ 60%) */}
        <div className="lg:col-span-7 space-y-4">
          {displayedCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2 shadow-sm">
              <Shield className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No capabilities match your filter</div>
              <p className="text-xs text-slate-500">Try adjusting your search query or switching to &apos;All Capabilities&apos;.</p>
            </div>
          ) : (
            displayedCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center border border-blue-200/50">
                      0{cat.categoryNumber}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{cat.title}</h3>
                      <p className="text-[11px] text-slate-500">{cat.description}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    {cat.grantedCount} of {cat.totalCount} Active
                  </span>
                </div>

                {/* Permissions List */}
                <div className="divide-y divide-slate-100">
                  {cat.permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 max-w-md">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{perm.title}</span>
                          {perm.levelBadge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                perm.levelBadge === "Privileged"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  : perm.levelBadge === "Audit-Heavy"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                  : perm.levelBadge === "Write"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {perm.levelBadge}
                            </span>
                          )}
                          {perm.requiresNotice && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                              {perm.requiresNotice}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {perm.description}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        {renderPermissionStatus(cat.id, perm)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Role Policy Inspector & Assigned Personnel (5 Columns ~ 40%) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            {/* Inspector Header */}
            <div className="pb-4 border-b border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  ROLE POLICY INSPECTOR
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedRole.badgeStyle}`}>
                  {selectedRole.tierLabel}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">{inspectorData.roleName}</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {inspectorData.description}
              </p>
            </div>

            {/* Quota Gauge (Radial Ring) */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Operational Authority
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {inspectorData.grantedPermissionsCount} of {inspectorData.totalPermissionsCount} Capabilities Active
                </div>
                <div className="text-xs text-blue-700 font-bold mt-0.5">
                  {inspectorData.operationalAuthorityPercentage}% Platform Scope
                </div>
              </div>

              {/* SVG Radial Ring */}
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 transition-all duration-500"
                    strokeDasharray={`${inspectorData.operationalAuthorityPercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-slate-800">
                  {inspectorData.operationalAuthorityPercentage}%
                </div>
              </div>
            </div>

            {/* Assigned Personnel Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900">
                  Assigned Personnel ({assignedStaff.length})
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Account</span>
                </button>
              </div>

              {assignedStaff.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center space-y-1 bg-slate-50/50">
                  <Users className="w-5 h-5 text-slate-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">No personnel currently assigned</div>
                  <p className="text-[11px] text-slate-500">
                    Use &apos;Assign Account&apos; to delegate staff privileges to an eligible verified student account.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {assignedStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">{staff.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {staff.email} · <span className="font-semibold text-slate-700">{staff.campus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Remove Role Button */}
                      <button
                        onClick={() => setStaffToRemove(staff)}
                        title="Revoke administrative role"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safeguard Notice Card */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Modifications to this role take effect on the very next server request via real-time database session verification.
              </p>
            </div>

            {/* Actions Bar: Save and Discard */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={discardChanges}
                disabled={!hasPendingChanges || isSaving}
                className={`flex-1 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  hasPendingChanges
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                }`}
              >
                Discard Changes
              </button>
              <button
                onClick={saveRolePolicy}
                disabled={!hasPendingChanges || isSaving || selectedRole.isSystemLocked}
                className={`flex-1 py-2 text-xs font-semibold rounded-full shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  hasPendingChanges && !selectedRole.isSystemLocked
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving Policy..." : "Save Role Policy"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MODAL: ASSIGN STAFF MEMBER */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Assign Staff to {selectedRole.name.split("(")[0].trim()}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Search and select a verified account to grant {selectedRole.name} privileges.
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Search Account (Email, Name, or Department)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={personnelSearch}
                    onChange={(e) => setPersonnelSearch(e.target.value)}
                    placeholder="Search by student email or department..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Select Eligible Account ({candidateList.length} found)
                </label>
                {isSearchingPersonnel ? (
                  <div className="p-3 text-center text-slate-400 text-xs">Searching accounts...</div>
                ) : candidateList.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                    No eligible accounts match your query.
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {candidateList.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCandidateId(c.id)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                          selectedCandidateId === c.id ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">
                            {c.displayName || c.email.split("@")[0]}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {c.email} {c.department ? `· ${c.department}` : ""}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {c.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-800 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Granting this role delegates live administrative access to production platform models and queues.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedCandidateId) return;
                  const success = await assignStaff(selectedCandidateId, selectedRoleKey);
                  if (success) {
                    setShowAssignModal(false);
                  }
                }}
                disabled={!selectedCandidateId}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm Role Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: REMOVE STAFF CONFIRMATION */}
      {/* ========================================================================= */}
      {staffToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Revoke Administrative Access</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to revoke administrative privileges from{" "}
              <span className="font-bold text-slate-900">{staffToRemove.name}</span> (
              {staffToRemove.email})? Their account will immediately revert to standard student permissions.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setStaffToRemove(null)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const success = await removeStaff(staffToRemove.id);
                  if (success) {
                    setStaffToRemove(null);
                  }
                }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Revoke Privileges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: SECURITY AUDIT TRAIL */}
      {/* ========================================================================= */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Administrative Security Audit Trail (PostgreSQL AuditLog)
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {recentAuditHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No security role modifications logged yet.
                </div>
              ) : (
                recentAuditHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1 hover:bg-slate-100/60 transition"
                  >
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span>{log.timeAgo} ({new Date(log.timestamp).toLocaleDateString()})</span>
                    </div>
                    <div className="text-slate-700 font-medium">
                      Executed by: <span className="font-bold text-slate-900">{log.actor}</span>
                    </div>
                    {log.details && (
                      <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-200/50 mt-1 truncate">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              <span>Security logs are persisted immutably in the PostgreSQL database.</span>
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
