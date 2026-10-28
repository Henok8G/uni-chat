"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, hasAdminPermission, requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { UserRole, AdminPermission, TargetType } from "@prisma/client";
import {
  TeamManagementData,
  RoleArchetype,
  PermissionCategory,
  AssignedStaffMember,
  RoleAuditRecord,
  RoleInspectorData,
} from "./team/types";

// =========================================================================
// Canonical Permission Registry (20 Granular Permissions across 9 Modules)
// =========================================================================
interface CanonicalPermissionDef {
  id: string;
  permCode: AdminPermission;
  categoryNumber: number;
  categoryTitle: string;
  categoryDescription: string;
  title: string;
  description: string;
  levelBadge: "Read" | "Write" | "Privileged" | "Audit-Heavy";
  isHighRisk?: boolean;
}

const CANONICAL_PERMISSIONS: CanonicalPermissionDef[] = [
  // Module 1: Student Directory & Verification
  {
    id: "PERM-USER-01",
    permCode: "MANAGE_USERS",
    categoryNumber: 1,
    categoryTitle: "Student Directory & Verification",
    categoryDescription: "Identity verification, student records, and status governance",
    title: "View & Query Student Directory",
    description: "Read-only search across verified student profiles and academic departments",
    levelBadge: "Read",
  },
  {
    id: "PERM-USER-02",
    permCode: "MANAGE_USERS",
    categoryNumber: 1,
    categoryTitle: "Student Directory & Verification",
    categoryDescription: "Identity verification, student records, and status governance",
    title: "Sanction Accounts & Enforce Bans",
    description: "Issue temporary suspensions, account freezes, and permanent platform bans",
    levelBadge: "Privileged",
    isHighRisk: true,
  },
  {
    id: "PERM-USER-03",
    permCode: "REVIEW_POST_READY",
    categoryNumber: 1,
    categoryTitle: "Student Directory & Verification",
    categoryDescription: "Identity verification, student records, and status governance",
    title: "Review Post-Ready Author Applications",
    description: "Evaluate writing samples and grant verified broadcast publishing badges",
    levelBadge: "Write",
  },

  // Module 2: Moderation & Community Safety
  {
    id: "PERM-MOD-01",
    permCode: "MODERATE_REPORTS",
    categoryNumber: 2,
    categoryTitle: "Moderation & Community Safety",
    categoryDescription: "Content triage, safety escalations, and incident resolution",
    title: "Triage & Resolve Student Reports",
    description: "Review incoming misconduct reports across messages, posts, and groups",
    levelBadge: "Write",
  },
  {
    id: "PERM-MOD-02",
    permCode: "MODERATE_REPORTS",
    categoryNumber: 2,
    categoryTitle: "Moderation & Community Safety",
    categoryDescription: "Content triage, safety escalations, and incident resolution",
    title: "Issue Warning Strikes & Dismissals",
    description: "Enforce multi-strike warnings and clear unsubstantiated student reports",
    levelBadge: "Privileged",
    isHighRisk: true,
  },
  {
    id: "PERM-MOD-03",
    permCode: "VIEW_AUDIT_LOGS",
    categoryNumber: 2,
    categoryTitle: "Moderation & Community Safety",
    categoryDescription: "Content triage, safety escalations, and incident resolution",
    title: "Inspect Moderation Action Logs",
    description: "Audit staff enforcement decisions and previous disciplinary sanctions",
    levelBadge: "Audit-Heavy",
  },

  // Module 3: Content & Campus Feed
  {
    id: "PERM-CONT-01",
    permCode: "MANAGE_CONTENT",
    categoryNumber: 3,
    categoryTitle: "Content & Campus Feed",
    categoryDescription: "Institutional notices, student feed, and editorial bulletins",
    title: "Publish Campus Notices & Bulletins",
    description: "Create and schedule high-visibility announcements on the main feed",
    levelBadge: "Write",
  },
  {
    id: "PERM-CONT-02",
    permCode: "MANAGE_CONTENT",
    categoryNumber: 3,
    categoryTitle: "Content & Campus Feed",
    categoryDescription: "Institutional notices, student feed, and editorial bulletins",
    title: "Unpublish & Archive Feed Posts",
    description: "Retract misleading or inappropriate publications from the public feed",
    levelBadge: "Write",
  },
  {
    id: "PERM-CONT-03",
    permCode: "MANAGE_CONTENT",
    categoryNumber: 3,
    categoryTitle: "Content & Campus Feed",
    categoryDescription: "Institutional notices, student feed, and editorial bulletins",
    title: "Pin Official Faculty Directives",
    description: "Anchor verified institutional broadcasts to the top of student feeds",
    levelBadge: "Privileged",
  },

  // Module 4: Student Groups & Study Circles
  {
    id: "PERM-GRP-01",
    permCode: "MANAGE_GROUPS",
    categoryNumber: 4,
    categoryTitle: "Student Groups & Communities",
    categoryDescription: "Study group oversight, community delisting, and freeze controls",
    title: "Audit & Delist Inactive Groups",
    description: "Hide non-compliant or dormant student study groups from discovery",
    levelBadge: "Write",
  },
  {
    id: "PERM-GRP-02",
    permCode: "MANAGE_GROUPS",
    categoryNumber: 4,
    categoryTitle: "Student Groups & Communities",
    categoryDescription: "Study group oversight, community delisting, and freeze controls",
    title: "Freeze Community Channels & Reassign Ownership",
    description: "Halt message circulation during investigations and reassign group owners",
    levelBadge: "Privileged",
    isHighRisk: true,
  },

  // Module 5: Clubs & Student Societies
  {
    id: "PERM-CLUB-01",
    permCode: "MANAGE_CLUBS",
    categoryNumber: 5,
    categoryTitle: "Clubs & Student Societies",
    categoryDescription: "Charter approval, student society governance, and leadership accreditation",
    title: "Review & Charter Student Clubs",
    description: "Approve constitution applications and grant official club profiles",
    levelBadge: "Write",
  },
  {
    id: "PERM-CLUB-02",
    permCode: "MANAGE_CLUBS",
    categoryNumber: 5,
    categoryTitle: "Clubs & Student Societies",
    categoryDescription: "Charter approval, student society governance, and leadership accreditation",
    title: "Suspend & Sanction Student Societies",
    description: "Enforce probationary restrictions on non-compliant student societies",
    levelBadge: "Privileged",
    isHighRisk: true,
  },

  // Module 6: Departments & Faculty Units
  {
    id: "PERM-DEPT-01",
    permCode: "MANAGE_DEPARTMENTS",
    categoryNumber: 6,
    categoryTitle: "Departments & Faculty Units",
    categoryDescription: "Academic unit verification, delegate roster, and verified badges",
    title: "Authorize Department Delegates",
    description: "Assign faculty delegates with verified announcement publishing rights",
    levelBadge: "Privileged",
    isHighRisk: true,
  },
  {
    id: "PERM-DEPT-02",
    permCode: "MANAGE_DEPARTMENTS",
    categoryNumber: 6,
    categoryTitle: "Departments & Faculty Units",
    categoryDescription: "Academic unit verification, delegate roster, and verified badges",
    title: "Verify Academic Units & Affiliations",
    description: "Link academic departments to designated AAU colleges and campuses",
    levelBadge: "Write",
  },

  // Module 7: Student Matching Engine
  {
    id: "PERM-MATCH-01",
    permCode: "MANAGE_MATCHING",
    categoryNumber: 7,
    categoryTitle: "Student Matching Engine",
    categoryDescription: "Discovery algorithm weights, daily caps, and proximity safety controls",
    title: "Tune Heuristic Affinity Weights",
    description: "Calibrate academic, project, mentorship, and hobby affinity coefficients",
    levelBadge: "Privileged",
    isHighRisk: true,
  },
  {
    id: "PERM-MATCH-02",
    permCode: "MANAGE_MATCHING",
    categoryNumber: 7,
    categoryTitle: "Student Matching Engine",
    categoryDescription: "Discovery algorithm weights, daily caps, and proximity safety controls",
    title: "Triage Matching Anomalies & Throttle Rules",
    description: "Investigate rapid connection anomalies and toggle cross-gender cooldowns",
    levelBadge: "Write",
  },

  // Module 8: Notifications & Broadcasts
  {
    id: "PERM-NOTIF-01",
    permCode: "MANAGE_BROADCASTS",
    categoryNumber: 8,
    categoryTitle: "Notifications & Broadcasts",
    categoryDescription: "Administrative dispatch, clearance workflow, and targeting bounds",
    title: "Author Targeted Broadcasts",
    description: "Draft emergency alerts and informational notices for campus audiences",
    levelBadge: "Privileged",
  },
  {
    id: "PERM-NOTIF-02",
    permCode: "MANAGE_BROADCASTS",
    categoryNumber: 8,
    categoryTitle: "Notifications & Broadcasts",
    categoryDescription: "Administrative dispatch, clearance workflow, and targeting bounds",
    title: "Review & Dispatch Administrative Broadcasts",
    description: "Perform second-pair verification and execute campus-wide notification dispatch",
    levelBadge: "Privileged",
    isHighRisk: true,
  },

  // Module 9: System & Access Control
  {
    id: "PERM-SYS-01",
    permCode: "MANAGE_ROLES",
    categoryNumber: 9,
    categoryTitle: "System & Access Control",
    categoryDescription: "Role governance, personnel assignments, and security auditing",
    title: "Configure Role Permissions & Staff Roster",
    description: "Grant administrative privileges and maintain authorized personnel rosters",
    levelBadge: "Privileged",
    isHighRisk: true,
  },
  {
    id: "PERM-SYS-02",
    permCode: "ALL",
    categoryNumber: 9,
    categoryTitle: "System & Access Control",
    categoryDescription: "Role governance, personnel assignments, and security auditing",
    title: "Root Platform Administration (Super Admin)",
    description: "Break-glass administrative override across all platform databases and models",
    levelBadge: "Privileged",
    isHighRisk: true,
  },
];

