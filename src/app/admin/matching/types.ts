export interface MatchingFunnelMetrics {
  totalMatches: number;
  monthlyPerStudent: number;
  acceptanceRate: number;
  acceptanceRateDelta: number;
  chatInitiationRate: number;
  chatInitiationDelta: number;
  disciplinaryFlagRate: number;
  semesterReportsCount: number;
  funnelStages: Array<{
    step: number;
    name: string;
    count: number;
    conversionPercentage: number;
    description: string;
  }>;
  affinityVectors: Array<{
    category: string;
    weightPercentage: number;
  }>;
  campusShare: Array<{
    campusName: string;
    percentage: number;
    tagColor: string;
  }>;
}

export interface CrossDeptPair {
  id: string;
  sourceDept: string;
  targetDept: string;
  sourceCampus: string;
  targetCampus: string;
  volumeTier: "High Volume" | "Moderate" | "Low";
  commonThemes: string[];
  totalMatchesThisTerm: number;
  mutualRate: number;
}

export interface AnomalyAlert {
  id: string;
  alertCode: string;
  timeAgo: string;
  description: string;
  throttled: boolean;
  actionTaken: string;
}

export interface GuardrailSettings {
  crossGenderCooldown: boolean;
  proximityBiasWeight: number; // 0 to 100
  dailyMatchCap: number;
  freshmanMentorshipEnabled: boolean;
  activeAnomalies: AnomalyAlert[];
}
