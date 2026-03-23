import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    redirect("/"); // Or redirect to a 403 page
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Search and manage user plans, roles, and ban statuses.
            </p>
          </div>
          <a
             href="/api/auth/logout"
             className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
             Log out
          </a>
        </div>

        <AdminPanel />
      </main>
    </div>
  );
}
