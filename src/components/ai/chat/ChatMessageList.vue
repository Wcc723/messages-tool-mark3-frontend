<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ChatMessage from './ChatMessage.vue'
import type { ChatMessageItem, GenerationResult } from '@/types/ai-generation'

interface Props {
  messages: ChatMessageItem[]
  isGenerating: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'preview', result: GenerationResult): void
  (e: 'download', result: GenerationResult): void
}>()

const containerRef = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
}

watch(
  () => props.messages.length,
  () => scrollToBottom(),
)

watch(
  () => props.isGenerating,
  (val) => {
    if (val) scrollToBottom()
  },
)
</script>

<template>
  <div ref="containerRef" class="overflow-y-auto flex-1 p-4 bg-gray-50">
    <!-- 空狀態 -->
    <div
      v-if="messages.length === 0 && !isGenerating"
      class="flex flex-col items-center justify-center h-full"
    >
      <div class="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <i class="bi-chat-square-text text-3xl text-indigo-400"></i>
      </div>
      <p class="text-lg font-semibold text-gray-900">開始你的第一次對話</p>
      <p class="text-sm text-gray-500 mt-1">輸入描述，AI 會為你生成圖片</p>
    </div>

    <!-- 訊息列表 -->
    <div v-else class="space-y-4 max-w-3xl mx-auto">
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :type="msg.type"
        :prompt="msg.prompt"
        :result="msg.result"
        :system-message="msg.systemMessage"
        @preview="emit('preview', $event)"
        @download="emit('download', $event)"
      />

      <!-- 生成中 loading -->
      <ChatMessage
        v-if="isGenerating"
        type="assistant"
        :is-generating="true"
      />
    </div>
  </div>
</template>
