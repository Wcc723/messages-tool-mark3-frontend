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
  { value: '', label: '全部狀態' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失敗' },
  { value: 'pending', label: '待處理' },
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
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">排程狀態</h1>
      <p class="text-gray-600">檢視訊息發送記錄和狀態</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜尋排程標題或訊息..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
        </div>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
        >
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Status Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">成功發送</p>
            <p class="text-3xl font-bold text-green-600">
              {{ logs.filter((l) => l.status === 'success').length }}
            </p>
          </div>
          <i class="bi bi-check-circle-fill text-4xl text-green-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">發送失敗</p>
            <p class="text-3xl font-bold text-red-600">
              {{ logs.filter((l) => l.status === 'failed').length }}
            </p>
          </div>
          <i class="bi bi-x-circle-fill text-4xl text-red-500"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">待處理</p>
            <p class="text-3xl font-bold text-yellow-600">
              {{ logs.filter((l) => l.status === 'pending').length }}
            </p>
          </div>
          <i class="bi bi-clock-fill text-4xl text-yellow-500"></i>
        </div>
      </div>
    </div>

    <!-- Execution Logs -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">執行記錄</h2>

        <div class="space-y-3">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <i :class="[getStatusIcon(log.status), 'text-xl', log.status === 'success' ? 'text-green-600' : log.status === 'failed' ? 'text-red-600' : 'text-yellow-600']"></i>
                  <h3 class="font-semibold text-gray-800">{{ log.scheduleTitle }}</h3>
                  <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusColor(log.status)]">
                    {{ getStatusText(log.status) }}
                  </span>
                </div>

                <div class="ml-8 space-y-1">
                  <p class="text-sm text-gray-600">{{ log.message }}</p>
                  <p v-if="log.error" class="text-sm text-red-600">
                    <i class="bi bi-exclamation-triangle mr-1"></i>
                    錯誤：{{ log.error }}
                  </p>
                  <div class="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>
                      <i class="bi bi-calendar-event mr-1"></i>
                      {{ formatDateTime(log.executedAt) }}
                    </span>
                    <span v-if="log.discordMessageId">
                      <i class="bi bi-discord mr-1"></i>
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
                  class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition cursor-pointer"
                  title="查看訊息"
                >
                  <i class="bi bi-eye text-lg"></i>
                </button>
                <button
                  v-if="log.status === 'failed'"
                  @click="handleResend(log)"
                  class="p-2 hover:bg-green-50 text-green-600 rounded-lg transition cursor-pointer"
                  title="補發訊息"
                >
                  <i class="bi bi-arrow-clockwise text-lg"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredLogs.length === 0" class="text-center py-12">
            <i class="bi bi-inbox text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-500 text-lg">找不到符合條件的執行記錄</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
