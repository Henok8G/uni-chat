import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingClient } from "@/components/LandingClient";

export default async function Home() {
  const user = await getSessionUser();
  
  if (user) {
    redirect("/app");
  }

  return <LandingClient />;
}
