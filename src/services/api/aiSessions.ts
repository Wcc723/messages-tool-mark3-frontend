import apiClient from './client'
import type {
  GenerationHistoryItem,
  GenerationHistoryQueryParams,
  SessionItem,
  SessionQueryParams,
  SessionDetail,
  PaginatedResponse,
} from '@/types/ai-generation'

/**
 * 取得所有生成歷史（團隊共用）
 * GET /api/ai/history
 */
export async function getGenerationHistory(
  params?: GenerationHistoryQueryParams
): Promise<PaginatedResponse<GenerationHistoryItem>> {
  const response = await apiClient.get('/api/ai/history', { params })
  return response.data
}

/**
 * 取得單筆生成記錄詳情
 * GET /api/ai/history/:id
 */
export async function getHistoryDetail(
  historyId: string
): Promise<{ success: boolean; data: GenerationHistoryItem }> {
  const response = await apiClient.get(`/api/ai/history/${historyId}`)
  return response.data
}

/**
 * 取得所有 Sessions（團隊共用）
 * GET /api/ai/sessions
 */
export async function getSessions(
  params?: SessionQueryParams
): Promise<PaginatedResponse<SessionItem>> {
  const response = await apiClient.get('/api/ai/sessions', { params })
  return response.data
}

/**
 * 取得 Session 詳情與完整對話歷史
 * GET /api/ai/sessions/:id
 */
export async function getSessionDetail(
  sessionId: string
): Promise<{ success: boolean; data: SessionDetail }> {
  const response = await apiClient.get(`/api/ai/sessions/${sessionId}`)
  return response.data
}

/**
 * 刪除 Session
 * DELETE /api/ai/sessions/:id
 * @param sessionId - Session ID
 * @param keepHistory - 是否保留生成記錄（預設 false）
 */
export async function deleteSession(
  sessionId: string,
  keepHistory = false
): Promise<{
  success: boolean
  message: string
  data: { sessionId: string; deletedHistoryCount: number }
}> {
  const response = await apiClient.delete(`/api/ai/sessions/${sessionId}`, {
    params: { keepHistory },
  })
  return response.data
}
