<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiscordStore } from '@/stores/discord'
import { useScheduleStore } from '@/stores/schedule'
import type { ScheduleType, Timezone } from '@/services/api'

const router = useRouter()
const route = useRoute()
const discordStore = useDiscordStore()
const scheduleStore = useScheduleStore()

type ScheduleStatus = 'draft' | 'active'

// Edit mode
const scheduleId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!scheduleId.value)

// UI State
const channelSearch = ref('')
const isChannelDropdownOpen = ref(false)
const isSubmitting = ref(false)

// Form data
const form = ref({
  title: '',
  content: '',
  scheduleType: 'once' as ScheduleType,
  scheduledTime: '09:00',
  scheduledDate: '',
  weekDay: 1,
  monthDay: 1,
  channelId: '',
  timezone: 'Asia/Taipei',
  status: 'draft' as ScheduleStatus,
})

// Data from stores
const timezones = computed(() => scheduleStore.timezones)

const weekDays = [
  { value: 1, label: '週一', short: '一' },
  { value: 2, label: '週二', short: '二' },
  { value: 3, label: '週三', short: '三' },
  { value: 4, label: '週四', short: '四' },
  { value: 5, label: '週五', short: '五' },
  { value: 6, label: '週六', short: '六' },
  { value: 0, label: '週日', short: '日' },
]

// Computed filtered channels
const filteredChannels = computed(() => {
  if (!channelSearch.value) return discordStore.textChannels
  const search = channelSearch.value.toLowerCase()
  return discordStore.textChannels.filter((channel) => channel.name.toLowerCase().includes(search))
})

// Grouped channels by category
const groupedChannels = computed(() => {
  const groups: Record<string, typeof discordStore.textChannels> = {}
  filteredChannels.value.forEach((channel) => {
    const category = channel.parentId || '未分類'
    if (!groups[category]) groups[category] = []
    groups[category].push(channel)
  })
  return groups
})

const selectedChannel = computed(() => {
  return discordStore.channels.find((c) => c.id === form.value.channelId)
})

const selectChannel = (channelId: string) => {
  form.value.channelId = channelId
  isChannelDropdownOpen.value = false
  channelSearch.value = ''
}

// Load initial data
onMounted(async () => {
  try {
    // Load channels and timezones in parallel
    await Promise.all([discordStore.fetchChannels(), scheduleStore.fetchTimezones()])

    // Edit mode: load existing schedule
    if (isEditMode.value && scheduleId.value) {
      await loadSchedule(scheduleId.value)
    } else {
      // Create mode: set default date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      form.value.scheduledDate = dateStr || ''
    }
  } catch (error: any) {
    console.error('Failed to load initial data:', error)
    alert(error.response?.data?.message || '載入資料失敗')
  }
})

// Load schedule for editing
async function loadSchedule(id: string) {
  try {
    const schedule = await scheduleStore.fetchScheduleById(id)

    form.value = {
      title: schedule.title,
      content: schedule.content,
      scheduleType: schedule.scheduleType,
      scheduledTime: schedule.scheduledTime.substring(0, 5), // HH:mm:ss -> HH:mm
      scheduledDate: schedule.scheduledDate || '',
      weekDay: schedule.weekDay || 1,
      monthDay: schedule.monthDay || 1,
      channelId: schedule.channelId,
      timezone: schedule.timezone,
      status: schedule.status as ScheduleStatus,
    }
  } catch (error: any) {
    console.error('Failed to load schedule:', error)
    alert(error.response?.data?.message || '載入排程失敗')
    router.push('/dashboard/schedule/calendar')
  }
}

// Build request payload
function buildPayload() {
  const payload: any = {
    title: form.value.title,
    content: form.value.content,
    scheduleType: form.value.scheduleType,
    scheduledTime: `${form.value.scheduledTime}:00`, // HH:mm -> HH:mm:ss
    channelId: form.value.channelId,
    timezone: form.value.timezone,
    status: form.value.status,
  }

  // Add type-specific fields
  if (form.value.scheduleType === 'once') {
    payload.scheduledDate = form.value.scheduledDate
  } else if (form.value.scheduleType === 'weekly') {
    payload.weekDay = form.value.weekDay
  } else if (form.value.scheduleType === 'monthly') {
    payload.monthDay = form.value.monthDay
  }

  return payload
}

