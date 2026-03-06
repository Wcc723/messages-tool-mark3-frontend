<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  disabled?: boolean
  maxFiles?: number
  currentCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxFiles: 3,
  currentCount: 0,
})

const emit = defineEmits<{
  (e: 'upload', file: File, metadata: { description?: string }): void
}>()

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const description = ref('')

const canUpload = computed(() => {
  return !props.disabled && props.currentCount < props.maxFiles
})

const remainingSlots = computed(() => {
  return props.maxFiles - props.currentCount
})

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (canUpload.value) {
    isDragging.value = true
  }
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (!canUpload.value) return

  const files = event.dataTransfer?.files
  const firstFile = files?.[0]
  if (firstFile) {
    handleFile(firstFile)
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  const firstFile = files?.[0]
  if (firstFile) {
    handleFile(firstFile)
  }
  target.value = ''
}

function handleFile(file: File) {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    alert('請上傳 JPG、PNG、GIF 或 WebP 格式的圖片')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    alert('圖片大小不可超過 10MB')
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function handleUpload() {
  if (!selectedFile.value) return

  const metadata: { description?: string } = {}
  if (description.value.trim()) {
    metadata.description = description.value.trim()
  }

  emit('upload', selectedFile.value, metadata)
  clearSelection()
}

function clearSelection() {
  selectedFile.value = null
  previewUrl.value = null
  description.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <!-- 拖放區域 -->
    <div
      v-if="!selectedFile"
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
      :class="{
        'border-indigo-400 bg-indigo-50': isDragging,
        'border-gray-300 hover:border-gray-400': !isDragging && canUpload,
        'border-gray-200 bg-gray-50 cursor-not-allowed': !canUpload,
      }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div v-if="canUpload">
        <i class="bi-cloud-upload text-4xl text-gray-400"></i>
        <p class="mt-2 text-gray-600">
          拖放圖片到這裡，或
          <label class="text-indigo-600 hover:text-indigo-800 cursor-pointer">
            點擊選擇
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="hidden"
              @change="handleFileSelect"
            />
          </label>
        </p>
        <p class="mt-1 text-xs text-gray-500">
          支援 JPG、PNG、GIF、WebP，最大 10MB
        </p>
        <p class="mt-1 text-xs text-gray-500">
          還可上傳 {{ remainingSlots }} 張
        </p>
      </div>
      <div v-else class="text-gray-400">
        <i class="bi-x-circle text-4xl"></i>
        <p class="mt-2">已達上傳上限 ({{ maxFiles }} 張)</p>
      </div>
    </div>

    <!-- 預覽與設定 -->
    <div v-if="selectedFile" class="border rounded-lg p-4 space-y-4">
      <div class="flex gap-4">
        <!-- 圖片預覽 -->
        <div class="w-32 h-32 flex-shrink-0">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt="預覽"
            class="w-full h-full object-cover rounded-lg"
          />
        </div>

        <!-- 設定欄位 -->
        <div class="flex-1 space-y-3">
          <p class="text-sm text-gray-600 truncate">
            {{ selectedFile.name }}
          </p>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              描述 (選填)
            </label>
            <input
              v-model="description"
              type="text"
              placeholder="例如：水彩風格、日系動漫風"
              class="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          @click="clearSelection"
        >
          取消
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="handleUpload"
        >
          上傳
        </button>
      </div>
    </div>
  </div>
</template>
