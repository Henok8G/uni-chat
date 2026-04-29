"use server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan, ReportStatus } from "@prisma/client";
import { logAnalyticsEvent, AnalyticsEventType } from "@/lib/analytics";

async function requireAdmin() {
  const user = await getSessionUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!user) {
    throw new Error("Not logged in");
  }
  
  if (!adminEmail || user.email !== adminEmail) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

export async function getUserByEmail(email: string) {
  await requireAdmin();
  
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
  await requireAdmin();
  
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

  return updated;
}

export async function toggleUserBan(userId: string, banned: boolean) {
  await requireAdmin();
  
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

  return updated;
}

export async function getPendingReports() {
  await requireAdmin();
  const sortedReports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: {
      reporter: { select: { email: true, university: true } },
      reportedUser: { select: { id: true, email: true, plan: true, banned: true, _count: { select: { reportsReceived: true } } } },
      chatSession: { select: { startedAt: true, endedAt: true, endedReason: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return sortedReports;
}

export async function resolveReport(reportId: string, action: "DISMISS" | "WARN" | "BAN", notes: string) {
  const admin = await requireAdmin();
  const report = await prisma.report.findUnique({ where: { id: reportId }, include: { reportedUser: true } });
  if (!report) throw new Error("Report not found");

  if (action === "BAN") {
    await prisma.user.update({
      where: { id: report.reportedUserId },
      data: { banned: true }
    });
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action === "DISMISS" ? "DISMISSED" : "ACTION_TAKEN",
      resolutionNotes: notes,
      handledByAdminId: admin.id,
      actionTaken: action // legacy field support
    }
  });

  logAnalyticsEvent(AnalyticsEventType.REPORT_RESOLVED, {
    userId: report.reportedUserId,
    sessionId: report.chatSessionId || undefined,
    properties: { action },
  });

  return updated;
}

export async function getAnalyticsSummary() {
  await requireAdmin();

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
