import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    permissionPath?: string
    isRootRedirect?: boolean
    isDashboardRedirect?: boolean
  }
}
