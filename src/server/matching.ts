import { Plan, Gender } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { logInfo, logError, logWarn } from "../lib/logger";
import { logAnalyticsEvent, AnalyticsEventType } from "../lib/analytics";

/**
 * ── PHASE 12: Scaling, Reliability & Horizontal Scaling ──
 * This matching implementation assumes sticky sessions at the load balancer
 * so that all events for a given user's Socket.IO connection are handled
 * by the same Node instance.
 * 
 * Redis adapter synchronizes rooms/events, but the queues below are node-local.
 * ──────────────────────────────────────────────────────────
 */

export type MatchingPreferences = {
  preferredGender?: Gender | "ANY";
  preferredDepartments?: string[];
  preferredYears?: number[];
  preferredHobbies?: string[];
};

export type UserProfile = {
  userId: string;
  name: string;
  avatar: string;
  bio?: string | null;
  university?: string | null;
  department?: string | null;
  year?: number | null;
  hobbies?: string[];
  gender?: string;
  verified?: boolean;
};

export type SearchingUser = {
  userId: string;
  socketId: string;
  plan: Plan;
  gender: Gender;
  department?: string | null;
  year?: number | null;
  hobbies?: string[] | null;
  preferences?: MatchingPreferences;
  profile?: UserProfile;
};

export type Room = {
  roomId: string; // The UUID of the room
  socketIdA: string;
  socketIdB: string;
  userIdA: string;
  userIdB: string;
  chatSessionId: string;
};

// Global in-memory state
const rooms = new Map<string, Room>();
const socketUserMap = new Map<string, SearchingUser>();
const queue: SearchingUser[] = [];
const proTimeouts = new Map<string, NodeJS.Timeout>();

// ── Active Matching Configuration & Weights Cache (MATCH-001) ─────────────────
export type ActiveMatchingWeights = {
  academicWeight: number;
  projectWeight: number;
  mentorshipWeight: number;
  hobbiesWeight: number;
  proximityBiasWeight: number;
  dailyMatchCap: number;
  freshmanMentorshipEnabled: boolean;
  crossGenderCooldown: boolean;
  version: number;
};

export const DEFAULT_MATCHING_WEIGHTS: ActiveMatchingWeights = {
  academicWeight: 40,
  projectWeight: 30,
  mentorshipWeight: 20,
  hobbiesWeight: 10,
  proximityBiasWeight: 50,
  dailyMatchCap: 5,
  freshmanMentorshipEnabled: true,
  crossGenderCooldown: false,
  version: 1,
};

let cachedWeights: ActiveMatchingWeights = { ...DEFAULT_MATCHING_WEIGHTS };
let lastConfigFetchTime = 0;
const CONFIG_CACHE_TTL_MS = 30_000; // 30-second refresh window
let isConfigFetching = false;

/**
 * Fetches latest MatchingConfig from PostgreSQL with fallback to safe defaults.
 */
export async function fetchMatchingWeights(): Promise<ActiveMatchingWeights> {
  try {
    const config = await prisma.matchingConfig.findUnique({
      where: { id: "active" },
    });
    if (config) {
      cachedWeights = {
        academicWeight: Math.max(0, Math.min(100, Number(config.academicWeight) ?? 40)),
        projectWeight: Math.max(0, Math.min(100, Number(config.projectWeight) ?? 30)),
        mentorshipWeight: Math.max(0, Math.min(100, Number(config.mentorshipWeight) ?? 20)),
        hobbiesWeight: Math.max(0, Math.min(100, Number(config.hobbiesWeight) ?? 10)),
        proximityBiasWeight: Math.max(0, Math.min(100, Number(config.proximityBiasWeight) ?? 50)),
        dailyMatchCap: Math.max(1, Math.min(20, Number(config.dailyMatchCap) ?? 5)),
        freshmanMentorshipEnabled: Boolean(config.freshmanMentorshipEnabled),
        crossGenderCooldown: Boolean(config.crossGenderCooldown),
        version: Number(config.version) || 1,
      };
      lastConfigFetchTime = Date.now();
    }
  } catch (err) {
    logWarn(
      "Matching",
      "Could not load matching configuration from database, falling back to cached/default weights",
      { error: String(err) }
    );
  }
  return cachedWeights;
}

