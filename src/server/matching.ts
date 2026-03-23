import { Plan, Gender } from "@prisma/client";
import crypto from "crypto";

export type MatchingPreferences = {
  preferredGender?: Gender | "ANY";
  preferredDepartments?: string[];
  preferredYears?: number[];
  preferredHobbies?: string[];
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
};

export type Room = {
  roomId: string; // The UUID of the room
  socketIdA: string;
  socketIdB: string;
  userIdA: string;
  userIdB: string;
};

// Global in-memory state
const rooms = new Map<string, Room>();
const socketUserMap = new Map<string, SearchingUser>();
const queue: SearchingUser[] = [];
const proTimeouts = new Map<string, NodeJS.Timeout>();

function getOppositeGender(g: Gender): Gender | "ANY" {
  if (g === Gender.MALE) return Gender.FEMALE;
  if (g === Gender.FEMALE) return Gender.MALE;
  return "ANY";
}

/**
 * Calculates a match score. Returns -1 if there's a hard rejection (e.g. strict gender mismatch).
 */
function calculateScore(searcher: SearchingUser, candidate: SearchingUser): number {
  if (searcher.plan !== Plan.PRO) {
    return 0; // Standard users don't have strict requirements right now
  }

  let score = 0;
  const prefs = searcher.preferences;
  if (!prefs) return 0;

  // Hard rejection if gender is known and strict preference fails
  if (prefs.preferredGender && prefs.preferredGender !== "ANY" && candidate.gender !== Gender.UNSPECIFIED) {
    if (candidate.gender !== prefs.preferredGender) return -1;
    score += 100;
  }

  if (prefs.preferredDepartments?.length && candidate.department) {
    if (prefs.preferredDepartments.includes(candidate.department)) score += 10;
  }

  if (prefs.preferredYears?.length && candidate.year) {
    if (prefs.preferredYears.includes(candidate.year)) score += 10;
  }

  if (prefs.preferredHobbies?.length && candidate.hobbies?.length) {
    const candidateLower = candidate.hobbies.map((h) => h.toLowerCase());
    const matches = prefs.preferredHobbies.filter((h) => candidateLower.includes(h.toLowerCase()));
    score += matches.length * 5;
  }

  return score;
}

function removeFromQueueOnly(socketId: string) {
  const index = queue.findIndex((u) => u.socketId === socketId);
  if (index !== -1) queue.splice(index, 1);

  if (proTimeouts.has(socketId)) {
    clearTimeout(proTimeouts.get(socketId)!);
    proTimeouts.delete(socketId);
  }
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.socketIdA === socketId || room.socketIdB === socketId) {
      return room;
    }
  }
  return undefined;
}

export function removeUser(socketId: string) {
  removeFromQueueOnly(socketId);
  socketUserMap.delete(socketId);
  
  // Also remove from any rooms
  const room = getRoomBySocket(socketId);
  if (room) {
    rooms.delete(room.roomId);
  }
  return room; // Returned so the socket handler can notify the partner
}

function createRoom(userA: SearchingUser, userB: SearchingUser, emitMatch: (roomId: string, socketA: string, socketB: string) => void) {
  removeFromQueueOnly(userA.socketId);
  removeFromQueueOnly(userB.socketId);

  const roomId = crypto.randomUUID();
  const room: Room = {
    roomId,
    socketIdA: userA.socketId,
    socketIdB: userB.socketId,
    userIdA: userA.userId,
    userIdB: userB.userId,
  };
  rooms.set(roomId, room);

  emitMatch(roomId, userA.socketId, userB.socketId);
}

export function enqueueUser(
  user: SearchingUser,
  emitMatch: (roomId: string, socketA: string, socketB: string) => void,
  emitNoMatch: (socketId: string) => void
) {
  // Ensure we don't duplicate
  removeFromQueueOnly(user.socketId);
  socketUserMap.set(user.socketId, user);

  // Apply default preferences for PRO
  if (user.plan === Plan.PRO && !user.preferences) {
    user.preferences = {
      preferredGender: getOppositeGender(user.gender),
      preferredDepartments: [],
      preferredYears: [],
      preferredHobbies: [],
    };
  }

  let bestCandidate: SearchingUser | null = null;
  let highestScore = -1;

  for (const candidate of queue) {
    if (candidate.socketId === user.socketId) continue;

    const scoreUToC = calculateScore(user, candidate);
    const scoreCToU = calculateScore(candidate, user);

    if (scoreUToC < 0 || scoreCToU < 0) continue; // Mutual acceptable check

    const combined = scoreUToC + scoreCToU;
    if (combined > highestScore) {
      highestScore = combined;
      bestCandidate = candidate;
    }
  }

  if (bestCandidate && highestScore >= 0) {
    // Math found!
    createRoom(user, bestCandidate, emitMatch);
    return;
  }

  // Not matched immediately, place into queue
  queue.push(user);

  if (user.plan === Plan.PRO) {
    const timeout = setTimeout(() => {
      emitNoMatch(user.socketId);
    }, 20000); // 20 seconds wait as per Phase 7
    proTimeouts.set(user.socketId, timeout);
  }
}

export function handleNext(socketId: string, emitMatch: (rId: string, sA: string, sB: string) => void, emitNoMatch: (sId: string) => void) {
  const room = removeUser(socketId); // leaves the room and queue
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
