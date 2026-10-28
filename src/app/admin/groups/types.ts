export interface GroupSummary {
  id: string;
  name: string;
  context: string;
  creator: {
    name: string;
    handle: string;
    studentId: string;
    department: string;
    avatarInitials?: string;
  };
  campus: string;
  isPrivate: boolean;
  memberCount: number;
  messageVolume: number;
  healthScore: number; // 0-100% spam risk
  flagsCount: number;
  createdAt: string;
  iconType: "globe" | "lock" | "cohort" | "book" | "health" | "compass";
  healthStatus?: "Healthy" | "Elevated Risk" | "Critical";
  activeFlagLabel?: string;
}

export interface GroupCaseDetail extends GroupSummary {
  caseFileId: string;
  creatorQuota: {
    used: number;
    allowed: number;
    strikeWarning?: string;
    standing: "Quota OK" | "Near Quota" | "Quota Exceeded";
  };
  flaggedReports: Array<{
    id: string;
    reporterPseudonym: string;
    time: string;
    reason: string;
  }>;
  telemetrySignals: string[];
}

export type GovernanceAction =
  | "freeze_48h"
  | "delist"
  | "creator_strike"
  | "disband_archive";

export interface GroupMetrics {
  totalActiveGroups: number;
  newGroupsThisWeek: number;
  averageGroupSize: number;
  medianGroupSize: number;
  quotaComplianceRate: number;
  flaggedCommunitiesCount: number;
}
