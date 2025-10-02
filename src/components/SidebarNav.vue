<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

interface NavGroup {
  title: string
  items: NavItem[]
}

interface NavItem {
  name: string
  path: string
  icon: string
}

const navGroups: NavGroup[] = [
  {
    title: 'Discord 排程',
    items: [
      { name: '新增排程', path: '/dashboard/schedule/new', icon: 'bi-plus-circle' },
      { name: '排程行事曆', path: '/dashboard/schedule/calendar', icon: 'bi-calendar-check' },
      { name: '排程狀態', path: '/dashboard/schedule/status', icon: 'bi-clock-history' },
      { name: 'Discord 設定', path: '/dashboard/discord', icon: 'bi-discord' },
    ],
  },
  {
    title: '帳號設定',
    items: [
      { name: '個人資料', path: '/dashboard/profile', icon: 'bi-person-circle' },
    ],
  },
]
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
            'bg-indigo-50 text-indigo-600': route.path.startsWith(item.path)
          }"
        >
          <i :class="[item.icon, 'text-lg mr-3']"></i>
          {{ item.name }}
        </router-link>
      </div>
    </div>
  </nav>
</template>
