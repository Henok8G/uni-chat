import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppMenu } from "@/components/AppMenu";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings (placeholder)
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This page will let users update their gender, view plan details, and manage
          preferences.
        </p>
      </main>
      <AppMenu />
    </div>
  );
}
