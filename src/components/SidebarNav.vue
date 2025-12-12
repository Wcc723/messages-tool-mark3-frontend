<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import type { NavigationKey } from '@/types/permission'

const route = useRoute()
const permissionStore = usePermissionStore()

interface NavItem {
  name: string
  path: string
  icon: string
  permissionKey: NavigationKey
}

interface NavGroup {
  title: string
  items: NavItem[]
  showIf?: () => boolean
}

const allNavGroups: NavGroup[] = [
  {
    title: 'Discord 排程',
    items: [
      {
        name: '新增排程',
        path: '/dashboard/schedule/new',
        icon: 'bi-plus-circle',
        permissionKey: 'showScheduleNew',
      },
      {
        name: '排程行事曆',
        path: '/dashboard/schedule/calendar',
        icon: 'bi-calendar-check',
        permissionKey: 'showScheduleCalendar',
      },
      {
        name: '排程狀態',
        path: '/dashboard/schedule/status',
        icon: 'bi-clock-history',
        permissionKey: 'showScheduleStatus',
      },
      {
        name: 'Discord 設定',
        path: '/dashboard/discord',
        icon: 'bi-discord',
        permissionKey: 'showDiscord',
      },
    ],
  },
  {
    title: '打卡管理',
    items: [
      {
        name: '打卡排程',
        path: '/dashboard/checkin/schedules',
        icon: 'bi-clipboard-check',
        permissionKey: 'showCheckinSchedules',
      },
    ],
  },
  {
    title: '系統管理',
    showIf: () => permissionStore.isAdmin(),
    items: [
      {
        name: '使用者管理',
        path: '/dashboard/admin/users',
        icon: 'bi-people',
        permissionKey: 'showUserManagement',
      },
    ],
  },
  {
    title: '帳號設定',
    items: [
      {
        name: '個人資料',
        path: '/dashboard/profile',
        icon: 'bi-person-circle',
        permissionKey: 'showProfile',
      },
    ],
  },
]

const navGroups = computed(() => {
  return allNavGroups
    .map((group) => {
      if (group.showIf && !group.showIf()) return null

      const visibleItems = group.items.filter((item) =>
        permissionStore.shouldShowNavItem(item.permissionKey)
      )

      if (visibleItems.length === 0) return null

      return {
        ...group,
        items: visibleItems,
      }
    })
    .filter((group): group is NavGroup => group !== null)
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <nav class="space-y-6">
    <div v-for="group in navGroups" :key="group.title" class="space-y-2">
      <h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {{ group.title }}
      </h3>
      <div class="space-y-1">
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="flex items-center px-3 py-2.5 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
          :class="{
            'bg-indigo-50 text-indigo-600': isActive(item.path)
          }"
        >
          <i :class="[item.icon, 'text-lg mr-3']"></i>
          {{ item.name }}
        </router-link>
      </div>
    </div>
  </nav>
</template>
