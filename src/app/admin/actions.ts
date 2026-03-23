"use server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

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
  
  return updated;
}
