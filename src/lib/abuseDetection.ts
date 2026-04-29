import { prisma } from "./prisma";
import { MAX_IPS_PER_USER_24H, MAX_USERS_PER_IP_1H } from "@/config/limits";

export async function checkSuspiciousLoginPatterns(
  userId: string,
  currentIp: string | null
): Promise<{ flag: boolean; reason?: string }> {
  // Rule 1: Too many different IPs for the same user in 24h
  // Threshold controlled by MAX_IPS_PER_USER_24H env var (default: 3)
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

  if (distinctIpsRow.length > MAX_IPS_PER_USER_24H) {
    return { flag: true, reason: "too_many_ips" };
  }

  // Rule 2: Too many different users from the same IP in 1h
  // Threshold controlled by MAX_USERS_PER_IP_1H env var (default: 5)
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

    if (distinctUsersRow.length > MAX_USERS_PER_IP_1H) {
      return { flag: true, reason: "too_many_users_per_ip" };
    }
  }

  return { flag: false };
}
