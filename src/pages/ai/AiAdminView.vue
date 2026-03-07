<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiAdminApi } from '@/services/api'
import type {
  AIStatistics,
  AIUsageTrend,
  AILeaderboardItem,
  GenerationHistoryAdmin,
  GenerationStatus,
} from '@/types/ai-generation'

// 統計資料
const statistics = ref<AIStatistics | null>(null)
const usageTrend = ref<AIUsageTrend[]>([])
const leaderboard = ref<AILeaderboardItem[]>([])
const historyList = ref<GenerationHistoryAdmin[]>([])

// 分頁與篩選
const historyPage = ref(1)
const historyTotalPages = ref(1)
const historyStatus = ref<string>('')
const historyUserId = ref<string>('')
const historyStartDate = ref<string>('')
const historyEndDate = ref<string>('')

// 載入狀態
const isLoadingStats = ref(false)
const isLoadingTrend = ref(false)
const isLoadingLeaderboard = ref(false)
const isLoadingHistory = ref(false)
const error = ref<string | null>(null)

// 趨勢天數選項
const trendDays = ref(30)
const trendDaysOptions = [7, 14, 30, 60, 90]

// 格式化數字
function formatNumber(num: number | undefined | null): string {
  if (num == null) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化成本
function formatCost(cost: number | string | undefined | null): string {
  if (cost == null) return '$0.00'
  const num = typeof cost === 'string' ? parseFloat(cost) : cost
  if (isNaN(num)) return '$0.00'
  return '$' + num.toFixed(2)
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  })
}

// 格式化日期時間
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 狀態標籤樣式
function getStatusClass(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-700'
    case 'failed':
      return 'bg-red-100 text-red-700'
    case 'filtered':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// 狀態標籤文字
function getStatusText(status: string): string {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失敗'
    case 'filtered':
      return '已過濾'
    default:
      return status
  }
}

// 載入統計資料
async function loadStatistics() {
  isLoadingStats.value = true
  try {
    statistics.value = await aiAdminApi.getStatistics()
  } catch (err: any) {
    console.error('載入統計資料失敗:', err)
    error.value = err.response?.data?.message || '載入統計資料失敗'
  } finally {
    isLoadingStats.value = false
  }
}

// 載入使用趨勢
async function loadUsageTrend() {
  isLoadingTrend.value = true
  try {
    usageTrend.value = (await aiAdminApi.getTrend(trendDays.value)) || []
  } catch (err: any) {
    console.error('載入使用趨勢失敗:', err)
  } finally {
    isLoadingTrend.value = false
  }
}

// 載入排行榜
async function loadLeaderboard() {
  isLoadingLeaderboard.value = true
  try {
    leaderboard.value = (await aiAdminApi.getLeaderboard({ limit: 10 })) || []
  } catch (err: any) {
    console.error('載入排行榜失敗:', err)
  } finally {
    isLoadingLeaderboard.value = false
  }
}

// 載入生成歷史
async function loadHistory() {
  isLoadingHistory.value = true
  try {
    const result = await aiAdminApi.getHistory({
      page: historyPage.value,
      status: (historyStatus.value as GenerationStatus) || undefined,
      userId: historyUserId.value || undefined,
      startDate: historyStartDate.value || undefined,
      endDate: historyEndDate.value || undefined,
    })
    historyList.value = result?.data || []
    historyTotalPages.value = result?.pagination?.totalPages || 1
  } catch (err: any) {
    console.error('載入生成歷史失敗:', err)
  } finally {
    isLoadingHistory.value = false
  }
}

// 切換趨勢天數
function changeTrendDays(days: number) {
  trendDays.value = days
  loadUsageTrend()
}

// 篩選歷史
function filterHistory() {
  historyPage.value = 1
  loadHistory()
}

// 歷史分頁
function goToHistoryPage(page: number) {
  if (page >= 1 && page <= historyTotalPages.value) {
    historyPage.value = page
    loadHistory()
  }
}

