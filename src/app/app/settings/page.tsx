import { permanentRedirect } from "next/navigation";

export default async function LegacyAppSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  permanentRedirect(queryString ? `/settings?${queryString}` : "/settings");
}
