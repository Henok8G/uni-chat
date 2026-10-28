"use server";

import { prisma as basePrisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import {
  DepartmentCategory,
  DepartmentStatus,
  TargetType,
  NotificationType,
  AuthorType,
  PostStatus,
} from "@prisma/client";
import {
  DepartmentsDashboardData,
  EntityDetail,
  EntityMetrics,
  CreateDepartmentDTO,
  AssignDelegateDTO,
} from "./departments/types";

// Dynamic Proxy ensures any stale global.prisma instances in memory are automatically refreshed
const prisma = new Proxy({} as typeof basePrisma, {
  get(_target, prop) {
    if (basePrisma && (basePrisma as any).department) {
      return (basePrisma as any)[prop];
    }
    const { PrismaClient } = require("@prisma/client");
    const fresh = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    if (typeof global !== "undefined") {
      (global as any).prisma = fresh;
    }
    return (fresh as any)[prop];
  },
});

/**
 * Format relative time (e.g. "Just now", "2h ago", "Yesterday", "Oct 12")
 */
function formatTimeAgo(date: Date | null | undefined): string {
  if (!date) return "Recently";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Ensures initial default AAU departments exist if the table is currently empty.
 */
async function ensureSeedDepartments() {
  if (!prisma.department) return;
  const count = await prisma.department.count();
  if (count > 0) return;

  const defaultDepts = [
    {
      name: "Department of Computer Science",
      code: "AAU-CS",
      category: DepartmentCategory.ACADEMIC,
      campus: "4 Kilo Campus",
      collegeAffiliation: "College of Natural & Computational Sciences (CNCS)",
      description: "Center of excellence in computing, algorithms, software engineering, and artificial intelligence at AAU.",
      foundingYear: 1993,
      iconType: "code",
      status: DepartmentStatus.ACTIVE,
      isVerified: true,
      verificationProvenance: "Verified Platform Record · AAU Academic Senate",
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: false,
      studentDirectQA: true,
    },
    {
      name: "Department of Electrical & Computer Engineering",
      code: "AAU-ECE",
      category: DepartmentCategory.ACADEMIC,
      campus: "5 Kilo Campus",
      collegeAffiliation: "Addis Ababa Institute of Technology (AAiT)",
      description: "Premier engineering unit training telecommunications, power, and embedded systems professionals.",
      foundingYear: 1963,
      iconType: "cpu",
      status: DepartmentStatus.ACTIVE,
      isVerified: true,
      verificationProvenance: "Verified Platform Record · AAiT Faculty Board",
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: false,
      studentDirectQA: true,
    },
    {
      name: "Office of the University Registrar",
      code: "AAU-REG",
      category: DepartmentCategory.ADMIN,
      campus: "Sidist Kilo (Main)",
      collegeAffiliation: "Central University Administration",
      description: "Oversees academic admissions, student records, course registration schedules, and graduation clearances.",
      foundingYear: 1950,
      iconType: "document",
      status: DepartmentStatus.ACTIVE,
      isVerified: true,
      verificationProvenance: "Verified Platform Record · AAU Executive Secretariat",
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: true,
      studentDirectQA: false,
    },
    {
      name: "School of Medicine & Health Sciences",
      code: "AAU-MED",
      category: DepartmentCategory.ACADEMIC,
      campus: "Tikur Anbessa (Health)",
      collegeAffiliation: "College of Health Sciences (CHS)",
      description: "Largest clinical training hospital and biomedical faculty in Ethiopia, established at Tikur Anbessa.",
      foundingYear: 1964,
      iconType: "health",
      status: DepartmentStatus.ACTIVE,
      isVerified: true,
      verificationProvenance: "Verified Platform Record · CHS Council",
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: false,
      studentDirectQA: true,
    },
    {
      name: "University Library System & Archives",
      code: "AAU-LIB",
      category: DepartmentCategory.ADMIN,
      campus: "Sidist Kilo (Main)",
      collegeAffiliation: "AAU Academic Affairs & Research Directorate",
      description: "Coordinates John F. Kennedy Memorial Library, branch libraries across all campuses, and digital research repositories.",
      foundingYear: 1950,
      iconType: "library",
      status: DepartmentStatus.ACTIVE,
      isVerified: true,
      verificationProvenance: "Verified Platform Record · AAU Library Directorate",
      emergencyBroadcasts: false,
      pinnedFeedNoPreMod: false,
      studentDirectQA: false,
    },
  ];

  for (const d of defaultDepts) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }
}

/**
 * 1. Fetch live department dashboard data for SCREEN_18.
 */
export async function getDepartmentsManagementData(): Promise<DepartmentsDashboardData> {
  // Permission check: requires MANAGE_DEPARTMENTS or MANAGE_CONTENT
  await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    await requireAdminPermission("MANAGE_CONTENT");
  });

  // Ensure initial seed departments exist
  await ensureSeedDepartments();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Parallel database queries
  const [
    totalEntities,
    academicDeptsCount,
    adminOfficesCount,
    activeDelegatesCount,
    officialBroadcastsCount,
    departments,
    facultyUsersCount,
  ] = await Promise.all([
    // 1. Total entities
    prisma.department.count(),
    // 2. Academic depts count
    prisma.department.count({ where: { category: DepartmentCategory.ACADEMIC } }),
    // 3. Admin offices count
    prisma.department.count({ where: { category: DepartmentCategory.ADMIN } }),
    // 4. Active delegates count
    prisma.departmentDelegate.count({ where: { status: "ACTIVE" } }),
    // 5. Official broadcasts this month
    prisma.post.count({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { gte: thirtyDaysAgo },
        OR: [
          { departmentId: { not: null } },
          { authorType: AuthorType.DEPARTMENT },
        ],
      },
    }),
    // 6. Detailed departments with relations
    prisma.department.findMany({
      include: {
        delegates: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
        posts: {
          where: { status: PostStatus.PUBLISHED },
          include: {
            author: {
              select: {
                displayName: true,
                email: true,
              },
            },
          },
          orderBy: { publishedAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    }),
    // 7. Verified faculty users in platform
    prisma.user.count({
      where: {
        OR: [
          { emailVerified: true, departmentDelegates: { some: { status: "ACTIVE" } } },
          { adminRoleAssignments: { some: {} } },
        ],
      },
    }),
  ]);

  // Transform each department into EntityDetail
  const entities: EntityDetail[] = await Promise.all(
    departments.map(async (dept) => {
      // Estimate student enrollment from real user profiles matching this department name
      const enrolledCount = await prisma.user.count({
        where: {
          role: "STUDENT",
          department: {
            contains: dept.name.replace(/Department of |Office of the |School of /gi, "").trim(),
            mode: "insensitive",
          },
        },
      });

      const activeDelegates = dept.delegates.filter((d) => d.status === "ACTIVE");
      const primaryDelegate = activeDelegates[0]?.user?.displayName || activeDelegates[0]?.user?.email?.split("@")[0];

      const latestPost = dept.posts[0];
      const lastAnnouncement = latestPost
        ? {
            title: latestPost.title,
            timeAgo: formatTimeAgo(latestPost.publishedAt),
          }
        : {
            title: "No broadcasts published yet",
            timeAgo: "N/A",
          };

      // Map delegates
      const authorizedDelegates = activeDelegates.map((d) => {
        const name = d.user?.displayName || d.user?.email?.split("@")[0] || "Delegate";
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return {
          id: d.id,
          userId: d.userId,
          name,
          email: d.user?.email,
          role: d.role,
          badge: d.badge as any,
          avatarInitials: initials || "DL",
          status: d.status as any,
          canPublish: d.canPublish,
          canEmergencyBroadcast: d.canEmergencyBroadcast,
          canBypassModeration: d.canBypassModeration,
          assignedAt: d.assignedAt.toISOString(),
        };
      });

      // Map real broadcast history
      const broadcastHistory = dept.posts.map((p) => ({
        id: p.id,
        title: p.title,
        readRate: "Active Broadcast",
        publishedAt: formatTimeAgo(p.publishedAt),
        publishedBy: p.author?.displayName || p.author?.email?.split("@")[0] || "Official Author",
      }));

      // Status chip determination
      let statusStr: EntityDetail["status"] = "Platform Record";
      if (dept.status === DepartmentStatus.INACTIVE) {
        statusStr = "Inactive · Suspended";
      } else if (dept.status === DepartmentStatus.PENDING_VERIFICATION) {
        statusStr = "Pending Verification";
      } else if (dept.isVerified && dept.pinnedFeedNoPreMod) {
        statusStr = "Direct Feed Authority";
      } else if (dept.category === DepartmentCategory.ADMIN) {
        statusStr = "Active · Service Unit";
      } else if (dept.category === DepartmentCategory.GOVERNANCE) {
        statusStr = "Governance Unit";
      } else if (dept.status === DepartmentStatus.ACTIVE) {
        statusStr = "Active & Publishing Enabled";
      }

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        campus: dept.campus,
        category: (dept.category === "GOVERNANCE" ? "ADMIN" : dept.category) as any,
        collegeAffiliation: dept.collegeAffiliation || "Affiliated AAU Collegiate Network",
        description: dept.description || undefined,
        status: statusStr,
        isVerified: dept.isVerified,
        verificationProvenance: dept.verificationProvenance || undefined,
        studentsEnrolled: enrolledCount > 0 ? enrolledCount : undefined,
        verifiedFacultyCount: dept.category === DepartmentCategory.ACADEMIC ? (activeDelegates.length || 1) : undefined,
        delegatesCount: activeDelegates.length,
        primaryDelegateName: primaryDelegate,
        lastAnnouncement,
        iconType: (dept.iconType as any) || "building",
        foundingYear: dept.foundingYear || 2024,
        sisSyncStatus: "Not configured · Platform record",
        authorizedDelegates,
        clearances: {
          emergencyBroadcasts: dept.emergencyBroadcasts,
          pinnedFeedNoPreMod: dept.pinnedFeedNoPreMod,
          studentDirectQA: dept.studentDirectQA,
        },
        broadcastHistory,
      };
    })
  );

  const metrics: EntityMetrics = {
    registeredEntities: totalEntities,
    academicDepts: academicDeptsCount,
    adminOffices: adminOfficesCount,
    verifiedFaculty: facultyUsersCount,
    sisValidationRate: 0,
    sisStatusText: "Not connected / Not configured",
    authorizedDelegates: activeDelegatesCount,
    officialBroadcasts: officialBroadcastsCount,
    averageStudentReach: 0,
  };

  const availableCampuses = [
    "All Campuses (5 Campuses)",
    "4 Kilo Campus",
    "5 Kilo Campus",
    "Sidist Kilo (Main)",
    "Tikur Anbessa (Health)",
    "Commerce (FBE)",
  ];

  return {
    metrics,
    entities,
    availableCampuses,
  };
}

