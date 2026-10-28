import { MatchingFunnelMetrics, CrossDeptPair, GuardrailSettings } from "./types";

export const MOCK_MATCHING_METRICS: MatchingFunnelMetrics = {
  totalMatches: 48290,
  monthlyPerStudent: 3.2,
  acceptanceRate: 68.4,
  acceptanceRateDelta: 3.1,
  chatInitiationRate: 54.1,
  chatInitiationDelta: 5.2,
  disciplinaryFlagRate: 0.12,
  semesterReportsCount: 6,
  funnelStages: [
    {
      step: 1,
      name: "Algorithm Match Suggestions Generated",
      count: 124500,
      conversionPercentage: 100,
      description: "100% baseline"
    },
    {
      step: 2,
      name: "Cards Explored / Profile Viewed",
      count: 89400,
      conversionPercentage: 71.8,
      description: "71.8% conversion"
    },
    {
      step: 3,
      name: "Mutual Peer Connection Accepted",
      count: 33030,
      conversionPercentage: 37.0,
      description: "37.0% of viewed"
    },
    {
      step: 4,
      name: "Active Collaborative DM Exchange (>10 msgs)",
      count: 17870,
      conversionPercentage: 54.1,
      description: "54.1% stickiness"
    },
    {
      step: 5,
      name: "In-Person / Campus Meetup Indicated",
      count: 6420,
      conversionPercentage: 19.4,
      description: "19.4% conversion"
    }
  ],
  affinityVectors: [
    { category: "Academic Study", weightPercentage: 42 },
    { category: "Hackathon & Project", weightPercentage: 28 },
    { category: "Department Peer Mentorship", weightPercentage: 18 },
    { category: "Hobby & Cultural", weightPercentage: 12 }
  ],
  campusShare: [
    { campusName: "5 Kilo (AAiT Engineering)", percentage: 34, tagColor: "bg-slate-900" },
    { campusName: "4 Kilo (CNCS Natural Sci)", percentage: 26, tagColor: "bg-blue-600" },
    { campusName: "Sidist Kilo (Main & Humanities)", percentage: 22, tagColor: "bg-blue-300" },
    { campusName: "Tikur Anbessa (Health & Med)", percentage: 18, tagColor: "bg-slate-600" }
  ]
};

export const MOCK_CROSS_DEPT_PAIRS: CrossDeptPair[] = [
  {
    id: "pair-1",
    sourceDept: "Computer Science",
    targetDept: "Electrical Eng.",
    sourceCampus: "5 Kilo",
    targetCampus: "5 Kilo",
    volumeTier: "High Volume",
    commonThemes: ["Embedded IoT", "Robosoccer", "AI models"],
    totalMatchesThisTerm: 9420,
    mutualRate: 78.2
  },
  {
    id: "pair-2",
    sourceDept: "Architecture",
    targetDept: "Civil Engineering",
    sourceCampus: "EiABC",
    targetCampus: "5 Kilo",
    volumeTier: "High Volume",
    commonThemes: ["Urban resilience", "CAD 3D studio", "GIS"],
    totalMatchesThisTerm: 6830,
    mutualRate: 71.5
  },
  {
    id: "pair-3",
    sourceDept: "Medicine (CHS)",
    targetDept: "Biomedical Science",
    sourceCampus: "Tikur Anbessa",
    targetCampus: "4 Kilo",
    volumeTier: "High Volume",
    commonThemes: ["Clinical research", "epidemiology models"],
    totalMatchesThisTerm: 5110,
    mutualRate: 69.8
  },
  {
    id: "pair-4",
    sourceDept: "School of Law",
    targetDept: "Social Sciences",
    sourceCampus: "Sidist Kilo",
    targetCampus: "Sidist Kilo",
    volumeTier: "Moderate",
    commonThemes: ["Debate league", "policy clinics", "ethics"],
    totalMatchesThisTerm: 4390,
    mutualRate: 62.1
  }
];

export const MOCK_GUARDRAIL_SETTINGS: GuardrailSettings = {
  crossGenderCooldown: true,
  proximityBiasWeight: 65,
  dailyMatchCap: 5,
  freshmanMentorshipEnabled: true,
  activeAnomalies: [
    {
      id: "anom-1",
      alertCode: "Alert #M-892",
      timeAgo: "14m ago",
      description:
        "High-velocity matching rate detected on Sidist Kilo node (12 requests/min).",
      throttled: true,
      actionTaken: "Throttled automatically by Rate Limiter"
    },
    {
      id: "anom-2",
      alertCode: "Alert #M-893",
      timeAgo: "42m ago",
      description:
        "Rapid repetitive unmatching pattern flagged (Student ID: AAU-ET-4891).",
      throttled: true,
      actionTaken: "Under automated 24h cooldown"
    }
  ]
};
