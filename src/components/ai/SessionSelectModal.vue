<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { aiSessionsApi } from '@/services/api'
import type { SessionItem, SessionStatus } from '@/types/ai-generation'

interface SessionItemWithImage extends SessionItem {
  lastImage?: string | null
}

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', session: SessionItem): void
  (e: 'deleted', sessionId: string): void
}>()

// 狀態
const sessions = ref<SessionItemWithImage[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const error = ref<string | null>(null)

// 計算屬性
const hasNoSessions = computed(() => !isLoading.value && sessions.value.length === 0)

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `今天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `昨天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else {
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }
}

// 取得模型顯示名稱
function getModelDisplayName(model: string): string {
  switch (model) {
    case 'nano-banana':
      return 'Nano Banana'
    case 'nano-banana-pro':
      return 'Nano Banana Pro'
    default:
      return model
  }
}

// 取得狀態顯示
function getStatusDisplay(status: SessionStatus): { text: string; class: string } {
  switch (status) {
    case 'active':
      return { text: '進行中', class: 'bg-green-100 text-green-700' }
    case 'completed':
      return { text: '已完成', class: 'bg-gray-100 text-gray-600' }
    case 'expired':
      return { text: '已過期', class: 'bg-red-100 text-red-600' }
    default:
      return { text: status, class: 'bg-gray-100 text-gray-600' }
  }
}

// 載入 Sessions
async function fetchSessions() {
  isLoading.value = true
  error.value = null

  try {
    // 取得 active 和 completed 狀態的 Sessions
    const [activeResult, completedResult] = await Promise.all([
      aiSessionsApi.getSessions({ status: 'active', page: currentPage.value, limit: 10 }),
      aiSessionsApi.getSessions({ status: 'completed', page: currentPage.value, limit: 10 }),
    ])

    // 合併並排序（依建立時間降序）
    const allSessions = [...activeResult.data, ...completedResult.data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // 為每個 Session 取得最後一張圖片
    const sessionsWithImages = await enrichSessionsWithImages(allSessions)
    sessions.value = sessionsWithImages

    // 計算總頁數
    totalPages.value = Math.max(
      activeResult.pagination.totalPages,
      completedResult.pagination.totalPages,
      1
    )
  } catch (err) {
    console.error('載入 Sessions 失敗:', err)
    error.value = '載入失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 取得每個 Session 的最後一張圖片
async function enrichSessionsWithImages(
  sessionList: SessionItem[]
): Promise<SessionItemWithImage[]> {
  const enriched = await Promise.all(
    sessionList.map(async (session) => {
      if (session.generationCount > 0) {
        try {
          const history = await aiSessionsApi.getGenerationHistory({
            sessionId: session.id,
            status: 'success',
            limit: 1,
          })
          return {
            ...session,
            lastImage: history.data[0]?.generatedImageUrl ?? null,
          }
        } catch {
          return { ...session, lastImage: null }
        }
      }
      return { ...session, lastImage: null }
    })
  )
  return enriched
}

// 選擇 Session
function handleSelect(session: SessionItem) {
  emit('select', session)
  close()
}

// 關閉彈窗
function close() {
  emit('update:modelValue', false)
}

// 刪除 Session
const deletingSessionId = ref<string | null>(null)
const confirmDeleteId = ref<string | null>(null)

function showDeleteConfirm(sessionId: string) {
  confirmDeleteId.value = sessionId
}

function cancelDelete() {
  confirmDeleteId.value = null
}

async function handleDelete(sessionId: string, keepHistory: boolean) {
  confirmDeleteId.value = null
  deletingSessionId.value = sessionId

  try {
    await aiSessionsApi.deleteSession(sessionId, keepHistory)
    sessions.value = sessions.value.filter((s) => s.id !== sessionId)
    emit('deleted', sessionId)
  } catch (err) {
    console.error('刪除 Session 失敗:', err)
  } finally {
    deletingSessionId.value = null
  }
}

// 監聽彈窗開啟
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      currentPage.value = 1
      fetchSessions()
    }
  }
)