/**
 * 2. Provision / Register a new institutional entity in Uni-Chat.
 */
export async function createDepartmentEntity(data: CreateDepartmentDTO) {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  if (!data.name || !data.name.trim()) {
    throw new Error("Entity name is required");
  }

  // Generate or sanitize code
  let cleanCode = (data.code || "").trim().toUpperCase();
  if (!cleanCode) {
    const initials = data.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 5)
      .toUpperCase();
    cleanCode = `AAU-${initials || "DEPT"}-${Math.floor(100 + Math.random() * 900)}`;
  }

  // Check unique code
  const existing = await prisma.department.findUnique({
    where: { code: cleanCode },
  });
  if (existing) {
    throw new Error(`An institutional entity with code '${cleanCode}' already exists.`);
  }

  // Determine iconType by name/category
  let icon = "building";
  const lowerName = data.name.toLowerCase();
  if (lowerName.includes("computer") || lowerName.includes("software")) icon = "code";
  else if (lowerName.includes("electrical") || lowerName.includes("tech") || lowerName.includes("engineering")) icon = "cpu";
  else if (lowerName.includes("health") || lowerName.includes("medicine") || lowerName.includes("clinic")) icon = "health";
  else if (lowerName.includes("library") || lowerName.includes("archive")) icon = "library";
  else if (lowerName.includes("registrar") || lowerName.includes("admin") || lowerName.includes("office")) icon = "document";

  const created = await prisma.department.create({
    data: {
      name: data.name.trim(),
      code: cleanCode,
      category: data.category === "ADMIN" ? DepartmentCategory.ADMIN : DepartmentCategory.ACADEMIC,
      campus: data.campus || "4 Kilo Campus",
      collegeAffiliation: data.collegeAffiliation?.trim() || null,
      description: data.description?.trim() || null,
      foundingYear: data.foundingYear || new Date().getFullYear(),
      iconType: icon,
      status: DepartmentStatus.ACTIVE,
      isVerified: false,
      verificationProvenance: "Managed in Uni-Chat · Platform Record",
      emergencyBroadcasts: false,
      pinnedFeedNoPreMod: false,
      studentDirectQA: true,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "CREATE_DEPARTMENT_ENTITY",
    targetType: TargetType.DEPARTMENT,
    targetId: created.id,
    details: {
      name: created.name,
      code: created.code,
      campus: created.campus,
      category: created.category,
    },
  });

  return created;
}

