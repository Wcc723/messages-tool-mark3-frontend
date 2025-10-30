<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useDiscordStore } from '@/stores/discord'
import type { Schedule, ScheduleStatus } from '@/services/api'

const router = useRouter()
const scheduleStore = useScheduleStore()
const discordStore = useDiscordStore()
const { channels } = storeToRefs(discordStore)

type ViewMode = 'calendar' | 'list'

// View mode toggle
const viewMode = ref<ViewMode>('calendar')

// Get schedules from store
const schedules = computed(() => scheduleStore.schedules)

// 格式化日期為 YYYY-MM-DD
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 檢查排程是否應該在指定日期顯示
const shouldShowScheduleOnDate = (schedule: Schedule, targetDate: Date) => {
  const dateStr = formatLocalDate(targetDate)
  const day = targetDate.getDate()
  const weekDay = targetDate.getDay()

  // 檢查 validUntil 截止日期（週期性排程必須檢查）
  if (schedule.validUntil) {
    const validUntilDate = new Date(schedule.validUntil)
    // 如果目標日期超過截止日期，不顯示
    if (targetDate > validUntilDate) {
      return false
    }
  }

  // 單次排程：比對 scheduledDate
  if (schedule.scheduleType === 'once') {
    return schedule.scheduledDate === dateStr
  }

  // 週排程：比對 weekDay
  if (schedule.scheduleType === 'weekly') {
    return schedule.weekDay === weekDay
  }

  // 月排程：比對 monthDay
  if (schedule.scheduleType === 'monthly') {
    return schedule.monthDay === day
  }

  return false
}

const searchKeyword = ref('')
const statusFilter = ref<ScheduleStatus | ''>('')
const isFiltering = ref(false)
const filterError = ref<string | null>(null)
const statusOptions: Array<{ value: ScheduleStatus | ''; label: string }> = [
  { value: '', label: '全部狀態' },
  { value: 'active', label: '啟用中' },
  { value: 'draft', label: '草稿' },
  { value: 'paused', label: '已暫停' },
  { value: 'completed', label: '已完成' },
]

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const showScheduleModal = ref(false)
const modalSchedule = ref<Schedule | null>(null)

const formatDateTime = (isoString?: string | null) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isSelectedDay = (day: number | null) => {
  if (!day || !selectedDate.value) return false
  return (
    selectedDate.value.getFullYear() === currentYear.value &&
    selectedDate.value.getMonth() === currentMonth.value &&
    selectedDate.value.getDate() === day
  )
}

const getChannelName = (channelId: string) => {
  const channel = discordStore.getChannelById(channelId)
  return channel ? `#${channel.name}` : channelId
}

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
    const targetDate = new Date(currentYear.value, currentMonth.value, day)

    // Filter schedules for this day
    const daySchedules = schedules.value.filter((schedule) =>
      shouldShowScheduleOnDate(schedule, targetDate)
    )

    days.push({ day, schedules: daySchedules })
  }

  return days
})

const selectedDateSchedules = computed(() => {
  if (!selectedDate.value) return []

  return schedules.value.filter((schedule) =>
    shouldShowScheduleOnDate(schedule, selectedDate.value!)
  )
})

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const selectDate = (day: number | null) => {
  if (!day) return
  // 使用當地時區的日期，避免時區問題
  const year = currentYear.value
  const month = currentMonth.value
  selectedDate.value = new Date(year, month, day, 0, 0, 0, 0)
}

const openScheduleModal = (schedule: Schedule) => {
  modalSchedule.value = schedule
  showScheduleModal.value = true
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
  modalSchedule.value = null
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
const fetchSchedules = async (params?: { search?: string; status?: ScheduleStatus | '' }) => {
  try {
    filterError.value = null
    await scheduleStore.fetchSchedules({
      search: params?.search && params.search.trim() !== '' ? params.search.trim() : undefined,
      status: params?.status ? params.status : undefined,
    })
  } catch (error: any) {
    const message = error.response?.data?.message || '載入排程失敗'
    if (params) {
      filterError.value = message
    } else {
      alert(message)
    }
  }
}

const applyFilters = async () => {
  isFiltering.value = true
  await fetchSchedules({ search: searchKeyword.value, status: statusFilter.value })
  isFiltering.value = false
}

const resetFilters = async () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  await applyFilters()
}

onMounted(async () => {
  await fetchSchedules()

  if (!channels.value.length) {
    try {
      await discordStore.fetchChannels()
    } catch (error: any) {
      console.error('Failed to load Discord channels:', error)
    }
  }
})

// Reload schedules when month changes
watch([currentYear, currentMonth], async () => {
  await fetchSchedules({ search: searchKeyword.value, status: statusFilter.value })
})

