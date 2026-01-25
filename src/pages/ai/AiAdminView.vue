<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiAdminApi } from '@/services/api'
import type {
  AIStatistics,
  AIUsageTrend,
  AILeaderboardItem,
  GenerationHistory,
  GenerationStatus,
} from '@/types/ai-generation'

// 統計資料
const statistics = ref<AIStatistics | null>(null)
const usageTrend = ref<AIUsageTrend[]>([])
const leaderboard = ref<AILeaderboardItem[]>([])
const historyList = ref<GenerationHistory[]>([])

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
function formatCost(cost: number | undefined | null): string {
  if (cost == null) return '$0.00'
  return '$' + cost.toFixed(2)
}

// 格式化百分比
function formatPercent(value: number | undefined | null): string {
  if (value == null) return '0%'
  return (value * 100).toFixed(1) + '%'
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
    historyList.value = result?.history || []
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
    <div>
      <h1 class="text-2xl font-bold text-gray-900">AI 統計</h1>
      <p class="mt-1 text-gray-500">查看 AI 圖片生成的使用統計與審計日誌</p>
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
      <div class="bg-white border rounded-lg p-4">
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

      <div class="bg-white border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-green-100 rounded-lg">
            <i class="bi-coin text-xl text-green-600"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">Token 使用量</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ statistics ? formatNumber(statistics.totalTokensUsed) : '-' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-yellow-100 rounded-lg">
            <i class="bi-currency-dollar text-xl text-yellow-600"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">估算成本</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ statistics ? formatCost(statistics.estimatedCost) : '-' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-purple-100 rounded-lg">
            <i class="bi-people text-xl text-purple-600"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">活躍使用者</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ statistics ? statistics.activeUsers : '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功率與過濾率 -->
    <div v-if="statistics" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-white border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">成功率</span>
          <span class="text-lg font-semibold text-green-600">
            {{ formatPercent(statistics.successRate) }}
          </span>
        </div>
        <div class="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-green-500 rounded-full"
            :style="{ width: formatPercent(statistics.successRate) }"
          ></div>
        </div>
      </div>

      <div class="bg-white border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">過濾率</span>
          <span class="text-lg font-semibold text-yellow-600">
            {{ formatPercent(statistics.filteredRate) }}
          </span>
        </div>
        <div class="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-yellow-500 rounded-full"
            :style="{ width: formatPercent(statistics.filteredRate) }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 使用趨勢表格 -->
    <div class="bg-white border rounded-lg overflow-hidden">
      <div class="p-4 border-b flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">使用趨勢</h2>
        <div class="flex gap-2">
          <button
            v-for="days in trendDaysOptions"
            :key="days"
            type="button"
            class="px-3 py-1 text-sm rounded transition-colors"
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
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>

      <div v-else-if="usageTrend?.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">生成次數</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Token</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">使用者</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">成功</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">失敗</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">過濾</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in usageTrend" :key="item.date" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(item.date) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ item.generations }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ formatNumber(item.tokensUsed) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ item.uniqueUsers }}</td>
              <td class="px-4 py-3 text-sm text-green-600 text-right">{{ item.successCount }}</td>
              <td class="px-4 py-3 text-sm text-red-600 text-right">{{ item.failedCount }}</td>
              <td class="px-4 py-3 text-sm text-yellow-600 text-right">{{ item.filteredCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-gray-500">
        無趨勢資料
      </div>
    </div>

    <!-- 使用者排行榜 -->
    <div class="bg-white border rounded-lg overflow-hidden">
      <div class="p-4 border-b">
        <h2 class="font-semibold text-gray-900">使用者排行榜</h2>
      </div>

      <div v-if="isLoadingLeaderboard" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>

      <div v-else-if="leaderboard?.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用者</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">生成次數</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Token 使用量</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in leaderboard" :key="item.userId" class="hover:bg-gray-50">
              <td class="px-4 py-3">
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
              <td class="px-4 py-3 text-sm text-gray-900">{{ item.userName }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ item.totalGenerations }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ formatNumber(item.totalTokensUsed) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-gray-500">
        無排行榜資料
      </div>
    </div>

    <!-- 生成歷史 -->
    <div class="bg-white border rounded-lg overflow-hidden">
      <div class="p-4 border-b">
        <h2 class="font-semibold text-gray-900">生成歷史</h2>
      </div>

      <!-- 篩選 -->
      <div class="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">狀態</label>
          <select
            v-model="historyStatus"
            class="border rounded px-3 py-1.5 text-sm"
            @change="filterHistory"
          >
            <option value="">全部</option>
            <option value="success">成功</option>
            <option value="failed">失敗</option>
            <option value="filtered">已過濾</option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">使用者 ID</label>
          <input
            v-model="historyUserId"
            type="text"
            placeholder="輸入使用者 ID"
            class="border rounded px-3 py-1.5 text-sm w-40"
            @keydown.enter="filterHistory"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">開始日期</label>
          <input
            v-model="historyStartDate"
            type="date"
            class="border rounded px-3 py-1.5 text-sm"
            @change="filterHistory"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">結束日期</label>
          <input
            v-model="historyEndDate"
            type="date"
            class="border rounded px-3 py-1.5 text-sm"
            @change="filterHistory"
          />
        </div>

        <div class="flex items-end">
          <button
            type="button"
            class="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            @click="filterHistory"
          >
            篩選
          </button>
        </div>
      </div>

      <div v-if="isLoadingHistory" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>

      <div v-else-if="historyList?.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用者</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prompt</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">狀態</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Token</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in historyList" :key="item.historyId" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                {{ formatDateTime(item.generatedAt) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                {{ item.userId }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                {{ item.model }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                {{ item.prompt }}
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded"
                  :class="getStatusClass(item.status || (item.success ? 'success' : 'failed'))"
                >
                  {{ getStatusText(item.status || (item.success ? 'success' : 'failed')) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">
                {{ (item.inputTokens || 0) + (item.outputTokens || 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-gray-500">
        無歷史記錄
      </div>

      <!-- 分頁 -->
      <div
        v-if="historyTotalPages > 1"
        class="p-4 border-t flex items-center justify-center gap-2"
      >
        <button
          type="button"
          :disabled="historyPage === 1"
          class="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
          class="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          @click="goToHistoryPage(historyPage + 1)"
        >
          <i class="bi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>
