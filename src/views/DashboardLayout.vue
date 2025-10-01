<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isSidebarOpen = ref(true)
const isUserMenuOpen = ref(false)

const navItems = [
  { name: '排程管理', path: '/dashboard/schedules', icon: 'calendar' },
  { name: 'Discord 設定', path: '/dashboard/discord', icon: 'discord' },
  { name: '個人資料', path: '/dashboard/profile', icon: 'user' },
]

const mockUser = {
  name: '測試使用者',
  email: 'user@example.com',
  avatar: 'https://ui-avatars.com/api/?name=Test+User&background=4F46E5&color=fff',
}

const handleLogout = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 z-40 h-screen transition-transform',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'w-64 bg-white shadow-lg'
      ]"
    >
      <div class="h-full px-3 py-4 overflow-y-auto">
        <!-- Logo -->
        <div class="mb-8 px-3">
          <h1 class="text-2xl font-bold text-indigo-600">Discord 排程</h1>
          <p class="text-sm text-gray-500 mt-1">訊息管理工具</p>
        </div>

        <!-- Navigation -->
        <nav class="space-y-2">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center px-3 py-2.5 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition"
            :class="{
              'bg-indigo-50 text-indigo-600': route.path.startsWith(item.path)
            }"
          >
            <svg v-if="item.icon === 'calendar'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg v-else-if="item.icon === 'discord'" class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <svg v-else-if="item.icon === 'user'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <div :class="['transition-all', isSidebarOpen ? 'ml-64' : 'ml-0']">
      <!-- Top Bar -->
      <header class="bg-white shadow-sm sticky top-0 z-30">
        <div class="flex items-center justify-between px-6 py-4">
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- User Menu -->
          <div class="relative">
            <button
              @click="isUserMenuOpen = !isUserMenuOpen"
              class="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition"
            >
              <img :src="mockUser.avatar" alt="User" class="w-8 h-8 rounded-full">
              <div class="text-left hidden md:block">
                <p class="text-sm font-medium text-gray-700">{{ mockUser.name }}</p>
                <p class="text-xs text-gray-500">{{ mockUser.email }}</p>
              </div>
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200"
            >
              <router-link
                to="/dashboard/profile"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="isUserMenuOpen = false"
              >
                個人資料
              </router-link>
              <hr class="my-1">
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
