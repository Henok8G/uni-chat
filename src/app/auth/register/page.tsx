import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { Plan, Gender } from "@prisma/client";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { AnimatedRegisterForm } from "@/components/auth/AnimatedRegisterForm";
import { logAnalyticsEvent, AnalyticsEventType } from "@/lib/analytics";
import { getRandomThemeColor } from "@/lib/themes";

type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

async function registerAction(prevState: FormState, formData: FormData): Promise<FormState> {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const universityId = String(formData.get("universityId") ?? "");
  const genderRaw = String(formData.get("gender") ?? "UNSPECIFIED").toUpperCase();

  // Map the form value to Prisma Gender enum
  const gender: Gender =
    genderRaw === "MALE"
      ? Gender.MALE
      : genderRaw === "FEMALE"
      ? Gender.FEMALE
      : Gender.UNSPECIFIED;

  if (!email || !password || !confirmPassword || !universityId) {
    return { status: "error", message: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters long." };
  }

  const university = await prisma.university.findUnique({ where: { id: universityId } });
  if (!university) {
    return { status: "error", message: "Selected university is invalid." };
  }

  const emailDomain = email.split("@")[1];
  if (!emailDomain || emailDomain !== university.domain) {
    return { status: "error", message: `Email must use the ${university.domain} domain.` };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "error", message: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);

  // Randomly assign an accent color from the gender-specific palette
  const themeColor = getRandomThemeColor(gender);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      universityId: university.id,
      emailVerified: false,
      plan: Plan.FREE,
      planExpiresAt: null, // Trial starts on first use of the app
      gender,
      themeColor,
      banned: false,
    },
  });

  logAnalyticsEvent(AnalyticsEventType.USER_SIGNED_UP, {
    userId: user.id,
    universityId: user.universityId || undefined,
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  await prisma.verificationToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;
  await sendVerificationEmail({ to: user.email, verifyUrl });

  const cookieStore = await cookies();
  cookieStore.set("pending_verification_email", user.email, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60,
  });

  return {
    status: "success",
    message: "Account created. Check your email for a verification link.",
  };
}

export default async function RegisterPage() {
  const universities = await prisma.university.findMany({ orderBy: { name: "asc" } });
  return <AnimatedRegisterForm action={registerAction} universities={universities} />;
}