/**
 * 3. Update department details.
 */
export async function updateDepartmentEntity(
  id: string,
  data: Partial<CreateDepartmentDTO> & { isVerified?: boolean; verificationProvenance?: string }
) {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new Error("Entity not found");

  const updatePayload: any = {};
  if (data.name) updatePayload.name = data.name.trim();
  if (data.campus) updatePayload.campus = data.campus.trim();
  if (data.collegeAffiliation !== undefined) updatePayload.collegeAffiliation = data.collegeAffiliation?.trim() || null;
  if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
  if (data.category) {
    updatePayload.category = data.category === "ADMIN" ? DepartmentCategory.ADMIN : DepartmentCategory.ACADEMIC;
  }
  if (data.isVerified !== undefined) {
    updatePayload.isVerified = data.isVerified;
    if (data.isVerified) {
      updatePayload.verifiedById = admin.id;
      updatePayload.verifiedAt = new Date();
      updatePayload.verificationProvenance = data.verificationProvenance || "Administrator Recorded Verification";
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: updatePayload,
  });

  await logAuditAction({
    adminId: admin.id,
    action: "UPDATE_DEPARTMENT_ENTITY",
    targetType: TargetType.DEPARTMENT,
    targetId: id,
    details: updatePayload,
  });

  return updated;
}