/**
 * Synchronous non-blocking accessor for in-memory weights with background revalidation.
 */
export function getMatchingWeights(): ActiveMatchingWeights {
  const now = Date.now();
  if (now - lastConfigFetchTime > CONFIG_CACHE_TTL_MS && !isConfigFetching) {
    isConfigFetching = true;
    fetchMatchingWeights().finally(() => {
      isConfigFetching = false;
    });
  }
  return cachedWeights;
}

/**
 * Invalidates the configuration cache so the next lookup re-reads from PostgreSQL.
 */
export function invalidateMatchingConfigCache(): void {
  lastConfigFetchTime = 0;
}

/**
 * Test harness helper to simulate specific weight configurations in memory.
 */
export function setMatchingWeightsForTesting(weights: Partial<ActiveMatchingWeights> | null): void {
  if (weights === null) {
    cachedWeights = { ...DEFAULT_MATCHING_WEIGHTS };
    lastConfigFetchTime = 0;
  } else {
    cachedWeights = { ...cachedWeights, ...weights };
    lastConfigFetchTime = Date.now() + 3_600_000; // Freeze for test run
  }
}

function getOppositeGender(g: Gender): Gender | "ANY" {
  if (g === Gender.MALE) return Gender.FEMALE;
  if (g === Gender.FEMALE) return Gender.MALE;
  return "ANY";
}

/**
 * Calculates a match score. Returns -1 if there's a hard rejection (e.g. strict gender mismatch).
 * Consumes live admin-configured weights from PostgreSQL (MATCH-001).
 */
export function calculateScore(
  searcher: SearchingUser,
  candidate: SearchingUser,
  customWeights?: ActiveMatchingWeights
): number {
  if (searcher.plan !== Plan.PRO && !searcher.preferences) {
    return 0; // Standard users without explicit preferences don't have strict requirements
  }

  const weights = customWeights || getMatchingWeights();
  let score = 0;
  const prefs = searcher.preferences;
  if (!prefs) return 0;

  // Hard rejection if gender is known and strict preference fails
  if (prefs.preferredGender && prefs.preferredGender !== "ANY" && candidate.gender !== Gender.UNSPECIFIED) {
    if (candidate.gender !== prefs.preferredGender) return -1;
    score += 100;
  }

  // Academic matching: department affinity scaled by configured academicWeight
  if (prefs.preferredDepartments?.length && candidate.department) {
    if (prefs.preferredDepartments.includes(candidate.department)) {
      score += weights.academicWeight;
    }
  }

  // Academic matching: year affinity (half of academicWeight)
  if (prefs.preferredYears?.length && candidate.year) {
    if (prefs.preferredYears.includes(candidate.year)) {
      score += Math.round(weights.academicWeight * 0.5);
    }
  }

  // Freshman Mentorship: if enabled, pairs freshman (year 1) with senior (year 3+)
  if (weights.freshmanMentorshipEnabled) {
    const isFreshmanSeniorPair =
      (searcher.year === 1 && candidate.year && candidate.year >= 3) ||
      (candidate.year === 1 && searcher.year && searcher.year >= 3);
    if (isFreshmanSeniorPair) {
      score += weights.mentorshipWeight;
    }
  }

  // Hobbies matching: each shared hobby scaled by configured hobbiesWeight
  if (prefs.preferredHobbies?.length && candidate.hobbies?.length) {
    const candidateLower = candidate.hobbies.map((h) => h.toLowerCase());
    const matches = prefs.preferredHobbies.filter((h) => candidateLower.includes(h.toLowerCase()));
    score += matches.length * weights.hobbiesWeight;
  }

  // Hackathon & Project Collaboration: scaled by configured projectWeight (MATCH-001)
  // Applies when peers match on technical/project collaboration hobbies (e.g. Coding, Robotics, Hackathon)
  // or shared engineering/computing project disciplines.
  const isProjectHobby = (h: string) => {
    const lower = h.toLowerCase();
    return (
      lower === "coding" ||
      lower === "programming" ||
      lower === "robotics" ||
      lower === "hackathon" ||
      lower === "design" ||
      lower === "gaming"
    );
  };
  const hasProjectHobbyMatch =
    prefs.preferredHobbies?.some((ph) =>
      isProjectHobby(ph) && candidate.hobbies?.some((ch) => ch.toLowerCase() === ph.toLowerCase())
    ) ?? false;

  const isTechDept = (d?: string | null) => {
    if (!d) return false;
    const dl = d.toLowerCase();
    return (
      dl.includes("computer") ||
      dl.includes("software") ||
      dl.includes("engineering") ||
      dl.includes("information technology") ||
      dl.includes("cyber")
    );
  };
  const hasTechProjectDeptSynergy = isTechDept(searcher.department) && isTechDept(candidate.department);

  if (hasProjectHobbyMatch || hasTechProjectDeptSynergy) {
    score += weights.projectWeight;
  }

  return score;
}

