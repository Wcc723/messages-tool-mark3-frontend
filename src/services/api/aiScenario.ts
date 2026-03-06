import apiClient from './client'
import type { ApiResponse } from './types'
import type {
  Scenario,
  ScenarioCreateRequest,
  ScenarioUpdateRequest,
  ScenarioQueryParams,
  ScenarioPagination,
  TagItem,
} from '@/types/ai-generation'

// 情境列表 API 回應格式
interface ScenarioListApiResponse {
  success: boolean
  data: Scenario[]
  pagination: ScenarioPagination
}

// ============================================
// 情境 CRUD 操作
// ============================================

export async function getScenarios(params?: ScenarioQueryParams) {
  const response = await apiClient.get<ScenarioListApiResponse>('/api/ai/scenarios', {
    params: {
      ...params,
      tags: params?.tags?.join(','),
    },
  })
  return {
    scenarios: response.data.data || [],
    pagination: response.data.pagination,
  }
}

export async function getScenario(id: string) {
  const response = await apiClient.get<ApiResponse<Scenario>>(`/api/ai/scenarios/${id}`)
  return response.data.data!
}

export async function createScenario(data: ScenarioCreateRequest) {
  const response = await apiClient.post<ApiResponse<Scenario>>('/api/ai/scenarios', data)
  return response.data.data!
}

export async function updateScenario(id: string, data: ScenarioUpdateRequest) {
  const response = await apiClient.put<ApiResponse<Scenario>>(`/api/ai/scenarios/${id}`, data)
  return response.data.data!
}

export async function deleteScenario(id: string) {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/ai/scenarios/${id}`)
  return response.data
}

// ============================================
// 情境圖片管理
// ============================================

export async function uploadScenarioImage(id: string, file: File, description?: string) {
  const formData = new FormData()
  formData.append('image', file)

  if (description) {
    formData.append('description', description)
  }

  const response = await apiClient.post<ApiResponse<Scenario>>(
    `/api/ai/scenarios/${id}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data.data!
}

export async function deleteScenarioImage(id: string, imageIndex: number) {
  const response = await apiClient.delete<ApiResponse<Scenario>>(
    `/api/ai/scenarios/${id}/images/${imageIndex}`
  )
  return response.data.data!
}

// ============================================
// 標籤管理
// ============================================

export async function getTags() {
  const response = await apiClient.get<ApiResponse<TagItem[]>>('/api/ai/scenarios/tags/list')
  return response.data.data || []
}