/**
 * 4. Toggle department publishing clearance.
 */
export async function toggleDepartmentClearance(
  id: string,
  key: "emergencyBroadcasts" | "pinnedFeedNoPreMod" | "studentDirectQA"
) {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new Error("Entity not found");

  const newValue = !existing[key];
  const updated = await prisma.department.update({
    where: { id },
    data: { [key]: newValue },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "TOGGLE_DEPARTMENT_CLEARANCE",
    targetType: TargetType.DEPARTMENT,
    targetId: id,
    details: { clearance: key, previous: existing[key], updated: newValue },
  });

  return updated;
}

/**
 * 5. Deactivate an institutional entity.
 */
export async function deactivateDepartmentEntity(id: string) {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new Error("Entity not found");

  const newStatus = existing.status === DepartmentStatus.INACTIVE ? DepartmentStatus.ACTIVE : DepartmentStatus.INACTIVE;

  const updated = await prisma.department.update({
    where: { id },
    data: { status: newStatus },
  });

  await logAuditAction({
    adminId: admin.id,
    action: newStatus === DepartmentStatus.INACTIVE ? "DEACTIVATE_DEPARTMENT" : "REACTIVATE_DEPARTMENT",
    targetType: TargetType.DEPARTMENT,
    targetId: id,
    details: { entityName: existing.name, newStatus },
  });

  return updated;
}