// Track recent partners for each user to prioritize meeting new users
const recentPartners = new Map<string, string[]>();

export function recordRecentPartner(userIdA: string, userIdB: string) {
  if (!userIdA || !userIdB) return;
  const listA = recentPartners.get(userIdA) || [];
  recentPartners.set(userIdA, [userIdB, ...listA.filter((id) => id !== userIdB)].slice(0, 8));

  const listB = recentPartners.get(userIdB) || [];
  recentPartners.set(userIdB, [userIdA, ...listB.filter((id) => id !== userIdA)].slice(0, 8));
}

function removeFromQueueOnly(socketId: string, userId?: string) {
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i].socketId === socketId || (userId && queue[i].userId === userId)) {
      const removed = queue.splice(i, 1)[0];
      if (proTimeouts.has(removed.socketId)) {
        clearTimeout(proTimeouts.get(removed.socketId)!);
        proTimeouts.delete(removed.socketId);
      }
    }
  }
}

export function isUserInRoom(userId: string): boolean {
  for (const room of rooms.values()) {
    if (room.userIdA === userId || room.userIdB === userId) {
      return true;
    }
  }
  return false;
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.socketIdA === socketId || room.socketIdB === socketId) {
      return room;
    }
  }
  return undefined;
}

export function removeUser(socketId: string, reason: "NEXT" | "DISCONNECT" | "REPORTED" | "BANNED" = "DISCONNECT") {
  const existingUser = socketUserMap.get(socketId);
  removeFromQueueOnly(socketId, existingUser?.userId);
  socketUserMap.delete(socketId);
  
  // Also remove from any rooms
  const room = getRoomBySocket(socketId);
  if (room) {
    rooms.delete(room.roomId);

    logInfo("Matching", "ChatSession closing", { chatSessionId: room.chatSessionId, reason });
    prisma.chatSession.update({
      where: { id: room.chatSessionId },
      data: {
        endedAt: new Date(),
        endedReason: reason
      }
    }).catch((err: unknown) => logError("Matching", "Failed to close ChatSession", { error: String(err) }));
    
    logAnalyticsEvent(AnalyticsEventType.SESSION_ENDED, {
      sessionId: room.chatSessionId,
      properties: { reason }
    });
  }
  return room; // Returned so the socket handler can notify the partner
}

