import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TELEGRAM_HANDLE } from "@/config/pricingConfig";
import { hasActivePlan } from "@/lib/plan";
import { AppMenu } from "@/components/AppMenu";
import { PricingSection } from "@/components/PricingSection";

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

  // If user has a valid plan (Free test or Paid) and is verified, send them to /app
  const planIsActive = hasActivePlan(user);

  if (user.emailVerified && planIsActive) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="fixed top-0 left-0 w-full z-50">
        {/* Navigation placeholder if needed */}
      </div>

      <main className="container mx-auto px-4 pt-32 pb-12">
        {verifiedJustNow && (
          <div className="mx-auto max-w-4xl mb-8 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            Your email has been verified successfully. Check out the plans below!
          </div>
        )}

        {!user.emailVerified && (
          <div className="mx-auto max-w-4xl mb-8 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-center">
            Your email is not verified yet. Please use the verification link sent to your university email.
          </div>
        )}

        <PricingSection currentPlan={user.plan} accentColor={user.themeColor ?? undefined} />

        <section className="mx-auto mt-12 max-w-4xl rounded-3xl bg-zinc-50 p-8 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">How to pay</h3>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Contact <span className="font-semibold text-zinc-900 dark:text-zinc-100">{TELEGRAM_HANDLE}</span> on Telegram to activate your plan. 
            Once you've made the payment, we will manually activate your account. You may need to log out and log in again to see the changes.
          </p>
          <div className="mt-6">
            <a 
              href={`https://t.me/${TELEGRAM_HANDLE.replace('@', '')}`} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-colors dark:bg-zinc-950 dark:border-zinc-700"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
              </svg>
              {TELEGRAM_HANDLE}
            </a>
          </div>
        </section>

        <div className="mt-12 text-center pb-24">
          <a
            href="/api/auth/logout"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Log out
          </a>
        </div>
      </main>
      <AppMenu />
    </div>
  );
}
