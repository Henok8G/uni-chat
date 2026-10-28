"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import {
  PostReadyStatus,
  ModerationActionType,
  TargetType,
  UserRole
} from "@prisma/client";
import { applyModerationAction, createNotification } from "./backendActions";

export interface StudentRecordView {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  studentId: string;
  email: string;
  dept: string;
  campus: string;
  year: string;
  academicStanding: string;
  verified: boolean;
  warningCount: number;
  banned: boolean;
  restrictedUntil: Date | null;
  role: string;
  postReadyStatus: PostReadyStatus;
  joinedDate: string;
  postReadyApp?: {
    id: string;
    queueNumber: string;
    submittedAgo: string;
    submittedAt: string;
    motivation: string;
    sampleLink?: string | null;
    notes?: string | null;
    status: PostReadyStatus;
    endorsedBy: string;
    endorsedRole: string;
  };
  metrics: {
    clubs: number;
    created: number;
    matches: number;
    flags: number;
  };
  groups: string[];
  deviceNode: string;
  deviceSingleLogin: boolean;
  moderationHistory: {
    id: string;
    actionType: string;
    reason: string;
    notes?: string | null;
    createdAt: string;
    adminName: string;
  }[];
}

export interface StudentDirectoryResult {
  students: StudentRecordView[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  tabCounts: {
    all: number;
    postReady: number;
    restricted: number;
    faculty: number;
  };
}

export interface GetStudentDirectoryParams {
  page?: number;
  pageSize?: number;
  tab?: "ALL" | "POST_READY" | "RESTRICTED" | "FACULTY";
  search?: string;
  department?: string;
  year?: string;
  status?: string;
  sortBy?: "recent" | "oldest" | "name" | "post_ready";
}

function deriveInitials(displayName: string | null, email: string): string {
  if (displayName && displayName.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function deriveStudentId(email: string, universityId: string | null): string {
  if (universityId) return universityId;
  const match = email.match(/(ugr[_-]\d+[_-]\d+)/i);
  if (match) {
    return match[1].toUpperCase().replace(/[_-]/g, "/");
  }
  return "Not provided";
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export async function getStudentDirectory(
  params: GetStudentDirectoryParams = {}
): Promise<StudentDirectoryResult> {
  await requireAdminPermission("MANAGE_USERS");

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
  const skip = (page - 1) * pageSize;
  const tab = params.tab || "ALL";
  const search = params.search?.trim();
  const department = params.department;
  const year = params.year;
  const status = params.status;
  const sortBy = params.sortBy || "recent";

  // Build Prisma Where Clause
  const where: any = {};

  // Tab Filtering
  if (tab === "POST_READY") {
    where.postReadyStatus = { in: [PostReadyStatus.PENDING, PostReadyStatus.UNDER_REVIEW] };
  } else if (tab === "RESTRICTED") {
    where.OR = [
      { banned: true },
      { warningCount: { gt: 0 } },
      { restrictedUntil: { gte: new Date() } }
    ];
  } else if (tab === "FACULTY") {
    where.role = { not: UserRole.STUDENT };
  } else {
    // "ALL" tab defaults to students
    where.role = UserRole.STUDENT;
  }

  // Search Filter (by displayName or email)
  if (search) {
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  // Department Filter
  if (department && department !== "All Departments" && department !== "All AAU Departments") {
    where.AND = where.AND || [];
    where.AND.push({
      department: { contains: department, mode: "insensitive" }
    });
  }

  // Year Filter
  if (year && year !== "All Academic Years") {
    const yearNum = parseInt(year.replace(/\D/g, ""), 10);
    if (!isNaN(yearNum)) {
      where.AND = where.AND || [];
      where.AND.push({ year: yearNum });
    }
  }

  // Status Filter
  if (status && status !== "All" && status !== "All Statuses") {
    where.AND = where.AND || [];
    if (status.includes("Post-Ready Applicant") || status === "Pending") {
      where.AND.push({ postReadyStatus: PostReadyStatus.PENDING });
    } else if (status.includes("Approved") || status === "Post-Ready Publisher") {
      where.AND.push({ postReadyStatus: PostReadyStatus.APPROVED });
    } else if (status.includes("Verified Standard") || status === "Verified") {
      where.AND.push({ emailVerified: true });
    } else if (status.includes("Unverified")) {
      where.AND.push({ emailVerified: false });
    } else if (status.includes("Restricted") || status.includes("Suspended")) {
      where.AND.push({
        OR: [
          { banned: true },
          { restrictedUntil: { gte: new Date() } }
        ]
      });
    }
  }

  // Order By
  let orderBy: any = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "name") {
    orderBy = { displayName: "asc" };
  } else if (sortBy === "post_ready") {
    orderBy = [{ postReadyAppliedAt: "desc" }, { createdAt: "desc" }];
  }

  const now = new Date();

  // Execute Parallel Queries
  const [
    users,
    totalCount,
    allCount,
    postReadyCount,
    restrictedCount,
    facultyCount
  ] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        university: { select: { name: true, domain: true } },
        groupMemberships: {
          take: 3,
          include: { group: { select: { name: true } } }
        },
        deviceLogs: {
          take: 1,
          orderBy: { createdAt: "desc" }
        },
        postReadyApplications: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            reviewedBy: { select: { displayName: true, email: true } }
          }
        },
        moderationActionsReceived: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            admin: { select: { displayName: true, email: true } }
          }
        },
        _count: {
          select: {
            clubMemberships: true,
            ownedGroups: true,
            sessionsA: true,
            sessionsB: true,
            reportsReceived: true
          }
        }
      }
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: UserRole.STUDENT } }),
    prisma.user.count({
      where: { postReadyStatus: { in: [PostReadyStatus.PENDING, PostReadyStatus.UNDER_REVIEW] } }
    }),
    prisma.user.count({
      where: {
        OR: [
          { banned: true },
          { warningCount: { gt: 0 } },
          { restrictedUntil: { gte: now } }
        ]
      }
    }),
    prisma.user.count({ where: { role: { not: UserRole.STUDENT } } })
  ]);

  const students: StudentRecordView[] = users.map((u) => {
    const handle = `@${u.email.split("@")[0]}`;
    const name = u.displayName || u.email.split("@")[0];
    const avatar = deriveInitials(u.displayName, u.email);
    const studentId = deriveStudentId(u.email, u.universityId);
    const dept = u.department || "Not provided";
    const campus = u.university?.name || (u.email.endsWith("@aau.edu.et") ? "AAU Main" : "Not provided");
    const yearStr = u.year ? `Year ${u.year}` : "Not provided";
    const academicStanding = u.emailVerified
      ? `Verified · ${u.year ? `Year ${u.year}` : "Regular Scholar"}`
      : "Pending Email Verification";

    const latestApp = u.postReadyApplications[0];
    let postReadyApp = undefined;
    if (latestApp) {
      postReadyApp = {
        id: latestApp.id,
        queueNumber: `#${latestApp.id.slice(-4).toUpperCase()}`,
        submittedAgo: formatTimeAgo(latestApp.createdAt),
        submittedAt: latestApp.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        }),
        motivation: latestApp.reason || "Student applied for official post-ready publication clearance.",
        sampleLink: latestApp.sampleLink,
        notes: latestApp.notes,
        status: latestApp.status,
        endorsedBy: latestApp.reviewedBy?.displayName || latestApp.reviewedBy?.email || "Editorial Review Queue",
        endorsedRole: "Admin Reviewer"
      };
    }

    const deviceLog = u.deviceLogs[0];
    const deviceNode = deviceLog
      ? `IP: ${deviceLog.ipAddress}`
      : "Standard Session Security";

    return {
      id: u.id,
      name,
      handle,
      avatar,
      studentId,
      email: u.email,
      dept,
      campus,
      year: yearStr,
      academicStanding,
      verified: u.emailVerified,
      warningCount: u.warningCount,
      banned: u.banned,
      restrictedUntil: u.restrictedUntil,
      role: u.role,
      postReadyStatus: u.postReadyStatus,
      joinedDate: u.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      postReadyApp,
      metrics: {
        clubs: u._count.clubMemberships,
        created: u._count.ownedGroups,
        matches: u._count.sessionsA + u._count.sessionsB,
        flags: u._count.reportsReceived
      },
      groups: u.groupMemberships.map((gm) => gm.group.name),
      deviceNode,
      deviceSingleLogin: true,
      moderationHistory: u.moderationActionsReceived.map((m) => ({
        id: m.id,
        actionType: m.actionType,
        reason: m.reason,
        notes: m.notes,
        createdAt: formatTimeAgo(m.createdAt),
        adminName: m.admin.displayName || m.admin.email
      }))
    };
  });

  return {
    students,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    currentPage: page,
    tabCounts: {
      all: allCount,
      postReady: postReadyCount,
      restricted: restrictedCount,
      faculty: facultyCount
    }
  };
}

