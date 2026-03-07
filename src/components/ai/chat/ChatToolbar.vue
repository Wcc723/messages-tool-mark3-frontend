<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ConnectionStatus from '@/components/ai/ConnectionStatus.vue'
import type { AIModel, ConnectionState, GenerationSession } from '@/types/ai-generation'

interface Props {
  connectionState: ConnectionState
  currentSession: GenerationSession | null
  selectedModel: AIModel
  sessionExpiresIn: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedModel', value: AIModel): void
  (e: 'reconnect'): void
  (e: 'toggle-sidebar'): void
}>()

const modelOptions: { value: AIModel; label: string }[] = [
  { value: 'nano-banana', label: 'Nano Banana' },
  { value: 'nano-banana-pro', label: 'NB Pro' },
]

// 倒計時
const displayTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  if (!props.currentSession?.expiresAt) {
    displayTime.value = ''
    return
  }
  const remaining = new Date(props.currentSession.expiresAt).getTime() - Date.now()
  if (remaining <= 0) {
    displayTime.value = '已過期'
    return
  }
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  displayTime.value = `${minutes}:${String(seconds).padStart(2, '0')}`
}

const sessionStatusText = computed(() => {
  if (!props.currentSession) return ''
  if (props.currentSession.status === 'expired') return '已過期'
  return displayTime.value ? `剩餘 ${displayTime.value}` : ''
})

onMounted(() => {
  timer = setInterval(updateCountdown, 1000)
  updateCountdown()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white h-12">
    <!-- 手機版側邊欄切換 -->
    <button
      type="button"
      class="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
      aria-label="開啟側邊欄"
      @click="emit('toggle-sidebar')"
    >
      <i class="bi-list text-lg text-gray-600"></i>
    </button>

    <!-- 連線狀態 -->
    <ConnectionStatus
      :state="connectionState"
      @reconnect="emit('reconnect')"
    />

    <!-- 模型切換 -->
    <select
      :value="selectedModel"
      class="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      @change="emit('update:selectedModel', ($event.target as HTMLSelectElement).value as AIModel)"
    >
      <option
        v-for="model in modelOptions"
        :key="model.value"
        :value="model.value"
      >
        {{ model.label }}
      </option>
    </select>

    <div class="flex-1"></div>

    <!-- Session 狀態 -->
    <span
      v-if="currentSession"
      class="text-xs font-medium"
      :class="{
        'text-emerald-600': currentSession.status === 'active',
        'text-red-600': currentSession.status === 'expired',
      }"
    >
      <i class="bi-circle-fill text-[6px] mr-1"></i>
      {{ sessionStatusText }}
    </span>
  </div>
</template>
