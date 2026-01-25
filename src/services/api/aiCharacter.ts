import apiClient from './client'
import type { ApiResponse } from './types'
import type {
  Character,
  CharacterCreateRequest,
  CharacterUpdateRequest,
  CharacterQueryParams,
  CharacterPagination,
  CharacterImageType,
  CharacterImageMetadata,
  TagItem,
} from '@/types/ai-generation'

// 角色列表 API 回應格式（對應 OpenAPI CharacterListResponse）
interface CharacterListApiResponse {
  success: boolean
  data: Character[]
  pagination: CharacterPagination
}

// ============================================
// 角色 CRUD 操作
// ============================================

/**
 * 取得角色列表
 * GET /api/ai/characters
 * @returns { characters: Character[], pagination: CharacterPagination }
 */
export async function getCharacters(params?: CharacterQueryParams) {
  const response = await apiClient.get<CharacterListApiResponse>('/api/ai/characters', {
    params: {
      ...params,
      // 將 tags 陣列轉換為逗號分隔字串（對應 OpenAPI 格式）
      tags: params?.tags?.join(','),
    },
  })
  return {
    characters: response.data.data || [],
    pagination: response.data.pagination,
  }
}

/**
 * 取得單一角色
 * GET /api/ai/characters/{id}
 */
export async function getCharacter(id: string) {
  const response = await apiClient.get<ApiResponse<Character>>(`/api/ai/characters/${id}`)
  return response.data.data!
}

/**
 * 建立角色
 * POST /api/ai/characters
 */
export async function createCharacter(data: CharacterCreateRequest) {
  const response = await apiClient.post<ApiResponse<Character>>('/api/ai/characters', data)
  return response.data.data!
}

/**
 * 更新角色
 * PUT /api/ai/characters/{id}
 */
export async function updateCharacter(id: string, data: CharacterUpdateRequest) {
  const response = await apiClient.put<ApiResponse<Character>>(`/api/ai/characters/${id}`, data)
  return response.data.data!
}

/**
 * 刪除角色
 * DELETE /api/ai/characters/{id}
 */
export async function deleteCharacter(id: string) {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/ai/characters/${id}`)
  return response.data
}

// ============================================
// 角色圖片管理
// ============================================

/**
 * 上傳角色圖片
 * POST /api/ai/characters/{id}/images
 * @param id - 角色 ID
 * @param file - 圖片檔案
 * @param type - 圖片類型 (reference | object)
 * @param metadata - 圖片 metadata (角度、描述、名稱)
 */
export async function uploadCharacterImage(
  id: string,
  file: File,
  type: CharacterImageType,
  metadata?: CharacterImageMetadata
) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('type', type)

  if (metadata) {
    if (metadata.angle) {
      formData.append('angle', metadata.angle)
    }
    if (metadata.description) {
      formData.append('description', metadata.description)
    }
    if (metadata.name) {
      formData.append('name', metadata.name)
    }
  }

  const response = await apiClient.post<ApiResponse<Character>>(
    `/api/ai/characters/${id}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data.data!
}

/**
 * 刪除角色圖片
 * DELETE /api/ai/characters/{id}/images/{index}
 * @param id - 角色 ID
 * @param index - 圖片索引
 * @param type - 圖片類型 (reference | object)
 */
export async function deleteCharacterImage(id: string, index: number, type: CharacterImageType) {
  const response = await apiClient.delete<ApiResponse<Character>>(
    `/api/ai/characters/${id}/images/${index}`,
    {
      params: { type },
    }
  )
  return response.data.data!
}

// ============================================
// 標籤管理
// ============================================

/**
 * 取得所有標籤列表
 * GET /api/ai/characters/tags/list
 * @returns TagItem[] - 包含 tag 名稱和使用次數
 */
export async function getTags() {
  const response = await apiClient.get<ApiResponse<TagItem[]>>('/api/ai/characters/tags/list')
  return response.data.data || []
}
