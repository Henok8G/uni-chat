import {
  BroadcastMetrics,
  PendingClearanceItem,
  BroadcastHistoryItem,
  PushComposerDraft,
} from "./types";

export const EMPTY_BROADCAST_METRICS: BroadcastMetrics = {
  totalBroadcastsCreated: 0,
  pendingClearanceCount: 0,
  inAppNotificationsDelivered: 0,
  inAppNotificationsRead: 0,
  readRatePercentage: 0,
  urgentUnreadCount: 0,
  failedDeliveryCount: 0,
  registeredStudentsCount: 0,
  verifiedStudentsCount: 0,
  externalPushAvailable: false,
  externalSmsAvailable: false,
  externalSisEmailAvailable: false,
};

export const DEFAULT_COMPOSER_DRAFT: PushComposerDraft = {
  title: "",
  body: "",
  severity: "INFORMATIONAL",
  audienceScope: "ALL",
  targetDepartment: "",
  targetCohort: 1,
  targetCampus: "All Campuses",
  deepLink: "/",
  timing: "immediate",
};
