"use server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan, ReportStatus } from "@prisma/client";
import { logAnalyticsEvent, AnalyticsEventType } from "@/lib/analytics";

import { requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { TargetType, ModerationActionType } from "@prisma/client";

export async function getUserByEmail(email: string) {
  const admin = await requireAdminPermission("MANAGE_USERS");
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      university: true,
      deviceLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      }
    }
  });
  
  return user;
}

export async function updateUserPlan(userId: string, plan: Plan, expiresAt: Date | null) {
  const admin = await requireAdminPermission("MANAGE_USERS");
  
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      planExpiresAt: expiresAt,
    },
    include: {
      university: true,
    }
  });
  
  logAnalyticsEvent(AnalyticsEventType.USER_UPGRADED_PLAN, {
    userId: updated.id,
    plan,
    universityId: updated.universityId || undefined,
  });

  await logAuditAction({
    adminId: admin.id,
    action: "UPDATE_USER_PLAN",
    targetType: TargetType.USER,
    targetId: userId,
    details: { plan, expiresAt },
  });

  return updated;
}

export async function toggleUserBan(userId: string, banned: boolean) {
  const admin = await requireAdminPermission("MANAGE_USERS");
  
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      banned,
    },
    include: {
      university: true,
    }
  });
  
  if (banned) {
    logAnalyticsEvent(AnalyticsEventType.USER_BANNED, {
      userId: updated.id,
      universityId: updated.universityId || undefined,
    });
  }

  await logAuditAction({
    adminId: admin.id,
    action: banned ? "BAN_USER" : "UNBAN_USER",
    targetType: TargetType.USER,
    targetId: userId,
  });

  return updated;
}

export async function getPendingReports() {
  await requireAdminPermission("MODERATE_REPORTS");
  const sortedReports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: {
      reporter: { select: { email: true, university: true } },
      reportedUser: { select: { id: true, email: true, plan: true, banned: true, warningCount: true, restrictedUntil: true, _count: { select: { reportsReceived: true } } } },
      chatSession: { select: { startedAt: true, endedAt: true, endedReason: true } },
      reportedPost: { select: { id: true, title: true, contentType: true } },
      reportedGroup: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" }
  });
  return sortedReports;
}

export async function resolveReport(reportId: string, action: "DISMISS" | "WARN" | "BAN", notes: string) {
  const admin = await requireAdminPermission("MODERATE_REPORTS");
  const report = await prisma.report.findUnique({ where: { id: reportId }, include: { reportedUser: true } });
  if (!report) throw new Error("Report not found");

  if (action === "BAN") {
    await prisma.user.update({
      where: { id: report.reportedUserId },
      data: { banned: true }
    });

    await prisma.moderationAction.create({
      data: {
        userId: report.reportedUserId,
        adminId: admin.id,
        actionType: ModerationActionType.BAN,
        reason: notes || "Banned via report resolution",
        reportId: reportId,
      }
    });
  } else if (action === "WARN") {
    await prisma.user.update({
      where: { id: report.reportedUserId },
      data: { warningCount: { increment: 1 } }
    });

    await prisma.moderationAction.create({
      data: {
        userId: report.reportedUserId,
        adminId: admin.id,
        actionType: ModerationActionType.WARNING,
        reason: notes || "Warned via report resolution",
        reportId: reportId,
      }
    });
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action === "DISMISS" ? "DISMISSED" : "ACTION_TAKEN",
      resolved: true,
      resolutionNotes: notes,
      handledByAdminId: admin.id,
      actionTaken: action
    }
  });

  logAnalyticsEvent(AnalyticsEventType.REPORT_RESOLVED, {
    userId: report.reportedUserId,
    sessionId: report.chatSessionId || undefined,
    properties: { action },
  });

  await logAuditAction({
    adminId: admin.id,
    action: `RESOLVE_REPORT_${action}`,
    targetType: TargetType.USER,
    targetId: report.reportedUserId,
    details: { reportId, action, notes },
  });

  return updated;
}

export async function getAnalyticsSummary() {
  await requireAdminPermission();

  // Aggregate stats from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const events = await prisma.analyticsEvent.groupBy({
    by: ['type'],
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    _count: {
      _all: true
    }
  });

  return events.map((e: any) => ({ type: e.type, count: e._count._all }));
}
