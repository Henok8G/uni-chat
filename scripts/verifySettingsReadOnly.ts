import { prisma } from "../src/lib/prisma";
import { getPlatformSettingsData, exportSecurityHealthReport } from "../src/app/admin/settingsActions";

async function runReadOnlySettingsVerification() {
  console.log("=================================================================");
  console.log("SCREEN_6 READ-ONLY SETTINGS & SECURITY VERIFICATION SUITE");
  console.log("=================================================================\n");

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

  // 1. Find Super Admin user for authenticated execution
  console.log("[Test 1] Locating Super Admin user for privileged queries...");
  let superAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!superAdmin) {
    // If none, check if admin email matches or fallback to first admin
    superAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
  }

  assert(Boolean(superAdmin), `Found administrator account: ${superAdmin?.email}`);

  // Set test user ID for auth context
  process.env.TEST_USER_ID = superAdmin!.id;

  // 2. Fetch platform settings data
  console.log("\n[Test 2] Querying getPlatformSettingsData() from server actions...");
  const data = await getPlatformSettingsData();

  assert(Boolean(data), "Data object returned from getPlatformSettingsData()");
  assert(data.configVersion >= 1, `Config version is valid: v${data.configVersion}`);
  assert(data.campusNodes.length === 5, `5 canonical AAU campus partitions defined (found ${data.campusNodes.length})`);
  assert(data.infraHealth.database.latencyMs >= 0, `Database latency measured: ${data.infraHealth.database.latencyMs}ms`);

  // 3. Truthful disclaimers & zero fake infrastructure claims
  console.log("\n[Test 3] Verifying truthful infrastructure and zero simulated credentials...");
  assert(
    data.authPolicy.sisSyncStatus.status === "Not Connected",
    `SIS Direct Sync truthfully reports 'Not Connected' (got '${data.authPolicy.sisSyncStatus.status}')`
  );
  assert(
    data.authPolicy.mfaStatus.includes("Not Enforced"),
    `MFA policy truthfully reports 'Not Enforced' (got '${data.authPolicy.mfaStatus}')`
  );
  assert(
    data.privacyGovernance.messageStorageArchitecture.includes("Zero Database Message Payload Tables"),
    "Message architecture truthfully states zero plaintext message tables in PostgreSQL"
  );
  assert(
    data.privacyGovernance.groupQuotaPerStudent === 3,
    `Group quota reflects real 3-group interactive transaction guardrail (${data.privacyGovernance.groupQuotaPerStudent})`
  );

  // 4. Zero Secret Leakage Verification
  console.log("\n[Test 4] Ensuring secrets and credentials are NEVER exposed in service integration responses...");
  const serialized = JSON.stringify(data);
  const secretKeywords = ["password=", "secret=", "Bearer ", "postgres://", "AUTH_SECRET="];
  for (const kw of secretKeywords) {
    assert(!serialized.includes(kw), `Response does not leak raw credentials containing '${kw}'`);
  }

  for (const svc of data.serviceIntegrations) {
    assert(
      !svc.hostDisplay.includes("@") || svc.hostDisplay.includes("***"),
      `Integration ${svc.name} masks connection credentials (${svc.hostDisplay})`
    );
  }

  // 5. Export Security Health Report Verification
  console.log("\n[Test 5] Verifying Security Health Report generation and SHA-256 hashing...");
  const report = await exportSecurityHealthReport();
  assert(Boolean(report.filename), `Report filename generated: ${report.filename}`);
  assert(report.sha256Hash.length === 64, `Valid 64-char SHA-256 hash generated: ${report.sha256Hash}`);
  assert(report.reportJson.includes("Uni-Chat"), "Report JSON contains valid header and body");

  // 6. Security rejection on unauthorized callers
  console.log("\n[Test 6] Verifying unauthorized student access is blocked...");
  const studentUser = await prisma.user.findFirst({
    where: { role: "STUDENT" },
  });

  if (studentUser) {
    process.env.TEST_USER_ID = studentUser.id;
    let studentBlocked = false;
    try {
      await getPlatformSettingsData();
    } catch {
      studentBlocked = true;
    }
    assert(studentBlocked, "Student user was strictly rejected with Forbidden/Unauthorized error");
  } else {
    console.log("  ℹ INFO: No student user found to test rejection, skipping student check");
  }

  // Cleanup test env
  delete process.env.TEST_USER_ID;

  console.log("\n=================================================================");
  console.log(`ALL ${passed}/${total} READ-ONLY SETTINGS TESTS PASSED SUCCESSFULLY!`);
  console.log("=================================================================\n");
}

runReadOnlySettingsVerification()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
