<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import type { Schedule, ScheduleStatus, ScheduleType } from '@/services/api'

const router = useRouter()
const scheduleStore = useScheduleStore()

type ViewMode = 'calendar' | 'list'

// View mode toggle
const viewMode = ref<ViewMode>('calendar')

// Get schedules from store
const schedules = computed(() => scheduleStore.schedules)

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

    // Filter schedules for this day
    const daySchedules = schedules.value.filter((s) => {
      // once type: match scheduledDate
      if (s.scheduleType === 'once') {
        return s.scheduledDate === dateStr
      }

      // weekly type: match weekDay
      if (s.scheduleType === 'weekly') {
        const date = new Date(currentYear.value, currentMonth.value, day)
        return date.getDay() === s.weekDay
      }

      // monthly type: match monthDay
      if (s.scheduleType === 'monthly') {
        return s.monthDay === day
      }

      return false
    })

    days.push({ day, schedules: daySchedules })
  }

  return days
})

const selectedDateSchedules = computed(() => {
  if (!selectedDate.value) return []

  const dateStr = selectedDate.value.toISOString().split('T')[0]
  const day = selectedDate.value.getDate()
  const weekDay = selectedDate.value.getDay()

  return schedules.value.filter((s) => {
    if (s.scheduleType === 'once') {
      return s.scheduledDate === dateStr
    }
    if (s.scheduleType === 'weekly') {
      return s.weekDay === weekDay
    }
    if (s.scheduleType === 'monthly') {
      return s.monthDay === day
    }
    return false
  })
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
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
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

// Load schedules on mount
onMounted(async () => {
  try {
    await scheduleStore.fetchSchedules()
  } catch (error: any) {
    console.error('Failed to load schedules:', error)
    alert(error.response?.data?.message || '載入排程失敗')
  }
})

// Reload schedules when month changes
watch([currentYear, currentMonth], async () => {
  try {
    await scheduleStore.fetchSchedules()
  } catch (error: any) {
    console.error('Failed to reload schedules:', error)
  }
})

// CRUD operations
const handleEdit = (id: string) => {
  router.push(`/dashboard/schedule/edit/${id}`)
}

const handleDuplicate = async (schedule: Schedule) => {
  try {
    await scheduleStore.duplicateSchedule(schedule)
    alert('排程已複製！')
  } catch (error: any) {
    console.error('Failed to duplicate schedule:', error)
    alert(error.response?.data?.message || '複製排程失敗')
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('確定要刪除此排程嗎？')) return

  try {
    await scheduleStore.deleteSchedule(id)
  } catch (error: any) {
    console.error('Failed to delete schedule:', error)
    alert(error.response?.data?.message || '刪除排程失敗')
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">排程行事曆</h1>
      <p class="text-gray-600">檢視和管理您的 Discord 訊息排程</p>
    </div>

    <!-- View Toggle & Actions -->
    <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 mb-8">
      <div class="flex items-center justify-between">
        <div class="flex gap-3">
          <button
            @click="viewMode = 'calendar'"
            :class="[
              'px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer',
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            ]"
          >
            <i class="bi bi-calendar3 mr-2"></i>
            行事曆檢視
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer',
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            ]"
          >
            <i class="bi bi-list-ul mr-2"></i>
            列表檢視
          </button>
        </div>

        <button
          @click="router.push('/dashboard/schedule/new')"
          class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl cursor-pointer"
        >
          <i class="bi bi-plus-circle mr-2"></i>
          新增排程
        </button>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-if="viewMode === 'calendar'" class="space-y-8">
      <!-- Calendar Card -->
      <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
        <!-- Calendar Header Section -->
        <div class="flex items-center gap-3 mb-8">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-calendar-event text-blue-600 text-2xl"></i>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900">月曆檢視</h2>
            <p class="text-sm text-gray-600">點擊日期查看詳細排程</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="previousMonth"
              class="p-3 hover:bg-gray-100 rounded-xl transition-all cursor-pointer hover:shadow-md"
            >
              <i class="bi bi-chevron-left text-xl"></i>
            </button>
            <div class="px-6 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 class="text-lg font-bold text-gray-900">{{ monthName }}</h3>
            </div>
            <button
              @click="nextMonth"
              class="p-3 hover:bg-gray-100 rounded-xl transition-all cursor-pointer hover:shadow-md"
            >
              <i class="bi bi-chevron-right text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-3">
          <!-- Week Headers -->
          <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="text-center font-bold text-gray-700 py-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            {{ day }}
          </div>

          <!-- Calendar Days -->
          <div
            v-for="(dayData, index) in calendarDays"
            :key="index"
            @click="selectDate(dayData.day)"
            :class="[
              'min-h-28 p-3 border-2 rounded-xl transition-all cursor-pointer',
              dayData.day
                ? 'hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-lg border-gray-200'
                : 'bg-gray-50 border-transparent cursor-default',
              selectedDate && dayData.day === selectedDate.getDate() && currentMonth === selectedDate.getMonth()
                ? 'bg-indigo-100 border-indigo-600 shadow-lg ring-2 ring-indigo-200'
                : ''
            ]"
          >
            <div v-if="dayData.day" class="h-full flex flex-col">
              <div class="text-sm font-bold text-gray-800 mb-2">{{ dayData.day }}</div>
              <div class="flex-1 space-y-1.5">
                <div
                  v-for="schedule in dayData.schedules.slice(0, 2)"
                  :key="schedule.id"
                  class="text-xs px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-lg truncate font-medium border border-indigo-200"
                  :title="schedule.title"
                >
                  <i class="bi bi-clock mr-1"></i>{{ schedule.scheduledTime.slice(0, 5) }} {{ schedule.title }}
                </div>
                <div v-if="dayData.schedules.length > 2" class="text-xs text-gray-600 font-semibold px-2">
                  <i class="bi bi-three-dots"></i> +{{ dayData.schedules.length - 2 }} 更多
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Date Details -->
      <div v-if="selectedDate" class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
        <!-- Section Header -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-calendar-check text-purple-600 text-2xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">
              {{ selectedDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </h3>
            <p class="text-sm text-gray-600">此日期的所有排程</p>
          </div>
        </div>

        <div v-if="selectedDateSchedules.length === 0" class="text-center py-12">
          <div class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="bi bi-calendar-x text-5xl text-gray-400"></i>
          </div>
          <p class="text-gray-500 text-lg font-medium mb-2">此日期沒有排程</p>
          <p class="text-gray-400 text-sm">選擇其他日期或建立新排程</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="schedule in selectedDateSchedules"
            :key="schedule.id"
            class="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <h4 class="font-bold text-lg text-gray-900">{{ schedule.title }}</h4>
                  <span :class="['px-3 py-1.5 rounded-xl text-xs font-bold border-2', getStatusColor(schedule.status)]">
                    {{ getStatusText(schedule.status) }}
                  </span>
                </div>
                <p class="text-gray-700 mb-4 leading-relaxed">{{ schedule.content }}</p>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <i class="bi bi-clock"></i>
                    <span class="font-medium">{{ schedule.scheduledTime }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <i class="bi bi-arrow-repeat"></i>
                    <span class="font-medium">{{ schedule.scheduleType === 'once' ? '單次' : schedule.scheduleType === 'weekly' ? '每週' : '每月' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 ml-6">
                <button
                  @click="handleEdit(schedule.id)"
                  class="p-3 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all cursor-pointer hover:shadow-md border-2 border-transparent hover:border-indigo-200"
                  title="編輯"
                >
                  <i class="bi bi-pencil-square text-xl"></i>
                </button>
                <button
                  @click="handleDuplicate(schedule)"
                  class="p-3 hover:bg-green-50 text-green-600 rounded-xl transition-all cursor-pointer hover:shadow-md border-2 border-transparent hover:border-green-200"
                  title="複製"
                >
                  <i class="bi bi-files text-xl"></i>
                </button>
                <button
                  @click="handleDelete(schedule.id)"
                  class="p-3 hover:bg-red-50 text-red-600 rounded-xl transition-all cursor-pointer hover:shadow-md border-2 border-transparent hover:border-red-200"
                  title="刪除"
                >
                  <i class="bi bi-trash text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else>
      <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
        <!-- Section Header -->
        <div class="flex items-center gap-3 mb-8">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-list-ul text-indigo-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">所有排程</h2>
            <p class="text-sm text-gray-600">共 {{ schedules.length }} 個排程</p>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="schedule in schedules"
            :key="schedule.id"
            class="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <h3 class="text-xl font-bold text-gray-900">{{ schedule.title }}</h3>
                  <span :class="['px-3 py-1.5 rounded-xl text-xs font-bold border-2', getStatusColor(schedule.status)]">
                    {{ getStatusText(schedule.status) }}
                  </span>
                </div>

                <p class="text-gray-700 mb-4 leading-relaxed">{{ schedule.content }}</p>

                <div class="flex gap-3 text-sm">
                  <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <i class="bi bi-calendar-event text-blue-600"></i>
                    <span class="font-semibold text-gray-800">{{ schedule.scheduledDate || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <i class="bi bi-clock text-purple-600"></i>
                    <span class="font-semibold text-gray-800">{{ schedule.scheduledTime }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <i class="bi bi-arrow-repeat text-green-600"></i>
                    <span class="font-semibold text-gray-800">
                      {{ schedule.scheduleType === 'once' ? '單次執行' : schedule.scheduleType === 'weekly' ? '每週重複' : '每月重複' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 ml-6">
                <button
                  @click="handleEdit(schedule.id)"
                  class="p-3 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all cursor-pointer hover:shadow-md border-2 border-transparent hover:border-indigo-200"
                  title="編輯"
                >
                  <i class="bi bi-pencil-square text-xl"></i>
                </button>
                <button
                  @click="handleDuplicate(schedule)"
                  class="p-3 hover:bg-green-50 text-green-600 rounded-xl transition-all cursor-pointer hover:shadow-md border-2 border-transparent hover:border-green-200"
                  title="複製"
                >
                  <i class="bi bi-files text-xl"></i>
                </button>
                <button
                  @click="handleDelete(schedule.id)"
                  class="p-3 hover:bg-red-50 text-red-600 rounded-xl transition-all cursor-pointer hover:shadow-md border-2 border-transparent hover:border-red-200"
                  title="刪除"
                >
                  <i class="bi bi-trash text-xl"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-if="schedules.length === 0" class="text-center py-16">
            <div class="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i class="bi bi-calendar-x text-6xl text-gray-400"></i>
            </div>
            <p class="text-gray-600 text-xl font-bold mb-2">目前沒有任何排程</p>
            <p class="text-gray-500 mb-6">開始建立您的第一個 Discord 訊息排程</p>
            <button
              @click="router.push('/dashboard/schedule/new')"
              class="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl cursor-pointer"
            >
              <i class="bi bi-plus-circle mr-2"></i>
              建立第一個排程
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
