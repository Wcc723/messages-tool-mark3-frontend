<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type ScheduleStatus = 'draft' | 'active' | 'paused' | 'completed'
type ScheduleType = 'once' | 'weekly' | 'monthly'

interface Schedule {
  id: string
  title: string
  content: string
  scheduleType: ScheduleType
  scheduledTime: string
  channelId: string
  status: ScheduleStatus
  nextExecutionAt?: string
  lastExecutedAt?: string
}

// Mock data
const schedules = ref<Schedule[]>([
  {
    id: '1',
    title: '每週會議提醒',
    content: '記得參加今天下午 3 點的團隊會議！',
    scheduleType: 'weekly',
    scheduledTime: '14:00:00',
    channelId: '123456789',
    status: 'active',
    nextExecutionAt: '2025-10-08T14:00:00Z',
  },
  {
    id: '2',
    title: '月初報告提醒',
    content: '請在本週五前繳交月報',
    scheduleType: 'monthly',
    scheduledTime: '09:00:00',
    channelId: '987654321',
    status: 'active',
    nextExecutionAt: '2025-11-01T09:00:00Z',
  },
  {
    id: '3',
    title: '活動通知草稿',
    content: '下週將舉辦線上活動，敬請期待！',
    scheduleType: 'once',
    scheduledTime: '10:00:00',
    channelId: '456789123',
    status: 'draft',
  },
])

const searchKeyword = ref('')
const selectedStatus = ref<ScheduleStatus | ''>('')

const statusOptions = [
  { value: '', label: '全部狀態' },
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '啟用中' },
  { value: 'paused', label: '已暫停' },
  { value: 'completed', label: '已完成' },
]

const filteredSchedules = computed(() => {
  return schedules.value.filter((schedule) => {
    const matchesSearch =
      searchKeyword.value === '' ||
      schedule.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      schedule.content.toLowerCase().includes(searchKeyword.value.toLowerCase())

    const matchesStatus =
      selectedStatus.value === '' || schedule.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})

const getStatusColor = (status: ScheduleStatus) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
  }
  return colors[status]
}

const getStatusText = (status: ScheduleStatus) => {
  const texts = {
    draft: '草稿',
    active: '啟用中',
    paused: '已暫停',
    completed: '已完成',
  }
  return texts[status]
}

const getTypeText = (type: ScheduleType) => {
  const texts = {
    once: '單次',
    weekly: '每週',
    monthly: '每月',
  }
  return texts[type]
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleCreate = () => {
  router.push('/dashboard/schedules/new')
}

const handleEdit = (id: string) => {
  router.push(`/dashboard/schedules/${id}/edit`)
}

const handleDelete = (id: string) => {
  if (confirm('確定要刪除此排程嗎？')) {
    schedules.value = schedules.value.filter((s) => s.id !== id)
  }
}

const handleToggleStatus = (schedule: Schedule) => {
  if (schedule.status === 'active') {
    schedule.status = 'paused'
  } else if (schedule.status === 'paused') {
    schedule.status = 'active'
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">排程管理</h1>
      <p class="text-gray-600">管理您的 Discord 訊息排程</p>
    </div>

    <!-- Filters & Actions -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜尋排程標題或內容..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
        </div>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        >
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <!-- Create Button -->
        <button
          @click="handleCreate"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium whitespace-nowrap"
        >
          + 新增排程
        </button>
      </div>
    </div>

    <!-- Schedules List -->
    <div class="space-y-4">
      <div
        v-for="schedule in filteredSchedules"
        :key="schedule.id"
        class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-xl font-semibold text-gray-800">{{ schedule.title }}</h3>
              <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusColor(schedule.status)]">
                {{ getStatusText(schedule.status) }}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {{ getTypeText(schedule.scheduleType) }}
              </span>
            </div>

            <p class="text-gray-600 mb-4">{{ schedule.content }}</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div>
                <span class="font-medium">排程時間：</span>
                {{ schedule.scheduledTime }}
              </div>
              <div v-if="schedule.nextExecutionAt">
                <span class="font-medium">下次執行：</span>
                {{ formatDateTime(schedule.nextExecutionAt) }}
              </div>
              <div v-if="schedule.lastExecutedAt">
                <span class="font-medium">上次執行：</span>
                {{ formatDateTime(schedule.lastExecutedAt) }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 ml-4">
            <button
              v-if="schedule.status === 'active' || schedule.status === 'paused'"
              @click="handleToggleStatus(schedule)"
              :class="[
                'p-2 rounded-lg transition',
                schedule.status === 'active'
                  ? 'hover:bg-yellow-50 text-yellow-600'
                  : 'hover:bg-green-50 text-green-600'
              ]"
              :title="schedule.status === 'active' ? '暫停' : '啟用'"
            >
              <svg v-if="schedule.status === 'active'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button
              @click="handleEdit(schedule.id)"
              class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
              title="編輯"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              @click="handleDelete(schedule.id)"
              class="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
              title="刪除"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredSchedules.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-500 text-lg mb-4">找不到符合條件的排程</p>
        <button
          @click="handleCreate"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          建立第一個排程
        </button>
      </div>
    </div>
  </div>
</template>
