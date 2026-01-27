<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationResult } from '@/types/ai-generation'
import GenerationResultComponent from './GenerationResult.vue'

interface Props {
  items: GenerationResult[]
  layout?: 'grid' | 'list'
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'grid',
  emptyMessage: '尚無生成記錄',
})

const emit = defineEmits<{
  (e: 'download', item: GenerationResult): void
  (e: 'preview', item: GenerationResult): void
}>()

const isEmpty = computed(() => props.items.length === 0)

const gridClass = computed(() => {
  if (props.layout === 'list') {
    return 'space-y-4'
  }
  return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
})

function handleDownload(item: GenerationResult) {
  emit('download', item)
}

function handlePreview(item: GenerationResult) {
  emit('preview', item)
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
        :result="item"
        :show-details="layout === 'grid'"
        @download="handleDownload(item)"
        @preview="handlePreview(item)"
      />
    </div>
  </div>
</template>
