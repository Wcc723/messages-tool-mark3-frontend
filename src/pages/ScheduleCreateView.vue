<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import { useRouter, useRoute } from 'vue-router'
import { useDiscordStore } from '@/stores/discord'
import { useScheduleStore } from '@/stores/schedule'
import type { ScheduleType, Timezone, ScheduleAttachmentImage } from '@/services/api'
import { storageApi } from '@/services/api'

const router = useRouter()
const route = useRoute()
const discordStore = useDiscordStore()
const scheduleStore = useScheduleStore()
const { copiedScheduleData } = storeToRefs(scheduleStore)

type ScheduleStatus = 'draft' | 'active'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']

function buildDefaultForm() {
  const today = new Date()
  const defaultDate = formatLocalDate(today)

  const now = new Date()
  now.setMinutes(now.getMinutes() + 10)
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const defaultTime = `${hours}:${minutes}`

  return {
    title: '',
    content: '',
    scheduleType: 'once' as ScheduleType,
    scheduledTime: defaultTime,
    scheduledDate: defaultDate,
    weekDay: 1,
    monthDay: 1,
    channelId: '',
    timezone: 'Asia/Taipei',
    status: 'draft' as ScheduleStatus,
    validUntil: '',
  }
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLocalDateTimeInput(isoString: string | null | undefined) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Configure marked
marked.setOptions({
  breaks: true, // 支援換行
  gfm: true, // GitHub Flavored Markdown
})

// Edit mode
const scheduleId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!scheduleId.value)

// UI State
const channelSearch = ref('')
const isChannelDropdownOpen = ref(false)
const isSubmitting = ref(false)
const isUploading = ref(false)
const removingImageId = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const uploadedImages = ref<ScheduleAttachmentImage[]>([])

// Form data
const form = ref(buildDefaultForm())

// Data from stores
const timezones = computed(() => scheduleStore.timezones)

// Markdown preview
const contentPreviewHtml = computed(() => {
  if (!form.value.content) return ''
  return marked(form.value.content)
})

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
    const fetchChannelsPromise = discordStore.channels.length
      ? Promise.resolve()
      : discordStore.fetchChannels()
    const fetchTimezonesPromise = scheduleStore.timezones.length
      ? Promise.resolve()
      : scheduleStore.fetchTimezones()

    await Promise.all([fetchChannelsPromise, fetchTimezonesPromise])

    if (isEditMode.value && scheduleId.value) {
      await loadSchedule(scheduleId.value)
    } else if (copiedScheduleData.value) {
      loadCopiedSchedule()
    } else {
      form.value = buildDefaultForm()
      uploadedImages.value = []
    }
  } catch (error: any) {
    console.error('Failed to load initial data:', error)
    alert(error.response?.data?.message || '載入資料失敗')
  }
})

