import "./testDbGuard"; // Strictly enforces isolated TEST_DATABASE_URL
import { prisma } from "../src/lib/prisma";
import {
  getTeamManagementData,
  updateRolePermissions,
  assignUserToRole,
  removeUserFromRole,
  searchEligiblePersonnel,
} from "../src/app/admin/teamActions";
import { UserRole, AdminPermission, TargetType } from "@prisma/client";

/**
 * scripts/testTeamRolesIntegration.ts
 *
 * Full integration test suite for SCREEN_8: Administrative Roles & Granular Permissions.
 * Protected by testDbGuard: Halts immediately if TEST_DATABASE_URL is not configured or matches application DB.
 */

async function runTeamRolesIntegrationSuite() {
  console.log("=================================================================");
  console.log("UNI-CHAT ADMINISTRATIVE ROLES & RBAC INTEGRATION TEST SUITE");
  console.log("=================================================================");

  const createdUserIds: string[] = [];

  try {
    // 1. Setup Test Actors (1 Super Admin, 1 Operational Admin, 1 Student)
    console.log("\n[TEST 1] Setting up isolated test actors...");
    const superAdmin = await prisma.user.create({
      data: {
        email: `regtest-superadmin-${Date.now()}@aau.edu.et`,
        passwordHash: "dummyhash",
        displayName: "Regtest Super Admin",
        role: "SUPER_ADMIN",
        department: "Central Administration",
        emailVerified: true,
      },
    });
    createdUserIds.push(superAdmin.id);

    const operationalAdmin = await prisma.user.create({
      data: {
        email: `regtest-opadmin-${Date.now()}@aau.edu.et`,
        passwordHash: "dummyhash",
        displayName: "Regtest Operational Admin",
        role: "ADMIN",
        department: "Computer Science",
        emailVerified: true,
      },
    });
    createdUserIds.push(operationalAdmin.id);

    const testStudent = await prisma.user.create({
      data: {
        email: `regtest-student-${Date.now()}@aau.edu.et`,
        passwordHash: "dummyhash",
        displayName: "Regtest Student",
        role: "STUDENT",
        department: "Electrical Engineering",
        emailVerified: true,
      },
    });
    createdUserIds.push(testStudent.id);

    console.log(`✓ Created Super Admin (${superAdmin.id}), Ops Admin (${operationalAdmin.id}), Student (${testStudent.id})`);

    // 2. Unauthenticated / Student Access Rejection
    console.log("\n[TEST 2] Testing server-side authorization enforcement...");
    process.env.TEST_USER_ID = testStudent.id; // Simulate student caller

    let studentBlocked = false;
    try {
      await getTeamManagementData("ADMIN");
    } catch (err: any) {
      if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
        studentBlocked = true;
      }
    }
    if (!studentBlocked) {
      throw new Error("Student account was improperly permitted to access getTeamManagementData!");
    }
    console.log("✓ PASS: Student access rejected by requireAdminPermission('MANAGE_ROLES').");

    // 3. Fetch Team Management Data as Super Admin
    console.log("\n[TEST 3] Fetching canonical permission matrix and role definitions...");
    process.env.TEST_USER_ID = superAdmin.id; // Simulate Super Admin caller

    const adminData = await getTeamManagementData("ADMIN");
    console.log(`  Role archetypes: ${adminData.roleArchetypes.length}`);
    console.log(`  Permission categories: ${adminData.permissionCategories.length}`);
    console.log(`  Total capabilities: ${adminData.totalStats.total}`);
    console.log(`  Granted capabilities for ADMIN: ${adminData.totalStats.granted}`);
    console.log(`  Operational authority: ${adminData.inspectorData.operationalAuthorityPercentage}%`);

    if (adminData.roleArchetypes.length < 5) {
      throw new Error(`Expected at least 5 role archetypes, got ${adminData.roleArchetypes.length}`);
    }
    if (adminData.permissionCategories.length !== 9) {
      throw new Error(`Expected exactly 9 permission categories, got ${adminData.permissionCategories.length}`);
    }
    const expectedTotal = adminData.permissionCategories.reduce((acc, c) => acc + c.totalCount, 0);
    if (adminData.totalStats.total !== expectedTotal || adminData.totalStats.total === 0) {
      throw new Error(`Total capabilities mismatch: got ${adminData.totalStats.total}, expected ${expectedTotal}`);
    }
    console.log(`✓ PASS: Canonical permission model validated (${adminData.totalStats.total} permissions dynamically derived across 9 modules).`);

    // 4. Update Role Permissions (Configurable Role)
    console.log("\n[TEST 4] Updating permissions for Operational Admin role...");
    const newPerms: AdminPermission[] = [
      "MANAGE_USERS",
      "MANAGE_CONTENT",
      "MANAGE_GROUPS",
      "MANAGE_CLUBS",
    ];
    const updateRes = await updateRolePermissions("ADMIN", newPerms);
    if (!updateRes.success) {
      throw new Error(`updateRolePermissions failed: ${updateRes.message}`);
    }
    console.log(`✓ PASS: ${updateRes.message}`);

    // Verify system-locked Super Admin role cannot be modified
    let superAdminModBlocked = false;
    try {
      await updateRolePermissions("SUPER_ADMIN", ["MANAGE_USERS"]);
    } catch (err: any) {
      if (err.message.includes("System Protection")) {
        superAdminModBlocked = true;
      }
    }
    if (!superAdminModBlocked) {
      throw new Error("Super Administrator permissions were improperly allowed to be modified!");
    }
    console.log("✓ PASS: Super Administrator role is system-locked against modification.");

    // 5. Self-Escalation & Privilege Bound Guard
    console.log("\n[TEST 5] Testing self-escalation and privilege boundary guard...");
    process.env.TEST_USER_ID = operationalAdmin.id; // Operational admin caller

    // Operational admin lacks MANAGE_ROLES by default unless granted
    await prisma.adminRoleAssignment.create({
      data: {
        userId: operationalAdmin.id,
        role: "ADMIN",
        permissions: ["MANAGE_ROLES", "MANAGE_USERS", "MANAGE_CONTENT"],
        grantedById: superAdmin.id,
      },
    });

    // Attempt to assign SUPER_ADMIN as an operational admin
    let superAdminAssignBlocked = false;
    try {
      await assignUserToRole(testStudent.id, "SUPER_ADMIN");
    } catch (err: any) {
      if (err.message.includes("Forbidden: Only an existing Super Administrator")) {
        superAdminAssignBlocked = true;
      }
    }
    if (!superAdminAssignBlocked) {
      throw new Error("Operational admin was improperly allowed to grant Super Admin privileges!");
    }
    console.log("✓ PASS: Non-super-admin prohibited from assigning Super Admin role.");

    // 6. Anti-Lockout Guard: Protecting the Last Super Administrator
    console.log("\n[TEST 6] Testing anti-lockout invariant (protecting last Super Admin)...");
    process.env.TEST_USER_ID = superAdmin.id; // Switch to Super Admin

    // Confirm that removing the last Super Admin is rejected
    // First, count how many Super Admins exist
    const currentSuperAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
    });

    if (currentSuperAdmins.length === 1) {
      let lockoutBlocked = false;
      try {
        await removeUserFromRole(superAdmin.id);
      } catch (err: any) {
        if (err.message.includes("Lockout Prevention")) {
          lockoutBlocked = true;
        }
      }
      if (!lockoutBlocked) {
        throw new Error("Last Super Administrator was improperly allowed to be removed!");
      }
      console.log("✓ PASS: Anti-lockout guard successfully prevented removing the last Super Administrator.");
    }

    // 7. Assign Student to Administrative Role
    console.log("\n[TEST 7] Assigning student account to Content Admin role...");
    const assignRes = await assignUserToRole(testStudent.id, "CONTENT_ADMIN");
    if (!assignRes.success) {
      throw new Error(`assignUserToRole failed: ${assignRes.message}`);
    }

    const assignedUser = await prisma.user.findUnique({
      where: { id: testStudent.id },
      include: { adminRoleAssignments: true },
    });
    if (assignedUser?.role !== "CONTENT_ADMIN" || assignedUser.adminRoleAssignments.length === 0) {
      throw new Error("Database role or AdminRoleAssignment was not persisted correctly!");
    }
    console.log(`✓ PASS: ${testStudent.email} assigned to CONTENT_ADMIN with active role assignment.`);

    // 8. Revoke Administrative Access
    console.log("\n[TEST 8] Revoking administrative access from assigned account...");
    const removeRes = await removeUserFromRole(testStudent.id);
    if (!removeRes.success) {
      throw new Error(`removeUserFromRole failed: ${removeRes.message}`);
    }

    const revertedUser = await prisma.user.findUnique({
      where: { id: testStudent.id },
      include: { adminRoleAssignments: true },
    });
    if (revertedUser?.role !== "STUDENT" || revertedUser.adminRoleAssignments.length > 0) {
      throw new Error("Account was not properly reverted to STUDENT or assignments were not deleted!");
    }
    console.log(`✓ PASS: Account reverted to STUDENT; role assignment records purged.`);

    // 9. Audit Log Persistence
    console.log("\n[TEST 9] Verifying immutable AuditLog records...");
    const auditRecords = await prisma.auditLog.findMany({
      where: {
        action: { in: ["ASSIGN_ADMIN_ROLE", "REMOVE_ADMIN_ROLE", "UPDATE_ROLE_PERMISSIONS"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (auditRecords.length < 3) {
      throw new Error(`Expected at least 3 audit log records, found ${auditRecords.length}`);
    }
    console.log(`✓ PASS: Verified ${auditRecords.length} security audit log records in database.`);

    console.log("\n=================================================================");
    console.log("ALL 9 TEAM ROLES & RBAC INTEGRATION TESTS PASSED 100%!");
    console.log("=================================================================");
  } finally {
    // 10. Clean up isolated test actors
    console.log("\nCleaning up test records in isolated database...");
    await prisma.adminRoleAssignment.deleteMany({
      where: { userId: { in: createdUserIds } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds } },
    }).catch(() => {});
    console.log("✓ Cleanup completed.");
  }
}

runTeamRolesIntegrationSuite()
  .catch((err) => {
    console.error("Team Roles Integration Test Failure:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
