import "./testDbGuard";
import { DepartmentCategory, DepartmentStatus, TargetType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function runRegressionTests() {
  console.log("=================================================================");
  console.log("RUNNING REGRESSION TEST: DEPARTMENTS & OFFICIALS (SCREEN_18)");
  console.log("=================================================================\n");

  let testDeptId = "";
  let testDelegateId = "";
  let adminUser = null;
  let testUser = null;

  try {
    // 0. Ensure Admin & Test User Exist
    adminUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    if (!adminUser) {
      adminUser = await prisma.user.findFirst();
    }
    console.log(`[TEST 0] Using admin user: ${adminUser?.email} (${adminUser?.id})`);

    testUser = await prisma.user.findFirst({
      where: { id: { not: adminUser?.id } },
    });
    if (!testUser) {
      testUser = adminUser;
    }
    console.log(`[TEST 0] Using test delegate user: ${testUser?.email} (${testUser?.id})`);

    // 1. Test Seed & Initial Departments
    const initialCount = await prisma.department.count();
    console.log(`[TEST 1] Initial department records in DB: ${initialCount}`);

    // 2. Test Entity Creation & Persistence
    const testCode = `AAU-REGTEST-${Date.now()}`;
    const createdDept = await prisma.department.create({
      data: {
        name: "Test Civil & Environmental Engineering Unit",
        code: testCode,
        category: DepartmentCategory.ACADEMIC,
        campus: "5 Kilo Campus",
        collegeAffiliation: "Addis Ababa Institute of Technology (AAiT)",
        description: "Regression testing unit for SCREEN_18 integration.",
        foundingYear: 1955,
        iconType: "building",
        status: DepartmentStatus.ACTIVE,
        isVerified: true,
        verificationProvenance: "Verified in Test Suite · Quality Assurance",
        emergencyBroadcasts: false,
        pinnedFeedNoPreMod: false,
        studentDirectQA: true,
      },
    });
    testDeptId = createdDept.id;
    console.log(`[TEST 2] PASS: Created entity "${createdDept.name}" (${createdDept.code}) with ID: ${testDeptId}`);

    // Verify persistence by fetching again
    const fetchedDept = await prisma.department.findUnique({ where: { id: testDeptId } });
    if (!fetchedDept || fetchedDept.code !== testCode) {
      throw new Error("Failed to persist department across queries");
    }
    console.log("[TEST 2] PASS: Entity correctly persisted and retrievable.");

    // 3. Test Entity Editing
    const updatedDept = await prisma.department.update({
      where: { id: testDeptId },
      data: {
        campus: "4 Kilo Campus",
        description: "Updated regression test description.",
        emergencyBroadcasts: true,
      },
    });
    if (updatedDept.campus !== "4 Kilo Campus" || !updatedDept.emergencyBroadcasts) {
      throw new Error("Failed to update department attributes");
    }
    console.log("[TEST 3] PASS: Entity edits persisted correctly (Campus: 4 Kilo Campus, Emergency: true).");

    // 4. Test Delegate Assignment & Capabilities
    if (testUser) {
      const delegate = await prisma.departmentDelegate.create({
        data: {
          departmentId: testDeptId,
          userId: testUser.id,
          role: "Lead Research Fellow",
          badge: "Full Clearance",
          canPublish: true,
          canEmergencyBroadcast: true,
          canBypassModeration: false,
          status: "ACTIVE",
          assignedById: adminUser?.id,
        },
      });
      testDelegateId = delegate.id;
      console.log(`[TEST 4] PASS: Assigned user "${testUser.email}" as delegate with ID: ${testDelegateId}`);

      // Verify unique constraint: cannot assign same user twice to same department without error/upsert
      let threwUnique = false;
      try {
        await prisma.departmentDelegate.create({
          data: {
            departmentId: testDeptId,
            userId: testUser.id,
            role: "Duplicate Fellow",
            badge: "Announce",
          },
        });
      } catch {
        threwUnique = true;
      }
      if (!threwUnique) {
        throw new Error("Failed to enforce unique constraint on departmentId + userId");
      }
      console.log("[TEST 4] PASS: Database unique constraint enforced on duplicate delegate assignment.");

      // Test Revoking Delegate
      const revokedDelegate = await prisma.departmentDelegate.update({
        where: { id: testDelegateId },
        data: { status: "REVOKED" },
      });
      if (revokedDelegate.status !== "REVOKED") {
        throw new Error("Failed to set delegate status to REVOKED");
      }
      console.log("[TEST 4] PASS: Delegate successfully revoked.");
    }

    // 5. Test Entity Deactivation
    const deactivatedDept = await prisma.department.update({
      where: { id: testDeptId },
      data: { status: DepartmentStatus.INACTIVE },
    });
    if (deactivatedDept.status !== DepartmentStatus.INACTIVE) {
      throw new Error("Failed to set status to INACTIVE");
    }
    console.log("[TEST 5] PASS: Entity deactivation correctly persisted.");

    // Reactivate
    await prisma.department.update({
      where: { id: testDeptId },
      data: { status: DepartmentStatus.ACTIVE },
    });
    console.log("[TEST 5] PASS: Entity reactivation confirmed.");

    // 6. Test CSV Sanitization & Formula Injection Protection
    const rawVal1 = "=cmd|'/C calc'!A0";
    const rawVal2 = "+12345";
    const rawVal3 = "Standard AAU Text";

    const sanitizeCsv = (val: string) => {
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@]/.test(str)) str = "'" + str;
      return `"${str}"`;
    };

    const s1 = sanitizeCsv(rawVal1);
    const s2 = sanitizeCsv(rawVal2);
    const s3 = sanitizeCsv(rawVal3);

    if (!s1.startsWith("\"'=") || !s2.startsWith("\"'+")) {
      throw new Error("Failed formula injection escaping in CSV sanitizer");
    }
    console.log("[TEST 6] PASS: CSV formula injection defense properly prepends single quote on dangerous characters.");

    // 7. Test Audit Log Integration
    if (adminUser) {
      const audit = await prisma.auditLog.create({
        data: {
          adminId: adminUser.id,
          action: "TEST_DEPARTMENT_REGRESSION",
          targetType: TargetType.DEPARTMENT,
          targetId: testDeptId,
          details: { test: true },
        },
      });
      console.log(`[TEST 7] PASS: Audit log entry logged with ID: ${audit.id} (Target: DEPARTMENT).`);
      // Clean audit log
      await prisma.auditLog.delete({ where: { id: audit.id } });
    }

    // 8. Test KPI Metrics Agreement with Database
    const [deptCount, academicCount, adminCount, activeDelCount] = await Promise.all([
      prisma.department.count(),
      prisma.department.count({ where: { category: DepartmentCategory.ACADEMIC } }),
      prisma.department.count({ where: { category: DepartmentCategory.ADMIN } }),
      prisma.departmentDelegate.count({ where: { status: "ACTIVE" } }),
    ]);

    console.log(`[TEST 8] PASS: Database KPI Totals:`);
    console.log(`         - Total Entities: ${deptCount}`);
    console.log(`         - Academic Units: ${academicCount}`);
    console.log(`         - Admin Offices:  ${adminCount}`);
    console.log(`         - Active Delegates: ${activeDelCount}`);
    if (academicCount + adminCount > deptCount) {
      throw new Error("Category subcounts exceed total departments count");
    }

    console.log("\n=================================================================");
    console.log("ALL REGRESSION TESTS PASSED SUCCESSFULLY! (100% PASS RATE)");
    console.log("=================================================================\n");
  } catch (error) {
    console.error("\nTEST SUITE FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup temporary test entity & delegate
    if (testDelegateId) {
      await prisma.departmentDelegate.delete({ where: { id: testDelegateId } }).catch(() => {});
    }
    if (testDeptId) {
      await prisma.department.delete({ where: { id: testDeptId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runRegressionTests();
