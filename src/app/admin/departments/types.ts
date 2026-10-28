export interface EntitySummary {
  id: string;
  name: string;
  campus: string;
  code: string;
  status:
    | "Active & Publishing Enabled"
    | "Direct Feed Authority"
    | "Active · Service Unit"
    | "Governance Unit"
    | "Inactive · Suspended"
    | "Pending Verification"
    | "Platform Record"
    | "Active";
  collegeAffiliation: string;
  description?: string;
  category: "ACADEMIC" | "ADMIN" | "FACULTY" | "PUBLISHING";
  iconType: "code" | "document" | "cpu" | "library" | "health" | "users" | "building";
  isVerified?: boolean;
  verificationProvenance?: string;
  studentsEnrolled?: number;
  verifiedFacultyCount?: number;
  delegatesCount: number;
  primaryDelegateName?: string;
  lastAnnouncement: { title: string; timeAgo: string };
  scope?: string;
  branchesCount?: number;
  verifiedOfficersCount?: number;
  deanContact?: string;
  clinicalCoordinator?: string;
  headLibrarian?: string;
  studentUnionsCount?: number;
  deanName?: string;
  urgentPriority?: string;
  eDatabaseLink?: string;
  publishingClearance?: string;
}

export interface AuthorizedDelegate {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role: string;
  badge: "Full Clearance" | "Announce" | "Draft Only";
  avatarInitials: string;
  status?: "ACTIVE" | "REVOKED";
  canPublish?: boolean;
  canEmergencyBroadcast?: boolean;
  canBypassModeration?: boolean;
  assignedAt?: string;
}

export interface EntityDetail extends EntitySummary {
  foundingYear: number;
  sisSyncStatus: string;
  authorizedDelegates: AuthorizedDelegate[];
  clearances: {
    emergencyBroadcasts: boolean;
    pinnedFeedNoPreMod: boolean;
    studentDirectQA: boolean;
  };
  broadcastHistory: Array<{
    id: string;
    title: string;
    readRate: string;
    publishedAt: string;
    publishedBy: string;
  }>;
}

export interface EntityMetrics {
  registeredEntities: number;
  academicDepts: number;
  adminOffices: number;
  verifiedFaculty: number;
  sisValidationRate: number;
  sisStatusText?: string;
  authorizedDelegates: number;
  officialBroadcasts: number;
  averageStudentReach: number;
}

export interface DepartmentsDashboardData {
  metrics: EntityMetrics;
  entities: EntityDetail[];
  availableCampuses: string[];
}

export interface CreateDepartmentDTO {
  name: string;
  code?: string;
  category: "ACADEMIC" | "ADMIN";
  campus: string;
  collegeAffiliation?: string;
  description?: string;
  foundingYear?: number;
}

export interface AssignDelegateDTO {
  userId?: string;
  userEmail?: string;
  role: string;
  badge: "Full Clearance" | "Announce" | "Draft Only";
  canEmergencyBroadcast?: boolean;
  canBypassModeration?: boolean;
}
