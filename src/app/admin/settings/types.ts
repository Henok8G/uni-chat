export type SettingsActiveTab =
  | 'general'
  | 'authentication'
  | 'privacy'
  | 'api_keys';

export interface CampusClusterNode {
  id: string;
  name: string;
  campusCode: string;
  departmentCluster: string;
  status: 'Active Logical Partition' | 'Recognized Campus Partition';
  departmentsCount: number;
  activeStudentsCount: number;
  isPrimaryPartition: boolean;
  geographicNote: string;
}

export interface AuthPolicyStatus {
  sessionEngine: string;
  staffSessionHours: number;
  studentSessionDays: number;
  cookieSecurity: string;
  domainVerificationRequired: boolean;
  mfaStatus: string;
  shibbolethSsoStatus: string;
  shibbolethEndpoint: string;
  entityIdUri: string;
  sisSyncStatus: {
    status: string;
    description: string;
    lastChecked: string;
  };
  googleOAuthStatus: 'Configured' | 'Not Configured';
}

export interface PrivacyGovernanceStatus {
  messageTransportProtocol: string;
  messageStorageArchitecture: string;
  encryptionDescription: string;
  unsubstantiatedReportRetentionDays: number;
  groupQuotaPerStudent: number;
  sensitiveCaseInspectionGovernance: {
    status: string;
    description: string;
    auditEnforced: boolean;
  };
}

export interface ServiceIntegrationStatus {
  id: string;
  name: string;
  serviceCategory: 'Database' | 'Cache / Socket' | 'Email Relay' | 'Media / WebRTC' | 'Auth Provider' | 'Telemetry';
  status: 'Connected' | 'Configured' | 'Not Configured' | 'Running In-Memory';
  badgeStyle: string;
  hostDisplay: string;
  details: string;
  lastChecked: string;
  actionGuidance?: string;
}

export interface InfrastructureHealthTelemetry {
  database: {
    status: 'Healthy' | 'Degraded' | 'Offline';
    provider: string;
    latencyMs: number;
    connectionPoolType: string;
    replicationModel: string;
  };
  runtime: {
    hostPlatform: string;
    nodeVersion: string;
    uptimeHours: number;
    memoryRssMb: number;
    middlewareActive: boolean;
    protectedRoutesCount: number;
  };
  securityAudit: {
    cipherStandard: string;
    auditLogCount: number;
    lastAuditEventDate: string;
    complianceFramework: string;
  };
}

export interface RateLimitingStatus {
  gatewayRouteProtection: string;
  dailyMatchingVelocityLimit: number;
  broadcastMandatoryDelayMins: number;
  telemetryNotice: string;
}

export interface SettingsAuditItem {
  id: string;
  adminEmail: string;
  action: string;
  createdAt: string;
  detailsSummary: string;
}

export interface PlatformSettingsData {
  configVersion: number;
  lastUpdated: string;
  updatedBy: string;
  campusNodes: CampusClusterNode[];
  authPolicy: AuthPolicyStatus;
  privacyGovernance: PrivacyGovernanceStatus;
  serviceIntegrations: ServiceIntegrationStatus[];
  infraHealth: InfrastructureHealthTelemetry;
  rateLimits: RateLimitingStatus;
  recentAuditHistory: SettingsAuditItem[];
  // Editable policies
  crossCampusPeerDiscovery: boolean;
  intraCampusProximityPriority: boolean;
  crossCampusGroupParticipation: boolean;
  campusAwareMatching: boolean;
  staffSessionHours: number;
  studentSessionDays: number;
  maxGroupsPerStudent: number;
  unsubstantiatedReportRetentionDays: number;
  broadcastOnlyMode: boolean;
  emergencyNoticeBanner: string;
}
