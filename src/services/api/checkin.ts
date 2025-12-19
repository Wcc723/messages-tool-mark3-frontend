import apiClient from './client'
import type {
  ApiResponse,
  CheckinSchedule,
  CheckinScheduleCreateRequest,
  CheckinScheduleUpdateRequest,
  CheckinScheduleListResponse,
  CheckinScheduleQueryParams,
  CheckinRescanRequest,
  CheckinRescanResponse,
  ScanStatusResponse,
  ScanResultResponse,
} from './types'

// ============================================
// 打卡排程 CRUD
// ============================================

/**
 * 建立打卡排程
 * POST /api/checkin-schedules
 */
export async function createCheckinSchedule(data: CheckinScheduleCreateRequest) {
  const response = await apiClient.post<ApiResponse<CheckinSchedule>>(
    '/api/checkin-schedules',
    data
  )
  return response.data.data!
}

/**
 * 取得打卡排程列表
 * GET /api/checkin-schedules
 */
export async function getCheckinSchedules(params?: CheckinScheduleQueryParams) {
  const response = await apiClient.get<ApiResponse<CheckinSchedule[]>>(
    '/api/checkin-schedules',
    { params }
  )
  return response.data.data!
}

/**
 * 取得單一打卡排程
 * GET /api/checkin-schedules/:id
 */
export async function getCheckinScheduleById(id: string) {
  const response = await apiClient.get<ApiResponse<CheckinSchedule>>(
    `/api/checkin-schedules/${id}`
  )
  return response.data.data!
}

/**
 * 更新打卡排程
 * PATCH /api/checkin-schedules/:id
 */
export async function updateCheckinSchedule(id: string, data: CheckinScheduleUpdateRequest) {
  const response = await apiClient.patch<ApiResponse<CheckinSchedule>>(
    `/api/checkin-schedules/${id}`,
    data
  )
  return response.data.data!
}

/**
 * 刪除打卡排程
 * DELETE /api/checkin-schedules/:id
 */
export async function deleteCheckinSchedule(id: string) {
  const response = await apiClient.delete<ApiResponse>(`/api/checkin-schedules/${id}`)
  return response.data
}

/**
 * 切換打卡排程啟用狀態
 * PATCH /api/checkin-schedules/:id/toggle
 */
export async function toggleCheckinSchedule(id: string) {
  const response = await apiClient.patch<ApiResponse<CheckinSchedule>>(
    `/api/checkin-schedules/${id}/toggle`
  )
  return response.data.data!
}

/**
 * 手動重新掃描
 * POST /api/checkin-schedules/:id/rescan
 * @param id 排程 ID
 * @param data 可選，包含 scanDate（YYYY-MM-DD）。若不提供則掃描全部
 * @returns 包含 scanLogId 用於後續查詢掃描狀態
 */
export async function rescanCheckinSchedule(id: string, data?: CheckinRescanRequest) {
  const response = await apiClient.post<ApiResponse<CheckinRescanResponse>>(
    `/api/checkin-schedules/${id}/rescan`,
    data
  )
  return response.data
}

/**
 * 取得 Cron 任務狀態
 * GET /api/checkin-schedules/cron-status
 */
export async function getCronStatus() {
  const response = await apiClient.get<ApiResponse>('/api/checkin-schedules/cron-status')
  return response.data
}

/**
 * 手動觸發每小時掃描（測試用）
 * POST /api/checkin-schedules/trigger-hourly-scan
 */
export async function triggerHourlyScan() {
  const response = await apiClient.post<ApiResponse>('/api/checkin-schedules/trigger-hourly-scan')
  return response.data
}

// ============================================
// 掃描狀態查詢
// ============================================

/**
 * 取得掃描任務狀態
 * GET /api/checkin-schedules/scan-status/:scanLogId
 * @param scanLogId 掃描日誌 ID
 */
export async function getScanStatus(scanLogId: string) {
  const response = await apiClient.get<ApiResponse<ScanStatusResponse>>(
    `/api/checkin-schedules/scan-status/${scanLogId}`
  )
  return response.data.data!
}

/**
 * 取得掃描任務結果
 * GET /api/checkin-schedules/scan-result/:scanLogId
 * @param scanLogId 掃描日誌 ID
 */
export async function getScanResult(scanLogId: string) {
  const response = await apiClient.get<ApiResponse<ScanResultResponse>>(
    `/api/checkin-schedules/scan-result/${scanLogId}`
  )
  return response.data.data!
}
