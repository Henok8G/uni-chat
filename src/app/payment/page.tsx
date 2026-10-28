import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppMenu } from "@/components/AppMenu";
import { PricingSection } from "@/components/PricingSection";
import { getThemeGradient, DEFAULT_THEME_COLOR } from "@/lib/themes";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams?: Promise<{ verified?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Await searchParams – required in Next.js 15 App Router
  const resolvedParams = await searchParams;
  const verifiedJustNow = resolvedParams?.verified === "1";

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ background: getThemeGradient(user.themeColor || DEFAULT_THEME_COLOR, user.gender) }}
    >
      <AppMenu />

      <main className="pt-24 pb-12">
        {verifiedJustNow && (
          <div className="mx-auto max-w-4xl mb-8 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 border border-emerald-200 text-center">
            Your university email has been verified successfully. Check out the campus access plans below!
          </div>
        )}

        {!user.emailVerified && (
          <div className="mx-auto max-w-4xl mb-8 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 border border-amber-200 text-center">
            Your university email is not verified yet. Please use the verification link sent to your institutional email address.
          </div>
        )}

        <PricingSection currentPlan={user.plan} accentColor={user.themeColor ?? undefined} />

      </main>
    </div>
  );
}

