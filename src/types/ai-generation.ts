// ============================================
// AI 圖片生成相關型別定義
// ============================================

// AI 模型類型
export type AIModel = 'nano-banana' | 'nano-banana-pro'

// 生成狀態
export type GenerationStatus = 'success' | 'failed' | 'filtered'

// Session 狀態
export type SessionStatus = 'active' | 'completed' | 'expired'

// WebSocket 連線狀態
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'authenticated'

// ============================================
// 角色相關
// ============================================

// 角色參考圖片角度
export type ReferenceImageAngle = 'front' | 'side' | 'back' | 'detail'

// 角色參考圖片
export interface ReferenceImage {
  url: string
  angle?: ReferenceImageAngle
  description?: string
}

// 物件參考圖片
export interface ObjectImage {
  url: string
  name: string
}

// 角色參考圖片集合（對應 OpenAPI referenceImages 結構）
export interface CharacterReferenceImages {
  images: ReferenceImage[]
  objectImages: ObjectImage[]
}

// 角色
export interface Character {
  id: string
  userId: string
  name: string
  description?: string
  tags: string[]
  isPublic: boolean
  referenceImages: CharacterReferenceImages | null
  createdAt: string
  updatedAt: string
}

// 角色建立請求
export interface CharacterCreateRequest {
  name: string
  description?: string
  tags?: string[]
  isPublic?: boolean
}

// 角色更新請求
export interface CharacterUpdateRequest {
  name?: string
  description?: string
  tags?: string[]
  isPublic?: boolean
}

// 角色列表查詢參數
export interface CharacterQueryParams {
  page?: number
  limit?: number
  search?: string
  tags?: string[]
  isPublic?: boolean
}

// 角色列表分頁（對應 OpenAPI pagination 結構）
export interface CharacterPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 標籤項目（對應 OpenAPI tags/list 回應）
export interface TagItem {
  tag: string
  count: number
}

// 圖片上傳類型（對應 OpenAPI: character=角色圖片, object=物件參考）
export type CharacterImageType = 'character' | 'object'

// 圖片上傳 metadata
export interface CharacterImageMetadata {
  angle?: ReferenceImageAngle // for reference images
  description?: string // for reference images
  name?: string // for object images
}

// ============================================
// 情境相關
// ============================================

// 情境風格圖片
export interface StyleImage {
  url: string
  description?: string
}

// 情境風格圖片集合
export interface ScenarioStyleImages {
  images: StyleImage[]
}

// 情境預設設定
export interface ScenarioDefaultSettings {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  imageSize?: '1K' | '2K'
}

// 情境
export interface Scenario {
  id: string
  userId: string
  name: string
  description?: string
  tags: string[]
  isPublic: boolean
  styleImages: ScenarioStyleImages | null
  defaultSettings: ScenarioDefaultSettings | null
  createdAt: string
  updatedAt: string
}

// 情境建立請求
export interface ScenarioCreateRequest {
  name: string
  description?: string
  tags?: string[]
  isPublic?: boolean
  defaultSettings?: ScenarioDefaultSettings
}

// 情境更新請求
export interface ScenarioUpdateRequest {
  name?: string
  description?: string
  tags?: string[]
  isPublic?: boolean
  defaultSettings?: ScenarioDefaultSettings
}

// 情境查詢參數
export interface ScenarioQueryParams {
  page?: number
  limit?: number
  search?: string
  tags?: string[]
  isPublic?: boolean
}

// 情境列表分頁
export interface ScenarioPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================
// Session 相關
// ============================================

// Session 設定（對應 AsyncAPI GenerationSettings）
export interface SessionSettings {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  imageSize?: '1K' | '2K'
}

// 生成 Session（對應 AsyncAPI SessionInfo）
export interface GenerationSession {
  id: string
  model: AIModel
  settings: SessionSettings
  characterId?: string | null
  characterName?: string | null
  scenarioId?: string | null
  scenarioName?: string | null
  expiresAt: string
  // 前端額外狀態
  status: SessionStatus
}

// ============================================
// 生成結果相關
// ============================================

// 生成結果（對應 AsyncAPI GeneratedPayload）
export interface GenerationResult {
  sessionId: string
  success: boolean
  historyId?: string
  imageUrl?: string
  text?: string
  prompt: string
  settings?: SessionSettings // 本次實際使用的設定
  inputTokens?: number
  outputTokens?: number
  status?: GenerationStatus
  errorMessage?: string
  generatedAt: string
}

