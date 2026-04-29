/**
 * socket.ts – Phase 11 Socket.IO server initialization
 *
 * In Phase 11, initSocket() now accepts the http.Server created in server.ts
 * and attaches to it (same port as Next.js) instead of listening on a separate
 * port 3001. This simplifies production deployment to a single port.
 *
 * CORS:
 *  Set CORS_ORIGIN env var to restrict which origins may connect.
 *  Example: CORS_ORIGIN=https://myapp.com
 *  Default: * (allow all – restrict in production)
 *
 * Ping tuning:
 *  pingInterval / pingTimeout detect dead connections and clean up server-side
 *  socket/room state. Dead sockets are disconnected and removeUser() fires.
 */

import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { enqueueUser, removeUser, handleNext, handleProFallback, getRoomBySocket, SearchingUser, runWatchdog } from "./matching";
import { logInfo, logWarn, logError } from "../lib/logger";
import { metrics, incrementMetric, decrementMetric } from "../lib/metrics";
import { MATCH_START_RATE_LIMIT_PER_MINUTE } from "../config/limits";
import { prisma } from "../lib/prisma";
import { createRedisClients } from "../config/redis";
import { logAnalyticsEvent, AnalyticsEventType } from "../lib/analytics";

// ── WebRTC Signaling Payload Types ──────────────────────────────────────────
type WebRTCOfferPayload        = { roomId: string; sdp: RTCSessionDescriptionInit };
type WebRTCAnswerPayload       = { roomId: string; sdp: RTCSessionDescriptionInit };
type WebRTCIceCandidatePayload = { roomId: string; candidate: RTCIceCandidateInit };

// ── Per-socket rate-limit tracking ───────────────────────────────────────────
/**
 * Tracks "Start/Next" queue join actions within the current minute window.
 * Keyed by socket.id. Cleared when the minute window resets.
 */
