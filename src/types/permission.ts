// Permission roles supported by the frontend
export type Role = 'super_admin' | 'admin' | 'manager' | 'no_permission'

// Root permission configuration definition loaded from frontend-permissions.json
export interface PermissionConfig {
  roles: Record<Role, RoleConfig>
  featureDescriptions: Record<string, string>
}

export interface RoleConfig {
  displayName: string
  description: string
  color?: string
  features: FeaturePermissions
  navigation: NavigationPermissions
  routes: RoutePermissions
}

export interface FeaturePermissions {
  users: UserPermissions
  schedules: SchedulePermissions
  discord: DiscordPermissions
  images: ImagePermissions
  system: SystemPermissions
  checkin: CheckinPermissions
}

export interface UserPermissions {
  canView: boolean
  canViewAll: boolean
  canCreate: boolean
  canEdit: boolean
  canEditAll: boolean
  canDelete: boolean
  canManageRoles: boolean
}

export interface SchedulePermissions {
  canView: boolean
  canViewAll: boolean
  canCreate: boolean
  canEdit: boolean
  canEditAll: boolean
  canDelete: boolean
  canDeleteAll: boolean
}

export interface DiscordPermissions {
  canView: boolean
  canViewAll: boolean
  canSendMessage: boolean
  canManageBot: boolean
}

export interface ImagePermissions {
  canView: boolean
  canViewAll: boolean
  canUpload: boolean
  canDelete: boolean
  canDeleteAll: boolean
}

export interface SystemPermissions {
  canViewLogs: boolean
  canViewDashboard: boolean
  canManageSettings: boolean
}

export interface CheckinPermissions {
  canView: boolean
  canViewAll: boolean
  canCreate: boolean
  canEdit: boolean
  canEditAll: boolean
  canDelete: boolean
  canDeleteAll: boolean
}

export interface NavigationPermissions {
  showScheduleNew: boolean
  showScheduleEdit: boolean
  showScheduleCalendar: boolean
  showScheduleStatus: boolean
  showDiscord: boolean
  showProfile: boolean
  showUserManagement: boolean
  showCheckinSchedules: boolean
}

export interface RoutePermissions {
  allowedPaths: string[]
}

export type FeatureKey = keyof FeaturePermissions
export type NavigationKey = keyof NavigationPermissions
