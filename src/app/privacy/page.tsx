import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 dark:bg-black">
      <main className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            &larr; Back to Home
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Privacy Policy
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Last updated: [Date]
        </p>

        <section className="mt-8 space-y-4 text-zinc-700 dark:text-zinc-300">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Security and Anti-Abuse
          </h2>
          <p>
            {/* TODO: Full legal wording needed here to comply with Ethiopia's PDPP */}
            We collect IP addresses and basic device information (such as your browser and operating system) when you log in. 
            This information is used strictly for security and abuse detection purposes, to prevent fraudulent logins and keep the platform safe.
          </p>
          <p>
            We retain this data only as long as necessary for security reasons, in compliance with applicable privacy standards.
          </p>
        </section>
      </main>
    </div>
  );
}