// Baseline default permission grants per role
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  SUPER_ADMIN: ["ALL"],
  ADMIN: [
    "MANAGE_USERS",
    "MANAGE_CONTENT",
    "MANAGE_GROUPS",
    "MANAGE_CLUBS",
    "MANAGE_DEPARTMENTS",
    "MANAGE_MATCHING",
    "MANAGE_BROADCASTS",
    "VIEW_AUDIT_LOGS",
  ],
  CONTENT_ADMIN: ["MANAGE_CONTENT", "REVIEW_POST_READY"],
  MODERATOR: ["MODERATE_REPORTS", "VIEW_AUDIT_LOGS"],
  ORG_ADMIN: ["MANAGE_CLUBS", "MANAGE_GROUPS"],
  STUDENT: [],
};

const ROLE_METADATA: Record<
  Exclude<UserRole, "STUDENT">,
  {
    name: string;
    tierLabel: string;
    isSystemLocked: boolean;
    scopeSummary: string;
    description: string;
    iconName: "lock" | "shield" | "megaphone" | "users" | "activity";
    badgeStyle: string;
  }
> = {
  SUPER_ADMIN: {
    name: "Super Admin (Root / CCI Lead)",
    tierLabel: "Tier-1 Root",
    isSystemLocked: true,
    scopeSummary: "Full Platform Authority & Security Governance",
    description: "Permanent root administrative role with unrestricted emergency override capabilities and role management authority.",
    iconName: "lock",
    badgeStyle: "bg-rose-50 text-rose-700 border-rose-200",
  },
  ADMIN: {
    name: "Operational Administrator (Tier-2)",
    tierLabel: "Tier-2 Operations",
    isSystemLocked: false,
    scopeSummary: "Core Academic & Community Operations",
    description: "Manages day-to-day operations including student directories, content curation, groups, clubs, matching, and broadcasts.",
    iconName: "shield",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CONTENT_ADMIN: {
    name: "Content & Feed Admin (Editorial)",
    tierLabel: "Tier-3 Editorial",
    isSystemLocked: false,
    scopeSummary: "Feed Publishing, Announcements & Author Review",
    description: "Curates official campus feed publications, academic opportunities, event bulletins, and post-ready author applications.",
    iconName: "megaphone",
    badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  MODERATOR: {
    name: "Moderator (Student Safety)",
    tierLabel: "Tier-3 Safety",
    isSystemLocked: false,
    scopeSummary: "Incident Triage, Student Reports & Safety Auditing",
    description: "Evaluates community misconduct reports, implements warnings or account restrictions, and audits student safety compliance.",
    iconName: "activity",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ORG_ADMIN: {
    name: "Club & Student Communities Manager",
    tierLabel: "Tier-3 Affairs",
    isSystemLocked: false,
    scopeSummary: "Extracurricular Charters, Club Oversight & Study Circles",
    description: "Processes student club charter applications, monitors society leadership compliance, and audits study community guidelines.",
    iconName: "users",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export async function getTeamManagementData(
  selectedRoleInput: UserRole = "ADMIN"
): Promise<TeamManagementData> {
  const selectedRoleKey: Exclude<UserRole, "STUDENT"> =
    selectedRoleInput === "STUDENT" ? "ADMIN" : selectedRoleInput;

  const admin = await requireAdminPermission("MANAGE_ROLES");

  // Query actual staff accounts (all users with role !== STUDENT)
  const staffUsers = await prisma.user.findMany({
    where: { role: { not: "STUDENT" } },
    include: {
      adminRoleAssignments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Query active role assignments
  const allAssignments = await prisma.adminRoleAssignment.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          department: true,
          emailVerified: true,
        },
      },
    },
  });

  // Count members per role
  const roleMemberCounts: Record<UserRole, number> = {
    SUPER_ADMIN: 0,
    ADMIN: 0,
    CONTENT_ADMIN: 0,
    MODERATOR: 0,
    ORG_ADMIN: 0,
    STUDENT: 0,
  };

  staffUsers.forEach((u) => {
    if (roleMemberCounts[u.role] !== undefined) {
      roleMemberCounts[u.role]++;
    }
  });

  // Build Role Archetypes list
  const roleArchetypes: RoleArchetype[] = (
    Object.keys(ROLE_METADATA) as Array<Exclude<UserRole, "STUDENT">>
  ).map((roleKey) => {
    const meta = ROLE_METADATA[roleKey];
    return {
      id: `ROLE-${roleKey}`,
      roleKey,
      name: meta.name,
      tierLabel: meta.tierLabel,
      isSystemLocked: meta.isSystemLocked,
      scopeSummary: meta.scopeSummary,
      description: meta.description,
      memberCount: roleMemberCounts[roleKey] || 0,
      isSelected: roleKey === selectedRoleKey,
      iconName: meta.iconName,
      badgeStyle: meta.badgeStyle,
    };
  });

  // Resolve currently active permissions for the selected role
  // Check if any assignment for this role has customized permissions
  const roleAssignments = allAssignments.filter((a) => a.role === selectedRoleKey);
  const activePermissions = new Set<AdminPermission>();

  if (selectedRoleKey === "SUPER_ADMIN") {
    activePermissions.add("ALL");
  } else if (roleAssignments.length > 0 && roleAssignments[0].permissions.length > 0) {
    roleAssignments[0].permissions.forEach((p) => activePermissions.add(p));
  } else {
    // Default baseline for this role
    (DEFAULT_ROLE_PERMISSIONS[selectedRoleKey] || []).forEach((p) => activePermissions.add(p));
  }

  const isSuperAdminRole = selectedRoleKey === "SUPER_ADMIN" || activePermissions.has("ALL");

  // Group canonical permissions into 9 modules with dynamic granted/restricted status
  const categoryMap = new Map<number, PermissionCategory>();

  CANONICAL_PERMISSIONS.forEach((pDef) => {
    if (!categoryMap.has(pDef.categoryNumber)) {
      categoryMap.set(pDef.categoryNumber, {
        id: `CAT-0${pDef.categoryNumber}`,
        categoryNumber: pDef.categoryNumber,
        title: pDef.categoryTitle,
        description: pDef.categoryDescription,
        grantedCount: 0,
        totalCount: 0,
        permissions: [],
      });
    }

    const cat = categoryMap.get(pDef.categoryNumber)!;
    const isGranted = isSuperAdminRole || activePermissions.has(pDef.permCode);

    let status: "granted" | "restricted" = isGranted ? "granted" : "restricted";
    let statusLabel = isGranted ? "Active" : "🔒 Restricted";

    if (isSuperAdminRole && pDef.permCode === "ALL") {
      statusLabel = "Root Granted";
    }

    cat.totalCount++;
    if (isGranted) cat.grantedCount++;

    cat.permissions.push({
      id: pDef.id,
      permCode: pDef.permCode,
      title: pDef.title,
      description: pDef.description,
      levelBadge: pDef.levelBadge,
      status,
      statusLabel,
      isToggleable: !ROLE_METADATA[selectedRoleKey].isSystemLocked,
      toggleValue: isGranted,
      requiresNotice: pDef.isHighRisk ? "High-Risk: Modifies security/user access" : undefined,
    });
  });

  const permissionCategories = Array.from(categoryMap.values());

  // Derive total stats
  let totalPerms = 0;
  let totalGranted = 0;
  permissionCategories.forEach((cat) => {
    totalPerms += cat.totalCount;
    totalGranted += cat.grantedCount;
  });

  const authorityPercentage = totalPerms > 0
    ? Math.round((totalGranted / totalPerms) * 100)
    : 0;

  // Resolve assigned staff for the selected role
  const assignedStaff: AssignedStaffMember[] = staffUsers
    .filter((u) => u.role === selectedRoleKey)
    .map((u) => {
      const assignment = u.adminRoleAssignments.find((a) => a.role === selectedRoleKey);
      return {
        id: u.id,
        name: u.displayName || u.email.split("@")[0],
        email: u.email,
        title: ROLE_METADATA[selectedRoleKey].name.split("(")[0].trim(),
        role: u.role,
        campus: u.department ? `${u.department}` : "All AAU Campuses",
        department: u.department,
        isVerified: u.emailVerified,
        assignedAt: assignment ? assignment.createdAt.toISOString() : u.createdAt.toISOString(),
      };
    });

  // Fetch real security audit history for role operations
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: [
          "ASSIGN_ADMIN_ROLE",
          "REMOVE_ADMIN_ROLE",
          "UPDATE_ROLE_PERMISSIONS",
          "CREATE_ROLE",
        ],
      },
    },
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const recentAuditHistory: RoleAuditRecord[] = auditLogs.map((log) => {
    const elapsedMs = Date.now() - log.createdAt.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    const elapsedDays = Math.floor(elapsedHours / 24);

    let timeAgo = "Just now";
    if (elapsedDays > 0) timeAgo = `${elapsedDays}d ago`;
    else if (elapsedHours > 0) timeAgo = `${elapsedHours}h ago`;
    else if (elapsedMinutes > 0) timeAgo = `${elapsedMinutes}m ago`;

    return {
      id: log.id,
      timeAgo,
      timestamp: log.createdAt.toISOString(),
      actor: log.admin.displayName || log.admin.email,
      action: log.action.replace(/_/g, " "),
      details: (log.details as Record<string, any>) || {},
      ipAddress: log.ipAddress,
    };
  });

  const inspectorData: RoleInspectorData = {
    roleId: `ROLE-${selectedRoleKey}`,
    roleKey: selectedRoleKey,
    roleName: ROLE_METADATA[selectedRoleKey].name,
    description: ROLE_METADATA[selectedRoleKey].description,
    isSystemLocked: ROLE_METADATA[selectedRoleKey].isSystemLocked,
    assignedStaff,
    grantedPermissionsCount: totalGranted,
    totalPermissionsCount: totalPerms,
    operationalAuthorityPercentage: authorityPercentage,
  };

  return {
    roleArchetypes,
    selectedRoleKey,
    permissionCategories,
    inspectorData,
    assignedStaff,
    recentAuditHistory,
    totalStats: {
      total: totalPerms,
      granted: totalGranted,
      restricted: totalPerms - totalGranted,
    },
  };
}

/**
 * 2. Update granted permissions for a configurable role archetype
 */
export async function updateRolePermissions(
  role: UserRole,
  permissions: AdminPermission[]
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdminPermission("MANAGE_ROLES");

  // Prevent modifying locked system role
  if (role === "SUPER_ADMIN") {
    throw new Error("System Protection: Super Administrator role permissions are immutable and cannot be modified.");
  }

  // Self-escalation prevention: If caller is not Super Admin, they cannot grant permissions they lack
  const isSuperAdmin =
    admin.role === "SUPER_ADMIN" ||
    (!!process.env.ADMIN_EMAIL && admin.email === process.env.ADMIN_EMAIL);

  if (!isSuperAdmin) {
    const callerPermissions = new Set(
      admin.adminRoleAssignments.flatMap((a) => a.permissions)
    );
    for (const p of permissions) {
      if (!callerPermissions.has(p) && !callerPermissions.has("ALL")) {
        throw new Error(
          `Security Violation: Cannot grant privilege '${p}' which is not in your administrative scope.`
        );
      }
    }
  }

  // Update or create role assignment templates for all users currently having this role
  const existingUsersWithRole = await prisma.user.findMany({
    where: { role },
    select: { id: true },
  });

  for (const user of existingUsersWithRole) {
    await prisma.adminRoleAssignment.upsert({
      where: {
        userId_role: { userId: user.id, role },
      },
      create: {
        userId: user.id,
        role,
        permissions,
        grantedById: admin.id,
      },
      update: {
        permissions,
        grantedById: admin.id,
      },
    });
  }

  // Record immutable security audit log
  await logAuditAction({
    adminId: admin.id,
    action: "UPDATE_ROLE_PERMISSIONS",
    targetType: TargetType.USER,
    targetId: role,
    details: {
      role,
      permissions,
      affectedUserCount: existingUsersWithRole.length,
    },
  });

  return {
    success: true,
    message: `Updated permissions for ${role}. Synchronized across ${existingUsersWithRole.length} staff accounts.`,
  };
}

/**
 * 3. Assign an existing student/user to an administrative role
 */
export async function assignUserToRole(
  targetUserId: string,
  role: UserRole,
  permissions?: AdminPermission[]
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdminPermission("MANAGE_ROLES");

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("Target user account not found in database.");
  }

  if (targetUser.banned) {
    throw new Error("Security Violation: Cannot assign administrative roles to a banned account.");
  }

  const isCallerSuperAdmin =
    admin.role === "SUPER_ADMIN" ||
    (!!process.env.ADMIN_EMAIL && admin.email === process.env.ADMIN_EMAIL);

  // Self-escalation prevention: Non-super-admins cannot assign Super Admin
  if (role === "SUPER_ADMIN" && !isCallerSuperAdmin) {
    throw new Error("Forbidden: Only an existing Super Administrator can assign Super Admin privileges.");
  }

  // Determine permissions to grant
  const permsToGrant: AdminPermission[] =
    role === "SUPER_ADMIN"
      ? [AdminPermission.ALL]
      : permissions && permissions.length > 0
      ? permissions
      : DEFAULT_ROLE_PERMISSIONS[role];

  // Update user role
  await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
  });

  // Upsert assignment record
  await prisma.adminRoleAssignment.upsert({
    where: {
      userId_role: { userId: targetUserId, role },
    },
    create: {
      userId: targetUserId,
      role,
      permissions: permsToGrant,
      grantedById: admin.id,
    },
    update: {
      permissions: permsToGrant,
      grantedById: admin.id,
    },
  });

  // Record audit log
  await logAuditAction({
    adminId: admin.id,
    action: "ASSIGN_ADMIN_ROLE",
    targetType: TargetType.USER,
    targetId: targetUserId,
    details: {
      role,
      assignedEmail: targetUser.email,
      permissions: permsToGrant,
    },
  });

  return {
    success: true,
    message: `Assigned ${targetUser.email} to ${role} successfully.`,
  };
}

