/**
 * limits.ts – Phase 11 centralized rate-limit and threshold configuration
 *
 * All values are read from environment variables with safe defaults.
 * Set these in your .env file or hosting platform env config.
 *
 * Environment variables:
 *  MAX_IPS_PER_USER_24H              – Max distinct IPs a single user may log in from within 24 h (default: 3)
 *  MAX_USERS_PER_IP_1H               – Max distinct users logging in from the same IP within 1 h (default: 5)
 *  MAX_REPORTS_PER_HOUR              – Max reports a single user may file per hour (default: 5)
 *  MATCH_START_RATE_LIMIT_PER_MINUTE – Max "Start / Next" queue joins per user per minute (default: 10)
 */

function env(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`[Config] Invalid value for ${key}: "${raw}". Using default ${defaultValue}.`);
    return defaultValue;
  }
  return parsed;
}

/** Max distinct IPs a single user may log in from within a 24-hour window */
export const MAX_IPS_PER_USER_24H = env("MAX_IPS_PER_USER_24H", 3);

/** Max distinct users that may originate from the same IP within 1 hour */
export const MAX_USERS_PER_IP_1H = env("MAX_USERS_PER_IP_1H", 5);

/** Max reports a single user may file per rolling hour */
export const MAX_REPORTS_PER_HOUR = env("MAX_REPORTS_PER_HOUR", 5);

/**
 * Max "Start Chat" or "Next" actions a single socket may perform per minute.
 * Prevents rapid cycling abuse.
 */
export const MATCH_START_RATE_LIMIT_PER_MINUTE = env("MATCH_START_RATE_LIMIT_PER_MINUTE", 10);
