import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { plans, TELEGRAM_HANDLE } from "@/config/pricingConfig";
import { hasActivePaidPlan } from "@/lib/plan";

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

  // If user already has a valid paid plan and is verified, send them to /app
  const planIsActive =
    user.plan !== "FREE" &&
    (user.planExpiresAt === null || user.planExpiresAt > new Date());

  if (user.emailVerified && planIsActive) {
    redirect("/app");
  }

  const hasAccess = hasActivePaidPlan(user);

  const isoDate = user.planExpiresAt ? new Date(user.planExpiresAt).toISOString().split('T')[0] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-xl shadow-black/5 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Current status:{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {plans[user.plan]?.label || "No active plan"}
            </span>
            {isoDate && (
              <span className="ml-1 text-zinc-500">
                (Expires: {isoDate})
              </span>
            )}
          </p>
        </header>

        {verifiedJustNow && (
          <div className="mb-8 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            Your email has been verified successfully. Check out the plans below!
          </div>
        )}

        {!user.emailVerified && (
          <div className="mb-8 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            Your email is not verified yet. Please use the verification link sent to your university email.
          </div>
        )}

        {hasAccess && user.plan !== 'FREE' && isoDate && (
          <div className="mb-8 flex flex-col items-center rounded-xl bg-indigo-50 p-6 text-center dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
            <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300">
              Your current plan: {user.plan}, expires on {isoDate}
            </h2>
            <a
              href="/app"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700"
            >
              Go to chat
            </a>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(plans).map(([planKey, config]) => {
            const isCurrent = user.plan === planKey;
            
            return (
              <div 
                key={planKey}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  isCurrent 
                    ? "border-indigo-600 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-500/5" 
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Current
                  </div>
                )}
                <div className="mb-5 flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{config.label}</h3>
                  <div className="mt-2 flex items-baseline text-zinc-900 dark:text-zinc-50">
                    <span className="text-3xl font-bold tracking-tight">{config.price === null ? "Contact Admin" : config.price}</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {config.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl bg-zinc-100 p-6 dark:bg-zinc-800/50">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">How to pay</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-text select-text">
            Contact {TELEGRAM_HANDLE} on Telegram to pay. After payment, I will manually activate your plan. You may need to log out and log in again.
          </p>
          <div className="mt-4 flex items-center p-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg max-w-max">
             <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
             </svg>
             <a href={`https://t.me/${TELEGRAM_HANDLE.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
               {TELEGRAM_HANDLE}
             </a>
          </div>
        </section>

        <div className="mt-8 text-center">
          <a
            href="/api/auth/logout"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Log out
          </a>
        </div>
      </main>
    </div>
  );
}
