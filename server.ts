/**
 * server.ts – Phase 11 custom Node.js entry point
 *
 * Architecture:
 *  - Creates the Next.js app (handles rendering + API routes).
 *  - Creates a single http.Server from Next's request handler.
 *  - Attaches socket.io to the SAME http server (same port, no second port exposure).
 *  - Listens on PORT (default 3000).
 *
 * Usage:
 *  Dev:  npx ts-node --project tsconfig.server.json server.ts
 *  Prod: node dist/server.js   (after: npm run build)
 *
 * Environment variables consumed here:
 *  PORT         – TCP port to listen on (default: 3000)
 *  CORS_ORIGIN  – Allowed origin for Socket.IO CORS (e.g. https://myapp.com).
 *                 Use * for dev/internal; restrict in production.
 *  NODE_ENV     – "production" disables Next.js dev overlay.
 */

import "dotenv/config";
import http from "http";
import next from "next";
import { initSocket } from "./src/server/socket";

const dev  = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);

// ── Crash guards – prevent an unhandled promise/exception from killing the process ──
process.on("unhandledRejection", (reason) => {
  console.error(
    JSON.stringify({
      level: "error",
      context: "Process",
      message: "Unhandled promise rejection",
      meta: { reason: String(reason) },
      timestamp: new Date().toISOString(),
    })
  );
});

process.on("uncaughtException", (err) => {
  console.error(
    JSON.stringify({
      level: "error",
      context: "Process",
      message: "Uncaught exception",
      meta: { message: err.message, stack: err.stack },
      timestamp: new Date().toISOString(),
    })
  );
  // Give the logger a tick to flush, then exit – supervisor (e.g. Docker, PM2) will restart.
  setTimeout(() => process.exit(1), 500);
});

async function main() {
  const app     = next({ dev });
  const handler = app.getRequestHandler();

  await app.prepare();

  const httpServer = http.createServer(handler);

  // Attach Socket.IO to the same HTTP server (same port, WebSocket upgrade handled here).
  await initSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(
      JSON.stringify({
        level: "info",
        context: "Server",
        message: `Listening on port ${port}`,
        meta: { dev, port },
        timestamp: new Date().toISOString(),
      })
    );
  });
}

main().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
