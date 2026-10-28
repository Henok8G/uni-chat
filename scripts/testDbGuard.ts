import { PrismaClient } from "@prisma/client";

/**
 * scripts/testDbGuard.ts
 *
 * Enforces dedicated test database isolation for all mutation-based integration tests.
 * 
 * Safety Guarantees:
 * 1. Halts execution immediately if TEST_DATABASE_URL is missing or empty.
 * 2. Halts execution if TEST_DATABASE_URL matches DATABASE_URL or DIRECT_URL.
 * 3. Never prints passwords, tokens, or credentials to stdout/stderr.
 * 4. Ensures all PrismaClient instances connect strictly to the test database.
 */

export function enforceTestDatabase(): string {
  const rawTestUrl = process.env.TEST_DATABASE_URL?.trim();
  const rawAppDbUrl = process.env.DATABASE_URL?.trim();
  const rawDirectUrl = process.env.DIRECT_URL?.trim();

  // 1. Must be configured
  if (!rawTestUrl) {
    console.error("\n=================================================================");
    console.error("FATAL SAFETY HALT: TEST_DATABASE_URL is not configured.");
    console.error("=================================================================");
    console.error("Mutation-based integration tests are strictly prohibited from running");
    console.error("against the active development or production database.");
    console.error("");
    console.error("To run integration tests, you MUST configure TEST_DATABASE_URL pointing");
    console.error("to an isolated, dedicated test database.");
    console.error("Example: TEST_DATABASE_URL=\"postgresql://user:pass@localhost:5432/test_db\"");
    console.error("=================================================================\n");
    process.exit(1);
  }

  // 2. Must not match primary application database
  if (
    rawTestUrl === rawAppDbUrl ||
    (rawDirectUrl && rawTestUrl === rawDirectUrl)
  ) {
    console.error("\n=================================================================");
    console.error("FATAL SAFETY HALT: TEST_DATABASE_URL matches primary application database.");
    console.error("=================================================================");
    console.error("TEST_DATABASE_URL points to the same database as DATABASE_URL or DIRECT_URL.");
    console.error("A dedicated, isolated test database is required to prevent data contamination.");
    console.error("=================================================================\n");
    process.exit(1);
  }

  // 3. Safe, credential-masked logging
  try {
    const parsed = new URL(rawTestUrl);
    console.log(
      `[TEST HARNESS] Isolated test database verified: ${parsed.protocol}//***:***@${parsed.host}${parsed.pathname} (Credentials masked)`
    );
  } catch {
    console.log(
      "[TEST HARNESS] Isolated test database verified from TEST_DATABASE_URL (Credentials masked)"
    );
  }

  // 4. Force DATABASE_URL to TEST_DATABASE_URL for all imported application modules
  process.env.DATABASE_URL = rawTestUrl;
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";

  // 5. Invalidate cached global.prisma if it exists
  if (typeof global !== "undefined" && (global as any).prisma) {
    try {
      (global as any).prisma.$disconnect();
    } catch {}
    delete (global as any).prisma;
  }

  return rawTestUrl;
}

// Automatically enforce on import
enforceTestDatabase();
