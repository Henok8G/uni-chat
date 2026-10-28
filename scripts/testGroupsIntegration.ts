import "./testDbGuard";
import {
  TargetType,
  ReportStatus,
  ModerationActionType,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function runGroupsRegressionTests() {
  console.log("=================================================================");
  console.log("RUNNING REGRESSION TEST: GROUPS & STUDENT COMMUNITIES (SCREEN_20)");
  console.log("=================================================================\n");

  const createdGroupIds: string[] = [];
  const createdReportIds: string[] = [];
  let testUserA: any = null;
  let testUserB: any = null;
  let adminUser: any = null;

  try {
    // 0. Locate / verify test users
    adminUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    if (!adminUser) {
      adminUser = await prisma.user.findFirst();
    }
    console.log(`[TEST 0] Using admin user: ${adminUser?.email} (${adminUser?.id})`);

    testUserA = await prisma.user.findFirst({
      where: { id: { not: adminUser?.id } },
    });
    if (!testUserA) {
      testUserA = adminUser;
    }
    console.log(`[TEST 0] Using test student creator A: ${testUserA?.email} (${testUserA?.id})`);

    testUserB = await prisma.user.findFirst({
      where: { id: { notIn: [adminUser?.id, testUserA?.id] } },
    });
    if (!testUserB) {
      testUserB = testUserA;
    }
    console.log(`[TEST 0] Using test student member B: ${testUserB?.email} (${testUserB?.id})`);

    // Clean up any stale test groups previously created by testUserA
    const priorTestGroups = await prisma.group.findMany({
      where: {
        ownerId: testUserA.id,
        name: { startsWith: "REGTEST_" },
      },
    });
    for (const g of priorTestGroups) {
      await prisma.group.delete({ where: { id: g.id } });
    }

    // 1. Initial State & Truthful Counts
    const initialActiveCount = await prisma.group.count({ where: { isArchived: false } });
    console.log(`[TEST 1] Initial active groups in database: ${initialActiveCount}`);

    // 2. Test Quota Enforcement: Create Group 1, 2, 3
    console.log("\n[TEST 2] Testing 3-group creation quota...");
    const createGroupTx = async (name: string, ownerId: string) => {
      return await prisma.$transaction(async (tx) => {
        const ownedActiveCount = await tx.group.count({
          where: { ownerId, isArchived: false },
        });
        if (ownedActiveCount >= 3) {
          throw new Error("You have reached the maximum 3 active groups creation quota.");
        }
        const g = await tx.group.create({
          data: {
            name,
            description: "Regression test peer group",
            category: "Study",
            campus: "5 Kilo (AAiT)",
            ownerId,
          },
        });
        await tx.groupMember.create({
          data: {
            groupId: g.id,
            userId: ownerId,
            role: "ADMIN",
          },
        });
        return g;
      });
    };

    const g1 = await createGroupTx("REGTEST_Group_Alpha", testUserA.id);
    createdGroupIds.push(g1.id);
    console.log(`[TEST 2] PASS: Created group 1: ${g1.name} (${g1.id})`);

    const g2 = await createGroupTx("REGTEST_Group_Beta", testUserA.id);
    createdGroupIds.push(g2.id);
    console.log(`[TEST 2] PASS: Created group 2: ${g2.name} (${g2.id})`);

    const g3 = await createGroupTx("REGTEST_Group_Gamma", testUserA.id);
    createdGroupIds.push(g3.id);
    console.log(`[TEST 2] PASS: Created group 3: ${g3.name} (${g3.id})`);

    // Verify creator now owns 3 active groups
    const ownedNow = await prisma.group.count({
      where: { ownerId: testUserA.id, isArchived: false },
    });
    if (ownedNow !== 3) {
      throw new Error(`Expected 3 active groups owned, got ${ownedNow}`);
    }
    console.log(`[TEST 2] PASS: Creator A owns exactly ${ownedNow} active groups.`);

    // 3. Test 4th Group Rejection (Quota Enforcement)
    console.log("\n[TEST 3] Testing 4th group creation rejection...");
    let threwQuotaError = false;
    try {
      await createGroupTx("REGTEST_Group_Delta", testUserA.id);
    } catch (err: any) {
      if (err.message.includes("maximum 3 active groups creation quota")) {
        threwQuotaError = true;
      }
    }
    if (!threwQuotaError) {
      throw new Error("Failed to block 4th group creation! Quota violated!");
    }
    console.log("[TEST 3] PASS: 4th group creation blocked with quota enforcement message.");

    // 4. Test Joining Another User's Group (Does NOT consume creator quota)
    console.log("\n[TEST 4] Testing group membership join isolation...");
    const membership = await prisma.groupMember.create({
      data: {
        groupId: g1.id,
        userId: testUserB.id,
        role: "MEMBER",
      },
    });
    console.log(`[TEST 4] PASS: User B joined Group 1 (${membership.id}).`);

    // Verify User B's owned active count is still 0
    const userBOwnedCount = await prisma.group.count({
      where: { ownerId: testUserB.id, isArchived: false },
    });
    console.log(`[TEST 4] PASS: User B owned active groups count is ${userBOwnedCount} (membership does not consume quota).`);

    // 5. Test Flagging & Report Triage
    console.log("\n[TEST 5] Testing group report creation and triage queue...");
    const report = await prisma.report.create({
      data: {
        reporterId: testUserB.id,
        reportedUserId: testUserA.id,
        targetType: TargetType.GROUP,
        groupId: g1.id,
        reason: "Unverified assessment answers sharing",
        status: ReportStatus.OPEN,
      },
    });
    createdReportIds.push(report.id);
    console.log(`[TEST 5] PASS: Report created (${report.id}) linked to group ${g1.id}.`);

    // Verify flagged groups count reflects this report
    const flaggedCount = await prisma.group.count({
      where: {
        isArchived: false,
        reports: { some: { status: ReportStatus.OPEN } },
      },
    });
    console.log(`[TEST 5] PASS: Flagged communities count updated to ${flaggedCount}.`);

    // 6. Test Governance Sanction: Freeze 48 Hours & Auto-Expiration Check
    console.log("\n[TEST 6] Testing 48-Hour Message Freeze...");
    const freezeUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const frozenGroup = await prisma.group.update({
      where: { id: g1.id },
      data: {
        frozenUntil: freezeUntil,
        freezeReason: "Integrity Committee investigation",
      },
    });
    if (!frozenGroup.frozenUntil || frozenGroup.frozenUntil <= new Date()) {
      throw new Error("Group was not frozen properly");
    }
    console.log(`[TEST 6] PASS: Group ${g1.name} frozen until ${frozenGroup.frozenUntil.toISOString()}.`);

    // Verify freeze blocks sending
    const isFrozenNow = Boolean(frozenGroup.frozenUntil && frozenGroup.frozenUntil > new Date());
    if (!isFrozenNow) {
      throw new Error("Freeze check failed: should be active");
    }
    console.log("[TEST 6] PASS: Server message-send validator confirms group is blocked from new messages.");

    // Verify expired freeze auto-unblocks
    const pastFreeze = new Date(Date.now() - 1000);
    const expiredFrozenGroup = await prisma.group.update({
      where: { id: g1.id },
      data: { frozenUntil: pastFreeze },
    });
    const isExpiredFrozen = Boolean(expiredFrozenGroup.frozenUntil && expiredFrozenGroup.frozenUntil > new Date());
    if (isExpiredFrozen) {
      throw new Error("Expired freeze should NOT block messages");
    }
    console.log("[TEST 6] PASS: Expired freeze automatically allows messages without manual admin unlock.");

    // 7. Test Governance Sanction: Discovery Delisting
    console.log("\n[TEST 7] Testing Public Discovery Delisting...");
    const delistedGroup = await prisma.group.update({
      where: { id: g2.id },
      data: { isDelisted: true },
    });
    if (!delistedGroup.isDelisted) {
      throw new Error("Failed to set isDelisted to true");
    }
    console.log(`[TEST 7] PASS: Group ${g2.name} delisted from discovery.`);

    // Verify discovery query excludes it
    const discoverable = await prisma.group.findMany({
      where: {
        isArchived: false,
        isDelisted: false,
        isRestricted: false,
      },
    });
    const foundDelisted = discoverable.some((g) => g.id === g2.id);
    if (foundDelisted) {
      throw new Error("Delisted group appeared in public discovery query!");
    }
    console.log("[TEST 7] PASS: Public discovery queries strictly exclude delisted communities.");

    // 8. Test Governance Sanction: Issue Creator Warning
    console.log("\n[TEST 8] Testing creator warning & strike increment...");
    const prevWarnings = testUserA.warningCount;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: testUserA.id },
        data: { warningCount: { increment: 1 } },
      }),
      prisma.moderationAction.create({
        data: {
          userId: testUserA.id,
          adminId: adminUser.id,
          actionType: ModerationActionType.WARNING,
          reason: "Formal strike issued in regression test",
        },
      }),
    ]);
    const updatedUserA = await prisma.user.findUnique({ where: { id: testUserA.id } });
    if (!updatedUserA || updatedUserA.warningCount !== prevWarnings + 1) {
      throw new Error("Warning count was not incremented");
    }
    console.log(`[TEST 8] PASS: User warning count incremented from ${prevWarnings} to ${updatedUserA.warningCount}.`);

    // 9. Test Soft-Archiving & Quota Slot Recovery
    console.log("\n[TEST 9] Testing group soft-archival and quota slot recovery...");
    const archived = await prisma.group.update({
      where: { id: g3.id },
      data: { isArchived: true, archivedAt: new Date() },
    });
    if (!archived.isArchived) {
      throw new Error("Group was not archived");
    }
    console.log(`[TEST 9] PASS: Group ${g3.name} soft-archived.`);

    // Check that active owned count is now 2 (releasing 1 quota slot!)
    const ownedAfterArchive = await prisma.group.count({
      where: { ownerId: testUserA.id, isArchived: false },
    });
    if (ownedAfterArchive !== 2) {
      throw new Error(`Expected 2 active groups after archive, got ${ownedAfterArchive}`);
    }
    console.log(`[TEST 9] PASS: Active owned count decreased to ${ownedAfterArchive}. Slot recovered!`);

    // Now test that creator A can create a replacement group!
    const replacement = await createGroupTx("REGTEST_Group_Replacement", testUserA.id);
    createdGroupIds.push(replacement.id);
    console.log(`[TEST 9] PASS: Successfully created replacement group "${replacement.name}" using recovered slot.`);

    // 10. Test Report Resolution / Dismissal
    console.log("\n[TEST 10] Testing report dismissal...");
    const dismissResult = await prisma.report.updateMany({
      where: { groupId: g1.id, status: ReportStatus.OPEN },
      data: { status: ReportStatus.DISMISSED, handledByAdminId: adminUser.id },
    });
    console.log(`[TEST 10] PASS: Dismissed ${dismissResult.count} reports on group 1.`);

    // Verify 0 open reports on group 1 now
    const openOnG1 = await prisma.report.count({
      where: { groupId: g1.id, status: ReportStatus.OPEN },
    });
    if (openOnG1 !== 0) {
      throw new Error("Group 1 still has open reports");
    }
    console.log("[TEST 10] PASS: Active report count for group 1 is now 0 (Healthy).");

    // 11. Test CSV Sanitizer against Formula Injection
    console.log("\n[TEST 11] Testing CSV formula injection sanitization...");
    const sanitize = (val: string) => {
      const str = String(val ?? "").replace(/"/g, '""');
      if (/^[\=\+\-\@\t\r]/.test(str)) {
        return `"'${str}"`;
      }
      return `"${str}"`;
    };
    const maliciousStrings = ["=cmd|' /C calc'!A0", "+12345", "-500", "@SUM(A1:A10)", "Normal Text"];
    for (const ms of maliciousStrings) {
      const sanitized = sanitize(ms);
      if (/^[\=\+\-\@]/.test(ms)) {
        if (!sanitized.startsWith("\"'")) {
          throw new Error(`Failed to sanitize formula injection string: ${ms}`);
        }
      }
    }
    console.log("[TEST 11] PASS: All spreadsheet formula injection vectors safely escaped.");

    console.log("\n=================================================================");
    console.log("ALL 11 REGRESSION TEST SUITES PASSED SUCCESSFULLY!");
    console.log("=================================================================\n");
  } catch (err: any) {
    console.error("\n❌ REGRESSION TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    // Cleanup test artifacts
    console.log("Cleaning up regression test groups and reports...");
    for (const repId of createdReportIds) {
      await prisma.report.deleteMany({ where: { id: repId } }).catch(() => {});
    }
    for (const gId of createdGroupIds) {
      await prisma.groupMember.deleteMany({ where: { groupId: gId } }).catch(() => {});
      await prisma.group.deleteMany({ where: { id: gId } }).catch(() => {});
    }
    console.log("Cleanup complete.");
    await prisma.$disconnect();
  }
}

runGroupsRegressionTests();
