import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MatchHubClient } from "@/components/match/MatchHubClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matchmaking Hub | Uni-Chat",
  description: "Find study partners, project teammates, and verified student peers across Ethiopian universities with criteria filters and live sonar matching.",
};

export default async function MatchPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/auth/login");
  }

  if (!sessionUser.emailVerified || sessionUser.banned) {
    redirect("/auth/login?error=Please+verify+your+email+or+contact+support.");
  }

  // Fetch full user record including university relation
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { university: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  // Approximate live verified student count (fallback to lively baseline)
  const totalVerifiedCount = await prisma.user.count({
    where: { emailVerified: true, banned: false },
  }).catch(() => 140);

  const displayOnline = Math.max(totalVerifiedCount, 120);

  return (
    <MatchHubClient
      user={{
        id: dbUser.id,
        email: dbUser.email,
        displayName: dbUser.displayName,
        gender: dbUser.gender,
        department: dbUser.department,
        year: dbUser.year,
        hobbies: dbUser.hobbies,
        avatarUrl: dbUser.avatarUrl,
        plan: dbUser.plan,
        university: dbUser.university ? { name: dbUser.university.name, domain: dbUser.university.domain } : null,
        emailVerified: dbUser.emailVerified,
        role: dbUser.role,
        themeColor: dbUser.themeColor,
      }}
      onlineCount={displayOnline}
    />
  );
}
