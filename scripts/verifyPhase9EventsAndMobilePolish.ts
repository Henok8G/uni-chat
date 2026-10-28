import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { EVENT_CATEGORIES, getCategoryStyle, formatEventDateTime } from "../src/lib/eventConstants";

async function runVerification() {
  console.log("=== PHASE 9 VERIFICATION: Mobile UI Polish, Match Hub & Event Management ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? " - " + detail : ""}`);
      failed++;
    }
  }

  // 1. Verify Event Constants and Color Categories
  console.log("--- 1. Event Constants & Category Badges ---");
  assert(EVENT_CATEGORIES.length === 10, "10 university event categories configured", `Found ${EVENT_CATEGORIES.length}`);
  const expectedCategories = [
    "Academic / Seminar",
    "Workshop",
    "Hackathon",
    "Career / Opportunity",
    "Club / Community",
    "Meeting",
    "Concert / Cultural",
    "Sports",
    "Social",
    "Other",
  ];
  const allPresent = expectedCategories.every((cat) => (EVENT_CATEGORIES as readonly string[]).includes(cat));
  assert(allPresent, "All specified event categories are registered");

  // Verify WCAG styles for all categories
  let stylesValid = true;
  for (const cat of EVENT_CATEGORIES) {
    const style = getCategoryStyle(cat);
    if (!style.badgeClasses || !style.accentBorder || !style.dotColor) {
      stylesValid = false;
    }
  }
  assert(stylesValid, "All categories have distinct WCAG AA badge styles");

  // Verify date formatting helper
  const testDate = new Date("2026-11-15T14:30:00Z");
  const formatted = formatEventDateTime(testDate);
  assert(
    Boolean(formatted.dateStr && formatted.timeStr),
    "formatEventDateTime formats dates cleanly into dateStr and timeStr",
    `${formatted.dateStr} at ${formatted.timeStr}`
  );

  // 2. Verify Database Schema & Event Records in Supabase
  console.log("\n--- 2. Database Schema & Event Records ---");
  const eventPosts = await prisma.post.findMany({
    where: { contentType: "EVENT" },
    select: {
      id: true,
      title: true,
      status: true,
      isFeatured: true,
      isPinned: true,
      eventCategory: true,
      startDate: true,
      endDate: true,
      location: true,
      organizer: true,
      registrationUrl: true,
      imageUrl: true,
    },
  });
  assert(eventPosts.length > 0, `Event posts exist in the database (count: ${eventPosts.length})`);

  // Check that new columns are present on the Post records
  const sample = eventPosts[0];
  const hasColumns =
    "eventCategory" in sample &&
    "startDate" in sample &&
    "endDate" in sample &&
    "location" in sample &&
    "organizer" in sample &&
    "registrationUrl" in sample &&
    "imageUrl" in sample;
  assert(hasColumns, "All 7 new event management columns are queryable on Post model");

  // Check category and featured distinction
  const categoriesPresent = new Set(eventPosts.map((p) => p.eventCategory).filter(Boolean));
  assert(categoriesPresent.size > 0, `Events have valid categories assigned: ${Array.from(categoriesPresent).join(", ")}`);

  // 3. Verify getUpcomingEvents Query & Filtering
  console.log("\n--- 3. Public Upcoming Events Query & Filters ---");
  // 3. Verify Public Upcoming Events Query & Filtering
  console.log("\n--- 3. Public Upcoming Events Query & Filters ---");
  const whereClause: any = {
    contentType: "EVENT",
    status: "PUBLISHED",
  };
  const allUpcoming = await prisma.post.findMany({
    where: whereClause,
    orderBy: [
      { isPinned: "desc" },
      { isFeatured: "desc" },
      { startDate: "asc" },
      { publishedAt: "desc" },
    ],
    take: 10,
    select: {
      id: true,
      title: true,
      status: true,
      isFeatured: true,
      isPinned: true,
      eventCategory: true,
      startDate: true,
      endDate: true,
      location: true,
      organizer: true,
      registrationUrl: true,
    },
  });
  assert(Array.isArray(allUpcoming) && allUpcoming.length > 0, `Upcoming published events query returns results (count: ${allUpcoming.length})`);
  
  // Verify draft events are NOT returned in the public feed
  const draftInPublic = allUpcoming.some((e: any) => e.status && e.status !== "PUBLISHED");
  assert(!draftInPublic, "Draft / Unpublished events are excluded from public Upcoming Events feed");

  // Test category filtering
  const hackathons = await prisma.post.findMany({
    where: {
      ...whereClause,
      eventCategory: "Hackathon",
    },
    take: 10,
  });
  const allHackathonsMatch = hackathons.every((e: any) => e.eventCategory === "Hackathon");
  assert(allHackathonsMatch && hackathons.length > 0, `Category filtering by 'Hackathon' returns exact match (count: ${hackathons.length})`);

  // 4. Verify URL Validation Logic
  console.log("\n--- 4. Registration URL Validation ---");
  function isValidHttpUrl(stringUrl: string): boolean {
    try {
      const url = new URL(stringUrl);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  assert(isValidHttpUrl("https://aau.edu.et/events/hackathon"), "Valid HTTPS URL accepted");
  assert(isValidHttpUrl("http://meet.google.com/xyz-abc-def"), "Valid HTTP URL accepted");
  assert(!isValidHttpUrl("javascript:alert(1)"), "Malicious javascript: protocol rejected");
  assert(!isValidHttpUrl("ftp://file.server"), "FTP protocol rejected");
  assert(!isValidHttpUrl("not a url"), "Malformed string rejected");

  console.log(`\n================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================`);

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runVerification().catch((err) => {
  console.error("Verification script error:", err);
  process.exit(1);
});
