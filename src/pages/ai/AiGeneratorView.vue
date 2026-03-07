<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiGenerationStore } from '@/stores/aiGeneration'
import { useAiCharacterStore } from '@/stores/aiCharacter'
import { useAiScenarioStore } from '@/stores/aiScenario'
import { useAuthStore } from '@/stores/auth'
import ChatToolbar from '@/components/ai/chat/ChatToolbar.vue'
import ChatMessageList from '@/components/ai/chat/ChatMessageList.vue'
import ChatInput from '@/components/ai/chat/ChatInput.vue'
import ChatSidebar from '@/components/ai/chat/ChatSidebar.vue'
import { aiSessionsApi } from '@/services/api'
import type {
  AIModel,
  SessionSettings,
  GenerationResult,
  SessionItem,
  ChatMessageItem,
  ReferenceImage,
  ObjectImage,
} from '@/types/ai-generation'

const aiGenerationStore = useAiGenerationStore()
const aiCharacterStore = useAiCharacterStore()
const aiScenarioStore = useAiScenarioStore()
const authStore = useAuthStore()

const {
  connectionState,
  currentSession,
  generationHistory,
  isGenerating,
  error,
  isAuthenticated,
  hasActiveSession,
  sessionExpiresIn,
} = storeToRefs(aiGenerationStore)

const { characters } = storeToRefs(aiCharacterStore)
const { scenarios } = storeToRefs(aiScenarioStore)

// UI 狀態
const selectedModel = ref<AIModel>('nano-banana')
const previewImage = ref<GenerationResult | null>(null)
const selectedCharacterId = ref<string | undefined>(undefined)
const selectedScenarioId = ref<string | undefined>(undefined)
const aspectRatio = ref<SessionSettings['aspectRatio']>('1:1')
const imageSize = ref<SessionSettings['imageSize']>('1K')
const showMobileSidebar = ref(false)

// 選中的角色
const selectedCharacter = computed(() => {
  if (!selectedCharacterId.value) return null
  return characters.value.find((c) => c.id === selectedCharacterId.value) ?? null
})

// 選中的情境有描述時，prompt 非必要
const isPromptOptional = computed(() => {
  const scenario = selectedScenarioId.value
    ? scenarios.value.find((s) => s.id === selectedScenarioId.value)
    : null
  return !!scenario?.description
})

// 選中角色的所有參考圖片
const availableReferenceImages = computed(() => {
  if (!selectedCharacter.value?.referenceImages) return []
  const { images = [], objectImages = [] } = selectedCharacter.value.referenceImages
  return [
    ...images.map((img: ReferenceImage) => ({ ...img, type: 'character' as const })),
    ...objectImages.map((img: ObjectImage) => ({
      ...img,
      type: 'object' as const,
      description: img.name,
    })),
  ]
})

// 將 generationHistory 轉為 ChatMessageItem[]
const chatMessages = computed<ChatMessageItem[]>(() => {
  const messages: ChatMessageItem[] = []

  // generationHistory 是倒序（最新在前），需要反轉
  const items = [...generationHistory.value].reverse()

  for (const result of items) {
    // user 訊息
    if (result.prompt) {
      messages.push({
        id: `user-${result.historyId || result.generatedAt}`,
        type: 'user',
        prompt: result.prompt,
        timestamp: result.generatedAt,
      })
    }

    // assistant 訊息
    messages.push({
      id: `assistant-${result.historyId || result.generatedAt}`,
      type: 'assistant',
      result,
      timestamp: result.generatedAt,
    })
  }

  return messages
})

// 當 Session 進行中切換情境時，通知後端更新
watch(selectedScenarioId, (newId) => {
  if (hasActiveSession.value) {
    aiGenerationStore.updateSession({ scenarioId: newId ?? null })
  }
})

// 當 Session 進行中切換角色時，通知後端更新
watch(selectedCharacterId, (newId) => {
  if (hasActiveSession.value) {
    aiGenerationStore.updateSession({ characterId: newId ?? null })
  }
})

// 連線
function handleConnect() {
  if (authStore.token) {
    aiGenerationStore.connect(authStore.token)
  }
}

// 重新連線
function handleReconnect() {
  if (authStore.token) {
    aiGenerationStore.disconnect()
    aiGenerationStore.connect(authStore.token)
  }
}

// 生成圖片（自動管理 Session）
function handleGenerate(payload: {
  prompt: string
  referenceImage?: { url: string; description?: string }
  settings: SessionSettings
}) {
  const { prompt, referenceImage, settings } = payload

  // 有 prompt 或有選擇帶描述的情境時才能生成
  if (!prompt && !isPromptOptional.value) return

  if (hasActiveSession.value) {
    aiGenerationStore.generate(prompt, referenceImage, settings)
  } else {
    // 無 active session → 設定 pending 並自動建立 session
    aiGenerationStore.pendingGeneration = {
      prompt,
      referenceImage,
      settings,
    }
    aiGenerationStore.startSession(
      selectedModel.value,
      selectedCharacterId.value,
      selectedScenarioId.value,
      settings,
    )
  }
}

// 新對話
function handleNewChat() {
  if (hasActiveSession.value) {
    aiGenerationStore.endSession()
  }
  aiGenerationStore.clearHistory()
  showMobileSidebar.value = false
}