function loadCopiedSchedule() {
  if (!copiedScheduleData.value) return

  const defaults = buildDefaultForm()
  const copied = copiedScheduleData.value

  form.value = {
    title: copied.title ?? '',
    content: copied.content ?? '',
    scheduleType: (copied.scheduleType ?? defaults.scheduleType) as ScheduleType,
    scheduledTime: defaults.scheduledTime,
    scheduledDate: defaults.scheduledDate,
    weekDay: copied.weekDay ?? defaults.weekDay,
    monthDay: copied.monthDay ?? defaults.monthDay,
    channelId: copied.channelId ?? defaults.channelId,
    timezone: copied.timezone ?? defaults.timezone,
    status: 'draft',
    validUntil: '',
  }

  uploadedImages.value = copied.attachments?.images
    ? copied.attachments.images.map((image) => ({
        ...image,
        discordUrl: image.discordUrl ?? null,
      }))
    : []

  scheduleStore.clearCopiedSchedule()
}

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
      validUntil: formatLocalDateTimeInput(schedule.validUntil),
    }
    uploadedImages.value = schedule.attachments?.images
      ? schedule.attachments.images.map((image) => ({
          ...image,
          discordUrl: image.discordUrl ?? null,
        }))
      : []
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

  const attachmentImages = uploadedImages.value.map((image) => ({
    ...image,
    discordUrl: image.discordUrl ?? null,
  }))

  payload.attachments = attachmentImages.length ? { images: attachmentImages } : null

  if (form.value.validUntil) {
    const validUntilDate = new Date(form.value.validUntil)
    if (!Number.isNaN(validUntilDate.getTime())) {
      payload.validUntil = validUntilDate.toISOString()
    }
  }

  return payload
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []

  if (!files.length) return

  uploadError.value = null
  isUploading.value = true

  try {
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        const message = '僅支援 PNG、JPG、JPEG、GIF、WEBP 格式'
        uploadError.value = message
        alert(message)
        continue
      }

      if (file.size > MAX_IMAGE_SIZE) {
        const message = '圖片大小不可超過 5 MB'
        uploadError.value = message
        alert(message)
        continue
      }

      try {
        const uploaded = await storageApi.uploadImage(file)
        const image: ScheduleAttachmentImage = {
          imageId: uploaded.imageId,
          firebaseUrl: uploaded.publicUrl,
          filePath: uploaded.filePath,
          fileName: uploaded.fileName,
          fileSize: uploaded.fileSize,
          mimeType: uploaded.mimeType,
          uploadedAt: uploaded.uploadedAt,
          discordUrl: null,
        }

        uploadedImages.value.push(image)
      } catch (error: any) {
        console.error('Failed to upload image:', error)
        const message = error.response?.data?.message || '圖片上傳失敗'
        uploadError.value = message
        alert(message)
      }
    }
  } finally {
    if (input) {
      input.value = ''
    }
    isUploading.value = false
  }
}

async function removeImage(image: ScheduleAttachmentImage) {
  if (removingImageId.value) return

  removingImageId.value = image.imageId
  uploadError.value = null

  try {
    await storageApi.deleteImage(image.filePath)
    uploadedImages.value = uploadedImages.value.filter((item) => item.imageId !== image.imageId)
  } catch (error: any) {
    console.error('Failed to delete image:', error)
    const message = error.response?.data?.message || '刪除圖片失敗'
    uploadError.value = message
    alert(message)
  } finally {
    removingImageId.value = null
  }
}

