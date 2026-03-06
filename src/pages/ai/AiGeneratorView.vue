<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiGenerationStore } from '@/stores/aiGeneration'
import { useAiCharacterStore } from '@/stores/aiCharacter'
import { useAiScenarioStore } from '@/stores/aiScenario'
import { useAuthStore } from '@/stores/auth'
import ConnectionStatus from '@/components/ai/ConnectionStatus.vue'
import PromptInput from '@/components/ai/PromptInput.vue'
import SessionInfo from '@/components/ai/SessionInfo.vue'
import GenerationHistory from '@/components/ai/GenerationHistory.vue'
import SessionSelectModal from '@/components/ai/SessionSelectModal.vue'
import { aiSessionsApi } from '@/services/api'
import type {
  AIModel,
  SessionSettings,
  GenerationResult,
  SessionItem,
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
} = storeToRefs(aiGenerationStore)

const { characters } = storeToRefs(aiCharacterStore)
const { scenarios } = storeToRefs(aiScenarioStore)

// UI 狀態
const prompt = ref('')
const selectedModel = ref<AIModel>('nano-banana')
const previewImage = ref<GenerationResult | null>(null)
const showSessionSelectModal = ref(false)

// 生成設定（每次生成時可調整）
const selectedCharacterId = ref<string | undefined>(undefined)
const selectedScenarioId = ref<string | undefined>(undefined)
const selectedReferenceImage = ref<{ url: string; description?: string } | null>(null)
const aspectRatio = ref<SessionSettings['aspectRatio']>('1:1')
const imageSize = ref<SessionSettings['imageSize']>('1K')
const showGenerationSettings = ref(false)


// 模型選項
const modelOptions: { value: AIModel; label: string; description: string }[] = [
  { value: 'nano-banana', label: 'Nano Banana', description: '快速生成，適合一般用途' },
  { value: 'nano-banana-pro', label: 'Nano Banana Pro', description: '高品質生成，較慢但效果更好' },
]

// 比例選項
const aspectRatioOptions = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const

// 尺寸選項（對應 AsyncAPI GenerationSettings.imageSize）
const imageSizeOptions: { value: SessionSettings['imageSize']; label: string }[] = [
  { value: '1K', label: '1K (標準)' },
  { value: '2K', label: '2K (高畫質)' },
]

// 選中的角色
const selectedCharacter = computed(() => {
  if (!selectedCharacterId.value) return null
  return characters.value.find((c) => c.id === selectedCharacterId.value) ?? null
})

// 選中的情境
const selectedScenario = computed(() => {
  if (!selectedScenarioId.value) return null
  return scenarios.value.find((s) => s.id === selectedScenarioId.value) ?? null
})

// 選中的情境有描述時，prompt 非必要
const isPromptOptional = computed(() => {
  return !!selectedScenario.value?.description
})

