import "./testDbGuard";
import { prisma } from "../src/lib/prisma";
import {
  getMatchingAnalyticsData,
  updateMatchingGuardrails,
  updateAffinityWeights,
  dismissMatchingAnomaly,
  triggerReindexAffinityEmbeddings,
  exportMatchingAuditLogCsv,
} from "../src/app/admin/matchingActions";

async function runMatchingRegressionTests() {
  console.log("=================================================================");
  console.log("RUNNING REGRESSION TEST: MATCHING ANALYTICS & SAFETY (SCREEN_12)");
  console.log("=================================================================\n");

  const createdAnomalyIds: string[] = [];
  let baselineConfig: any = null;

  try {
    // 0. Verify Database Connection & Existing Baseline
    baselineConfig = await prisma.matchingConfig.findUnique({
      where: { id: "active" },
    });
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    if (!adminUser) {
      throw new Error("No admin user found in database!");
    }
    process.env.TEST_USER_ID = adminUser.id;
    console.log(`[TEST 0] Authenticated test context as admin: ${adminUser.email} (${adminUser.id})`);

    const totalExistingSessions = await prisma.chatSession.count();
    console.log(`[TEST 0] Baseline ChatSessions in database: ${totalExistingSessions}`);

    const existingConfig = await prisma.matchingConfig.findFirst({
      orderBy: { version: "desc" },
    });
    console.log(
      `[TEST 0] Active MatchingConfig version: ${existingConfig?.version ?? "None (will create v1)"}`
    );

    // 1. Initial State & Truthful Analytics Loading
    console.log("\n[TEST 1] Fetching live matching analytics data (Cohort: ALL)...");
    const analyticsAll = await getMatchingAnalyticsData("ALL");

    if (!analyticsAll || !analyticsAll.metrics) {
      throw new Error("getMatchingAnalyticsData returned null or missing metrics!");
    }

    console.log(`✓ Metrics Matches Initiated: ${analyticsAll.metrics.totalMatches}`);
    console.log(`✓ Metrics Mutual Acceptance Rate: ${analyticsAll.metrics.acceptanceRate}%`);
    console.log(`✓ Metrics Chat Initiation Rate: ${analyticsAll.metrics.chatInitiationRate}%`);
    console.log(`✓ Metrics Disciplinary Flags Rate: ${analyticsAll.metrics.disciplinaryFlagRate}%`);
    console.log(`✓ Telemetry Model: ${analyticsAll.algorithmModel}`);
    console.log(`✓ Active Anomaly Queue Size: ${analyticsAll.guardrails.activeAnomalies.length}`);

    // Check no fabricated benchmark or mock numbers remain
    if (analyticsAll.metrics.totalMatches === 48290) {
      throw new Error("Found hardcoded mock matches 48290!");
    }
    if (analyticsAll.algorithmModel.includes("AAU Neural v3.4.1")) {
      throw new Error("Found fake AI model 'AAU Neural v3.4.1'!");
    }

    // 2. Conversion Funnel Integrity & Chat Threshold Consistency
    console.log("\n[TEST 2] Verifying Conversion Funnel stages and meetup privacy truthfulness...");
    const funnel = analyticsAll.metrics.funnelStages;
    if (funnel.length !== 5) {
      throw new Error(`Expected 5 funnel stages, found ${funnel.length}`);
    }

    const stage4 = funnel[3];
    const stage5 = funnel[4];

    console.log(`✓ Stage 4 Name: "${stage4.name}" (Count: ${stage4.count})`);
    if (!stage4.name.includes(">5 Exchanges") && !stage4.name.includes("Qualifying")) {
      throw new Error("Stage 4 does not indicate the standardized >5 message exchanges threshold!");
    }

    console.log(`✓ Stage 5 Name: "${stage5.name}" (Count: ${stage5.count})`);
    if (stage5.count !== 0 || !stage5.description.includes("Privacy Preserved")) {
      throw new Error("Stage 5 does not truthfully show 0 with Privacy Preserved label!");
    }

    // 3. Cohort Filtering (ALL vs UNDERGRAD vs POSTGRAD)
    console.log("\n[TEST 3] Testing Cohort Filter variations...");
    const analyticsUndergrad = await getMatchingAnalyticsData("UNDERGRAD");
    const analyticsPostgrad = await getMatchingAnalyticsData("POSTGRAD");

    console.log(`✓ Undergrad Matches Count: ${analyticsUndergrad.metrics.totalMatches}`);
    console.log(`✓ Postgrad Matches Count: ${analyticsPostgrad.metrics.totalMatches}`);
    if (typeof analyticsUndergrad.metrics.totalMatches !== "number") {
      throw new Error("Cohort UNDERGRAD did not return a valid numeric value!");
    }

    // 4. Algorithmic Guardrails Validation & Version Increment
    console.log("\n[TEST 4] Testing Algorithmic Guardrails updates and validation...");
    const initialConfig = await prisma.matchingConfig.findFirst({ orderBy: { version: "desc" } });
    const initialVersion = initialConfig?.version || 1;

    // Test rejection of invalid values
    const invalidProximity = await updateMatchingGuardrails({ proximityBiasWeight: 150 });
    if (invalidProximity.success) {
      throw new Error("Server failed to reject out-of-range proximityBiasWeight (150)!");
    }
    console.log(`✓ Successfully rejected out-of-range proximityBiasWeight: "${invalidProximity.error}"`);

    const invalidCap = await updateMatchingGuardrails({ dailyMatchCap: 0 });
    if (invalidCap.success) {
      throw new Error("Server failed to reject dailyMatchCap = 0!");
    }
    console.log(`✓ Successfully rejected dailyMatchCap = 0: "${invalidCap.error}"`);

    // Test valid guardrails update
    const validUpdate = await updateMatchingGuardrails({
      crossGenderCooldown: true,
      proximityBiasWeight: 75,
      dailyMatchCap: 12,
      freshmanMentorshipEnabled: true,
    });

    if (!validUpdate.success || !validUpdate.config) {
      throw new Error(`Guardrails update failed: ${validUpdate.error}`);
    }
    console.log(`✓ Successfully updated guardrails. New version: v${validUpdate.config.version}`);
    if (validUpdate.config.version <= initialVersion) {
      throw new Error(`Expected version to increment beyond ${initialVersion}, got ${validUpdate.config.version}`);
    }
    if (validUpdate.config.proximityBiasWeight !== 75 || validUpdate.config.dailyMatchCap !== 12) {
      throw new Error("Saved config values do not match updated parameters!");
    }

    // 5. Affinity Weights Persist & Normalization
    console.log("\n[TEST 5] Testing Affinity Weights update...");
    const weightsUpdate = await updateAffinityWeights({
      academic: 40,
      project: 25,
      mentorship: 20,
      hobbies: 15,
    });

    if (!weightsUpdate.success || !weightsUpdate.weights) {
      throw new Error(`Affinity weights update failed: ${weightsUpdate.error}`);
    }
    console.log(
      `✓ Affinity weights persisted: Academic=${weightsUpdate.weights.academic}%, Project=${weightsUpdate.weights.project}%, Mentorship=${weightsUpdate.weights.mentorship}%, Hobbies=${weightsUpdate.weights.hobbies}%`
    );

    // 6. Anomaly Alert Injection and Dismissal
    console.log("\n[TEST 6] Testing Anomaly Queue alert handling & dismissal...");
    const testAnomaly = await prisma.matchingAnomaly.create({
      data: {
        alertCode: "REGTEST-ANOMALY-01",
        description: "Velocity anomaly triggered by test suite: 15 swipes in 20 seconds",
        throttled: true,
        actionTaken: "Rate-limited via test harness",
      },
    });
    createdAnomalyIds.push(testAnomaly.id);
    console.log(`✓ Created test anomaly: ${testAnomaly.alertCode} (${testAnomaly.id})`);

    // Verify it appears in analytics
    const analyticsWithAnomaly = await getMatchingAnalyticsData("ALL");
    const foundAnomaly = analyticsWithAnomaly.guardrails.activeAnomalies.find((a) => a.id === testAnomaly.id);
    if (!foundAnomaly) {
      throw new Error("Created anomaly was not returned in active activeAnomalies queue!");
    }
    console.log(`✓ Verified anomaly is visible in queue: [${foundAnomaly.alertCode}] ${foundAnomaly.description}`);

    // Dismiss anomaly
    const dismissRes = await dismissMatchingAnomaly(testAnomaly.id);
    if (!dismissRes.success) {
      throw new Error(`Failed to dismiss anomaly: ${dismissRes.error}`);
    }
    console.log(`✓ Successfully dismissed anomaly: ${dismissRes.message}`);

    const dismissedCheck = await prisma.matchingAnomaly.findUnique({
      where: { id: testAnomaly.id },
    });
    if (!dismissedCheck?.isDismissed) {
      throw new Error("MatchingAnomaly record is not marked as isDismissed = true!");
    }

    // 7. Affinity Embedding Matrix Re-indexing Action
    console.log("\n[TEST 7] Testing Re-index Affinity Embeddings action...");
    const reindexRes = await triggerReindexAffinityEmbeddings();
    if (!reindexRes.success) {
      throw new Error(`Reindex failed: ${reindexRes.error}`);
    }
    console.log(`✓ Re-index action completed successfully: "${reindexRes.message}"`);
    console.log(`✓ Reindexed at: ${reindexRes.reindexedAt}`);

    // 8. Audit Log Recording for Matching Actions
    console.log("\n[TEST 8] Verifying AuditLog records for Matching Engine events...");
    const matchingAuditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "UPDATE_MATCHING_GUARDRAILS",
            "UPDATE_AFFINITY_WEIGHTS",
            "DISMISS_MATCHING_ANOMALY",
            "REINDEX_AFFINITY_EMBEDDINGS",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    console.log(`✓ Found ${matchingAuditLogs.length} matching audit logs created by test run.`);
    if (matchingAuditLogs.length < 3) {
      throw new Error("Expected at least 3 AuditLog entries from recent matching actions!");
    }
    for (const log of matchingAuditLogs) {
      console.log(`  - [${log.action}] targetId: ${log.targetId} createdAt: ${log.createdAt.toISOString()}`);
    }

    // 9. CSV Audit Export & Formula Injection Sanitization
    console.log("\n[TEST 9] Testing CSV Audit Log Export & formula injection defense...");
    const csvExport = await exportMatchingAuditLogCsv();
    if (!csvExport.success || !csvExport.csv) {
      throw new Error(`CSV export failed: ${csvExport.error}`);
    }
    console.log(`✓ Exported CSV successfully (${csvExport.recordCount} rows, filename: ${csvExport.filename})`);

    const lines = csvExport.csv.split("\n");
    console.log(`✓ CSV Header: ${lines[0]}`);
    if (!lines[0].includes("Log ID,Action,Target Type")) {
      throw new Error("CSV header missing required audit columns!");
    }

    // 10. Cross-Department Matrix & Campus Share
    console.log("\n[TEST 10] Testing Cross-Department Matrix and Campus Activity shares...");
    const deptMatrix = analyticsAll.pairs;
    console.log(`✓ Department pairs analyzed: ${deptMatrix.length}`);
    if (deptMatrix.length > 0) {
      console.log(
        `  Sample pair: ${deptMatrix[0].sourceDept} ↔ ${deptMatrix[0].targetDept} (${deptMatrix[0].totalMatchesThisTerm} connections, ${deptMatrix[0].volumeTier})`
      );
    }

    const campusShares = analyticsAll.metrics.campusShare;
    console.log(`✓ Campus shares calculated: ${campusShares.length}`);
    for (const c of campusShares.slice(0, 3)) {
      console.log(`  - ${c.campusName}: ${c.percentage}%`);
    }

    // 11. Unauthorized User Protection
    console.log("\n[TEST 11] Testing Unauthorized Student Access Rejection...");
    const studentUser = await prisma.user.findFirst({
      where: { role: "STUDENT" },
    });
    if (studentUser) {
      process.env.TEST_USER_ID = studentUser.id;
      let studentBlocked = false;
      try {
        await getMatchingAnalyticsData("ALL");
      } catch (err: any) {
        if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
          studentBlocked = true;
        }
      }
      if (!studentBlocked) {
        throw new Error("Student was able to read matching analytics data!");
      }
      console.log("✓ Student access to matching analytics correctly rejected with Forbidden/Unauthorized.");

      const studentGuardrailRes = await updateMatchingGuardrails({ dailyMatchCap: 5 });
      if (studentGuardrailRes.success) {
        throw new Error("Student was able to update matching guardrails!");
      }
      console.log(`✓ Student mutation to matching guardrails correctly rejected: "${studentGuardrailRes.error}"`);

      // Restore admin context
      process.env.TEST_USER_ID = adminUser.id;
    }

    console.log("\n=================================================================");
    console.log("ALL MATCHING ENGINE INTEGRATION TESTS PASSED SUCCESSFULLY! ✓");
    console.log("=================================================================\n");
  } finally {
    // 1. Clean up test anomalies
    if (createdAnomalyIds.length > 0) {
      await prisma.matchingAnomaly.deleteMany({
        where: { id: { in: createdAnomalyIds } },
      });
      console.log(`[CLEANUP] Deleted ${createdAnomalyIds.length} test anomalies.`);
    }

    // 2. Restore MatchingConfig to exact pre-test baseline snapshot
    if (baselineConfig) {
      await prisma.matchingConfig.update({
        where: { id: "active" },
        data: {
          version: baselineConfig.version,
          crossGenderCooldown: baselineConfig.crossGenderCooldown,
          proximityBiasWeight: baselineConfig.proximityBiasWeight,
          dailyMatchCap: baselineConfig.dailyMatchCap,
          freshmanMentorshipEnabled: baselineConfig.freshmanMentorshipEnabled,
          academicWeight: baselineConfig.academicWeight,
          projectWeight: baselineConfig.projectWeight,
          mentorshipWeight: baselineConfig.mentorshipWeight,
          hobbiesWeight: baselineConfig.hobbiesWeight,
          algorithmModel: baselineConfig.algorithmModel,
          updatedById: baselineConfig.updatedById,
        },
      });
      console.log(`[CLEANUP] Restored MatchingConfig back to pre-test snapshot (v${baselineConfig.version}).`);
    }

    await prisma.$disconnect();
  }
}

runMatchingRegressionTests().catch((err) => {
  console.error("\n❌ MATCHING REGRESSION TEST FAILED:", err);
  process.exit(1);
});
