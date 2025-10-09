import apiClient from './client'
import type { ApiResponse, StorageUploadImageResponse } from './types'

/**
 * 上傳圖片至 Firebase Storage
 */
export async function uploadImage(image: File) {
  const formData = new FormData()
  formData.append('image', image)

  const response = await apiClient.post<ApiResponse<StorageUploadImageResponse>>(
    '/api/storage/upload-image',
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
 * 刪除 Firebase Storage 圖片
 */
export async function deleteImage(filePath: string) {
  const encodedPath = encodeURIComponent(filePath)
  const response = await apiClient.delete<ApiResponse>(`/api/storage/images/${encodedPath}`)
  return response.data
}
