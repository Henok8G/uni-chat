import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasActivePaidPlan } from "@/lib/plan";
import ChatApp from "@/components/ChatApp";

export default async function AppPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  // NOTE: Depending on your exact phase settings, we allow fallback testing. 
  // Let's assume user meets prerequisites.
  if (!user.emailVerified || !hasActivePaidPlan(user) || user.banned) {
    redirect("/payment");
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-black">
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

