"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import {
  TargetType,
  BroadcastSeverity,
  BroadcastStatus,
  AudienceScope,
  NotificationType,
} from "@prisma/client";

// Explicit allowlist of permissible internal redirect destinations
const ALLOWED_DESTINATION_PREFIXES = [
  "/",
  "/app",
  "/app/chat",
  "/profile",
  "/settings",
  "/verify",
  "/home",
  "/admin",
];

function sanitizeDeepLink(link?: string | null): string {
  if (!link || typeof link !== "string") return "/";
  const trimmed = link.trim();
  const isAllowed = ALLOWED_DESTINATION_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(prefix + "/") || trimmed.startsWith(prefix + "?")
  );
  return isAllowed ? trimmed : "/";
}

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Formula injection defense: prefix dangerous start characters with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * 1. Fetch Notification Operations Data & Metrics (SCREEN_14)
 */
export async function getNotificationManagementData(filterScope = "ALL") {
  const admin = await requireAdminPermission("MANAGE_USERS");

  // Fetch real persisted counts across the entire platform
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBroadcastsCount,
    pendingClearanceCount,
    totalNotificationsCreated,
    totalNotificationsRead,
    urgentUnreadCount,
    failedDeliveryAggregation,
    registeredStudentsCount,
    verifiedStudentsCount,
    departmentsRaw,
    cohortsRaw,
    clearanceQueue,
    broadcastHistory,
  ] = await Promise.all([
    prisma.broadcast.count(),
    prisma.broadcast.count({ where: { status: BroadcastStatus.PENDING_APPROVAL } }),
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: true } }),
    prisma.notification.count({ where: { isUrgent: true, isRead: false } }),
    prisma.broadcast.aggregate({ _sum: { failureCount: true } }),
    prisma.user.count({ where: { role: "STUDENT", banned: false } }),
    prisma.user.count({ where: { role: "STUDENT", emailVerified: true, banned: false } }),
    prisma.user.groupBy({
      by: ["department"],
      where: { department: { not: null }, banned: false },
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ["year"],
      where: { year: { not: null }, banned: false },
      _count: { id: true },
    }),
    prisma.broadcast.findMany({
      where: { status: BroadcastStatus.PENDING_APPROVAL },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, department: true, role: true },
        },
      },
      take: 20,
    }),
    prisma.broadcast.findMany({
      where:
        filterScope === "ALL"
          ? {}
          : filterScope === "SENT"
          ? { status: BroadcastStatus.SENT }
          : filterScope === "PENDING"
          ? { status: BroadcastStatus.PENDING_APPROVAL }
          : filterScope === "DRAFT"
          ? { status: BroadcastStatus.DRAFT }
          : {},
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, role: true },
        },
        reviewedBy: {
          select: { id: true, displayName: true, email: true },
        },
      },
      take: 50,
    }),
  ]);

  const readRatePercentage =
    totalNotificationsCreated > 0
      ? Number(((totalNotificationsRead / totalNotificationsCreated) * 100).toFixed(1))
      : 0;

  // Real KPI Metrics Object — no fabricated statistics
  const metrics = {
    totalBroadcastsCreated: totalBroadcastsCount,
    pendingClearanceCount,
    inAppNotificationsDelivered: totalNotificationsCreated,
    inAppNotificationsRead: totalNotificationsRead,
    readRatePercentage,
    urgentUnreadCount,
    failedDeliveryCount: failedDeliveryAggregation._sum.failureCount || 0,
    registeredStudentsCount,
    verifiedStudentsCount,
    externalPushAvailable: false, // Honestly report external push gateway state
    externalSmsAvailable: false,
    externalSisEmailAvailable: false,
  };

  const availableDepartments = departmentsRaw
    .filter((d) => Boolean(d.department))
    .map((d) => ({
      name: d.department as string,
      studentCount: d._count.id,
    }));

  const availableCohorts = cohortsRaw
    .filter((c) => Boolean(c.year))
    .map((c) => ({
      year: c.year as number,
      name: `Year ${c.year} Undergraduate`,
      studentCount: c._count.id,
    }))
    .sort((a, b) => a.year - b.year);

  return {
    metrics,
    clearanceQueue: clearanceQueue.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      severity: item.severity,
      audienceScope: item.audienceScope,
      targetDepartment: item.targetDepartment,
      targetCohort: item.targetCohort,
      targetCampus: item.targetCampus,
      deepLink: item.deepLink,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      author: {
        id: item.author.id,
        name: item.author.displayName || item.author.email.split("@")[0],
        email: item.author.email,
        department: item.author.department || "General Administration",
      },
    })),
    history: broadcastHistory.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      severity: item.severity,
      status: item.status,
      audienceScope: item.audienceScope,
      targetDepartment: item.targetDepartment,
      targetCohort: item.targetCohort,
      targetCampus: item.targetCampus,
      recipientCount: item.recipientCount,
      failureCount: item.failureCount,
      sentAt: item.sentAt ? item.sentAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      authorName: item.author.displayName || item.author.email.split("@")[0],
      authorEmail: item.author.email,
      reviewerName: item.reviewedBy
        ? item.reviewedBy.displayName || item.reviewedBy.email.split("@")[0]
        : null,
      rejectionReason: item.rejectionReason,
    })),
    targetingOptions: {
      availableDepartments,
      availableCohorts,
      totalRegisteredStudents: registeredStudentsCount,
    },
    currentAdmin: {
      id: admin.id,
      email: admin.email,
      name: admin.displayName || admin.email.split("@")[0],
    },
  };
}

