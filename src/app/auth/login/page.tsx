import { AnimatedLoginForm } from "@/components/auth/AnimatedLoginForm";

type SearchParams = Promise<{ error?: string }> | { error?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = params?.error;

  return <AnimatedLoginForm error={error} />;
}
