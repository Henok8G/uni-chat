import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.IO client connected to the app's Socket.IO server.
 *
 * Phase 11: Socket.IO now runs on the SAME origin/port as the Next.js app
 * (served by the custom server.ts entry point). No separate port needed.
 *
 * Configuration:
 *   NEXT_PUBLIC_SOCKET_URL – Override the Socket.IO server URL if needed
 *                            (e.g. for split-origin setups). Defaults to
 *                            window.location.origin (same origin, same port).
 *
 * Transports: polling first (always works), upgrades to websocket automatically.
 * This ensures compatibility behind proxies that may not support WS upgrade
 * on first connection.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  // Default to same origin (same port as Next.js) if no override is set.
  // Set NEXT_PUBLIC_SOCKET_URL for split-origin or CDN deployments.
  const url =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  socket = io(url, {
    path: "/socket.io",
    // Start with polling for proxy compatibility; upgrades to WS automatically.
    transports: ["polling", "websocket"],
  });

  return socket;
}
