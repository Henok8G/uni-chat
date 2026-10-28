import { UserRole, AdminPermission } from "@prisma/client";

export type PermissionStatus =
  | 'granted'
  | 'restricted'
  | 'dual_approval'
  | 'committee_only'
  | 'super_admin_only';

export type PermissionLevelBadge = 'Read' | 'Write' | 'Privileged' | 'Audit-Heavy';

export interface PermissionItem {
  id: string;
  permCode?: AdminPermission;
  title: string;
  description: string;
  levelBadge?: PermissionLevelBadge;
  status: PermissionStatus;
  statusLabel?: string;
  isToggleable?: boolean;
  toggleValue?: boolean;
  requiresNotice?: string;
}

export interface PermissionCategory {
  id: string;
  categoryNumber: number;
  title: string;
  description: string;
  grantedCount: number;
  totalCount: number;
  permissions: PermissionItem[];
}

export interface RoleArchetype {
  id: string;
  roleKey: UserRole;
  name: string;
  tierLabel: string;
  isSystemLocked: boolean;
  scopeSummary: string;
  description: string;
  memberCount: number;
  isSelected?: boolean;
  iconName: 'lock' | 'shield' | 'megaphone' | 'users' | 'activity';
  badgeStyle?: string;
}

export interface AssignedStaffMember {
  id: string;
  name: string;
  email: string;
  title: string;
  role: UserRole;
  campus: string;
  department?: string | null;
  avatarUrl?: string;
  isVerified?: boolean;
  assignedAt?: string;
}

export interface RoleAuditRecord {
  id: string;
  timeAgo: string;
  timestamp: string;
  actor: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string | null;
}

export interface RoleInspectorData {
  roleId: string;
  roleKey: UserRole;
  roleName: string;
  description: string;
  isSystemLocked: boolean;
  assignedStaff: AssignedStaffMember[];
  grantedPermissionsCount: number;
  totalPermissionsCount: number;
  operationalAuthorityPercentage: number;
  lastUpdated?: string;
}

export interface TeamManagementData {
  roleArchetypes: RoleArchetype[];
  selectedRoleKey: UserRole;
  permissionCategories: PermissionCategory[];
  inspectorData: RoleInspectorData;
  assignedStaff: AssignedStaffMember[];
  recentAuditHistory: RoleAuditRecord[];
  totalStats: {
    total: number;
    granted: number;
    restricted: number;
  };
}

export type PermissionFilter = 'all' | 'granted' | 'restricted';