// 生成歷史（管理員查詢用，對應 OpenAPI GenerationHistoryItem）
export interface GenerationHistoryAdmin {
  id: string
  sessionId: string
  userId: string
  prompt: string
  generatedImageUrl: string | null
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  status: GenerationStatus
  errorMessage: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

// 生成歷史查詢參數
export interface GenerationHistoryQueryParams {
  page?: number
  limit?: number
  status?: GenerationStatus
  sessionId?: string
  startDate?: string
  endDate?: string
  userId?: string
}

// 生成歷史列表回應（對應 OpenAPI /api/admin/ai/history 回應）
export interface GenerationHistoryAdminPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================
// WebSocket 事件相關
// ============================================

// 認證使用者（對應 AsyncAPI AuthenticatedPayload.user）
export interface AuthenticatedUser {
  id: string
  email: string
  displayName?: string
}

// WebSocket 錯誤類型
export type WSErrorType =
  | 'start_session_failed'
  | 'resume_session_failed'
  | 'update_session_failed'
  | 'generation_failed'
  | 'end_session_failed'
  | 'invalid_model'
  | 'session_expired'
  | 'permission_denied'

// WebSocket 錯誤（對應 AsyncAPI ErrorPayload）
export interface WSError {
  type: WSErrorType | string
  message: string
  timestamp: string
}

// Session 資訊（對應 AsyncAPI SessionInfo）
export interface SessionInfo {
  id: string
  model: AIModel
  settings: SessionSettings
  characterId?: string | null
  characterName?: string | null
  scenarioId?: string | null
  scenarioName?: string | null
  expiresAt: string
}

// Session 更新事件資料
export interface SessionUpdatedEvent {
  success: boolean
  session: SessionInfo
}

// Session 建立事件資料（對應 AsyncAPI SessionCreatedPayload）
export interface SessionCreatedEvent {
  success: boolean
  session: SessionInfo
}

// 生成中事件資料（對應 AsyncAPI GeneratingPayload）
export interface GeneratingEvent {
  sessionId: string
  message: string
}

// 生成完成事件資料（對應 AsyncAPI GeneratedPayload）
export interface GeneratedEvent {
  sessionId: string
  success: boolean
  historyId?: string
  imageUrl?: string
  text?: string
  prompt: string
  settings?: SessionSettings // 本次實際使用的設定
  inputTokens?: number
  outputTokens?: number
  status?: GenerationStatus
  errorMessage?: string
  generatedAt: string
}

// Session 恢復事件資料（對應 AsyncAPI SessionResumedPayload）
export interface SessionResumedEvent {
  success: boolean
  session: SessionInfo
}

// 即時參考圖片（對應 AsyncAPI GeneratePayload.referenceImage）
export interface ReferenceImageInput {
  url: string
  description?: string
}

// ============================================
// 對話式 UI 相關
// ============================================

// 對話訊息項目
export interface ChatMessageItem {
  id: string
  type: 'user' | 'assistant' | 'system'
  prompt?: string
  result?: GenerationResult
  systemMessage?: string
  timestamp: string
}

// ============================================
// 管理員統計相關（對應 OpenAPI ai-admin.json）
// ============================================

// AI 使用統計（對應 OpenAPI AIStatistics）
export interface AIStatistics {
  period: {
    startDate: string | null
    endDate: string | null
  }
  totalGenerations: number
  totalUsers: number
  totalSessions: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
  characters: {
    total: number
    public: number
    private: number
  }
  activeSessions: number
  today: {
    generations: number
    users: number
    cost: number
  }
}

// 統計查詢參數
export interface AIStatisticsQueryParams {
  startDate?: string
  endDate?: string
}

// 使用趨勢數據（對應 OpenAPI /api/admin/ai/trend 回應）
export interface AIUsageTrend {
  date: string
  generations: number
  inputTokens: number
  outputTokens: number
  cost: number
  users: number
}

// 使用者使用量（對應 OpenAPI /api/admin/ai/users/{userId}/usage 回應）
export interface AIUserUsage {
  userId: string
  period: {
    startDate: string | null
    endDate: string | null
  }
  totalGenerations: number
  totalSessions: number
  totalTokens: number
  totalCost: number
  statusBreakdown: {
    success: number
    failed: number
    filtered: number
  }
}

// 使用者使用量查詢參數
export interface AIUserUsageQueryParams {
  startDate?: string
  endDate?: string
}

// 排行榜項目（對應 OpenAPI /api/admin/ai/leaderboard 回應）
export interface AILeaderboardItem {
  rank: number
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  generations: number
  inputTokens: number
  outputTokens: number
  cost: number
}

// 排行榜查詢參數
export interface AILeaderboardQueryParams {
  limit?: number
  startDate?: string
  endDate?: string
}

// ============================================
// REST API 專用型別（Session 查詢）
// ============================================

// 通用分頁結構
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 通用分頁回應
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}

// Session 查詢參數
export interface SessionQueryParams {
  userId?: string
  status?: SessionStatus
  characterId?: string
  page?: number
  limit?: number
}

// Session 列表項目（對應 OpenAPI SessionItem）
export interface SessionItem {
  id: string
  userId: string
  model: AIModel
  status: SessionStatus
  settings: SessionSettings
  characterId: string | null
  character: Character | null
  scenarioId: string | null
  scenario: Scenario | null
  user: {
    id: string
    displayName: string
    email: string
  }
  generationCount: number
  totalTokens: number
  createdAt: string
  expiresAt: string
}

// Session 統計資訊
export interface SessionStatistics {
  generationCount: number
  successCount: number
  failedCount: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
}

// Session 詳情（含對話歷史）
export interface SessionDetail {
  id: string
  userId: string
  model: AIModel
  status: SessionStatus
  settings: SessionSettings
  character: Character | null
  scenario: Scenario | null
  user: {
    id: string
    displayName: string
    email: string
  }
  statistics: SessionStatistics
  history: GenerationHistoryItem[]
  createdAt: string
  expiresAt: string
}

// 生成歷史列表項目（REST API 用，對應 OpenAPI GenerationHistoryItem）
export interface GenerationHistoryItem {
  id: string
  sessionId: string
  userId: string
  prompt: string
  responseText: string | null
  generatedImageUrl: string | null
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  status: GenerationStatus
  errorMessage: string | null
  metadata: Record<string, unknown>
  createdAt: string
  user: {
    id: string
    displayName: string
    email: string
  }
  session?: {
    id: string
    model: AIModel
  }
}
