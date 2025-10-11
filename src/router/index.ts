import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
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
        redirect: '/dashboard/schedule/new',
        meta: {
          requiresAuth: true,
          permissionPath: '/dashboard',
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

  const isPublicRoute = PUBLIC_ROUTES.has(to.path)
  const requiresAuth = to.meta.requiresAuth ?? !isPublicRoute

  if (!requiresAuth) {
    if (authStore.token && to.path === '/login') {
      try {
        if (!authStore.user) {
          await authStore.fetchProfile()
        }
      } catch (error) {
        await authStore.logout()
        return next({ name: 'Login' })
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
    } catch (error) {
      await authStore.logout()
      return next({ name: 'Login' })
    }
  }

  const permissionPath = (to.meta.permissionPath as string) || to.path

  if (!permissionStore.canAccessRoute(permissionPath)) {
    const fallback = permissionStore.currentRoleConfig?.routes.allowedPaths[0]
    if (fallback) {
      return next({ path: fallback })
    }

    return next({ name: 'Login' })
  }

  return next()
})

export default router