// 選中角色的所有參考圖片（合併角色圖片和物件圖片）
const availableReferenceImages = computed(() => {
  if (!selectedCharacter.value?.referenceImages) return []
  const { images = [], objectImages = [] } = selectedCharacter.value.referenceImages
  return [
    ...images.map((img: ReferenceImage) => ({ ...img, type: 'character' as const })),
    ...objectImages.map((img: ObjectImage) => ({ ...img, type: 'object' as const, description: img.name })),
  ]
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

// 開始 Session
function handleStartSession() {
  aiGenerationStore.startSession(selectedModel.value, undefined, undefined)
}

// 結束 Session
function handleEndSession() {
  aiGenerationStore.endSession()
}

// 重新建立 Session（過期後一鍵重啟）
function handleRestartSession() {
  const model = currentSession.value?.model ?? selectedModel.value
  aiGenerationStore.endSession()
  aiGenerationStore.startSession(model)
}

// 刪除 Session
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

async function handleDeleteSession() {
  const sessionId = currentSession.value?.id
  if (!sessionId) return

  showDeleteConfirm.value = true
}

async function confirmDeleteSession(keepHistory: boolean) {
  const sessionId = currentSession.value?.id
  if (!sessionId) return

  showDeleteConfirm.value = false
  isDeleting.value = true

  try {
    await aiSessionsApi.deleteSession(sessionId, keepHistory)
    aiGenerationStore.endSession()
  } catch (err) {
    console.error('刪除 Session 失敗:', err)
  } finally {
    isDeleting.value = false
  }
}

// 處理 Session 選擇（從彈窗選擇恢復的對話）
async function handleSessionSelect(session: SessionItem) {
  showSessionSelectModal.value = false

  if (session.status === 'active') {
    // Active Session：直接恢復
    aiGenerationStore.resumeSession(session.id)
  } else {
    // Completed Session：取得歷史後建立新 Session
    try {
      const detail = await aiSessionsApi.getSessionDetail(session.id)

      // 1. 載入歷史對話到 UI
      aiGenerationStore.loadHistoryFromSession(detail.data.history)

      // 2. 使用相同設定建立新 Session
      aiGenerationStore.startSession(
        session.model,
        session.characterId ?? undefined,
        session.scenarioId ?? undefined,
        session.settings
      )
    } catch (err) {
      console.error('恢復 Session 失敗:', err)
    }
  }
}

// 處理 Session 被刪除（從選擇彈窗中刪除）
function handleSessionDeleted(sessionId: string) {
  if (currentSession.value?.id === sessionId) {
    aiGenerationStore.endSession()
  }
}

// 生成圖片
function handleGenerate() {
  const trimmedPrompt = prompt.value.trim()

  // 有 prompt 或有選擇帶描述的情境時才能生成
  if (!trimmedPrompt && !isPromptOptional.value) return

  // 準備參考圖片（如果有選擇）
  const referenceImage = selectedReferenceImage.value
    ? {
        url: selectedReferenceImage.value.url,
        description: selectedReferenceImage.value.description,
      }
    : undefined

  // 準備設定
  const settings: SessionSettings = {
    aspectRatio: aspectRatio.value,
    imageSize: imageSize.value,
  }

  aiGenerationStore.generate(trimmedPrompt, referenceImage, settings)
  prompt.value = ''
}

// 下載圖片
function handleDownload(result: GenerationResult | { imageUrl?: string; historyId?: string }) {
  if (!result.imageUrl) return

  const link = document.createElement('a')
  link.href = result.imageUrl
  link.download = `ai-generated-${result.historyId || Date.now()}.png`
  link.click()
}

// 預覽圖片
function handlePreview(result: GenerationResult | { imageUrl?: string; prompt?: string }) {
  previewImage.value = result as GenerationResult
}

// 關閉預覽
function closePreview() {
  previewImage.value = null
}

onMounted(async () => {
  // 載入角色和情境列表
  await Promise.all([
    aiCharacterStore.fetchCharacters({ limit: 50 }),
    aiScenarioStore.fetchScenarios({ limit: 50 }),
  ])

  // 自動連線
  handleConnect()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">AI 圖片生成</h1>
        <p class="mt-1 text-gray-500">使用 AI 生成獨特的圖片</p>
      </div>
      <ConnectionStatus
        :state="connectionState"
        @reconnect="handleReconnect"
      />
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
          @click="aiGenerationStore.clearError()"
        >
          關閉
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左側：設定與控制 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Session 控制 -->
        <div class="bg-white border rounded-lg p-4 space-y-4">
          <h2 class="font-semibold text-gray-900">Session 設定</h2>

          <template v-if="!hasActiveSession">
            <!-- 模型選擇 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                選擇模型
              </label>
              <div class="space-y-2">
                <label
                  v-for="model in modelOptions"
                  :key="model.value"
                  class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                  :class="{
                    'border-indigo-500 bg-indigo-50': selectedModel === model.value,
                    'hover:border-gray-300': selectedModel !== model.value,
                  }"
                >
                  <input
                    v-model="selectedModel"
                    type="radio"
                    :value="model.value"
                    class="mt-1"
                  />
                  <div>
                    <p class="font-medium text-gray-900">{{ model.label }}</p>
                    <p class="text-sm text-gray-500">{{ model.description }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- 開始按鈕 -->
            <button
              type="button"
              :disabled="!isAuthenticated"
              class="w-full py-2.5 rounded-lg font-medium transition-colors"
              :class="{
                'bg-indigo-600 text-white hover:bg-indigo-700': isAuthenticated,
                'bg-gray-200 text-gray-400 cursor-not-allowed': !isAuthenticated,
              }"
              @click="handleStartSession"
            >
              開始 Session
            </button>

            <!-- 恢復過去對話連結 -->
            <div class="text-center mt-3">
              <button
                type="button"
                class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                :disabled="!isAuthenticated"
                @click="showSessionSelectModal = true"
              >
                或 恢復過去對話
              </button>
            </div>
          </template>

          <!-- Session 資訊 -->
          <SessionInfo
            v-else
            :session="currentSession"
            @end="handleEndSession"
            @restart="handleRestartSession"
            @delete="handleDeleteSession"
          />
        </div>
      </div>

      <!-- 右側：生成區域 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Prompt 輸入 -->
        <div class="bg-white border rounded-lg p-4">
          <h2 class="font-semibold text-gray-900 mb-4">圖片描述</h2>
          <PromptInput
            v-model="prompt"
            :disabled="!hasActiveSession"
            :is-generating="isGenerating"
            :allow-empty="isPromptOptional"
            :placeholder="isPromptOptional ? '圖片描述 (選填，已選擇情境)' : '描述你想要生成的圖片，例如：一隻可愛的貓咪在陽光下睡覺'"
            @submit="handleGenerate"
          />

          <!-- 生成設定（Prompt 下方） -->
          <div class="mt-4 pt-4 border-t space-y-4">
            <!-- 設定切換 -->
            <button
              type="button"
              class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              @click="showGenerationSettings = !showGenerationSettings"
            >
              <i :class="showGenerationSettings ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
              生成設定
              <span class="text-gray-400 ml-1">
                ({{ aspectRatio }}, {{ imageSize }}{{ selectedCharacter ? `, ${selectedCharacter.name}` : '' }}{{ selectedScenarioId ? ', 情境' : '' }})
              </span>
            </button>

            <template v-if="showGenerationSettings">
              <!-- 圖片比例 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  圖片比例
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="ratio in aspectRatioOptions"
                    :key="ratio"
                    type="button"
                    class="px-3 py-1.5 text-sm border rounded-lg transition-colors"
                    :class="{
                      'border-indigo-500 bg-indigo-50 text-indigo-700': aspectRatio === ratio,
                      'hover:border-gray-300': aspectRatio !== ratio,
                    }"
                    @click="aspectRatio = ratio"
                  >
                    {{ ratio }}
                  </button>
                </div>
              </div>

              <!-- 圖片尺寸 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  圖片尺寸
                </label>
                <div class="flex gap-2">
                  <button
                    v-for="size in imageSizeOptions"
                    :key="size.value"
                    type="button"
                    class="px-3 py-1.5 text-sm border rounded-lg transition-colors"
                    :class="{
                      'border-indigo-500 bg-indigo-50 text-indigo-700': imageSize === size.value,
                      'hover:border-gray-300': imageSize !== size.value,
                    }"
                    @click="imageSize = size.value"
                  >
                    {{ size.label }}
                  </button>
                </div>
              </div>

              <!-- 角色選擇 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  參考角色 (選填)
                </label>
                <select
                  v-model="selectedCharacterId"
                  class="w-full border rounded-lg px-3 py-2"
                  @change="selectedReferenceImage = null"
                >
                  <option :value="undefined">不使用角色</option>
                  <option
                    v-for="character in characters"
                    :key="character.id"
                    :value="character.id"
                  >
                    {{ character.name }}
                  </option>
                </select>
              </div>

              <!-- 情境選擇 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  參考情境 (選填)
                </label>
                <select
                  v-model="selectedScenarioId"
                  class="w-full border rounded-lg px-3 py-2"
                >
                  <option :value="undefined">不使用情境</option>
                  <option
                    v-for="scenario in scenarios"
                    :key="scenario.id"
                    :value="scenario.id"
                  >
                    {{ scenario.name }}
                  </option>
                </select>
              </div>

              <!-- 參考圖片選擇（當選擇角色後顯示） -->
              <div v-if="selectedCharacter && availableReferenceImages.length > 0">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  參考圖片 (選填)
                </label>
                <div class="grid grid-cols-4 gap-2">
                  <!-- 不使用圖片選項 -->
                  <button
                    type="button"
                    class="aspect-square border-2 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-300 transition-colors"
                    :class="{
                      'border-indigo-500 bg-indigo-50': !selectedReferenceImage,
                      'border-dashed': selectedReferenceImage,
                    }"
                    @click="selectedReferenceImage = null"
                  >
                    <i class="bi-x-lg text-lg"></i>
                  </button>
                  <!-- 參考圖片列表 -->
                  <button
                    v-for="(img, index) in availableReferenceImages"
                    :key="index"
                    type="button"
                    class="aspect-square border-2 rounded-lg overflow-hidden transition-colors"
                    :class="{
                      'border-indigo-500 ring-2 ring-indigo-200': selectedReferenceImage?.url === img.url,
                      'hover:border-gray-300': selectedReferenceImage?.url !== img.url,
                    }"
                    :title="img.description || ''"
                    @click="selectedReferenceImage = img"
                  >
                    <img
                      :src="img.url"
                      :alt="img.description || '參考圖片'"
                      class="w-full h-full object-cover"
                    />
                  </button>
                </div>
                <p v-if="selectedReferenceImage" class="mt-2 text-sm text-gray-500">
                  已選擇：{{ selectedReferenceImage.description || '參考圖片' }}
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- 生成歷史 -->
        <div class="bg-white border rounded-lg p-4">
          <h2 class="font-semibold text-gray-900 mb-4">生成結果</h2>
          <GenerationHistory
            :items="generationHistory"
            empty-message="開始生成你的第一張圖片吧！"
            @download="handleDownload"
            @preview="handlePreview"
          />
        </div>
      </div>
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

    <!-- Session 選擇彈窗 -->
    <SessionSelectModal
      v-model="showSessionSelectModal"
      @select="handleSessionSelect"
      @deleted="handleSessionDeleted"
    />

    <!-- 刪除確認彈窗 -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click="showDeleteConfirm = false"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6 space-y-4"
          @click.stop
        >
          <h3 class="text-lg font-semibold text-gray-900">刪除 Session</h3>
          <p class="text-sm text-gray-600">
            確定要刪除此 Session 嗎？你可以選擇是否保留生成記錄。
          </p>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              :disabled="isDeleting"
              class="w-full py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              @click="confirmDeleteSession(false)"
            >
              刪除 Session 及所有記錄
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              class="w-full py-2 rounded-lg font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
              @click="confirmDeleteSession(true)"
            >
              刪除 Session，保留記錄
            </button>
            <button
              type="button"
              class="w-full py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors text-sm"
              @click="showDeleteConfirm = false"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
