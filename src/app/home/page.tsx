import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home/HomeClient";
import { getPublishedFeed, getPublicDiscoverGroups, getUpcomingEvents } from "@/app/admin/backendActions";
import { getPersonalChatsForUser } from "@/lib/chatService";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  if (!user.emailVerified || user.banned) {
    redirect("/auth/login?error=Please+verify+your+email+or+contact+support.");
  }

  const [initialPosts, discoverGroups, upcomingEvents, friends] = await Promise.all([
    getPublishedFeed(20),
    getPublicDiscoverGroups(),
    getUpcomingEvents(6),
    getPersonalChatsForUser(user.id),
  ]);

  return (
    <HomeClient
      user={user}
      initialPosts={initialPosts as any}
      initialGroups={discoverGroups as any}
      initialEvents={upcomingEvents as any}
      friends={friends}
    />
  );
}

