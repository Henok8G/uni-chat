import { getSessionUser, hasAdminPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminCockpit } from "./AdminCockpit";
import { getAdminOverviewStats } from "./overviewActions";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  const isAllowed = await hasAdminPermission(user.id);
  if (!isAllowed) {
    redirect("/");
  }

  const isSuperAdmin =
    user.role === "SUPER_ADMIN" ||
    (!!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL);

  const assignedPermissions = user.adminRoleAssignments?.flatMap((a) => a.permissions) || [];
  const effectivePermissions: string[] = isSuperAdmin
    ? ["ALL"]
    : Array.from(
        new Set([
          ...assignedPermissions,
          ...(user.role === "ADMIN" ? ["ALL"] : []),
          ...(user.role === "MODERATOR" ? ["MODERATE_REPORTS", "VIEW_AUDIT_LOGS"] : []),
          ...(user.role === "CONTENT_ADMIN" ? ["MANAGE_CONTENT", "REVIEW_POST_READY"] : []),
          ...(user.role === "ORG_ADMIN" ? ["MANAGE_CLUBS", "MANAGE_GROUPS"] : []),
        ])
      );

  let stats;
  try {
    stats = await getAdminOverviewStats();
  } catch {
    stats = undefined;
  }

  return (
    <AdminCockpit
      currentUser={{
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        department: user.department,
        permissions: effectivePermissions,
        isSuperAdmin,
      }}
      initialStats={stats}
    />
  );
}
