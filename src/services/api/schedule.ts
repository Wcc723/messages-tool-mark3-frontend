import apiClient from './client'
import type {
  ApiResponse,
  Schedule,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
  ScheduleListResponse,
  ScheduleQueryParams,
  Timezone,
  ExecutionLogListResponse,
  ExecutionLogQueryParams,
} from './types'

// ============================================
// 排程 CRUD
// ============================================

/**
 * 創建新排程
 * POST /api/schedules
 *
 * @param data - 排程建立資料
 */
export async function createSchedule(data: ScheduleCreateRequest) {
  const response = await apiClient.post<ApiResponse<Schedule>>('/api/schedules', data)
  return response.data.data!
}

/**
 * 取得使用者排程列表
 * GET /api/schedules
 *
 * @param params - 查詢參數 (page, limit, status, search)
 */
export async function getSchedules(params?: ScheduleQueryParams) {
  const response = await apiClient.get<ApiResponse<ScheduleListResponse>>('/api/schedules', {
    params,
  })
  return response.data.data!
}

/**
 * 取得特定排程詳情
 * GET /api/schedules/:id
 *
 * @param id - 排程 ID
 */
export async function getScheduleById(id: string) {
  const response = await apiClient.get<ApiResponse<Schedule>>(`/api/schedules/${id}`)
  return response.data.data!
}

/**
 * 部分更新排程
 * PATCH /api/schedules/:id
 *
 * @param id - 排程 ID
 * @param data - 要更新的欄位
 */
export async function updateSchedule(id: string, data: ScheduleUpdateRequest) {
  const response = await apiClient.patch<ApiResponse<Schedule>>(`/api/schedules/${id}`, data)
  return response.data.data!
}

/**
 * 刪除排程
 * DELETE /api/schedules/:id
 *
 * @param id - 排程 ID
 */
export async function deleteSchedule(id: string) {
  const response = await apiClient.delete<ApiResponse>(`/api/schedules/${id}`)
  return response.data
}

// ============================================
// 排程狀態管理
// ============================================

/**
 * 更新排程狀態
 * PATCH /api/schedules/:id/status
 *
 * @param id - 排程 ID
 * @param status - 新的排程狀態 (draft, active, paused, completed)
 */
export async function updateScheduleStatus(
  id: string,
  status: 'draft' | 'active' | 'paused' | 'completed'
) {
  const response = await apiClient.patch<ApiResponse<Schedule>>(`/api/schedules/${id}/status`, {
    status,
  })
  return response.data.data!
}

// ============================================
// 時區相關
// ============================================

/**
 * 取得支援的時區列表
 * GET /api/schedules/timezones
 */
export async function getTimezones() {
  const response = await apiClient.get<ApiResponse<Timezone[]>>('/api/schedules/timezones')
  return response.data.data!
}

// ============================================
// 執行記錄
// ============================================

/**
 * 取得排程執行記錄
 * GET /api/schedules/:id/logs
 *
 * @param id - 排程 ID
 * @param params - 查詢參數 (page, limit)
 */
export async function getScheduleLogs(id: string, params?: ExecutionLogQueryParams) {
  const response = await apiClient.get<ApiResponse<ExecutionLogListResponse>>(
    `/api/schedules/${id}/logs`,
    { params }
  )
  return response.data.data!
}
