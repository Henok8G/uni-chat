import "dotenv/config";
import http from "http";
import { io as ClientSocket, Socket } from "socket.io-client";
import { initSocket } from "../src/server/socket";
import { prisma } from "../src/lib/prisma";
import { Gender, Plan } from "@prisma/client";

async function runVerification() {
  console.log("=================================================");
  console.log("  CRITICAL VIDEO MATCHING & WEBRTC TEST SUITE    ");
  console.log("=================================================\n");

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      totalPassed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? " - " + detail : ""}`);
      totalFailed++;
      process.exitCode = 1;
    }
  }

  // Find verified users for testing
  const users = await prisma.user.findMany({
    where: { emailVerified: true, banned: false },
    take: 4,
    select: {
      id: true,
      email: true,
      displayName: true,
      gender: true,
      plan: true,
      department: true,
    },
  });

  if (users.length < 2) {
    throw new Error("Need at least 2 verified users in the database for matchmaking verification");
  }

  const userA = users[0];
  const userB = users[1];
  console.log(`Test User A: ${userA.displayName || userA.email} (${userA.id}, ${userA.gender}, ${userA.plan})`);
  console.log(`Test User B: ${userB.displayName || userB.email} (${userB.id}, ${userB.gender}, ${userB.plan})\n`);

  // Start standalone test HTTP + Socket.IO server on ephemeral port
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("OK");
  });

  await initSocket(server);

  const testPort = 4005;
  await new Promise<void>((resolve) => server.listen(testPort, () => resolve()));
  const serverUrl = `http://localhost:${testPort}`;
  console.log(`Test Socket.IO server listening on ${serverUrl}\n`);

  const createClient = (): Socket => {
    return ClientSocket(serverUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: false,
    });
  };

  try {
    // ── TEST 1: Two distinct eligible accounts enter queue -> match into shared room
    console.log("--- 1. Two Distinct Eligible Accounts Match ---");
    const socket1 = createClient();
    const socket2 = createClient();

    await Promise.all([
      new Promise<void>((res) => socket1.on("connect", () => res())),
      new Promise<void>((res) => socket2.on("connect", () => res())),
    ]);

    let match1: any = null;
    let match2: any = null;
    const matchPromise1 = new Promise<void>((res) => socket1.on("match_found", (d) => { match1 = d; res(); }));
    const matchPromise2 = new Promise<void>((res) => socket2.on("match_found", (d) => { match2 = d; res(); }));

    socket1.emit("join_queue", {
      userId: userA.id,
      plan: userA.plan,
      gender: userA.gender,
      prefGender: "any",
      profile: { userId: userA.id, name: userA.displayName || "User A", gender: userA.gender },
    });

    socket2.emit("join_queue", {
      userId: userB.id,
      plan: userB.plan,
      gender: userB.gender,
      prefGender: "any",
      profile: { userId: userB.id, name: userB.displayName || "User B", gender: userB.gender },
    });

    await Promise.all([matchPromise1, matchPromise2]);

    assert(Boolean(match1 && match2), "1.1 Both sockets received match_found event");
    assert(match1?.roomId === match2?.roomId, "1.2 Both users matched into identical roomId", match1?.roomId);
    assert(match1?.chatSessionId === match2?.chatSessionId, "1.3 Both users assigned same chatSessionId");
    assert(match1?.isInitiator !== match2?.isInitiator, "1.4 WebRTC roles properly assigned (one initiator, one receiver)");

    // ── TEST 2: WebRTC Signaling Relay (Offer, Answer, ICE)
    console.log("\n--- 2. WebRTC Signaling Relay (Offer, Answer, ICE Candidates) ---");
    const testOffer = { type: "offer", sdp: "v=0\r\no=test 123456 IN IP4 127.0.0.1\r\ns=WebRTCTest\r\n" };
    const testAnswer = { type: "answer", sdp: "v=0\r\no=test 654321 IN IP4 127.0.0.1\r\ns=WebRTCTestAnswer\r\n" };
    const testCandidate = { candidate: "candidate:1 1 UDP 2130706431 127.0.0.1 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 };

    const offerPromise = new Promise<any>((res) => socket2.on("webrtc:offer", (d) => res(d)));
    socket1.emit("webrtc:offer", { roomId: match1.roomId, sdp: testOffer });
    const receivedOffer = await offerPromise;
    assert(receivedOffer?.sdp?.sdp === testOffer.sdp, "2.1 Offer relayed faithfully to Peer B");

    const answerPromise = new Promise<any>((res) => socket1.on("webrtc:answer", (d) => res(d)));
    socket2.emit("webrtc:answer", { roomId: match2.roomId, sdp: testAnswer });
    const receivedAnswer = await answerPromise;
    assert(receivedAnswer?.sdp?.sdp === testAnswer.sdp, "2.2 Answer relayed faithfully to Peer A");

    const icePromise = new Promise<any>((res) => socket2.on("webrtc:ice_candidate", (d) => res(d)));
    socket1.emit("webrtc:ice_candidate", { roomId: match1.roomId, candidate: testCandidate });
    const receivedIce = await icePromise;
    assert(receivedIce?.candidate?.candidate === testCandidate.candidate, "2.3 ICE candidate relayed faithfully to Peer B");

    // ── TEST 3: Next/Skip Action Cleanup & Re-queue
    console.log("\n--- 3. Next / Skip Action Teardown & Re-Queue ---");
    const partnerLeftPromise = new Promise<void>((res) => socket2.on("partner_left", () => res()));
    socket1.emit("next");
    await partnerLeftPromise;
    assert(true, "3.1 Partner left notification sent to Peer B on next");

    socket1.disconnect();
    socket2.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST 4: Single User Waiting Remains Searching Without False Match
    console.log("\n--- 4. Single User Waiting Remains Searching ---");
    const socketSolo = createClient();
    await new Promise<void>((res) => socketSolo.on("connect", () => res()));

    let falseMatch = false;
    socketSolo.on("match_found", () => { falseMatch = true; });

    socketSolo.emit("join_queue", {
      userId: userA.id,
      plan: userA.plan,
      gender: userA.gender,
      prefGender: "any",
      profile: { userId: userA.id, name: userA.displayName || "User A", gender: userA.gender },
    });

    await new Promise((r) => setTimeout(r, 600));
    assert(!falseMatch, "4.1 Solo user waiting in queue receives no false match");
    socketSolo.emit("leave_queue");
    socketSolo.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST 5: Same Student in Two Tabs (Duplicate Session Prevention)
    console.log("\n--- 5. Duplicate Session Handling ---");
    const tab1 = createClient();
    const tab2 = createClient();
    await Promise.all([
      new Promise<void>((res) => tab1.on("connect", () => res())),
      new Promise<void>((res) => tab2.on("connect", () => res())),
    ]);

    let selfMatched = false;
    tab1.on("match_found", (d) => {
      if (d.partner?.userId === userA.id) selfMatched = true;
    });
    tab2.on("match_found", (d) => {
      if (d.partner?.userId === userA.id) selfMatched = true;
    });

    // Enqueue same user twice with different sockets
    tab1.emit("join_queue", {
      userId: userA.id,
      plan: userA.plan,
      gender: userA.gender,
      prefGender: "any",
      profile: { userId: userA.id, name: "Tab 1", gender: userA.gender },
    });
    await new Promise((r) => setTimeout(r, 100));
    tab2.emit("join_queue", {
      userId: userA.id,
      plan: userA.plan,
      gender: userA.gender,
      prefGender: "any",
      profile: { userId: userA.id, name: "Tab 2", gender: userA.gender },
    });

    await new Promise((r) => setTimeout(r, 600));
    assert(!selfMatched, "5.1 Same user on 2 sockets never matches with themselves");
    tab1.disconnect();
    tab2.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST 6: Incompatible Users Do Not Match
    console.log("\n--- 6. Incompatible Users Filter Exclusion ---");
    const socketIncA = createClient();
    const socketIncB = createClient();
    await Promise.all([
      new Promise<void>((res) => socketIncA.on("connect", () => res())),
      new Promise<void>((res) => socketIncB.on("connect", () => res())),
    ]);

    let invalidMatch = false;
    socketIncA.on("match_found", () => { invalidMatch = true; });
    socketIncB.on("match_found", () => { invalidMatch = true; });

    // Male user strictly requesting FEMALE
    socketIncA.emit("join_queue", {
      userId: userA.id,
      plan: Plan.PRO,
      gender: Gender.MALE,
      prefGender: "FEMALE",
      profile: { userId: userA.id, name: "Male Requester", gender: "MALE" },
    });

    // Male candidate
    socketIncB.emit("join_queue", {
      userId: userB.id,
      plan: Plan.PRO,
      gender: Gender.MALE,
      prefGender: "any",
      profile: { userId: userB.id, name: "Male Candidate", gender: "MALE" },
    });

    await new Promise((r) => setTimeout(r, 600));
    assert(!invalidMatch, "6.1 Incompatible users (strict gender requirement) do not match");
    socketIncA.disconnect();
    socketIncB.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST 7: Recent Partners Match When Only Pair Available (Defect #1 Fix Verification)
    console.log("\n--- 7. Recent Partners Re-Matching (Fix for Defect #1) ---");
    const socketRecA = createClient();
    const socketRecB = createClient();
    await Promise.all([
      new Promise<void>((res) => socketRecA.on("connect", () => res())),
      new Promise<void>((res) => socketRecB.on("connect", () => res())),
    ]);

    let recentMatchedA = false;
    let recentMatchedB = false;
    const recPromiseA = new Promise<void>((res) => socketRecA.on("match_found", () => { recentMatchedA = true; res(); }));
    const recPromiseB = new Promise<void>((res) => socketRecB.on("match_found", () => { recentMatchedB = true; res(); }));

    // User A and B enqueue again (they are recent partners from Test 1)
    socketRecA.emit("join_queue", {
      userId: userA.id,
      plan: userA.plan,
      gender: userA.gender,
      prefGender: "any",
      profile: { userId: userA.id, name: userA.displayName || "User A", gender: userA.gender },
    });
    socketRecB.emit("join_queue", {
      userId: userB.id,
      plan: userB.plan,
      gender: userB.gender,
      prefGender: "any",
      profile: { userId: userB.id, name: userB.displayName || "User B", gender: userB.gender },
    });

    await Promise.all([recPromiseA, recPromiseB]);
    assert(recentMatchedA && recentMatchedB, "7.1 Recent partners successfully match when no other peer is waiting (no permanent lockout)");
    socketRecA.disconnect();
    socketRecB.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST 8: Two PRO Users With Default Prefs Match (Defect #2 Fix Verification)
    console.log("\n--- 8. Two PRO Users With Default Preferences Match (Fix for Defect #2) ---");
    const socketProA = createClient();
    const socketProB = createClient();
    await Promise.all([
      new Promise<void>((res) => socketProA.on("connect", () => res())),
      new Promise<void>((res) => socketProB.on("connect", () => res())),
    ]);

    let proMatchedA = false;
    let proMatchedB = false;
    const proPromiseA = new Promise<void>((res) => socketProA.on("match_found", () => { proMatchedA = true; res(); }));
    const proPromiseB = new Promise<void>((res) => socketProB.on("match_found", () => { proMatchedB = true; res(); }));

    // Both Male PRO users without preferences
    socketProA.emit("join_queue", {
      userId: userA.id,
      plan: Plan.PRO,
      gender: Gender.MALE,
      profile: { userId: userA.id, name: "Pro Male 1", gender: "MALE" },
    });
    socketProB.emit("join_queue", {
      userId: userB.id,
      plan: Plan.PRO,
      gender: Gender.MALE,
      profile: { userId: userB.id, name: "Pro Male 2", gender: "MALE" },
    });

    await Promise.all([proPromiseA, proPromiseB]);
    assert(proMatchedA && proMatchedB, "8.1 Two PRO users with default preferences match successfully");
    socketProA.disconnect();
    socketProB.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST 9: Simultaneous Queue Joins (Race Condition Check)
    console.log("\n--- 9. Concurrent / Simultaneous Queue Joins ---");
    const socketSimA = createClient();
    const socketSimB = createClient();
    await Promise.all([
      new Promise<void>((res) => socketSimA.on("connect", () => res())),
      new Promise<void>((res) => socketSimB.on("connect", () => res())),
    ]);

    let simMatchA: any = null;
    let simMatchB: any = null;
    const simPromiseA = new Promise<void>((res) => socketSimA.on("match_found", (d) => { simMatchA = d; res(); }));
    const simPromiseB = new Promise<void>((res) => socketSimB.on("match_found", (d) => { simMatchB = d; res(); }));

    // Fire both joins concurrently in parallel
    await Promise.all([
      new Promise<void>((resolve) => {
        socketSimA.emit("join_queue", {
          userId: userA.id,
          plan: userA.plan,
          gender: userA.gender,
          prefGender: "any",
          profile: { userId: userA.id, name: "Sim A" },
        });
        resolve();
      }),
      new Promise<void>((resolve) => {
        socketSimB.emit("join_queue", {
          userId: userB.id,
          plan: userB.plan,
          gender: userB.gender,
          prefGender: "any",
          profile: { userId: userB.id, name: "Sim B" },
        });
        resolve();
      }),
    ]);

    await Promise.all([simPromiseA, simPromiseB]);
    assert(Boolean(simMatchA && simMatchB), "9.1 Simultaneous joins resolved cleanly without dropped events");
    assert(simMatchA?.roomId === simMatchB?.roomId, "9.2 Simultaneous joins assigned identical room ID");
    socketSimA.disconnect();
    socketSimB.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ── TEST 10: Disconnect Recovery
    console.log("\n--- 10. Disconnect Recovery ---");
    const socketDisA = createClient();
    const socketDisB = createClient();
    await Promise.all([
      new Promise<void>((res) => socketDisA.on("connect", () => res())),
      new Promise<void>((res) => socketDisB.on("connect", () => res())),
    ]);

    const discMatchPromise = new Promise<void>((res) => socketDisB.on("match_found", () => res()));
    socketDisA.emit("join_queue", { userId: userA.id, plan: userA.plan, gender: userA.gender, prefGender: "any" });
    socketDisB.emit("join_queue", { userId: userB.id, plan: userB.plan, gender: userB.gender, prefGender: "any" });
    await discMatchPromise;

    const partnerLeftOnDisc = new Promise<void>((res) => socketDisB.on("partner_left", () => res()));
    socketDisA.disconnect();
    await partnerLeftOnDisc;
    assert(true, "10.1 Disconnecting socket notified partner via partner_left and recovered room state");
    socketDisB.disconnect();

  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log("\n=================================================");
  console.log(`  VERIFICATION RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED  `);
  console.log("=================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
