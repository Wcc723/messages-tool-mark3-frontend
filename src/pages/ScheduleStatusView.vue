<script setup lang="ts">
import { ref, computed } from 'vue'

type ExecutionStatus = 'success' | 'failed' | 'pending'

interface ExecutionLog {
  id: string
  scheduleId: string
  scheduleTitle: string
  status: ExecutionStatus
  executedAt: string
  message: string
  error?: string
  discordMessageId?: string
  channelId: string
}

// Mock execution logs
const logs = ref<ExecutionLog[]>([
  {
    id: '1',
    scheduleId: 'sch-1',
    scheduleTitle: '每週會議提醒',
    status: 'success',
    executedAt: '2025-10-02T14:00:00Z',
    message: '訊息已成功發送',
    discordMessageId: '1234567890',
    channelId: '123456789',
  },
  {
    id: '2',
    scheduleId: 'sch-2',
    scheduleTitle: '月初報告提醒',
    status: 'success',
    executedAt: '2025-10-01T09:00:00Z',
    message: '訊息已成功發送',
    discordMessageId: '0987654321',
    channelId: '987654321',
  },
  {
    id: '3',
    scheduleId: 'sch-3',
    scheduleTitle: '系統維護通知',
    status: 'failed',
    executedAt: '2025-09-30T20:00:00Z',
    message: '訊息發送失敗',
    error: '頻道權限不足',
    channelId: '456789123',
  },
  {
    id: '4',
    scheduleId: 'sch-1',
    scheduleTitle: '每週會議提醒',
    status: 'success',
    executedAt: '2025-09-25T14:00:00Z',
    message: '訊息已成功發送',
    discordMessageId: '5555555555',
    channelId: '123456789',
  },
])

const selectedStatus = ref<ExecutionStatus | ''>('')
const searchKeyword = ref('')

const statusOptions = [
  { value: '', label: '全部狀態', icon: 'bi-list-ul' },
  { value: 'success', label: '成功', icon: 'bi-check-circle-fill' },
  { value: 'failed', label: '失敗', icon: 'bi-x-circle-fill' },
  { value: 'pending', label: '待處理', icon: 'bi-clock-fill' },
]

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    const matchesSearch =
      searchKeyword.value === '' ||
      log.scheduleTitle.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      log.message.toLowerCase().includes(searchKeyword.value.toLowerCase())

    const matchesStatus = selectedStatus.value === '' || log.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})

const statusCounts = computed(() => ({
  success: logs.value.filter((l) => l.status === 'success').length,
  failed: logs.value.filter((l) => l.status === 'failed').length,
  pending: logs.value.filter((l) => l.status === 'pending').length,
}))

const getStatusColor = (status: ExecutionStatus) => {
  const colors = {
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }
  return colors[status]
}

const getStatusIcon = (status: ExecutionStatus) => {
  const icons = {
    success: 'bi-check-circle-fill',
    failed: 'bi-x-circle-fill',
    pending: 'bi-clock-fill',
  }
  return icons[status]
}

