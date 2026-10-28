"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import {
  ClubStatus,
  ClubMemberRole,
  TargetType,
} from "@prisma/client";
import { createNotification } from "./backendActions";

export interface ClubSummaryDTO {
  id: string;
  name: string;
  category: string;
  charterId: string;
  campus: string;
  leadStudent: { name: string; studentId: string; email: string };
  activeMembers: number;
  activityRate: number;
  status: "Official Verified" | "Probationary" | "Suspended";
  isRestricted: boolean;
  auditNotice?: string;
  postsCount: number;
  description: string;
  createdAt: string;
}

export interface CharterApplicationDTO {
  docketId: string;
  id: string;
  clubName: string;
  department: string;
  campusHub: string;
  status: "Pending Clearance" | "Under Review" | "Needs Clarification";
  scopeMission: string;
  signatoriesCount: number;
  submittedAgo: string;
  submitterName: string;
  submitterDept: string;
  submitterYear: string;
  proposedHub: string;
  strikesLogged: number;
  warningNotice?: string;
  executiveBoard: Array<{
    name: string;
    role: string;
    studentId: string;
    verified: boolean;
    dept?: string;
  }>;
  facultyAdvisor: {
    name: string;
    title: string;
    endorsementStatus: boolean;
    endorsementNote: string;
  };
  createdAt: string;
}

export interface ClubMetricsDTO {
  totalRecognizedClubs: number;
  newClubsThisSem: number;
  collegiateZones: number;
  complianceRate: number;
  pendingCharters: number;
  oldestPendingDays: number;
  avgReviewDays: number;
  studentParticipation: number;
  verifiedParticipationRate: number;
  totalStudents: number;
  probationCount: number;
  suspendedCount: number;
  annualAuditClear: boolean;
}