export async function reviewStudentPostReady(
  applicationId: string,
  userId: string,
  action: "APPROVE" | "REJECT" | "REQUEST_INFO",
  notes?: string
) {
  const admin = await requireAdminPermission("REVIEW_POST_READY");

  let newStatus: PostReadyStatus = PostReadyStatus.APPROVED;
  if (action === "REJECT") {
    newStatus = PostReadyStatus.REJECTED;
  } else if (action === "REQUEST_INFO") {
    newStatus = PostReadyStatus.MORE_INFO_REQUESTED;
  }

  // Update PostReadyApplication
  const updatedApp = await prisma.postReadyApplication.update({
    where: { id: applicationId },
    data: {
      status: newStatus,
      notes,
      reviewedById: admin.id,
      reviewedAt: new Date()
    }
  });

  // Update User
  await prisma.user.update({
    where: { id: userId },
    data: {
      postReadyStatus: newStatus,
      postReadyReviewedAt: new Date(),
      postReadyReviewedBy: admin.id,
      postReadyNotes: notes
    }
  });

  // Send Notification
  await createNotification({
    userId,
    type: "POST_READY_APPROVAL",
    title:
      action === "APPROVE"
        ? "Post-Ready Access Approved!"
        : action === "REJECT"
        ? "Post-Ready Application Update"
        : "Additional Information Requested",
    message:
      action === "APPROVE"
        ? "Congratulations! You have been granted Post-Ready publisher status."
        : action === "REJECT"
        ? `Your Post-Ready application was rejected: ${notes || "Does not meet editorial guidelines."}`
        : `Admin requested more details: ${notes || "Please provide supporting documentation."}`,
    isUrgent: action === "REQUEST_INFO"
  });

  // Audit Log
  await logAuditAction({
    adminId: admin.id,
    action: `POST_READY_${action}`,
    targetType: TargetType.USER,
    targetId: userId,
    details: { applicationId, action, notes }
  });

  return { success: true, newStatus, updatedApp };
}

