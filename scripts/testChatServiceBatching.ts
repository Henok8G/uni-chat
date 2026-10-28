import { prisma } from "../src/lib/prisma";
import { getPersonalChatsForUser, getJoinedGroupsForUser } from "../src/lib/chatService";

async function runTestSuite() {
  console.log("=================================================================");
  console.log("VERIFYING CHATSERVICE BATCHED QUERIES & REGRESSION TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // Instrument query counter
  let queryCount = 0;
  const originalQueryRawUnsafe = prisma.$queryRawUnsafe.bind(prisma);
  const originalGroupMemberFindMany = prisma.groupMember.findMany.bind(prisma.groupMember);

  prisma.$queryRawUnsafe = (async (...args: any[]) => {
    queryCount++;
    return (originalQueryRawUnsafe as any)(...args);
  }) as any;

  prisma.groupMember.findMany = (async (...args: any[]) => {
    queryCount++;
    return (originalGroupMemberFindMany as any)(...args);
  }) as any;

  const resetCount = () => {
    const c = queryCount;
    queryCount = 0;
    return c;
  };

  // Warm connection
  await prisma.$queryRawUnsafe("SELECT 1;");
  resetCount();

  // -------------------------------------------------------------
  // Test 1: Empty states return [] in a single query
  // -------------------------------------------------------------
  console.log("[Test 1] Testing empty state handling...");
  const emptyFriends = await getPersonalChatsForUser("non_existent_id");
  const emptyFriendsQueries = resetCount();
  assert(Array.isArray(emptyFriends) && emptyFriends.length === 0, "Empty personal chats returns empty array");
  assert(emptyFriendsQueries === 1, `Empty personal chats executed in exactly 1 query (actual: ${emptyFriendsQueries})`);

  const emptyGroups = await getJoinedGroupsForUser("non_existent_id");
  const emptyGroupsQueries = resetCount();
  assert(Array.isArray(emptyGroups) && emptyGroups.length === 0, "Empty joined groups returns empty array");
  assert(emptyGroupsQueries === 1, `Empty joined groups executed in exactly 1 query (actual: ${emptyGroupsQueries})`);

  // -------------------------------------------------------------
  // Test 2: Personal chats batching & unread count accuracy
  // -------------------------------------------------------------
  console.log("\n[Test 2] Testing personal chats batching and accuracy...");
  const multiFriendUser = "cmnuhm0su0001xehhy20vesda";

  // Ensure deterministic test fixture state: Henos has 1 unread message
  await prisma.$executeRawUnsafe(
    `UPDATE "ChatMessage" SET "isRead" = false WHERE id = 'msg_mvfrfc63_b7ugk6'`
  );
  resetCount();

  const friends = await getPersonalChatsForUser(multiFriendUser);
  const friendQueries = resetCount();

  assert(friendQueries === 2, `Batched getPersonalChatsForUser executed in exactly 2 queries total (1 friendships query + 1 batched stats query, actual: ${friendQueries})`);
  assert(friends.length === 2, `Retrieved exactly 2 expected friends (actual: ${friends.length})`);

  // Verify structure of each friend item
  for (const f of friends) {
    assert(typeof f.id === "string" && f.id.length > 0, `Friend has valid ID: ${f.id}`);
    assert(typeof f.name === "string" && f.name.length > 0, `Friend has valid name: ${f.name}`);
    assert(typeof f.avatarUrl === "string", `Friend has valid avatarUrl: ${f.avatarUrl}`);
    assert(typeof f.lastMessage === "string", `Friend has valid lastMessage preview: "${f.lastMessage}"`);
    assert(typeof f.lastMessageTime === "string" && f.lastMessageTime.length > 0, `Friend has relative time: "${f.lastMessageTime}"`);
    assert(typeof f.unreadCount === "number" && f.unreadCount >= 0, `Friend has numeric unreadCount: ${f.unreadCount}`);
    assert(f.isOnline === false, `Friend has isOnline boolean`);
    assert(f.kind === "personal", `Friend has kind: "personal"`);
  }

  // Verify unread count semantic accuracy
  const friendWithUnread = friends.find((f) => f.id === "cmo8m0diu000bp2kbhxk6nwo4");
  assert(friendWithUnread?.unreadCount === 1, `Accurately preserved unreadCount=1 for Henos (actual: ${friendWithUnread?.unreadCount})`);

  const friendWithoutUnread = friends.find((f) => f.id === "cmorsisgd0001rjlvvqmbq060");
  assert(friendWithoutUnread?.unreadCount === 0, `Accurately preserved unreadCount=0 for Chang (actual: ${friendWithoutUnread?.unreadCount})`);

  // -------------------------------------------------------------
  // Test 3: Joined groups batching & fallback semantics
  // -------------------------------------------------------------
  console.log("\n[Test 3] Testing joined groups batching and fallbacks...");
  const multiGroupUser = "cmorsisgd0001rjlvvqmbq060";
  const groups = await getJoinedGroupsForUser(multiGroupUser);
  const groupQueries = resetCount();

  assert(groupQueries === 2, `Batched getJoinedGroupsForUser executed in exactly 2 queries total (memberships + batch messages, actual: ${groupQueries})`);
  assert(groups.length === 4, `Retrieved exactly 4 joined groups (actual: ${groups.length})`);

  for (const g of groups) {
    assert(typeof g.id === "string" && g.id.length > 0, `Group has valid ID: ${g.id}`);
    assert(typeof g.name === "string" && g.name.length > 0, `Group has valid name: ${g.name}`);
    assert(typeof g.lastMessage === "string" && g.lastMessage.length > 0, `Group has description/preview: "${g.lastMessage}"`);
    assert(typeof g.lastMessageTime === "string" && g.lastMessageTime.length > 0, `Group has relative time: "${g.lastMessageTime}"`);
    assert(g.unreadCount === 0, `Group has unreadCount: 0`);
    assert(g.isOnline === true, `Group has isOnline: true`);
    assert(g.kind === "group", `Group has kind: "group"`);
  }

  // Restore
  prisma.$queryRawUnsafe = originalQueryRawUnsafe;
  prisma.groupMember.findMany = originalGroupMemberFindMany;

  console.log("\n=================================================================");
  console.log(`ALL TESTS PASSED: ${passed}/${total} assertions verified.`);
  console.log("=================================================================\n");

  await prisma.$disconnect();
}

runTestSuite().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