export interface ClubsDashboardData {
  metrics: ClubMetricsDTO;
  applications: CharterApplicationDTO[];
  clubs: ClubSummaryDTO[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return `Applied ${Math.max(1, diffHours)}h ago`;
  if (diffDays === 1) return "Applied yesterday";
  return `Applied ${diffDays}d ago`;
}

/**
 * Fetch all clubs management data for SCREEN_22.
 */
export async function getClubsManagementData(): Promise<ClubsDashboardData> {
  await requireAdminPermission("MANAGE_CLUBS");

  const now = new Date();
  const semesterStart = new Date();
  semesterStart.setDate(semesterStart.getDate() - 120);

  // Concurrently execute core aggregation queries
  const [
    totalRecognizedClubs,
    newClubsThisSem,
    pendingCharters,
    probationCount,
    suspendedCount,
    totalStudents,
    uniqueMembers,
    rawPendingClubs,
    rawApprovedClubs,
  ] = await Promise.all([
    // 1. Total recognized (approved) clubs
    prisma.club.count({
      where: { status: ClubStatus.APPROVED },
    }),
    // 2. New approved clubs this semester
    prisma.club.count({
      where: {
        status: ClubStatus.APPROVED,
        createdAt: { gte: semesterStart },
      },
    }),
    // 3. Pending charter applications
    prisma.club.count({
      where: { status: ClubStatus.PENDING },
    }),
    // 4. Clubs with restricted status (probationary)
    prisma.club.count({
      where: { isRestricted: true },
    }),
    // 5. Clubs with suspended status
    prisma.club.count({
      where: { status: ClubStatus.SUSPENDED },
    }),
    // 6. Total student count
    prisma.user.count({
      where: { role: "STUDENT" },
    }),
    // 7. Unique student membership in approved clubs
    prisma.clubMember.findMany({
      where: {
        club: { status: ClubStatus.APPROVED },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    // 8. Pending applications list with applicant and initial members
    prisma.club.findMany({
      where: { status: ClubStatus.PENDING },
      include: {
        applicant: {
          select: {
            id: true,
            displayName: true,
            email: true,
            department: true,
            university: { select: { name: true } },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                department: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // 9. Approved / Recognized directory list
    prisma.club.findMany({
      where: {
        status: { in: [ClubStatus.APPROVED, ClubStatus.SUSPENDED] },
      },
      include: {
        applicant: {
          select: {
            id: true,
            displayName: true,
            email: true,
            department: true,
            university: { select: { name: true } },
          },
        },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Compute oldest pending days
  let oldestPendingDays = 0;
  if (rawPendingClubs.length > 0) {
    const oldestDate = rawPendingClubs[rawPendingClubs.length - 1].createdAt;
    oldestPendingDays = Math.max(0, Math.floor((now.getTime() - oldestDate.getTime()) / 86400000));
  }

  // Calculate participation rate
  const studentParticipation = uniqueMembers.length;
  const verifiedParticipationRate = totalStudents > 0
    ? Math.round((studentParticipation / totalStudents) * 100)
    : 0;

  // Compliance rate (percentage of clubs with zero restrictions/suspensions)
  const totalClubsAll = totalRecognizedClubs + suspendedCount;
  const complianceRate = totalClubsAll > 0
    ? Math.round(((totalClubsAll - probationCount - suspendedCount) / totalClubsAll) * 100)
    : 100;

  const metrics: ClubMetricsDTO = {
    totalRecognizedClubs,
    newClubsThisSem,
    collegiateZones: 6, // 6 core AAU campus hubs
    complianceRate,
    pendingCharters,
    oldestPendingDays,
    avgReviewDays: 2.5,
    studentParticipation,
    verifiedParticipationRate,
    totalStudents,
    probationCount,
    suspendedCount,
    annualAuditClear: probationCount === 0 && suspendedCount === 0,
  };

  // Map pending applications
  const applications: CharterApplicationDTO[] = rawPendingClubs.map((club) => {
    const applicantName = club.applicant?.displayName || club.applicant?.email?.split("@")[0] || "Student Submitter";
    const applicantDept = club.applicant?.department || "AAU Regular";
    const campus = club.applicant?.university?.name || "AAU Main Campus";

    let status: CharterApplicationDTO["status"] = "Pending Clearance";
    if (club.rejectReason?.startsWith("Revision requested:")) {
      status = "Needs Clarification";
    } else if (club.reviewedById) {
      status = "Under Review";
    }

    const executiveBoard = club.members.map((m) => ({
      name: m.user.displayName || m.user.email?.split("@")[0] || "Executive Member",
      role: m.role === "OWNER" ? "President" : m.role === "ADMIN" ? "Vice President" : "Board Member",
      studentId: `UGR/${m.user.id.slice(-4).toUpperCase()}/14`,
      verified: true,
      dept: m.user.department || applicantDept,
    }));

    if (executiveBoard.length === 0) {
      executiveBoard.push({
        name: applicantName,
        role: "President",
        studentId: `UGR/${club.applicant.id.slice(-4).toUpperCase()}/14`,
        verified: true,
        dept: applicantDept,
      });
    }

    return {
      docketId: `#CH-${club.id.slice(-6).toUpperCase()}`,
      id: club.id,
      clubName: club.name,
      department: applicantDept,
      campusHub: campus,
      status,
      scopeMission: club.description || "Student-led initiative fostering university extracurricular engagement.",
      signatoriesCount: Math.max(1, club._count.members),
      submittedAgo: formatRelativeTime(club.createdAt),
      submitterName: applicantName,
      submitterDept: applicantDept,
      submitterYear: "Undergraduate",
      proposedHub: campus,
      strikesLogged: 0,
      warningNotice: club.rejectReason || undefined,
      executiveBoard,
      facultyAdvisor: {
        name: "Department Faculty Advisor",
        title: `${applicantDept} Faculty Coordinator`,
        endorsementStatus: false,
        endorsementNote: "Self-sponsored student charter",
      },
      createdAt: club.createdAt.toISOString(),
    };
  });

  // Map recognized clubs
  const clubs: ClubSummaryDTO[] = rawApprovedClubs.map((club) => {
    const leadName = club.applicant?.displayName || club.applicant?.email?.split("@")[0] || "Assigned Lead";
    const campus = club.applicant?.university?.name || club.applicant?.department || "AAU Main Campus";

    let displayStatus: ClubSummaryDTO["status"] = "Official Verified";
    if (club.status === ClubStatus.SUSPENDED) {
      displayStatus = "Suspended";
    } else if (club.isRestricted) {
      displayStatus = "Probationary";
    }

    return {
      id: club.id,
      name: club.name,
      category: club.category || "Academic & Tech",
      charterId: `ID: #CLB-${club.id.slice(-4).toUpperCase()}`,
      campus,
      leadStudent: {
        name: leadName,
        studentId: `UGR/${club.applicant.id.slice(-4).toUpperCase()}/14`,
        email: club.applicant.email,
      },
      activeMembers: club._count.members,
      activityRate: 90,
      status: displayStatus,
      isRestricted: club.isRestricted,
      auditNotice: club.isRestricted ? "Administrative restriction active" : undefined,
      postsCount: club._count.posts,
      description: club.description,
      createdAt: club.createdAt.toISOString(),
    };
  });

  return { metrics, applications, clubs };
}

/**
 * Review a club charter application (Approve, Request Revisions, Reject).
 */
export async function reviewClubApplicationAction(
  clubId: string,
  action: "APPROVE" | "REQUEST_REVISIONS" | "REJECT",
  reason?: string
) {
  const admin = await requireAdminPermission("MANAGE_CLUBS");

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { applicant: true },
  });
  if (!club) throw new Error("Club application not found");

  if (action === "APPROVE") {
    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        status: ClubStatus.APPROVED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: null,
      },
    });

    // Ensure applicant is added as OWNER in ClubMember if not present
    await prisma.clubMember.upsert({
      where: {
        clubId_userId: { clubId, userId: club.applicantId },
      },
      create: {
        clubId,
        userId: club.applicantId,
        role: ClubMemberRole.OWNER,
      },
      update: {
        role: ClubMemberRole.OWNER,
      },
    });

    // Send notification
    await createNotification({
      userId: club.applicantId,
      type: "CLUB_APPROVAL",
      title: "Club Charter Approved!",
      message: `Congratulations! Your club "${club.name}" has been officially granted a charter on Uni-Chat.`,
    });

    await logAuditAction({
      adminId: admin.id,
      action: "APPROVE_CLUB",
      targetType: TargetType.CLUB,
      targetId: clubId,
      details: { clubName: club.name },
    });

    return updated;
  } else if (action === "REQUEST_REVISIONS") {
    const revisionNote = reason?.trim() || "Please provide additional details on club bylaws and membership.";
    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        status: ClubStatus.PENDING,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: `Revision requested: ${revisionNote}`,
      },
    });

    // Send notification
    await createNotification({
      userId: club.applicantId,
      type: "SYSTEM",
      title: "Revisions Requested for Club Charter",
      message: `Your charter application for "${club.name}" requires revisions: ${revisionNote}`,
    });

    await logAuditAction({
      adminId: admin.id,
      action: "REQUEST_CLUB_REVISIONS",
      targetType: TargetType.CLUB,
      targetId: clubId,
      details: { clubName: club.name, revisionNote },
    });

    return updated;
  } else {
    // REJECT
    const rejectReason = reason?.trim() || "Charter application does not meet student organization requirements.";
    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        status: ClubStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason,
      },
    });

    // Send notification
    await createNotification({
      userId: club.applicantId,
      type: "SYSTEM",
      title: "Club Charter Not Approved",
      message: `Your charter application for "${club.name}" was rejected. Reason: ${rejectReason}`,
    });

    await logAuditAction({
      adminId: admin.id,
      action: "REJECT_CLUB",
      targetType: TargetType.CLUB,
      targetId: clubId,
      details: { clubName: club.name, rejectReason },
    });

    return updated;
  }
}

/**
 * Toggle administrative restriction on a club.
 */
export async function toggleClubRestrictionAction(
  clubId: string,
  isRestricted: boolean,
  reason?: string
) {
  const admin = await requireAdminPermission("MANAGE_CLUBS");

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new Error("Club not found");

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: {
      isRestricted,
      rejectReason: isRestricted ? (reason || "Administrative restriction applied") : null,
    },
  });

  await createNotification({
    userId: club.applicantId,
    type: "MODERATION",
    title: isRestricted ? "Club Administrative Restriction" : "Club Restriction Lifted",
    message: isRestricted
      ? `Your club "${club.name}" has been placed under administrative restriction: ${reason || "Policy compliance review."}`
      : `The administrative restriction on your club "${club.name}" has been lifted.`,
  });

  await logAuditAction({
    adminId: admin.id,
    action: isRestricted ? "RESTRICT_CLUB" : "UNRESTRICT_CLUB",
    targetType: TargetType.CLUB,
    targetId: clubId,
    details: { clubName: club.name, reason },
  });

  return updated;
}

/**
 * Update club governance status (e.g. SUSPENDED vs APPROVED).
 */
export async function updateClubStatusAction(
  clubId: string,
  newStatus: "APPROVED" | "SUSPENDED" | "REJECTED",
  reason?: string
) {
  const admin = await requireAdminPermission("MANAGE_CLUBS");

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new Error("Club not found");

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: {
      status: newStatus as ClubStatus,
      rejectReason: newStatus === "SUSPENDED" || newStatus === "REJECTED" ? (reason || null) : null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: `CLUB_STATUS_${newStatus}`,
    targetType: TargetType.CLUB,
    targetId: clubId,
    details: { clubName: club.name, newStatus, reason },
  });

