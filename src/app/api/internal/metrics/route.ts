/**
 * /api/internal/metrics
 *
 * Internal-only endpoint returning in-memory server metrics.
 * DO NOT expose this publicly. Restrict access at the reverse-proxy level
 * (e.g. only allow requests from 127.0.0.1 / internal network in Nginx).
 *
 * These metrics reset on server restart and are not persisted.
 * For production monitoring, wire up a real metrics collector (Prometheus, etc.)
 * and replace the `metrics` object with calls to that system.
 */

import { NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/metrics";

export function GET(req: NextRequest) {
  // Basic localhost guard – extra safety layer in case proxy rules are misconfigured.
  // The reverse proxy should also block external access to this path.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const isInternal =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "unknown" || // When not behind a proxy, header may be absent
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("192.168.");

  if (!isInternal) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(metrics);
}
