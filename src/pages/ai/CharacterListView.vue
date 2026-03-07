<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAiCharacterStore } from '@/stores/aiCharacter'
import CharacterCard from '@/components/ai/CharacterCard.vue'
import type { Character } from '@/types/ai-generation'

const router = useRouter()
const aiCharacterStore = useAiCharacterStore()

const { characters, tags, pagination, isLoading, error } = storeToRefs(aiCharacterStore)

// 搜尋與篩選
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const showPublicOnly = ref<boolean | null>(null)
const currentPage = ref(1)

// 刪除確認
const deleteTarget = ref<Character | null>(null)
const isDeleting = ref(false)

// 篩選後的結果是透過 API 取得，這裡只做本地過濾展示
const filteredCharacters = computed(() => {
  return characters.value || []
})

// 可見性選項
const visibilityOptions = [
  { value: null, label: '全部' },
  { value: true, label: '公開' },
  { value: false, label: '私人' },
]

// 載入角色列表
async function loadCharacters() {
  await aiCharacterStore.fetchCharacters({
    page: currentPage.value,
    search: searchQuery.value || undefined,
    tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    isPublic: showPublicOnly.value ?? undefined,
  })
}

// 搜尋
function handleSearch() {
  currentPage.value = 1
  loadCharacters()
}

// 切換標籤
function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
  currentPage.value = 1
  loadCharacters()
}

// 切換可見性
function setVisibility(value: boolean | null) {
  showPublicOnly.value = value
  currentPage.value = 1
  loadCharacters()
}

// 新增角色
function handleCreate() {
  router.push({ name: 'CharacterCreate' })
}

// 編輯角色
function handleEdit(character: Character) {
  router.push({ name: 'CharacterEdit', params: { id: character.id } })
}

// 確認刪除
function confirmDelete(character: Character) {
  deleteTarget.value = character
}

// 取消刪除
function cancelDelete() {
  deleteTarget.value = null
}

// 執行刪除
async function executeDelete() {
  if (!deleteTarget.value) return

  isDeleting.value = true
  try {
    await aiCharacterStore.deleteCharacter(deleteTarget.value.id)
    deleteTarget.value = null
  } finally {
    isDeleting.value = false
  }
}

// 換頁
function goToPage(page: number) {
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page
    loadCharacters()
  }
}

// 監聽搜尋輸入 (debounce)
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
    loadCharacters(),
    aiCharacterStore.fetchTags(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
          <i class="bi bi-person-badge text-gray-600 text-lg"></i>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">角色管理</h1>
          <p class="text-gray-600">管理你的 AI 生成角色</p>
        </div>
      </div>
      <button
        type="button"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
        @click="handleCreate"
      >
        <i class="bi-plus-lg"></i>
        新增角色
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
          @click="aiCharacterStore.clearError()"
        >
          關閉
        </button>
      </div>
    </div>

    <!-- 搜尋與篩選 -->
    <div class="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <!-- 搜尋列 -->
      <div class="flex gap-4">
        <div class="flex-1 relative">
          <i class="bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋角色名稱或描述..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <!-- 可見性篩選 -->
        <div class="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            v-for="option in visibilityOptions"
            :key="String(option.value)"
            type="button"
            class="px-4 py-2 text-sm transition-colors cursor-pointer"
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

      <!-- 標籤篩選 -->
      <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
        <span class="text-sm text-gray-500 py-1">標籤：</span>
        <button
          v-for="tagItem in tags"
          :key="tagItem.tag"
          type="button"
          class="px-3 py-1 text-sm rounded-full transition-colors cursor-pointer"
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
      <i class="bi bi-arrow-repeat animate-spin text-2xl text-indigo-600"></i>
    </div>

    <!-- 角色列表 -->
    <div v-else-if="filteredCharacters.length > 0">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        <CharacterCard
          v-for="character in filteredCharacters"
          :key="character.id"
          :character="character"
          @edit="handleEdit(character)"
          @delete="confirmDelete(character)"
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
          class="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
          aria-label="上一頁"
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
          class="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
          aria-label="下一頁"
          @click="goToPage(currentPage + 1)"
        >
          <i class="bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else class="text-center py-12">
      <i class="bi-person-badge text-4xl text-gray-300"></i>
      <p class="mt-2 text-gray-500">尚無角色</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
        @click="handleCreate"
      >
        <i class="bi-plus-lg"></i>
        建立第一個角色
      </button>
    </div>

    <!-- 刪除確認 Modal -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">確認刪除</h3>
          </div>
          <div class="px-6 py-5">
            <p class="text-gray-600">
              確定要刪除角色「{{ deleteTarget.name }}」嗎？此操作無法復原。
            </p>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              :disabled="isDeleting"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              @click="cancelDelete"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              @click="executeDelete"
            >
              <i v-if="isDeleting" class="bi bi-arrow-repeat animate-spin"></i>
              <span>{{ isDeleting ? '刪除中...' : '確認刪除' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
