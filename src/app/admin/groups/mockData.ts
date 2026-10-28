import { GroupMetrics, GroupCaseDetail } from "./types";

export const MOCK_GROUP_METRICS: GroupMetrics = {
  totalActiveGroups: 1842,
  newGroupsThisWeek: 48,
  averageGroupSize: 24.8,
  medianGroupSize: 14,
  quotaComplianceRate: 99.4,
  flaggedCommunitiesCount: 4
};

export const MOCK_TRIAGE_BANNERS = [
  {
    id: "triage-1",
    groupId: "grp-2",
    title: "5 Kilo Exam Cram & Study Vault",
    badgeLabel: "3 Student Reports",
    creatorHandle: "@bereket_k (5 Kilo)",
    description:
      "Reported for commercial sale of leaked midterm exam keys and unverified assessment keys. High velocity Telegram outbound link sharing.",
    theme: "rose" as const
  },
  {
    id: "triage-2",
    groupId: "grp-market",
    title: "AAU Off-Campus Dorm Marketplace",
    badgeLabel: "Scam Alert",
    creatorHandle: "@yonas_b (AAU Main)",
    description:
      "Multiple non-escrow advance rent deposit requests flagged by 2 Freshmen students. Telebirr QR reroutes detected.",
    theme: "slate" as const
  }
];

export const MOCK_GROUP_CASES: GroupCaseDetail[] = [
  {
    id: "grp-2",
    name: "5 Kilo Exam Cram & Study Vault",
    context: "Created 3 wks ago · Private Invite",
    caseFileId: "#GR-2025-09",
    creator: {
      name: "Bereket Kassa",
      handle: "@bereket_k",
      studentId: "UGR/4102/15",
      department: "Elec. Eng",
      avatarInitials: "BK"
    },
    campus: "5 Kilo (AAiT)",
    isPrivate: true,
    memberCount: 342,
    messageVolume: 1240,
    healthScore: 72,
    flagsCount: 3,
    createdAt: "3 wks ago",
    iconType: "lock",
    healthStatus: "Elevated Risk",
    activeFlagLabel: "Active Flag (3 Reports)",
    creatorQuota: {
      used: 2,
      allowed: 3,
      strikeWarning:
        "Creator is currently serving a Strike 2 moderation warning issued Oct 14.",
      standing: "Quota OK"
    },
    flaggedReports: [
      {
        id: "rep-1",
        reporterPseudonym: "Student #4982 (Verified AAiT)",
        time: "Today, 10:14 AM",
        reason:
          "Commercial exam cheat sheet sales. Admin is soliciting 500 ETB for 'midterm questions guarantee!'"
      },
      {
        id: "rep-2",
        reporterPseudonym: "Student #1104 (Verified 5K)",
        time: "Yesterday, 4:20 PM",
        reason:
          "Posting unauthorized past departmental confidential faculty rubrics with Telebirr paywalls."
      }
    ],
    telemetrySignals: [
      "Elevated due to automated detection of 28 outbound external Telegram & Telebirr payment links in under 6 hours."
    ]
  },
  {
    id: "grp-1",
    name: "5 Kilo Tech Hub",
    context: "Created 8 mos ago · Open Peer Dev",
    caseFileId: "#GR-2024-44",
    creator: {
      name: "Dawit Tefera",
      handle: "@dawit_t",
      studentId: "UGR/8831/14",
      department: "AAiT SWE",
      avatarInitials: "DT"
    },
    campus: "5 Kilo (AAiT)",
    isPrivate: false,
    memberCount: 680,
    messageVolume: 3420,
    healthScore: 2,
    flagsCount: 0,
    createdAt: "8 mos ago",
    iconType: "globe",
    healthStatus: "Healthy",
    creatorQuota: {
      used: 1,
      allowed: 3,
      standing: "Quota OK"
    },
    flaggedReports: [],
    telemetrySignals: [
      "Zero spam anomalies detected. Standard academic peer discussions."
    ]
  },
  {
    id: "grp-3",
    name: "SE 4th Year Capstone Brainstorm",
    context: "Created 2 wks ago · Cohort Group",
    caseFileId: "#GR-2025-11",
    creator: {
      name: "Sarah Jemal",
      handle: "@sarah_j",
      studentId: "UGR/9012/14",
      department: "Soft. Eng",
      avatarInitials: "SJ"
    },
    campus: "5 Kilo (AAiT)",
    isPrivate: true,
    memberCount: 28,
    messageVolume: 490,
    healthScore: 1,
    flagsCount: 0,
    createdAt: "2 wks ago",
    iconType: "cohort",
    healthStatus: "Healthy",
    creatorQuota: {
      used: 2,
      allowed: 3,
      standing: "Quota OK"
    },
    flaggedReports: [],
    telemetrySignals: ["Healthy cohort distribution."]
  },
  {
    id: "grp-4",
    name: "Sidist Kilo Philosophy & Book Club",
    context: "Created 1 yr ago · Weekly Discussion",
    caseFileId: "#GR-2024-12",
    creator: {
      name: "Amen Desta",
      handle: "@amen_d",
      studentId: "UGR/3110/13",
      department: "Humanities",
      avatarInitials: "AD"
    },
    campus: "Sidist Kilo (Main)",
    isPrivate: false,
    memberCount: 210,
    messageVolume: 820,
    healthScore: 5,
    flagsCount: 0,
    createdAt: "1 yr ago",
    iconType: "book",
    healthStatus: "Healthy",
    creatorQuota: {
      used: 1,
      allowed: 3,
      standing: "Quota OK"
    },
    flaggedReports: [],
    telemetrySignals: ["Consistent literary discourse."]
  },
  {
    id: "grp-5",
    name: "Pre-Med Tikur Anbessa Study Circle",
    context: "Created 4 mos ago · Clinical Prep",
    caseFileId: "#GR-2024-91",
    creator: {
      name: "Selam Haile",
      handle: "@selam_h",
      studentId: "UGR/6029/14",
      department: "Medicine",
      avatarInitials: "SH"
    },
    campus: "Black Lion (Health)",
    isPrivate: true,
    memberCount: 95,
    messageVolume: 740,
    healthScore: 3,
    flagsCount: 0,
    createdAt: "4 mos ago",
    iconType: "health",
    healthStatus: "Healthy",
    creatorQuota: {
      used: 1,
      allowed: 3,
      standing: "Quota OK"
    },
    flaggedReports: [],
    telemetrySignals: ["Accredited hospital clinical prep materials."]
  },
  {
    id: "grp-6",
    name: "6 Kilo Freshmen Guidance 2025",
    context: "Created 1 mo ago · Campus Onboarding",
    caseFileId: "#GR-2025-18",
    creator: {
      name: "Natnael Mengistu",
      handle: "@natnael_m",
      studentId: "UGR/1209/13",
      department: "Social Science",
      avatarInitials: "NM"
    },
    campus: "6 Kilo Campus",
    isPrivate: false,
    memberCount: 410,
    messageVolume: 1890,
    healthScore: 4,
    flagsCount: 0,
    createdAt: "1 mo ago",
    iconType: "compass",
    healthStatus: "Healthy",
    creatorQuota: {
      used: 2,
      allowed: 3,
      standing: "Quota OK"
    },
    flaggedReports: [],
    telemetrySignals: ["High engagement peer orientation."]
  }
];
