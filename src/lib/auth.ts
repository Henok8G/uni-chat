import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "ethi_uni_chat_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: string;
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId as string | undefined;
    if (!userId) return null;
    return { userId };
  } catch {
    return null;
  }
}

export const getSessionUser = cache(async () => {
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // Outside request context (e.g. CLI or test environment)
    if (process.env.TEST_USER_ID) {
      return prisma.user.findUnique({
        where: { id: process.env.TEST_USER_ID },
        include: { adminRoleAssignments: true, university: true }
      });
    }
    return null;
  }
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      adminRoleAssignments: true,
      university: true,
    }
  });

  if (!user || user.banned) return null;

  // Check account restriction expiration if set
  if (user.restrictedUntil && new Date(user.restrictedUntil) <= new Date()) {
    // Restriction has expired, auto-clear in DB asynchronously or return active user
    await prisma.user.update({
      where: { id: user.id },
      data: { restrictedUntil: null }
    }).catch(() => {});
  }

  return user;
});

export const hasAdminPermission = cache(async (
  userId: string,
  requiredPermission?: import("@prisma/client").AdminPermission
) => {
  const sessionUser = await getSessionUser();
  const user = (sessionUser && sessionUser.id === userId)
    ? sessionUser
    : await prisma.user.findUnique({
        where: { id: userId },
        include: { adminRoleAssignments: true, university: true }
      });

  if (!user || user.banned) return false;

  // Primary super admin bypass via ENV or role
  const isEnvAdmin = process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;
  if (isEnvAdmin || user.role === "SUPER_ADMIN") return true;

  if (user.role === "STUDENT") return false;

  if (!requiredPermission) return true;

  // Check specific permissions array or ALL permission
  const permissions = user.adminRoleAssignments.flatMap((a) => a.permissions);
  return permissions.includes("ALL") || permissions.includes(requiredPermission);
});

export async function requireAdminPermission(permission?: import("@prisma/client").AdminPermission) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized: Log in required");
  }

  const allowed = await hasAdminPermission(user.id, permission);
  if (!allowed) {
    throw new Error("Forbidden: Insufficient admin permissions");
  }

  return user;
}