/**
 * 2. Audience Estimation Calculator
 */
export async function getAudienceRecipientEstimate(params: {
  audienceScope: AudienceScope;
  targetDepartment?: string;
  targetCohort?: number;
  targetCampus?: string;
}) {
  await requireAdminPermission("MANAGE_USERS");

  const whereClause: any = {
    role: "STUDENT",
    banned: false,
  };

  if (params.audienceScope === AudienceScope.DEPARTMENT && params.targetDepartment) {
    whereClause.department = params.targetDepartment;
  } else if (params.audienceScope === AudienceScope.COHORT && params.targetCohort) {
    whereClause.year = params.targetCohort;
  } else if (params.audienceScope === AudienceScope.CAMPUS && params.targetCampus) {
    // Note: Campus targeting is truthful; if user profiles don't store campus, report 0 or fallback
    return {
      count: 0,
      scope: params.audienceScope,
      note: "Campus targeting requires student profile campus association. Please target by Department or Year Cohort for direct delivery.",
    };
  }

  const count = await prisma.user.count({ where: whereClause });
  return {
    count,
    scope: params.audienceScope,
    note: `Targeting ${count} eligible non-banned Uni-Chat student account${count === 1 ? "" : "s"}.`,
  };
}

/**
 * 3. Create Broadcast Draft
 */
