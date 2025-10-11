import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import permissionConfig from '../../doc/frontend-permissions.json'
import type { FeatureKey, NavigationKey, PermissionConfig, Role, RoleConfig } from '@/types/permission'
import { useAuthStore } from './auth'

export const usePermissionStore = defineStore('permission', () => {
  const authStore = useAuthStore()

  const config = ref<PermissionConfig>(permissionConfig as PermissionConfig)

  const currentRole = computed<Role>(() => {
    const role = authStore.user?.role
    return role ?? 'no_permission'
  })

  const currentRoleConfig = computed<RoleConfig | null>(() => {
    return config.value.roles[currentRole.value] ?? null
  })

  function hasPermission(feature: FeatureKey, action: string): boolean {
    const roleConfig = currentRoleConfig.value
    if (!roleConfig) return false

    const featurePermissions = roleConfig.features[feature] as unknown as Record<string, boolean>
    return featurePermissions?.[action] === true
  }

  function canAccessRoute(path: string): boolean {
    const roleConfig = currentRoleConfig.value
    if (!roleConfig) return false

    const allowedPaths = roleConfig.routes.allowedPaths
    if (allowedPaths.includes(path)) {
      return true
    }

    return allowedPaths.some((allowedPath) => {
      const pattern = allowedPath.replace(/:[^/]+/g, '[^/]+')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(path)
    })
  }

  function shouldShowNavItem(key: NavigationKey): boolean {
    const roleConfig = currentRoleConfig.value
    if (!roleConfig) return false
    return roleConfig.navigation[key] === true
  }

  function isAdmin(): boolean {
    return currentRole.value === 'super_admin' || currentRole.value === 'admin'
  }

  function isSuperAdmin(): boolean {
    return currentRole.value === 'super_admin'
  }

  return {
    config,
    currentRole,
    currentRoleConfig,
    hasPermission,
    canAccessRoute,
    shouldShowNavItem,
    isAdmin,
    isSuperAdmin,
  }
})
