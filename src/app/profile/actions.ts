"use server";

import { getSessionUser, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updatePersonalDetails(data: {
  department: string;
  year: number | null;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  if (data.department && !AAU_DEPARTMENTS.includes(data.department)) {
    throw new Error("Invalid department. Please select a valid AAU department.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      department: data.department || null,
      year: data.year,
    },
  });

  return { ok: true };
}

import { KNOWN_HOBBIES, AAU_DEPARTMENTS } from "./constants";

export async function addHobby(hobby: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  if (!KNOWN_HOBBIES.includes(hobby)) {
    throw new Error("Invalid hobby. Please select from the known hobbies list.");
  }

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hobbies: true },
  });

  const updated = [...(current?.hobbies ?? []), hobby.trim()].slice(0, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { hobbies: updated },
  });

  return { ok: true, hobbies: updated };
}

export async function removeHobby(hobby: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hobbies: true },
  });

  const updated = (current?.hobbies ?? []).filter((h) => h !== hobby);

  await prisma.user.update({
    where: { id: user.id },
    data: { hobbies: updated },
  });

  return { ok: true, hobbies: updated };
}

export async function logoutAction() {
  await destroySession();
}
