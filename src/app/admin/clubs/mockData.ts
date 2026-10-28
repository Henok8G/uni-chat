import { ClubSummary, CharterApplication, ClubMetrics } from "./types";

export const MOCK_CLUB_METRICS: ClubMetrics = {
  totalRecognizedClubs: 42,
  newClubsThisSem: 3,
  collegiateZones: 6,
  complianceRate: 98,
  pendingCharters: 3,
  oldestPendingDays: 5,
  avgReviewDays: 3.2,
  studentParticipation: 8450,
  verifiedParticipationRate: 46,
  totalStudents: 18400,
  probationCount: 1,
  suspendedCount: 0,
  annualAuditClear: true
};

export const MOCK_CHARTER_APPLICATIONS: CharterApplication[] = [
  {
    docketId: "#CH-2025-09",
    clubName: "AAU Robotics & Automation Society",
    department: "Electrical & Computer Eng.",
    campusHub: "5 Kilo (AAiT)",
    status: "Pending Clearance",
    scopeMission:
      "To foster student innovation in autonomous robotics, embedded IoT hardware, and AI-driven automation via weekly hands-on labs and competitive inter-university hackathons.",
    signatoriesCount: 148,
    submittedAgo: "Applied 2d ago",
    submitterName: "Dawit Tadesse",
    submitterDept: "5 Kilo SE/EE",
    submitterYear: "3rd Year",
    proposedHub: "5 Kilo Workshop B",
    strikesLogged: 0,
    executiveBoard: [
      { name: "Dawit Tadesse", role: "President", studentId: "UGR/2219/14", verified: true, dept: "3rd Yr CS" },
      { name: "Bethelhem Assefa", role: "Vice President", studentId: "UGR/5512/14", verified: true, dept: "EiABC" },
      { name: "Kidus Haile", role: "Treasurer", studentId: "UGR/3109/14", verified: true, dept: "Electrical Eng." }
    ],
    facultyAdvisor: {
      name: "Dr. Yohannes Berhanu",
      title: "Dean of Electrical Engineering",
      endorsementStatus: true,
      digitalToken: "SHA256: 9f8a...4b1c",
      endorsementNote: "Endorsed ✓"
    }
  },
  {
    docketId: "#CH-2025-10",
    clubName: "Ethiopian Intercollegiate Debate League (AAU Chapter)",
    department: "School of Law & Political Science",
    campusHub: "Sidist Kilo",
    status: "Under Review",
    scopeMission:
      "Promoting rigorous competitive British Parliamentary debate, critical oratory jurisprudence, and civic discourse across higher education campuses in Eastern Africa.",
    signatoriesCount: 94,
    submittedAgo: "Applied 3d ago",
    submitterName: "Hanna Mekonnen",
    submitterDept: "Sidist Kilo Law",
    submitterYear: "4th Year",
    proposedHub: "Sidist Kilo Hall 12",
    strikesLogged: 0,
    executiveBoard: [
      { name: "Hanna Mekonnen", role: "President", studentId: "UGR/1842/13", verified: true, dept: "4th Yr Law" },
      { name: "Yonas Girma", role: "Debate Master", studentId: "UGR/9011/14", verified: true, dept: "Political Science" },
      { name: "Abebech Bekele", role: "Public Relations", studentId: "UGR/4211/14", verified: false, dept: "Journalism" }
    ],
    facultyAdvisor: {
      name: "Prof. Mesfin Araya",
      title: "Senior Faculty Advisor · School of Law",
      endorsementStatus: false,
      endorsementNote: "Pending Verification"
    }
  },
  {
    docketId: "#CH-2025-11",
    clubName: "Bio-Med Innovators Hub",
    department: "Health Sciences & Biomedical Eng.",
    campusHub: "Black Lion Medical",
    status: "Needs Clarification",
    scopeMission:
      "Interdisciplinary collaboration between pre-med clinicians and biomedical technologists to build affordable diagnostics and hospital telemetry solutions.",
    signatoriesCount: 68,
    submittedAgo: "Applied 5d ago",
    submitterName: "Yared Girma",
    submitterDept: "Black Lion Medical",
    submitterYear: "5th Year",
    proposedHub: "Tikur Anbessa Lab 4",
    strikesLogged: 0,
    warningNotice: "Missing department head authorization letter. Constitution overlaps with Med Students Assoc.",
    executiveBoard: [
      { name: "Yared Girma", role: "President", studentId: "UGR/0192/12", verified: true, dept: "Medical School" },
      { name: "Ruth Tadesse", role: "Tech Lead", studentId: "UGR/7712/14", verified: true, dept: "Biomedical Eng." }
    ],
    facultyAdvisor: {
      name: "Dr. Aster Solomon",
      title: "Chair of Clinical Technology",
      endorsementStatus: false,
      endorsementNote: "Clarification Requested"
    }
  }
];

export const MOCK_RECOGNIZED_CLUBS: ClubSummary[] = [
  {
    id: "clb-1",
    name: "AAU Tech Club",
    category: "Academic & Tech",
    charterId: "ID: #CLB-014",
    campus: "5 Kilo (AAiT)",
    leadStudent: { name: "Surafel Tefera", studentId: "UGR/1900/13" },
    activeMembers: 1420,
    activityRate: 92,
    status: "Official Verified"
  },
  {
    id: "clb-2",
    name: "GDSC AAU (Google Developer)",
    category: "Academic & Tech",
    charterId: "ID: #CLB-008",
    campus: "4 Kilo & 5 Kilo",
    leadStudent: { name: "Lidya Hailu", studentId: "UGR/4412/14" },
    activeMembers: 1150,
    activityRate: 88,
    status: "Official Verified"
  },
  {
    id: "clb-3",
    name: "AAU Debate Club",
    category: "Civic",
    charterId: "ID: #CLB-002",
    campus: "Sidist Kilo",
    leadStudent: { name: "Natnael Desta", studentId: "UGR/6011/13" },
    activeMembers: 850,
    activityRate: 85,
    status: "Official Verified"
  },
  {
    id: "clb-4",
    name: "Creative Arts Community",
    category: "Arts & Culture",
    charterId: "ID: #CLB-021",
    campus: "Yared Music School",
    leadStudent: { name: "Selamawit Kebede", studentId: "UGR/9024/14" },
    activeMembers: 1200,
    activityRate: 94,
    status: "Official Verified"
  },
  {
    id: "clb-5",
    name: "Rotaract Club of Entoto AAU",
    category: "Service",
    charterId: "ID: #CLB-033",
    campus: "Sidist Kilo",
    leadStudent: { name: "Kaleb Mengistu", studentId: "UGR/2120/12" },
    activeMembers: 620,
    activityRate: 74,
    status: "Probationary",
    auditNotice: "Financial audit pending"
  }
];
