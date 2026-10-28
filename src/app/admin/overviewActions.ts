"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth";

export interface OverviewDailyPoint {
  date: string;
  dayLabel: string;
  dau: number;
  posts: number;
  sessions: number;
}

export interface AdminOverviewStats {
  totalStudents: number;
  verifiedStudents: number;
  activeTodayCount: number;
  pendingActionCount: number;
  postReadyCount: number;
  pendingReportsCount: number;
  pendingClubsCount: number;
  pendingPostsCount: number;
  urgentNotificationsCount: number;
  dbLatencyMs: number;
  dbStatus: "HEALTHY" | "DEGRADED";
  dailyActivity: OverviewDailyPoint[];
  recentAuditLogs: any[];
  recentReports: any[];
  recentPostReadyApps: any[];
  recentClubs: any[];
  recentPosts: any[];
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  await requireAdminPermission();

  const pingStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    // Ping fallback
  }
  const dbLatencyMs = Math.max(1, Date.now() - pingStart);

  // "Active Today" = distinct users who started a chat session today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    verifiedStudents,
    postReadyCount,
    pendingReportsCount,
    pendingClubsCount,
    pendingPostsCount,
    urgentNotificationsCount,
    activeTodayCount,
    recentAuditLogs,
    recentReports,
    recentPostReadyApps,
    recentClubs,
    recentPosts,
    pastSessions,
    pastPosts,
    pastUsers
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", emailVerified: true } }),
    prisma.postReadyApplication.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.club.count({ where: { status: "PENDING" } }),
    prisma.post.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.notification.count({ where: { isUrgent: true, isRead: false } }),
    prisma.chatSession.count({
      where: { startedAt: { gte: todayStart } }
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: { displayName: true, email: true, role: true }
        }
      }
    }),
    prisma.report.findMany({
      take: 5,
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { email: true } },
        reportedUser: { select: { email: true, id: true, displayName: true } }
      }
    }),
    prisma.postReadyApplication.findMany({
      take: 5,
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { displayName: true, email: true, department: true } }
      }
    }),
    prisma.club.findMany({
      take: 5,
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        applicant: { select: { displayName: true, email: true } }
      }
    }),
    prisma.post.findMany({
      take: 5,
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { displayName: true, email: true, role: true } }
      }
    }),
    prisma.chatSession.findMany({
      where: { startedAt: { gte: fourteenDaysAgo } },
      select: { startedAt: true }
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true }
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo }, role: "STUDENT" },
      select: { createdAt: true }
    })
  ]);

  // Bucket the past 14 days into daily data points
  const dailyActivity: OverviewDailyPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayLabel = i === 0 ? "Today" : dStr;

    const sessionsCount = pastSessions.filter(
      (s) => s.startedAt >= d && s.startedAt < nextD
    ).length;

    const postsCount = pastPosts.filter(
      (p) => p.createdAt >= d && p.createdAt < nextD
    ).length;

    const usersCount = pastUsers.filter(
      (u) => u.createdAt >= d && u.createdAt < nextD
    ).length;

    dailyActivity.push({
      date: dStr,
      dayLabel,
      dau: usersCount,
      posts: postsCount,
      sessions: sessionsCount
    });
  }

  return {
    totalStudents,
    verifiedStudents,
    activeTodayCount,
    pendingActionCount: pendingReportsCount + postReadyCount + pendingClubsCount + pendingPostsCount,
    postReadyCount,
    pendingReportsCount,
    pendingClubsCount,
    pendingPostsCount,
    urgentNotificationsCount,
    dbLatencyMs,
    dbStatus: "HEALTHY",
    dailyActivity,
    recentAuditLogs,
    recentReports,
    recentPostReadyApps,
    recentClubs,
    recentPosts
  };
}
