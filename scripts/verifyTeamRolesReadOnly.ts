import { prisma } from "../src/lib/prisma";
import { getTeamManagementData, searchEligiblePersonnel } from "../src/app/admin/teamActions";

async function main() {
  console.log("=================================================================");
  console.log("VERIFYING TEAM ROLES & RBAC ACTIONS (READ-ONLY)");
  console.log("=================================================================");

  // 1. Authenticate as Super Admin or Admin from database
  console.log("\n[Test 1] Setting up authenticated admin context...");
  const admin = await prisma.user.findFirst({
    where: { email: process.env.ADMIN_EMAIL || "henok.ugr-6346-17@aau.edu.et" },
  });
  if (!admin) {
    throw new Error("No admin user found in database!");
  }
  process.env.TEST_USER_ID = admin.id;
  console.log(`✓ Authenticated as admin: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);

  // 2. Query Operational Admin Role
  console.log("\n[Test 2] Querying getTeamManagementData for Operational Admin...");
  const adminData = await getTeamManagementData("ADMIN");
  console.log("Operational Admin Summary:", {
    roleArchetypesCount: adminData.roleArchetypes.length,
    categoriesCount: adminData.permissionCategories.length,
    totalCapabilities: adminData.totalStats.total,
    grantedCapabilities: adminData.totalStats.granted,
    authorityPercentage: adminData.inspectorData.operationalAuthorityPercentage,
    assignedStaffCount: adminData.assignedStaff.length,
    recentAuditCount: adminData.recentAuditHistory.length,
  });

  const expectedTotal = adminData.permissionCategories.reduce((acc, c) => acc + c.totalCount, 0);
  if (adminData.totalStats.total !== expectedTotal || adminData.totalStats.total === 0) {
    throw new Error(`Total capabilities mismatch: got ${adminData.totalStats.total}, expected ${expectedTotal}`);
  }
  if (adminData.permissionCategories.length !== 9) {
    throw new Error(`Expected exactly 9 capability modules, got ${adminData.permissionCategories.length}`);
  }
  console.log("✓ PASS: Operational Admin data verified.");

  // 3. Query Super Admin Role
  console.log("\n[Test 3] Querying getTeamManagementData for Super Admin...");
  const superData = await getTeamManagementData("SUPER_ADMIN");
  console.log("Super Admin Summary:", {
    roleName: superData.inspectorData.roleName,
    isSystemLocked: superData.inspectorData.isSystemLocked,
    authorityPercentage: superData.inspectorData.operationalAuthorityPercentage,
    assignedStaff: superData.assignedStaff.map((s) => ({ email: s.email, role: s.role })),
  });

  if (!superData.inspectorData.isSystemLocked) {
    throw new Error("Expected Super Admin role to be system locked!");
  }
  if (superData.inspectorData.operationalAuthorityPercentage !== 100) {
    throw new Error(`Expected Super Admin to have 100% authority, got ${superData.inspectorData.operationalAuthorityPercentage}%`);
  }
  console.log("✓ PASS: Super Admin system lock and 100% operational authority confirmed.");

  // 4. Test Personnel Search
  console.log("\n[Test 4] Testing eligible personnel search...");
  const searchResults = await searchEligiblePersonnel("aau.edu.et");
  console.log(`Found ${searchResults.length} eligible personnel for query 'aau.edu.et'.`);
  if (searchResults.length === 0) {
    throw new Error("Expected search to find at least one user with 'aau.edu.et'!");
  }
  console.log("Sample search result:", searchResults[0]);
  console.log("✓ PASS: Eligible personnel search functioning properly.");

  console.log("\n=================================================================");
  console.log("ALL READ-ONLY TEAM ROLES & RBAC CHECKS PASSED 100%!");
  console.log("=================================================================");
}

main()
  .catch((err) => {
    console.error("Read-Only Validation Failure:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
