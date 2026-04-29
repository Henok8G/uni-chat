import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasActivePlan } from "@/lib/plan";
import ChatApp from "@/components/ChatApp";
import { DEFAULT_THEME_COLOR, getThemeGradient } from "@/lib/themes";
import { prisma } from "@/lib/prisma";

export default async function AppPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  const isActive = hasActivePlan(user);
  if (!user.emailVerified || !isActive || user.banned) {
    redirect("/payment");
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

  return (
    <div
      className="flex h-screen items-center justify-center p-4"
      style={{ background: bgGradient }}
    >
      <ChatApp
        user={{
          userId: user.id,
          plan: user.plan,
          gender: user.gender,
        }}
      />
    </div>
  );
}
