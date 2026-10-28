import {
  CampusAnalyticsKPIs,
  TelemetryPoint,
  CampusNode,
  CohortRetentionRow,
  ModulePenetrationItem
} from "./types";

export const MOCK_CAMPUS_KPIS: CampusAnalyticsKPIs = {
  mau: {
    count: 0,
    percentageOfStudentBody: 0,
    target: 0,
    trendVsLastTerm: 0,
    definition: "Distinct eligible, verified students with qualifying activity in rolling 30-day window",
    totalEligibleStudents: 0,
  },
  dau: {
    count: 0,
    stickinessRate: 0,
    benchmarkNotice: "Stickiness calculated as DAU / 30-day active population",
    definition: "Distinct verified students who performed a qualifying activity on this calendar date",
  },
  retention30Day: {
    rate: 0,
    rankNotice: "Pending mature 30-day cohort accounts",
    attritionRate: 0,
    yoyGrowth: 0,
    definition: "Proportion of students active during their first week who returned during days 24–30 post-signup",
    cohortSize: 0,
    retainedCount: 0,
  },
  messaging: {
    totalVolume: "0 sessions",
    sessionCount: 0,
    activeStudyGroups: 0,
    p2pPercentage: 100,
    groupPercentage: 0,
    definition: "Aggregated peer-to-peer session metadata and group activity counts (zero message inspection)",
  }
};

export const MOCK_TELEMETRY_SERIES: TelemetryPoint[] = [
  {
    dayLabel: "Day 1",
    fullDate: "2026-10-01",
    dau: 0,
    feedViews: 0,
    peerInteractions: 0
  },
  {
    dayLabel: "Day 2",
    fullDate: "2026-10-02",
    dau: 0,
    feedViews: 0,
    peerInteractions: 0
  }
];

export const MOCK_CAMPUS_NODES: CampusNode[] = [
  {
    id: "5K",
    name: "5 Kilo (AAiT Engineering)",
    campusCode: "5K",
    studentCount: 0,
    percentageShare: 0,
    activityIndex: 0,
    dominantThemes: "Electrical, Biomedical & Software Engineering",
    attributionNote: "Attributed via student department affiliation in user profile",
  },
  {
    id: "4K",
    name: "4 Kilo (CNCS Natural Sciences)",
    campusCode: "4K",
    studentCount: 0,
    percentageShare: 0,
    activityIndex: 0,
    dominantThemes: "Computer Science, Statistics & Mathematics",
    attributionNote: "Attributed via student department affiliation in user profile",
  }
];

export const MOCK_COHORT_RETENTION: CohortRetentionRow[] = [
  {
    cohortName: "Current Term",
    registeredCount: 0,
    weeklyRetention: [null, null, null, null, null, null]
  }
];

export const MOCK_MODULE_PENETRATION: ModulePenetrationItem[] = [
  {
    moduleName: "1:1 Student Matching & Chat",
    activeUsersCount: 0,
    totalEligibleCount: 0,
    usageSharePercentage: 0,
    barColorClass: "bg-slate-900",
    description: "Direct peer matching connections and study buddy exchanges",
  },
  {
    moduleName: "Feed & Campus Announcements",
    activeUsersCount: 0,
    totalEligibleCount: 0,
    usageSharePercentage: 0,
    barColorClass: "bg-blue-600",
    description: "Student posts, academic announcements, and campus updates",
  }
];
