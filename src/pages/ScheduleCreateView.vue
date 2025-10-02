<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type ScheduleType = 'once' | 'weekly' | 'monthly'
type ScheduleStatus = 'draft' | 'active'

interface Channel {
  id: string
  name: string
}

// Form data
const form = ref({
  title: '',
  content: '',
  scheduleType: 'once' as ScheduleType,
  scheduledTime: '09:00:00',
  scheduledDate: '',
  weekDay: 1,
  monthDay: 1,
  channelId: '',
  timezone: 'Asia/Taipei',
  status: 'draft' as ScheduleStatus,
})

// Mock channels data
const channels = ref<Channel[]>([
  { id: '123456789', name: '# 一般' },
  { id: '987654321', name: '# 公告' },
  { id: '456789123', name: '# 開發' },
  { id: '789123456', name: '# 測試' },
])

const timezones = [
  { value: 'Asia/Taipei', label: 'Asia/Taipei (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
  { value: 'UTC', label: 'UTC (UTC+0)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
]

const weekDays = [
  { value: 0, label: '星期日' },
  { value: 1, label: '星期一' },
  { value: 2, label: '星期二' },
  { value: 3, label: '星期三' },
  { value: 4, label: '星期四' },
  { value: 5, label: '星期五' },
  { value: 6, label: '星期六' },
]

onMounted(() => {
  // Set default date for once type
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  form.value.scheduledDate = tomorrow.toISOString().split('T')[0]
})

const handleSubmit = () => {
  // Mock save - no API call
  console.log('Saving schedule:', form.value)
  alert('排程已建立！')
  router.push('/dashboard/schedule/calendar')
}

const handleCancel = () => {
  router.push('/dashboard/schedule/calendar')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">新增排程</h1>
      <p class="text-gray-600">建立新的 Discord 訊息排程</p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-sm p-6">
      <div class="space-y-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
            排程名稱 <span class="text-red-500">*</span>
          </label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            maxlength="100"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="例如：每週會議提醒"
          >
        </div>

        <!-- Content -->
        <div>
          <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
            訊息內容 <span class="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            v-model="form.content"
            required
            maxlength="2000"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            placeholder="輸入要發送的訊息內容..."
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">{{ form.content.length }} / 2000 字元</p>
        </div>

        <!-- Channel Selection -->
        <div>
          <label for="channelId" class="block text-sm font-medium text-gray-700 mb-2">
            Discord 頻道 <span class="text-red-500">*</span>
          </label>
          <select
            id="channelId"
            v-model="form.channelId"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="" disabled>選擇頻道</option>
            <option v-for="channel in channels" :key="channel.id" :value="channel.id">
              {{ channel.name }}
            </option>
          </select>
        </div>

        <!-- Schedule Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            排程類型 <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-3 gap-4">
            <label
              :class="[
                'flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition',
                form.scheduleType === 'once'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <input
                v-model="form.scheduleType"
                type="radio"
                value="once"
                class="sr-only"
              >
              <span class="font-medium">單次執行</span>
            </label>
            <label
              :class="[
                'flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition',
                form.scheduleType === 'weekly'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <input
                v-model="form.scheduleType"
                type="radio"
                value="weekly"
                class="sr-only"
              >
              <span class="font-medium">每週重複</span>
            </label>
            <label
              :class="[
                'flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition',
                form.scheduleType === 'monthly'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <input
                v-model="form.scheduleType"
                type="radio"
                value="monthly"
                class="sr-only"
              >
              <span class="font-medium">每月重複</span>
            </label>
          </div>
        </div>

        <!-- Schedule Date (for once type) -->
        <div v-if="form.scheduleType === 'once'">
          <label for="scheduledDate" class="block text-sm font-medium text-gray-700 mb-2">
            執行日期 <span class="text-red-500">*</span>
          </label>
          <input
            id="scheduledDate"
            v-model="form.scheduledDate"
            type="date"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
        </div>

        <!-- Week Day (for weekly type) -->
        <div v-if="form.scheduleType === 'weekly'">
          <label for="weekDay" class="block text-sm font-medium text-gray-700 mb-2">
            星期幾 <span class="text-red-500">*</span>
          </label>
          <select
            id="weekDay"
            v-model.number="form.weekDay"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option v-for="day in weekDays" :key="day.value" :value="day.value">
              {{ day.label }}
            </option>
          </select>
        </div>

        <!-- Month Day (for monthly type) -->
        <div v-if="form.scheduleType === 'monthly'">
          <label for="monthDay" class="block text-sm font-medium text-gray-700 mb-2">
            每月幾號 <span class="text-red-500">*</span>
          </label>
          <select
            id="monthDay"
            v-model.number="form.monthDay"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option v-for="day in 31" :key="day" :value="day">
              {{ day }} 號
            </option>
          </select>
        </div>

        <!-- Schedule Time -->
        <div>
          <label for="scheduledTime" class="block text-sm font-medium text-gray-700 mb-2">
            執行時間 <span class="text-red-500">*</span>
          </label>
          <input
            id="scheduledTime"
            v-model="form.scheduledTime"
            type="time"
            required
            step="1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
        </div>

        <!-- Timezone -->
        <div>
          <label for="timezone" class="block text-sm font-medium text-gray-700 mb-2">
            時區
          </label>
          <select
            id="timezone"
            v-model="form.timezone"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            排程狀態
          </label>
          <div class="flex gap-4">
            <label
              :class="[
                'flex items-center justify-center px-6 py-3 border-2 rounded-lg cursor-pointer transition flex-1',
                form.status === 'draft'
                  ? 'border-gray-600 bg-gray-50 text-gray-600'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <input
                v-model="form.status"
                type="radio"
                value="draft"
                class="sr-only"
              >
              <span class="font-medium">儲存為草稿</span>
            </label>
            <label
              :class="[
                'flex items-center justify-center px-6 py-3 border-2 rounded-lg cursor-pointer transition flex-1',
                form.status === 'active'
                  ? 'border-green-600 bg-green-50 text-green-600'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <input
                v-model="form.status"
                type="radio"
                value="active"
                class="sr-only"
              >
              <span class="font-medium">立即啟用</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4 mt-8 pt-6 border-t">
        <button
          type="button"
          @click="handleCancel"
          class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium cursor-pointer"
        >
          取消
        </button>
        <button
          type="submit"
          class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium cursor-pointer"
        >
          建立排程
        </button>
      </div>
    </form>
  </div>
</template>