function createRoom(userA: SearchingUser, userB: SearchingUser, emitMatch: (roomId: string, userA: SearchingUser, userB: SearchingUser, chatSessionId: string) => void) {
  removeFromQueueOnly(userA.socketId, userA.userId);
  removeFromQueueOnly(userB.socketId, userB.userId);
  recordRecentPartner(userA.userId, userB.userId);

  const roomId = crypto.randomUUID();
  const chatSessionId = crypto.randomUUID();
  
  const room: Room = {
    roomId,
    socketIdA: userA.socketId,
    socketIdB: userB.socketId,
    userIdA: userA.userId,
    userIdB: userB.userId,
    chatSessionId,
  };
  rooms.set(roomId, room);

  logInfo("Matching", "ChatSession creating", { chatSessionId, roomId, userAId: userA.userId, userBId: userB.userId });
  prisma.chatSession.create({
    data: {
      id: chatSessionId,
      userAId: userA.userId,
      userBId: userB.userId,
      planA: userA.plan,
      planB: userB.plan,
    }
  }).catch((err: unknown) => logError("Matching", "Failed to create ChatSession", { error: String(err) }));

  logAnalyticsEvent(AnalyticsEventType.SESSION_STARTED, {
    sessionId: chatSessionId,
  });

  emitMatch(roomId, userA, userB, chatSessionId);
}

export function enqueueUser(
  user: SearchingUser,
  emitMatch: (roomId: string, userA: SearchingUser, userB: SearchingUser, chatSessionId: string) => void,
  emitNoMatch: (socketId: string) => void
) {
  // Ensure we don't duplicate by socketId OR by userId across multiple tabs/windows
  removeFromQueueOnly(user.socketId, user.userId);
  socketUserMap.set(user.socketId, user);

  // Evict any stale rooms containing this userId so searching user is never trapped
  for (const [rId, r] of rooms.entries()) {
    if (r.userIdA === user.userId || r.userIdB === user.userId) {
      rooms.delete(rId);
    }
  }

  // Apply default preferences for PRO: default to "ANY" unless user explicitly configured a target gender
  if (user.plan === Plan.PRO && !user.preferences) {
    user.preferences = {
      preferredGender: "ANY",
      preferredDepartments: [],
      preferredYears: [],
      preferredHobbies: [],
    };
  }

  const weights = getMatchingWeights();
  let bestCandidate: SearchingUser | null = null;
  let highestScore = -Infinity;

  const anonUserId = user.userId ? `${user.userId.slice(0, 4)}...${user.userId.slice(-4)}` : "unknown";
  logInfo("Matching", "Evaluating queue for user", {
    user: anonUserId,
    plan: user.plan,
    gender: user.gender,
    queueSize: queue.length,
    preferredGender: user.preferences?.preferredGender || "ANY",
  });

  for (const candidate of queue) {
    // ── STRICT RULE: A user can NEVER match with themselves ──
    // (covers multiple tabs, incognito windows, or same account)
    if (candidate.socketId === user.socketId) continue;
    if (candidate.userId === user.userId) continue;

    // Prevent matching if candidate is already in an active room
    if (isUserInRoom(candidate.userId) || isUserInRoom(user.userId)) continue;

    const scoreUToC = calculateScore(user, candidate, weights);
    const scoreCToU = calculateScore(candidate, user, weights);

    if (scoreUToC < 0 || scoreCToU < 0) continue; // Mutual acceptable check

    let combined = scoreUToC + scoreCToU;

    // Prefer new users over recent partners (-50 penalty ranks them below fresh candidates, but does not block matching if they are the only peer available)
    const isRecent = recentPartners.get(user.userId)?.includes(candidate.userId);
    if (isRecent) {
      combined -= 50;
    }

    if (combined > highestScore) {
      highestScore = combined;
      bestCandidate = candidate;
    }
  }

  if (bestCandidate) {
    const anonPartnerId = `${bestCandidate.userId.slice(0, 4)}...${bestCandidate.userId.slice(-4)}`;
    logInfo("Matching", "Mutual match found", {
      userA: anonUserId,
      userB: anonPartnerId,
      score: highestScore,
      isRecent: recentPartners.get(user.userId)?.includes(bestCandidate.userId) || false,
    });
    // Match found!
    createRoom(user, bestCandidate, emitMatch);
    return;
  }

  // Not matched immediately, place into queue
  queue.push(user);
  logInfo("Matching", "No match found, enqueued", {
    user: anonUserId,
    newQueueSize: queue.length,
  });

  if (user.plan === Plan.PRO) {
    const timeout = setTimeout(() => {
      emitNoMatch(user.socketId);
    }, 20000); // 20 seconds wait as per Phase 7
    proTimeouts.set(user.socketId, timeout);
  }
}

