<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionState } from '@/types/ai-generation'

interface Props {
  state: ConnectionState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'reconnect'): void
}>()

const statusConfig = computed(() => {
  switch (props.state) {
    case 'authenticated':
      return {
        color: 'bg-emerald-500',
        text: '已連線',
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        showReconnect: false,
      }
    case 'connected':
      return {
        color: 'bg-yellow-500',
        text: '連線中...',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        showReconnect: false,
      }
    case 'connecting':
      return {
        color: 'bg-yellow-500',
        text: '連線中...',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        showReconnect: false,
      }
    case 'disconnected':
    default:
      return {
        color: 'bg-red-500',
        text: '未連線',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        showReconnect: true,
      }
  }
})

function handleReconnect() {
  emit('reconnect')
}
</script>

<template>
  <div
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
    :class="statusConfig.bgColor"
  >
    <span class="relative flex h-2.5 w-2.5">
      <span
        v-if="state === 'connecting' || state === 'connected'"
        class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        :class="statusConfig.color"
      ></span>
      <span
        class="relative inline-flex rounded-full h-2.5 w-2.5"
        :class="statusConfig.color"
      ></span>
    </span>
    <span class="text-sm font-medium" :class="statusConfig.textColor">
      {{ statusConfig.text }}
    </span>
    <button
      v-if="statusConfig.showReconnect"
      type="button"
      class="ml-1 px-2 py-0.5 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition cursor-pointer"
      @click="handleReconnect"
    >
      重新連線
    </button>
  </div>
</template>
