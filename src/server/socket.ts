import { Server as SocketIOServer } from "socket.io";
import { enqueueUser, removeUser, handleNext, handleProFallback, SearchingUser } from "./matching";

// ── WebRTC Signaling Payload Types ──────────────────────────────────────────
type WebRTCOfferPayload        = { roomId: string; sdp: RTCSessionDescriptionInit };
type WebRTCAnswerPayload       = { roomId: string; sdp: RTCSessionDescriptionInit };
type WebRTCIceCandidatePayload = { roomId: string; candidate: RTCIceCandidateInit };

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

export function initSocket() {
  if (globalThis.io) return;

  const io = new SocketIOServer(3001, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("join_queue", (userPayload: SearchingUser) => {
      userPayload.socketId = socket.id;
      enqueueUser(
        userPayload,
        (roomId, socketA, socketB) => {
          // Join socket.io rooms for easy broadcasting later
          io.sockets.sockets.get(socketA)?.join(roomId);
          io.sockets.sockets.get(socketB)?.join(roomId);

          // socketA is always the WebRTC initiator (offer sender)
          io.to(socketA).emit("match_found", { roomId, isInitiator: true });
          io.to(socketB).emit("match_found", { roomId, isInitiator: false });
        },
        (socketId) => {
          io.to(socketId).emit("no_opposite_gender_available");
        }
      );
    });

    socket.on("message", ({ roomId, text }) => {
      // Broadcast to other people in the room (the partner)
      socket.to(roomId).emit("message", text);
    });

    socket.on("next", () => {
      const room = handleNext(
        socket.id,
        (roomId, socketA, socketB) => {
          io.sockets.sockets.get(socketA)?.join(roomId);
          io.sockets.sockets.get(socketB)?.join(roomId);

          io.to(socketA).emit("match_found", { roomId, isInitiator: true });
          io.to(socketB).emit("match_found", { roomId, isInitiator: false });
        },
        (socketId) => {
          io.to(socketId).emit("no_opposite_gender_available");
        }
      );
      
      if (room) {
        // Notify partner that this user left
        const partner = room.socketIdA === socket.id ? room.socketIdB : room.socketIdA;
        io.to(partner).emit("partner_left");
        
        // Remove both from socket.io room
        socket.leave(room.roomId);
        io.sockets.sockets.get(partner)?.leave(room.roomId);
      }
    });

    socket.on("pro_fallback_anyone", () => {
      const user = handleProFallback(socket.id, "ANYONE");
      if (user) {
        // Re-enqueue without timeouts
        enqueueUser(
          user,
          (roomId, socketA, socketB) => {
            io.sockets.sockets.get(socketA)?.join(roomId);
            io.sockets.sockets.get(socketB)?.join(roomId);
            io.to(socketA).emit("match_found", { roomId, isInitiator: true });
            io.to(socketB).emit("match_found", { roomId, isInitiator: false });
          },
          () => {} // Ignored for anyone fallback
        );
      }
    });

    socket.on("pro_keep_waiting", () => {
      handleProFallback(socket.id, "WAIT");
    });

    socket.on("leave_queue", () => {
      const room = removeUser(socket.id);
      if (room) {
        const partner = room.socketIdA === socket.id ? room.socketIdB : room.socketIdA;
        io.to(partner).emit("partner_left");
        
        socket.leave(room.roomId);
        io.sockets.sockets.get(partner)?.leave(room.roomId);
      }
    });

    socket.on("disconnect", () => {
      const room = removeUser(socket.id);
      if (room) {
        const partner = room.socketIdA === socket.id ? room.socketIdB : room.socketIdA;
        io.to(partner).emit("partner_left");
      }
    });

    // ── WebRTC Signaling Relay ───────────────────────────────────────────────
    // These simply forward WebRTC negotiation messages to the other peer in the
    // same Socket.IO room. No matching logic is touched here.

    socket.on("webrtc:offer", ({ roomId, sdp }: WebRTCOfferPayload) => {
      // Relay offer to the other participant in this room
      socket.to(roomId).emit("webrtc:offer", { roomId, sdp });
    });

    socket.on("webrtc:answer", ({ roomId, sdp }: WebRTCAnswerPayload) => {
      // Relay answer back to the initiator
      socket.to(roomId).emit("webrtc:answer", { roomId, sdp });
    });

    socket.on("webrtc:ice_candidate", ({ roomId, candidate }: WebRTCIceCandidatePayload) => {
      // Relay ICE candidate to the other peer
      socket.to(roomId).emit("webrtc:ice_candidate", { roomId, candidate });
    });
  });

  globalThis.io = io;
  console.log("Socket.IO server listening on port 3001");
}
