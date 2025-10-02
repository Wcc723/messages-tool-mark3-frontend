<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SidebarNav from '@/components/SidebarNav.vue'

const router = useRouter()

const isSidebarOpen = ref(true)
const isUserMenuOpen = ref(false)

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
        'w-64 bg-white shadow-lg',
      ]"
    >
      <div class="h-full px-3 py-4 overflow-y-auto">
        <!-- Logo -->
        <div class="mb-8 px-3">
          <h1 class="text-2xl font-bold text-indigo-600">Discord 排程</h1>
          <p class="text-sm text-gray-500 mt-1">訊息管理工具</p>
        </div>

        <!-- Navigation -->
        <SidebarNav />
      </div>
    </aside>

    <!-- Main Content -->
    <div :class="['transition-all', isSidebarOpen ? 'ml-64' : 'ml-0']">
      <!-- Top Bar -->
      <header class="bg-white shadow-sm sticky top-0 z-30">
        <div class="flex items-center justify-between px-6 py-4">
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <i class="bi bi-list text-2xl"></i>
          </button>

          <!-- User Menu -->
          <div class="relative">
            <button
              @click="isUserMenuOpen = !isUserMenuOpen"
              class="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition cursor-pointer"
            >
              <img :src="mockUser.avatar" alt="User" class="w-8 h-8 rounded-full" />
              <div class="text-left hidden md:block">
                <p class="text-sm font-medium text-gray-700">{{ mockUser.name }}</p>
                <p class="text-xs text-gray-500">{{ mockUser.email }}</p>
              </div>
              <i class="bi bi-chevron-down text-gray-500"></i>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200"
            >
              <router-link
                to="/dashboard/profile"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                @click="isUserMenuOpen = false"
              >
                個人資料
              </router-link>
              <hr class="my-1" />
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6 relative">
        <router-view />
      </main>
    </div>
  </div>
</template>
