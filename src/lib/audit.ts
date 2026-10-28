import { prisma } from "./prisma";
import { TargetType } from "@prisma/client";

export interface LogAuditParams {
  adminId: string;
  action: string;
  targetType: TargetType;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAuditAction(params: LogAuditParams) {
  try {
    const isTest =
      process.env.NODE_ENV === "test" ||
      Boolean(process.env.TEST_DATABASE_URL) ||
      Boolean(process.env.TEST_HARNESS_ACTIVE);

    const details = isTest
      ? { ...(params.details ?? {}), isTestExecution: true }
      : (params.details ?? undefined);

    const ipAddress = params.ipAddress || (isTest ? "TEST_HARNESS" : undefined);

    return await prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
    return null;
  }
}

export async function getAuditLogs(limit = 50, adminId?: string) {
  return prisma.auditLog.findMany({
    where: adminId ? { adminId } : undefined,
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
