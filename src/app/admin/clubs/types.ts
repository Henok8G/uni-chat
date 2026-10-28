export interface ClubSummary {
  id: string;
  name: string;
  category: "Academic & Tech" | "Arts & Culture" | "Civic" | "Service";
  campus: string;
  leadStudent: { name: string; studentId: string };
  activeMembers: number;
  activityRate: number;
  status: "Official Verified" | "Probationary" | "Suspended";
  auditNotice?: string;
  charterId: string;
}

export interface CharterApplication {
  docketId: string;
  clubName: string;
  department: string;
  campusHub: string;
  status: "Pending Clearance" | "Under Review" | "Needs Clarification";
  scopeMission: string;
  signatoriesCount: number;
  submittedAgo: string;
  submitterName: string;
  submitterDept: string;
  submitterYear: string;
  executiveBoard: Array<{ name: string; role: string; studentId: string; verified?: boolean; dept?: string }>;
  facultyAdvisor: { name: string; title: string; endorsementStatus: boolean; digitalToken?: string; endorsementNote?: string };
  warningNotice?: string;
  proposedHub: string;
  strikesLogged: number;
}

export interface ClubMetrics {
  totalRecognizedClubs: number;
  newClubsThisSem: number;
  collegiateZones: number;
  complianceRate: number;
  pendingCharters: number;
  oldestPendingDays: number;
  avgReviewDays: number;
  studentParticipation: number;
  verifiedParticipationRate: number;
  totalStudents: number;
  probationCount: number;
  suspendedCount: number;
  annualAuditClear: boolean;
}
