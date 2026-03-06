<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAiScenarioStore } from '@/stores/aiScenario'
import ScenarioCard from '@/components/ai/ScenarioCard.vue'
import type { Scenario } from '@/types/ai-generation'

const router = useRouter()
const aiScenarioStore = useAiScenarioStore()

const { scenarios, tags, pagination, isLoading, error } = storeToRefs(aiScenarioStore)

// 搜尋與篩選
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const showPublicOnly = ref<boolean | null>(null)
const currentPage = ref(1)

// 刪除確認
const deleteTarget = ref<Scenario | null>(null)
const isDeleting = ref(false)

const filteredScenarios = computed(() => {
  return scenarios.value || []
})

const visibilityOptions = [
  { value: null, label: '全部' },
  { value: true, label: '公開' },
  { value: false, label: '私人' },
]

async function loadScenarios() {
  await aiScenarioStore.fetchScenarios({
    page: currentPage.value,
    search: searchQuery.value || undefined,
    tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    isPublic: showPublicOnly.value ?? undefined,
  })
}

function handleSearch() {
  currentPage.value = 1
  loadScenarios()
}

function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
  currentPage.value = 1
  loadScenarios()
}

function setVisibility(value: boolean | null) {
  showPublicOnly.value = value
  currentPage.value = 1
  loadScenarios()
}

function handleCreate() {
  router.push({ name: 'ScenarioCreate' })
}

function handleEdit(scenario: Scenario) {
  router.push({ name: 'ScenarioEdit', params: { id: scenario.id } })
}

function confirmDelete(scenario: Scenario) {
  deleteTarget.value = scenario
}

function cancelDelete() {
  deleteTarget.value = null
}

async function executeDelete() {
  if (!deleteTarget.value) return

  isDeleting.value = true
  try {
    await aiScenarioStore.deleteScenario(deleteTarget.value.id)
    deleteTarget.value = null
  } finally {
    isDeleting.value = false
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page
    loadScenarios()
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 300)
})

onMounted(async () => {
  await Promise.all([
    loadScenarios(),
    aiScenarioStore.fetchTags(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">情境管理</h1>
        <p class="mt-1 text-gray-500">管理你的 AI 生成情境風格</p>
      </div>
      <button
        type="button"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        @click="handleCreate"
      >
        <i class="bi-plus-lg"></i>
        新增情境
      </button>
    </div>

    <!-- 錯誤訊息 -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
    >
      <i class="bi-exclamation-triangle text-red-500 text-lg"></i>
      <div class="flex-1">
        <p class="text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          @click="aiScenarioStore.clearError()"
        >
          關閉
        </button>
      </div>
    </div>

    <!-- 搜尋與篩選 -->
    <div class="bg-white border rounded-lg p-4 space-y-4">
      <div class="flex gap-4">
        <div class="flex-1 relative">
          <i class="bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋情境名稱或描述..."
            class="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        <div class="flex border rounded-lg overflow-hidden">
          <button
            v-for="option in visibilityOptions"
            :key="String(option.value)"
            type="button"
            class="px-4 py-2 text-sm transition-colors"
            :class="{
              'bg-indigo-600 text-white': showPublicOnly === option.value,
              'bg-white text-gray-700 hover:bg-gray-50': showPublicOnly !== option.value,
            }"
            @click="setVisibility(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
        <span class="text-sm text-gray-500 py-1">標籤：</span>
        <button
          v-for="tagItem in tags"
          :key="tagItem.tag"
          type="button"
          class="px-3 py-1 text-sm rounded-full transition-colors"
          :class="{
            'bg-indigo-600 text-white': selectedTags.includes(tagItem.tag),
            'bg-gray-100 text-gray-700 hover:bg-gray-200': !selectedTags.includes(tagItem.tag),
          }"
          @click="toggleTag(tagItem.tag)"
        >
          {{ tagItem.tag }} ({{ tagItem.count }})
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- 情境列表 -->
    <div v-else-if="filteredScenarios.length > 0">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <ScenarioCard
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          :scenario="scenario"
          @edit="handleEdit(scenario)"
          @delete="confirmDelete(scenario)"
        />
      </div>

      <!-- 分頁 -->
      <div
        v-if="pagination.totalPages > 1"
        class="flex items-center justify-center gap-2 mt-6"
      >
        <button
          type="button"
          :disabled="currentPage === 1"
          class="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          @click="goToPage(currentPage - 1)"
        >
          <i class="bi-chevron-left"></i>
        </button>

        <span class="px-4 py-2 text-gray-600">
          {{ currentPage }} / {{ pagination.totalPages }}
        </span>

        <button
          type="button"
          :disabled="currentPage === pagination.totalPages"
          class="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          @click="goToPage(currentPage + 1)"
        >
          <i class="bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else class="text-center py-12">
      <i class="bi-palette text-5xl text-gray-300"></i>
      <p class="mt-4 text-gray-500">尚無情境</p>
      <button
        type="button"
        class="mt-4 px-4 py-2 text-indigo-600 hover:text-indigo-800"
        @click="handleCreate"
      >
        建立第一個情境
      </button>
    </div>

    <!-- 刪除確認 Modal -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 class="text-lg font-semibold text-gray-900">確認刪除</h3>
          <p class="mt-2 text-gray-600">
            確定要刪除情境「{{ deleteTarget.name }}」嗎？此操作無法復原。
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              :disabled="isDeleting"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              @click="cancelDelete"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              @click="executeDelete"
            >
              <span v-if="isDeleting" class="animate-spin">
                <i class="bi-arrow-repeat"></i>
              </span>
              <span>{{ isDeleting ? '刪除中...' : '確認刪除' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
