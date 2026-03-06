<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type {
  Character,
  Scenario,
  SessionSettings,
  ReferenceImage,
  ObjectImage,
} from '@/types/ai-generation'

interface Props {
  disabled?: boolean
  isGenerating?: boolean
  allowEmpty?: boolean
  selectedCharacterId?: string
  selectedScenarioId?: string
  characters: Character[]
  scenarios: Scenario[]
  selectedCharacter: Character | null
  availableReferenceImages: (
    | (ReferenceImage & { type: 'character' })
    | (ObjectImage & { type: 'object'; description: string })
  )[]
  aspectRatio: SessionSettings['aspectRatio']
  imageSize: SessionSettings['imageSize']
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isGenerating: false,
  allowEmpty: false,
  selectedCharacterId: undefined,
  selectedScenarioId: undefined,
})

const emit = defineEmits<{
  (e: 'submit', payload: {
    prompt: string
    referenceImage?: { url: string; description?: string }
    settings: SessionSettings
  }): void
  (e: 'update:aspectRatio', value: SessionSettings['aspectRatio']): void
  (e: 'update:imageSize', value: SessionSettings['imageSize']): void
  (e: 'update:selectedCharacterId', value: string | undefined): void
  (e: 'update:selectedScenarioId', value: string | undefined): void
}>()

const prompt = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const selectedReferenceImage = ref<{ url: string; description?: string } | null>(null)
const showSettings = ref(false)
const showReferenceImages = ref(false)

const maxLength = 2000

const aspectRatioOptions = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const
const imageSizeOptions: { value: SessionSettings['imageSize']; label: string }[] = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
]

const isOverLimit = computed(() => prompt.value.length > maxLength)
const canSubmit = computed(() => {
  const hasContent = prompt.value.trim().length > 0 || props.allowEmpty
  return hasContent && !isOverLimit.value && !props.disabled && !props.isGenerating
})

// 清除參考圖片（當角色變更時）
watch(
  () => props.selectedCharacterId,
  () => {
    selectedReferenceImage.value = null
    showReferenceImages.value = false
  },
)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

watch(prompt, () => {
  nextTick(autoResize)
})

function handleSubmit() {
  if (!canSubmit.value) return

  emit('submit', {
    prompt: prompt.value.trim(),
    referenceImage: selectedReferenceImage.value ?? undefined,
    settings: {
      aspectRatio: props.aspectRatio,
      imageSize: props.imageSize,
    },
  })
  prompt.value = ''
  nextTick(autoResize)
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  }
}

function handleCharacterChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update:selectedCharacterId', value || undefined)
}

function handleScenarioChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update:selectedScenarioId', value || undefined)
}
</script>