/**
 * 4. Remove an administrative role from a staff account (reverting to STUDENT)
 */
export async function removeUserFromRole(
  targetUserId: string
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdminPermission("MANAGE_ROLES");

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("Target user account not found in database.");
  }

  // Anti-Lockout Invariant: Prevent removing the last Super Administrator
  if (targetUser.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });

    if (superAdminCount <= 1) {
      throw new Error(
        "Lockout Prevention: Cannot remove or downgrade the last active Super Administrator on the platform."
      );
    }
  }

  const previousRole = targetUser.role;

  // Revert user role to STUDENT
  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: "STUDENT" },
  });

  // Delete all administrative role assignments
  await prisma.adminRoleAssignment.deleteMany({
    where: { userId: targetUserId },
  });

  // Record audit log
  await logAuditAction({
    adminId: admin.id,
    action: "REMOVE_ADMIN_ROLE",
    targetType: TargetType.USER,
    targetId: targetUserId,
    details: {
      previousRole,
      targetEmail: targetUser.email,
    },
  });

  return {
    success: true,
    message: `Revoked ${previousRole} from ${targetUser.email}. Account reverted to student privileges.`,
  };
}

/**
 * 5. Search non-banned verified students to assign to staff roles
 */
export async function searchEligiblePersonnel(
  query: string
): Promise<Array<{ id: string; email: string; displayName: string | null; department: string | null; role: UserRole }>> {
  await requireAdminPermission("MANAGE_ROLES");

  const cleanQuery = query.trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: {
      banned: false,
      OR: cleanQuery
        ? [
            { email: { contains: cleanQuery, mode: "insensitive" } },
            { displayName: { contains: cleanQuery, mode: "insensitive" } },
            { department: { contains: cleanQuery, mode: "insensitive" } },
          ]
        : undefined,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      department: true,
      role: true,
    },
    take: 15,
    orderBy: { email: "asc" },
  });

  return users;
}
