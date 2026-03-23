import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Email verification
        </h1>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{result.message}</p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          If your link has expired, you can request a new verification email from the
          login or settings page (feature TODO).
        </p>
      </main>
    </div>
  );
}
