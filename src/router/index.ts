import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/pages/DashboardLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard/schedule/new',
        },
        {
          path: 'schedule/new',
          name: 'ScheduleCreate',
          component: () => import('@/pages/ScheduleCreateView.vue'),
        },
        {
          path: 'schedule/edit/:id',
          name: 'ScheduleEdit',
          component: () => import('@/pages/ScheduleCreateView.vue'),
        },
        {
          path: 'schedule/calendar',
          name: 'ScheduleCalendar',
          component: () => import('@/pages/ScheduleCalendarView.vue'),
        },
        {
          path: 'schedule/status',
          name: 'ScheduleStatus',
          component: () => import('@/pages/ScheduleStatusView.vue'),
        },
        {
          path: 'discord',
          name: 'Discord',
          component: () => import('@/pages/DiscordView.vue'),
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/pages/ProfileView.vue'),
        },
      ],
    },
  ],
})

export default router
