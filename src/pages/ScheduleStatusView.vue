<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useDiscordStore } from '@/stores/discord'
import type { ExecutionLog, ExecutionStatus } from '@/services/api'

interface ScheduleExecutionLog extends ExecutionLog {
  scheduleTitle: string
  channelId: string
}

const router = useRouter()
const scheduleStore = useScheduleStore()
const discordStore = useDiscordStore()
const { schedules } = storeToRefs(scheduleStore)
const { channels } = storeToRefs(discordStore)

const logs = ref<ScheduleExecutionLog[]>([])
const isLoading = ref(false)
const fetchError = ref<string | null>(null)

const searchKeyword = ref('')
const statusFilter = ref<ExecutionStatus | ''>('')
const scheduleFilter = ref('')
const startDateTime = ref('')
const endDateTime = ref('')

const statusOptions = [
  { value: '', label: '全部狀態' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失敗' },
  { value: 'pending', label: '待處理' },
]

const scheduleOptions = computed(() => {
  return schedules.value.map((schedule) => ({
    value: schedule.id,
    label: schedule.title,
  }))
})

const statusSummary = computed(() => ({
  success: logs.value.filter((log) => log.status === 'success').length,
  failed: logs.value.filter((log) => log.status === 'failed').length,
  pending: logs.value.filter((log) => log.status === 'pending').length,
}))

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    const matchesStatus = !statusFilter.value || log.status === statusFilter.value
    const matchesSchedule = !scheduleFilter.value || log.scheduleId === scheduleFilter.value

    const keyword = searchKeyword.value.trim().toLowerCase()
    const matchesKeyword =
      keyword === '' ||
      log.scheduleTitle.toLowerCase().includes(keyword) ||
      log.message?.toLowerCase().includes(keyword) ||
      log.error?.toLowerCase().includes(keyword)

    const executedAt = new Date(log.executedAt).getTime()
    const start = startDateTime.value ? new Date(startDateTime.value).getTime() : null
    const end = endDateTime.value ? new Date(endDateTime.value).getTime() : null

    const matchesStart = start === null || executedAt >= start
    const matchesEnd = end === null || executedAt <= end

    return matchesStatus && matchesSchedule && matchesKeyword && matchesStart && matchesEnd
  })
})

const getChannelName = (channelId: string) => {
  const channel = discordStore.getChannelById(channelId)
  return channel ? `#${channel.name}` : channelId
}

const getStatusBadgeClass = (status: ExecutionStatus) => {
  const map: Record<ExecutionStatus, string> = {
    success: 'bg-green-100 text-green-700 border border-green-200',
    failed: 'bg-red-100 text-red-700 border border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  }
  return map[status]
}

const getStatusText = (status: ExecutionStatus) => {
  const map: Record<ExecutionStatus, string> = {
    success: '成功',
    failed: '失敗',
    pending: '待處理',
  }
  return map[status]
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchLogs = async () => {
  isLoading.value = true
  fetchError.value = null

  try {
    if (!channels.value.length) {
      await discordStore.fetchChannels()
    }

    await scheduleStore.fetchSchedules()

    const allLogs = await Promise.all(
      schedules.value.map(async (schedule) => {
        const data = await scheduleStore.fetchScheduleLogs(schedule.id, { limit: 50 })
        return data.logs.map((log) => ({
          ...log,
          scheduleTitle: schedule.title,
          channelId: schedule.channelId,
        }))
      })
    )

    logs.value = allLogs
      .flat()
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
  } catch (error: any) {
    console.error('Failed to load schedule logs:', error)
    fetchError.value = error.response?.data?.message || '載入排程執行記錄失敗'
  } finally {
    isLoading.value = false
  }
}

const handleEditSchedule = (scheduleId: string) => {
  router.push(`/dashboard/schedule/edit/${scheduleId}`)
}

onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">排程狀態</h1>
        <p class="text-gray-600">檢視訊息發送記錄與狀態</p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          @click="fetchLogs"
          :disabled="isLoading"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i class="bi bi-arrow-clockwise"></i>
          重新整理
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <p class="text-sm text-gray-500">成功發送</p>
        <p class="text-2xl font-semibold text-gray-900 mt-2">{{ statusSummary.success }}</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <p class="text-sm text-gray-500">發送失敗</p>
        <p class="text-2xl font-semibold text-gray-900 mt-2">{{ statusSummary.failed }}</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <p class="text-sm text-gray-500">待處理</p>
        <p class="text-2xl font-semibold text-gray-900 mt-2">{{ statusSummary.pending }}</p>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">搜尋關鍵字</label>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜尋排程或訊息內容"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">狀態</label>
          <select
            v-model="statusFilter"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">排程</label>
          <select
            v-model="scheduleFilter"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
          >
            <option value="">全部排程</option>
            <option v-for="option in scheduleOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">開始時間</label>
          <input
            v-model="startDateTime"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">結束時間</label>
          <input
            v-model="endDateTime"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg">
      <div v-if="fetchError" class="p-6 border-b border-gray-200 bg-red-50 text-red-700 text-sm">
        {{ fetchError }}
      </div>

      <div v-if="isLoading" class="p-6 text-center text-sm text-gray-600">
        載入中...
      </div>

      <div
        v-else-if="filteredLogs.length === 0"
        class="p-10 text-center text-gray-500"
      >
        目前沒有符合條件的執行記錄
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm text-left">
          <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 font-medium">排程</th>
              <th class="px-4 py-3 font-medium">狀態</th>
              <th class="px-4 py-3 font-medium">執行時間</th>
              <th class="px-4 py-3 font-medium">頻道</th>
              <th class="px-4 py-3 font-medium">訊息</th>
              <th class="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="log in filteredLogs" :key="log.id" class="bg-white">
              <td class="px-4 py-4 align-top">
                <p class="font-medium text-gray-900">{{ log.scheduleTitle }}</p>
                <p class="text-xs text-gray-500 mt-1">ID: {{ log.scheduleId }}</p>
              </td>
              <td class="px-4 py-4 align-top">
                <span :class="['px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1', getStatusBadgeClass(log.status)]">
                  {{ getStatusText(log.status) }}
                </span>
              </td>
              <td class="px-4 py-4 align-top">
                <p class="text-gray-900">{{ formatDateTime(log.executedAt) }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ new Date(log.executedAt).toISOString() }}</p>
              </td>
              <td class="px-4 py-4 align-top">
                <p class="text-gray-900">{{ getChannelName(log.channelId) }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ log.channelId }}</p>
              </td>
              <td class="px-4 py-4 align-top">
                <p v-if="log.message" class="text-gray-700">{{ log.message }}</p>
                <p v-else class="text-gray-400 italic">無訊息內容</p>
                <p v-if="log.error" class="text-xs text-red-600 mt-2">錯誤：{{ log.error }}</p>
                <p v-if="log.discordMessageId" class="text-xs text-gray-500 mt-2">
                  Discord ID：{{ log.discordMessageId }}
                </p>
              </td>
              <td class="px-4 py-4 align-top">
                <button
                  type="button"
                  class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-xs font-medium"
                  @click="handleEditSchedule(log.scheduleId)"
                >
                  編輯排程
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
