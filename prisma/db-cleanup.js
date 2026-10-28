const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const allowedDomains = ["aau.edu.et"];

  console.log("Cleaning up universities not in allowed list:", allowedDomains);

  const unallowedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { university: { domain: { notIn: allowedDomains } } },
        { email: { not: { endsWith: "@aau.edu.et" } } }
      ]
    },
    select: { id: true, email: true }
  });

  const unallowedUserIds = unallowedUsers.map((u) => u.id);
  console.log(`Found ${unallowedUserIds.length} users outside allowed domains (${allowedDomains}):`, unallowedUsers.map(u => u.email));

  if (unallowedUserIds.length > 0) {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { adminId: { in: unallowedUserIds } },
          { targetId: { in: unallowedUserIds } }
        ]
      }
    });

    await prisma.adminRoleAssignment.deleteMany({
      where: {
        OR: [
          { userId: { in: unallowedUserIds } },
          { grantedById: { in: unallowedUserIds } }
        ]
      }
    });

    await prisma.moderationAction.deleteMany({
      where: {
        OR: [
          { userId: { in: unallowedUserIds } },
          { adminId: { in: unallowedUserIds } }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: unallowedUserIds }
      }
    });
    console.log(`Deleted ${unallowedUserIds.length} unallowed users.`);
  }

  const deleteResult = await prisma.university.deleteMany({
    where: {
      domain: {
        notIn: allowedDomains,
      },
    },
  });

  console.log(`Deleted ${deleteResult.count} unallowed universities.`);
  const remaining = await prisma.university.findMany();
  console.log("Remaining universities in database:", remaining.map(u => `${u.name} (${u.domain})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
