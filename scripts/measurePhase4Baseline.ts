/**
 * measurePhase4Baseline.ts
 *
 * Measures current Chat message loading flow baseline:
 * 1. Database query timing for getPersonalChatsForUser, getJoinedGroupsForUser, getSuggestedGroupsForUser.
 * 2. Database query timing for getConversationMessages (personal vs group).
 * 3. Network/API overhead of the separate /api/chat/messages endpoint.
 * 4. Simulates 2-hop waterfall vs 1-hop server prefetch.
 */

import { prisma } from "../src/lib/prisma";
import {
  getPersonalChatsForUser,
  getJoinedGroupsForUser,
  getSuggestedGroupsForUser,
  getConversationMessages,
} from "../src/lib/chatService";

async function measure() {
  console.log("=================================================================");
  console.log("PHASE 4 BASELINE MEASUREMENT: CHAT MESSAGE LOADING");
  console.log("=================================================================\n");

  // Warm database connection
  await prisma.$queryRawUnsafe("SELECT 1;");

  // Instrument query counting
  let queryCount = 0;
  const origQueryRaw = prisma.$queryRawUnsafe.bind(prisma);
  const origGroupMember = prisma.groupMember.findMany.bind(prisma.groupMember);
  const origGroup = prisma.group.findMany.bind(prisma.group);

  prisma.$queryRawUnsafe = (async (...args: any[]) => {
    queryCount++;
    return (origQueryRaw as any)(...args);
  }) as any;

  prisma.groupMember.findMany = (async (...args: any[]) => {
    queryCount++;
    return (origGroupMember as any)(...args);
  }) as any;

  prisma.group.findMany = (async (...args: any[]) => {
    queryCount++;
    return (origGroup as any)(...args);
  }) as any;

  const resetCount = () => {
    const c = queryCount;
    queryCount = 0;
    return c;
  };

  const testUserId = "cmorsisgd0001rjlvvqmbq060";
  const user = await prisma.user.findUnique({
    where: { id: testUserId },
  });

  if (!user) {
    console.error("Test user not found");
    process.exit(1);
  }

  console.log(`Test user: ${user.displayName || user.email} (${user.id})\n`);
  resetCount();

  // 1. Measure Step 1: Server Chat Page data loading (Sidebar lists)
  console.log("--- Measuring Step 1: Initial Page Server-Side Data Loading ---");
  const t0 = performance.now();
  const [personalChats, groups, suggestedGroups] = await Promise.all([
    getPersonalChatsForUser(user.id),
    getJoinedGroupsForUser(user.id),
    getSuggestedGroupsForUser(user.id),
  ]);
  const step1Duration = performance.now() - t0;
  const step1Queries = resetCount();
  console.log(`Personal chats count: ${personalChats.length}`);
  console.log(`Joined groups count:  ${groups.length}`);
  console.log(`Suggested groups:     ${suggestedGroups.length}`);
  console.log(`Step 1 query count:   ${step1Queries} queries`);
  console.log(`Step 1 duration:      ${step1Duration.toFixed(2)}ms\n`);

  // Determine default selected chat as ChatPageClient does:
  const defaultChat = groups.length > 0 ? groups[0] : personalChats.length > 0 ? personalChats[0] : null;
  console.log("Default selected chat:", defaultChat ? `${defaultChat.name} (${defaultChat.id}, kind: ${defaultChat.kind})` : "None");

  if (!defaultChat) {
    console.log("No chat found to measure messages.");
    return;
  }

  // 2. Measure Step 2: Separate conversation messages fetch (Group Chat)
  console.log("\n--- Measuring Step 2: getConversationMessages (Separate Hop - Group) ---");
  const t1 = performance.now();
  const messages = await getConversationMessages(
    user.id,
    defaultChat.id,
    (defaultChat.kind as "personal" | "group") || "personal"
  );
  const step2Duration = performance.now() - t1;
  const step2Queries = resetCount();
  console.log(`Messages retrieved:   ${messages.length}`);
  console.log(`Step 2 query count:   ${step2Queries} queries`);
  console.log(`Step 2 duration:      ${step2Duration.toFixed(2)}ms\n`);

  // 3. Measure Step 2: Separate conversation messages fetch (Personal Chat)
  let pDuration = 0;
  let pQueries = 0;
  if (personalChats.length > 0) {
    console.log("--- Measuring Step 2: getConversationMessages (Separate Hop - Personal) ---");
    const friend = personalChats[0];
    const tPersonal = performance.now();
    const pMessages = await getConversationMessages(user.id, friend.id, "personal");
    pDuration = performance.now() - tPersonal;
    pQueries = resetCount();
    console.log(`Personal chat (${friend.name}) messages: ${pMessages.length}`);
    console.log(`Personal chat query count: ${pQueries} queries`);
    console.log(`Personal chat duration:    ${pDuration.toFixed(2)}ms\n`);
  }

  // 4. Calculate waterfall vs unified fetch
  console.log("--- Comparison Analysis ---");
  console.log(`CURRENT 2-HOP ARCHITECTURE (Waterfall):`);
  console.log(`  1. Request 1: GET /app/chat (HTML doc)`);
  console.log(`     - Server queries: ${step1Queries} queries, ~${step1Duration.toFixed(2)}ms`);
  console.log(`     - Response sent to client (loading skeleton displayed)`);
  console.log(`  2. Client browser: parses HTML, executes JS, mounts ConversationView (~50ms)`);
  console.log(`  3. Request 2: GET /api/chat/messages?targetId=${defaultChat.id}&kind=${defaultChat.kind}`);
  console.log(`     - Network RTT client <-> server`);
  console.log(`     - Server auth check (getSessionUser)`);
  console.log(`     - Database query: ${step2Queries} query, ~${step2Duration.toFixed(2)}ms`);
  console.log(`  Total round-trips: 2 HTTP requests`);
  console.log(`  Total DB queries:  ${step1Queries + step2Queries} queries`);
  console.log(`  Total time to first message: ~${(step1Duration + 50 + step2Duration).toFixed(2)}ms + client/server RTT\n`);

  console.log(`OPTIMIZED 1-HOP ARCHITECTURE (Server Prefetch):`);
  console.log(`  1. Request 1: GET /app/chat (HTML doc)`);
  console.log(`     - Server loads sidebar lists AND default conversation messages together`);
  console.log(`     - Initial messages passed directly via props to ChatPageClient and ConversationView`);
  console.log(`     - Total round-trips: 1 HTTP request (50% reduction in network round-trips!)`);
  console.log(`     - Hop 2 (/api/chat/messages on mount) ELIMINATED on initial load!`);
  console.log(`     - Messages visible immediately upon page mount (0ms delay after render)`);
}

measure().catch(console.error).finally(() => prisma.$disconnect());
