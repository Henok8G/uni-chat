import { prisma } from "./prisma";

export async function checkSuspiciousLoginPatterns(
  userId: string,
  currentIp: string | null
): Promise<{ flag: boolean; reason?: string }> {
  // Rule 1: Too many different IPs for the same user in 24h (threshold: 3)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const distinctIpsRow = await prisma.deviceLog.findMany({
    where: {
      userId,
      createdAt: { gte: twentyFourHoursAgo },
      ipAddress: { not: "unknown" },
    },
    select: { ipAddress: true },
    distinct: ["ipAddress"],
  });

  if (distinctIpsRow.length > 3) {
    return { flag: true, reason: "too_many_ips" };
  }

  // Rule 2: Too many different users from the same IP in 1h (threshold: 5)
  if (currentIp && currentIp !== "unknown") {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const distinctUsersRow = await prisma.deviceLog.findMany({
      where: {
        ipAddress: currentIp,
        createdAt: { gte: oneHourAgo },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    if (distinctUsersRow.length > 5) {
      return { flag: true, reason: "too_many_users_per_ip" };
    }
  }

  return { flag: false };
}
