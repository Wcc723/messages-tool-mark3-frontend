<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationResult } from '@/types/ai-generation'

interface Props {
  type: 'user' | 'assistant' | 'system'
  prompt?: string
  result?: GenerationResult
  isGenerating?: boolean
  systemMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  prompt: undefined,
  result: undefined,
  isGenerating: false,
  systemMessage: undefined,
})

const emit = defineEmits<{
  (e: 'preview', result: GenerationResult): void
  (e: 'download', result: GenerationResult): void
}>()

const statusBadge = computed(() => {
  if (!props.result) return null
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
  if (!props.result?.generatedAt) return ''
  const date = new Date(props.result.generatedAt)
  return date.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

function handlePreview() {
  if (props.result?.imageUrl) {
    emit('preview', props.result)
  }
}

function handleDownload() {
  if (props.result) {
    emit('download', props.result)
  }
}
</script>

<template>
  <!-- System message -->
  <div v-if="type === 'system'" class="flex justify-center py-2">
    <span class="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
      {{ systemMessage }}
    </span>
  </div>

  <!-- User message -->
  <div v-else-if="type === 'user'" class="flex justify-end">
    <div class="max-w-[70%] bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-sm">
      <p class="text-sm whitespace-pre-wrap">{{ prompt }}</p>
    </div>
  </div>

  <!-- Assistant message -->
  <div v-else-if="type === 'assistant'" class="flex justify-start">
    <div class="max-w-[70%] space-y-2">
      <!-- 生成中骨架動畫 -->
      <div
        v-if="isGenerating"
        class="bg-gray-100 rounded-2xl rounded-bl-sm p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          <div class="space-y-2 flex-1">
            <div class="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2">生成中...</p>
      </div>

      <!-- 生成結果 -->
      <div
        v-else-if="result"
        class="bg-gray-100 rounded-2xl rounded-bl-sm overflow-hidden"
      >
        <!-- 圖片 -->
        <div v-if="result.imageUrl" class="relative">
          <img
            :src="result.imageUrl"
            :alt="result.prompt"
            class="w-full max-w-sm rounded-t-2xl cursor-pointer hover:opacity-90 transition-opacity"
            @click="handlePreview"
          />
          <!-- 操作按鈕 -->
          <div class="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              class="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow text-xs"
              title="下載圖片"
              @click.stop="handleDownload"
            >
              <i class="bi-download text-gray-700"></i>
            </button>
          </div>
        </div>

        <!-- 無圖片（失敗/過濾） -->
        <div
          v-else
          class="flex items-center justify-center py-8 px-4 text-gray-400"
        >
          <div class="text-center">
            <i class="bi-image text-3xl"></i>
            <p v-if="result.status === 'filtered'" class="mt-2 text-sm text-yellow-600">
              內容已過濾
            </p>
            <p v-else-if="result.status === 'failed'" class="mt-2 text-sm text-red-600">
              生成失敗
            </p>
          </div>
        </div>

        <!-- 底部資訊 -->
        <div class="px-3 py-2 space-y-1">
          <div class="flex items-center gap-2">
            <span
              v-if="statusBadge"
              class="px-1.5 py-0.5 rounded text-xs font-medium"
              :class="statusBadge.class"
            >
              {{ statusBadge.text }}
            </span>
            <span class="text-xs text-gray-400">{{ formattedDate }}</span>
          </div>

          <p
            v-if="result.errorMessage && result.status === 'filtered'"
            class="text-xs text-yellow-600"
          >
            {{ result.errorMessage }}
          </p>
          <p
            v-else-if="result.errorMessage"
            class="text-xs text-red-600"
          >
            {{ result.errorMessage }}
          </p>
          <p
            v-if="result.text"
            class="text-xs text-blue-600"
          >
            {{ result.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
