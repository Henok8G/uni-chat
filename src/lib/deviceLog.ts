import { prisma } from "./prisma";

export async function recordDeviceLog(params: {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const { userId, ipAddress, userAgent } = params;

  await prisma.deviceLog.create({
    data: {
      userId,
      ipAddress: ipAddress ?? "unknown",
      userAgent: userAgent ?? "unknown",
    },
  });
}

