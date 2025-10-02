<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type ViewMode = 'calendar' | 'list'
type ScheduleStatus = 'draft' | 'active' | 'paused' | 'completed'
type ScheduleType = 'once' | 'weekly' | 'monthly'

interface Schedule {
  id: string
  title: string
  content: string
  scheduleType: ScheduleType
  scheduledTime: string
  scheduledDate?: string
  channelId: string
  status: ScheduleStatus
  nextExecutionAt?: string
  lastExecutedAt?: string
}

// View mode toggle
const viewMode = ref<ViewMode>('calendar')

// Mock data with dates
const schedules = ref<Schedule[]>([
  {
    id: '1',
    title: '每週會議提醒',
    content: '記得參加今天下午 3 點的團隊會議！',
    scheduleType: 'weekly',
    scheduledTime: '14:00:00',
    scheduledDate: '2025-10-08',
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
    scheduledDate: '2025-10-01',
    channelId: '987654321',
    status: 'active',
    nextExecutionAt: '2025-11-01T09:00:00Z',
  },
  {
    id: '3',
    title: '活動通知',
    content: '下週將舉辦線上活動，敬請期待！',
    scheduleType: 'once',
    scheduledTime: '10:00:00',
    scheduledDate: '2025-10-15',
    channelId: '456789123',
    status: 'active',
  },
])

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)

// Calendar computation
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const monthName = computed(() => {
  return currentDate.value.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })
})

const calendarDays = computed(() => {
  const days = []
  const totalDays = daysInMonth.value
  const startDay = firstDayOfMonth.value

  // Add empty slots for days before month starts
  for (let i = 0; i < startDay; i++) {
    days.push({ day: null, schedules: [] })
  }

  // Add days of the month
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const daySchedules = schedules.value.filter((s) => s.scheduledDate === dateStr)
    days.push({ day, schedules: daySchedules })
  }

  return days
})

const selectedDateSchedules = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = selectedDate.value.toISOString().split('T')[0]
  return schedules.value.filter((s) => s.scheduledDate === dateStr)
})

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const selectDate = (day: number | null) => {
  if (!day) return
  selectedDate.value = new Date(currentYear.value, currentMonth.value, day)
}

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

const handleEdit = (id: string) => {
  // Navigate to edit (using create view with id)
  router.push(`/dashboard/schedule/edit/${id}`)
}

const handleDuplicate = (schedule: Schedule) => {
  // Mock duplicate
  const newSchedule = {
    ...schedule,
    id: String(Date.now()),
    title: `${schedule.title} (複本)`,
    status: 'draft' as ScheduleStatus,
  }
  schedules.value.push(newSchedule)
  alert('排程已複製！')
}

