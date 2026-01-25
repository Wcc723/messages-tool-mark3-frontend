<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReferenceImageAngle, CharacterImageType } from '@/types/ai-generation'

interface Props {
  type: CharacterImageType
  disabled?: boolean
  maxFiles?: number
  currentCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxFiles: 5,
  currentCount: 0,
})

const emit = defineEmits<{
  (e: 'upload', file: File, metadata: { angle?: ReferenceImageAngle; description?: string; name?: string }): void
}>()

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const angle = ref<ReferenceImageAngle>('front')
const description = ref('')
const objectName = ref('')

const canUpload = computed(() => {
  return !props.disabled && props.currentCount < props.maxFiles
})

const remainingSlots = computed(() => {
  return props.maxFiles - props.currentCount
})

const angleOptions: { value: ReferenceImageAngle; label: string }[] = [
  { value: 'front', label: '正面' },
  { value: 'side', label: '側面' },
  { value: 'back', label: '背面' },
  { value: 'detail', label: '細節' },
]

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
  // 重置 input 以允許選擇相同檔案
  target.value = ''
}

function handleFile(file: File) {
  // 驗證檔案類型
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    alert('請上傳 JPG、PNG 或 WebP 格式的圖片')
    return
  }

  // 驗證檔案大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('圖片大小不可超過 10MB')
    return
  }

  selectedFile.value = file

  // 建立預覽
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function handleUpload() {
  if (!selectedFile.value) return

  const metadata: { angle?: ReferenceImageAngle; description?: string; name?: string } = {}

  if (props.type === 'character') {
    metadata.angle = angle.value
    if (description.value.trim()) {
      metadata.description = description.value.trim()
    }
  } else {
    if (objectName.value.trim()) {
      metadata.name = objectName.value.trim()
    }
  }

  emit('upload', selectedFile.value, metadata)
  clearSelection()
}

function clearSelection() {
  selectedFile.value = null
  previewUrl.value = null
  angle.value = 'front'
  description.value = ''
  objectName.value = ''
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
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleFileSelect"
            />
          </label>
        </p>
        <p class="mt-1 text-xs text-gray-500">
          支援 JPG、PNG、WebP，最大 10MB
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

          <!-- 角色圖片設定 -->
          <template v-if="type === 'character'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                角度
              </label>
              <select
                v-model="angle"
                class="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option
                  v-for="option in angleOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                描述 (選填)
              </label>
              <input
                v-model="description"
                type="text"
                placeholder="例如：微笑表情"
                class="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </template>

          <!-- 物件圖片設定 -->
          <template v-else>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                物件名稱
              </label>
              <input
                v-model="objectName"
                type="text"
                placeholder="例如：魔法杖"
                class="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </template>
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
