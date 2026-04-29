const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const allowedDomains = ["aau.edu.et", "aastu.edu.et", "astu.edu.et"];

  console.log("Cleaning up universities not in allowed list:", allowedDomains);

  // Delete all users that belong to universities not in the allowed list
  // Actually, wait: maybe we just want to delete the universities, but what if there are users?
  // Since it's a dev version, we can delete users and universities.
  await prisma.user.deleteMany({
    where: {
      university: {
        domain: {
          notIn: allowedDomains
        }
      }
    }
  });

  const deleteResult = await prisma.university.deleteMany({
    where: {
      domain: {
        notIn: allowedDomains,
      },
    },
  });

  console.log(`Deleted ${deleteResult.count} unallowed universities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
