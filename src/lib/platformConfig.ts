import fs from "fs";
import path from "path";

export interface PlatformConfiguration {
  version: number;
  updatedAt: string;
  updatedByEmail?: string;

  // General & Campus Federation
  crossCampusPeerDiscovery: boolean;
  intraCampusProximityPriority: boolean;
  crossCampusGroupParticipation: boolean;
  campusAwareMatching: boolean;

  // Authentication & Session Policy
  staffSessionHours: number; // 1 to 72
  studentSessionDays: number; // 1 to 90
  requireEduEmailVerification: boolean;
  allowExternalRegistrations: boolean;

  // Privacy & Data Governance
  maxGroupsPerStudent: number; // 1 to 10
  unsubstantiatedReportRetentionDays: number; // 30 to 365
  allowSensitiveInspection: boolean;

  // Rate Limiting & Protection
  apiRateLimitPerMin: number; // 10 to 1000
  matchingDailyCap: number; // 1 to 20
  broadcastCooldownMins: number; // 0 to 120

  // Emergency Mode
  broadcastOnlyMode: boolean;
  emergencyNoticeBanner: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfiguration = {
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedByEmail: "system@ethiunichat.com",

  crossCampusPeerDiscovery: true,
  intraCampusProximityPriority: true,
  crossCampusGroupParticipation: true,
  campusAwareMatching: true,

  staffSessionHours: 8,
  studentSessionDays: 30,
  requireEduEmailVerification: true,
  allowExternalRegistrations: true,

  maxGroupsPerStudent: 3,
  unsubstantiatedReportRetentionDays: 90,
  allowSensitiveInspection: false,

  apiRateLimitPerMin: 120,
  matchingDailyCap: 5,
  broadcastCooldownMins: 15,

  broadcastOnlyMode: false,
  emergencyNoticeBanner: "",
};

// In-memory active singleton
let activeConfig: PlatformConfiguration = { ...DEFAULT_PLATFORM_CONFIG };
let isLoaded = false;

const CONFIG_SNAPSHOT_PATH = path.join(
  process.cwd(),
  "docs",
  "snapshots",
  "platform_settings.json"
);

function ensureSnapshotDir() {
  const dir = path.dirname(CONFIG_SNAPSHOT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Loads the active platform configuration, falling back to defaults if not yet initialized.
 */
export function getActivePlatformConfig(): PlatformConfiguration {
  if (!isLoaded) {
    try {
      if (fs.existsSync(CONFIG_SNAPSHOT_PATH)) {
        const raw = fs.readFileSync(CONFIG_SNAPSHOT_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        activeConfig = {
          ...DEFAULT_PLATFORM_CONFIG,
          ...parsed,
        };
      }
    } catch {
      activeConfig = { ...DEFAULT_PLATFORM_CONFIG };
    }
    isLoaded = true;
  }
  return { ...activeConfig };
}

/**
 * Validates and saves updated platform configuration with incremented version.
 */
export function updateActivePlatformConfig(
  updates: Partial<PlatformConfiguration>,
  updaterEmail: string
): PlatformConfiguration {
  const current = getActivePlatformConfig();

  // Strict bounds validations
  if (updates.staffSessionHours !== undefined) {
    if (updates.staffSessionHours < 1 || updates.staffSessionHours > 72) {
      throw new Error("Validation Error: Staff session lifetime must be between 1 and 72 hours.");
    }
  }

  if (updates.studentSessionDays !== undefined) {
    if (updates.studentSessionDays < 1 || updates.studentSessionDays > 90) {
      throw new Error("Validation Error: Student session lifetime must be between 1 and 90 days.");
    }
  }

  if (updates.maxGroupsPerStudent !== undefined) {
    if (updates.maxGroupsPerStudent < 1 || updates.maxGroupsPerStudent > 10) {
      throw new Error("Validation Error: Max groups per student must be between 1 and 10.");
    }
  }

  if (updates.unsubstantiatedReportRetentionDays !== undefined) {
    if (
      updates.unsubstantiatedReportRetentionDays < 30 ||
      updates.unsubstantiatedReportRetentionDays > 365
    ) {
      throw new Error("Validation Error: Report retention window must be between 30 and 365 days.");
    }
  }

  if (updates.apiRateLimitPerMin !== undefined) {
    if (updates.apiRateLimitPerMin < 10 || updates.apiRateLimitPerMin > 1000) {
      throw new Error("Validation Error: API rate limit must be between 10 and 1000 req/min.");
    }
  }

  if (updates.matchingDailyCap !== undefined) {
    if (updates.matchingDailyCap < 1 || updates.matchingDailyCap > 20) {
      throw new Error("Validation Error: Daily matching cap must be between 1 and 20.");
    }
  }

  if (updates.broadcastCooldownMins !== undefined) {
    if (updates.broadcastCooldownMins < 0 || updates.broadcastCooldownMins > 120) {
      throw new Error("Validation Error: Broadcast cooldown must be between 0 and 120 minutes.");
    }
  }

  const nextVersion = (current.version || 1) + 1;
  const newConfig: PlatformConfiguration = {
    ...current,
    ...updates,
    version: nextVersion,
    updatedAt: new Date().toISOString(),
    updatedByEmail: updaterEmail,
  };

  activeConfig = newConfig;

  // Persist to safe snapshot file
  try {
    ensureSnapshotDir();
    fs.writeFileSync(CONFIG_SNAPSHOT_PATH, JSON.stringify(newConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Warning: Failed to persist platform config snapshot to disk:", err);
  }

  return { ...newConfig };
}

/**
 * Resets configuration to default baseline (used in testing cleanup).
 */
export function resetPlatformConfigForTesting(): void {
  activeConfig = { ...DEFAULT_PLATFORM_CONFIG };
  try {
    if (fs.existsSync(CONFIG_SNAPSHOT_PATH)) {
      fs.unlinkSync(CONFIG_SNAPSHOT_PATH);
    }
  } catch {
    // Ignore cleanup error
  }
}
