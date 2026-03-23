const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const universitiesPath = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "universities.json",
  );

  if (!fs.existsSync(universitiesPath)) {
    console.warn(
      `universities.json not found at ${universitiesPath}. Skipping university seed.`,
    );
    return;
  }

  const raw = fs.readFileSync(universitiesPath, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error("universities.json must export an array of universities");
  }

  for (const uni of data) {
    if (!uni.name || !uni.domain) continue;

    await prisma.university.upsert({
      where: { domain: uni.domain },
      update: { name: uni.name },
      create: {
        name: uni.name,
        domain: uni.domain,
      },
    });
  }

  console.log(`Seeded ${data.length} universities (upserted by domain).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