// 監聽分頁變化
watch(currentPage, () => {
  if (props.modelValue) {
    fetchSessions()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold text-gray-900">選擇要恢復的對話</h2>
          <button
            type="button"
            class="p-1 hover:bg-gray-100 rounded transition-colors"
            @click="close"
          >
            <i class="bi-x-lg text-gray-500"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Loading -->
          <div v-if="isLoading" class="text-center py-12 text-gray-500">
            <i class="bi-arrow-repeat animate-spin text-2xl"></i>
            <p class="mt-2">載入中...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="text-center py-12">
            <i class="bi-exclamation-triangle text-2xl text-red-500"></i>
            <p class="mt-2 text-red-600">{{ error }}</p>
            <button
              type="button"
              class="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              @click="fetchSessions"
            >
              重試
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="hasNoSessions" class="text-center py-12 text-gray-500">
            <i class="bi-chat-square-text text-4xl"></i>
            <p class="mt-2">目前沒有可恢復的對話</p>
          </div>

          <!-- Session List -->
          <div v-else class="space-y-3">
            <div
              v-for="session in sessions"
              :key="session.id"
              class="border rounded-lg transition-colors"
              :class="{ 'opacity-50': deletingSessionId === session.id }"
            >
              <!-- 正常顯示 -->
              <div
                v-if="confirmDeleteId !== session.id"
                class="flex items-center gap-4 p-3"
              >
                <button
                  type="button"
                  class="flex items-center gap-4 flex-1 min-w-0 text-left hover:bg-indigo-50 -m-3 p-3 rounded-lg transition-colors"
                  :disabled="deletingSessionId === session.id"
                  @click="handleSelect(session)"
                >
                  <!-- 縮圖 -->
                  <div
                    class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <img
                      v-if="session.lastImage"
                      :src="session.lastImage"
                      :alt="`Session ${session.id}`"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-gray-400"
                    >
                      <i class="bi-image text-2xl"></i>
                    </div>
                  </div>

                  <!-- 資訊 -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">
                        {{ getModelDisplayName(session.model) }}
                      </span>
                      <span
                        class="text-xs px-2 py-0.5 rounded-full"
                        :class="getStatusDisplay(session.status).class"
                      >
                        {{ getStatusDisplay(session.status).text }}
                      </span>
                    </div>
                    <p v-if="session.character" class="text-sm text-gray-600 truncate">
                      角色：{{ session.character.name }}
                    </p>
                    <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>
                        <i class="bi-images"></i>
                        {{ session.generationCount }} 張
                      </span>
                      <span>{{ formatDate(session.createdAt) }}</span>
                    </div>
                  </div>

                  <i class="bi-chevron-right text-gray-400"></i>
                </button>

                <!-- 刪除按鈕 -->
                <button
                  type="button"
                  class="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title="刪除 Session"
                  :disabled="deletingSessionId === session.id"
                  @click.stop="showDeleteConfirm(session.id)"
                >
                  <i class="bi-trash"></i>
                </button>
              </div>

              <!-- 刪除確認 -->
              <div v-else class="p-3 space-y-2">
                <p class="text-sm text-gray-700">
                  確定要刪除此 Session？
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="flex-1 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    @click="handleDelete(session.id, false)"
                  >
                    刪除全部
                  </button>
                  <button
                    type="button"
                    class="flex-1 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                    @click="handleDelete(session.id, true)"
                  >
                    保留記錄
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    @click="cancelDelete"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="!isLoading && !error && totalPages > 1"
          class="p-4 border-t flex justify-center items-center gap-2"
        >
          <button
            type="button"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 text-sm border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            @click="currentPage--"
          >
            <i class="bi-chevron-left"></i>
            上一頁
          </button>
          <span class="px-3 py-1.5 text-sm text-gray-600">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 text-sm border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            @click="currentPage++"
          >
            下一頁
            <i class="bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
