import { AnimatedLoginForm } from "@/components/auth/AnimatedLoginForm";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type SearchParams = Promise<{ error?: string }> | { error?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect("/home");
  }

  const params = await searchParams;
  const error = params?.error;

  return <AnimatedLoginForm error={error} />;
}
