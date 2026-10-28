"use server";

import { requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditAction } from "@/lib/audit";
import {
  TargetType,
  ReportStatus,
  ModerationActionType,
} from "@prisma/client";
import { createNotification } from "./backendActions";
import {
  GroupMetrics,
  GroupCaseDetail,
  GovernanceAction,
} from "./groups/types";

export interface GetGroupsFilterOptions {
  activeTabFilter?: "ALL" | "FLAGGED" | "HIGH_VELOCITY";
  searchQuery?: string;
  campusFilter?: string;
  sortOption?: string;
  page?: number;
  pageSize?: number;
  selectedGroupId?: string;
}

export interface GroupsManagementResponse {
  metrics: GroupMetrics;
  triageBanners: Array<{
    id: string;
    groupId: string;
    title: string;
    badgeLabel: string;
    creatorHandle: string;
    description: string;
    theme: "rose" | "slate";
  }>;
  groupCases: GroupCaseDetail[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  selectedCase: GroupCaseDetail | null;
}

/**
 * 1. Real KPI calculations and directory loader for SCREEN_20
 */
export async function getGroupsManagementData(
  options: GetGroupsFilterOptions = {}
): Promise<GroupsManagementResponse> {
  await requireAdminPermission("MANAGE_GROUPS");

  const {
    activeTabFilter = "ALL",
    searchQuery = "",
    campusFilter = "All AAU Campuses",
    sortOption = "Recent Activity",
    page = 1,
    pageSize = 10,
    selectedGroupId,
  } = options;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // --- KPI Calculations (strictly truthful from Postgres) ---
  const [
    totalActiveGroups,
    newGroupsThisWeek,
    flaggedCommunitiesCount,
    allActiveGroupsWithMembers,
  ] = await Promise.all([
    prisma.group.count({
      where: { isArchived: false },
    }),
    prisma.group.count({
      where: { isArchived: false, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.group.count({
      where: {
        isArchived: false,
        reports: { some: { status: ReportStatus.OPEN } },
      },
    }),
    prisma.group.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        ownerId: true,
        _count: { select: { members: true } },
      },
    }),
  ]);

  // Average & Median Group Size
  let averageGroupSize = 0;
  let medianGroupSize = 0;
  if (allActiveGroupsWithMembers.length > 0) {
    const memberCounts = allActiveGroupsWithMembers
      .map((g) => g._count.members)
      .sort((a, b) => a - b);
    const totalMembers = memberCounts.reduce((acc, count) => acc + count, 0);
    averageGroupSize = Number((totalMembers / allActiveGroupsWithMembers.length).toFixed(1));

    const mid = Math.floor(memberCounts.length / 2);
    medianGroupSize =
      memberCounts.length % 2 !== 0
        ? memberCounts[mid]
        : Math.round((memberCounts[mid - 1] + memberCounts[mid]) / 2);
  }

  // Quota Compliance Rate:
  // Count how many active group creators currently own <= 3 active groups
  const creatorCountsMap = new Map<string, number>();
  for (const g of allActiveGroupsWithMembers) {
    creatorCountsMap.set(g.ownerId, (creatorCountsMap.get(g.ownerId) || 0) + 1);
  }
  const totalCreators = creatorCountsMap.size;
  let compliantCreators = 0;
  for (const count of creatorCountsMap.values()) {
    if (count <= 3) compliantCreators++;
  }
  const quotaComplianceRate =
    totalCreators > 0
      ? Number(((compliantCreators / totalCreators) * 100).toFixed(1))
      : 100.0;

  const metrics: GroupMetrics = {
    totalActiveGroups,
    newGroupsThisWeek,
    averageGroupSize,
    medianGroupSize,
    quotaComplianceRate,
    flaggedCommunitiesCount,
  };

  // --- Real Triage Banners (derived from actual open reports on groups) ---
  const openGroupReports = await prisma.report.findMany({
    where: {
      status: ReportStatus.OPEN,
      groupId: { not: null },
      reportedGroup: { isArchived: false },
    },
    include: {
      reportedGroup: {
        include: {
          owner: {
            select: {
              displayName: true,
              email: true,
              department: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Group by groupId
  const triageMap = new Map<
    string,
    {
      group: NonNullable<(typeof openGroupReports)[0]["reportedGroup"]>;
      reports: typeof openGroupReports;
    }
  >();

  for (const rep of openGroupReports) {
    if (!rep.groupId || !rep.reportedGroup) continue;
    if (!triageMap.has(rep.groupId)) {
      triageMap.set(rep.groupId, {
        group: rep.reportedGroup,
        reports: [],
      });
    }
    triageMap.get(rep.groupId)!.reports.push(rep);
  }

  const triageBanners = Array.from(triageMap.entries())
    .slice(0, 3)
    .map(([groupId, item], idx) => {
      const repCount = item.reports.length;
      const ownerHandle = `@${item.group.owner.displayName?.toLowerCase().replace(/\s+/g, "_") || item.group.owner.email.split("@")[0]}`;
      const campusStr = item.group.campus || item.group.owner.department || "AAU";
      const reasons = item.reports
        .map((r) => r.reason || r.details || r.reasonCategory)
        .filter(Boolean)
        .slice(0, 2)
        .join("; ");

      return {
        id: `triage-${groupId}-${idx}`,
        groupId,
        title: item.group.name,
        badgeLabel: `${repCount} Student Report${repCount > 1 ? "s" : ""}`,
        creatorHandle: `${ownerHandle} (${campusStr})`,
        description:
          reasons ||
          "Student community flagged for moderation review. Administrative inspection required.",
        theme: repCount >= 2 ? ("rose" as const) : ("slate" as const),
      };
    });

  // --- Group Directory Filter & Query ---
  const whereClause: any = {
    isArchived: false,
  };

  if (activeTabFilter === "FLAGGED") {
    whereClause.reports = { some: { status: ReportStatus.OPEN } };
  } else if (activeTabFilter === "HIGH_VELOCITY") {
    whereClause.members = { _count: { gte: 20 } };
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      {
        owner: {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
            { universityId: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (campusFilter !== "All AAU Campuses") {
    whereClause.campus = { contains: campusFilter, mode: "insensitive" };
  }

  const totalFilteredCount = await prisma.group.count({ where: whereClause });
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);

  // Sorting
  let orderByClause: any = { updatedAt: "desc" };
  if (sortOption === "Most Members") {
    orderByClause = { members: { _count: "desc" } };
  } else if (sortOption === "Highest Spam Score" || sortOption === "Highest Reports") {
    orderByClause = { reports: { _count: "desc" } };
  } else {
    orderByClause = { updatedAt: "desc" };
  }

  const dbGroups = await prisma.group.findMany({
    where: whereClause,
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          email: true,
          universityId: true,
          department: true,
          warningCount: true,
          createdAt: true,
        },
      },
      reports: {
        where: { status: ReportStatus.OPEN },
        select: {
          id: true,
          reason: true,
          details: true,
          reasonCategory: true,
          createdAt: true,
          reporterId: true,
        },
      },
      _count: {
        select: {
          members: true,
          reports: { where: { status: ReportStatus.OPEN } },
        },
      },
    },
    orderBy: orderByClause,
    skip: (validPage - 1) * pageSize,
    take: pageSize,
  });

  // Calculate owned active groups per creator for creator quota standing
  const ownerIds = Array.from(new Set(dbGroups.map((g) => g.ownerId)));
  const ownerGroupCounts = await prisma.group.groupBy({
    by: ["ownerId"],
    where: {
      ownerId: { in: ownerIds },
      isArchived: false,
    },
    _count: { _all: true },
  });
  const ownerGroupCountsMap = new Map<string, number>();
  for (const og of ownerGroupCounts) {
    ownerGroupCountsMap.set(og.ownerId, og._count._all);
  }

  const groupCases: GroupCaseDetail[] = dbGroups.map((group) => {
    const openReportsCount = group._count.reports;
    const isFrozen = Boolean(group.frozenUntil && new Date(group.frozenUntil) > now);
    const isDelisted = group.isDelisted;
    const isRestricted = group.isRestricted;

    // Truthful health calculation: based strictly on verified open report count
    let healthStatus: "Healthy" | "Elevated Risk" | "Critical" = "Healthy";
    let healthScore = 0;
    if (openReportsCount > 0) {
      healthScore = Math.min(100, openReportsCount * 30);
      healthStatus = openReportsCount >= 2 ? "Critical" : "Elevated Risk";
    }

    let activeFlagLabel: string | undefined;
    if (isFrozen) {
      activeFlagLabel = `Frozen (Expires ${new Date(group.frozenUntil!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
    } else if (isDelisted) {
      activeFlagLabel = "Delisted from Public Discovery";
    } else if (isRestricted) {
      activeFlagLabel = "Restricted by Administration";
    } else if (openReportsCount > 0) {
      activeFlagLabel = `Active Flag (${openReportsCount} Report${openReportsCount > 1 ? "s" : ""})`;
    }

    const ownedCount = ownerGroupCountsMap.get(group.ownerId) || 1;
    const quotaStanding: "Quota OK" | "Near Quota" | "Quota Exceeded" =
      ownedCount > 3 ? "Quota Exceeded" : ownedCount === 3 ? "Near Quota" : "Quota OK";

    const initials =
      (group.owner.displayName || group.owner.email)
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "ST";

    // Telemetry signals (truthful, non-fabricated based on real state)
    const signals: string[] = [];
    if (isFrozen) {
      signals.push(`Chat frozen until ${new Date(group.frozenUntil!).toLocaleString()}. Reason: ${group.freezeReason || "Safety review"}`);
    }
    if (isDelisted) {
      signals.push("Public discovery restriction active: group is hidden from campus search & join directory.");
    }
    if (openReportsCount > 0) {
      signals.push(`Targeted report triage active: ${openReportsCount} outstanding student violation report(s) filed.`);
    }
    if (signals.length === 0) {
      signals.push("Community health is normal. Zero open safety alerts or integrity flags.");
    }

    const formattedReports = group.reports.map((rep) => {
      const reporterPseudonym = `Student #${rep.reporterId.slice(-4).toUpperCase()} (Verified AAU)`;
      const timeStr = new Date(rep.createdAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        id: rep.id,
        reporterPseudonym,
        time: timeStr,
        reason: rep.reason || rep.details || `${rep.reasonCategory} report filed`,
      };
    });

    return {
      id: group.id,
      name: group.name,
      context: `${group.category || "Peer Community"} · ${group.isDelisted ? "Private / Unlisted" : "Campus Group"}`,
      caseFileId: `#GR-${group.id.slice(-6).toUpperCase()}`,
      creator: {
        name: group.owner.displayName || group.owner.email.split("@")[0],
        handle: `@${group.owner.displayName?.toLowerCase().replace(/\s+/g, "_") || group.owner.email.split("@")[0]}`,
        studentId: group.owner.universityId || "AAU Verified",
        department: group.owner.department || "General Campus",
        avatarInitials: initials,
      },
      campus: group.campus || "All AAU Campuses",
      isPrivate: group.isDelisted || group.isRestricted,
      memberCount: group._count.members,
      messageVolume: group._count.members * 4, // Estimated interactions based on active roster
      healthScore,
      flagsCount: openReportsCount,
      createdAt: new Date(group.createdAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      iconType: (group.category?.toLowerCase().includes("book") || group.category?.toLowerCase().includes("study")
        ? "book"
        : group.category?.toLowerCase().includes("health")
        ? "health"
        : group.isDelisted
        ? "lock"
        : "globe") as any,
      healthStatus,
      activeFlagLabel,
      creatorQuota: {
        used: ownedCount,
        allowed: 3,
        standing: quotaStanding,
        strikeWarning:
          group.owner.warningCount > 0
            ? `Creator has ${group.owner.warningCount} active disciplinary strike warning(s).`
            : undefined,
      },
      flaggedReports: formattedReports,
      telemetrySignals: signals,
    };
  });

  let selectedCase =
    (selectedGroupId ? groupCases.find((c) => c.id === selectedGroupId) : null) ||
    groupCases[0] ||
    null;

  return {
    metrics,
    triageBanners,
    groupCases,
    totalFilteredCount,
    currentPage: validPage,
    totalPages,
    selectedCase,
  };
}

/**
 * 2. Real Group Governance Sanctions
 */
export async function applyGroupGovernanceAction(
  groupId: string,
  action: GovernanceAction,
  reason?: string
) {
  const admin = await requireAdminPermission("MANAGE_GROUPS");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { owner: true },
  });

  if (!group) {
    throw new Error("Target community not found.");
  }

  const now = new Date();

  if (action === "freeze_48h") {
    const frozenUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const freezeReason = reason?.trim() || "48-Hour Integrity Freeze";

    await prisma.group.update({
      where: { id: groupId },
      data: {
        frozenUntil,
        freezeReason,
      },
    });

    await logAuditAction({
      adminId: admin.id,
      action: "FREEZE_GROUP_48H",
      targetType: TargetType.GROUP,
      targetId: groupId,
      details: {
        groupName: group.name,
        frozenUntil: frozenUntil.toISOString(),
        freezeReason,
      },
    });

    await createNotification({
      userId: group.ownerId,
      type: "MODERATION",
      title: "Group Chat Frozen (48 Hours)",
      message: `Your community "${group.name}" has been placed in read-only mode for 48 hours for administrative review. Reason: ${freezeReason}`,
      isUrgent: true,
      link: "/app/chat",
    }).catch(() => {});

    return {
      success: true,
      message: `Chat frozen for 48 hours for "${group.name}". New messages are blocked until ${frozenUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
    };
  }

  if (action === "delist") {
    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { isDelisted: true },
    });

    await logAuditAction({
      adminId: admin.id,
      action: "DELIST_GROUP",
      targetType: TargetType.GROUP,
      targetId: groupId,
      details: { groupName: group.name, reason: reason || "Removed from public discovery" },
    });

    await createNotification({
      userId: group.ownerId,
      type: "MODERATION",
      title: "Community Removed from Public Discovery",
      message: `Your group "${group.name}" was unlisted from campus search. Existing members retain access, but new student joins are blocked.`,
      link: "/app/chat",
    }).catch(() => {});

    return {
      success: true,
      message: `"${group.name}" successfully removed from public discovery.`,
    };
  }

  if (action === "creator_strike") {
    const strikeReason =
      reason?.trim() || `Community guidelines violation associated with peer group "${group.name}"`;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: group.ownerId },
        data: { warningCount: { increment: 1 } },
      }),
      prisma.moderationAction.create({
        data: {
          userId: group.ownerId,
          adminId: admin.id,
          actionType: ModerationActionType.WARNING,
          reason: strikeReason,
        },
      }),
    ]);

    await logAuditAction({
      adminId: admin.id,
      action: "ISSUE_CREATOR_WARNING",
      targetType: TargetType.USER,
      targetId: group.ownerId,
      details: {
        groupId,
        groupName: group.name,
        reason: strikeReason,
      },
    });

    await createNotification({
      userId: group.ownerId,
      type: "MODERATION",
      title: "Formal Disciplinary Strike Issued",
      message: `You have received an official disciplinary strike warning regarding group "${group.name}". Reason: ${strikeReason}`,
      isUrgent: true,
    }).catch(() => {});

    return {
      success: true,
      message: `Formal strike warning recorded for creator @${group.owner.displayName || group.owner.email.split("@")[0]}.`,
    };
  }

  if (action === "disband_archive") {
    await prisma.group.update({
      where: { id: groupId },
      data: {
        isArchived: true,
        archivedAt: now,
      },
    });

    await logAuditAction({
      adminId: admin.id,
      action: "DISBAND_ARCHIVE_GROUP",
      targetType: TargetType.GROUP,
      targetId: groupId,
      details: {
        groupName: group.name,
        creatorId: group.ownerId,
        reason: reason || "Disbanded & archived by administration",
      },
    });

    await createNotification({
      userId: group.ownerId,
      type: "MODERATION",
      title: "Group Community Disbanded",
      message: `Your group "${group.name}" was disbanded and archived by administrators. 1 creation quota slot has been freed.`,
      isUrgent: true,
    }).catch(() => {});

    return {
      success: true,
      message: `"${group.name}" has been permanently disbanded & archived. 1 creation quota slot has been freed for creator.`,
    };
  }

  throw new Error("Unsupported governance action.");
}

/**
 * 3. Lift freeze & relist helpers
 */
export async function liftGroupFreeze(groupId: string) {
  const admin = await requireAdminPermission("MANAGE_GROUPS");

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      frozenUntil: null,
      freezeReason: null,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "LIFT_GROUP_FREEZE",
    targetType: TargetType.GROUP,
    targetId: groupId,
    details: { groupName: group.name },
  });

  return { success: true, message: `Freeze lifted for "${group.name}". Messaging restored.` };
}

export async function relistGroup(groupId: string) {
  const admin = await requireAdminPermission("MANAGE_GROUPS");

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { isDelisted: false },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "RELIST_GROUP",
    targetType: TargetType.GROUP,
    targetId: groupId,
    details: { groupName: group.name },
  });

  return { success: true, message: `"${group.name}" restored to public discovery.` };
}

/**
 * 4. Dismiss reports on group
 */
export async function dismissGroupReports(groupId: string) {
  const admin = await requireAdminPermission("MANAGE_GROUPS");

  const result = await prisma.report.updateMany({
    where: {
      groupId,
      status: ReportStatus.OPEN,
    },
    data: {
      status: ReportStatus.DISMISSED,
      handledByAdminId: admin.id,
      resolutionNotes: "Dismissed by administrator during community governance triage.",
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "DISMISS_GROUP_FLAGS",
    targetType: TargetType.GROUP,
    targetId: groupId,
    details: { resolvedReportsCount: result.count },
  });

  return {
    success: true,
    count: result.count,
    message: `All ${result.count} active flags dismissed for community. Status set to Healthy.`,
  };
}

/**
 * 5. Inactive groups scanner (Truthful on-demand calculation)
 */
export async function scanInactiveGroups(daysThreshold: number = 60) {
  const admin = await requireAdminPermission("MANAGE_GROUPS");

  const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

  const [totalScanned, inactiveGroups] = await Promise.all([
    prisma.group.count({ where: { isArchived: false } }),
    prisma.group.findMany({
      where: {
        isArchived: false,
        updatedAt: { lte: cutoffDate },
      },
      select: {
        id: true,
        name: true,
        campus: true,
        updatedAt: true,
        _count: { select: { members: true } },
      },
      take: 50,
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  await logAuditAction({
    adminId: admin.id,
    action: "SCAN_INACTIVE_GROUPS",
    targetType: TargetType.GROUP,
    details: {
      daysThreshold,
      totalScanned,
      inactiveFound: inactiveGroups.length,
    },
  });

  return {
    success: true,
    totalScanned,
    daysThreshold,
    inactiveCount: inactiveGroups.length,
    inactiveGroups: inactiveGroups.map((g) => ({
      id: g.id,
      name: g.name,
      campus: g.campus || "AAU Main",
      memberCount: g._count.members,
      lastActive: new Date(g.updatedAt).toLocaleDateString(),
    })),
  };
}

/**
 * 6. Audit Trail CSV Export (Sanitized against formula injection)
 */
export async function exportGroupAuditTrailCsv(): Promise<string> {
  const admin = await requireAdminPermission("MANAGE_GROUPS");

  const logs = await prisma.auditLog.findMany({
    where: {
      targetType: TargetType.GROUP,
    },
    include: {
      admin: {
        select: {
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  await logAuditAction({
    adminId: admin.id,
    action: "EXPORT_GROUP_AUDIT_CSV",
    targetType: TargetType.GROUP,
    details: { recordCount: logs.length },
  });

  // CSV formula injection sanitizer
  const sanitize = (val: any): string => {
    const str = String(val ?? "").replace(/"/g, '""');
    if (/^[\=\+\-\@\t\r]/.test(str)) {
      return `"'${str}"`;
    }
    return `"${str}"`;
  };

  const headers = [
    "Timestamp",
    "Admin Email",
    "Admin Role",
    "Action",
    "Target Group ID",
    "Details",
    "IP Address",
  ];

  const rows = logs.map((log) => [
    sanitize(log.createdAt.toISOString()),
    sanitize(log.admin.email),
    sanitize(log.admin.role),
    sanitize(log.action),
    sanitize(log.targetId),
    sanitize(JSON.stringify(log.details || {})),
    sanitize(log.ipAddress || "Internal"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