onMounted(async () => {
  await Promise.all([
    loadStatistics(),
    loadUsageTrend(),
    loadLeaderboard(),
    loadHistory(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
        <i class="bi bi-bar-chart-line text-gray-600 text-lg"></i>
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-900">AI 統計</h1>
        <p class="text-gray-600">查看 AI 圖片生成的使用統計與審計日誌</p>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
    >
      <i class="bi-exclamation-triangle text-red-500 text-lg"></i>
      <div class="flex-1">
        <p class="text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          @click="error = null"
        >
          關閉
        </button>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-indigo-100 rounded-lg">
            <i class="bi-images text-xl text-indigo-600"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">總生成次數</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ statistics ? formatNumber(statistics.totalGenerations) : '-' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-emerald-100 rounded-lg">
            <i class="bi-coin text-xl text-emerald-600"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">Token 使用量</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ statistics ? formatNumber(statistics.totalTokens) : '-' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-yellow-100 rounded-lg">
            <i class="bi-currency-dollar text-xl text-yellow-600"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">估算成本</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ statistics ? formatCost(statistics.totalCost) : '-' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-purple-100 rounded-lg">
            <i class="bi-people text-xl text-purple-600"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">使用人數</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ statistics ? statistics.totalUsers : '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日統計與活躍 Session -->
    <div v-if="statistics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">今日生成</span>
          <span class="text-lg font-semibold text-indigo-600">
            {{ statistics.today?.generations ?? 0 }}
          </span>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">今日使用者</span>
          <span class="text-lg font-semibold text-emerald-600">
            {{ statistics.today?.users ?? 0 }}
          </span>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">今日成本</span>
          <span class="text-lg font-semibold text-yellow-600">
            {{ formatCost(statistics.today?.cost) }}
          </span>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">活躍 Session</span>
          <span class="text-lg font-semibold text-purple-600">
            {{ statistics.activeSessions ?? 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 使用趨勢表格 -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">使用趨勢</h2>
        <div class="flex gap-2">
          <button
            v-for="days in trendDaysOptions"
            :key="days"
            type="button"
            class="px-3 py-1 text-sm rounded-full transition-colors cursor-pointer"
            :class="{
              'bg-indigo-600 text-white': trendDays === days,
              'bg-gray-100 text-gray-700 hover:bg-gray-200': trendDays !== days,
            }"
            @click="changeTrendDays(days)"
          >
            {{ days }} 天
          </button>
        </div>
      </div>

      <div v-if="isLoadingTrend" class="p-8 text-center">
        <i class="bi bi-arrow-repeat animate-spin text-2xl text-indigo-600"></i>
      </div>

      <div v-else-if="usageTrend?.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">日期</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">生成次數</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">輸入 Token</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">輸出 Token</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">成本</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">使用者</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in usageTrend" :key="item.date" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{{ formatDate(item.date) }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">{{ item.generations }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">{{ formatNumber(item.inputTokens) }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">{{ formatNumber(item.outputTokens) }}</td>
              <td class="px-6 py-4 text-sm text-yellow-600 text-right whitespace-nowrap">{{ formatCost(item.cost) }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">{{ item.users }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-12">
        <i class="bi bi-graph-up text-4xl text-gray-300"></i>
        <p class="mt-2 text-gray-500">無趨勢資料</p>
      </div>
    </div>

    <!-- 使用者排行榜 -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-gray-200">
        <h2 class="font-semibold text-gray-900">使用者排行榜</h2>
      </div>

      <div v-if="isLoadingLeaderboard" class="p-8 text-center">
        <i class="bi bi-arrow-repeat animate-spin text-2xl text-indigo-600"></i>
      </div>

      <div v-else-if="leaderboard?.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">排名</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">使用者</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">生成次數</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Token 使用量</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">成本</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in leaderboard" :key="item.user.id" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
                  :class="{
                    'bg-yellow-100 text-yellow-700': item.rank === 1,
                    'bg-gray-100 text-gray-700': item.rank === 2,
                    'bg-orange-100 text-orange-700': item.rank === 3,
                    'bg-gray-50 text-gray-500': item.rank > 3,
                  }"
                >
                  {{ item.rank }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{{ item.user.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">{{ item.generations }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">{{ formatNumber(item.inputTokens + item.outputTokens) }}</td>
              <td class="px-6 py-4 text-sm text-yellow-600 text-right whitespace-nowrap">{{ formatCost(item.cost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-12">
        <i class="bi bi-trophy text-4xl text-gray-300"></i>
        <p class="mt-2 text-gray-500">無排行榜資料</p>
      </div>
    </div>

    <!-- 生成歷史 -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-gray-200">
        <h2 class="font-semibold text-gray-900">生成歷史</h2>
      </div>

      <!-- 篩選 -->
      <div class="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">狀態</label>
          <select
            v-model="historyStatus"
            class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition"
            @change="filterHistory"
          >
            <option value="">全部</option>
            <option value="success">成功</option>
            <option value="failed">失敗</option>
            <option value="filtered">已過濾</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">使用者 ID</label>
          <input
            v-model="historyUserId"
            type="text"
            placeholder="輸入使用者 ID"
            class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            @keydown.enter="filterHistory"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">開始日期</label>
          <input
            v-model="historyStartDate"
            type="date"
            class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            @change="filterHistory"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">結束日期</label>
          <input
            v-model="historyEndDate"
            type="date"
            class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            @change="filterHistory"
          />
        </div>

        <div class="flex items-end">
          <button
            type="button"
            class="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition cursor-pointer"
            @click="filterHistory"
          >
            篩選
          </button>
        </div>
      </div>

      <div v-if="isLoadingHistory" class="p-8 text-center">
        <i class="bi bi-arrow-repeat animate-spin text-2xl text-indigo-600"></i>
      </div>

      <div v-else-if="historyList?.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">時間</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">使用者</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompt</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">狀態</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Token</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">成本</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in historyList" :key="item.id" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {{ formatDateTime(item.createdAt) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                {{ item.user?.name || item.userId }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                {{ item.prompt }}
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded"
                  :class="getStatusClass(item.status)"
                >
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">
                {{ item.inputTokens + item.outputTokens }}
              </td>
              <td class="px-6 py-4 text-sm text-yellow-600 text-right whitespace-nowrap">
                {{ formatCost(item.estimatedCost) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-12">
        <i class="bi bi-clock-history text-4xl text-gray-300"></i>
        <p class="mt-2 text-gray-500">無歷史記錄</p>
      </div>

      <!-- 分頁 -->
      <div
        v-if="historyTotalPages > 1"
        class="px-6 py-3 border-t border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-600"
      >
        <button
          type="button"
          :disabled="historyPage === 1"
          class="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
          aria-label="上一頁"
          @click="goToHistoryPage(historyPage - 1)"
        >
          <i class="bi-chevron-left"></i>
        </button>

        <span class="px-4 py-2 text-gray-600">
          {{ historyPage }} / {{ historyTotalPages }}
        </span>

        <button
          type="button"
          :disabled="historyPage === historyTotalPages"
          class="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
          aria-label="下一頁"
          @click="goToHistoryPage(historyPage + 1)"
        >
          <i class="bi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>
