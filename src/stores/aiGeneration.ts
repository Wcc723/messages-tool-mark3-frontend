import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  ImageGenerationSocket,
  imageGenerationSocket,
} from '@/services/imageGenerationSocket'
import type {
  AIModel,
  ConnectionState,
  SessionSettings,
  GenerationSession,
  GenerationResult,
  AuthenticatedUser,
  SessionCreatedEvent,
  SessionResumedEvent,
  SessionUpdatedEvent,
  GeneratedEvent,
  WSError,
  GenerationHistoryItem,
} from '@/types/ai-generation'

interface PendingGeneration {
  prompt: string
  referenceImage?: { url: string; description?: string }
  settings?: SessionSettings
}

export const useAiGenerationStore = defineStore('aiGeneration', () => {
  // ============================================
  // State
  // ============================================

  const socket = ref<ImageGenerationSocket>(imageGenerationSocket)
  const connectionState = ref<ConnectionState>('disconnected')
  const authenticatedUser = ref<AuthenticatedUser | null>(null)
  const currentSession = ref<GenerationSession | null>(null)
  const generationHistory = ref<GenerationResult[]>([])
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  const lastError = ref<WSError | null>(null)
  const pendingGeneration = ref<PendingGeneration | null>(null)

  // ============================================
  // Getters
  // ============================================

  const isConnected = computed(() => {
    return connectionState.value === 'connected' || connectionState.value === 'authenticated'
  })

  const isAuthenticated = computed(() => {
    return connectionState.value === 'authenticated'
  })

  const hasActiveSession = computed(() => {
    return currentSession.value !== null && currentSession.value.status === 'active'
  })

  const sessionExpiresIn = computed(() => {
    if (!currentSession.value?.expiresAt) return null
    const expiresAt = new Date(currentSession.value.expiresAt).getTime()
    const now = Date.now()
    return Math.max(0, expiresAt - now)
  })

  // ============================================
  // 連線管理
  // ============================================

  /**
   * 連線到 WebSocket 伺服器
   * 如果已經連線或已認證，僅同步狀態並確保 handlers 已設定，不重複連線
   */
  function connect(token: string) {
    // 確保事件處理器始終是最新的
    setupEventHandlers()

    // 如果 socket 已連線/已認證，同步 Store 狀態即可
    if (socket.value.isAuthenticated()) {
      connectionState.value = 'authenticated'
      return
    }
    if (socket.value.isConnected()) {
      connectionState.value = 'connected'
      return
    }

    error.value = null
    lastError.value = null
    connectionState.value = 'connecting'
    socket.value.connect(token)
  }

  /**
   * 設定 WebSocket 事件處理器
   */
  function setupEventHandlers() {
    socket.value.setEventHandlers({
      onConnected: () => {
        connectionState.value = 'connected'
      },
      onDisconnected: (reason) => {
        connectionState.value = 'disconnected'
        if (reason !== 'io client disconnect') {
          error.value = `連線中斷: ${reason}`
        }
      },
      onAuthenticated: (user) => {
        connectionState.value = 'authenticated'
        authenticatedUser.value = user
      },
      onAuthFailed: (wsError) => {
        lastError.value = wsError
        error.value = wsError.message
        connectionState.value = 'disconnected'
      },
      onSessionCreated: handleSessionCreated,
      onSessionResumed: handleSessionResumed,
      onSessionUpdated: handleSessionUpdated,
      onSessionEnded: handleSessionEnded,
      onSessionExpired: handleSessionExpired,
      onGenerating: () => {
        isGenerating.value = true
      },
      onGenerated: handleGenerated,
      onError: handleError,
    })
  }

  /**
   * 斷開連線
   */
  function disconnect() {
    socket.value.disconnect()
    connectionState.value = 'disconnected'
    authenticatedUser.value = null
    currentSession.value = null
    generationHistory.value = []
    isGenerating.value = false
  }

  /**
   * 重新連線
   */
  function reconnect() {
    socket.value.reconnect()
  }

  // ============================================
  // Session 管理
  // ============================================

  /**
   * 開始新 Session
   */
  function startSession(model: AIModel, characterId?: string, scenarioId?: string, settings?: SessionSettings) {
    error.value = null
    socket.value.startSession(model, characterId, scenarioId, settings)
  }

  /**
   * 更新 Session
   */
  function updateSession(data: { characterId?: string | null; scenarioId?: string | null; settings?: SessionSettings }) {
    if (!currentSession.value) {
      error.value = '尚未建立 Session'
      return
    }
    error.value = null
    socket.value.updateSession(currentSession.value.id, data)
  }

  /**
   * 恢復既有 Session
   */
  function resumeSession(sessionId: string) {
    error.value = null
    socket.value.resumeSession(sessionId)
  }

  /**
   * 結束 Session
   */
  function endSession() {
    if (currentSession.value) {
      socket.value.endSession(currentSession.value.id)
    }
  }

  // ============================================
  // 圖片生成
  // ============================================

  /**
   * 發送生成請求
   * @param prompt - 生成提示詞
   * @param referenceImage - 即時參考圖片（選填）
   * @param settings - 覆蓋 Session 預設設定（選填）
   */
  function generate(
    prompt: string,
    referenceImage?: { url: string; description?: string },
    settings?: SessionSettings
  ) {
    if (!currentSession.value) {
      error.value = '尚未建立 Session'
      return
    }

    error.value = null
    isGenerating.value = true
    socket.value.generate(currentSession.value.id, prompt, referenceImage, settings)
  }

  // ============================================
  // 事件處理
  // ============================================

  function handleSessionCreated(event: SessionCreatedEvent) {
    if (!event.success) return

    const session = event.session
    currentSession.value = {
      id: session.id,
      model: session.model,
      settings: session.settings,
      characterId: session.characterId,
      characterName: session.characterName,
      scenarioId: session.scenarioId,
      scenarioName: session.scenarioName,
      expiresAt: session.expiresAt,
      status: 'active',
    }

    // 如有 pending 生成請求，自動觸發
    if (pendingGeneration.value) {
      const pending = pendingGeneration.value
      pendingGeneration.value = null
      generate(pending.prompt, pending.referenceImage, pending.settings)
    }
  }

  function handleSessionResumed(event: SessionResumedEvent) {
    if (!event.success) return

    const session = event.session
    currentSession.value = {
      id: session.id,
      model: session.model,
      settings: session.settings,
      characterId: session.characterId,
      characterName: session.characterName,
      scenarioId: session.scenarioId,
      scenarioName: session.scenarioName,
      expiresAt: session.expiresAt,
      status: 'active',
    }
    // 歷史由 View 層在 resume 前透過 REST API 載入，此處不清空
  }

  function handleSessionUpdated(event: SessionUpdatedEvent) {
    if (!event.success) return

    const session = event.session
    if (currentSession.value?.id === session.id) {
      currentSession.value = {
        ...currentSession.value,
        settings: session.settings,
        characterId: session.characterId,
        characterName: session.characterName,
        scenarioId: session.scenarioId,
        scenarioName: session.scenarioName,
      }
    }
  }

  function handleSessionEnded(sessionId: string) {
    if (currentSession.value?.id === sessionId) {
      currentSession.value = null
      // 不再自動清空歷史，由 View 層控制
    }
  }

  function handleSessionExpired(sessionId: string) {
    if (currentSession.value?.id === sessionId) {
      currentSession.value = {
        ...currentSession.value,
        status: 'expired',
      }
    }
  }

  function handleGenerated(result: GeneratedEvent) {
    isGenerating.value = false

    const generationResult: GenerationResult = {
      sessionId: result.sessionId,
      success: result.success,
      historyId: result.historyId,
      imageUrl: result.imageUrl,
      text: result.text,
      prompt: result.prompt,
      settings: result.settings,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      status: result.status,
      errorMessage: result.errorMessage,
      generatedAt: result.generatedAt,
    }

    generationHistory.value.unshift(generationResult)

    if (!result.success) {
      error.value = result.errorMessage || '生成失敗，請稍後再試'
    } else if (result.status === 'filtered') {
      error.value = result.errorMessage || '內容被過濾，請修改 prompt 後重試'
    }
  }

  function handleError(wsError: WSError) {
    isGenerating.value = false
    lastError.value = wsError
    error.value = wsError.message

    // 特定錯誤處理（對應 AsyncAPI ErrorPayload.type）
    switch (wsError.type) {
      case 'permission_denied':
        connectionState.value = 'disconnected'
        break
      case 'session_expired':
        if (currentSession.value) {
          currentSession.value.status = 'expired'
        }
        error.value = null
        break
      case 'start_session_failed':
        pendingGeneration.value = null
        break
      case 'resume_session_failed':
      case 'update_session_failed':
      case 'generation_failed':
      case 'invalid_model':
        // 保持錯誤訊息顯示
        break
    }
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 清除錯誤
   */
  function clearError() {
    error.value = null
    lastError.value = null
  }

  /**
   * 清空生成歷史
   */
  function clearHistory() {
    generationHistory.value = []
  }

  /**
   * 重置 Store
   */
  function reset() {
    disconnect()
    error.value = null
    lastError.value = null
  }

  /**
   * 從 Session 詳情載入歷史對話記錄
   * 用於恢復 completed Session 時顯示既有對話
   */
  function loadHistoryFromSession(history: GenerationHistoryItem[]) {
    generationHistory.value = history.map((item) => ({
      sessionId: item.sessionId,
      success: item.status === 'success',
      historyId: item.id,
      imageUrl: item.generatedImageUrl ?? undefined,
      text: item.responseText ?? undefined,
      prompt: item.prompt,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      status: item.status,
      errorMessage: item.errorMessage ?? undefined,
      generatedAt: item.createdAt,
    })).reverse()
  }

  return {
    // State
    connectionState,
    authenticatedUser,
    currentSession,
    generationHistory,
    isGenerating,
    error,
    lastError,
    // Getters
    isConnected,
    isAuthenticated,
    hasActiveSession,
    sessionExpiresIn,
    // Actions
    connect,
    disconnect,
    reconnect,
    startSession,
    updateSession,
    resumeSession,
    endSession,
    generate,
    clearError,
    clearHistory,
    reset,
    loadHistoryFromSession,
    pendingGeneration,
  }
})
