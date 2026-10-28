export interface CampusAnalyticsKPIs {
  mau: {
    count: number;
    percentageOfStudentBody: number;
    target: number;
    trendVsLastTerm: number;
    definition: string;
    totalEligibleStudents: number;
  };
  dau: {
    count: number;
    stickinessRate: number;
    benchmarkNotice: string;
    definition: string;
  };
  retention30Day: {
    rate: number;
    rankNotice: string;
    attritionRate: number;
    yoyGrowth: number;
    definition: string;
    cohortSize: number;
    retainedCount: number;
  };
  messaging: {
    totalVolume: string;
    sessionCount: number;
    activeStudyGroups: number;
    p2pPercentage: number;
    groupPercentage: number;
    definition: string;
  };
}

export interface TelemetryPoint {
  dayLabel: string;
  fullDate: string;
  dau: number;
  feedViews: number;
  peerInteractions: number;
  milestoneAnnotation?: string;
  isPeak?: boolean;
}

export interface CampusNode {
  id: string;
  name: string;
  campusCode: string;
  studentCount: number;
  percentageShare: number;
  activityIndex: number;
  dominantThemes: string;
  attributionNote: string;
}

export interface CohortRetentionRow {
  cohortName: string;
  registeredCount: number;
  weeklyRetention: (number | null)[]; // null if observation window has not arrived yet
}

export interface ModulePenetrationItem {
  moduleName: string;
  activeUsersCount: number;
  totalEligibleCount: number;
  usageSharePercentage: number;
  barColorClass: string;
  description: string;
}

export interface AnalyticsSummaryData {
  kpis: CampusAnalyticsKPIs;
  telemetrySeries: TelemetryPoint[];
  campusNodes: CampusNode[];
  cohortRetention: CohortRetentionRow[];
  modulePenetration: ModulePenetrationItem[];
  timeRange: string;
  campusFilter: string;
  lastRefreshed: string;
  highlights: {
    peakDay: string;
    peakDau: number;
    avgSessionDurationMins: number | null;
    singleSessionExitRate: number;
  };
  telemetryDisclaimers: string[];
}
