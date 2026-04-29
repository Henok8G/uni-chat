/**
 * Phase 11: Socket.IO is now initialized in server.ts at startup.
 * It is attached to the same HTTP server as Next.js (single port).
 *
 * This route is kept as a compatibility stub in case any clients still
 * fetch /api/socket before connecting. It does nothing — the socket server
 * is already running when this route is reached.
 */

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "Socket.IO server is running (initialized at startup)" });
}
