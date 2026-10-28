import { prisma } from "../src/lib/prisma";
import {
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  sendChatMessage,
} from "../src/lib/chatService";

async function runPhase6BVerification() {
  console.log("=================================================================");
  console.log("  UNI-CHAT PHASE 6B: MUTUAL FRIENDSHIP REQUEST SYSTEM (MATCH-002) ");
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

  // --- 1. Prisma Client & Model Availability ---
  console.log("--- 1. Prisma Client & Schema Availability ---");
  assert(typeof prisma.friendRequest?.findUnique === "function", "prisma.friendRequest.findUnique is available");
  assert(typeof prisma.friendRequest?.create === "function", "prisma.friendRequest.create is available");
  assert(typeof prisma.friendRequest?.update === "function", "prisma.friendRequest.update is available");
  assert(typeof prisma.friendRequest?.findMany === "function", "prisma.friendRequest.findMany is available");
  assert(typeof prisma.friendship?.upsert === "function", "prisma.friendship.upsert is available");

  // --- 2. Existing Data Preservation Baseline ---
  console.log("\n--- 2. Existing Data Preservation Baseline ---");
  const baselineFriendships = await prisma.friendship.count();
  const baselineMessages = await prisma.chatMessage.count();
  console.log(`  Found ${baselineFriendships} legacy friendships and ${baselineMessages} chat messages.`);
  assert(baselineFriendships >= 6, `Legacy friendships preserved (expected >= 6, got ${baselineFriendships})`);
  assert(baselineMessages >= 6, `Legacy chat messages preserved (expected >= 6, got ${baselineMessages})`);

  // --- 3. Test Fixtures Setup ---
  console.log("\n--- 3. Setting Up Test Fixtures ---");
  const prefix = `test_p6b_${Date.now()}`;
  const users = {
    alice: await prisma.user.create({
      data: {
        id: `${prefix}_alice`,
        email: `${prefix}_alice@aau.edu.et`,
        passwordHash: "dummy_hashed_password",
        displayName: "Alice Test",
        department: "Computer Science",
        year: 3,
        emailVerified: true,
        banned: false,
      },
    }),
    bob: await prisma.user.create({
      data: {
        id: `${prefix}_bob`,
        email: `${prefix}_bob@aau.edu.et`,
        passwordHash: "dummy_hashed_password",
        displayName: "Bob Test",
        department: "Software Engineering",
        year: 2,
        emailVerified: true,
        banned: false,
      },
    }),
    charlie: await prisma.user.create({
      data: {
        id: `${prefix}_charlie`,
        email: `${prefix}_charlie@aau.edu.et`,
        passwordHash: "dummy_hashed_password",
        displayName: "Charlie Test",
        department: "Electrical Engineering",
        year: 4,
        emailVerified: true,
        banned: false,
      },
    }),
    eve: await prisma.user.create({
      data: {
        id: `${prefix}_eve`,
        email: `${prefix}_eve@aau.edu.et`,
        passwordHash: "dummy_hashed_password",
        displayName: "Eve Test",
        department: "Physics",
        year: 1,
        emailVerified: true,
        banned: false,
      },
    }),
    bannedUser: await prisma.user.create({
      data: {
        id: `${prefix}_banned`,
        email: `${prefix}_banned@aau.edu.et`,
        passwordHash: "dummy_hashed_password",
        displayName: "Banned Student",
        department: "Chemistry",
        year: 2,
        emailVerified: true,
        banned: true,
      },
    }),
    unverifiedUser: await prisma.user.create({
      data: {
        id: `${prefix}_unverified`,
        email: `${prefix}_unverified@aau.edu.et`,
        passwordHash: "dummy_hashed_password",
        displayName: "Unverified Student",
        department: "Biology",
        year: 1,
        emailVerified: false,
        banned: false,
      },
    }),
  };
  console.log("  Created 6 test fixture accounts.");

  try {
    // --- 4. Eligibility & Validation Checks ---
    console.log("\n--- 4. Eligibility & Validation Checks ---");
    // Self request
    const selfRes = await sendFriendRequest(users.alice.id, users.alice.id);
    assert(!selfRes.success, "Self-request rejected");
    assert(selfRes.error?.includes("yourself") ?? false, "Error message correctly explains self-request rejection");

    // Banned sender
    const bannedRes = await sendFriendRequest(users.bannedUser.id, users.bob.id);
    assert(!bannedRes.success, "Banned sender rejected");
    assert(bannedRes.error?.includes("banned") ?? false, "Error indicates account banned");

    // Unverified sender
    const unverifiedRes = await sendFriendRequest(users.unverifiedUser.id, users.bob.id);
    assert(!unverifiedRes.success, "Unverified sender rejected");
    assert(unverifiedRes.error?.includes("verified") ?? false, "Error indicates email verification requirement");

    // Banned recipient
    const toBannedRes = await sendFriendRequest(users.alice.id, users.bannedUser.id);
    assert(!toBannedRes.success, "Request to banned recipient rejected");

    // --- 5. Request Creation & Pending Status ---
    console.log("\n--- 5. Request Creation & Pending Status ---");
    const reqRes = await sendFriendRequest(users.alice.id, users.bob.id);
    assert(reqRes.success, "Alice -> Bob friend request successfully created");
    assert(reqRes.status === "PENDING", "Request created with PENDING status");

    // Friendship record must NOT exist yet!
    const earlyFriendship = await prisma.friendship.findFirst({
      where: { userId: users.alice.id, friendId: users.bob.id },
    });
    assert(earlyFriendship === null, "Friendship database record NOT created on mere request");

    // Query friendship status
    const aliceStatus = await getFriendshipStatus(users.alice.id, users.bob.id);
    assert(!aliceStatus.isFriend, "Alice is not yet friends with Bob");
    assert(Boolean(aliceStatus.pendingSent), "Alice sees pendingSent: true");
    assert(Boolean(aliceStatus.requestId), "Alice gets requestId reference");

    const bobStatus = await getFriendshipStatus(users.bob.id, users.alice.id);
    assert(!bobStatus.isFriend, "Bob is not yet friends with Alice");
    assert(Boolean(bobStatus.pendingReceived), "Bob sees pendingReceived: true");
    assert(bobStatus.requestId === aliceStatus.requestId, "Bob and Alice reference identical requestId");

    // Verify Notification created for Bob
    const bobNotifs = await prisma.notification.findMany({
      where: { userId: users.bob.id, type: "FRIEND_REQUEST" },
    });
    assert(bobNotifs.length >= 1, "Bob received FRIEND_REQUEST notification");
    assert(bobNotifs[0].title.includes("Friend Request"), "Notification title is descriptive");

    // Pending requests queries
    const bobsReceived = await getReceivedFriendRequests(users.bob.id);
    assert(bobsReceived.some((r) => r.senderId === users.alice.id), "Bob's received requests list includes Alice");

    const alicesSent = await getSentFriendRequests(users.alice.id);
    assert(alicesSent.some((r) => r.receiverId === users.bob.id), "Alice's sent requests list includes Bob");

    // --- 6. Duplicate Protection (Same & Reverse) ---
    console.log("\n--- 6. Duplicate Request Protection ---");
    const dupRes = await sendFriendRequest(users.alice.id, users.bob.id);
    assert(dupRes.success, "Duplicate request call handled gracefully");
    assert(dupRes.status === "PENDING", "Duplicate request reports already pending");

    const totalAliceBobRequests = await prisma.friendRequest.count({
      where: { senderId: users.alice.id, receiverId: users.bob.id },
    });
    assert(totalAliceBobRequests === 1, "Unique database constraint strictly prevents duplicate pending rows");

    // --- 7. Authorization & Security Enforcement ---
    console.log("\n--- 7. Authorization & IDOR Security Enforcement ---");
    const requestId = aliceStatus.requestId!;

    // Unauthorized third-party (Eve) attempts to accept
    const eveAccept = await acceptFriendRequest(requestId, users.eve.id);
    assert(!eveAccept.success, "Unauthorized third party (Eve) CANNOT accept request");
    assert(eveAccept.error?.includes("Unauthorized") ?? false, "Error message states unauthorized recipient");

    // Sender (Alice) attempts to accept her own request
    const aliceAccept = await acceptFriendRequest(requestId, users.alice.id);
    assert(!aliceAccept.success, "Sender (Alice) CANNOT accept her own request");

    // Unauthorized third-party (Eve) attempts to decline
    const eveDecline = await declineFriendRequest(requestId, users.eve.id);
    assert(!eveDecline.success, "Unauthorized third party (Eve) CANNOT decline request");

    // --- 8. Recipient Acceptance & Mutual Connection ---
    console.log("\n--- 8. Recipient Acceptance & Mutual Connection ---");
    const bobAccept = await acceptFriendRequest(requestId, users.bob.id);
    assert(bobAccept.success, "Intended recipient (Bob) accepts request successfully");

    // Request status updated
    const updatedReq = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    assert(updatedReq?.status === "ACCEPTED", "Request status transitioned to ACCEPTED");

    // Check reciprocal friendships created
    const aliceToBob = await prisma.friendship.findFirst({
      where: { userId: users.alice.id, friendId: users.bob.id },
    });
    assert(aliceToBob !== null, "Reciprocal friendship (Alice -> Bob) established in database");

    const bobToAlice = await prisma.friendship.findFirst({
      where: { userId: users.bob.id, friendId: users.alice.id },
    });
    assert(bobToAlice !== null, "Reciprocal friendship (Bob -> Alice) established in database");

    // Notification created for Alice confirming acceptance
    const aliceNotifs = await prisma.notification.findMany({
      where: { userId: users.alice.id, type: "FRIEND_REQUEST" },
    });
    assert(aliceNotifs.some((n) => n.title.includes("Accepted")), "Alice received acceptance notification");

    // Real-time status query reflects friendship
    const aliceStatusAfter = await getFriendshipStatus(users.alice.id, users.bob.id);
    assert(aliceStatusAfter.isFriend === true, "Alice status reflects isFriend: true");

    const bobStatusAfter = await getFriendshipStatus(users.bob.id, users.alice.id);
    assert(bobStatusAfter.isFriend === true, "Bob status reflects isFriend: true");

    // Idempotent repeated accept
    const repeatAccept = await acceptFriendRequest(requestId, users.bob.id);
    assert(repeatAccept.success, "Repeated accept call is idempotent");

    // --- 9. Decline Lifecycle ---
    console.log("\n--- 9. Decline Lifecycle ---");
    const reqCharlie = await sendFriendRequest(users.alice.id, users.charlie.id);
    assert(reqCharlie.success, "Alice -> Charlie request sent");

    const charlieStatus = await getFriendshipStatus(users.charlie.id, users.alice.id);
    assert(charlieStatus.pendingReceived === true, "Charlie sees pendingReceived: true");

    const charlieDecline = await declineFriendRequest(charlieStatus.requestId!, users.charlie.id);
    assert(charlieDecline.success, "Charlie declined request successfully");

    const charlieReqDb = await prisma.friendRequest.findUnique({ where: { id: charlieStatus.requestId! } });
    assert(charlieReqDb?.status === "DECLINED", "Request status transitioned to DECLINED");

    const charlieFriendship = await prisma.friendship.findFirst({
      where: { userId: users.alice.id, friendId: users.charlie.id },
    });
    assert(charlieFriendship === null, "Declined request NEVER creates friendship record");

    // Idempotent decline
    const repeatDecline = await declineFriendRequest(charlieStatus.requestId!, users.charlie.id);
    assert(repeatDecline.success, "Repeated decline call is idempotent");

    // Re-opening declined request
    const reopenRes = await sendFriendRequest(users.alice.id, users.charlie.id);
    assert(reopenRes.success, "Alice can re-send request to Charlie after decline");
    assert(reopenRes.status === "PENDING", "Re-opened request status is PENDING");

    // --- 10. Cancellation Lifecycle ---
    console.log("\n--- 10. Cancellation Lifecycle ---");
    const charlieStatus2 = await getFriendshipStatus(users.charlie.id, users.alice.id);
    const cancelRes = await cancelFriendRequest(charlieStatus2.requestId!, users.alice.id);
    assert(cancelRes.success, "Alice (sender) can cancel her own sent request");

    const cancelDb = await prisma.friendRequest.findUnique({ where: { id: charlieStatus2.requestId! } });
    assert(cancelDb?.status === "CANCELLED", "Request status transitioned to CANCELLED");

    // --- 11. Simultaneous Reciprocal Request Resolution ---
    console.log("\n--- 11. Simultaneous Reciprocal Requests ---");
    // Eve sends request to Charlie
    const eveToCharlie = await sendFriendRequest(users.eve.id, users.charlie.id);
    assert(eveToCharlie.success, "Eve sent request to Charlie (PENDING)");

    // Charlie simultaneously sends request to Eve (without explicitly clicking accept on Eve's request)
    const charlieToEve = await sendFriendRequest(users.charlie.id, users.eve.id);
    assert(charlieToEve.success, "Charlie sent reciprocal request to Eve");
    assert(charlieToEve.status === "ACCEPTED", "Reciprocal request automatically accepted atomically");
    assert(charlieToEve.isFriend === true, "Mutual friendship established immediately");

    const eveCharlieFriendship1 = await prisma.friendship.findFirst({
      where: { userId: users.eve.id, friendId: users.charlie.id },
    });
    const eveCharlieFriendship2 = await prisma.friendship.findFirst({
      where: { userId: users.charlie.id, friendId: users.eve.id },
    });
    assert(eveCharlieFriendship1 !== null && eveCharlieFriendship2 !== null, "Reciprocal friendships exist for simultaneous request");

    // --- 12. Message Side-Effect Immunity ---
    console.log("\n--- 12. Chat Message Side-Effect Immunity ---");
    // Verify that sending a chat message does NOT create a friendship
    const nonFriendA = users.alice.id;
    const nonFriendB = users.eve.id;
    const friendBefore = await prisma.friendship.findFirst({
      where: { userId: nonFriendA, friendId: nonFriendB },
    });
    assert(friendBefore === null, "Alice and Eve are not friends initially");

    await sendChatMessage(nonFriendA, nonFriendB, "personal", "Hello without friendship");

    const friendAfter = await prisma.friendship.findFirst({
      where: { userId: nonFriendA, friendId: nonFriendB },
    });
    assert(friendAfter === null, "Sending chat message does NOT bypass mutual consent or create friendship");

    console.log("\n=================================================================");
    console.log(`  PHASE 6B VERIFICATION PASSED: ${passed}/${total} assertions`);
    console.log("=================================================================\n");
  } finally {
    // --- 13. Teardown & Final Baseline Check ---
    console.log("--- 13. Cleaning Up Test Fixtures & Checking Data Integrity ---");
    const testUserIds = Object.values(users).map((u) => u.id);

    // Delete test notifications
    await prisma.notification.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    // Delete test friend requests
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: { in: testUserIds } },
          { receiverId: { in: testUserIds } },
        ],
      },
    });

    // Delete test friendships
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { friendId: { in: testUserIds } },
        ],
      },
    });

    // Delete test messages
    await prisma.chatMessage.deleteMany({
      where: {
        OR: [
          { senderId: { in: testUserIds } },
          { receiverId: { in: testUserIds } },
        ],
      },
    });

    // Delete test users
    await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    });
    console.log("  Successfully cleaned up test fixtures.");

    // Final data integrity check
    const finalFriendships = await prisma.friendship.count();
    const finalMessages = await prisma.chatMessage.count();
    assert(finalFriendships === baselineFriendships, `Legacy friendships preserved (${finalFriendships} === ${baselineFriendships})`);
    assert(finalMessages === baselineMessages, `Legacy chat messages preserved (${finalMessages} === ${baselineMessages})`);
    console.log("  Data preservation strictly verified: legacy records 100% intact.");
  }
}

runPhase6BVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
