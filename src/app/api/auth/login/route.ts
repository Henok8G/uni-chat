import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { recordDeviceLog } from "@/lib/deviceLog";

export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null
  );
}

function getUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent");
}

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const loginUrl = new URL("/auth/login", request.url);
  const paymentUrl = new URL("/payment", request.url);

  if (!email || !password) {
    loginUrl.searchParams.set("error", encodeURIComponent("Email and password are required."));
    return NextResponse.redirect(loginUrl);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    loginUrl.searchParams.set("error", encodeURIComponent("Invalid email or password."));
    return NextResponse.redirect(loginUrl);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    loginUrl.searchParams.set("error", encodeURIComponent("Invalid email or password."));
    return NextResponse.redirect(loginUrl);
  }

  if (user.banned) {
    loginUrl.searchParams.set(
      "error",
      encodeURIComponent("Your account has been banned. Please contact support.")
    );
    return NextResponse.redirect(loginUrl);
  }

  // Smart post-login redirect:
  // Verified + paid plan (STANDARD / PRO) → /app
  //   planExpiresAt null  = lifetime / admin-granted plan (no expiry) → allowed
  //   planExpiresAt set   = must not be in the past
  // Everyone else (unverified, FREE, expired) → /payment
  const planIsActive =
    user.plan !== "FREE" &&
    (user.planExpiresAt === null || user.planExpiresAt > new Date());

  const hasActivePlan = user.emailVerified && planIsActive;

  const appUrl = new URL("/app", request.url);
  const response = NextResponse.redirect(hasActivePlan ? appUrl : paymentUrl);

  const cookieStore = response.cookies;
  const token = await (async () => {
    const { SignJWT } = await import("jose");
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is not set");
    return new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(secret));
  })();

  cookieStore.set("ethi_uni_chat_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const ip = getClientIp(request);
  await recordDeviceLog({
    userId: user.id,
    ipAddress: ip,
    userAgent: getUserAgent(request),
  });

  // TODO: Privacy compliance check.
  // Under Ethiopia's PDPP, IP and device data collected for security and fraud prevention
  // must be documented in the Privacy Policy and retained only as long as necessary.
  const { checkSuspiciousLoginPatterns } = await import("@/lib/abuseDetection");
  const { flag, reason } = await checkSuspiciousLoginPatterns(user.id, ip);

  if (flag) {
    console.warn(`[AbuseDetection] Suspicious login flagged! User ID: ${user.id}, IP: ${ip}, Reason: ${reason}`);
  }

  return response;
}
