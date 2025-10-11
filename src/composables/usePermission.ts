import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/stores/permission'
import type { FeatureKey, NavigationKey } from '@/types/permission'

type PermissionCheckParams<T extends FeatureKey = FeatureKey> = {
  feature: T
  action: string
}

function resolveBinding(el: HTMLElement, binding: DirectiveBinding<PermissionCheckParams>) {
  if (!binding.value) {
    console.warn('v-permission requires a value object, e.g. v-permission="{ feature, action }"')
    return
  }

  const permissionStore = usePermissionStore()
  const { feature, action } = binding.value
  const isAllowed = permissionStore.hasPermission(feature, action)

  if (!isAllowed) {
    el.dataset.originalDisplay = el.dataset.originalDisplay ?? el.style.display
    el.style.display = 'none'
    el.setAttribute('aria-hidden', 'true')
  } else {
    if (el.dataset.originalDisplay) {
      el.style.display = el.dataset.originalDisplay
    } else {
      el.style.removeProperty('display')
    }
    el.removeAttribute('aria-hidden')
  }
}

export const vPermission: Directive<HTMLElement, PermissionCheckParams> = {
  mounted(el, binding) {
    resolveBinding(el, binding)
  },
  updated(el, binding) {
    resolveBinding(el, binding)
  },
}

export function usePermission() {
  const permissionStore = usePermissionStore()

  return {
    hasPermission: permissionStore.hasPermission,
    canAccessRoute: permissionStore.canAccessRoute,
    shouldShowNavItem: permissionStore.shouldShowNavItem,
    isAdmin: permissionStore.isAdmin,
    isSuperAdmin: permissionStore.isSuperAdmin,
    currentRole: permissionStore.currentRole,
    currentRoleConfig: permissionStore.currentRoleConfig,
  }
}

export type { FeatureKey, NavigationKey, PermissionCheckParams }
