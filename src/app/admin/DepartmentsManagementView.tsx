"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  GraduationCap,
  Shield,
  Megaphone,
  RefreshCw,
  Share2,
  Plus,
  Search,
  ChevronDown,
  Download,
  Upload,
  Code,
  FileText,
  Cpu,
  BookOpen,
  HeartPulse,
  Users,
  CheckCircle2,
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Clock,
  Radio,
  ExternalLink,
  X,
  AlertTriangle,
  Loader2,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Check,
} from "lucide-react";
import {
  EntityDetail,
  EntityMetrics,
  AuthorizedDelegate,
} from "./departments/types";
import {
  getDepartmentsManagementData,
  createDepartmentEntity,
  updateDepartmentEntity,
  toggleDepartmentClearance,
  deactivateDepartmentEntity,
  assignDepartmentDelegate,
  revokeDepartmentDelegate,
  searchEligibleUsers,
  exportDepartmentDirectoryCsv,
  importDepartmentRosterCsv,
} from "./departmentActions";

interface DepartmentsManagementViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function DepartmentsManagementView({
  onBackToOverview,
  onShowToast,
}: DepartmentsManagementViewProps) {
  // Loading & State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<EntityMetrics>({
    registeredEntities: 0,
    academicDepts: 0,
    adminOffices: 0,
    verifiedFaculty: 0,
    sisValidationRate: 0,
    sisStatusText: "Not configured · Platform records",
    authorizedDelegates: 0,
    officialBroadcasts: 0,
    averageStudentReach: 0,
  });
  const [entities, setEntities] = useState<EntityDetail[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [availableCampuses, setAvailableCampuses] = useState<string[]>([
    "All Campuses (5 Campuses)",
    "4 Kilo Campus",
    "5 Kilo Campus",
    "Sidist Kilo (Main)",
    "Tikur Anbessa (Health)",
    "Commerce (FBE)",
  ]);

  // Filters
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    "ACADEMIC" | "ADMIN" | "FACULTY" | "PUBLISHING"
  >("ACADEMIC");
  const [searchQuery, setSearchQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState("All Campuses (5 Campuses)");

  // Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<"SIS" | "SSO" | null>(null);

  // Provisioning Modal State
  const [newName, setNewName] = useState("");
  const [newCampus, setNewCampus] = useState("4 Kilo Campus");
  const [newCode, setNewCode] = useState("");
  const [newCollege, setNewCollege] = useState("");
  const [newCategory, setNewCategory] = useState<"ACADEMIC" | "ADMIN">("ACADEMIC");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmittingProvision, setIsSubmittingProvision] = useState(false);

  // Edit Modal State
  const [editName, setEditName] = useState("");
  const [editCampus, setEditCampus] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delegate Modal State
  const [delegateSearchQuery, setDelegateSearchQuery] = useState("");
  const [delegateSearchResults, setDelegateSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [delegateRole, setDelegateRole] = useState("Faculty Member");
  const [delegateBadge, setDelegateBadge] = useState<"Full Clearance" | "Announce" | "Draft Only">("Announce");
  const [delegateEmergency, setDelegateEmergency] = useState(false);
  const [delegateBypassMod, setDelegateBypassMod] = useState(false);
  const [isSubmittingDelegate, setIsSubmittingDelegate] = useState(false);

  // Import Modal State
  const [importCsvText, setImportCsvText] = useState("");
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ count?: number; errors?: string[] } | null>(null);

  // Load live data from server actions
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await getDepartmentsManagementData();
      setMetrics(data.metrics);
      setEntities(data.entities);
      if (data.availableCampuses?.length) {
        setAvailableCampuses(data.availableCampuses);
      }
      if (data.entities.length > 0) {
        setSelectedEntityId((prev) => {
          if (prev && data.entities.some((e) => e.id === prev)) return prev;
          return data.entities[0].id;
        });
      }
    } catch (err: any) {
      console.error("Failed to load departments data:", err);
      onShowToast(err?.message || "Failed to load live department records");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected Entity
  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) || entities[0] || null;
  }, [entities, selectedEntityId]);

  // Debounced search for eligible users in delegate modal
  useEffect(() => {
    if (!delegateSearchQuery || delegateSearchQuery.trim().length < 2) {
      setDelegateSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await searchEligibleUsers(delegateSearchQuery);
        setDelegateSearchResults(results);
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [delegateSearchQuery]);

  // Filter entities
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      if (activeCategoryFilter === "ACADEMIC" && entity.category !== "ACADEMIC") return false;
      if (activeCategoryFilter === "ADMIN" && entity.category !== "ADMIN") return false;
      if (activeCategoryFilter === "FACULTY" && (!entity.verifiedFacultyCount || entity.verifiedFacultyCount === 0)) return false;
      if (activeCategoryFilter === "PUBLISHING" && entity.delegatesCount === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = entity.name.toLowerCase().includes(q);
        const matchCode = entity.code.toLowerCase().includes(q);
        const matchCampus = entity.campus.toLowerCase().includes(q);
        const matchCollege = entity.collegeAffiliation?.toLowerCase().includes(q);
        const matchDelegate = entity.primaryDelegateName?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCampus && !matchCollege && !matchDelegate) return false;
      }

      if (campusFilter !== "All Campuses (5 Campuses)") {
        const target = campusFilter.toLowerCase().split(" ")[0];
        if (!entity.campus.toLowerCase().includes(target)) return false;
      }
      return true;
    });
  }, [entities, activeCategoryFilter, searchQuery, campusFilter]);

  const getEntityIcon = (iconType: EntityDetail["iconType"]) => {
    switch (iconType) {
      case "code":
        return <Code className="w-5 h-5 text-blue-600" />;
      case "document":
        return <FileText className="w-5 h-5 text-slate-700" />;
      case "cpu":
        return <Cpu className="w-5 h-5 text-blue-600" />;
      case "library":
        return <BookOpen className="w-5 h-5 text-slate-700" />;
      case "health":
        return <HeartPulse className="w-5 h-5 text-blue-600" />;
      case "users":
        return <Users className="w-5 h-5 text-slate-700" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-600" />;
    }
  };

  // Action: Create Entity
  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast("Please enter entity name");
      return;
    }

    setIsSubmittingProvision(true);
    try {
      const created = await createDepartmentEntity({
        name: newName,
        campus: newCampus,
        code: newCode || undefined,
        category: newCategory,
        collegeAffiliation: newCollege || undefined,
        description: newDescription || undefined,
      });

      onShowToast(`Provisioned: "${created.name}" (${created.code}) is now live!`);
      setIsProvisionModalOpen(false);
      setNewName("");
      setNewCode("");
      setNewCollege("");
      setNewDescription("");
      await loadData(true);
      setSelectedEntityId(created.id);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to create entity");
    } finally {
      setIsSubmittingProvision(false);
    }
  };

  // Action: Open Edit Modal
  const handleOpenEditModal = () => {
    if (!selectedEntity) return;
    setEditName(selectedEntity.name);
    setEditCampus(selectedEntity.campus);
    setEditCollege(selectedEntity.collegeAffiliation || "");
    setEditDescription(selectedEntity.description || "");
    setIsEditModalOpen(true);
  };

  // Action: Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;

    setIsSubmittingEdit(true);
    try {
      await updateDepartmentEntity(selectedEntity.id, {
        name: editName,
        campus: editCampus,
        collegeAffiliation: editCollege,
        description: editDescription,
      });
      onShowToast(`Updated profile for "${editName}"`);
      setIsEditModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update entity");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Action: Toggle Clearance
  const handleToggleClearance = async (
    entityId: string,
    key: "emergencyBroadcasts" | "pinnedFeedNoPreMod" | "studentDirectQA"
  ) => {
    // Optimistic UI update
    setEntities((prev) =>
      prev.map((e) => {
        if (e.id === entityId) {
          return {
            ...e,
            clearances: {
              ...e.clearances,
              [key]: !e.clearances[key],
            },
          };
        }
        return e;
      })
    );

    try {
      await toggleDepartmentClearance(entityId, key);
      const label =
        key === "emergencyBroadcasts"
          ? "Emergency broadcast clearance"
          : key === "pinnedFeedNoPreMod"
          ? "Pinned feed placement clearance"
          : "Direct Q&A channel";
      onShowToast(`${label} updated`);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to toggle clearance");
      await loadData(true);
    }
  };

  // Action: Toggle Active / Inactive
  const handleToggleEntityStatus = async (entity: EntityDetail) => {
    try {
      const updated = await deactivateDepartmentEntity(entity.id);
      const isNowActive = updated.status === "ACTIVE";
      onShowToast(
        isNowActive
          ? `Reactivated "${entity.name}". Publishing enabled.`
          : `Deactivated "${entity.name}". Delegates and publishing suspended.`
      );
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to change entity status");
    }
  };

  // Action: Add Delegate
  const handleAddDelegateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;

    if (!selectedUser && !delegateSearchQuery.trim()) {
      onShowToast("Please select an existing Uni-Chat user or enter their email");
      return;
    }

    setIsSubmittingDelegate(true);
    try {
      await assignDepartmentDelegate(selectedEntity.id, {
        userId: selectedUser?.id,
        userEmail: selectedUser?.email || delegateSearchQuery.trim(),
        role: delegateRole,
        badge: delegateBadge,
        canEmergencyBroadcast: delegateEmergency,
        canBypassModeration: delegateBypassMod,
      });

      onShowToast(
        `Authorized delegate assigned to ${selectedEntity.name} with ${delegateBadge} clearance!`
      );
      setIsDelegateModalOpen(false);
      setSelectedUser(null);
      setDelegateSearchQuery("");
      setDelegateRole("Faculty Member");
      setDelegateBadge("Announce");
      setDelegateEmergency(false);
      setDelegateBypassMod(false);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to authorize delegate");
    } finally {
      setIsSubmittingDelegate(false);
    }
  };

  // Action: Revoke Delegate
  const handleRevokeDelegate = async (delegateId: string, delegateName: string) => {
    if (!selectedEntity) return;
    if (!confirm(`Revoke delegate authorization for "${delegateName}"?`)) return;

    try {
      await revokeDepartmentDelegate(selectedEntity.id, delegateId);
      onShowToast(`Revoked delegate authorization for "${delegateName}"`);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to revoke delegate");
    }
  };

  // Action: Export CSV
  const handleExportCsv = async () => {
    try {
      onShowToast("Generating sanitized CSV directory export...");
      const result = await exportDepartmentDirectoryCsv();
      const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", result.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast(`Downloaded: ${result.filename}`);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to export CSV directory");
    }
  };

  // Action: Import CSV Roster
  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) {
      onShowToast("Please paste CSV data to import");
      return;
    }

    setIsSubmittingImport(true);
    setImportFeedback(null);
    try {
      const res = await importDepartmentRosterCsv(importCsvText);
      setImportFeedback({ count: res.importedCount, errors: res.errors });
      if (res.importedCount > 0) {
        onShowToast(`Successfully imported ${res.importedCount} institutional records!`);
        await loadData(true);
      }
      if (res.errors.length === 0) {
        setIsImportModalOpen(false);
        setImportCsvText("");
      }
    } catch (err: any) {
      onShowToast(err?.message || "Import failed");
    } finally {
      setIsSubmittingImport(false);
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
            Institutional Structure
          </span>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">Departments &amp; Official Entities</span>
        </div>

        {/* Title, Subtitle & Action Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Departments, University Offices &amp; Faculty
              </h1>
              {isRefreshing && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Manage verified AAU institutional units, official campus publishing delegates, and accredited academic professors across 4 Kilo, 5 Kilo, Sidist Kilo, and affiliated colleges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Official Roster Sync (Honest explanation button) */}
            <button
              onClick={() => setIsInfoModalOpen("SIS")}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
              title="AAU SIS Sync Status"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Official Roster Sync</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Not connected" />
            </button>

            {/* Faculty SSO Bridge (Honest explanation button) */}
            <button
              onClick={() => setIsInfoModalOpen("SSO")}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
              title="Faculty SSO Bridge Status"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Faculty SSO Bridge</span>
              <span className="w-2 h-2 rounded-full bg-slate-400" title="Not configured" />
            </button>

            {/* Import Roster CSV */}
            <button
              onClick={() => {
                setImportCsvText("");
                setImportFeedback(null);
                setIsImportModalOpen(true);
              }}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-full font-medium text-xs sm:text-sm transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="Import Department CSV Roster"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Roster</span>
            </button>

            {/* + Provision New Entity */}
            <button
              onClick={() => setIsProvisionModalOpen(true)}
              className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-slate-800 flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Entity</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. KPI SUMMARY METRIC STRIP (4 Equal Cards - Real Database Backed) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: REGISTERED ENTITIES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                REGISTERED ENTITIES
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.registeredEntities}
                </span>
                <span className="text-xs font-semibold text-slate-500">Depts &amp; Offices</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {metrics.academicDepts} Academic • {metrics.adminOffices} Admin
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: VERIFIED FACULTY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                VERIFIED FACULTY
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.verifiedFaculty}
                </span>
                <span className="text-xs font-semibold text-slate-500">Accredited</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-2 font-medium flex items-center gap-1">
                <span>●</span>
                <span>Active platform delegates &amp; staff</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: AUTHORIZED DELEGATES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                AUTHORIZED DELEGATES
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.authorizedDelegates}
                </span>
                <span className="text-xs font-semibold text-slate-500">Active Staff</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-2 font-medium flex items-center gap-1">
                <span>●</span>
                <span>Broadcast clearance active</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200/60">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: OFFICIAL BROADCASTS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                OFFICIAL BROADCASTS
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.officialBroadcasts}
                </span>
                <span className="text-xs font-semibold text-slate-500">This Month</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                <span>●</span>
                <span>Live on Student Home Feed</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
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
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Row & Toolbar */}
          <div className="space-y-3">
            {/* Segmented Category Filter Row */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCategoryFilter("ACADEMIC")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategoryFilter === "ACADEMIC"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Academic Departments ({metrics.academicDepts})
              </button>
              <button
                onClick={() => setActiveCategoryFilter("ADMIN")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategoryFilter === "ADMIN"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Administrative Offices ({metrics.adminOffices})
              </button>
              <button
                onClick={() => setActiveCategoryFilter("FACULTY")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategoryFilter === "FACULTY"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Faculty Units ({metrics.verifiedFaculty})
              </button>
              <button
                onClick={() => setActiveCategoryFilter("PUBLISHING")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategoryFilter === "PUBLISHING"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Active Delegates ({metrics.authorizedDelegates})
              </button>
            </div>

            {/* Search & Campus Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by entity name, code (e.g. AAU-CS), campus..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div className="relative w-full sm:w-64">
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  {availableCampuses.map((camp) => (
                    <option key={camp} value={camp}>
                      {camp}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportCsv}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer self-end sm:self-auto"
                title="Export Filtered Roster to CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Department / Entity Card Stack */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Loading institutional entities from database...
              </p>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No entities found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching departments or offices found for the selected category and filter.
              </p>
              <button
                onClick={() => {
                  setActiveCategoryFilter("ACADEMIC");
                  setSearchQuery("");
                  setCampusFilter("All Campuses (5 Campuses)");
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredEntities.map((entity) => {
                const isSelected = selectedEntityId === entity.id;

                return (
                  <div
                    key={entity.id}
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-500/80 ring-1 ring-blue-500/20 shadow-xs"
                        : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
                          {getEntityIcon(entity.iconType)}
                        </div>

                        {/* Title & Chips */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {entity.name}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                              {entity.campus}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50">
                              {entity.code}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
                            {entity.collegeAffiliation}
                          </p>
                        </div>
                      </div>

                      {/* Status Chip */}
                      <div className="self-start sm:self-auto shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                            entity.status === "Inactive · Suspended"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : entity.status === "Pending Verification"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200/60"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              entity.status === "Inactive · Suspended"
                                ? "bg-red-600"
                                : entity.status === "Pending Verification"
                                ? "bg-amber-500"
                                : "bg-blue-600"
                            }`}
                          />
                          <span>{entity.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* 4-Column Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-3 border-y border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Students Enrolled
                        </span>
                        <span className="font-bold text-slate-900 mt-0.5 block">
                          {entity.studentsEnrolled
                            ? `${entity.studentsEnrolled.toLocaleString()} Active`
                            : "Platform registered"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {entity.category === "ADMIN" ? "Unit Type" : "Verified Faculty"}
                        </span>
                        <span className="font-bold text-slate-900 mt-0.5 block">
                          {entity.category === "ADMIN"
                            ? "Service / Admin"
                            : entity.verifiedFacultyCount
                            ? `${entity.verifiedFacultyCount} Accredited`
                            : "Faculty Unit"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Publishing Delegates
                        </span>
                        <span className="font-bold text-slate-900 mt-0.5 block">
                          {entity.delegatesCount} Authorized
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Primary Delegate
                        </span>
                        <span className="font-bold text-slate-900 mt-0.5 block truncate">
                          {entity.primaryDelegateName || "None Appointed"}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Last Announcement:{" "}
                          <strong className="text-slate-700 font-semibold">
                            {entity.lastAnnouncement.title}
                          </strong>{" "}
                          ({entity.lastAnnouncement.timeAgo})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntityId(entity.id);
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                        >
                          <span>Inspect Entity</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: STICKY INSPECTION DRAWER (~35% - 4 Columns) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          {selectedEntity ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
              {/* Dossier Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ACTIVE ENTITY INSPECTION
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedEntity.isVerified
                      ? "bg-blue-50 text-blue-700 border-blue-200/70"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {selectedEntity.isVerified ? "Verified Institution" : "Platform Record"}
                </span>
              </div>

              {/* Title & Subtext */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedEntity.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedEntity.collegeAffiliation}, {selectedEntity.campus}.
                </p>
                {selectedEntity.description && (
                  <p className="text-xs text-slate-600 mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 leading-relaxed">
                    {selectedEntity.description}
                  </p>
                )}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Institutional Code
                  </span>
                  <span className="text-slate-900">{selectedEntity.code}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Founding / Charter
                  </span>
                  <span className="text-slate-900">
                    {selectedEntity.foundingYear}
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                  <span className="text-[11px] font-bold">Registry Sync Status:</span>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>{selectedEntity.sisSyncStatus}</span>
                  </span>
                </div>
              </div>

              {/* Authorized Delegates Shelf */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    AUTHORIZED DELEGATES ({selectedEntity.authorizedDelegates.length})
                  </span>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setDelegateSearchQuery("");
                      setIsDelegateModalOpen(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    + Add Delegate
                  </button>
                </div>

                {selectedEntity.authorizedDelegates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No active delegates assigned. Click "+ Add Delegate" to authorize a verified staff member.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedEntity.authorizedDelegates.map((delegate) => (
                      <div
                        key={delegate.id}
                        className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {delegate.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {delegate.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {delegate.role}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                              delegate.badge === "Full Clearance"
                                ? "bg-blue-100 text-blue-800"
                                : delegate.badge === "Announce"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {delegate.badge}
                          </span>
                          <button
                            onClick={() => handleRevokeDelegate(delegate.id, delegate.name)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition opacity-0 group-hover:opacity-100"
                            title="Revoke delegate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Entity Publishing Clearances (Interactive Toggles) */}
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  ENTITY PUBLISHING CLEARANCES
                </span>

                <div className="space-y-2.5 text-xs">
                  {/* Toggle 1 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60">
                    <div>
                      <p className="font-bold text-slate-900">Campus-Wide Emergency Broadcasts</p>
                      <p className="text-[10px] text-slate-500">
                        Allows push alerts to students in {selectedEntity.campus.split(" ")[0]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleClearance(selectedEntity.id, "emergencyBroadcasts")
                      }
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-200 cursor-pointer ${
                        selectedEntity.clearances.emergencyBroadcasts
                          ? "bg-slate-900 justify-end"
                          : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Toggle 2 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60">
                    <div>
                      <p className="font-bold text-slate-900">Pinned Feed Placement (No Pre-Mod)</p>
                      <p className="text-[10px] text-slate-500">
                        Bypasses admin moderation queue for official notices
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleClearance(selectedEntity.id, "pinnedFeedNoPreMod")
                      }
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-200 cursor-pointer ${
                        selectedEntity.clearances.pinnedFeedNoPreMod
                          ? "bg-slate-900 justify-end"
                          : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Toggle 3 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60">
                    <div>
                      <p className="font-bold text-slate-900">Student Direct Q&amp;A Channel</p>
                      <p className="text-[10px] text-slate-500">
                        Opens official in-app inquiries for verified students
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleClearance(selectedEntity.id, "studentDirectQA")
                      }
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-200 cursor-pointer ${
                        selectedEntity.clearances.studentDirectQA
                          ? "bg-slate-900 justify-end"
                          : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Broadcast History Log */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    BROADCAST HISTORY
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {selectedEntity.broadcastHistory.length} recorded
                  </span>
                </div>

                {selectedEntity.broadcastHistory.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                    No official broadcasts published under this unit yet.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs max-h-40 overflow-y-auto pr-1">
                    {selectedEntity.broadcastHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                            {item.readRate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{item.publishedAt}</span>
                          <span>by {item.publishedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setDelegateSearchQuery("");
                    setIsDelegateModalOpen(true);
                  }}
                  className="w-full bg-slate-900 text-white py-2.5 rounded-full font-semibold text-xs shadow-sm hover:bg-slate-800 transition cursor-pointer active:scale-95"
                >
                  + Provision New Delegate
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="py-2 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleEntityStatus(selectedEntity)}
                    className={`py-2 px-3 rounded-full border font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedEntity.status === "Inactive · Suspended"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {selectedEntity.status === "Inactive · Suspended" ? (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Reactivate Unit</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Suspend Unit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Callout */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong className="text-slate-800">Platform Verification Standard:</strong>{" "}
                  All institutional records operate under Uni-Chat platform governance and Proclamation 1152/2019 data privacy standards.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No entity selected.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: PROVISION NEW ENTITY */}
      {/* ========================================================================= */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Provision Institutional Entity</h3>
                  <p className="text-xs text-slate-400">Create academic department or administrative office</p>
                </div>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Department of Mechanical Engineering"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Institutional Code
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. AAU-MECH (Auto if blank)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="ACADEMIC">Academic Department</option>
                    <option value="ADMIN">Administrative Office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Campus Location *
                  </label>
                  <select
                    value={newCampus}
                    onChange={(e) => setNewCampus(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="4 Kilo Campus">4 Kilo Campus</option>
                    <option value="5 Kilo Campus">5 Kilo Campus</option>
                    <option value="Sidist Kilo (Main)">Sidist Kilo (Main)</option>
                    <option value="Tikur Anbessa (Health)">Tikur Anbessa (Health)</option>
                    <option value="Commerce (FBE)">Commerce (FBE)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Collegiate Affiliation
                  </label>
                  <input
                    type="text"
                    value={newCollege}
                    onChange={(e) => setNewCollege(e.target.value)}
                    placeholder="e.g. AAiT, CNCS, CHS..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Scope &amp; Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Official mandate, academic discipline, or administrative responsibilities..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProvision}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingProvision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Entity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ENTITY PROFILE */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedEntity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Entity Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Campus Location
                </label>
                <select
                  value={editCampus}
                  onChange={(e) => setEditCampus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="4 Kilo Campus">4 Kilo Campus</option>
                  <option value="5 Kilo Campus">5 Kilo Campus</option>
                  <option value="Sidist Kilo (Main)">Sidist Kilo (Main)</option>
                  <option value="Tikur Anbessa (Health)">Tikur Anbessa (Health)</option>
                  <option value="Commerce (FBE)">Commerce (FBE)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Parent College / Affiliation
                </label>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD AUTHORIZED DELEGATE */}
      {/* ========================================================================= */}
      {isDelegateModalOpen && selectedEntity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Authorize Publishing Delegate</h3>
                  <p className="text-[11px] text-slate-400">For {selectedEntity.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDelegateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDelegateSubmit} className="space-y-3">
              {/* User Search & Selection */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Select Platform User *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedUser ? `${selectedUser.displayName || selectedUser.email} (${selectedUser.email})` : delegateSearchQuery}
                    onChange={(e) => {
                      setSelectedUser(null);
                      setDelegateSearchQuery(e.target.value);
                    }}
                    placeholder="Search by name, AAU email (@aau.edu.et)..."
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {isSearchingUsers && (
                    <Loader2 className="absolute right-3 top-2.5 w-3.5 h-3.5 animate-spin text-slate-400" />
                  )}
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setDelegateSearchQuery("");
                      }}
                      className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown search results */}
                {!selectedUser && delegateSearchResults.length > 0 && (
                  <div className="mt-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg p-1 space-y-1">
                    {delegateSearchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setDelegateRole(u.role === "TEACHER" ? "Faculty Professor" : "Staff Delegate");
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-blue-50 text-xs transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{u.displayName || u.email.split("@")[0]}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Institutional Title / Role *
                </label>
                <input
                  type="text"
                  required
                  value={delegateRole}
                  onChange={(e) => setDelegateRole(e.target.value)}
                  placeholder="e.g. Associate Professor & Lab Lead"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Clearance Tier *
                </label>
                <select
                  value={delegateBadge}
                  onChange={(e) => setDelegateBadge(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="Full Clearance">Full Clearance (Broadcast &amp; Emergency Alerts)</option>
                  <option value="Announce">Announce (Official Feed Notices)</option>
                  <option value="Draft Only">Draft Only (Requires Admin Review)</option>
                </select>
              </div>

              {/* Explicit Permission Toggles */}
              <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={delegateEmergency}
                    onChange={(e) => setDelegateEmergency(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">
                    Grant Emergency Push Broadcast Capability
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={delegateBypassMod}
                    onChange={(e) => setDelegateBypassMod(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">
                    Grant Moderation Bypass for Official Feed
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDelegateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDelegate}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingDelegate && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Authorize Delegate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPORT CSV ROSTER */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Administrator-Managed Roster Import</h3>
                  <p className="text-xs text-slate-400">Batch upload institutional units via CSV</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">CSV Header Format:</p>
                <code className="text-[11px] block text-slate-700 bg-white p-2 rounded border border-slate-200 font-mono">
                  Name,Code,Category,Campus,CollegeAffiliation
                </code>
                <p className="text-[10px] text-slate-500 pt-0.5">
                  Example: <em>Department of Physics,AAU-PHYS,ACADEMIC,4 Kilo Campus,CNCS</em>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Paste CSV Content *
                </label>
                <textarea
                  rows={6}
                  required
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="Name,Code,Category,Campus,CollegeAffiliation&#10;Department of Chemistry,AAU-CHEM,ACADEMIC,4 Kilo Campus,CNCS"
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {importFeedback?.errors && importFeedback.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Import Warnings ({importFeedback.errors.length}):</span>
                  </p>
                  <ul className="list-disc pl-4 text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                    {importFeedback.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingImport}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingImport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Import Records</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRUTHFUL INTEGRATION EXPLANATION (SIS / SSO) */}
      {/* ========================================================================= */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isInfoModalOpen === "SIS"
                      ? "AAU SIS Registrar Synchronization"
                      : "Faculty SSO Identity Bridge"}
                  </h3>
                  <p className="text-xs text-slate-400">Integration Architecture Status</p>
                </div>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              {isInfoModalOpen === "SIS" ? (
                <>
                  <p>
                    <strong className="text-slate-900">Status: Not Configured.</strong> Automated background synchronization with Addis Ababa University's Central Registrar SIS database is not connected.
                  </p>
                  <p>
                    All departmental structures and unit codes displayed here are <strong className="text-slate-800">managed directly inside Uni-Chat</strong> by designated platform administrators.
                  </p>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                    To bulk-provision or synchronize departments from institutional rosters without an active SIS gateway, use the <strong>"Import Roster"</strong> CSV tool above.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-slate-900">Status: Not Configured.</strong> The external Microsoft 365 / Shibboleth SAML Single Sign-On bridge for faculty email authentication is not active.
                  </p>
                  <p>
                    Delegates and faculty members currently sign in using their verified <strong className="text-slate-800">Uni-Chat platform credentials</strong> with verified AAU email domains (<code className="font-mono text-slate-700">@aau.edu.et</code>).
                  </p>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                    Publishing capabilities are assigned and revoked strictly on a per-user basis in the <strong>Authorized Delegates</strong> panel.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(null)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
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
