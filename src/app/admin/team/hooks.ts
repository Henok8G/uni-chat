"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { UserRole, AdminPermission } from "@prisma/client";
import {
  RoleArchetype,
  PermissionCategory,
  RoleInspectorData,
  PermissionFilter,
  AssignedStaffMember,
  RoleAuditRecord,
  TeamManagementData,
} from "./types";
import {
  getTeamManagementData,
  updateRolePermissions,
  assignUserToRole,
  removeUserFromRole,
} from "../teamActions";

export function useTeamRoles(
  onShowToast?: (msg: string, type?: "success" | "info" | "warning" | "error") => void
) {
  const [data, setData] = useState<TeamManagementData | null>(null);
  const [selectedRoleKey, setSelectedRoleKey] = useState<UserRole>("ADMIN");
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [initialCategories, setInitialCategories] = useState<PermissionCategory[]>([]);
  const [filterMode, setFilterMode] = useState<PermissionFilter>("all");
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full team and role management data
  const fetchData = useCallback(
    async (roleKey: UserRole) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTeamManagementData(roleKey);
        setData(result);
        setPermissionCategories(result.permissionCategories);
        setInitialCategories(result.permissionCategories);
        setHasPendingChanges(false);
      } catch (err: any) {
        console.error("Failed to load team management data:", err);
        const errMsg = err?.message || "Failed to load team management data";
        setError(errMsg);
        if (onShowToast) {
          onShowToast(`Team Roles Error: ${errMsg}`, "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    fetchData(selectedRoleKey);
  }, [fetchData, selectedRoleKey]);

  // Selected Role Archetype
  const selectedRole = useMemo(() => {
    if (!data?.roleArchetypes) {
      return {
        id: `ROLE-${selectedRoleKey}`,
        roleKey: selectedRoleKey,
        name: "Operational Administrator (Tier-2)",
        tierLabel: "Tier-2 Operations",
        isSystemLocked: false,
        scopeSummary: "Core Academic & Community Operations",
        description: "Manages day-to-day operations including student directories, content curation, groups, clubs, matching, and broadcasts.",
        memberCount: 0,
        isSelected: true,
        iconName: "shield" as const,
        badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    return (
      data.roleArchetypes.find((r) => r.roleKey === selectedRoleKey) ||
      data.roleArchetypes[0]
    );
  }, [data, selectedRoleKey]);

  // Select Role
  const selectRole = (roleIdOrKey: string) => {
    const cleanKey = roleIdOrKey.replace(/^ROLE-/, "") as UserRole;
    setSelectedRoleKey(cleanKey);
    setHasPendingChanges(false);
  };

  // Toggle dynamic permission for the selected role
  const togglePermission = (catId: string, permId: string) => {
    if (selectedRole.isSystemLocked) {
      if (onShowToast) {
        onShowToast("System Protection: Super Administrator permissions are immutable.", "warning");
      }
      return;
    }

    setPermissionCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          permissions: cat.permissions.map((p) => {
            if (p.id !== permId) return p;
            const newToggle = !p.toggleValue;
            return {
              ...p,
              toggleValue: newToggle,
              statusLabel: newToggle ? "Active" : "🔒 Restricted",
              status: newToggle ? "granted" : "restricted",
            };
          }),
        };
      })
    );
    setHasPendingChanges(true);
  };

  // Filtered categories based on filterMode
  const filteredCategories = useMemo(() => {
    return permissionCategories
      .map((cat) => {
        const filteredPermissions = cat.permissions.filter((p) => {
          if (filterMode === "all") return true;
          if (filterMode === "granted") return p.status === "granted";
          if (filterMode === "restricted") return p.status !== "granted";
          return true;
        });
        return {
          ...cat,
          permissions: filteredPermissions,
        };
      })
      .filter((cat) => cat.permissions.length > 0);
  }, [permissionCategories, filterMode]);

  // Dynamic statistics
  const totalStats = useMemo(() => {
    let total = 0;
    let granted = 0;
    permissionCategories.forEach((cat) => {
      total += cat.permissions.length;
      granted += cat.permissions.filter((p) => p.status === "granted").length;
    });
    return {
      total,
      granted,
      restricted: total - granted,
    };
  }, [permissionCategories]);

  // Dynamic Inspector Data
  const inspectorData: RoleInspectorData = useMemo(() => {
    const authorityPercentage = totalStats.total > 0
      ? Math.round((totalStats.granted / totalStats.total) * 100)
      : 0;

    return {
      roleId: `ROLE-${selectedRoleKey}`,
      roleKey: selectedRoleKey,
      roleName: selectedRole.name,
      description: selectedRole.description,
      isSystemLocked: selectedRole.isSystemLocked,
      assignedStaff: data?.assignedStaff || [],
      grantedPermissionsCount: totalStats.granted,
      totalPermissionsCount: totalStats.total,
      operationalAuthorityPercentage: authorityPercentage,
    };
  }, [totalStats, selectedRoleKey, selectedRole, data]);

  // Save Role Policy to Postgres
  const saveRolePolicy = async () => {
    setIsSaving(true);
    try {
      // Collect all active permissions
      const grantedPermCodes = new Set<AdminPermission>();
      permissionCategories.forEach((cat) => {
        cat.permissions.forEach((p) => {
          if (p.status === "granted" && p.permCode) {
            grantedPermCodes.add(p.permCode);
          }
        });
      });

      const res = await updateRolePermissions(selectedRoleKey, Array.from(grantedPermCodes));
      setHasPendingChanges(false);
      setInitialCategories(permissionCategories);
      if (onShowToast) {
        onShowToast(res.message, "success");
      }
      await fetchData(selectedRoleKey);
      return true;
    } catch (err: any) {
      console.error("Save role policy failed:", err);
      if (onShowToast) {
        onShowToast(`Failed to save policy: ${err?.message || "Unknown error"}`, "error");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Discard local changes
  const discardChanges = () => {
    setPermissionCategories(initialCategories);
    setHasPendingChanges(false);
  };

  // Assign staff member to current or target role
  const handleAssignStaff = async (userId: string, role: UserRole) => {
    try {
      const res = await assignUserToRole(userId, role);
      if (onShowToast) {
        onShowToast(res.message, "success");
      }
      await fetchData(selectedRoleKey);
      return true;
    } catch (err: any) {
      console.error("Assign staff failed:", err);
      if (onShowToast) {
        onShowToast(`Assignment failed: ${err?.message || "Unknown error"}`, "error");
      }
      return false;
    }
  };

  // Remove staff member from role
  const handleRemoveStaff = async (userId: string) => {
    try {
      const res = await removeUserFromRole(userId);
      if (onShowToast) {
        onShowToast(res.message, "success");
      }
      await fetchData(selectedRoleKey);
      return true;
    } catch (err: any) {
      console.error("Remove staff failed:", err);
      if (onShowToast) {
        onShowToast(`Revocation failed: ${err?.message || "Unknown error"}`, "error");
      }
      return false;
    }
  };

  return {
    roleArchetypes: data?.roleArchetypes || [],
    selectedRole,
    selectedRoleId: `ROLE-${selectedRoleKey}`,
    selectedRoleKey,
    selectRole,
    permissionCategories: filteredCategories,
    rawCategories: permissionCategories,
    inspectorData,
    filterMode,
    setFilterMode,
    totalStats,
    hasPendingChanges,
    togglePermission,
    saveRolePolicy,
    discardChanges,
    assignedStaff: data?.assignedStaff || [],
    recentAuditHistory: data?.recentAuditHistory || [],
    assignStaff: handleAssignStaff,
    removeStaff: handleRemoveStaff,
    refreshData: () => fetchData(selectedRoleKey),
    loading,
    isSaving,
    error,
  };
}
