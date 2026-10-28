import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasActivePlan } from "@/lib/plan";
import ChatApp from "@/components/ChatApp";
import { DEFAULT_THEME_COLOR, getThemeGradient } from "@/lib/themes";
import { prisma } from "@/lib/prisma";

interface AppPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const prefGender = typeof resolvedParams.gender === "string" ? resolvedParams.gender : undefined;
  const prefDept = typeof resolvedParams.dept === "string" ? resolvedParams.dept : undefined;
  const prefYear = typeof resolvedParams.year === "string" ? resolvedParams.year : undefined;
  const prefHobbies = typeof resolvedParams.hobbies === "string" ? resolvedParams.hobbies.split(",") : undefined;
  const autoStart = resolvedParams.autostart === "1" || resolvedParams.autostart === "true";

  if (!user.emailVerified || user.banned) {
    redirect("/auth/login?error=Please+verify+your+email+or+contact+support.");
  }

  // Activate free trial on first use for FREE plan users
  if (user.plan === 'FREE' && !user.planExpiresAt) {
    const trialEndDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 20);
    await prisma.user.update({
      where: { id: user.id },
      data: { planExpiresAt: trialEndDate }
    });
    user.planExpiresAt = trialEndDate; // Reflect in local session for immediate use
  }

  const themeColor = user.themeColor ?? DEFAULT_THEME_COLOR;
  // Gradient direction differs by gender: female → 135deg (top-left to bottom-right), male → 225deg (bottom-left to top-right)
  const bgGradient = getThemeGradient(themeColor, user.gender);

  // Fetch initial friend IDs so ChatApp immediately recognizes existing personal chat friends
  const friendships = await prisma.friendship.findMany({
    where: { userId: user.id },
    select: { friendId: true },
  }).catch(() => []);
  const initialFriendIds = friendships.map((f) => f.friendId);

  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden"
      style={{ background: bgGradient }}
    >
      <ChatApp
        user={{
          userId: user.id,
          plan: user.plan,
          gender: user.gender,
          displayName: user.displayName ?? undefined,
          email: user.email,
          bio: user.bio ?? undefined,
          department: user.department ?? undefined,
          year: user.year ?? undefined,
          hobbies: user.hobbies ?? [],
          avatarUrl: user.avatarUrl ?? undefined,
          emailVerified: user.emailVerified,
          role: user.role,
        }}
        initialFriendIds={initialFriendIds}
        initialPreferences={{
          prefGender,
          prefDept,
          prefYear,
          prefHobbies,
          autoStart,
        }}
      />
    </div>
  );
}
