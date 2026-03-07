<script setup lang="ts">
import { computed } from 'vue'
import type { Scenario } from '@/types/ai-generation'

interface Props {
  scenario: Scenario
  selectable?: boolean
  selected?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false,
  showActions: true,
})

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const thumbnailUrl = computed(() => {
  const firstImage = props.scenario.styleImages?.images?.[0]
  if (firstImage) {
    return firstImage.url
  }
  return null
})

const truncatedDescription = computed(() => {
  if (!props.scenario.description) return ''
  if (props.scenario.description.length > 60) {
    return props.scenario.description.slice(0, 60) + '...'
  }
  return props.scenario.description
})

const displayTags = computed(() => {
  return props.scenario.tags?.slice(0, 3) || []
})

const hasMoreTags = computed(() => {
  return (props.scenario.tags?.length || 0) > 3
})

const defaultSettingsLabel = computed(() => {
  const ds = props.scenario.defaultSettings
  if (!ds) return null
  const parts: string[] = []
  if (ds.aspectRatio) parts.push(ds.aspectRatio)
  if (ds.imageSize) parts.push(ds.imageSize)
  return parts.length > 0 ? parts.join(' / ') : null
})

function handleSelect() {
  if (props.selectable) {
    emit('select')
  }
}

function handleEdit(event: Event) {
  event.stopPropagation()
  emit('edit')
}

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete')
}
</script>

<template>
  <div
    class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md"
    :class="{
      'cursor-pointer hover:border-indigo-300': selectable,
      'ring-2 ring-indigo-500 border-indigo-500': selected,
    }"
    @click="handleSelect"
  >
    <!-- 縮圖 -->
    <div class="aspect-[4/3] bg-gray-100 relative border-b border-gray-100">
      <img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        :alt="scenario.name"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center text-gray-400"
      >
        <i class="bi-palette text-4xl"></i>
      </div>

      <!-- 公開/私人標籤 -->
      <div class="absolute top-2 left-2">
        <span
          class="px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm"
          :class="{
            'bg-green-100/90 text-green-700': scenario.isPublic,
            'bg-gray-100/90 text-gray-700': !scenario.isPublic,
          }"
        >
          {{ scenario.isPublic ? '公開' : '私人' }}
        </span>
      </div>

      <!-- 選中標記 -->
      <div
        v-if="selected"
        class="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
      >
        <i class="bi-check text-white"></i>
      </div>
    </div>

    <!-- 資訊區域 -->
    <div class="p-3 space-y-2">
      <h3 class="font-medium text-gray-900 truncate">
        {{ scenario.name }}
      </h3>

      <p v-if="truncatedDescription" class="text-sm text-gray-500">
        {{ truncatedDescription }}
      </p>

      <!-- 預設設定 -->
      <p v-if="defaultSettingsLabel" class="text-xs text-indigo-600">
        <i class="bi-gear mr-1"></i>{{ defaultSettingsLabel }}
      </p>

      <!-- 標籤 -->
      <div v-if="displayTags.length > 0" class="flex flex-wrap gap-1">
        <span
          v-for="tag in displayTags"
          :key="tag"
          class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
        >
          {{ tag }}
        </span>
        <span v-if="hasMoreTags" class="text-xs text-gray-400">
          +{{ scenario.tags!.length - 3 }}
        </span>
      </div>

      <!-- 操作按鈕 -->
      <div v-if="showActions" class="flex items-center gap-2 pt-2 border-t border-gray-200">
        <button
          type="button"
          class="flex-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
          @click="handleEdit"
        >
          <i class="bi-pencil mr-1"></i>
          編輯
        </button>
        <button
          type="button"
          class="flex-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
          @click="handleDelete"
        >
          <i class="bi-trash mr-1"></i>
          刪除
        </button>
      </div>
    </div>
  </div>
</template>
