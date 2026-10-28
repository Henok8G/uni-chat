import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=================================================================");
  console.log("REWATCH RW-12-13: STEP 1 - PRE-RESTORATION VERIFICATION & SNAPSHOT");
  console.log("=================================================================");

  // 1. Fetch current MatchingConfig
  const currentConfig = await prisma.matchingConfig.findUnique({
    where: { id: "active" },
  });

  if (!currentConfig) {
    console.error("FATAL: MatchingConfig row with id 'active' does not exist!");
    process.exit(1);
  }

  console.log("\n[1] Current MatchingConfig in Database:");
  console.log(`- ID: ${currentConfig.id}`);
  console.log(`- Version: ${currentConfig.version}`);
  console.log(`- Algorithm Model: ${currentConfig.algorithmModel}`);
  console.log(`- Daily Match Cap: ${currentConfig.dailyMatchCap}`);
  console.log(`- Cross Gender Cooldown: ${currentConfig.crossGenderCooldown}`);
  console.log(`- Proximity Bias Weight: ${currentConfig.proximityBiasWeight}`);
  console.log(`- Freshman Mentorship Enabled: ${currentConfig.freshmanMentorshipEnabled}`);
  console.log(`- Weights: Academic=${currentConfig.academicWeight}%, Project=${currentConfig.projectWeight}%, Mentorship=${currentConfig.mentorshipWeight}%, Hobbies=${currentConfig.hobbiesWeight}%`);
  console.log(`- Updated At: ${currentConfig.updatedAt.toISOString()}`);
  console.log(`- Updated By ID: ${currentConfig.updatedById}`);

  // 2. Expected test-contaminated configuration:
  const expectedValues = {
    version: 8,
    dailyMatchCap: 12,
    crossGenderCooldown: true,
    proximityBiasWeight: 75,
    freshmanMentorshipEnabled: true,
    academicWeight: 40,
    projectWeight: 25,
    mentorshipWeight: 20,
    hobbiesWeight: 15,
    algorithmModel: "Rule-Based Heuristic v1.0 (Cosine Hobbies & Dept Matrix)",
  };

  const matchesExpected =
    currentConfig.version === expectedValues.version &&
    currentConfig.dailyMatchCap === expectedValues.dailyMatchCap &&
    currentConfig.crossGenderCooldown === expectedValues.crossGenderCooldown &&
    currentConfig.proximityBiasWeight === expectedValues.proximityBiasWeight &&
    currentConfig.freshmanMentorshipEnabled === expectedValues.freshmanMentorshipEnabled &&
    currentConfig.academicWeight === expectedValues.academicWeight &&
    currentConfig.projectWeight === expectedValues.projectWeight &&
    currentConfig.mentorshipWeight === expectedValues.mentorshipWeight &&
    currentConfig.hobbiesWeight === expectedValues.hobbiesWeight &&
    currentConfig.algorithmModel === expectedValues.algorithmModel;

  if (!matchesExpected) {
    console.error("\n[DISCREPANCY DETECTED] Current values differ from expected test-contaminated configuration!");
    console.error("Expected:", expectedValues);
    console.error("Found:", currentConfig);
    process.exit(2);
  }
  console.log("\n[2] Verification of Contaminated State: PERFECT MATCH with reported test-contaminated config (v8).");

  // 3. Check for any administrative changes to MatchingConfig since the test incident (2026-10-12T16:58:27Z)
  const testIncidentCutoff = new Date("2026-10-12T16:58:27Z");
  const recentAuditLogs = await prisma.auditLog.findMany({
    where: {
      createdAt: { gt: testIncidentCutoff },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n[3] AuditLog entries created since test incident (${testIncidentCutoff.toISOString()}): ${recentAuditLogs.length}`);
  for (const log of recentAuditLogs) {
    const adminUser = await prisma.user.findUnique({ where: { id: log.adminId } });
    console.log(`- [${log.id}] Action: ${log.action} | Target: ${log.targetType} (${log.targetId}) | Admin: ${adminUser?.displayName || "Unknown"} (${adminUser?.email}) | At: ${log.createdAt.toISOString()}`);
  }

  // Check specifically for changes to MatchingConfig (UPDATE_MATCHING_GUARDRAILS, UPDATE_AFFINITY_WEIGHTS)
  const configModificationsSinceIncident = recentAuditLogs.filter(
    (l) => l.action === "UPDATE_MATCHING_GUARDRAILS" || l.action === "UPDATE_AFFINITY_WEIGHTS"
  );

  if (configModificationsSinceIncident.length > 0) {
    console.error("\n[DISCREPANCY DETECTED] Genuine MatchingConfig configuration updates were found after test incident!");
    console.error(configModificationsSinceIncident);
    process.exit(3);
  }
  
  console.log("✓ Zero administrative configuration changes have occurred to MatchingConfig since the test incident.");
  console.log("✓ Note: One REINDEX_AFFINITY_EMBEDDINGS audit entry was recorded during admin UI testing, but it does NOT alter MatchingConfig.");

  // 4. Create a recoverable snapshot of the current MatchingConfig row
  const snapshotData = {
    snapshotTimestamp: new Date().toISOString(),
    sourceTable: "MatchingConfig",
    recordId: currentConfig.id,
    recordVersion: currentConfig.version,
    data: currentConfig,
  };

  const snapshotDir = path.join(process.cwd(), "docs", "snapshots");
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  const snapshotFilePath = path.join(snapshotDir, `matching_config_snapshot_v${currentConfig.version}_${Date.now()}.json`);
  fs.writeFileSync(snapshotFilePath, JSON.stringify(snapshotData, null, 2), "utf-8");
  console.log(`\n[4] Recoverable snapshot written to: ${snapshotFilePath}`);
  console.log(`✓ Snapshot Version: ${snapshotData.recordVersion}`);
  console.log(`✓ Snapshot Timestamp: ${snapshotData.snapshotTimestamp}`);

  console.log("\n=================================================================");
  console.log("STEP 1 VERIFICATION & SNAPSHOT COMPLETED SUCCESSFULLY");
  console.log("All pre-conditions met. Ready for safe administrative restoration.");
  console.log("=================================================================");
}

main()
  .catch((err) => {
    console.error("FATAL ERROR in verification:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