const socketActionCounts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const entry = socketActionCounts.get(socketId);

  if (!entry || now - entry.windowStart > 60_000) {
    // New window
    socketActionCounts.set(socketId, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  if (entry.count > MATCH_START_RATE_LIMIT_PER_MINUTE) {
    return true;
  }
  return false;
}

/**
 * Initialize the Socket.IO server, attached to the provided http.Server.
 * Called once from server.ts at startup.
 */
export async function initSocket(httpServer: http.Server): Promise<void> {
  const corsOrigin = process.env.CORS_ORIGIN ?? "*";

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
    // Detect dead connections within ~45 s; keep-alive every 25 s.
    pingInterval: 25_000,
    pingTimeout:  20_000,
  });

  // Attach Redis adapter if REDIS_URL is provided in environment mapping 
  const redisClients = await createRedisClients();
  if (redisClients) {
    io.adapter(createAdapter(redisClients.pubClient, redisClients.subClient));
    logInfo("Socket", "Socket.IO using Redis adapter (horizontal scaling enabled)");
  } else {
    logInfo("Socket", "Running Socket.IO without Redis adapter (single-node mode)");
  }

  logInfo("Socket", "Socket.IO server attached to HTTP server", { corsOrigin });

  // Initiate the global garbage collection Watchdog timer 
  setInterval(() => runWatchdog(io), 60_000);

  io.on("connection", (socket) => {
    incrementMetric("activeConnections");
    // Expand connection log for visibility 
    logInfo("Socket", "Client connected", { socketId: socket.id, address: socket.handshake.address });

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Emit match callback – join both sockets to the room and notify them */
    const emitMatch = (roomId: string, socketA: string, socketB: string, chatSessionId: string) => {
      io.sockets.sockets.get(socketA)?.join(roomId);
      io.sockets.sockets.get(socketB)?.join(roomId);
      io.to(socketA).emit("match_found", { roomId, chatSessionId, isInitiator: true });
      io.to(socketB).emit("match_found", { roomId, chatSessionId, isInitiator: false });
      incrementMetric("activeChatSessions");
      logInfo("Socket", "Match found", { roomId, chatSessionId, socketA, socketB });
    };

    const emitNoMatch = (socketId: string) => {
      io.to(socketId).emit("no_opposite_gender_available");
      logInfo("Socket", "No opposite gender available", { socketId });
    };

    // ── join_queue ────────────────────────────────────────────────────────────
    socket.on("join_queue", async (userPayload: SearchingUser) => {
      try {
        // Basic authentication guard: userId must be present and user must not be banned
        if (!userPayload?.userId) {
          logWarn("Socket", "join_queue rejected: missing userId", { socketId: socket.id });
          return;
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: userPayload.userId },
          select: { id: true, banned: true },
        });
        if (!dbUser) {
          logWarn("Socket", "join_queue rejected: user not found", { userId: userPayload.userId });
          return;
        }
        if (dbUser.banned) {
          socket.emit("banned");
          logWarn("Socket", "join_queue rejected: user is banned", { userId: userPayload.userId });
          return;
        }

        // Rate limit
        if (isRateLimited(socket.id)) {
          socket.emit("rate_limited");
          logWarn("Socket", "join_queue rate limited", { socketId: socket.id, userId: userPayload.userId });
          return;
        }

        userPayload.socketId = socket.id;
        enqueueUser(userPayload, emitMatch, emitNoMatch);
      } catch (err) {
        logError("Socket", "join_queue handler crashed", { error: String(err) });
      }
    });

    // ── message ───────────────────────────────────────────────────────────────
    socket.on("message", ({ roomId, text }: { roomId: string; text: string }) => {
      try {
        // Only relay if this socket is actually in the room
        const room = getRoomBySocket(socket.id);
        if (!room || room.roomId !== roomId) {
          logWarn("Socket", "message rejected: socket not in room", { socketId: socket.id, roomId });
          return;
        }
        socket.to(roomId).emit("message", text);
        
        logAnalyticsEvent(AnalyticsEventType.MESSAGE_SENT, {
          sessionId: room.chatSessionId,
          userId: room.socketIdA === socket.id ? room.userIdA : room.userIdB
        });
      } catch (err) {
        logError("Socket", "message handler crashed", { error: String(err) });
      }
    });

    // ── next ──────────────────────────────────────────────────────────────────
    socket.on("next", () => {
      try {
        if (isRateLimited(socket.id)) {
          socket.emit("rate_limited");
          logWarn("Socket", "next rate limited", { socketId: socket.id });
          return;
        }

        const room = handleNext(socket.id, emitMatch, emitNoMatch);
        if (room) {
          decrementMetric("activeChatSessions");
          const partner = room.socketIdA === socket.id ? room.socketIdB : room.socketIdA;
          io.to(partner).emit("partner_left");
          socket.leave(room.roomId);
          io.sockets.sockets.get(partner)?.leave(room.roomId);
          logInfo("Socket", "next – left room", { socketId: socket.id, roomId: room.roomId });
        }
      } catch (err) {
        logError("Socket", "next handler crashed", { error: String(err) });
      }
    });

    // ── pro_fallback_anyone ───────────────────────────────────────────────────
    socket.on("pro_fallback_anyone", () => {
      const user = handleProFallback(socket.id, "ANYONE");
      if (user) {
        enqueueUser(user, emitMatch, () => {});
      }
    });

    // ── pro_keep_waiting ──────────────────────────────────────────────────────
    socket.on("pro_keep_waiting", () => {
      handleProFallback(socket.id, "WAIT");
    });

    // ── leave_queue ───────────────────────────────────────────────────────────
    socket.on("leave_queue", () => {
      try {
        const room = removeUser(socket.id);
        if (room) {
          decrementMetric("activeChatSessions");
          const partner = room.socketIdA === socket.id ? room.socketIdB : room.socketIdA;
          io.to(partner).emit("partner_left");
          socket.leave(room.roomId);
          io.sockets.sockets.get(partner)?.leave(room.roomId);
          logInfo("Socket", "leave_queue – left room", { socketId: socket.id, roomId: room.roomId });
        }
      } catch(err) {
        logError("Socket", "leave_queue handler crashed", { error: String(err) });
      }
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      try {
        socketActionCounts.delete(socket.id);
        decrementMetric("activeConnections");
        logInfo("Socket", "Client disconnected", { socketId: socket.id, reason });

        const room = removeUser(socket.id, "DISCONNECT");
        if (room) {
          decrementMetric("activeChatSessions");
          const partner = room.socketIdA === socket.id ? room.socketIdB : room.socketIdA;
          io.to(partner).emit("partner_left");
          logInfo("Socket", "disconnect – notified partner", {
            socketId: socket.id,
            roomId: room.roomId,
          });
        }
      } catch(err) {
        logError("Socket", "disconnect handler crashed", { error: String(err) });
      }
    });

    // ── WebRTC Signaling Relay ────────────────────────────────────────────────
    // Each event is validated: the sending socket must be a participant in the
    // given room. If not, the event is silently ignored (no crash, error logged).

    socket.on("webrtc:offer", ({ roomId, sdp }: WebRTCOfferPayload) => {
      try {
        const room = getRoomBySocket(socket.id);
        if (!room || room.roomId !== roomId) {
          logWarn("Socket", "webrtc:offer rejected: socket not in room", { socketId: socket.id, roomId });
          return;
        }
        socket.to(roomId).emit("webrtc:offer", { roomId, sdp });
      } catch (err) {
        logError("Socket", "webrtc:offer handler crashed", { error: String(err) });
      }
    });

    socket.on("webrtc:answer", ({ roomId, sdp }: WebRTCAnswerPayload) => {
      try {
        const room = getRoomBySocket(socket.id);
        if (!room || room.roomId !== roomId) {
          logWarn("Socket", "webrtc:answer rejected: socket not in room", { socketId: socket.id, roomId });
          return;
        }
        socket.to(roomId).emit("webrtc:answer", { roomId, sdp });
      } catch(err) {
        logError("Socket", "webrtc:answer handler crashed", { error: String(err) });
      }
    });

    socket.on("webrtc:ice_candidate", ({ roomId, candidate }: WebRTCIceCandidatePayload) => {
      try {
        const room = getRoomBySocket(socket.id);
        if (!room || room.roomId !== roomId) {
          logWarn("Socket", "webrtc:ice_candidate rejected: socket not in room", {
            socketId: socket.id,
            roomId,
          });
          return;
        }
        socket.to(roomId).emit("webrtc:ice_candidate", { roomId, candidate });
      } catch (err) {
        logError("Socket", "webrtc:ice_candidate handler crashed", { error: String(err) });
      }
    });

    // ── analytics_event ───────────────────────────────────────────────────────
    socket.on("analytics_event", (payload: { type: string; sessionId?: string; properties?: any }) => {
      try {
        const room = getRoomBySocket(socket.id);
        const userId = room ? (room.socketIdA === socket.id ? room.userIdA : room.userIdB) : undefined;
        
        if (payload.type === "WEBRTC_STARTED") {
          logAnalyticsEvent(AnalyticsEventType.WEBRTC_STARTED, { sessionId: payload.sessionId, userId, properties: payload.properties });
        } else if (payload.type === "WEBRTC_FAILED") {
          logAnalyticsEvent(AnalyticsEventType.WEBRTC_FAILED, { sessionId: payload.sessionId, userId, properties: payload.properties });
        } else if (payload.type === "COLLAB_CHANNEL_OPENED") {
          logAnalyticsEvent(AnalyticsEventType.COLLAB_CHANNEL_OPENED, { sessionId: payload.sessionId, userId, properties: payload.properties });
        } else if (payload.type === "REACTION_SENT") {
          logAnalyticsEvent(AnalyticsEventType.REACTION_SENT, { sessionId: payload.sessionId, userId, properties: payload.properties });
        }
      } catch (err) {
        logError("Socket", "analytics_event handler crashed", { error: String(err) });
      }
    });

    // ── Catch-all error handler ────────────────────────────────────────────────
    socket.on("error", (err) => {
      logError("Socket", "Socket error", { socketId: socket.id, error: String(err) });
    });
  });

  // Expose io on globalThis for legacy compatibility (e.g. if any route still references it)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).io = io;
}
