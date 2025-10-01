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
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard/schedules',
        },
        {
          path: 'schedules',
          name: 'Schedules',
          component: () => import('@/views/SchedulesView.vue'),
        },
        {
          path: 'schedules/new',
          name: 'CreateSchedule',
          component: () => import('@/views/ScheduleFormView.vue'),
        },
        {
          path: 'schedules/:id/edit',
          name: 'EditSchedule',
          component: () => import('@/views/ScheduleFormView.vue'),
        },
        {
          path: 'discord',
          name: 'Discord',
          component: () => import('@/views/DiscordView.vue'),
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/ProfileView.vue'),
        },
      ],
    },
  ],
})

export default router
