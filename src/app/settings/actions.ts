"use server";

import { getSessionUser, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRandomAvatar } from "@/lib/avatars";

export type VisibilityType = "PUBLIC" | "CAMPUS" | "PRIVATE";

export async function updateVisibility(visibility: VisibilityType) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: user.id },
    data: { visibility },
  });

  return { ok: true };
}

export async function updateThemeColor(themeColor: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: user.id },
    data: { themeColor },
  });

  return { ok: true };
}

export async function updateProfile(data: { bio: string; displayName: string }) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      bio: data.bio.trim() || null,
      displayName: data.displayName.trim() || null,
    },
  });

  return { ok: true };
}

export async function changePassword(currentPass: string, newPass: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the current password
  const isValid = await verifyPassword(currentPass, user.passwordHash || "");
  if (!isValid) {
    throw new Error("Incorrect current password.");
  }

  // Hash the new password
  const newHash = await hashPassword(newPass);

  // Update in DB
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { ok: true };
}

export async function updateAvatar(avatarUrl: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  return { ok: true, avatarUrl };
}

export async function rollRandomAvatar() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const newAvatar = getRandomAvatar(user.gender);
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: newAvatar },
  });

  return { ok: true, avatarUrl: newAvatar };
}

