import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    component: () => import('@/pages/LoginView.vue'),
    meta: {
      requiresAuth: false,
      isRootRedirect: true,
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginView.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardLayout.vue'),
    meta: {
      requiresAuth: true,
      permissionPath: '/dashboard',
    },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('@/pages/DashboardLayout.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard',
          isDashboardRedirect: true,
        },
      },
      {
        path: 'schedule/new',
        name: 'ScheduleCreate',
        component: () => import('@/pages/ScheduleCreateView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/schedule/new',
        },
      },
      {
        path: 'schedule/edit/:id',
        name: 'ScheduleEdit',
        component: () => import('@/pages/ScheduleCreateView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/schedule/edit/:id',
        },
      },
      {
        path: 'schedule/calendar',
        name: 'ScheduleCalendar',
        component: () => import('@/pages/ScheduleCalendarView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/schedule/calendar',
        },
      },
      {
        path: 'schedule/status',
        name: 'ScheduleStatus',
        component: () => import('@/pages/ScheduleStatusView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/schedule/status',
        },
      },
      {
        path: 'discord',
        name: 'Discord',
        component: () => import('@/pages/DiscordView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/discord',
        },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/pages/ProfileView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/profile',
        },
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/pages/admin/UserManagementView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/admin/users',
        },
      },
      {
        path: 'checkin/schedules',
        name: 'CheckinSchedules',
        component: () => import('@/pages/checkin/CheckinScheduleListView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/checkin/schedules',
        },
      },
      {
        path: 'checkin/schedules/new',
        name: 'CheckinScheduleCreate',
        component: () => import('@/pages/checkin/CheckinScheduleFormView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/checkin/schedules/new',
        },
      },
      {
        path: 'checkin/schedules/edit/:id',
        name: 'CheckinScheduleEdit',
        component: () => import('@/pages/checkin/CheckinScheduleFormView.vue'),
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard/checkin/schedules/edit/:id',
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

const PUBLIC_ROUTES = new Set(['/login'])

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const permissionStore = usePermissionStore()

  // Handle root path redirect - must redirect before any other checks
  if (to.meta.isRootRedirect) {
    if (authStore.token) {
      try {
        if (!authStore.user) {
          await authStore.fetchProfile()
        }
        const fallback = permissionStore.currentRoleConfig?.routes.allowedPaths[0] ?? '/dashboard/profile'
        return next({ path: fallback, replace: true })
      } catch {
        await authStore.logout()
        return next({ name: 'Login', replace: true })
      }
    }
    return next({ name: 'Login', replace: true })
  }

  const isPublicRoute = PUBLIC_ROUTES.has(to.path)
  const requiresAuth = to.meta.requiresAuth ?? !isPublicRoute

  if (!requiresAuth) {
    if (authStore.token && to.path === '/login') {
      try {
        if (!authStore.user) {
          await authStore.fetchProfile()
        }
      } catch {
        await authStore.logout()
        // Don't redirect, just continue to login page to avoid loop
        return next()
      }

      const fallback = permissionStore.currentRoleConfig?.routes.allowedPaths[0] ?? '/dashboard'
      return next({ path: fallback })
    }

    return next()
  }

  if (!authStore.token) {
    return next({
      name: 'Login',
      query: { redirect: to.fullPath },
    })
  }

  if (!authStore.user) {
    try {
      await authStore.fetchProfile()
    } catch {
      await authStore.logout()
      return next({ name: 'Login' })
    }
  }

  // Handle /dashboard root redirect - must redirect before permission check
  if (to.meta.isDashboardRedirect) {
    const allowedPaths = permissionStore.currentRoleConfig?.routes.allowedPaths || []
    // Find first non-dashboard path, or fallback to /dashboard/profile
    const targetPath = allowedPaths.find(path => path !== '/dashboard') || '/dashboard/profile'
    return next({ path: targetPath, replace: true })
  }

  // Check route permissions
  const permissionPath = (to.meta.permissionPath as string) || to.path

  if (!permissionStore.canAccessRoute(permissionPath)) {
    const allowedPaths = permissionStore.currentRoleConfig?.routes.allowedPaths || []
    const fallback = allowedPaths.find(path => path !== '/dashboard') || allowedPaths[0]

    if (fallback && fallback !== to.path) {
      return next({ path: fallback, replace: true })
    }

    // No valid routes available, logout and redirect to login
    await authStore.logout()
    return next({ name: 'Login' })
  }

  return next()
})

export default router
