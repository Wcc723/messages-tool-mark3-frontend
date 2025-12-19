import apiClient from './client'
import type {
  ApiResponse,
  CheckinStats,
  CheckinUsersResponse,
  CheckinUsersQueryParams,
} from './types'

// ============================================
// 打卡公開 API（需登入但不需特別授權）
// ============================================

/**
 * 取得排程全局統計
 * GET /api/checkin/:scheduleId/stats
 * @param scheduleId 排程 ID
 */
export async function getCheckinStats(scheduleId: string) {
  const response = await apiClient.get<ApiResponse<CheckinStats>>(
    `/api/checkin/${scheduleId}/stats`
  )
  return response.data.data!
}

/**
 * 取得排程用戶列表
 * GET /api/checkin/:scheduleId/users
 * @param scheduleId 排程 ID
 * @param params 查詢參數（分頁、搜尋）
 */
export async function getCheckinUsers(
  scheduleId: string,
  params?: CheckinUsersQueryParams
) {
  const response = await apiClient.get<ApiResponse<CheckinUsersResponse>>(
    `/api/checkin/${scheduleId}/users`,
    { params }
  )
  return response.data.data!
}

/**
 * 取得排程討論串列表
 * GET /api/checkin/:scheduleId/threads
 * @param scheduleId 排程 ID
 */
export async function getCheckinThreads(scheduleId: string) {
  const response = await apiClient.get<ApiResponse>(`/api/checkin/${scheduleId}/threads`)
  return response.data.data!
}
