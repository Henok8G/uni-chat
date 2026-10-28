import { enforceTestDatabase } from "./testDbGuard";
import { prisma } from "../src/lib/prisma";
import {
  updatePlatformSettings,
  purgePlatformEphemeralCache,
  toggleEmergencyBroadcastMode,
} from "../src/app/admin/settingsActions";
import {
  getActivePlatformConfig,
  updateActivePlatformConfig,
  resetPlatformConfigForTesting,
} from "../src/lib/platformConfig";

async function runSettingsIntegrationSuite() {
  console.log("=================================================================");
  console.log("SCREEN_6 PLATFORM SETTINGS & SECURITY INTEGRATION SUITE");
  console.log("=================================================================\n");

  // STRICT REWATCH SAFETY GUARD
  enforceTestDatabase();

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Locate Super Admin
  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });
  assert(Boolean(admin), `Found Super Admin account for testing: ${admin?.email}`);
  process.env.TEST_USER_ID = admin!.id;

  const baseline = getActivePlatformConfig();

  try {
    // [Test 1] Validate bounds enforcement (reject invalid session hours)
    console.log("\n[Test 1] Testing server-side validation on invalid configuration parameters...");
    let rejectedNegative = false;
    try {
      await updatePlatformSettings({ staffSessionHours: -5 });
    } catch {
      rejectedNegative = true;
    }
    assert(rejectedNegative, "Rejected negative staffSessionHours (-5)");

    let rejectedExcessive = false;
    try {
      await updatePlatformSettings({ staffSessionHours: 500 });
    } catch {
      rejectedExcessive = true;
    }
    assert(rejectedExcessive, "Rejected excessive staffSessionHours (500 > 72h max)");

    // [Test 2] Update configuration and check version increment
    console.log("\n[Test 2] Testing successful configuration update and version increment...");
    const updateRes = await updatePlatformSettings({
      crossCampusPeerDiscovery: false,
      intraCampusProximityPriority: true,
      staffSessionHours: 12,
    });
    assert(updateRes.success, "Configuration update returned success");
    assert(updateRes.version > baseline.version, `Version auto-incremented from v${baseline.version} to v${updateRes.version}`);

    // Verify in-memory and persistent active config
    const current = getActivePlatformConfig();
    assert(current.crossCampusPeerDiscovery === false, "crossCampusPeerDiscovery is now false");
    assert(current.staffSessionHours === 12, "staffSessionHours is now 12");

    // [Test 3] Emergency Broadcast-Only Mode
    console.log("\n[Test 3] Testing Emergency Broadcast-Only Mode toggle...");
    const enableRes = await toggleEmergencyBroadcastMode(true, "Scheduled Network Maintenance");
    assert(enableRes.broadcastOnlyMode === true, "Broadcast-only mode enabled");

    const disableRes = await toggleEmergencyBroadcastMode(false);
    assert(disableRes.broadcastOnlyMode === false, "Broadcast-only mode disabled");

    // [Test 4] Cache Purge Operation
    console.log("\n[Test 4] Testing safe ephemeral cache purge...");
    const purgeRes = await purgePlatformEphemeralCache();
    assert(purgeRes.success, `Cache purge returned success: '${purgeRes.message}'`);

    // [Test 5] Verify AuditLog Records
    console.log("\n[Test 5] Verifying AuditLog recorded all privileged operations...");
    const settingsAudit = await prisma.auditLog.findFirst({
      where: {
        adminId: admin!.id,
        action: "UPDATE_PLATFORM_SETTINGS",
      },
      orderBy: { createdAt: "desc" },
    });
    assert(Boolean(settingsAudit), "Found immutable AuditLog record for UPDATE_PLATFORM_SETTINGS");

    const broadcastAudit = await prisma.auditLog.findFirst({
      where: {
        adminId: admin!.id,
        action: "TOGGLE_EMERGENCY_BROADCAST_MODE",
      },
      orderBy: { createdAt: "desc" },
    });
    assert(Boolean(broadcastAudit), "Found immutable AuditLog record for TOGGLE_EMERGENCY_BROADCAST_MODE");

    const cacheAudit = await prisma.auditLog.findFirst({
      where: {
        adminId: admin!.id,
        action: "PURGE_SYSTEM_CACHE",
      },
      orderBy: { createdAt: "desc" },
    });
    assert(Boolean(cacheAudit), "Found immutable AuditLog record for PURGE_SYSTEM_CACHE");

  } finally {
    // Restore baseline configuration
    console.log("\n[Cleanup] Restoring baseline configuration snapshot...");
    updateActivePlatformConfig(baseline, "system-restore@ethiunichat.com");
    delete process.env.TEST_USER_ID;
  }

  console.log("\n=================================================================");
  console.log(`ALL ${passed}/${total} SETTINGS INTEGRATION TESTS PASSED!`);
  console.log("=================================================================\n");
}

runSettingsIntegrationSuite()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
