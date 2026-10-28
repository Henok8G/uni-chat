import { prisma } from "../src/lib/prisma";
import { updateMatchingGuardrails, updateAffinityWeights } from "../src/app/admin/matchingActions";

async function main() {
  console.log("=================================================================");
  console.log("REWATCH RW-12-13: STEP 3 & 4 - OFFICIAL ADMINISTRATIVE RESTORATION");
  console.log("=================================================================");

  // 1. Resolve authorized administrator
  const adminUser = await prisma.user.findUnique({
    where: { email: "henok.ugr-6346-17@aau.edu.et" },
  });

  if (!adminUser) {
    console.error("FATAL: Designated Administrator not found!");
    process.exit(1);
  }

  console.log(`\n[1] Authenticated Admin Context: ${adminUser.displayName || "Admin"} (${adminUser.email}) [ID: ${adminUser.id}]`);
  process.env.TEST_USER_ID = adminUser.id;

  // 2. Pre-check: Read initial state before restoration
  const beforeConfig = await prisma.matchingConfig.findUnique({ where: { id: "active" } });
  if (!beforeConfig) {
    console.error("FATAL: MatchingConfig row missing!");
    process.exit(1);
  }
  console.log(`[2] Pre-Restoration State: version=v${beforeConfig.version}, cap=${beforeConfig.dailyMatchCap}, cooldown=${beforeConfig.crossGenderCooldown}, prox=${beforeConfig.proximityBiasWeight}`);
  console.log(`    Weights: Academic=${beforeConfig.academicWeight}%, Project=${beforeConfig.projectWeight}%, Mentorship=${beforeConfig.mentorshipWeight}%, Hobbies=${beforeConfig.hobbiesWeight}%`);

  // 3. Restore Algorithmic Guardrails
  console.log("\n[3] Restoring Algorithmic Guardrails via administrative server action...");
  const guardrailsRes = await updateMatchingGuardrails({
    dailyMatchCap: 5,
    crossGenderCooldown: false,
    proximityBiasWeight: 50,
    freshmanMentorshipEnabled: true,
  });

  if (!guardrailsRes.success || !guardrailsRes.config) {
    console.error("FATAL: Failed to restore matching guardrails:", guardrailsRes.error);
    process.exit(1);
  }
  console.log(`✓ Guardrails successfully restored to version v${guardrailsRes.config.version}:`);
  console.log(`  - dailyMatchCap: ${guardrailsRes.config.dailyMatchCap} (Expected: 5)`);
  console.log(`  - crossGenderCooldown: ${guardrailsRes.config.crossGenderCooldown} (Expected: false)`);
  console.log(`  - proximityBiasWeight: ${guardrailsRes.config.proximityBiasWeight} (Expected: 50)`);
  console.log(`  - freshmanMentorshipEnabled: ${guardrailsRes.config.freshmanMentorshipEnabled} (Expected: true)`);

  // 4. Restore Affinity Weights
  console.log("\n[4] Restoring Affinity Weights via administrative server action...");
  const weightsRes = await updateAffinityWeights({
    academic: 40,
    project: 30,
    mentorship: 20,
    hobbies: 10,
  });

  if (!weightsRes.success || !weightsRes.weights) {
    console.error("FATAL: Failed to restore affinity weights:", weightsRes.error);
    process.exit(1);
  }
  console.log(`✓ Affinity weights successfully restored to version v${weightsRes.config?.version}:`);
  console.log(`  - academicWeight: ${weightsRes.weights.academic}% (Expected: 40)`);
  console.log(`  - projectWeight: ${weightsRes.weights.project}% (Expected: 30)`);
  console.log(`  - mentorshipWeight: ${weightsRes.weights.mentorship}% (Expected: 20)`);
  console.log(`  - hobbiesWeight: ${weightsRes.weights.hobbies}% (Expected: 10)`);

  // 5. Verification: Read back directly from database
  console.log("\n[5] Database Read-Back Verification:");
  const afterConfig = await prisma.matchingConfig.findUnique({ where: { id: "active" } });
  if (!afterConfig) {
    console.error("FATAL: MatchingConfig missing after update!");
    process.exit(1);
  }

  const expectedFinal = {
    id: "active",
    version: 10,
    dailyMatchCap: 5,
    crossGenderCooldown: false,
    proximityBiasWeight: 50,
    freshmanMentorshipEnabled: true,
    academicWeight: 40,
    projectWeight: 30,
    mentorshipWeight: 20,
    hobbiesWeight: 10,
    algorithmModel: "Rule-Based Heuristic v1.0 (Cosine Hobbies & Dept Matrix)",
  };

  const checks = [
    { name: "id", actual: afterConfig.id, expected: expectedFinal.id },
    { name: "version", actual: afterConfig.version, expected: expectedFinal.version },
    { name: "algorithmModel", actual: afterConfig.algorithmModel, expected: expectedFinal.algorithmModel },
    { name: "dailyMatchCap", actual: afterConfig.dailyMatchCap, expected: expectedFinal.dailyMatchCap },
    { name: "crossGenderCooldown", actual: afterConfig.crossGenderCooldown, expected: expectedFinal.crossGenderCooldown },
    { name: "proximityBiasWeight", actual: afterConfig.proximityBiasWeight, expected: expectedFinal.proximityBiasWeight },
    { name: "freshmanMentorshipEnabled", actual: afterConfig.freshmanMentorshipEnabled, expected: expectedFinal.freshmanMentorshipEnabled },
    { name: "academicWeight", actual: afterConfig.academicWeight, expected: expectedFinal.academicWeight },
    { name: "projectWeight", actual: afterConfig.projectWeight, expected: expectedFinal.projectWeight },
    { name: "mentorshipWeight", actual: afterConfig.mentorshipWeight, expected: expectedFinal.mentorshipWeight },
    { name: "hobbiesWeight", actual: afterConfig.hobbiesWeight, expected: expectedFinal.hobbiesWeight },
  ];

  let allPassed = true;
  for (const c of checks) {
    const passed = c.actual === c.expected;
    if (!passed) allPassed = false;
    console.log(`  ${passed ? "✓ PASS" : "✗ FAIL"}: ${c.name} = ${c.actual} (Expected: ${c.expected})`);
  }

  if (!allPassed) {
    console.error("FATAL: Database read-back verification failed on one or more properties!");
    process.exit(1);
  }

  // 6. Verification: Check new AuditLog entries
  console.log("\n[6] Audit Trail Verification:");
  const restorationAuditLogs = await prisma.auditLog.findMany({
    where: {
      adminId: adminUser.id,
      action: { in: ["UPDATE_MATCHING_GUARDRAILS", "UPDATE_AFFINITY_WEIGHTS"] },
    },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  console.log(`Found ${restorationAuditLogs.length} recent restoration AuditLog entries:`);
  for (const log of restorationAuditLogs) {
    console.log(`- [${log.id}] Action: ${log.action} | Admin: ${log.adminId} | At: ${log.createdAt.toISOString()} | Details:`, JSON.stringify(log.details));
  }

  console.log("\n=================================================================");
  console.log("RESTORATION COMPLETE & FULLY VERIFIED IN DATABASE!");
  console.log("=================================================================");
}

main()
  .catch((e) => {
    console.error("FATAL ERROR:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
