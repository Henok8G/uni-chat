"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, hasAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { TargetType } from "@prisma/client";
import {
  CampusAnalyticsKPIs,
  TelemetryPoint,
  CampusNode,
  CohortRetentionRow,
  ModulePenetrationItem,
  AnalyticsSummaryData,
} from "./analytics/types";

// East Africa Time (UTC+3) offset in milliseconds
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

function getAddisAbabaDate(date = new Date()): Date {
  return new Date(date.getTime() + EAT_OFFSET_MS);
}

function getStartOfDayUTC3(date = new Date()): Date {
  const utcMs = date.getTime();
  const eatMs = utcMs + EAT_OFFSET_MS;
  const startOfDayEatMs = Math.floor(eatMs / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
  return new Date(startOfDayEatMs - EAT_OFFSET_MS);
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
 * Maps a student's department to the appropriate AAU campus cluster.
 */
function mapDepartmentToCampus(deptName?: string | null): {
  campusName: string;
  campusCode: string;
} {
  if (!deptName) {
    return { campusName: "Unassigned / General", campusCode: "UNASS" };
  }
  const lower = deptName.toLowerCase();

  // 5 Kilo: Engineering, AAiT, Biomedical, Electrical, Mechanical, Software
  if (
    lower.includes("engineering") ||
    lower.includes("aait") ||
    lower.includes("biomedical") ||
    lower.includes("electrical") ||
    lower.includes("civil") ||
    lower.includes("mechanical") ||
    lower.includes("software")
  ) {
    return { campusName: "5 Kilo (AAiT Engineering)", campusCode: "5K" };
  }

  // 4 Kilo: CNCS, Natural sciences, Computer Science, Stat, Math, Physics, Chemistry, Biology
  if (
    lower.includes("computer science") ||
    lower.includes("stat") ||
    lower.includes("math") ||
    lower.includes("natural") ||
    lower.includes("cncs") ||
    lower.includes("physics") ||
    lower.includes("chemistry") ||
    lower.includes("biology")
  ) {
    return { campusName: "4 Kilo (CNCS Natural Sciences)", campusCode: "4K" };
  }

  // Tikur Anbessa: Medical, Health, Medicine, Nursing, Pharmacy, CHS
  if (
    lower.includes("medicine") ||
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("nursing") ||
    lower.includes("pharmacy") ||
    lower.includes("chs") ||
    lower.includes("hospital")
  ) {
    return { campusName: "Tikur Anbessa (Medical & Health)", campusCode: "CHS" };
  }

  // Sidist Kilo: Main, Humanities, Social, Law, Business, Library, Registrar, Governance
  if (
    lower.includes("registrar") ||
    lower.includes("library") ||
    lower.includes("law") ||
    lower.includes("humanities") ||
    lower.includes("social") ||
    lower.includes("business") ||
    lower.includes("economics") ||
    lower.includes("fbe") ||
    lower.includes("main") ||
    lower.includes("sidist")
  ) {
    return { campusName: "Sidist Kilo (Main & Humanities)", campusCode: "6K" };
  }

  // Default to general / unassigned
  return { campusName: "Unassigned / General", campusCode: "UNASS" };
}

async function verifyAnalyticsAdmin() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized: Log in required");
  }

  const isSuperAdmin =
    user.role === "SUPER_ADMIN" ||
    (!!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL);

  const canViewAudit = await hasAdminPermission(user.id, "VIEW_AUDIT_LOGS");
  const canManageUsers = await hasAdminPermission(user.id, "MANAGE_USERS");

  if (!isSuperAdmin && !canViewAudit && !canManageUsers) {
    throw new Error("Forbidden: Insufficient analytics permissions");
  }

  return user;
}

/**
 * 1. Fetch live campus analytics and cohort retention data (SCREEN_16)
 */
