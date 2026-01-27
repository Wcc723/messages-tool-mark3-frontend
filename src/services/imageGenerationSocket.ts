import { io, Socket } from 'socket.io-client'
import type {
  AIModel,
  ConnectionState,
  SessionSettings,
  AuthenticatedUser,
  SessionCreatedEvent,
  SessionResumedEvent,
  GeneratingEvent,
  GeneratedEvent,
  WSError,
  ReferenceImageInput,
} from '@/types/ai-generation'

// WebSocket 服務 URL（對應 AsyncAPI path: /ws/image-generation）
const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const WS_PATH = '/ws/image-generation'

// ============================================
// 事件處理器類型
// ============================================

export interface ImageGenerationSocketEvents {
  onConnected?: () => void
  onDisconnected?: (reason: string) => void
  onAuthenticated?: (user: AuthenticatedUser) => void
  onAuthFailed?: (error: WSError) => void
  onSessionCreated?: (session: SessionCreatedEvent) => void
  onSessionResumed?: (session: SessionResumedEvent) => void
  onSessionEnded?: (sessionId: string) => void
  onSessionExpired?: (sessionId: string) => void
  onGenerating?: (data: GeneratingEvent) => void
  onGenerated?: (result: GeneratedEvent) => void
  onError?: (error: WSError) => void
}

// ============================================
// ImageGenerationSocket 類別
// ============================================

export class ImageGenerationSocket {
  private socket: Socket | null = null
  private token: string | null = null
  private connectionState: ConnectionState = 'disconnected'
  private eventHandlers: ImageGenerationSocketEvents = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // ============================================
  // 連線狀態
  // ============================================

  /**
   * 取得目前連線狀態
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * 檢查是否已連線
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' || this.connectionState === 'authenticated'
  }

  /**
   * 檢查是否已認證
   */
  isAuthenticated(): boolean {
    return this.connectionState === 'authenticated'
  }

  // ============================================
  // 事件處理器設定
  // ============================================