// CRUD operations
const handleEdit = (id: string) => {
  router.push(`/dashboard/schedule/edit/${id}`)
}

const handleDuplicate = (schedule: Schedule) => {
  scheduleStore.setCopiedSchedule(schedule)
  router.push('/dashboard/schedule/new')
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
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex gap-2">
          <button
            @click="viewMode = 'calendar'"
            :class="[
              'px-4 py-2 rounded-md font-medium transition-colors cursor-pointer border',
              viewMode === 'calendar'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            ]"
          >
            <i class="bi bi-calendar3 mr-2"></i>
            行事曆檢視
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-4 py-2 rounded-md font-medium transition-colors cursor-pointer border',
              viewMode === 'list'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            ]"
          >
            <i class="bi bi-list-ul mr-2"></i>
            列表檢視
          </button>
        </div>

        <button
          @click="router.push('/dashboard/schedule/new')"
          class="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium cursor-pointer"
        >
          <i class="bi bi-plus-circle mr-2"></i>
          新增排程
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-8">
      <form @submit.prevent="applyFilters" class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto] md:items-end">
        <div class="flex flex-col gap-2">
          <label for="scheduleSearch" class="text-sm font-medium text-gray-700">關鍵字</label>
          <input
            id="scheduleSearch"
            v-model="searchKeyword"
            type="text"
            placeholder="輸入標題或內容關鍵字"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="scheduleStatus" class="text-sm font-medium text-gray-700">狀態</label>
          <select
            id="scheduleStatus"
            v-model="statusFilter"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
          >
            <option v-for="option in statusOptions" :key="option.value || 'all'" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="flex gap-2 md:justify-end">
          <button
            type="button"
            @click="resetFilters"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            重設
          </button>
          <button
            type="submit"
            :disabled="isFiltering"
            class="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {{ isFiltering ? '篩選中...' : '套用篩選' }}
          </button>
        </div>
      </form>
      <p v-if="filterError" class="text-sm text-red-600 mt-3">{{ filterError }}</p>
    </div>

    <!-- Calendar View -->
    <div v-if="viewMode === 'calendar'" class="space-y-8">
      <!-- Calendar Card -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <!-- Calendar Header Section -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
              <i class="bi bi-calendar-event text-gray-600 text-xl"></i>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">月曆檢視</h2>
              <p class="text-sm text-gray-600">點擊日期查看詳細排程</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="previousMonth"
              class="p-2 rounded-md border border-transparent hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <i class="bi bi-chevron-left text-lg text-gray-700"></i>
            </button>
            <div class="px-3 py-2 rounded-md border border-gray-200 bg-gray-50">
              <h3 class="text-base font-medium text-gray-800">{{ monthName }}</h3>
            </div>
            <button
              @click="nextMonth"
              class="p-2 rounded-md border border-transparent hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <i class="bi bi-chevron-right text-lg text-gray-700"></i>
            </button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-2">
          <!-- Week Headers -->
          <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="text-center font-medium text-gray-600 py-2 bg-gray-50 border border-gray-200 rounded-md">
            {{ day }}
          </div>

          <!-- Calendar Days -->
          <div
            v-for="(dayData, index) in calendarDays"
            :key="index"
            @click="selectDate(dayData.day)"
            :class="[
              'min-h-28 p-3 border rounded-md',
              dayData.day ? 'border-gray-200 cursor-pointer' : 'bg-gray-50 border-transparent cursor-default',
              dayData.day && !isSelectedDay(dayData.day) ? 'transition-colors hover:bg-gray-100' : '',
              isSelectedDay(dayData.day) ? 'bg-gray-200 border-gray-400 text-gray-900' : ''
            ]"
          >
            <div v-if="dayData.day" class="h-full flex flex-col">
              <div :class="['text-sm font-medium mb-2', isSelectedDay(dayData.day) ? 'text-gray-900' : 'text-gray-800']">{{ dayData.day }}</div>
              <div class="flex-1 space-y-1">
                <div
                  v-for="schedule in dayData.schedules.slice(0, 2)"
                  :key="schedule.id"
                  @click.stop="openScheduleModal(schedule)"
                  class="text-xs px-2 py-1 bg-white/80 border border-gray-200 rounded font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1 min-w-0"
                  :title="schedule.title"
                >
                  <i class="bi bi-clock text-gray-500 flex-shrink-0"></i>
                  <i
                    v-if="schedule.scheduleType !== 'once'"
                    class="bi bi-arrow-repeat text-gray-500 flex-shrink-0"
                    title="循環排程"
                  ></i>
                  <span class="truncate">
                    {{ schedule.scheduledTime.slice(0, 5) }} {{ schedule.title }}
                  </span>
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
      <div v-if="selectedDate" class="bg-white rounded-lg border border-gray-200 p-6">
        <!-- Section Header -->
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-calendar-check text-gray-600 text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ selectedDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </h3>
            <p class="text-sm text-gray-600">此日期的所有排程</p>
          </div>
        </div>

        <div v-if="selectedDateSchedules.length === 0" class="text-center py-12">
          <div class="w-20 h-20 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i class="bi bi-calendar-x text-4xl text-gray-400"></i>
          </div>
          <p class="text-gray-600 text-base font-medium mb-2">此日期沒有排程</p>
          <p class="text-gray-400 text-sm">選擇其他日期或建立新排程</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="schedule in selectedDateSchedules"
            :key="schedule.id"
            class="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <h4 class="font-semibold text-base text-gray-900">{{ schedule.title }}</h4>
                  <span :class="['px-2 py-0.5 rounded text-xs font-medium border', getStatusColor(schedule.status)]">
                    {{ getStatusText(schedule.status) }}
                  </span>
                </div>
                <p class="text-gray-700 mb-4 leading-relaxed">{{ schedule.content }}</p>
                <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                    <i class="bi bi-clock"></i>
                    <span class="font-medium">{{ schedule.scheduledTime }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                    <i class="bi bi-arrow-repeat"></i>
                    <span class="font-medium">{{ schedule.scheduleType === 'once' ? '單次' : schedule.scheduleType === 'weekly' ? '每週' : '每月' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 ml-6">
                <button
                  @click="handleEdit(schedule.id)"
                  class="p-2 text-gray-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-300 hover:bg-gray-100"
                  title="編輯"
                >
                  <i class="bi bi-pencil-square text-lg"></i>
                </button>
                <button
                  @click="handleDuplicate(schedule)"
                  class="p-2 text-gray-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-300 hover:bg-gray-100"
                  title="複製"
                >
                  <i class="bi bi-files text-lg"></i>
                </button>
                <button
                  @click="handleDelete(schedule.id)"
                  class="p-2 text-red-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-red-200 hover:bg-red-50"
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
    <div v-else>
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <!-- Section Header -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-list-ul text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">所有排程</h2>
            <p class="text-sm text-gray-600">共 {{ schedules.length }} 個排程</p>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="schedule in schedules"
            :key="schedule.id"
            class="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <h3 class="text-base font-semibold text-gray-900">{{ schedule.title }}</h3>
                  <span :class="['px-2 py-0.5 rounded text-xs font-medium border', getStatusColor(schedule.status)]">
                    {{ getStatusText(schedule.status) }}
                  </span>
                </div>

                <p class="text-gray-700 mb-4 leading-relaxed">{{ schedule.content }}</p>

                <div class="flex flex-wrap gap-3 text-sm">
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                    <i class="bi bi-calendar-event text-gray-600"></i>
                    <span class="font-medium text-gray-800">{{ schedule.scheduledDate || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                    <i class="bi bi-clock text-gray-600"></i>
                    <span class="font-medium text-gray-800">{{ schedule.scheduledTime }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                    <i class="bi bi-arrow-repeat text-gray-600"></i>
                    <span class="font-medium text-gray-800">
                      {{ schedule.scheduleType === 'once' ? '單次執行' : schedule.scheduleType === 'weekly' ? '每週重複' : '每月重複' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 ml-6">
                <button
                  @click="handleEdit(schedule.id)"
                  class="p-2 text-gray-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-300 hover:bg-gray-100"
                  title="編輯"
                >
                  <i class="bi bi-pencil-square text-lg"></i>
                </button>
                <button
                  @click="handleDuplicate(schedule)"
                  class="p-2 text-gray-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-300 hover:bg-gray-100"
                  title="複製"
                >
                  <i class="bi bi-files text-lg"></i>
                </button>
                <button
                  @click="handleDelete(schedule.id)"
                  class="p-2 text-red-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-red-200 hover:bg-red-50"
                  title="刪除"
                >
                  <i class="bi bi-trash text-lg"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-if="schedules.length === 0" class="text-center py-12">
            <div class="w-24 h-24 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="bi bi-calendar-x text-4xl text-gray-400"></i>
            </div>
            <p class="text-gray-600 text-base font-medium mb-2">目前沒有任何排程</p>
            <p class="text-gray-500 text-sm mb-6">開始建立您的第一個 Discord 訊息排程</p>
            <button
              @click="router.push('/dashboard/schedule/new')"
              class="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium cursor-pointer"
            >
              <i class="bi bi-plus-circle mr-2"></i>
              建立第一個排程
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Detail Modal -->
    <div
      v-if="showScheduleModal && modalSchedule"
      @click="closeScheduleModal"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in"
    >
      <div
        @click.stop
        class="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[85vh] overflow-hidden animate-scale-in border border-gray-200"
      >
        <!-- Modal Header -->
        <div class="border-b border-gray-200 p-6 bg-white">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <i class="bi bi-calendar-event text-gray-600 text-lg"></i>
                </div>
                <span :class="['px-2 py-0.5 rounded text-xs font-medium border', getStatusColor(modalSchedule.status)]">
                  {{ getStatusText(modalSchedule.status) }}
                </span>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 mb-2 leading-tight">{{ modalSchedule.title }}</h2>
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <i class="bi bi-clock-fill"></i>
                  <span class="font-medium">{{ modalSchedule.scheduledTime }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="bi bi-arrow-repeat"></i>
                  <span class="font-medium">{{
                    modalSchedule.scheduleType === 'once' ? '單次執行' :
                    modalSchedule.scheduleType === 'weekly' ? '每週重複' : '每月重複'
                  }}</span>
                </div>
              </div>
            </div>
            <button
              @click="closeScheduleModal"
              class="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            >
              <i class="bi bi-x-lg text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-240px)] bg-gray-50">
          <!-- Content -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 bg-white rounded-md flex items-center justify-center border border-gray-200">
                <i class="bi bi-chat-left-text text-gray-600"></i>
              </div>
              <h3 class="text-base font-semibold text-gray-900">訊息內容</h3>
            </div>
            <div class="bg-white rounded-lg p-5 border border-gray-200">
              <p class="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{{ modalSchedule.content }}</p>
            </div>
          </div>

          <!-- Schedule Details -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-white rounded-md flex items-center justify-center border border-gray-200">
                <i class="bi bi-info-circle text-gray-600"></i>
              </div>
              <h3 class="text-base font-semibold text-gray-900">排程資訊</h3>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <div class="flex items-center gap-2 mb-1 text-xs text-gray-500 uppercase tracking-wide">
                  <i class="bi bi-arrow-repeat text-gray-500"></i>
                  <p class="font-medium">類型</p>
                </div>
                <p class="text-sm font-medium text-gray-900">
                  {{
                    modalSchedule.scheduleType === 'once' ? '單次執行' :
                    modalSchedule.scheduleType === 'weekly' ? '每週重複' : '每月重複'
                  }}
                </p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <div class="flex items-center gap-2 mb-1 text-xs text-gray-500 uppercase tracking-wide">
                  <i class="bi bi-clock-fill text-gray-500"></i>
                  <p class="font-medium">時間</p>
                </div>
                <p class="text-sm font-medium text-gray-900">{{ modalSchedule.scheduledTime }}</p>
              </div>
              <div v-if="modalSchedule.scheduledDate" class="bg-white rounded-lg p-4 border border-gray-200">
                <div class="flex items-center gap-2 mb-1 text-xs text-gray-500 uppercase tracking-wide">
                  <i class="bi bi-calendar-check text-gray-500"></i>
                  <p class="font-medium">日期</p>
                </div>
                <p class="text-sm font-medium text-gray-900">{{ modalSchedule.scheduledDate }}</p>
              </div>
              <div v-if="modalSchedule.validUntil" class="bg-white rounded-lg p-4 border border-gray-200">
                <div class="flex items-center gap-2 mb-1 text-xs text-gray-500 uppercase tracking-wide">
                  <i class="bi bi-calendar-minus text-gray-500"></i>
                  <p class="font-medium">截止時間</p>
                </div>
                <p class="text-sm font-medium text-gray-900">
                  {{ formatDateTime(modalSchedule.validUntil) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">超過此時間後排程將不再執行。</p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <div class="flex items-center gap-2 mb-1 text-xs text-gray-500 uppercase tracking-wide">
                  <i class="bi bi-hash text-gray-500"></i>
                  <p class="font-medium">頻道</p>
                </div>
                <p class="text-sm font-medium text-gray-900 truncate">{{ getChannelName(modalSchedule.channelId) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex flex-col gap-2 sm:flex-row">
          <button
            @click="handleEdit(modalSchedule.id)"
            class="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <i class="bi bi-pencil-square text-lg"></i>
            <span>編輯</span>
          </button>
          <button
            @click="handleDuplicate(modalSchedule); closeScheduleModal()"
            class="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <i class="bi bi-files text-lg"></i>
            <span>複製</span>
          </button>
          <button
            @click="handleDelete(modalSchedule.id); closeScheduleModal()"
            class="flex-1 px-4 py-2 bg-white text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <i class="bi bi-trash text-lg"></i>
            <span>刪除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