const getStatusText = (status: ExecutionStatus) => {
  const texts = {
    success: '成功',
    failed: '失敗',
    pending: '待處理',
  }
  return texts[status]
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleResend = (log: ExecutionLog) => {
  if (confirm(`確定要補發「${log.scheduleTitle}」的訊息嗎？`)) {
    // Mock resend
    alert('訊息補發成功！')
    // Add new success log
    logs.value.unshift({
      id: String(Date.now()),
      scheduleId: log.scheduleId,
      scheduleTitle: log.scheduleTitle,
      status: 'success',
      executedAt: new Date().toISOString(),
      message: '訊息已補發成功',
      discordMessageId: String(Math.random()).slice(2, 12),
      channelId: log.channelId,
    })
  }
}

const handleViewMessage = (messageId: string) => {
  // Mock view message - would open Discord message URL
  alert(`Discord 訊息 ID: ${messageId}`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">排程狀態</h1>
      <p class="text-gray-600">檢視訊息發送記錄和狀態</p>
    </div>

    <!-- Status Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-green-700 mb-2">成功發送</p>
            <p class="text-4xl font-bold text-green-600">
              {{ statusCounts.success }}
            </p>
          </div>
          <div class="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
            <i class="bi bi-check-circle-fill text-4xl text-white"></i>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-sm border border-red-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-red-700 mb-2">發送失敗</p>
            <p class="text-4xl font-bold text-red-600">
              {{ statusCounts.failed }}
            </p>
          </div>
          <div class="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center">
            <i class="bi bi-x-circle-fill text-4xl text-white"></i>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-sm border border-yellow-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-yellow-700 mb-2">待處理</p>
            <p class="text-4xl font-bold text-yellow-600">
              {{ statusCounts.pending }}
            </p>
          </div>
          <div class="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center">
            <i class="bi bi-clock-fill text-4xl text-white"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <i class="bi bi-funnel text-indigo-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">篩選條件</h2>
          <p class="text-sm text-gray-600">搜尋和篩選執行記錄</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">搜尋</label>
          <div class="relative">
            <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜尋排程標題或訊息..."
              class="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            >
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">狀態</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              @click="selectedStatus = option.value as ExecutionStatus | ''"
              :class="[
                'flex flex-col items-center justify-center py-3 px-2 border-2 rounded-xl transition-all cursor-pointer',
                selectedStatus === option.value
                  ? 'border-indigo-600 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              ]"
            >
              <i :class="[option.icon, 'text-2xl mb-1', selectedStatus === option.value ? 'text-indigo-600' : 'text-gray-400']"></i>
              <span :class="['text-xs font-medium', selectedStatus === option.value ? 'text-indigo-600' : 'text-gray-600']">
                {{ option.label }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Execution Logs -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <i class="bi bi-clock-history text-purple-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">執行記錄</h2>
          <p class="text-sm text-gray-600">共 {{ filteredLogs.length }} 筆記錄</p>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-gray-300"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <div
                  :class="[
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    log.status === 'success' ? 'bg-green-100' : log.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  ]"
                >
                  <i :class="[getStatusIcon(log.status), 'text-2xl', log.status === 'success' ? 'text-green-600' : log.status === 'failed' ? 'text-red-600' : 'text-yellow-600']"></i>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900 text-lg">{{ log.scheduleTitle }}</h3>
                  <span :class="['inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1', getStatusColor(log.status)]">
                    {{ getStatusText(log.status) }}
                  </span>
                </div>
              </div>

              <div class="ml-15 space-y-2">
                <p class="text-gray-700 font-medium">{{ log.message }}</p>
                <div v-if="log.error" class="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <i class="bi bi-exclamation-triangle-fill text-red-600 mt-0.5"></i>
                  <div>
                    <p class="text-sm font-semibold text-red-900">錯誤詳情</p>
                    <p class="text-sm text-red-700">{{ log.error }}</p>
                  </div>
                </div>
                <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span class="flex items-center gap-2">
                    <i class="bi bi-calendar-event"></i>
                    {{ formatDateTime(log.executedAt) }}
                  </span>
                  <span v-if="log.discordMessageId" class="flex items-center gap-2">
                    <i class="bi bi-discord"></i>
                    訊息 ID: {{ log.discordMessageId }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 ml-4">
              <button
                v-if="log.discordMessageId"
                @click="handleViewMessage(log.discordMessageId)"
                class="p-3 hover:bg-indigo-50 text-indigo-600 rounded-xl transition border-2 border-transparent hover:border-indigo-200 cursor-pointer"
                title="查看訊息"
              >
                <i class="bi bi-eye text-xl"></i>
              </button>
              <button
                v-if="log.status === 'failed'"
                @click="handleResend(log)"
                class="p-3 hover:bg-green-50 text-green-600 rounded-xl transition border-2 border-transparent hover:border-green-200 cursor-pointer"
                title="補發訊息"
              >
                <i class="bi bi-arrow-clockwise text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredLogs.length === 0" class="text-center py-16">
          <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="bi bi-inbox text-6xl text-gray-400"></i>
          </div>
          <p class="text-gray-500 text-lg font-medium">找不到符合條件的執行記錄</p>
        </div>
      </div>
    </div>
  </div>
</template>