export async function moderateStudentUser(params: {
  userId: string;
  actionType: ModerationActionType;
  reason: string;
  durationDays?: number;
  notes?: string;
}) {
  await requireAdminPermission("MODERATE_REPORTS");

  const action = await applyModerationAction({
    userId: params.userId,
    actionType: params.actionType,
    reason: params.reason,
    notes: params.notes,
    durationDays: params.durationDays
  });

  return { success: true, action };
}

export async function exportStudentRegistryCSV(
  params: GetStudentDirectoryParams = {}
): Promise<string> {
  const admin = await requireAdminPermission("MANAGE_USERS");

  const tab = params.tab || "ALL";
  const search = params.search?.trim();
  const department = params.department;
  const year = params.year;
  const status = params.status;

  const where: any = {};
  if (tab === "POST_READY") {
    where.postReadyStatus = { in: [PostReadyStatus.PENDING, PostReadyStatus.UNDER_REVIEW] };
  } else if (tab === "RESTRICTED") {
    where.OR = [
      { banned: true },
      { warningCount: { gt: 0 } },
      { restrictedUntil: { gte: new Date() } }
    ];
  } else if (tab === "FACULTY") {
    where.role = { not: UserRole.STUDENT };
  } else {
    where.role = UserRole.STUDENT;
  }

  if (search) {
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  if (department && department !== "All Departments" && department !== "All AAU Departments") {
    where.AND = where.AND || [];
    where.AND.push({
      department: { contains: department, mode: "insensitive" }
    });
  }

  if (year && year !== "All Academic Years") {
    const yearNum = parseInt(year.replace(/\D/g, ""), 10);
    if (!isNaN(yearNum)) {
      where.AND = where.AND || [];
      where.AND.push({ year: yearNum });
    }
  }

  if (status && status !== "All" && status !== "All Statuses") {
    where.AND = where.AND || [];
    if (status.includes("Post-Ready Applicant") || status === "Pending") {
      where.AND.push({ postReadyStatus: PostReadyStatus.PENDING });
    } else if (status.includes("Approved")) {
      where.AND.push({ postReadyStatus: PostReadyStatus.APPROVED });
    } else if (status.includes("Verified Standard") || status === "Verified") {
      where.AND.push({ emailVerified: true });
    } else if (status.includes("Unverified")) {
      where.AND.push({ emailVerified: false });
    } else if (status.includes("Restricted") || status.includes("Suspended")) {
      where.AND.push({
        OR: [{ banned: true }, { restrictedUntil: { gte: new Date() } }]
      });
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      displayName: true,
      email: true,
      emailVerified: true,
      role: true,
      department: true,
      year: true,
      postReadyStatus: true,
      warningCount: true,
      banned: true,
      restrictedUntil: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 1000 // bounded export
  });

  // Audit Log
  await logAuditAction({
    adminId: admin.id,
    action: "EXPORT_STUDENT_REGISTRY",
    targetType: TargetType.USER,
    details: { count: users.length, filters: params }
  });

  // Convert to CSV
  const headers = [
    "User ID",
    "Display Name",
    "Email",
    "Email Verified",
    "Role",
    "Department",
    "Academic Year",
    "Post-Ready Status",
    "Warnings",
    "Banned",
    "Restricted Until",
    "Joined Date"
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = users.map((u) => [
    escapeCsv(u.id),
    escapeCsv(u.displayName || ""),
    escapeCsv(u.email),
    escapeCsv(u.emailVerified ? "YES" : "NO"),
    escapeCsv(u.role),
    escapeCsv(u.department || "Not provided"),
    escapeCsv(u.year ? `Year ${u.year}` : "Not provided"),
    escapeCsv(u.postReadyStatus),
    escapeCsv(u.warningCount),
    escapeCsv(u.banned ? "YES" : "NO"),
    escapeCsv(u.restrictedUntil ? u.restrictedUntil.toISOString() : ""),
    escapeCsv(u.createdAt.toISOString())
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