// Handle form submission
async function handleSubmit() {
  if (!validateForm({ alertOnError: true })) return

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

const validateForm = ({ alertOnError = false } = {}) => {
  const fail = (message: string) => {
    if (alertOnError) {
      alert(message)
    }
    return false
  }

  if (form.value.title.trim() === '') {
    return fail('請輸入排程標題')
  }

  if (form.value.content.trim() === '') {
    return fail('請輸入訊息內容')
  }

  if (form.value.channelId === '') {
    return fail('請選擇要發送的 Discord 頻道')
  }

  if (form.value.scheduleType !== 'once') {
    if (!form.value.validUntil) {
      return fail('請設定排程的截止時間')
    }

    const validUntilDate = new Date(form.value.validUntil)
    if (Number.isNaN(validUntilDate.getTime())) {
      return fail('截止時間格式不正確，請重新選擇')
    }

    if (validUntilDate <= new Date()) {
      return fail('截止時間需晚於現在時間')
    }
  } else if (form.value.validUntil) {
    const validUntilDate = new Date(form.value.validUntil)
    if (Number.isNaN(validUntilDate.getTime())) {
      return fail('截止時間格式不正確，請重新選擇')
    }

    if (validUntilDate <= new Date()) {
      return fail('截止時間需晚於現在時間')
    }
  }

  return true
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
          class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
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
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-chat-left-text text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">訊息內容</h2>
            <p class="text-sm text-gray-600">設定要發送的訊息標題和內容</p>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
              排程標題 <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              maxlength="100"
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
              placeholder="例如：每週團隊會議提醒"
            />
            <p class="text-sm text-gray-500 mt-2">{{ form.title.length }} / 100 字元</p>
          </div>

          <div>
            <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
              訊息內容 <span class="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              v-model="form.content"
              required
              maxlength="2000"
              rows="6"
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none transition"
              placeholder="輸入要發送到 Discord 的訊息內容..."
            ></textarea>
            <p class="text-sm text-gray-500 mt-2">{{ form.content.length }} / 2000 字元</p>
          </div>

          <!-- Preview Card -->
          <div
            v-if="form.title || form.content"
            class="bg-gray-50 rounded-lg p-5 border border-gray-200"
          >
            <p class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <i class="bi bi-eye text-gray-600"></i>
              訊息預覽 (支援 Markdown)
            </p>
            <div class="bg-white rounded-md p-4 border border-gray-200">
              <h3 v-if="form.title" class="font-semibold text-gray-900 mb-2">{{ form.title }}</h3>
              <div
                v-if="form.content"
                class="markdown-preview text-gray-700"
                v-html="contentPreviewHtml"
              ></div>
              <p v-else class="text-gray-400 italic">訊息內容會顯示在這裡...</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> 圖片附件 </label>
            <div
              class="relative border border-dashed border-gray-300 rounded-lg p-5 text-center bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                class="absolute inset-0 opacity-0 cursor-pointer"
                @change="handleFileChange"
                :disabled="isUploading"
              />
              <div class="space-y-2 pointer-events-none">
                <i class="bi bi-cloud-arrow-up text-3xl text-gray-500"></i>
                <p class="font-medium text-gray-700">拖曳或點擊上傳圖片</p>
                <p class="text-sm text-gray-500">
                  支援 PNG / JPG / JPEG / GIF / WEBP，單檔上限 5 MB
                </p>
              </div>
            </div>
            <p v-if="isUploading" class="text-sm text-gray-600 mt-2 flex items-center gap-2">
              <i class="bi bi-hourglass-split"></i>
              圖片上傳中...
            </p>
            <p v-if="uploadError" class="text-sm text-red-600 mt-2 flex items-center gap-2">
              <i class="bi bi-exclamation-triangle-fill"></i>
              {{ uploadError }}
            </p>
            <div v-if="uploadedImages.length" class="mt-4 space-y-3">
              <div
                v-for="image in uploadedImages"
                :key="image.imageId"
                class="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-3"
              >
                <img
                  :src="image.firebaseUrl"
                  :alt="image.fileName"
                  class="w-16 h-16 object-cover rounded-md border"
                />
                <div class="flex-1 text-left">
                  <p class="text-sm font-medium text-gray-900">{{ image.fileName }}</p>
                  <p class="text-sm text-gray-500">
                    {{ formatFileSize(image.fileSize) }} · {{ image.mimeType }}
                  </p>
                </div>
                <button
                  type="button"
                  class="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="removeImage(image)"
                  :disabled="removingImageId === image.imageId"
                >
                  <i v-if="removingImageId === image.imageId" class="bi bi-hourglass-split"></i>
                  <i v-else class="bi bi-trash"></i>
                  {{ removingImageId === image.imageId ? '處理中...' : '移除' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 發送設定區塊 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-discord text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">發送設定</h2>
            <p class="text-sm text-gray-600">選擇 Discord 頻道和時區</p>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Discord 頻道 <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <button
                type="button"
                @click="isChannelDropdownOpen = !isChannelDropdownOpen"
                :class="[
                  'w-full flex items-center justify-between px-4 py-3 border rounded-md transition-colors',
                  isChannelDropdownOpen
                    ? 'border-gray-900 ring-2 ring-gray-900'
                    : selectedChannel
                      ? 'border-gray-900 bg-gray-100'
                      : 'border-gray-300 hover:border-gray-400',
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-md flex items-center justify-center',
                      selectedChannel ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500',
                    ]"
                  >
                    <i class="bi bi-hash text-lg"></i>
                  </div>
                  <div class="text-left">
                    <p v-if="selectedChannel" class="font-medium text-gray-900">
                      {{ selectedChannel.name }}
                    </p>
                    <p v-else class="text-gray-500">請選擇要發送的頻道</p>
                    <p v-if="selectedChannel?.topic" class="text-xs text-gray-500">
                      {{ selectedChannel.topic }}
                    </p>
                  </div>
                </div>
                <i
                  :class="[
                    'bi text-lg text-gray-500 transition-transform',
                    isChannelDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down',
                  ]"
                ></i>
              </button>

              <div
                v-if="isChannelDropdownOpen"
                class="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                <div class="p-3 border-b border-gray-200 bg-gray-50">
                  <div class="relative">
                    <i
                      class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    ></i>
                    <input
                      v-model="channelSearch"
                      type="text"
                      placeholder="搜尋頻道或分類..."
                      class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
                      @click.stop
                    />
                  </div>
                </div>

                <div class="max-h-72 overflow-y-auto">
                  <div
                    v-if="Object.keys(groupedChannels).length === 0"
                    class="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    找不到符合的頻道
                  </div>
                  <div v-else class="divide-y divide-gray-100">
                    <div
                      v-for="(channelList, category) in groupedChannels"
                      :key="category"
                      class="p-3"
                    >
                      <p class="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                        {{ category === '未分類' ? '未分類' : category }}
                      </p>
                      <div class="space-y-1">
                        <button
                          v-for="channel in channelList"
                          :key="channel.id"
                          type="button"
                          @click="selectChannel(channel.id)"
                          :class="[
                            'w-full px-3 py-2 rounded-md text-left flex items-center gap-3 transition-colors',
                            form.channelId === channel.id
                              ? 'bg-gray-100 text-gray-900'
                              : 'hover:bg-gray-50 text-gray-700',
                          ]"
                        >
                          <span class="text-sm font-medium">#{{ channel.name }}</span>
                          <span v-if="channel.topic" class="text-xs text-gray-500 truncate">
                            {{ channel.topic }}
                          </span>
                          <i
                            v-if="form.channelId === channel.id"
                            class="bi bi-check-circle-fill text-gray-900 ml-auto text-base"
                          ></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="timezone" class="block text-sm font-medium text-gray-700 mb-2">
                時區設定
              </label>
              <select
                id="timezone"
                v-model="form.timezone"
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer transition"
              >
                <option v-for="timezone in timezones" :key="timezone.value" :value="timezone.value">
                  {{ timezone.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">選擇狀態</label>
              <p class="text-sm text-gray-500">
                {{ selectedChannel ? `已選擇：#${selectedChannel.name}` : '尚未選擇頻道' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 排程時間區塊 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-calendar-event text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">排程時間</h2>
            <p class="text-sm text-gray-600">設定訊息的發送時間規則</p>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
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
                  'flex items-start gap-3 p-4 border rounded-md cursor-pointer transition-colors',
                  form.scheduleType === type.value
                    ? 'border-gray-900 bg-gray-100'
                    : 'border-gray-300 hover:border-gray-400',
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
                    'text-xl mt-1',
                    form.scheduleType === type.value ? 'text-gray-900' : 'text-gray-500',
                  ]"
                ></i>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ type.label }}</p>
                  <p class="text-xs text-gray-500">{{ type.desc }}</p>
                </div>
                <i
                  v-if="form.scheduleType === type.value"
                  class="bi bi-check-circle-fill text-gray-900 text-base"
                ></i>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-if="form.scheduleType === 'once'">
              <label for="scheduledDate" class="block text-sm font-medium text-gray-700 mb-2">
                執行日期 <span class="text-red-500">*</span>
              </label>
              <input
                id="scheduledDate"
                v-model="form.scheduledDate"
                type="date"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer transition"
              />
            </div>

            <div v-if="form.scheduleType === 'weekly'" class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                選擇星期 <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-7 gap-2">
                <label
                  v-for="day in weekDays"
                  :key="day.value"
                  :class="[
                    'flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-colors',
                    form.weekDay === day.value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700',
                  ]"
                >
                  <input
                    v-model.number="form.weekDay"
                    type="radio"
                    :value="day.value"
                    class="sr-only"
                  />
                  <span class="text-xs mb-1">{{ day.label }}</span>
                  <span class="text-lg font-semibold">{{ day.short }}</span>
                </label>
              </div>
            </div>

            <div v-if="form.scheduleType === 'monthly'">
              <label for="monthDay" class="block text-sm font-medium text-gray-700 mb-2">
                每月幾號 <span class="text-red-500">*</span>
              </label>
              <select
                id="monthDay"
                v-model.number="form.monthDay"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer transition"
              >
                <option v-for="day in 31" :key="day" :value="day">每月 {{ day }} 號</option>
              </select>
            </div>

            <div>
              <label for="scheduledTime" class="block text-sm font-medium text-gray-700 mb-2">
                執行時間 <span class="text-red-500">*</span>
              </label>
              <input
                id="scheduledTime"
                v-model="form.scheduledTime"
                type="time"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer transition"
              />
            </div>

            <div v-if="form.scheduleType !== 'once'" class="md:col-span-2">
              <label for="validUntil" class="block text-sm font-medium text-gray-700 mb-2">
                截止時間 <span class="text-red-500">*</span>
              </label>
              <input
                id="validUntil"
                v-model="form.validUntil"
                type="datetime-local"
                required
                step="60"
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer transition"
              />
              <p class="text-xs text-gray-500 mt-2">
                截止時間後排程將自動停用，請至少設定為未來的時間。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 排程狀態區塊 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-toggle-on text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">排程狀態</h2>
            <p class="text-sm text-gray-600">選擇排程的初始狀態</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            :class="[
              'flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors',
              form.status === 'draft'
                ? 'border-gray-900 bg-gray-100'
                : 'border-gray-300 hover:border-gray-400',
            ]"
          >
            <input v-model="form.status" type="radio" value="draft" class="sr-only" />
            <div
              :class="[
                'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
                form.status === 'draft' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500',
              ]"
            >
              <i class="bi bi-file-earmark-text text-lg"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">儲存為草稿</p>
              <p class="text-xs text-gray-500">稍後再手動啟用排程</p>
            </div>
            <i
              v-if="form.status === 'draft'"
              class="bi bi-check-circle-fill text-gray-900 text-base"
            ></i>
          </label>

          <label
            :class="[
              'flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors',
              form.status === 'active'
                ? 'border-gray-900 bg-gray-100'
                : 'border-gray-300 hover:border-gray-400',
            ]"
          >
            <input v-model="form.status" type="radio" value="active" class="sr-only" />
            <div
              :class="[
                'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
                form.status === 'active' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500',
              ]"
            >
              <i class="bi bi-play-circle-fill text-lg"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">立即啟用</p>
              <p class="text-xs text-gray-500">建立後立即開始自動發送</p>
            </div>
            <i
              v-if="form.status === 'active'"
              class="bi bi-check-circle-fill text-gray-900 text-base"
            ></i>
          </label>
        </div>
      </div>
    </form>

    <!-- Submit Actions - Full Width -->
    <div
      class="sticky bottom-0 left-0 right-0 -mb-6 -mx-6 bg-white border-t border-gray-200 shadow-md"
    >
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium cursor-pointer"
        >
          <i class="bi bi-x-circle mr-2"></i>
          取消
        </button>

        <button
          type="submit"
          form="schedule-form"
          :disabled="!validateForm() || isSubmitting"
          :class="[
            'px-5 py-2 rounded-md font-medium transition-colors ml-auto flex items-center justify-center gap-2',
            validateForm() && !isSubmitting
              ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          ]"
        >
          <i v-if="isSubmitting" class="bi bi-hourglass-split"></i>
          <i v-else class="bi bi-check-circle-fill"></i>
          <span>
            {{
              isSubmitting
                ? isEditMode
                  ? '更新中...'
                  : '建立中...'
                : isEditMode
                  ? '更新排程'
                  : '建立排程'
            }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-preview {
  line-height: 1.6;
}

.markdown-preview :deep(h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.75rem;
  color: #1f2937;
}

.markdown-preview :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 0.875rem;
  margin-bottom: 0.625rem;
  color: #374151;
}

.markdown-preview :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.markdown-preview :deep(h4) {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.625rem;
  margin-bottom: 0.5rem;
  color: #6b7280;
}

.markdown-preview :deep(p) {
  margin-bottom: 0.75rem;
}

.markdown-preview :deep(strong) {
  font-weight: 700;
  color: #1f2937;
}

.markdown-preview :deep(em) {
  font-style: italic;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-preview :deep(ul) {
  list-style-type: disc;
}

.markdown-preview :deep(ol) {
  list-style-type: decimal;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.375rem;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #6366f1;
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-preview :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  color: #dc2626;
}

.markdown-preview :deep(pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.markdown-preview :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.875rem;
}

.markdown-preview :deep(a) {
  color: #6366f1;
  text-decoration: underline;
}

.markdown-preview :deep(a:hover) {
  color: #4f46e5;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 1.5rem 0;
}
</style>