export async function createBroadcastDraft(data: {
  title: string;
  body: string;
  severity?: BroadcastSeverity;
  audienceScope?: AudienceScope;
  targetDepartment?: string;
  targetCohort?: number;
  targetCampus?: string;
  deepLink?: string;
  submitForReviewNow?: boolean;
}) {
  const admin = await requireAdminPermission("MANAGE_USERS");

  const title = (data.title || "").trim();
  const body = (data.body || "").trim();

  if (title.length < 3 || title.length > 120) {
    return { success: false, error: "Broadcast title must be between 3 and 120 characters." };
  }
  if (body.length < 5 || body.length > 1000) {
    return { success: false, error: "Broadcast body must be between 5 and 1,000 characters." };
  }

  const severity = data.severity || BroadcastSeverity.INFORMATIONAL;
  const audienceScope = data.audienceScope || AudienceScope.ALL;
  const deepLink = sanitizeDeepLink(data.deepLink);
  const status = data.submitForReviewNow
    ? BroadcastStatus.PENDING_APPROVAL
    : BroadcastStatus.DRAFT;

  const broadcast = await prisma.broadcast.create({
    data: {
      title,
      body,
      severity,
      status,
      audienceScope,
      targetDepartment: audienceScope === AudienceScope.DEPARTMENT ? data.targetDepartment : null,
      targetCohort: audienceScope === AudienceScope.COHORT ? data.targetCohort : null,
      targetCampus: audienceScope === AudienceScope.CAMPUS ? data.targetCampus : null,
      deepLink,
      authorId: admin.id,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: data.submitForReviewNow ? "SUBMIT_BROADCAST_APPROVAL" : "CREATE_BROADCAST_DRAFT",
    targetType: TargetType.BROADCAST,
    targetId: broadcast.id,
    details: {
      title,
      severity,
      audienceScope,
      status,
    },
  });

  return {
    success: true,
    message: data.submitForReviewNow
      ? `Broadcast "${title}" submitted to clearance queue for administrative review.`
      : `Broadcast draft "${title}" saved successfully.`,
    broadcast,
  };
}

/**
 * 4. Submit Existing Draft for Approval
 */
export async function submitBroadcastForApproval(broadcastId: string) {
  const admin = await requireAdminPermission("MANAGE_USERS");

  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
  });

  if (!broadcast) {
    return { success: false, error: "Broadcast record not found." };
  }
  if (broadcast.status !== BroadcastStatus.DRAFT && broadcast.status !== BroadcastStatus.REJECTED) {
    return {
      success: false,
      error: `Broadcast in state "${broadcast.status}" cannot be submitted for approval.`,
    };
  }

  const updated = await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: BroadcastStatus.PENDING_APPROVAL,
      rejectionReason: null,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "SUBMIT_BROADCAST_APPROVAL",
    targetType: TargetType.BROADCAST,
    targetId: broadcast.id,
    details: {
      title: broadcast.title,
      previousStatus: broadcast.status,
    },
  });

  return {
    success: true,
    message: `Broadcast "${updated.title}" submitted for administrative clearance.`,
    broadcast: updated,
  };
}

/**
 * 5. Review Clearance (Approve or Reject)
 */
