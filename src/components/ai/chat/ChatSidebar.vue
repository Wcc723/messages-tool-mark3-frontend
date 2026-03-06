<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiSessionsApi } from '@/services/api'
import type { SessionItem, SessionStatus } from '@/types/ai-generation'

interface SessionItemWithImage extends SessionItem {
  lastImage?: string | null
}

interface Props {
  currentSessionId?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', session: SessionItem): void
  (e: 'new-chat'): void
  (e: 'delete', sessionId: string, keepHistory: boolean): void
}>()

const sessions = ref<SessionItemWithImage[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const confirmDeleteId = ref<string | null>(null)
const deletingSessionId = ref<string | null>(null)

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `今天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  }
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

function getModelDisplayName(model: string): string {
  switch (model) {
    case 'nano-banana':
      return 'NB'
    case 'nano-banana-pro':
      return 'NB Pro'
    default:
      return model
  }
}

function getStatusBadge(status: SessionStatus): { text: string; class: string } {
  switch (status) {
    case 'active':
      return { text: '進行中', class: 'bg-green-100 text-green-700' }
    case 'completed':
      return { text: '完成', class: 'bg-gray-100 text-gray-600' }
    case 'expired':
      return { text: '過期', class: 'bg-red-100 text-red-600' }
    default:
      return { text: status, class: 'bg-gray-100 text-gray-600' }
  }
}

async function fetchSessions() {
  isLoading.value = true
  try {
    const [activeResult, completedResult] = await Promise.all([
      aiSessionsApi.getSessions({ status: 'active', page: currentPage.value, limit: 10 }),
      aiSessionsApi.getSessions({ status: 'completed', page: currentPage.value, limit: 10 }),
    ])

    const allSessions = [...activeResult.data, ...completedResult.data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    // 取得縮圖
    const enriched = await Promise.all(
      allSessions.map(async (session) => {
        if (session.generationCount > 0) {
          try {
            const history = await aiSessionsApi.getGenerationHistory({
              sessionId: session.id,
              status: 'success',
              limit: 1,
            })
            return { ...session, lastImage: history.data[0]?.generatedImageUrl ?? null }
          } catch {
            return { ...session, lastImage: null }
          }
        }
        return { ...session, lastImage: null }
      }),
    )

    sessions.value = enriched
    totalPages.value = Math.max(
      activeResult.pagination.totalPages,
      completedResult.pagination.totalPages,
      1,
    )
  } catch (err) {
    console.error('載入 Sessions 失敗:', err)
  } finally {
    isLoading.value = false
  }
}

async function handleDelete(sessionId: string, keepHistory: boolean) {
  confirmDeleteId.value = null
  deletingSessionId.value = sessionId
  try {
    await aiSessionsApi.deleteSession(sessionId, keepHistory)
    sessions.value = sessions.value.filter((s) => s.id !== sessionId)
    emit('delete', sessionId, keepHistory)
  } catch (err) {
    console.error('刪除 Session 失敗:', err)
  } finally {
    deletingSessionId.value = null
  }
}

function loadMore() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchSessions()
  }
}

onMounted(() => {
  fetchSessions()
})
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- 標題 -->
    <div class="p-4 border-b bg-white">
      <h2 class="font-semibold text-gray-900 text-sm">歷史對話</h2>
    </div>

    <!-- 新對話按鈕 -->
    <div class="p-3">
      <button
        type="button"
        class="w-full py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5"
        @click="emit('new-chat')"
      >
        <i class="bi-plus-lg"></i>
        新對話
      </button>
    </div>

    <!-- Session 列表 -->
    <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-8 text-gray-400">
        <i class="bi-arrow-repeat animate-spin text-xl"></i>
      </div>

      <!-- Empty -->
      <div v-else-if="sessions.length === 0" class="text-center py-8 text-gray-400 text-sm">
        尚無歷史對話
      </div>

      <!-- Items -->
      <template v-else>
        <div
          v-for="session in sessions"
          :key="session.id"
          class="group relative"
        >
          <!-- 刪除確認 -->
          <div
            v-if="confirmDeleteId === session.id"
            class="bg-white border rounded-lg p-2.5 space-y-2"
          >
            <p class="text-xs text-gray-600">確定刪除？</p>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="flex-1 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                @click="handleDelete(session.id, false)"
              >
                全部刪除
              </button>
              <button
                type="button"
                class="flex-1 py-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded transition-colors"
                @click="handleDelete(session.id, true)"
              >
                保留記錄
              </button>
              <button
                type="button"
                class="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
                @click="confirmDeleteId = null"
              >
                取消
              </button>
            </div>
          </div>

          <!-- 正常顯示 -->
          <button
            v-else
            type="button"
            class="w-full text-left p-2.5 rounded-lg transition-colors flex items-center gap-2.5"
            :class="{
              'bg-indigo-50 border border-indigo-200': currentSessionId === session.id,
              'hover:bg-white': currentSessionId !== session.id,
              'opacity-50': deletingSessionId === session.id,
            }"
            @click="emit('select', session)"
          >
            <!-- 縮圖 -->
            <div class="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <img
                v-if="session.lastImage"
                :src="session.lastImage"
                alt=""
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <i class="bi-image text-sm"></i>
              </div>
            </div>

            <!-- 資訊 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-medium text-gray-800 truncate">
                  {{ getModelDisplayName(session.model) }}
                </span>
                <span
                  class="text-[10px] px-1 py-0.5 rounded"
                  :class="getStatusBadge(session.status).class"
                >
                  {{ getStatusBadge(session.status).text }}
                </span>
              </div>
              <p v-if="session.character" class="text-xs text-gray-500 truncate">
                {{ session.character.name }}
              </p>
              <div class="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                <span>{{ session.generationCount }} 張</span>
                <span>{{ formatDate(session.createdAt) }}</span>
              </div>
            </div>

            <!-- 刪除按鈕 -->
            <button
              type="button"
              class="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
              title="刪除"
              @click.stop="confirmDeleteId = session.id"
            >
              <i class="bi-trash text-xs"></i>
            </button>
          </button>
        </div>

        <!-- 載入更多 -->
        <button
          v-if="currentPage < totalPages"
          type="button"
          class="w-full py-2 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
          @click="loadMore"
        >
          載入更多...
        </button>
      </template>
    </div>
  </div>
</template>
