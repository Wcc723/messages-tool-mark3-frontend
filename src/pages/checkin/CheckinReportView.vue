<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkinPublicApi } from '@/services/api'
import type { CheckinStats, CheckinUser, PaginationMeta } from '@/services/api/types'

const route = useRoute()
const router = useRouter()
const scheduleId = computed(() => route.params.id as string)

// 狀態
const stats = ref<CheckinStats | null>(null)
const users = ref<CheckinUser[]>([])
const pagination = ref<PaginationMeta>({
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 50,
})
const searchQuery = ref('')
const isLoadingStats = ref(false)
const isLoadingUsers = ref(false)
const error = ref<string | null>(null)

// 載入統計資料
async function loadStats() {
  isLoadingStats.value = true
  error.value = null
  try {
    stats.value = await checkinPublicApi.getCheckinStats(scheduleId.value)
  } catch (err: any) {
    error.value = err.response?.data?.message || '載入統計資料失敗'
    console.error('載入統計資料失敗:', err)
  } finally {
    isLoadingStats.value = false
  }
}

// 載入用戶列表
async function loadUsers(page = 1) {
  isLoadingUsers.value = true
  try {
    const response = await checkinPublicApi.getCheckinUsers(scheduleId.value, {
      page,
      limit: 50,
      search: searchQuery.value || undefined,
    })
    users.value = response.users
    pagination.value = response.pagination
  } catch (err: any) {
    console.error('載入用戶列表失敗:', err)
  } finally {
    isLoadingUsers.value = false
  }
}

// 搜尋
function handleSearch() {
  loadUsers(1)
}

// 分頁
function goToPage(page: number) {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadUsers(page)
  }
}

// 返回列表
function goBack() {
  router.push({ name: 'CheckinSchedules' })
}

// 計算完成率
const progressPercent = computed(() => {
  if (!stats.value || stats.value.expectedTasks === 0) return 0
  return Math.round((stats.value.dailyTasks / stats.value.expectedTasks) * 100)
})

onMounted(() => {
  loadStats()
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          @click="goBack"
        >
          <i class="bi bi-arrow-left text-xl"></i>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            {{ stats?.scheduleName || '打卡報告' }}
          </h1>
          <p class="text-gray-600 mt-1">排程統計與用戶打卡情況</p>
        </div>
      </div>
    </header>

    <!-- Error Alert -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Stats Cards -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 總打卡數 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <i class="bi bi-check2-all text-indigo-600 text-lg"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">總打卡數</p>
            <p class="text-2xl font-bold text-gray-800">
              <template v-if="isLoadingStats">
                <span class="text-gray-400">--</span>
              </template>
              <template v-else>
                {{ stats?.totalCheckins ?? 0 }}
              </template>
            </p>
          </div>
        </div>
      </div>

      <!-- 完成進度 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <i class="bi bi-graph-up text-emerald-600 text-lg"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">完成進度</p>
            <p class="text-2xl font-bold text-gray-800">
              <template v-if="isLoadingStats">
                <span class="text-gray-400">--</span>
              </template>
              <template v-else>
                {{ progressPercent }}%
              </template>
            </p>
          </div>
        </div>
        <div class="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-500 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- 討論串數 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="bi bi-chat-dots text-blue-600 text-lg"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">討論串數</p>
            <p class="text-2xl font-bold text-gray-800">
              <template v-if="isLoadingStats">
                <span class="text-gray-400">--</span>
              </template>
              <template v-else>
                {{ stats?.dailyTasks ?? 0 }}
                <span class="text-sm font-normal text-gray-500">
                  / {{ stats?.expectedTasks ?? 0 }}
                </span>
              </template>
            </p>
          </div>
        </div>
      </div>

      <!-- 參與人數 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="bi bi-people text-purple-600 text-lg"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">參與人數</p>
            <p class="text-2xl font-bold text-gray-800">
              <template v-if="isLoadingStats">
                <span class="text-gray-400">--</span>
              </template>
              <template v-else>
                {{ stats?.uniqueUsers ?? 0 }}
              </template>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- User List -->
    <section class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <!-- Search Bar -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="搜尋用戶名稱或 Discord ID..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @keyup.enter="handleSearch"
            />
          </div>
          <button
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
            @click="handleSearch"
          >
            搜尋
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                用戶
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Discord ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                打卡天數
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Loading -->
            <tr v-if="isLoadingUsers">
              <td colspan="3" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span class="text-gray-500">載入中...</span>
                </div>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="users.length === 0">
              <td colspan="3" class="px-6 py-12 text-center text-gray-500">
                <i class="bi bi-person-x text-3xl text-gray-300 mb-2"></i>
                <p>尚無打卡用戶</p>
              </td>
            </tr>

            <!-- Data -->
            <tr
              v-else
              v-for="user in users"
              :key="user.discordUserId"
              class="hover:bg-gray-50 transition"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <img
                    v-if="user.avatarUrl"
                    :src="user.avatarUrl"
                    :alt="user.displayName"
                    class="w-8 h-8 rounded-full"
                  />
                  <div
                    v-else
                    class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <i class="bi bi-person text-gray-500"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ user.displayName }}</p>
                    <p class="text-xs text-gray-500">@{{ user.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-mono text-gray-600">{{ user.discordUserId }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  {{ user.totalCheckinDays }} 天
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        class="px-4 py-3 border-t border-gray-200 flex items-center justify-between"
      >
        <p class="text-sm text-gray-500">
          共 {{ pagination.totalCount }} 位用戶，第 {{ pagination.currentPage }} / {{ pagination.totalPages }} 頁
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="pagination.currentPage <= 1"
            @click="goToPage(pagination.currentPage - 1)"
          >
            上一頁
          </button>
          <button
            type="button"
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="pagination.currentPage >= pagination.totalPages"
            @click="goToPage(pagination.currentPage + 1)"
          >
            下一頁
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