export async function reviewBroadcastClearance(params: {
  broadcastId: string;
  decision: "APPROVE" | "REJECT";
  rejectionReason?: string;
}) {
  const reviewer = await requireAdminPermission("MANAGE_USERS");

  const broadcast = await prisma.broadcast.findUnique({
    where: { id: params.broadcastId },
  });

  if (!broadcast) {
    return { success: false, error: "Broadcast record not found." };
  }
  if (broadcast.status !== BroadcastStatus.PENDING_APPROVAL) {
    return {
      success: false,
      error: `Broadcast is not pending approval (current state: ${broadcast.status}).`,
    };
  }

  // Segregation of duties: Creator cannot self-approve if another reviewer is required
  const isSuperAdmin =
    reviewer.role === "SUPER_ADMIN" ||
    (process.env.ADMIN_EMAIL && reviewer.email === process.env.ADMIN_EMAIL);

  if (broadcast.authorId === reviewer.id && !isSuperAdmin) {
    return {
      success: false,
      error: "Segregation of Duties: Broadcast author cannot self-approve. An independent administrator review is required.",
    };
  }

  if (params.decision === "REJECT") {
    const reason = (params.rejectionReason || "").trim();
    if (!reason || reason.length < 5) {
      return { success: false, error: "A clear rejection reason (min 5 characters) is required." };
    }

    const updated = await prisma.broadcast.update({
      where: { id: params.broadcastId },
      data: {
        status: BroadcastStatus.REJECTED,
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await logAuditAction({
      adminId: reviewer.id,
      action: "REJECT_BROADCAST",
      targetType: TargetType.BROADCAST,
      targetId: broadcast.id,
      details: {
        title: broadcast.title,
        reason,
        authorId: broadcast.authorId,
      },
    });

    return {
      success: true,
      message: `Broadcast "${broadcast.title}" rejected: ${reason}`,
      broadcast: updated,
    };
  }

  // Decision === APPROVE
  const updated = await prisma.broadcast.update({
    where: { id: params.broadcastId },
    data: {
      status: BroadcastStatus.APPROVED,
      reviewedById: reviewer.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  await logAuditAction({
    adminId: reviewer.id,
    action: "APPROVE_BROADCAST",
    targetType: TargetType.BROADCAST,
    targetId: broadcast.id,
    details: {
      title: broadcast.title,
      severity: broadcast.severity,
      audienceScope: broadcast.audienceScope,
      authorId: broadcast.authorId,
    },
  });

  return {
    success: true,
    message: `Broadcast "${broadcast.title}" approved and cleared for dispatch.`,
    broadcast: updated,
  };
}

/**
 * 6. Dispatch Approved Broadcast (In-App Multi-Recipient Engine)
 */
export async function dispatchApprovedBroadcast(broadcastId: string) {
  const operator = await requireAdminPermission("MANAGE_USERS");

  // Atomic state lock: Transition from APPROVED to SENDING
  // If count is 0, another request has already claimed it or it is not approved
  const lock = await prisma.broadcast.updateMany({
    where: {
      id: broadcastId,
      status: BroadcastStatus.APPROVED,
    },
    data: {
      status: BroadcastStatus.SENDING,
    },
  });

  if (lock.count === 0) {
    const existing = await prisma.broadcast.findUnique({ where: { id: broadcastId } });
    if (!existing) {
      return { success: false, error: "Broadcast record not found." };
    }
    return {
      success: false,
      error: `Dispatch blocked: Broadcast is in state "${existing.status}". Must be in APPROVED state to send.`,
    };
  }

  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
  });

  if (!broadcast) {
    return { success: false, error: "Broadcast record lost during dispatch." };
  }

  try {
    // 1. Resolve Audience at send time
    const whereClause: any = {
      role: "STUDENT",
      banned: false,
    };

    if (broadcast.audienceScope === AudienceScope.DEPARTMENT && broadcast.targetDepartment) {
      whereClause.department = broadcast.targetDepartment;
    } else if (broadcast.audienceScope === AudienceScope.COHORT && broadcast.targetCohort) {
      whereClause.year = broadcast.targetCohort;
    }

    // Fetch matching recipient IDs (only id needed to minimize memory footprint)
    const eligibleRecipients = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    const isUrgent = broadcast.severity === BroadcastSeverity.EMERGENCY;
    const notificationType: NotificationType = isUrgent
      ? NotificationType.URGENT
      : NotificationType.SYSTEM;

    // 2. Batched, Idempotent Notification Creation (Chunks of 100)
    let createdCount = 0;
    let failedCount = 0;
    const CHUNK_SIZE = 100;

    for (let i = 0; i < eligibleRecipients.length; i += CHUNK_SIZE) {
      const chunk = eligibleRecipients.slice(i, i + CHUNK_SIZE);
      const records = chunk.map((user) => ({
        userId: user.id,
        type: notificationType,
        title: broadcast.title,
        message: broadcast.body,
        isUrgent,
        link: broadcast.deepLink || "/",
        broadcastId: broadcast.id,
      }));

      try {
        const res = await prisma.notification.createMany({
          data: records,
          skipDuplicates: true,
        });
        createdCount += res.count;
      } catch (chunkErr) {
        console.error(`Failed to insert notification chunk [${i}-${i + CHUNK_SIZE}]:`, chunkErr);
        failedCount += chunk.length;
      }
    }

    // 3. Complete Broadcast Status
    const finalStatus =
      createdCount > 0
        ? BroadcastStatus.SENT
        : failedCount > 0
        ? BroadcastStatus.REJECTED // Failed delivery
        : BroadcastStatus.SENT;

    const completed = await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        recipientCount: createdCount,
        failureCount: failedCount,
      },
    });

    await logAuditAction({
      adminId: operator.id,
      action: "DISPATCH_BROADCAST",
      targetType: TargetType.BROADCAST,
      targetId: broadcast.id,
      details: {
        title: broadcast.title,
        recipientCount: createdCount,
        failureCount: failedCount,
        audienceScope: broadcast.audienceScope,
        isUrgent,
      },
    });

    return {
      success: true,
      message: `Broadcast successfully dispatched to ${createdCount} student account${createdCount === 1 ? "" : "s"} (${failedCount} errors).`,
      broadcast: completed,
    };
  } catch (err: any) {
    // If an unexpected error occurs during delivery, mark as DRAFT or REJECTED to prevent hang in SENDING
    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { status: BroadcastStatus.APPROVED },
    });
    return {
      success: false,
      error: `Dispatch failed: ${err.message || "Unknown error during dispatch"}`,
    };
  }
}

