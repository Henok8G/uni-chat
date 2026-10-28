import { prisma } from "../src/lib/prisma";

async function seedInitialGroupsAndEvents() {
  console.log("Starting DB sync for Groups and Upcoming Events...");

  // 1. Locate an admin or primary user to be the owner
  let user = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
  });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  if (!user) {
    console.error("No user found in database!");
    return;
  }
  console.log(`Using owner/author: ${user.email} (${user.id})`);

  // 2. Check / Seed Standard Community Groups
  const standardGroups = [
    {
      name: "5 Kilo Tech Hub",
      description: "Official tech innovation, coding, and engineering collaboration group for AAiT students.",
      category: "Academic & Tech",
      campus: "AAiT (5 Kilo)",
    },
    {
      name: "AAU Debate Club",
      description: "Competitive forensics, parliamentary debate, and public speaking society at Sidist Kilo.",
      category: "Academic & Debate",
      campus: "Sidist Kilo (Main)",
    },
    {
      name: "Creative Arts Community",
      description: "Music, visual design, photography, and cultural expression hub based at Yared School.",
      category: "Arts & Media",
      campus: "Yared School",
    },
    {
      name: "Bio-Med Innovators",
      description: "Clinical research, healthcare technology, and medical student community at Tikur Anbessa.",
      category: "Health & Sciences",
      campus: "CHS (Tikur Anbessa)",
    },
  ];

  for (const sg of standardGroups) {
    const existing = await prisma.group.findFirst({
      where: { name: sg.name },
    });
    if (!existing) {
      const created = await prisma.group.create({
        data: {
          name: sg.name,
          description: sg.description,
          category: sg.category,
          campus: sg.campus,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });
      console.log(`Created group: ${created.name} (id: ${created.id})`);
    } else {
      console.log(`Group already exists: ${existing.name}`);
    }
  }

  // 3. Check / Seed Upcoming Events
  const upcomingEvents = [
    {
      title: "Hackathon 2025 Registration",
      body: "Team registrations close midnight. 3 members per squad. Cash prizes, cloud compute credits, and internship fast-tracks for top 3 teams.",
      contentType: "EVENT" as const,
      status: "PUBLISHED" as const,
      isPinned: true,
      publishedAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    },
    {
      title: "Entrepreneurship Meetup",
      body: "Science Library Auditorium · Guest speaker from Gebeya Inc. discussing early stage tech funding, venture capital, and Ethiopian startup incubation.",
      contentType: "EVENT" as const,
      status: "PUBLISHED" as const,
      isPinned: false,
      publishedAt: new Date(Date.now() - 3600000 * 12),
    },
    {
      title: "Midterm Add/Drop Period",
      body: "Registrar portal closes 11:59 PM. Advisor sign-off required for departmental course prerequisite overrides and section changes.",
      contentType: "EVENT" as const,
      status: "PUBLISHED" as const,
      isPinned: false,
      publishedAt: new Date(Date.now() - 3600000 * 24),
    },
  ];

  for (const ev of upcomingEvents) {
    const existing = await prisma.post.findFirst({
      where: { title: ev.title },
    });
    if (!existing) {
      const created = await prisma.post.create({
        data: {
          title: ev.title,
          body: ev.body,
          contentType: ev.contentType,
          status: ev.status,
          isPinned: ev.isPinned,
          publishedAt: ev.publishedAt,
          authorId: user.id,
          authorType: "ADMIN",
        },
      });
      console.log(`Created event post: ${created.title} (id: ${created.id})`);
    } else {
      console.log(`Event post already exists: ${existing.title}`);
    }
  }

  const finalGroupCount = await prisma.group.count();
  const finalEventCount = await prisma.post.count({ where: { contentType: "EVENT", status: "PUBLISHED" } });
  console.log(`\nSync finished. Total groups in DB: ${finalGroupCount}, Total published events in DB: ${finalEventCount}`);
}

seedInitialGroupsAndEvents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
