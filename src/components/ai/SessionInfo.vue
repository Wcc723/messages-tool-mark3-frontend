<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationSession } from '@/types/ai-generation'

interface Props {
  session: GenerationSession | null
  expiresIn?: string | null
  isExpiringSoon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expiresIn: null,
  isExpiringSoon: false,
})

const emit = defineEmits<{
  (e: 'end'): void
}>()

const modelDisplayName = computed(() => {
  if (!props.session) return ''
  switch (props.session.model) {
    case 'nano-banana':
      return 'Nano Banana'
    case 'nano-banana-pro':
      return 'Nano Banana Pro'
    default:
      return props.session.model
  }
})

const aspectRatioDisplay = computed(() => {
  if (!props.session?.settings?.aspectRatio) return '1:1'
  return props.session.settings.aspectRatio
})

const imageSizeDisplay = computed(() => {
  if (!props.session?.settings?.imageSize) return '1K'
  switch (props.session.settings.imageSize) {
    case '1K':
      return '1K (標準)'
    case '2K':
      return '2K (高畫質)'
    default:
      return props.session.settings.imageSize
  }
})

const statusBadge = computed(() => {
  if (!props.session) return null
  switch (props.session.status) {
    case 'active':
      return { text: '進行中', class: 'bg-green-100 text-green-700' }
    case 'completed':
      return { text: '已完成', class: 'bg-gray-100 text-gray-700' }
    case 'expired':
      return { text: '已過期', class: 'bg-red-100 text-red-700' }
    default:
      return null
  }
})

function handleEnd() {
  emit('end')
}
</script>

<template>
  <div v-if="session" class="bg-white border rounded-lg p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-gray-900">Session 資訊</h3>
      <span
        v-if="statusBadge"
        class="px-2 py-0.5 rounded-full text-xs font-medium"
        :class="statusBadge.class"
      >
        {{ statusBadge.text }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3 text-sm">
      <div>
        <span class="text-gray-500">模型</span>
        <p class="font-medium text-gray-900">{{ modelDisplayName }}</p>
      </div>

      <div>
        <span class="text-gray-500">比例</span>
        <p class="font-medium text-gray-900">{{ aspectRatioDisplay }}</p>
      </div>

      <div>
        <span class="text-gray-500">尺寸</span>
        <p class="font-medium text-gray-900">{{ imageSizeDisplay }}</p>
      </div>

      <div v-if="session.characterId">
        <span class="text-gray-500">角色</span>
        <p class="font-medium text-gray-900">
          {{ session.characterName || session.characterId }}
        </p>
      </div>
    </div>

    <div
      v-if="expiresIn"
      class="flex items-center gap-2 text-sm"
      :class="{ 'text-red-600': isExpiringSoon, 'text-gray-600': !isExpiringSoon }"
    >
      <i class="bi-clock"></i>
      <span>剩餘時間: {{ expiresIn }}</span>
      <span v-if="isExpiringSoon" class="text-red-500 font-medium">(即將過期)</span>
    </div>

    <div class="pt-2 border-t">
      <button
        type="button"
        class="text-sm text-red-600 hover:text-red-800"
        @click="handleEnd"
      >
        結束 Session
      </button>
    </div>
  </div>

  <div v-else class="bg-gray-50 border border-dashed rounded-lg p-4 text-center text-gray-500">
    尚未建立 Session
  </div>
</template>