// 選擇歷史 Session
async function handleSessionSelect(session: SessionItem) {
  showMobileSidebar.value = false

  try {
    const detail = await aiSessionsApi.getSessionDetail(session.id)
    aiGenerationStore.loadHistoryFromSession(detail.data.history)

    if (session.status === 'active') {
      // active / expired 可恢復，透過 WebSocket resume
      aiGenerationStore.resumeSession(session.id)
    } else {
      // completed session 僅檢視歷史，不建立新 session
      // 結束目前的 active session（如有）
      if (hasActiveSession.value) {
        aiGenerationStore.endSession()
      }
    }

    // 帶入該 session 的設定，方便使用者以相同設定繼續生成
    selectedModel.value = session.model
    selectedCharacterId.value = session.characterId ?? undefined
    selectedScenarioId.value = session.scenarioId ?? undefined
    if (session.settings) {
      aspectRatio.value = session.settings.aspectRatio ?? '1:1'
      imageSize.value = session.settings.imageSize ?? '1K'
    }
  } catch (err) {
    console.error('恢復 Session 失敗:', err)
  }
}

// Session 被刪除
function handleSessionDeleted(sessionId: string) {
  if (currentSession.value?.id === sessionId) {
    aiGenerationStore.endSession()
    aiGenerationStore.clearHistory()
  }
}

// 下載圖片
function handleDownload(result: GenerationResult) {
  if (!result.imageUrl) return
  const link = document.createElement('a')
  link.href = result.imageUrl
  link.download = `ai-generated-${result.historyId || Date.now()}.png`
  link.click()
}

// 預覽圖片
function handlePreview(result: GenerationResult) {
  previewImage.value = result
}

function closePreview() {
  previewImage.value = null
}

onMounted(async () => {
  await Promise.all([
    aiCharacterStore.fetchCharacters({ limit: 50 }),
    aiScenarioStore.fetchScenarios({ limit: 50 }),
  ])
  handleConnect()
})
</script>

<template>
  <div class="flex h-[calc(100vh-48px)] -m-6">
    <!-- 側邊欄（桌面） -->
    <ChatSidebar
      class="w-72 border-r hidden md:flex flex-col"
      :current-session-id="currentSession?.id"
      @select="handleSessionSelect"
      @new-chat="handleNewChat"
      @delete="handleSessionDeleted"
    />

    <!-- 手機側邊欄 overlay -->
    <Teleport to="body">
      <div
        v-if="showMobileSidebar"
        class="fixed inset-0 z-50 md:hidden"
      >
        <div
          class="absolute inset-0 bg-black/50"
          @click="showMobileSidebar = false"
        ></div>
        <div class="absolute left-0 top-0 bottom-0 w-72">
          <ChatSidebar
            :current-session-id="currentSession?.id"
            @select="handleSessionSelect"
            @new-chat="handleNewChat"
            @delete="handleSessionDeleted"
          />
        </div>
      </div>
    </Teleport>

    <!-- 主要內容 -->
    <div class="flex-1 flex flex-col min-w-0 bg-gray-50">
      <ChatToolbar
        :connection-state="connectionState"
        :current-session="currentSession"
        :selected-model="selectedModel"
        :session-expires-in="sessionExpiresIn"
        @update:selected-model="selectedModel = $event"
        @reconnect="handleReconnect"
        @toggle-sidebar="showMobileSidebar = !showMobileSidebar"
      />

      <!-- 錯誤訊息 -->
      <div
        v-if="error"
        class="mx-4 mt-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm"
      >
        <i class="bi-exclamation-triangle text-red-500"></i>
        <span class="flex-1 text-red-700">{{ error }}</span>
        <button
          type="button"
          class="text-red-500 hover:text-red-700"
          @click="aiGenerationStore.clearError()"
        >
          <i class="bi-x-lg text-xs"></i>
        </button>
      </div>

      <ChatMessageList
        :messages="chatMessages"
        :is-generating="isGenerating"
        @preview="handlePreview"
        @download="handleDownload"
      />

      <ChatInput
        :disabled="!isAuthenticated"
        :is-generating="isGenerating"
        :allow-empty="isPromptOptional"
        :selected-character-id="selectedCharacterId"
        :selected-scenario-id="selectedScenarioId"
        :characters="characters"
        :scenarios="scenarios"
        :selected-character="selectedCharacter"
        :available-reference-images="availableReferenceImages"
        :aspect-ratio="aspectRatio"
        :image-size="imageSize"
        @submit="handleGenerate"
        @update:aspect-ratio="aspectRatio = $event"
        @update:image-size="imageSize = $event"
        @update:selected-character-id="selectedCharacterId = $event"
        @update:selected-scenario-id="selectedScenarioId = $event"
      />
    </div>

    <!-- 圖片預覽 Modal -->
    <Teleport to="body">
      <div
        v-if="previewImage"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        @click="closePreview"
      >
        <div class="relative max-w-4xl max-h-[90vh] m-4">
          <img
            v-if="previewImage.imageUrl"
            :src="previewImage.imageUrl"
            :alt="previewImage.prompt"
            class="max-w-full max-h-[90vh] object-contain rounded-lg"
            @click.stop
          />
          <button
            type="button"
            class="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow"
            @click="closePreview"
          >
            <i class="bi-x-lg"></i>
          </button>
          <div
            class="absolute bottom-4 left-4 right-4 p-4 bg-white/90 rounded-lg"
            @click.stop
          >
            <p class="text-gray-700">{{ previewImage.prompt }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
