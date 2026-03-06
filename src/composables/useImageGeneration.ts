import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiGenerationStore } from '@/stores/aiGeneration'
import { useAuthStore } from '@/stores/auth'
import type { AIModel, SessionSettings, ReferenceImageInput } from '@/types/ai-generation'

/**
 * AI 圖片生成 Composable
 * 封裝 WebSocket 連線管理與生成邏輯
 */
export function useImageGeneration() {
  const aiGenerationStore = useAiGenerationStore()
  const authStore = useAuthStore()

  // 從 Store 取得響應式狀態
  const {
    connectionState,
    authenticatedUser,
    currentSession,
    generationHistory,
    isGenerating,
    error,
    isConnected,
    isAuthenticated,
    hasActiveSession,
    sessionExpiresIn,
  } = storeToRefs(aiGenerationStore)

  // Session 剩餘時間格式化
  const formattedExpiresIn = computed(() => {
    const ms = sessionExpiresIn.value
    if (!ms) return null

    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes} 分 ${seconds} 秒`
    }
    return `${seconds} 秒`
  })

  // 是否即將過期（小於 5 分鐘）
  const isExpiringSoon = computed(() => {
    const ms = sessionExpiresIn.value
    return ms !== null && ms < 5 * 60 * 1000
  })

  // ============================================
  // 連線管理
  // ============================================

  /**
   * 初始化連線
   */
  function initConnection() {
    if (!authStore.token) {
      console.warn('[useImageGeneration] No auth token available')
      return
    }

    if (!isConnected.value) {
      aiGenerationStore.connect(authStore.token)
    }
  }

  /**
   * 斷開連線
   */
  function disconnectConnection() {
    aiGenerationStore.disconnect()
  }

  // ============================================
  // Session 管理
  // ============================================

  /**
   * 開始新 Session
   */
  function startNewSession(model: AIModel, characterId?: string, scenarioId?: string, settings?: SessionSettings) {
    aiGenerationStore.startSession(model, characterId, scenarioId, settings)
  }

  /**
   * 恢復 Session
   */
  function resumeExistingSession(sessionId: string) {
    aiGenerationStore.resumeSession(sessionId)
  }

  /**
   * 結束當前 Session
   */
  function endCurrentSession() {
    aiGenerationStore.endSession()
  }

  // ============================================
  // 圖片生成
  // ============================================

  /**
   * 生成圖片
   */
  function generateImage(prompt: string, referenceImage?: ReferenceImageInput) {
    if (!hasActiveSession.value) {
      console.warn('[useImageGeneration] No active session')
      return
    }

    aiGenerationStore.generate(prompt, referenceImage)
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 清除錯誤
   */
  function clearError() {
    aiGenerationStore.clearError()
  }

  // ============================================
  // 生命週期
  // ============================================

  // 監聽認證狀態變化
  watch(
    () => authStore.token,
    (newToken, oldToken) => {
      if (newToken && !oldToken) {
        // 登入後自動連線
        initConnection()
      } else if (!newToken && oldToken) {
        // 登出後斷開連線
        disconnectConnection()
      }
    }
  )

  return {
    // 狀態
    connectionState,
    authenticatedUser,
    currentSession,
    generationHistory,
    isGenerating,
    error,
    isConnected,
    isAuthenticated,
    hasActiveSession,
    sessionExpiresIn,
    formattedExpiresIn,
    isExpiringSoon,
    // 方法
    initConnection,
    disconnectConnection,
    startNewSession,
    resumeExistingSession,
    endCurrentSession,
    generateImage,
    clearError,
  }
}
