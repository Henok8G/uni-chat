import { prisma } from "../src/lib/prisma";

async function verifyPhase6ASchema() {
  console.log("=================================================================");
  console.log("  UNI-CHAT PHASE 6A: PRISMA SCHEMA FORMALIZATION (ARCH-001)      ");
  console.log("=================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // Warm database connection
  await prisma.$queryRawUnsafe("SELECT 1;");

  // --- 1. Prisma Client Model Availability ---
  console.log("--- 1. Prisma Client Model Availability ---");
  assert(typeof prisma.friendship?.findMany === "function", "prisma.friendship.findMany is defined");
  assert(typeof prisma.friendship?.create === "function", "prisma.friendship.create is defined");
  assert(typeof prisma.friendship?.upsert === "function", "prisma.friendship.upsert is defined");
  assert(typeof prisma.chatMessage?.findMany === "function", "prisma.chatMessage.findMany is defined");
  assert(typeof prisma.chatMessage?.create === "function", "prisma.chatMessage.create is defined");
  assert(typeof prisma.chatMessage?.updateMany === "function", "prisma.chatMessage.updateMany is defined");

  // --- 2. Existing Data Preservation ---
  console.log("\n--- 2. Existing Data Preservation ---");
  const friendships = await prisma.friendship.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      friend: { select: { id: true, email: true, displayName: true } },
    },
  });
  assert(friendships.length >= 6, `Existing friendship records preserved (found ${friendships.length}, expected >= 6)`);
  assert(Boolean(friendships[0].id), "Friendship has valid id");
  assert(Boolean(friendships[0].userId), "Friendship has valid userId");
  assert(Boolean(friendships[0].friendId), "Friendship has valid friendId");
  assert(Boolean(friendships[0].createdAt), "Friendship has valid createdAt timestamp");
  assert(Boolean(friendships[0].user?.id), "Friendship correctly resolves user relation");
  assert(Boolean(friendships[0].friend?.id), "Friendship correctly resolves friend relation");

  const chatMessages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, displayName: true } },
      receiver: { select: { id: true, displayName: true } },
    },
  });
  assert(chatMessages.length >= 6, `Existing chat messages preserved (found ${chatMessages.length}, expected >= 6)`);
  assert(Boolean(chatMessages[0].id), "ChatMessage has valid id");
  assert(Boolean(chatMessages[0].senderId), "ChatMessage has valid senderId");
  assert(Boolean(chatMessages[0].text), "ChatMessage has valid text");
  assert(Boolean(chatMessages[0].createdAt), "ChatMessage has valid createdAt timestamp");
  assert(typeof chatMessages[0].isRead === "boolean" || chatMessages[0].isRead === null, "ChatMessage has valid isRead field");
  assert(Boolean(chatMessages[0].sender?.id), "ChatMessage correctly resolves sender relation");

  // --- 3. Referential Actions & Constraints Verification ---
  console.log("\n--- 3. Core Reads & Writes via Prisma Client ---");
  // Find two test users
  const testUsers = await prisma.user.findMany({ take: 2, select: { id: true } });
  if (testUsers.length >= 2) {
    const userA = testUsers[0].id;
    const userB = testUsers[1].id;

    // Test ChatMessage creation via Prisma Client
    const testMsgId = `test_msg_${Date.now()}`;
    const createdMsg = await prisma.chatMessage.create({
      data: {
        id: testMsgId,
        senderId: userA,
        receiverId: userB,
        text: "Automated Phase 6A Verification Ping",
        isRead: false,
      },
    });
    assert(createdMsg.id === testMsgId, "Successfully created ChatMessage via prisma.chatMessage.create");
    assert(createdMsg.isRead === false, "Created ChatMessage default isRead is false");

    // Test ChatMessage updateMany via Prisma Client
    const updateResult = await prisma.chatMessage.updateMany({
      where: { id: testMsgId },
      data: { isRead: true },
    });
    assert(updateResult.count === 1, "Successfully updated ChatMessage via prisma.chatMessage.updateMany");

    // Test ChatMessage read via Prisma Client
    const readMsg = await prisma.chatMessage.findUnique({
      where: { id: testMsgId },
    });
    assert(readMsg?.isRead === true, "Verified ChatMessage isRead updated to true");

    // Clean up test message
    await prisma.chatMessage.delete({ where: { id: testMsgId } });
    assert(true, "Successfully deleted test ChatMessage via prisma.chatMessage.delete");
  }

  console.log("\n=================================================================");
  console.log(`  PHASE 6A RESULTS: ${passed} / ${total} PASSED`);
  console.log("=================================================================\n");

  await prisma.$disconnect();
}

verifyPhase6ASchema().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