  return updated;
}

/**
 * Directly register an official recognized organization into Uni-Chat.
 */
export async function registerOfficialClubAction(data: {
  name: string;
  description: string;
  category?: string;
  campus?: string;
  leadStudentEmail?: string;
}) {
  const admin = await requireAdminPermission("MANAGE_CLUBS");

  if (!data.name?.trim()) throw new Error("Organization name is required");
  if (!data.description?.trim()) throw new Error("Organization description is required");

  // Determine owner user
  let ownerUserId = admin.id;
  if (data.leadStudentEmail?.trim()) {
    const student = await prisma.user.findUnique({
      where: { email: data.leadStudentEmail.trim().toLowerCase() },
    });
    if (student) {
      ownerUserId = student.id;
    }
  }

  const club = await prisma.club.create({
    data: {
      name: data.name.trim(),
      description: data.description.trim(),
      category: data.category || "Academic & Tech",
      status: ClubStatus.APPROVED,
      applicantId: ownerUserId,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      isRestricted: false,
    },
  });

  // Create initial owner membership
  await prisma.clubMember.create({
    data: {
      clubId: club.id,
      userId: ownerUserId,
      role: ClubMemberRole.OWNER,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "CREATE_OFFICIAL_CLUB",
    targetType: TargetType.CLUB,
    targetId: club.id,
    details: { name: club.name, category: club.category },
  });

  return club;
}

/**
 * Generate a clean CSV export of the recognized club registry.
 */
export async function exportClubRegistryCsvAction() {
  const admin = await requireAdminPermission("MANAGE_CLUBS");

  const clubs = await prisma.club.findMany({
    include: {
      applicant: { select: { displayName: true, email: true, department: true } },
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Club ID",
    "Name",
    "Category",
    "Status",
    "Restricted",
    "Lead Student",
    "Lead Email",
    "Department",
    "Active Members",
    "Published Posts",
    "Registered Date",
  ];

  const rows = clubs.map((c) => [
    `CLB-${c.id.slice(-6).toUpperCase()}`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${(c.category || "General").replace(/"/g, '""')}"`,
    c.status,
    c.isRestricted ? "YES" : "NO",
    `"${(c.applicant?.displayName || "Student").replace(/"/g, '""')}"`,
    c.applicant?.email || "",
    `"${(c.applicant?.department || "").replace(/"/g, '""')}"`,
    c._count.members,
    c._count.posts,
    c.createdAt.toISOString().split("T")[0],
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  await logAuditAction({
    adminId: admin.id,
    action: "EXPORT_CLUB_REGISTRY",
    targetType: TargetType.CLUB,
    details: { totalRows: clubs.length },
  });

  return csvContent;
}
