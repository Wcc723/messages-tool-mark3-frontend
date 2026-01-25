<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationResult, GenerationHistory as GenerationHistoryType } from '@/types/ai-generation'
import GenerationResultComponent from './GenerationResult.vue'

interface Props {
  items: GenerationResult[] | GenerationHistoryType[]
  layout?: 'grid' | 'list'
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'grid',
  emptyMessage: '尚無生成記錄',
})

const emit = defineEmits<{
  (e: 'download', item: GenerationResult | GenerationHistoryType): void
  (e: 'preview', item: GenerationResult | GenerationHistoryType): void
}>()

const isEmpty = computed(() => props.items.length === 0)

const gridClass = computed(() => {
  if (props.layout === 'list') {
    return 'space-y-4'
  }
  return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
})

function handleDownload(item: GenerationResult | GenerationHistoryType) {
  emit('download', item)
}

function handlePreview(item: GenerationResult | GenerationHistoryType) {
  emit('preview', item)
}

function asGenerationResult(item: GenerationResult | GenerationHistoryType): GenerationResult {
  // GenerationHistory 包含 GenerationResult 的所有欄位
  return item as GenerationResult
}
</script>

<template>
  <div>
    <div v-if="isEmpty" class="text-center py-12">
      <i class="bi-images text-4xl text-gray-300"></i>
      <p class="mt-2 text-gray-500">{{ emptyMessage }}</p>
    </div>

    <div v-else :class="gridClass">
      <GenerationResultComponent
        v-for="(item, index) in items"
        :key="item.historyId || index"
        :result="asGenerationResult(item)"
        :show-details="layout === 'grid'"
        @download="handleDownload(item)"
        @preview="handlePreview(item)"
      />
    </div>
  </div>
</template>
