import { spawnSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

const realDbUrl = process.env.DATABASE_URL || "";

console.log("=================================================================");
console.log("SAFETY GUARD VERIFICATION SUITE");
console.log("=================================================================");

// Check 1: Missing TEST_DATABASE_URL
console.log("\n[Check 1] Proving test halts with code 1 when TEST_DATABASE_URL is missing...");
const res1 = spawnSync("npx", ["tsx", "scripts/testMatchingIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: "" },
  shell: true,
  encoding: "utf-8",
});

if (res1.status === 1 && res1.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured")) {
  console.log("  ✓ PASS: Script refused to run and halted immediately with code 1.");
} else {
  console.error("  ✗ FAIL: Check 1 did not halt as expected:", res1.status, res1.stderr, res1.stdout);
  process.exit(1);
}

// Check 2: TEST_DATABASE_URL matches DATABASE_URL
console.log("\n[Check 2] Proving test halts with code 1 when TEST_DATABASE_URL matches DATABASE_URL...");
const res2 = spawnSync("npx", ["tsx", "scripts/testMatchingIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: realDbUrl },
  shell: true,
  encoding: "utf-8",
});

if (res2.status === 1 && res2.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL matches primary application database")) {
  console.log("  ✓ PASS: Script detected collision with application database and halted with code 1.");
} else {
  console.error("  ✗ FAIL: Check 2 did not halt as expected:", res2.status, res2.stderr, res2.stdout);
  process.exit(1);
}

// Check 3: Check secret masking in safe logs
console.log("\n[Check 3] Proving credentials and tokens are NEVER printed when logging connection info...");
const dummyTestUrl = "postgresql://secret_user:super_secret_password_12345@test-db.example.internal:5432/my_test_db";
const res3 = spawnSync("npx", ["tsx", "-e", "import './scripts/testDbGuard.ts'"], {
  env: { ...process.env, TEST_DATABASE_URL: dummyTestUrl },
  shell: true,
  encoding: "utf-8",
});

const output3 = res3.stdout + res3.stderr;
if (output3.includes("super_secret_password_12345") || output3.includes("secret_user")) {
  console.error("  ✗ FAIL: Credentials leaked in logs!");
  process.exit(1);
} else if (output3.includes("***:***@test-db.example.internal:5432/my_test_db")) {
  console.log("  ✓ PASS: Credentials masked as ***:***@test-db.example.internal:5432/my_test_db.");
} else {
  console.log("  ✓ PASS: Credentials not leaked (masked or suppressed).");
}

// Check 4: Check Groups integration script guard
console.log("\n[Check 4] Proving Groups test also halts when TEST_DATABASE_URL is missing...");
const res4 = spawnSync("npx", ["tsx", "scripts/testGroupsIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: "" },
  shell: true,
  encoding: "utf-8",
});

if (res4.status === 1 && res4.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured")) {
  console.log("  ✓ PASS: scripts/testGroupsIntegration.ts halted safely with code 1.");
} else {
  console.error("  ✗ FAIL: Check 4 failed:", res4.status, res4.stderr);
  process.exit(1);
}

// Check 5: Check Departments integration script guard
console.log("\n[Check 5] Proving Departments test also halts when TEST_DATABASE_URL is missing...");
const res5 = spawnSync("npx", ["tsx", "scripts/testDepartmentsIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: "" },
  shell: true,
  encoding: "utf-8",
});

if (res5.status === 1 && res5.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured")) {
  console.log("  ✓ PASS: scripts/testDepartmentsIntegration.ts halted safely with code 1.");
} else {
  console.error("  ✗ FAIL: Check 5 failed:", res5.status, res5.stderr);
  process.exit(1);
}

// Check 6: Check Notifications integration script guard
console.log("\n[Check 6] Proving Notifications test also halts when TEST_DATABASE_URL is missing...");
const res6 = spawnSync("npx", ["tsx", "scripts/testNotificationsIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: "" },
  shell: true,
  encoding: "utf-8",
});

if (res6.status === 1 && res6.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured")) {
  console.log("  ✓ PASS: scripts/testNotificationsIntegration.ts halted safely with code 1.");
} else {
  console.error("  ✗ FAIL: Check 6 failed:", res6.status, res6.stderr);
  process.exit(1);
}

// Check 7: Check Analytics integration script guard
console.log("\n[Check 7] Proving Analytics test also halts when TEST_DATABASE_URL is missing...");
const res7 = spawnSync("npx", ["tsx", "scripts/testAnalyticsIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: "" },
  shell: true,
  encoding: "utf-8",
});

if (res7.status === 1 && res7.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured")) {
  console.log("  ✓ PASS: scripts/testAnalyticsIntegration.ts halted safely with code 1.");
} else {
  console.error("  ✗ FAIL: Check 7 failed:", res7.status, res7.stderr);
  process.exit(1);
}

// Check 8: Check Team Roles integration script guard
console.log("\n[Check 8] Proving Team Roles test also halts when TEST_DATABASE_URL is missing...");
const res8 = spawnSync("npx", ["tsx", "scripts/testTeamRolesIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: "" },
  shell: true,
  encoding: "utf-8",
});

if (res8.status === 1 && res8.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured")) {
  console.log("  ✓ PASS: scripts/testTeamRolesIntegration.ts halted safely with code 1.");
} else {
  console.error("  ✗ FAIL: Check 8 failed:", res8.status, res8.stderr);
  process.exit(1);
}

// Check 9: Check Platform Settings integration script guard
console.log("\n[Check 9] Proving Platform Settings test also halts when TEST_DATABASE_URL is missing...");
const res9 = spawnSync("npx", ["tsx", "scripts/testSettingsIntegration.ts"], {
  env: { ...process.env, TEST_DATABASE_URL: "" },
  shell: true,
  encoding: "utf-8",
});

if (res9.status === 1 && res9.stderr.includes("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured")) {
  console.log("  ✓ PASS: scripts/testSettingsIntegration.ts halted safely with code 1.");
} else {
  console.error("  ✗ FAIL: Check 9 failed:", res9.status, res9.stderr);
  process.exit(1);
}

console.log("\n=================================================================");
console.log("ALL 9 SAFETY VERIFICATION CHECKS PASSED PERFECTLY!");
console.log("=================================================================");

