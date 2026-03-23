import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { Plan, Gender } from "@prisma/client";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { RegisterForm } from "./RegisterForm";

type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

async function registerAction(prevState: FormState, formData: FormData): Promise<FormState> {
  "use server";

  // TODO(interface changes): ask for gender (optional) and basic profile info when creating an account.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const universityId = String(formData.get("universityId") ?? "");

  if (!email || !password || !confirmPassword || !universityId) {
    return { status: "error", message: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters long.",
    };
  }

  const university = await prisma.university.findUnique({
    where: { id: universityId },
  });

  if (!university) {
    return { status: "error", message: "Selected university is invalid." };
  }

  const emailDomain = email.split("@")[1];
  if (!emailDomain || emailDomain !== university.domain) {
    return {
      status: "error",
      message: `Email must use the ${university.domain} domain.`,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    return { status: "error", message: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      universityId: university.id,
      emailVerified: false,
      plan: Plan.FREE,
      gender: Gender.UNSPECIFIED,
      banned: false,
    },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
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
  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Only Ethiopian university email addresses are allowed.
        </p>

        <RegisterForm action={registerAction} universities={universities} />

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Log in
          </a>
        </p>
      </main>
    </div>
  );
}