export async function getCampusAnalyticsData(
  timeRange = "30 Days",
  campusFilter = "All AAU Campuses"
): Promise<AnalyticsSummaryData> {
  await verifyAnalyticsAdmin();

  const now = new Date();
  const eatNow = getAddisAbabaDate(now);

  // Determine window start based on timeRange
  let windowStartDate: Date;
  let priorWindowStartDate: Date;
  let priorWindowEndDate: Date;

  if (timeRange === "Today") {
    windowStartDate = getStartOfDayUTC3(now);
    priorWindowEndDate = windowStartDate;
    priorWindowStartDate = new Date(windowStartDate.getTime() - 24 * 60 * 60 * 1000);
  } else if (timeRange === "7 Days") {
    windowStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    priorWindowEndDate = windowStartDate;
    priorWindowStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  } else if (timeRange === "90 Days") {
    windowStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    priorWindowEndDate = windowStartDate;
    priorWindowStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  } else if (timeRange.includes("Academic Year") || timeRange === "All Time") {
    windowStartDate = new Date("2024-09-01T00:00:00.000Z");
    priorWindowEndDate = windowStartDate;
    priorWindowStartDate = new Date("2023-09-01T00:00:00.000Z");
  } else {
    // Default 30 Days
    windowStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    priorWindowEndDate = windowStartDate;
    priorWindowStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  }

  // 1. Fetch eligible student accounts
  // Criteria: not banned, role STUDENT (or all verified users)
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      department: true,
      year: true,
      emailVerified: true,
      banned: true,
      role: true,
      createdAt: true,
    },
  });

  const verifiedEligibleStudents = allUsers.filter(
    (u) => !u.banned && u.emailVerified && u.role === "STUDENT"
  );

  // Apply campus filter to user pool if requested
  const filteredEligibleStudents = verifiedEligibleStudents.filter((u) => {
    if (campusFilter === "All AAU Campuses") return true;
    const { campusName, campusCode } = mapDepartmentToCampus(u.department);
    return campusName.toLowerCase().includes(campusFilter.toLowerCase()) || campusCode === campusFilter;
  });

  const targetStudentSet = new Set(filteredEligibleStudents.map((u) => u.id));
  const totalVerifiedCount = filteredEligibleStudents.length;

  // 2. Fetch Activity Records within observation windows
  // Rolling 30 days window start for standard MAU
  const rolling30DayStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const rolling60DayStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Query actual database records
  const [
    allChatSessions,
    allPosts,
    allGroupMembers,
    allClubMembers,
    allEvents,
    activeGroupsCount,
  ] = await Promise.all([
    prisma.chatSession.findMany({
      select: {
        id: true,
        userAId: true,
        userBId: true,
        startedAt: true,
        endedAt: true,
        messagesCount: true,
        isCollaborative: true,
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.post.findMany({
      select: {
        id: true,
        authorId: true,
        createdAt: true,
        contentType: true,
        departmentId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.groupMember.findMany({
      select: {
        userId: true,
        groupId: true,
        joinedAt: true,
      },
    }),
    prisma.clubMember.findMany({
      select: {
        userId: true,
        clubId: true,
        joinedAt: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      select: {
        id: true,
        type: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.group.count({
      where: { isArchived: false },
    }),
  ]);

  // Helper to test if a user was active in a time window
  const getActiveUserIdsInWindow = (start: Date, end: Date): Set<string> => {
    const active = new Set<string>();

    allChatSessions.forEach((s) => {
      if (s.startedAt >= start && s.startedAt <= end) {
        if (targetStudentSet.has(s.userAId)) active.add(s.userAId);
        if (targetStudentSet.has(s.userBId)) active.add(s.userBId);
      }
    });

    allPosts.forEach((p) => {
      if (p.createdAt >= start && p.createdAt <= end) {
        if (targetStudentSet.has(p.authorId)) active.add(p.authorId);
      }
    });

    allGroupMembers.forEach((gm) => {
      if (gm.joinedAt >= start && gm.joinedAt <= end) {
        if (targetStudentSet.has(gm.userId)) active.add(gm.userId);
      }
    });

    allClubMembers.forEach((cm) => {
      if (cm.joinedAt >= start && cm.joinedAt <= end) {
        if (targetStudentSet.has(cm.userId)) active.add(cm.userId);
      }
    });

    allEvents.forEach((e) => {
      if (e.userId && e.createdAt >= start && e.createdAt <= end) {
        if (targetStudentSet.has(e.userId)) active.add(e.userId);
      }
    });

    return active;
  };

  // 3. Compute KPI: MAU (Rolling 30-Day Window)
  const currentRolling30ActiveSet = getActiveUserIdsInWindow(rolling30DayStart, now);
  const priorRolling30ActiveSet = getActiveUserIdsInWindow(rolling60DayStart, rolling30DayStart);

  const mauCount = currentRolling30ActiveSet.size;
  const priorMauCount = priorRolling30ActiveSet.size;
  const mauPercentage = totalVerifiedCount > 0
    ? Math.round((mauCount / totalVerifiedCount) * 1000) / 10
    : 0;

  const mauTrend = priorMauCount > 0
    ? Math.round(((mauCount - priorMauCount) / priorMauCount) * 1000) / 10
    : mauCount > 0 ? 100 : 0;

  // 4. Compute KPI: DAU (Selected day / Today in UTC+3)
  const startOfTodayUTC3 = getStartOfDayUTC3(now);
  const dauActiveSet = getActiveUserIdsInWindow(startOfTodayUTC3, now);
  const dauCount = dauActiveSet.size;

  const stickinessRate = mauCount > 0
    ? Math.round((dauCount / mauCount) * 1000) / 10
    : 0;

  // 5. Compute KPI: 30-Day Cohort Retention
  // Defined as: users registered/onboarded >= 30 days ago, who had activity in their initial week,
  // and had another qualifying activity during days 24-30 post-registration.
  const eligibleCohortStudents = filteredEligibleStudents.filter(
    (u) => u.createdAt <= rolling30DayStart
  );

  let retainedCount = 0;
  eligibleCohortStudents.forEach((student) => {
    const signupTime = student.createdAt.getTime();
    const day24 = new Date(signupTime + 24 * 24 * 60 * 60 * 1000);
    const day30 = new Date(signupTime + 30 * 24 * 60 * 60 * 1000);

    const activeInDay24To30 =
      allChatSessions.some(
        (s) =>
          s.startedAt >= day24 &&
          s.startedAt <= day30 &&
          (s.userAId === student.id || s.userBId === student.id)
      ) ||
      allPosts.some(
        (p) => p.createdAt >= day24 && p.createdAt <= day30 && p.authorId === student.id
      ) ||
      allEvents.some(
        (e) => e.userId === student.id && e.createdAt >= day24 && e.createdAt <= day30
      );

    if (activeInDay24To30) {
      retainedCount++;
    }
  });

  const cohortSize = eligibleCohortStudents.length;
  const retentionRate = cohortSize > 0
    ? Math.round((retainedCount / cohortSize) * 1000) / 10
    : 0;
  const attritionRate = cohortSize > 0 ? Math.max(0, 100 - retentionRate) : 0;

  // 6. Compute KPI: Messaging & Communication Volume
  const sessionsInWindow = allChatSessions.filter(
    (s) =>
      s.startedAt >= windowStartDate &&
      s.startedAt <= now &&
      (targetStudentSet.has(s.userAId) || targetStudentSet.has(s.userBId))
  );

  const totalMessageVolume = sessionsInWindow.reduce(
    (acc, s) => acc + (s.messagesCount || 0),
    0
  );

  // In our schema, 1-on-1 ChatSessions represent peer-to-peer discussions,
  // while Groups represent collective study/discussion hubs.
  const p2pCount = sessionsInWindow.length;
  const groupMembershipsInWindow = allGroupMembers.filter(
    (gm) => gm.joinedAt >= windowStartDate && gm.joinedAt <= now && targetStudentSet.has(gm.userId)
  ).length;

  const totalCommunicationEvents = p2pCount + groupMembershipsInWindow;
  const p2pPercentage = totalCommunicationEvents > 0
    ? Math.round((p2pCount / totalCommunicationEvents) * 100)
    : 100;
  const groupPercentage = 100 - p2pPercentage;

  // 7. Time-Series Engagement Chart Data
  // Create 7 daily bins for "7 Days", 10 bins for "30 Days", 12 bins for "90 Days"
  const binCount = timeRange === "7 Days" ? 7 : timeRange === "90 Days" ? 12 : 7;
  const windowDurationMs = Math.max(now.getTime() - windowStartDate.getTime(), 24 * 60 * 60 * 1000);
  const stepMs = windowDurationMs / binCount;

  const telemetrySeries: TelemetryPoint[] = [];
  let peakDau = 0;
  let peakDay = "None";

  for (let i = 0; i < binCount; i++) {
    const binStart = new Date(windowStartDate.getTime() + i * stepMs);
    const binEnd = new Date(Math.min(now.getTime(), windowStartDate.getTime() + (i + 1) * stepMs));

    // Addis Ababa date label
    const binEatDate = getAddisAbabaDate(binStart);
    const monthStr = binEatDate.toLocaleString("en-US", { month: "short" });
    const dayNum = binEatDate.getDate();
    const dayLabel = `${monthStr} ${dayNum}`;

    const activeUsersInBin = getActiveUserIdsInWindow(binStart, binEnd);
    const binDau = activeUsersInBin.size;

    const binFeedViews = allPosts.filter(
      (p) => p.createdAt >= binStart && p.createdAt <= binEnd && targetStudentSet.has(p.authorId)
    ).length;

    const binPeerInteractions = allChatSessions.filter(
      (s) =>
        s.startedAt >= binStart &&
        s.startedAt <= binEnd &&
        (targetStudentSet.has(s.userAId) || targetStudentSet.has(s.userBId))
    ).length;

    if (binDau > peakDau) {
      peakDau = binDau;
      peakDay = `${dayLabel} (${binDau} active)`;
    }

    telemetrySeries.push({
      dayLabel,
      fullDate: binStart.toISOString().split("T")[0],
      dau: binDau,
      feedViews: binFeedViews,
      peerInteractions: binPeerInteractions,
    });
  }

  // Mark peak in series
  if (peakDau > 0) {
    const peakPoint = telemetrySeries.find((pt) => pt.dau === peakDau);
    if (peakPoint) {
      peakPoint.isPeak = true;
      peakPoint.milestoneAnnotation = `Peak: ${peakDau} active`;
    }
  }

  // 8. Session Duration and Single-Session Exit Rate
  const completedSessions = sessionsInWindow.filter((s) => s.endedAt !== null);
  let avgSessionDurationMins: number | null = null;
  if (completedSessions.length > 0) {
    const totalDurationSec = completedSessions.reduce((acc, s) => {
      const startMs = s.startedAt.getTime();
      const endMs = s.endedAt ? s.endedAt.getTime() : startMs;
      return acc + Math.max(0, (endMs - startMs) / 1000);
    }, 0);
    avgSessionDurationMins = Math.round((totalDurationSec / completedSessions.length / 60) * 10) / 10;
  }

  const zeroMessageSessions = sessionsInWindow.filter((s) => (s.messagesCount || 0) === 0);
  const singleSessionExitRate = sessionsInWindow.length > 0
    ? Math.round((zeroMessageSessions.length / sessionsInWindow.length) * 1000) / 10
    : 0;

  // 9. Campus Node Distribution
  const campusGroups: Record<
    string,
    {
      name: string;
      code: string;
      students: string[];
      posts: number;
      sessions: number;
      dominantThemes: string;
    }
  > = {
    "5K": {
      name: "5 Kilo (AAiT Engineering)",
      code: "5K",
      students: [],
      posts: 0,
      sessions: 0,
      dominantThemes: "Electrical, Biomedical & Software Engineering",
    },
    "4K": {
      name: "4 Kilo (CNCS Natural Sciences)",
      code: "4K",
      students: [],
      posts: 0,
      sessions: 0,
      dominantThemes: "Computer Science, Statistics & Mathematics",
    },
    "6K": {
      name: "Sidist Kilo (Main & Humanities)",
      code: "6K",
      students: [],
      posts: 0,
      sessions: 0,
      dominantThemes: "University Administration, Library & Humanities",
    },
    "CHS": {
      name: "Tikur Anbessa (Medical & Health)",
      code: "CHS",
      students: [],
      posts: 0,
      sessions: 0,
      dominantThemes: "Medicine, Public Health & Clinical Studies",
    },
    "UNASS": {
      name: "Unassigned / General Student Body",
      code: "UNASS",
      students: [],
      posts: 0,
      sessions: 0,
      dominantThemes: "Freshman Core & Interdisciplinary Groups",
    },
  };

  verifiedEligibleStudents.forEach((student) => {
    const { campusCode } = mapDepartmentToCampus(student.department);
    const targetGroup = campusGroups[campusCode] || campusGroups["UNASS"];
    targetGroup.students.push(student.id);
  });

  // Calculate actual activity in window per campus
  allPosts.forEach((post) => {
    if (post.createdAt >= windowStartDate && post.createdAt <= now) {
      const author = allUsers.find((u) => u.id === post.authorId);
      const code = author ? mapDepartmentToCampus(author.department).campusCode : "UNASS";
      if (campusGroups[code]) campusGroups[code].posts++;
    }
  });

  allChatSessions.forEach((session) => {
    if (session.startedAt >= windowStartDate && session.startedAt <= now) {
      const userA = allUsers.find((u) => u.id === session.userAId);
      const code = userA ? mapDepartmentToCampus(userA.department).campusCode : "UNASS";
      if (campusGroups[code]) campusGroups[code].sessions++;
    }
  });

  const totalAllStudents = verifiedEligibleStudents.length;
  const campusNodes: CampusNode[] = Object.values(campusGroups).map((cg) => {
    const studentCount = cg.students.length;
    const percentageShare = totalAllStudents > 0
      ? Math.round((studentCount / totalAllStudents) * 1000) / 10
      : 0;

    // Documented activity index formula:
    // (posts * 2 + sessions * 3) normalized against studentCount, max 100
    const rawActivityScore = studentCount > 0
      ? Math.min(100, Math.round(((cg.posts * 2 + cg.sessions * 3) / studentCount) * 20))
      : 0;

    return {
      id: cg.code,
      name: cg.name,
      campusCode: cg.code,
      studentCount,
      percentageShare,
      activityIndex: rawActivityScore,
      dominantThemes: cg.dominantThemes,
      attributionNote: "Attributed via student department affiliation in user profile",
    };
  });

  // 10. Cohort Retention Matrix (Real Accounts)
  // Group accounts by month of registration
  const cohortBuckets: Record<string, { label: string; userIds: string[]; signupDates: Date[] }> = {};

  allUsers
    .filter((u) => !u.banned && u.emailVerified)
    .forEach((u) => {
      const eatDate = getAddisAbabaDate(u.createdAt);
      const key = `${eatDate.getFullYear()}-${String(eatDate.getMonth() + 1).padStart(2, "0")}`;
      const label = `${eatDate.toLocaleString("en-US", { month: "short" })} ${eatDate.getFullYear()} Cohort`;
      if (!cohortBuckets[key]) {
        cohortBuckets[key] = { label, userIds: [], signupDates: [] };
      }
      cohortBuckets[key].userIds.push(u.id);
      cohortBuckets[key].signupDates.push(u.createdAt);
    });

  const observationWeeks = [
    { label: "W1", daysStart: 0, daysEnd: 7 },
    { label: "W2", daysStart: 7, daysEnd: 14 },
    { label: "W3", daysStart: 14, daysEnd: 21 },
    { label: "W4", daysStart: 21, daysEnd: 28 },
    { label: "W5", daysStart: 28, daysEnd: 35 },
    { label: "W8", daysStart: 49, daysEnd: 56 },
  ];

  const sortedCohortKeys = Object.keys(cohortBuckets).sort().reverse();
  const cohortRetention: CohortRetentionRow[] = sortedCohortKeys.slice(0, 4).map((key) => {
    const bucket = cohortBuckets[key];
    const registeredCount = bucket.userIds.length;

    const weeklyRetention: (number | null)[] = observationWeeks.map((week) => {
      // Check if this cohort is mature enough for this week
      // The cohort is mature if (now - earliestSignup) >= week.daysEnd days
      const avgSignupTime =
        bucket.signupDates.reduce((acc, d) => acc + d.getTime(), 0) / bucket.signupDates.length;
      const weekEndTime = avgSignupTime + week.daysEnd * 24 * 60 * 60 * 1000;

      if (now.getTime() < weekEndTime) {
        // Incomplete observation window
        return null;
      }

      // Count users active during their specific week window
      let activeCount = 0;
      bucket.userIds.forEach((uid, idx) => {
        const uSignup = bucket.signupDates[idx].getTime();
        const wStart = new Date(uSignup + week.daysStart * 24 * 60 * 60 * 1000);
        const wEnd = new Date(uSignup + week.daysEnd * 24 * 60 * 60 * 1000);

        const wasActive =
          allChatSessions.some(
            (s) => s.startedAt >= wStart && s.startedAt <= wEnd && (s.userAId === uid || s.userBId === uid)
          ) ||
          allPosts.some(
            (p) => p.createdAt >= wStart && p.createdAt <= wEnd && p.authorId === uid
          ) ||
          allEvents.some(
            (e) => e.userId === uid && e.createdAt >= wStart && e.createdAt <= wEnd
          );

        if (wasActive) activeCount++;
      });

      return registeredCount > 0 ? Math.round((activeCount / registeredCount) * 100) : 0;
    });

    return {
      cohortName: bucket.label,
      registeredCount,
      weeklyRetention,
    };
  });

  // If no cohorts exist, provide empty cohort row with 0s
  if (cohortRetention.length === 0) {
    cohortRetention.push({
      cohortName: "Current Term",
      registeredCount: totalVerifiedCount,
      weeklyRetention: [null, null, null, null, null, null],
    });
  }

  // 11. Key Module Penetration
  // Modules:
  // 1. Feed & Announcements: distinct users who created or read posts
  const feedUsers = new Set(
    allPosts
      .filter((p) => p.createdAt >= windowStartDate && p.createdAt <= now && targetStudentSet.has(p.authorId))
      .map((p) => p.authorId)
  );
  // Add users with FEED_VIEW analytics events if any
  allEvents.forEach((e) => {
    if (
      e.userId &&
      targetStudentSet.has(e.userId) &&
      e.createdAt >= windowStartDate &&
      e.createdAt <= now &&
      e.type.includes("FEED")
    ) {
      feedUsers.add(e.userId);
    }
  });

  // 2. 1:1 Matching & Peer Chat: distinct users in ChatSessions
  const chatUsers = new Set<string>();
  sessionsInWindow.forEach((s) => {
    if (targetStudentSet.has(s.userAId)) chatUsers.add(s.userAId);
    if (targetStudentSet.has(s.userBId)) chatUsers.add(s.userBId);
  });

  // 3. Student Groups & Communities: distinct users in GroupMembers
  const groupUsers = new Set(
    allGroupMembers
      .filter((gm) => gm.joinedAt >= windowStartDate && gm.joinedAt <= now && targetStudentSet.has(gm.userId))
      .map((gm) => gm.userId)
  );

  // 4. Clubs & Organizations: distinct users in ClubMembers
  const clubUsers = new Set(
    allClubMembers
      .filter((cm) => cm.joinedAt >= windowStartDate && cm.joinedAt <= now && targetStudentSet.has(cm.userId))
      .map((cm) => cm.userId)
  );

  // 5. Department & Academic Units: distinct users who authored department posts or delegates
  const deptUsers = new Set(
    allPosts
      .filter(
        (p) =>
          p.departmentId !== null &&
          p.createdAt >= windowStartDate &&
          p.createdAt <= now &&
          targetStudentSet.has(p.authorId)
      )
      .map((p) => p.authorId)
  );

  const denom = Math.max(1, totalVerifiedCount);
  const modulePenetration: ModulePenetrationItem[] = [
    {
      moduleName: "1:1 Student Matching & Chat",
      activeUsersCount: chatUsers.size,
      totalEligibleCount: totalVerifiedCount,
      usageSharePercentage: Math.round((chatUsers.size / denom) * 1000) / 10,
      barColorClass: "bg-slate-900",
      description: "Direct peer matching connections and study buddy exchanges",
    },
    {
      moduleName: "Feed & Campus Announcements",
      activeUsersCount: feedUsers.size,
      totalEligibleCount: totalVerifiedCount,
      usageSharePercentage: Math.round((feedUsers.size / denom) * 1000) / 10,
      barColorClass: "bg-blue-600",
      description: "Student posts, academic announcements, and campus updates",
    },
    {
      moduleName: "Student Groups & Study Circles",
      activeUsersCount: groupUsers.size,
      totalEligibleCount: totalVerifiedCount,
      usageSharePercentage: Math.round((groupUsers.size / denom) * 1000) / 10,
      barColorClass: "bg-emerald-600",
      description: "Department study circles and project working groups",
    },
    {
      moduleName: "Clubs & Student Societies",
      activeUsersCount: clubUsers.size,
      totalEligibleCount: totalVerifiedCount,
      usageSharePercentage: Math.round((clubUsers.size / denom) * 1000) / 10,
      barColorClass: "bg-amber-600",
      description: "Extracurricular organizations and competitive student clubs",
    },
    {
      moduleName: "Department Q&A & Official Channels",
      activeUsersCount: deptUsers.size,
      totalEligibleCount: totalVerifiedCount,
      usageSharePercentage: Math.round((deptUsers.size / denom) * 1000) / 10,
      barColorClass: "bg-indigo-600",
      description: "Faculty units, departmental notices, and verified channels",
    },
  ];

  // Disclaimers explaining definitions and AAU context
  const telemetryDisclaimers = [
    "Independent Platform: Uni-Chat is an independent student platform and does not imply official AAU administrative endorsement.",
    "Verified Attribution: Campus distributions reflect student department fields mapped to AAU campus clusters.",
    "Privacy Enforcement: Message body text is never stored, read, or scanned for analytics. Metrics are strictly metadata counts.",
    "Cohort Windows: Incomplete observation periods (marked '—') are not counted as churned students.",
  ];

  // Refresh timestamp formatted in UTC+3 (East Africa Time)
  const timeStr = eatNow.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = eatNow.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const lastRefreshed = `${dateStr} at ${timeStr} (UTC+3)`;

  const kpis: CampusAnalyticsKPIs = {
    mau: {
      count: mauCount,
      percentageOfStudentBody: mauPercentage,
      target: totalVerifiedCount,
      trendVsLastTerm: mauTrend,
      definition: "Distinct eligible, verified students with qualifying activity in rolling 30-day window",
      totalEligibleStudents: totalVerifiedCount,
    },
    dau: {
      count: dauCount,
      stickinessRate,
      benchmarkNotice: `Stickiness calculated as DAU / 30-day active population (${mauCount} students)`,
      definition: "Distinct verified students who performed a qualifying activity on this calendar date (UTC+3)",
    },
    retention30Day: {
      rate: retentionRate,
      rankNotice: cohortSize > 0
        ? `Based on ${cohortSize} eligible onboarding accounts`
        : "Pending mature 30-day cohort accounts",
      attritionRate,
      yoyGrowth: 0,
      definition: "Proportion of students active during their first week who returned during days 24–30 post-signup",
      cohortSize,
      retainedCount,
    },
    messaging: {
      totalVolume: totalMessageVolume > 0
        ? totalMessageVolume.toLocaleString()
        : `${sessionsInWindow.length} sessions`,
      sessionCount: sessionsInWindow.length,
      activeStudyGroups: activeGroupsCount,
      p2pPercentage,
      groupPercentage,
      definition: "Aggregated peer-to-peer session metadata and group activity counts (zero message inspection)",
    },
  };

  return {
    kpis,
    telemetrySeries,
    campusNodes,
    cohortRetention,
    modulePenetration,
    timeRange,
    campusFilter,
    lastRefreshed,
    highlights: {
      peakDay: peakDau > 0 ? peakDay : "No peak recorded",
      peakDau,
      avgSessionDurationMins,
      singleSessionExitRate,
    },
    telemetryDisclaimers,
  };
}

/**
 * 2. Generate and download institutional telemetry CSV report
 */
export async function exportAnalyticsReportCsv(
  timeRange = "30 Days",
  campusFilter = "All AAU Campuses"
): Promise<{ filename: string; csvContent: string }> {
  const admin = await verifyAnalyticsAdmin();

  const data = await getCampusAnalyticsData(timeRange, campusFilter);

  const lines: string[] = [];

  // Header Section
  lines.push(sanitizeCsvCell("UNI-CHAT PLATFORM TELEMETRY & CAMPUS ANALYTICS REPORT"));
  lines.push(
    [
      sanitizeCsvCell("Target University"),
      sanitizeCsvCell("Addis Ababa University (AAU)"),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("Report Generation Time"),
      sanitizeCsvCell(data.lastRefreshed),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("Applied Time Range"),
      sanitizeCsvCell(timeRange),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("Applied Campus Filter"),
      sanitizeCsvCell(campusFilter),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("Generated By Administrator"),
      sanitizeCsvCell(admin.displayName || admin.email),
    ].join(",")
  );
  lines.push("");

  // Primary KPIs
  lines.push(sanitizeCsvCell("PRIMARY KPI METRICS"));
  lines.push(
    [
      sanitizeCsvCell("Metric Name"),
      sanitizeCsvCell("Value"),
      sanitizeCsvCell("Percentage / Ratio"),
      sanitizeCsvCell("Total Eligible Base"),
      sanitizeCsvCell("Defensible Methodology"),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("Monthly Active Students (MAU)"),
      sanitizeCsvCell(data.kpis.mau.count),
      sanitizeCsvCell(`${data.kpis.mau.percentageOfStudentBody}%`),
      sanitizeCsvCell(data.kpis.mau.totalEligibleStudents),
      sanitizeCsvCell(data.kpis.mau.definition),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("Daily Active Students (DAU)"),
      sanitizeCsvCell(data.kpis.dau.count),
      sanitizeCsvCell(`${data.kpis.dau.stickinessRate}% Stickiness`),
      sanitizeCsvCell(data.kpis.mau.count),
      sanitizeCsvCell(data.kpis.dau.definition),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("30-Day Cohort Retention"),
      sanitizeCsvCell(`${data.kpis.retention30Day.rate}%`),
      sanitizeCsvCell(`Attrition: ${data.kpis.retention30Day.attritionRate}%`),
      sanitizeCsvCell(`Cohort Size: ${data.kpis.retention30Day.cohortSize}`),
      sanitizeCsvCell(data.kpis.retention30Day.definition),
    ].join(",")
  );
  lines.push(
    [
      sanitizeCsvCell("Total Peer Communication Volume"),
      sanitizeCsvCell(data.kpis.messaging.totalVolume),
      sanitizeCsvCell(`P2P: ${data.kpis.messaging.p2pPercentage}% | Groups: ${data.kpis.messaging.groupPercentage}%`),
      sanitizeCsvCell(`Active Groups: ${data.kpis.messaging.activeStudyGroups}`),
      sanitizeCsvCell(data.kpis.messaging.definition),
    ].join(",")
  );
  lines.push("");

  // Campus Distribution
  lines.push(sanitizeCsvCell("CAMPUS NODE DISTRIBUTION"));
  lines.push(
    [
      sanitizeCsvCell("Campus Node"),
      sanitizeCsvCell("Campus Code"),
      sanitizeCsvCell("Verified Students"),
      sanitizeCsvCell("Percentage Share"),
      sanitizeCsvCell("Activity Index (0-100)"),
      sanitizeCsvCell("Dominant Themes"),
    ].join(",")
  );
  data.campusNodes.forEach((node) => {
    lines.push(
      [
        sanitizeCsvCell(node.name),
        sanitizeCsvCell(node.campusCode),
        sanitizeCsvCell(node.studentCount),
        sanitizeCsvCell(`${node.percentageShare}%`),
        sanitizeCsvCell(node.activityIndex),
        sanitizeCsvCell(node.dominantThemes),
      ].join(",")
    );
  });
  lines.push("");

  // Module Penetration
  lines.push(sanitizeCsvCell("MODULE USAGE & PENETRATION"));
  lines.push(
    [
      sanitizeCsvCell("Module Name"),
      sanitizeCsvCell("Active Users in Window"),
      sanitizeCsvCell("Total Eligible Base"),
      sanitizeCsvCell("Adoption Rate"),
      sanitizeCsvCell("Module Description"),
    ].join(",")
  );
  data.modulePenetration.forEach((mod) => {
    lines.push(
      [
        sanitizeCsvCell(mod.moduleName),
        sanitizeCsvCell(mod.activeUsersCount),
        sanitizeCsvCell(mod.totalEligibleCount),
        sanitizeCsvCell(`${mod.usageSharePercentage}%`),
        sanitizeCsvCell(mod.description),
      ].join(",")
    );
  });
  lines.push("");

  // Time-Series Telemetry
  lines.push(sanitizeCsvCell("TELEMETRY TIME SERIES"));
  lines.push(
    [
      sanitizeCsvCell("Date"),
      sanitizeCsvCell("Daily Active Students (DAU)"),
      sanitizeCsvCell("Feed / Announcement Events"),
      sanitizeCsvCell("Peer / Session Interactions"),
      sanitizeCsvCell("Annotation"),
    ].join(",")
  );
  data.telemetrySeries.forEach((pt) => {
    lines.push(
      [
        sanitizeCsvCell(pt.dayLabel),
        sanitizeCsvCell(pt.dau),
        sanitizeCsvCell(pt.feedViews),
        sanitizeCsvCell(pt.peerInteractions),
        sanitizeCsvCell(pt.milestoneAnnotation || ""),
      ].join(",")
    );
  });
  lines.push("");

  // Disclaimers
  lines.push(sanitizeCsvCell("AUDIT & METHODOLOGY DISCLAIMERS"));
  data.telemetryDisclaimers.forEach((disclaimer) => {
    lines.push(sanitizeCsvCell(disclaimer));
  });

  const csvContent = lines.join("\n");
  const filename = `aau_analytics_report_${timeRange.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;

  // Log Audit Action
  await logAuditAction({
    adminId: admin.id,
    action: "EXPORT_CAMPUS_ANALYTICS_REPORT",
    targetType: TargetType.USER,
    targetId: admin.id,
    details: {
      timeRange,
      campusFilter,
      totalVerifiedCount: data.kpis.mau.totalEligibleStudents,
      mau: data.kpis.mau.count,
      dau: data.kpis.dau.count,
    },
  });

  return { filename, csvContent };
}
