<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationResult } from '@/types/ai-generation'

interface Props {
  result: GenerationResult
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
})

const emit = defineEmits<{
  (e: 'download'): void
  (e: 'preview'): void
}>()

const statusBadge = computed(() => {
  // 優先使用 status，若無則根據 success 判斷
  const status = props.result.status || (props.result.success ? 'success' : 'failed')
  switch (status) {
    case 'success':
      return { text: '成功', class: 'bg-green-100 text-green-700' }
    case 'failed':
      return { text: '失敗', class: 'bg-red-100 text-red-700' }
    case 'filtered':
      return { text: '已過濾', class: 'bg-yellow-100 text-yellow-700' }
    default:
      return null
  }
})

const formattedDate = computed(() => {
  const date = new Date(props.result.generatedAt)
  return date.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const totalTokens = computed(() => {
  const input = props.result.inputTokens || 0
  const output = props.result.outputTokens || 0
  return input + output
})

function handleDownload() {
  if (props.result.imageUrl) {
    emit('download')
  }
}

function handlePreview() {
  if (props.result.imageUrl) {
    emit('preview')
  }
}
</script>

<template>
  <div class="bg-white border rounded-lg overflow-hidden">
    <!-- 圖片區域 -->
    <div class="relative aspect-square bg-gray-100">
      <img
        v-if="result.imageUrl"
        :src="result.imageUrl"
        :alt="result.prompt"
        class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
        @click="handlePreview"
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center text-gray-400"
      >
        <div class="text-center">
          <i class="bi-image text-4xl"></i>
          <p v-if="result.status === 'filtered'" class="mt-2 text-sm">
            內容已過濾
          </p>
          <p v-else-if="result.status === 'failed'" class="mt-2 text-sm">
            生成失敗
          </p>
        </div>
      </div>

      <!-- 狀態標籤 -->
      <div class="absolute top-2 right-2">
        <span
          v-if="statusBadge"
          class="px-2 py-0.5 rounded text-xs font-medium"
          :class="statusBadge.class"
        >
          {{ statusBadge.text }}
        </span>
      </div>

      <!-- 操作按鈕 -->
      <div
        v-if="result.imageUrl"
        class="absolute bottom-2 right-2 flex gap-2"
      >
        <button
          type="button"
          class="p-2 bg-white/90 hover:bg-white rounded-lg shadow transition-colors"
          title="下載圖片"
          @click="handleDownload"
        >
          <i class="bi-download text-gray-700"></i>
        </button>
      </div>
    </div>

    <!-- 資訊區域 -->
    <div v-if="showDetails" class="p-3 space-y-2">
      <p class="text-sm text-gray-700 line-clamp-2">
        {{ result.prompt }}
      </p>

      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>{{ formattedDate }}</span>
        <span v-if="totalTokens > 0">
          {{ totalTokens }} tokens
        </span>
      </div>

      <p
        v-if="result.errorMessage && result.status === 'filtered'"
        class="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded"
      >
        {{ result.errorMessage }}
      </p>

      <p
        v-else-if="result.errorMessage"
        class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded"
      >
        {{ result.errorMessage }}
      </p>

      <p
        v-if="result.text"
        class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"
      >
        {{ result.text }}
      </p>
    </div>
  </div>
</template>
