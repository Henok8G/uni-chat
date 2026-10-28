export interface BroadcastMetrics {
  totalBroadcastsCreated: number;
  pendingClearanceCount: number;
  inAppNotificationsDelivered: number;
  inAppNotificationsRead: number;
  readRatePercentage: number;
  urgentUnreadCount: number;
  failedDeliveryCount: number;
  registeredStudentsCount: number;
  verifiedStudentsCount: number;
  externalPushAvailable: boolean;
  externalSmsAvailable: boolean;
  externalSisEmailAvailable: boolean;
}

export interface PendingClearanceItem {
  id: string;
  title: string;
  body: string;
  severity: "INFORMATIONAL" | "IMPORTANT" | "EMERGENCY";
  audienceScope: "ALL" | "DEPARTMENT" | "COHORT" | "CAMPUS";
  targetDepartment?: string | null;
  targetCohort?: number | null;
  targetCampus?: string | null;
  deepLink?: string | null;
  status: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
}

export interface BroadcastHistoryItem {
  id: string;
  title: string;
  body: string;
  severity: "INFORMATIONAL" | "IMPORTANT" | "EMERGENCY";
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENDING" | "SENT" | "REJECTED" | "CANCELLED";
  audienceScope: "ALL" | "DEPARTMENT" | "COHORT" | "CAMPUS";
  targetDepartment?: string | null;
  targetCohort?: number | null;
  targetCampus?: string | null;
  recipientCount: number;
  failureCount: number;
  sentAt: string | null;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  reviewerName?: string | null;
  rejectionReason?: string | null;
}

export interface PushComposerDraft {
  title: string;
  body: string;
  severity: "INFORMATIONAL" | "IMPORTANT" | "EMERGENCY";
  audienceScope: "ALL" | "DEPARTMENT" | "COHORT" | "CAMPUS";
  targetDepartment: string;
  targetCohort: number;
  targetCampus: string;
  deepLink: string;
  timing: "immediate" | "scheduled";
}

export interface TargetingOptions {
  availableDepartments: Array<{ name: string; studentCount: number }>;
  availableCohorts: Array<{ year: number; name: string; studentCount: number }>;
  totalRegisteredStudents: number;
}
