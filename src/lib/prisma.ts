import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// In development, ensure the cached PrismaClient has the latest models
if (
  global.prisma &&
  (!(global.prisma as any).department ||
    !(global.prisma as any).departmentDelegate ||
    !(global.prisma as any).matchingConfig ||
    !(global.prisma as any).friendship ||
    !(global.prisma as any).chatMessage ||
    !(global.prisma as any).friendRequest)
) {
  try {
    (global.prisma as any).$disconnect();
  } catch {}
  delete (global as any).prisma;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasources: process.env.TEST_DATABASE_URL
      ? { db: { url: process.env.TEST_DATABASE_URL } }
      : undefined,
    log: process.env.DEBUG_PRISMA === "true" ? ["query", "error", "warn"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
