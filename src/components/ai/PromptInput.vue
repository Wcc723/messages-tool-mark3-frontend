<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string
  disabled?: boolean
  isGenerating?: boolean
  allowEmpty?: boolean
  maxLength?: number
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isGenerating: false,
  allowEmpty: false,
  maxLength: 2000,
  placeholder: '描述你想要生成的圖片...',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()

const isFocused = ref(false)

const charCount = computed(() => props.modelValue.length)
const isOverLimit = computed(() => charCount.value > props.maxLength)
const canSubmit = computed(() => {
  const hasContent = props.modelValue.trim().length > 0 || props.allowEmpty
  return hasContent && !isOverLimit.value && !props.disabled && !props.isGenerating
})

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function handleSubmit() {
  if (canSubmit.value) {
    emit('submit')
  }
}

function handleKeydown(event: KeyboardEvent) {
  // Ctrl/Cmd + Enter 送出
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="space-y-2">
    <div
      class="relative rounded-lg border-2 transition-colors"
      :class="{
        'border-indigo-500': isFocused && !isOverLimit,
        'border-red-500': isOverLimit,
        'border-gray-200': !isFocused && !isOverLimit,
        'opacity-50': disabled,
      }"
    >
      <textarea
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled || isGenerating"
        rows="4"
        class="w-full px-4 py-3 rounded-lg resize-none focus:outline-none disabled:bg-gray-50"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown="handleKeydown"
      ></textarea>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="text-sm"
          :class="{
            'text-red-500': isOverLimit,
            'text-gray-500': !isOverLimit,
          }"
        >
          {{ charCount }} / {{ maxLength }}
        </span>
        <span v-if="isOverLimit" class="text-sm text-red-500">
          超過字數限制
        </span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">
          Ctrl + Enter 送出
        </span>
        <button
          type="button"
          :disabled="!canSubmit"
          class="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
          <span>{{ isGenerating ? '生成中...' : '生成圖片' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