/**
 * 6. Assign or authorize a real platform user as a department delegate.
 */
export async function assignDepartmentDelegate(
  departmentId: string,
  data: AssignDelegateDTO
) {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new Error("Department not found");

  // Lookup target user by ID or Email
  let targetUser = null;
  if (data.userId) {
    targetUser = await prisma.user.findUnique({ where: { id: data.userId } });
  } else if (data.userEmail) {
    targetUser = await prisma.user.findUnique({ where: { email: data.userEmail.trim().toLowerCase() } });
  }

  if (!targetUser) {
    throw new Error(
      `User '${data.userEmail || data.userId}' not found. Only existing Uni-Chat accounts can be assigned as delegates.`
    );
  }

  // Create or update delegate assignment
  const delegate = await prisma.departmentDelegate.upsert({
    where: {
      departmentId_userId: {
        departmentId,
        userId: targetUser.id,
      },
    },
    create: {
      departmentId,
      userId: targetUser.id,
      role: data.role || "Faculty Member",
      badge: data.badge || "Announce",
      canPublish: true,
      canEmergencyBroadcast: Boolean(data.canEmergencyBroadcast),
      canBypassModeration: Boolean(data.canBypassModeration),
      status: "ACTIVE",
      assignedById: admin.id,
    },
    update: {
      role: data.role || "Faculty Member",
      badge: data.badge || "Announce",
      canPublish: true,
      canEmergencyBroadcast: Boolean(data.canEmergencyBroadcast),
      canBypassModeration: Boolean(data.canBypassModeration),
      status: "ACTIVE",
      assignedById: admin.id,
    },
  });

  // Notify the user in Uni-Chat
  await prisma.notification.create({
    data: {
      userId: targetUser.id,
      type: NotificationType.SYSTEM,
      title: "Designated Institutional Delegate",
      message: `You have been authorized as a publishing delegate for ${department.name} with ${data.badge} clearance.`,
      link: "/home",
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "ASSIGN_DEPARTMENT_DELEGATE",
    targetType: TargetType.DEPARTMENT,
    targetId: departmentId,
    details: {
      assignedUserId: targetUser.id,
      userEmail: targetUser.email,
      role: data.role,
      badge: data.badge,
    },
  });

  return delegate;
}

/**
 * 7. Revoke or remove an active delegate.
 */
export async function revokeDepartmentDelegate(departmentId: string, delegateId: string) {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  const delegate = await prisma.departmentDelegate.findUnique({
    where: { id: delegateId },
    include: { department: true, user: true },
  });
  if (!delegate || delegate.departmentId !== departmentId) {
    throw new Error("Delegate assignment not found");
  }

  await prisma.departmentDelegate.update({
    where: { id: delegateId },
    data: { status: "REVOKED" },
  });

  // Notify affected user
  await prisma.notification.create({
    data: {
      userId: delegate.userId,
      type: NotificationType.SYSTEM,
      title: "Publishing Delegate Revoked",
      message: `Your publishing delegate role for ${delegate.department.name} has been revoked by campus administration.`,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "REVOKE_DEPARTMENT_DELEGATE",
    targetType: TargetType.DEPARTMENT,
    targetId: departmentId,
    details: {
      revokedDelegateId: delegateId,
      userId: delegate.userId,
      userEmail: delegate.user.email,
    },
  });

  return { success: true };
}

/**
 * 8. Search users to pick an eligible delegate.
 */
export async function searchEligibleUsers(query: string) {
  await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase();
  const users = await prisma.user.findMany({
    where: {
      banned: false,
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      department: true,
    },
    take: 8,
  });

  return users;
}

/**
 * 9. Export Department Directory as secure CSV.
 */
export async function exportDepartmentDirectoryCsv() {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  const departments = await prisma.department.findMany({
    include: {
      delegates: {
        where: { status: "ACTIVE" },
        include: { user: { select: { displayName: true, email: true } } },
      },
      _count: { select: { posts: true } },
    },
    orderBy: { name: "asc" },
  });

  // Clean formula injection and escape fields
  const sanitize = (val: any) => {
    if (val === null || val === undefined) return "";
    let str = String(val).replace(/"/g, '""');
    if (/^[=+\-@]/.test(str)) str = "'" + str;
    return `"${str}"`;
  };

  const headers = [
    "Entity Name",
    "Code",
    "Category",
    "Campus",
    "Collegiate Affiliation",
    "Platform Status",
    "Verified In Uni-Chat",
    "Verification Provenance",
    "Active Delegates Count",
    "Primary Delegate",
    "Total Broadcasts",
    "Founding Year",
    "Created Date",
  ];

  const rows = departments.map((d) => {
    const primary = d.delegates[0]?.user?.displayName || d.delegates[0]?.user?.email || "None";
    return [
      sanitize(d.name),
      sanitize(d.code),
      sanitize(d.category),
      sanitize(d.campus),
      sanitize(d.collegeAffiliation || "N/A"),
      sanitize(d.status),
      sanitize(d.isVerified ? "YES" : "NO"),
      sanitize(d.verificationProvenance || "Managed in Uni-Chat"),
      sanitize(d.delegates.length),
      sanitize(primary),
      sanitize(d._count.posts),
      sanitize(d.foundingYear || "N/A"),
      sanitize(d.createdAt.toISOString().split("T")[0]),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  await logAuditAction({
    adminId: admin.id,
    action: "EXPORT_DEPARTMENT_DIRECTORY_CSV",
    targetType: TargetType.DEPARTMENT,
    details: { totalRows: departments.length },
  });

  return {
    filename: `AAU_Departments_Directory_${new Date().toISOString().split("T")[0]}.csv`,
    content: csvContent,
  };
}

/**
 * 10. Administrator-Managed CSV Roster Import.
 */
export async function importDepartmentRosterCsv(csvText: string) {
  const admin = await requireAdminPermission("MANAGE_DEPARTMENTS").catch(async () => {
    return requireAdminPermission("MANAGE_CONTENT");
  });

  if (!csvText || !csvText.trim()) {
    throw new Error("CSV file content is empty");
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV must include a header line and at least one data row");
  }

  const rows = lines.slice(1);
  let importedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const line = rows[i];
    // Simple CSV parser supporting quotes
    const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const name = cols[0];
    const code = cols[1];
    const category = cols[2];
    const campus = cols[3];
    const collegeAffiliation = cols[4];

    if (!name) {
      errors.push(`Row ${i + 2}: Missing entity name`);
      continue;
    }

    const cleanCode = code ? code.toUpperCase() : `AAU-IMP-${Math.floor(100 + Math.random() * 900)}`;

    try {
      await prisma.department.upsert({
        where: { code: cleanCode },
        update: {
          name,
          campus: campus || "4 Kilo Campus",
          collegeAffiliation: collegeAffiliation || undefined,
        },
        create: {
          name,
          code: cleanCode,
          category: category?.toUpperCase() === "ADMIN" ? DepartmentCategory.ADMIN : DepartmentCategory.ACADEMIC,
          campus: campus || "4 Kilo Campus",
          collegeAffiliation: collegeAffiliation || null,
          status: DepartmentStatus.ACTIVE,
          isVerified: false,
          verificationProvenance: "Imported via Administrator Roster Upload",
          foundingYear: 2024,
          iconType: category?.toUpperCase() === "ADMIN" ? "document" : "code",
        },
      });
      importedCount++;
    } catch (err: any) {
      errors.push(`Row ${i + 2} (${name}): ${err.message}`);
    }
  }

  await logAuditAction({
    adminId: admin.id,
    action: "IMPORT_DEPARTMENT_ROSTER_CSV",
    targetType: TargetType.DEPARTMENT,
    details: { importedCount, errorCount: errors.length },
  });

  return {
    importedCount,
    errors,
  };
}