/**
 * 7. Cancel Broadcast
 */
export async function cancelBroadcast(broadcastId: string) {
  const admin = await requireAdminPermission("MANAGE_USERS");

  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
  });

  if (!broadcast) {
    return { success: false, error: "Broadcast record not found." };
  }
  if (broadcast.status === BroadcastStatus.SENT || broadcast.status === BroadcastStatus.SENDING) {
    return {
      success: false,
      error: `Cannot cancel a broadcast that has already been dispatched or is currently sending.`,
    };
  }

  const cancelled = await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: BroadcastStatus.CANCELLED },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "CANCEL_BROADCAST",
    targetType: TargetType.BROADCAST,
    targetId: broadcast.id,
    details: {
      title: broadcast.title,
      previousStatus: broadcast.status,
    },
  });

  return {
    success: true,
    message: `Broadcast "${broadcast.title}" has been cancelled.`,
    broadcast: cancelled,
  };
}

/**
 * 8. Export Broadcast Audit Trail to CSV (Formula Injection Defended)
 */
export async function exportBroadcastAuditCsv() {
  const admin = await requireAdminPermission("MANAGE_USERS");

  const broadcasts = await prisma.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { email: true, displayName: true } },
      reviewedBy: { select: { email: true, displayName: true } },
    },
    take: 500,
  });

  const headers = [
    "Broadcast ID",
    "Title",
    "Severity",
    "Status",
    "Audience Scope",
    "Target Scope Detail",
    "Recipients Delivered",
    "Failures",
    "Author Name",
    "Author Email",
    "Reviewer Email",
    "Created At",
    "Sent At",
  ];

  const rows = broadcasts.map((b) => [
    sanitizeCsvCell(b.id),
    sanitizeCsvCell(b.title),
    sanitizeCsvCell(b.severity),
    sanitizeCsvCell(b.status),
    sanitizeCsvCell(b.audienceScope),
    sanitizeCsvCell(b.targetDepartment || (b.targetCohort ? `Year ${b.targetCohort}` : "All Students")),
    sanitizeCsvCell(b.recipientCount),
    sanitizeCsvCell(b.failureCount),
    sanitizeCsvCell(b.author.displayName || b.author.email.split("@")[0]),
    sanitizeCsvCell(b.author.email),
    sanitizeCsvCell(b.reviewedBy?.email || "N/A"),
    sanitizeCsvCell(b.createdAt.toISOString()),
    sanitizeCsvCell(b.sentAt ? b.sentAt.toISOString() : "Not Sent"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  await logAuditAction({
    adminId: admin.id,
    action: "EXPORT_BROADCAST_AUDIT_CSV",
    targetType: TargetType.USER,
    targetId: admin.id,
    details: {
      exportedRows: broadcasts.length,
      format: "CSV",
    },
  });

  return {
    success: true,
    csv: csvContent,
    fileName: `uni_chat_broadcast_audit_${new Date().toISOString().slice(0, 10)}.csv`,
    count: broadcasts.length,
  };
}

/**
 * 9. Student Notification Endpoints (Server Actions for recipient access)
 */
export async function fetchStudentNotifications(limit = 20, offset = 0) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Sign in required", notifications: [], unreadCount: 0 };
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: Math.min(50, Math.max(1, limit)),
      skip: Math.max(0, offset),
    }),
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  ]);

  return {
    success: true,
    notifications,
    unreadCount,
  };
}

export async function markStudentNotificationRead(notificationId: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Enforce recipient ownership
  const updateResult = await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });

  if (updateResult.count === 0) {
    return { success: false, error: "Notification not found or access denied." };
  }

  return { success: true, message: "Notification marked as read." };
}

export async function markAllStudentNotificationsRead() {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const updateResult = await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return {
    success: true,
    message: `Marked ${updateResult.count} notifications as read.`,
    updatedCount: updateResult.count,
  };
}
