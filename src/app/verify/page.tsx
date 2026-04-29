import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { logAnalyticsEvent, AnalyticsEventType } from "@/lib/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";

type SearchParams = Promise<{ token?: string }> | { token?: string };

async function verifyToken(token: string | undefined) {
  if (!token) {
    return { status: "error" as const, message: "Missing verification token." };
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return { status: "error" as const, message: "Invalid verification token." };
  }

  if (record.usedAt) {
    return {
      status: "error" as const,
      message: "This verification link has already been used.",
    };
  }

  if (record.expiresAt < new Date()) {
    return {
      status: "error" as const,
      message: "This verification link has expired.",
    };
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });

  logAnalyticsEvent(AnalyticsEventType.USER_VERIFIED, {
    userId: record.userId,
    universityId: record.user.universityId || undefined,
  });

  await prisma.verificationToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  redirect("/payment?verified=1");
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = params?.token;

  const result = await verifyToken(token);

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 transition-colors"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>

      <main 
        className="w-full max-w-md rounded-2xl p-8 border transition-colors shadow-xl"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <h1 
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-heading)" }}
        >
          Email verification
        </h1>
        <p className="mt-4 text-sm text-red-500 font-medium">{result.message}</p>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          If your link has expired, you can request a new verification email from the
          login or settings page.
        </p>
      </main>
    </div>
  );
}