<template>
  <div class="border-t bg-white px-4 py-3">
    <div class="max-w-3xl mx-auto space-y-2">
      <!-- 第一行：選項列 -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- 角色選擇 -->
        <select
          :value="selectedCharacterId ?? ''"
          class="text-xs border rounded-lg px-2 py-1.5 bg-white max-w-[140px]"
          @change="handleCharacterChange"
        >
          <option value="">角色 (無)</option>
          <option
            v-for="character in characters"
            :key="character.id"
            :value="character.id"
          >
            {{ character.name }}
          </option>
        </select>

        <!-- 情境選擇 -->
        <select
          :value="selectedScenarioId ?? ''"
          class="text-xs border rounded-lg px-2 py-1.5 bg-white max-w-[140px]"
          @change="handleScenarioChange"
        >
          <option value="">情境 (無)</option>
          <option
            v-for="scenario in scenarios"
            :key="scenario.id"
            :value="scenario.id"
          >
            {{ scenario.name }}
          </option>
        </select>

        <!-- 參考圖按鈕 -->
        <div v-if="selectedCharacter && availableReferenceImages.length > 0" class="relative">
          <button
            type="button"
            class="text-xs border rounded-lg px-2 py-1.5 hover:bg-gray-50 flex items-center gap-1"
            :class="{
              'border-indigo-500 bg-indigo-50 text-indigo-700': selectedReferenceImage,
            }"
            @click="showReferenceImages = !showReferenceImages"
          >
            <i class="bi-image"></i>
            {{ selectedReferenceImage ? '已選圖片' : '參考圖' }}
          </button>

          <!-- 參考圖 popover -->
          <div
            v-if="showReferenceImages"
            class="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-3 z-10 w-64"
          >
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="aspect-square border-2 rounded-lg flex items-center justify-center text-gray-400 text-xs"
                :class="{
                  'border-indigo-500 bg-indigo-50': !selectedReferenceImage,
                  'border-dashed': selectedReferenceImage,
                }"
                @click="selectedReferenceImage = null; showReferenceImages = false"
              >
                <i class="bi-x-lg"></i>
              </button>
              <button
                v-for="(img, index) in availableReferenceImages"
                :key="index"
                type="button"
                class="aspect-square border-2 rounded-lg overflow-hidden"
                :class="{
                  'border-indigo-500 ring-2 ring-indigo-200': selectedReferenceImage?.url === img.url,
                }"
                :title="img.description || ''"
                @click="selectedReferenceImage = img; showReferenceImages = false"
              >
                <img
                  :src="img.url"
                  :alt="img.description || '參考圖片'"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- 設定按鈕 -->
        <div class="relative">
          <button
            type="button"
            class="text-xs border rounded-lg px-2 py-1.5 hover:bg-gray-50 flex items-center gap-1"
            @click="showSettings = !showSettings"
          >
            <i class="bi-gear"></i>
            {{ aspectRatio }}, {{ imageSize }}
          </button>

          <!-- 設定 popover -->
          <div
            v-if="showSettings"
            class="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-3 z-10 w-56 space-y-3"
          >
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">比例</label>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="ratio in aspectRatioOptions"
                  :key="ratio"
                  type="button"
                  class="px-2 py-1 text-xs border rounded transition-colors"
                  :class="{
                    'border-indigo-500 bg-indigo-50 text-indigo-700': aspectRatio === ratio,
                    'hover:border-gray-300': aspectRatio !== ratio,
                  }"
                  @click="emit('update:aspectRatio', ratio)"
                >
                  {{ ratio }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">尺寸</label>
              <div class="flex gap-1">
                <button
                  v-for="size in imageSizeOptions"
                  :key="size.value"
                  type="button"
                  class="px-2 py-1 text-xs border rounded transition-colors"
                  :class="{
                    'border-indigo-500 bg-indigo-50 text-indigo-700': imageSize === size.value,
                    'hover:border-gray-300': imageSize !== size.value,
                  }"
                  @click="emit('update:imageSize', size.value)"
                >
                  {{ size.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <span class="text-xs text-gray-400 ml-auto hidden sm:inline">Ctrl+Enter 送出</span>
      </div>

      <!-- 第二行：輸入列 -->
      <div class="flex items-end gap-2">
        <div class="flex-1 relative">
          <textarea
            ref="textareaRef"
            v-model="prompt"
            :disabled="disabled || isGenerating"
            :placeholder="allowEmpty ? '圖片描述 (選填，已選擇情境)' : '描述你想要生成的圖片...'"
            rows="1"
            class="w-full px-3 py-2.5 border rounded-xl resize-none focus:outline-none focus:border-indigo-500 disabled:bg-gray-50 text-sm leading-relaxed"
            :class="{ 'border-red-400': isOverLimit }"
            @keydown="handleKeydown"
          ></textarea>
          <span
            v-if="prompt.length > maxLength * 0.8"
            class="absolute right-2 bottom-1.5 text-xs"
            :class="isOverLimit ? 'text-red-500' : 'text-gray-400'"
          >
            {{ prompt.length }}/{{ maxLength }}
          </span>
        </div>

        <button
          type="button"
          :disabled="!canSubmit"
          class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          :class="{
            'bg-indigo-600 text-white hover:bg-indigo-700': canSubmit,
            'bg-gray-200 text-gray-400 cursor-not-allowed': !canSubmit,
          }"
          @click="handleSubmit"
        >
          <svg
            v-if="isGenerating"
            class="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <i v-else class="bi-send"></i>
        </button>
      </div>
    </div>
  </div>
</template>
