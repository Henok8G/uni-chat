/**
 * metrics.ts – Phase 11 in-memory metrics counters
 *
 * These counters are intentionally simple and in-process only.
 * They reset on restart and are NOT suitable for multi-process deployments.
 *
 * To upgrade later:
 *  - Replace with Redis INCR/DECR commands for multi-node support.
 *  - Or push to a time-series database (Prometheus, InfluxDB) via an exporter.
 *
 * Exposed via /api/internal/metrics (access-restricted, internal use only).
 */

export interface Metrics {
  /** Number of Socket.IO sockets currently connected */
  activeConnections: number;
  /** Number of chat sessions currently in progress */
  activeChatSessions: number;
  /** Reports created since server start (wraps at Number.MAX_SAFE_INTEGER) */
  totalReportsCreated: number;
  /** ISO-8601 timestamp of when the server started */
  serverStartedAt: string;
}

export const metrics: Metrics = {
  activeConnections: 0,
  activeChatSessions: 0,
  totalReportsCreated: 0,
  serverStartedAt: new Date().toISOString(),
};

/** Increment a numeric counter */
export function incrementMetric(key: keyof Omit<Metrics, "serverStartedAt">): void {
  (metrics[key] as number)++;
}

/** Decrement a numeric counter, floored at 0 */
export function decrementMetric(key: keyof Omit<Metrics, "serverStartedAt">): void {
  const val = (metrics[key] as number) - 1;
  (metrics[key] as number) = Math.max(0, val);
}
