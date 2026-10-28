import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login");
  }

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const isDarkInit = themeCookie === "dark";

  return (
    <ProfileClient profile={user as any} isDarkInit={isDarkInit} />
  );
}