  /**
   * 設定事件處理器
   */
  setEventHandlers(handlers: ImageGenerationSocketEvents): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers }
  }

  /**
   * 清除事件處理器
   */
  clearEventHandlers(): void {
    this.eventHandlers = {}
  }

  // ============================================
  // 連線管理
  // ============================================

  /**
   * 連線到 WebSocket 伺服器
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.warn('[ImageGenerationSocket] Already connected')
      return
    }

    this.token = token
    this.connectionState = 'connecting'
    this.reconnectAttempts = 0

    this.socket = io(WS_URL, {
      path: WS_PATH,
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    })

    this.setupEventListeners()
  }

  /**
   * 斷開連線
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.connectionState = 'disconnected'
    this.token = null
  }

  /**
   * 重新連線
   */
  reconnect(): void {
    if (!this.token) {
      console.error('[ImageGenerationSocket] No token available for reconnection')
      return
    }

    this.disconnect()
    this.connect(this.token)
  }

  // ============================================
  // 事件監聽器設定
  // ============================================

  private setupEventListeners(): void {
    if (!this.socket) return

    // 連線成功
    this.socket.on('connect', () => {
      console.log('[ImageGenerationSocket] Connected')
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      this.eventHandlers.onConnected?.()
    })

    // 連線斷開
    this.socket.on('disconnect', (reason: string) => {
      console.log('[ImageGenerationSocket] Disconnected:', reason)
      this.connectionState = 'disconnected'
      this.eventHandlers.onDisconnected?.(reason)
    })

    // 認證成功（對應 AsyncAPI AuthenticatedPayload）
    this.socket.on('authenticated', (payload: { success: boolean; user: AuthenticatedUser }) => {
      console.log('[ImageGenerationSocket] Authenticated:', payload)
      if (payload.success) {
        this.connectionState = 'authenticated'
        this.eventHandlers.onAuthenticated?.(payload.user)
      }
    })

    // 認證失敗（使用 error 事件處理）
    // AsyncAPI 沒有單獨的 auth_failed，錯誤會透過 error 事件傳送

    // Session 建立成功
    this.socket.on('session_created', (session: SessionCreatedEvent) => {
      console.log('[ImageGenerationSocket] Session created:', session)
      this.eventHandlers.onSessionCreated?.(session)
    })

    // Session 恢復成功
    this.socket.on('session_resumed', (session: SessionResumedEvent) => {
      console.log('[ImageGenerationSocket] Session resumed:', session)
      this.eventHandlers.onSessionResumed?.(session)
    })

    // Session 結束（對應 AsyncAPI SessionEndedPayload）
    this.socket.on('session_ended', (payload: { success: boolean; sessionId: string }) => {
      console.log('[ImageGenerationSocket] Session ended:', payload)
      if (payload.success) {
        this.eventHandlers.onSessionEnded?.(payload.sessionId)
      }
    })

    // 生成中
    this.socket.on('generating', (data: GeneratingEvent) => {
      console.log('[ImageGenerationSocket] Generating:', data)
      this.eventHandlers.onGenerating?.(data)
    })

    // 生成完成
    this.socket.on('generated', (result: GeneratedEvent) => {
      console.log('[ImageGenerationSocket] Generated:', result)
      this.eventHandlers.onGenerated?.(result)
    })

    // 錯誤
    this.socket.on('error', (error: WSError) => {
      console.error('[ImageGenerationSocket] Error:', error)
      this.eventHandlers.onError?.(error)
    })

    // 連線錯誤
    this.socket.on('connect_error', (error: Error) => {
      console.error('[ImageGenerationSocket] Connection error:', error.message)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[ImageGenerationSocket] Max reconnection attempts reached')
        this.eventHandlers.onError?.({
          type: 'permission_denied',
          message: '無法連線到伺服器，請稍後再試',
          timestamp: new Date().toISOString(),
        })
      }
    })
  }

  // ============================================
  // Session 管理
  // ============================================

  /**
   * 開始新 Session（對應 AsyncAPI StartSessionPayload）
   */
  startSession(model: AIModel, characterId?: string, settings?: SessionSettings): void {
    if (!this.isAuthenticated()) {
      console.error('[ImageGenerationSocket] Not authenticated')
      this.eventHandlers.onError?.({
        type: 'permission_denied',
        message: '尚未認證，請重新連線',
        timestamp: new Date().toISOString(),
      })
      return
    }

    this.socket?.emit('start_session', {
      model,
      characterId,
      settings: settings || {},
    })
  }

  /**
   * 恢復既有 Session（對應 AsyncAPI ResumeSessionPayload）
   */
  resumeSession(sessionId: string): void {
    if (!this.isAuthenticated()) {
      console.error('[ImageGenerationSocket] Not authenticated')
      this.eventHandlers.onError?.({
        type: 'permission_denied',
        message: '尚未認證，請重新連線',
        timestamp: new Date().toISOString(),
      })
      return
    }

    this.socket?.emit('resume_session', { sessionId })
  }

  /**
   * 結束 Session
   */
  endSession(sessionId: string): void {
    if (!this.isConnected()) {
      console.error('[ImageGenerationSocket] Not connected')
      return
    }

    this.socket?.emit('end_session', { sessionId })
  }

  // ============================================
  // 圖片生成
  // ============================================

  /**
   * 發送生成請求（對應 AsyncAPI GeneratePayload）
   * @param sessionId - Session ID
   * @param prompt - 生成提示詞
   * @param referenceImage - 即時參考圖片（選填）
   * @param settings - 覆蓋 Session 預設設定（選填）
   */
  generate(
    sessionId: string,
    prompt: string,
    referenceImage?: ReferenceImageInput,
    settings?: SessionSettings
  ): void {
    if (!this.isAuthenticated()) {
      console.error('[ImageGenerationSocket] Not authenticated')
      this.eventHandlers.onError?.({
        type: 'permission_denied',
        message: '尚未認證，請重新連線',
        timestamp: new Date().toISOString(),
      })
      return
    }

    const payload: {
      sessionId: string
      prompt: string
      referenceImage?: ReferenceImageInput
      settings?: SessionSettings
    } = {
      sessionId,
      prompt,
    }

    if (referenceImage) {
      payload.referenceImage = referenceImage
    }

    if (settings) {
      payload.settings = settings
    }

    this.socket?.emit('generate', payload)
  }
}

// 匯出單例
export const imageGenerationSocket = new ImageGenerationSocket()
