export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          ethi-uni-chat
        </h1>
        <p className="mt-3 text-zinc-700 dark:text-zinc-300">
          Random video chat built for Ethiopian university students only. Verify
          your university email, choose a plan, and connect with other students
          in a safe, moderated environment.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
          >
            Login
          </a>
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Register
          </a>
        </div>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Plans: <span className="font-medium">Standard</span> for regular
          random matching, and <span className="font-medium">Pro</span> for
          gender-priority matching. Prices and full details will appear after
          email verification on the payment page.
        </p>
      </main>
    </div>
  );
}
