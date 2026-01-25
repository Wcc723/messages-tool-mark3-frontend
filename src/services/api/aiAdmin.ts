import apiClient from './client'
import type { ApiResponse } from './types'
import type {
  AIStatistics,
  AIStatisticsQueryParams,
  AIUsageTrend,
  AIUserUsage,
  AIUserUsageQueryParams,
  AIUserUsageListResponse,
  AILeaderboardItem,
  AILeaderboardQueryParams,
  GenerationHistoryQueryParams,
  GenerationHistoryListResponse,
} from '@/types/ai-generation'

// ============================================
// 統計資料
// ============================================

/**
 * 取得 AI 使用統計
 * GET /api/admin/ai/statistics
 */
export async function getStatistics(params?: AIStatisticsQueryParams) {
  const response = await apiClient.get<ApiResponse<AIStatistics>>('/api/admin/ai/statistics', {
    params,
  })
  return response.data.data!
}

/**
 * 取得使用趨勢（每日數據）
 * GET /api/admin/ai/trend
 * @param days - 取得最近幾天的數據（預設 30）
 */
export async function getTrend(days?: number) {
  const response = await apiClient.get<ApiResponse<AIUsageTrend[]>>('/api/admin/ai/trend', {
    params: { days },
  })
  return response.data.data!
}

// ============================================
// 生成歷史記錄
// ============================================

/**
 * 取得生成歷史記錄（審計日誌）
 * GET /api/admin/ai/history
 */
export async function getHistory(params?: GenerationHistoryQueryParams) {
  const response = await apiClient.get<ApiResponse<GenerationHistoryListResponse>>(
    '/api/admin/ai/history',
    { params }
  )
  return response.data.data!
}

// ============================================
// 使用者使用量
// ============================================

/**
 * 取得特定使用者的使用量統計
 * GET /api/admin/ai/users/{userId}/usage
 */
export async function getUserUsage(userId: string, params?: AIUserUsageQueryParams) {
  const response = await apiClient.get<ApiResponse<AIUserUsage>>(
    `/api/admin/ai/users/${userId}/usage`,
    { params }
  )
  return response.data.data!
}

/**
 * 取得所有使用者使用量列表
 * GET /api/admin/ai/users/usage
 */
export async function getUsersUsage(params?: AIUserUsageQueryParams) {
  const response = await apiClient.get<ApiResponse<AIUserUsageListResponse>>(
    '/api/admin/ai/users/usage',
    { params }
  )
  return response.data.data!
}

// ============================================
// 排行榜
// ============================================

/**
 * 取得使用者排行榜
 * GET /api/admin/ai/leaderboard
 */
export async function getLeaderboard(params?: AILeaderboardQueryParams) {
  const response = await apiClient.get<ApiResponse<AILeaderboardItem[]>>(
    '/api/admin/ai/leaderboard',
    { params }
  )
  return response.data.data!
}
