/**
 * logger.ts – Phase 11 structured logging helper
 *
 * Wraps console with structured JSON output. All log entries include:
 *  - level: "info" | "warn" | "error"
 *  - context: the calling module/subsystem (e.g. "Socket", "Matching", "Report")
 *  - message: human-readable description
 *  - meta: optional extra fields (never include sensitive user data / free-text)
 *  - timestamp: ISO-8601 UTC
 *
 * To wire to a real log collector (e.g. Datadog, Logtail, Axiom) later,
 * replace the console.* calls in each function below with calls to your
 * ingestion SDK — the call sites throughout the codebase stay unchanged.
 */

export interface LogMeta {
  [key: string]: unknown;
}

function buildEntry(level: "info" | "warn" | "error", context: string, message: string, meta?: LogMeta) {
  return {
    level,
    context,
    message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };
}

export function logInfo(context: string, message: string, meta?: LogMeta): void {
  console.log(JSON.stringify(buildEntry("info", context, message, meta)));
}

export function logWarn(context: string, message: string, meta?: LogMeta): void {
  console.warn(JSON.stringify(buildEntry("warn", context, message, meta)));
}

export function logError(context: string, message: string, meta?: LogMeta): void {
  console.error(JSON.stringify(buildEntry("error", context, message, meta)));
}