// Handle form submission
async function handleSubmit() {
  if (!isFormValid()) return

  isSubmitting.value = true

  try {
    const payload = buildPayload()

    if (isEditMode.value && scheduleId.value) {
      await scheduleStore.updateSchedule(scheduleId.value, payload)
      alert('排程已更新！')
    } else {
      await scheduleStore.createSchedule(payload)
      alert('排程已建立！')
    }

    router.push('/dashboard/schedule/calendar')
  } catch (error: any) {
    console.error('Failed to save schedule:', error)
    alert(error.response?.data?.message || '操作失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/schedule/calendar')
}

const isFormValid = () => {
  return (
    form.value.title.trim() !== '' &&
    form.value.content.trim() !== '' &&
    form.value.channelId !== ''
  )
}
</script>

<template>
  <div>
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            {{ isEditMode ? '編輯排程' : '建立新排程' }}
          </h1>
          <p class="text-gray-600">設定您的 Discord 訊息排程</p>
        </div>
        <button
          @click="handleCancel"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
        >
          <i class="bi bi-x-lg text-xl"></i>
        </button>
      </div>
    </div>

    <form
      id="schedule-form"
      @submit.prevent="handleSubmit"
      class="space-y-6 max-w-6xl mx-auto pb-32"
    >
      <!-- 訊息內容區塊 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-chat-left-text text-indigo-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">訊息內容</h2>
            <p class="text-sm text-gray-600">設定要發送的訊息標題和內容</p>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <label for="title" class="block text-sm font-semibold text-gray-700 mb-3">
              排程標題 <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              maxlength="100"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-lg"
              placeholder="例如：每週團隊會議提醒"
            />
            <p class="text-sm text-gray-500 mt-2">{{ form.title.length }} / 100 字元</p>
          </div>

          <div>
            <label for="content" class="block text-sm font-semibold text-gray-700 mb-3">
              訊息內容 <span class="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              v-model="form.content"
              required
              maxlength="2000"
              rows="6"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition"
              placeholder="輸入要發送到 Discord 的訊息內容..."
            ></textarea>
            <p class="text-sm text-gray-500 mt-2">{{ form.content.length }} / 2000 字元</p>
          </div>

          <!-- Preview Card -->
          <div
            v-if="form.title || form.content"
            class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100"
          >
            <p class="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <i class="bi bi-eye"></i>
              訊息預覽
            </p>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <h3 v-if="form.title" class="font-bold text-gray-900 mb-2">{{ form.title }}</h3>
              <p v-if="form.content" class="text-gray-700 whitespace-pre-wrap">
                {{ form.content }}
              </p>
              <p v-else class="text-gray-400 italic">訊息內容會顯示在這裡...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 發送設定區塊 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-discord text-purple-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">發送設定</h2>
            <p class="text-sm text-gray-600">選擇 Discord 頻道和時區</p>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">
              Discord 頻道 <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <!-- Selected Channel Display / Dropdown Trigger -->
              <button
                type="button"
                @click="isChannelDropdownOpen = !isChannelDropdownOpen"
                :class="[
                  'w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl transition-all',
                  isChannelDropdownOpen
                    ? 'border-purple-600 ring-2 ring-purple-500'
                    : selectedChannel
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300',
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      selectedChannel ? 'bg-purple-600' : 'bg-gray-200',
                    ]"
                  >
                    <i
                      :class="[
                        'bi bi-hash text-xl',
                        selectedChannel ? 'text-white' : 'text-gray-500',
                      ]"
                    ></i>
                  </div>
                  <div class="text-left">
                    <p v-if="selectedChannel" class="font-semibold text-gray-900">
                      {{ selectedChannel.name }}
                    </p>
                    <p v-else class="text-gray-500">請選擇 Discord 頻道</p>
                    <p v-if="selectedChannel" class="text-sm text-gray-500">
                      ID: {{ selectedChannel.id }}
                    </p>
                  </div>
                </div>
                <i
                  :class="[
                    'bi text-xl text-gray-500 transition-transform',
                    isChannelDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down',
                  ]"
                ></i>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="isChannelDropdownOpen"
                class="absolute z-10 w-full mt-2 bg-white border-2 border-purple-600 rounded-xl shadow-xl"
              >
                <!-- Search Input -->
                <div class="p-3 border-b border-gray-200">
                  <div class="relative">
                    <i
                      class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    ></i>
                    <input
                      v-model="channelSearch"
                      type="text"
                      placeholder="搜尋頻道或分類..."
                      class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      @click.stop
                    />
                  </div>
                </div>

                <!-- Channel List -->
                <div class="max-h-80 overflow-y-auto">
                  <div
                    v-if="Object.keys(groupedChannels).length === 0"
                    class="p-4 text-center text-gray-500"
                  >
                    找不到符合的頻道
                  </div>
                  <div v-else>
                    <div
                      v-for="(channelList, category) in groupedChannels"
                      :key="category"
                      class="border-b border-gray-100 last:border-b-0"
                    >
                      <div
                        class="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {{ category }}
                      </div>
                      <button
                        v-for="channel in channelList"
                        :key="channel.id"
                        type="button"
                        @click="selectChannel(channel.id)"
                        :class="[
                          'w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition cursor-pointer',
                          form.channelId === channel.id ? 'bg-purple-100' : '',
                        ]"
                      >
                        <div
                          :class="[
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            form.channelId === channel.id ? 'bg-purple-600' : 'bg-gray-200',
                          ]"
                        >
                          <i
                            :class="[
                              'bi bi-hash',
                              form.channelId === channel.id ? 'text-white' : 'text-gray-500',
                            ]"
                          ></i>
                        </div>
                        <div class="flex-1 text-left">
                          <p class="font-medium text-gray-900">{{ channel.name }}</p>
                        </div>
                        <i
                          v-if="form.channelId === channel.id"
                          class="bi bi-check-circle-fill text-purple-600"
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label for="timezone" class="block text-sm font-semibold text-gray-700 mb-3">
              時區設定
            </label>
            <select
              id="timezone"
              v-model="form.timezone"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer transition"
            >
              <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
                {{ tz.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 排程時間區塊 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-calendar-event text-blue-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">排程時間</h2>
            <p class="text-sm text-gray-600">設定訊息的發送時間規則</p>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Schedule Type -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">
              排程類型 <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                v-for="type in [
                  {
                    value: 'once',
                    label: '單次執行',
                    icon: 'bi-calendar-check',
                    desc: '指定日期執行一次',
                  },
                  {
                    value: 'weekly',
                    label: '每週重複',
                    icon: 'bi-arrow-repeat',
                    desc: '每週固定時間執行',
                  },
                  {
                    value: 'monthly',
                    label: '每月重複',
                    icon: 'bi-calendar-month',
                    desc: '每月固定日期執行',
                  },
                ]"
                :key="type.value"
                :class="[
                  'flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-blue-300 hover:shadow-md',
                  form.scheduleType === type.value
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:bg-gray-50',
                ]"
              >
                <input
                  v-model="form.scheduleType"
                  type="radio"
                  :value="type.value"
                  class="sr-only"
                />
                <i
                  :class="[
                    type.icon,
                    'text-2xl mr-3 mt-1',
                    form.scheduleType === type.value ? 'text-blue-600' : 'text-gray-400',
                  ]"
                ></i>
                <div class="flex-1">
                  <p
                    :class="[
                      'font-semibold mb-1',
                      form.scheduleType === type.value ? 'text-blue-600' : 'text-gray-900',
                    ]"
                  >
                    {{ type.label }}
                  </p>
                  <p class="text-xs text-gray-500">{{ type.desc }}</p>
                </div>
                <i
                  v-if="form.scheduleType === type.value"
                  class="bi bi-check-circle-fill text-blue-600 text-lg ml-2"
                ></i>
              </label>
            </div>
          </div>

          <!-- Date/Day Selection -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-if="form.scheduleType === 'once'">
              <label for="scheduledDate" class="block text-sm font-semibold text-gray-700 mb-3">
                執行日期 <span class="text-red-500">*</span>
              </label>
              <input
                id="scheduledDate"
                v-model="form.scheduledDate"
                type="date"
                required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer transition"
              />
            </div>

            <div v-if="form.scheduleType === 'weekly'" class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-3">
                選擇星期 <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-7 gap-2">
                <label
                  v-for="day in weekDays"
                  :key="day.value"
                  :class="[
                    'flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-blue-300',
                    form.weekDay === day.value
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                      : 'border-gray-200 hover:bg-gray-50',
                  ]"
                >
                  <input
                    v-model.number="form.weekDay"
                    type="radio"
                    :value="day.value"
                    class="sr-only"
                  />
                  <span class="text-xs mb-1">{{ day.label }}</span>
                  <span class="text-lg font-bold">{{ day.short }}</span>
                </label>
              </div>
            </div>

            <div v-if="form.scheduleType === 'monthly'">
              <label for="monthDay" class="block text-sm font-semibold text-gray-700 mb-3">
                每月幾號 <span class="text-red-500">*</span>
              </label>
              <select
                id="monthDay"
                v-model.number="form.monthDay"
                required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer transition"
              >
                <option v-for="day in 31" :key="day" :value="day">每月 {{ day }} 號</option>
              </select>
            </div>

            <!-- Time Selection -->
            <div>
              <label for="scheduledTime" class="block text-sm font-semibold text-gray-700 mb-3">
                執行時間 <span class="text-red-500">*</span>
              </label>
              <input
                id="scheduledTime"
                v-model="form.scheduledTime"
                type="time"
                required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer transition text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 排程狀態區塊 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-toggle-on text-green-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">排程狀態</h2>
            <p class="text-sm text-gray-600">選擇排程的初始狀態</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            :class="[
              'flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md',
              form.status === 'draft'
                ? 'border-gray-600 bg-gray-50 shadow-md'
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-400',
            ]"
          >
            <input v-model="form.status" type="radio" value="draft" class="sr-only" />
            <div class="flex items-start gap-4 flex-1">
              <div
                :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  form.status === 'draft' ? 'bg-gray-600' : 'bg-gray-200',
                ]"
              >
                <i
                  :class="[
                    'bi bi-file-earmark-text text-2xl',
                    form.status === 'draft' ? 'text-white' : 'text-gray-500',
                  ]"
                ></i>
              </div>
              <div class="flex-1">
                <p
                  :class="[
                    'font-bold text-lg mb-1',
                    form.status === 'draft' ? 'text-gray-900' : 'text-gray-700',
                  ]"
                >
                  儲存為草稿
                </p>
                <p class="text-sm text-gray-500">稍後再手動啟用排程</p>
              </div>
            </div>
            <i
              v-if="form.status === 'draft'"
              class="bi bi-check-circle-fill text-gray-600 text-2xl ml-2"
            ></i>
          </label>

          <label
            :class="[
              'flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md',
              form.status === 'active'
                ? 'border-green-600 bg-green-50 shadow-md'
                : 'border-gray-200 hover:bg-gray-50 hover:border-green-400',
            ]"
          >
            <input v-model="form.status" type="radio" value="active" class="sr-only" />
            <div class="flex items-start gap-4 flex-1">
              <div
                :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  form.status === 'active' ? 'bg-green-600' : 'bg-gray-200',
                ]"
              >
                <i
                  :class="[
                    'bi bi-play-circle-fill text-2xl',
                    form.status === 'active' ? 'text-white' : 'text-gray-500',
                  ]"
                ></i>
              </div>
              <div class="flex-1">
                <p
                  :class="[
                    'font-bold text-lg mb-1',
                    form.status === 'active' ? 'text-gray-900' : 'text-gray-700',
                  ]"
                >
                  立即啟用
                </p>
                <p class="text-sm text-gray-500">建立後立即開始自動發送</p>
              </div>
            </div>
            <i
              v-if="form.status === 'active'"
              class="bi bi-check-circle-fill text-green-600 text-2xl ml-2"
            ></i>
          </label>
        </div>
      </div>
    </form>

    <!-- Submit Actions - Full Width -->
    <div
      class="sticky bottom-0 left-0 right-0 -mb-6 -mx-6 bg-white border-t-2 border-gray-200 shadow-2xl z-2"
    >
      <div class="max-w-6xl mx-auto px-6 py-6 space-y-3 flex">
        <button
          type="button"
          @click="handleCancel"
          class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold cursor-pointer"
        >
          <i class="bi bi-x-circle mr-2"></i>
          取消
        </button>

        <button
          type="submit"
          form="schedule-form"
          :disabled="!isFormValid() || isSubmitting"
          :class="[
            'px-8 py-3 rounded-xl font-bold text-lg transition shadow-lg ml-auto',
            isFormValid() && !isSubmitting
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          ]"
        >
          <i v-if="isSubmitting" class="bi bi-hourglass-split mr-2"></i>
          <i v-else class="bi bi-check-circle-fill mr-2"></i>
          {{ isSubmitting ? (isEditMode ? '更新中...' : '建立中...') : (isEditMode ? '更新排程' : '建立排程') }}
        </button>
      </div>
    </div>
  </div>
</template>