const handleDelete = (id: string) => {
  if (confirm('確定要刪除此排程嗎？')) {
    schedules.value = schedules.value.filter((s) => s.id !== id)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">排程行事曆</h1>
      <p class="text-gray-600">檢視和管理您的 Discord 訊息排程</p>
    </div>

    <!-- View Toggle -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <button
            @click="viewMode = 'calendar'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition cursor-pointer',
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            <i class="bi bi-calendar3 mr-2"></i>
            行事曆檢視
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition cursor-pointer',
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            <i class="bi bi-list-ul mr-2"></i>
            列表檢視
          </button>
        </div>

        <button
          @click="router.push('/dashboard/schedule/new')"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium cursor-pointer"
        >
          <i class="bi bi-plus-circle mr-2"></i>
          新增排程
        </button>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-if="viewMode === 'calendar'" class="space-y-6">
      <!-- Calendar Header -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">{{ monthName }}</h2>
          <div class="flex gap-2">
            <button
              @click="previousMonth"
              class="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <i class="bi bi-chevron-left text-xl"></i>
            </button>
            <button
              @click="nextMonth"
              class="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <i class="bi bi-chevron-right text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-2">
          <!-- Week Headers -->
          <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="text-center font-medium text-gray-600 py-2">
            {{ day }}
          </div>

          <!-- Calendar Days -->
          <div
            v-for="(dayData, index) in calendarDays"
            :key="index"
            @click="selectDate(dayData.day)"
            :class="[
              'min-h-24 p-2 border rounded-lg transition cursor-pointer',
              dayData.day ? 'hover:bg-indigo-50 border-gray-200' : 'bg-gray-50 border-transparent',
              selectedDate && dayData.day === selectedDate.getDate() && currentMonth === selectedDate.getMonth()
                ? 'bg-indigo-100 border-indigo-500'
                : ''
            ]"
          >
            <div v-if="dayData.day" class="h-full flex flex-col">
              <div class="text-sm font-medium text-gray-700 mb-1">{{ dayData.day }}</div>
              <div class="flex-1 space-y-1">
                <div
                  v-for="schedule in dayData.schedules.slice(0, 2)"
                  :key="schedule.id"
                  class="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded truncate"
                  :title="schedule.title"
                >
                  {{ schedule.scheduledTime.slice(0, 5) }} {{ schedule.title }}
                </div>
                <div v-if="dayData.schedules.length > 2" class="text-xs text-gray-500">
                  +{{ dayData.schedules.length - 2 }} 更多
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Date Details -->
      <div v-if="selectedDate" class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          {{ selectedDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) }} 的排程
        </h3>

        <div v-if="selectedDateSchedules.length === 0" class="text-center py-8 text-gray-500">
          <i class="bi bi-calendar-x text-4xl mb-2"></i>
          <p>此日期沒有排程</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="schedule in selectedDateSchedules"
            :key="schedule.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h4 class="font-semibold text-gray-800">{{ schedule.title }}</h4>
                  <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusColor(schedule.status)]">
                    {{ getStatusText(schedule.status) }}
                  </span>
                </div>
                <p class="text-gray-600 text-sm mb-2">{{ schedule.content }}</p>
                <p class="text-gray-500 text-sm">
                  <i class="bi bi-clock mr-1"></i>
                  {{ schedule.scheduledTime }}
                </p>
              </div>

              <div class="flex gap-2 ml-4">
                <button
                  @click="handleEdit(schedule.id)"
                  class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition cursor-pointer"
                  title="編輯"
                >
                  <i class="bi bi-pencil-square text-lg"></i>
                </button>
                <button
                  @click="handleDuplicate(schedule)"
                  class="p-2 hover:bg-green-50 text-green-600 rounded-lg transition cursor-pointer"
                  title="複製"
                >
                  <i class="bi bi-files text-lg"></i>
                </button>
                <button
                  @click="handleDelete(schedule.id)"
                  class="p-2 hover:bg-red-50 text-red-600 rounded-lg transition cursor-pointer"
                  title="刪除"
                >
                  <i class="bi bi-trash text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="bg-white rounded-lg shadow-sm p-6">
      <div class="space-y-4">
        <div
          v-for="schedule in schedules"
          :key="schedule.id"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-800">{{ schedule.title }}</h3>
                <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusColor(schedule.status)]">
                  {{ getStatusText(schedule.status) }}
                </span>
              </div>

              <p class="text-gray-600 mb-3">{{ schedule.content }}</p>

              <div class="flex gap-4 text-sm text-gray-500">
                <div>
                  <i class="bi bi-calendar-event mr-1"></i>
                  {{ schedule.scheduledDate || '-' }}
                </div>
                <div>
                  <i class="bi bi-clock mr-1"></i>
                  {{ schedule.scheduledTime }}
                </div>
              </div>
            </div>

            <div class="flex gap-2 ml-4">
              <button
                @click="handleEdit(schedule.id)"
                class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition cursor-pointer"
                title="編輯"
              >
                <i class="bi bi-pencil-square text-xl"></i>
              </button>
              <button
                @click="handleDuplicate(schedule)"
                class="p-2 hover:bg-green-50 text-green-600 rounded-lg transition cursor-pointer"
                title="複製"
              >
                <i class="bi bi-files text-xl"></i>
              </button>
              <button
                @click="handleDelete(schedule.id)"
                class="p-2 hover:bg-red-50 text-red-600 rounded-lg transition cursor-pointer"
                title="刪除"
              >
                <i class="bi bi-trash text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="schedules.length === 0" class="text-center py-12">
          <i class="bi bi-calendar-x text-6xl text-gray-400 mb-4"></i>
          <p class="text-gray-500 text-lg mb-4">目前沒有任何排程</p>
          <button
            @click="router.push('/dashboard/schedule/new')"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium cursor-pointer"
          >
            建立第一個排程
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