export function handleNext(socketId: string, emitMatch: (rId: string, uA: SearchingUser, uB: SearchingUser, cSId: string) => void, emitNoMatch: (sId: string) => void) {
  const room = removeUser(socketId, "NEXT"); // leaves the room and queue
  const user = socketUserMap.get(socketId);
  if (user) {
    // Re-queue
    enqueueUser(user, emitMatch, emitNoMatch);
  }
  return room;
}

export function handleProFallback(socketId: string, choice: "ANYONE" | "WAIT") {
  const user = socketUserMap.get(socketId);
  if (!user) return;

  if (proTimeouts.has(socketId)) {
    clearTimeout(proTimeouts.get(socketId)!);
    proTimeouts.delete(socketId);
  }

  if (choice === "ANYONE") {
    if (user.preferences) {
      user.preferences.preferredGender = "ANY";
    }
    // Re-trigger enqueue to match standard users instantly
    // (requires dropping them from queue and re-evaluating)
    removeFromQueueOnly(socketId);
    // Since we don't have the emitMatch callbacks cached in user, we just re-run dummy search without timeout or let the caller pass them
    // It's cleaner if the caller re-enqueues him. We'll simulate it by returning the user.
  } else {
    // User chose to keep waiting. Just stay in the queue, no new timeout.
  }
  return user;
}

/**
 * runWatchdog
 * 
 * Periodic cleanup task designed to clean up any orphaned connections,
 * stale timeouts or mismatched state that wasn't cleanly caught by disconnect
 * events (e.g. process crashes, network partitions avoiding ping intervals).
 * It expects to be called passing the global socket.io Server instance.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runWatchdog(io: any) {
  const allSockets = Array.from(io.sockets.sockets.keys());
  
  // 1. Clean queue of disconnected sockets
  for (let i = queue.length - 1; i >= 0; i--) {
    if (!allSockets.includes(queue[i].socketId)) {
      logWarn("Watchdog", "Evicting stale socket from queue", { socketId: queue[i].socketId });
      removeFromQueueOnly(queue[i].socketId);
    }
  }

  // 2. Clean socketUserMap holding dead connections
  for (const socketId of socketUserMap.keys()) {
    if (!allSockets.includes(socketId)) {
      logWarn("Watchdog", "Evicting stale socket from socketUserMap", { socketId });
      socketUserMap.delete(socketId);
      removeFromQueueOnly(socketId);
    }
  }

  // 3. Clean up rooms where BOTH sockets are fully dead natively in state
  for (const [roomId, room] of rooms.entries()) {
    const aDead = !allSockets.includes(room.socketIdA);
    const bDead = !allSockets.includes(room.socketIdB);

    if (aDead && bDead) {
      logWarn("Watchdog", "Evicting entirely dead room", { roomId, chatSessionId: room.chatSessionId });
      rooms.delete(roomId);
      
      // Close in database if it wasn't gracefully
      prisma.chatSession.update({
        where: { id: room.chatSessionId },
        data: {
          endedAt: new Date(),
          endedReason: "DISCONNECT",
        }
      }).catch((err: unknown) => logError("Watchdog", "Failed DB cleanup for stale ChatSession", { error: String(err) }));
    }
  }
}

