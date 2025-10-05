import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// API 基礎 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 建立 Axios 實例
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 請求攔截器 - 自動附加 JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()

    // 如果有 token，自動附加到請求 header
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 回應攔截器 - 統一錯誤處理與 Token 刷新
apiClient.interceptors.response.use(
  (response) => {
    // 成功回應直接返回
    return response
  },
  async (error: AxiosError) => {
    const authStore = useAuthStore()
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 401 錯誤處理 - Token 過期
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // 嘗試刷新 Token
        const newToken = await authStore.refreshAuthToken()

        if (newToken && originalRequest.headers) {
          // 更新請求 header 並重試
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh Token 失敗，清除登入狀態並導向登入頁
        authStore.logout()
        router.push('/login')
        return Promise.reject(refreshError)
      }
    }

    // 401 錯誤但已重試過，或無法刷新 Token
    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/login')
    }

    // 400 錯誤 - 請求資料錯誤
    if (error.response?.status === 400) {
      const message = (error.response.data as any)?.message || '請求資料錯誤'
      console.error('Validation Error:', message)
    }

    // 404 錯誤 - 資源不存在
    if (error.response?.status === 404) {
      const message = (error.response.data as any)?.message || '找不到請求的資源'
      console.error('Not Found:', message)
    }

    // 500 錯誤 - 伺服器錯誤
    if (error.response?.status === 500) {
      const message = (error.response.data as any)?.message || '伺服器發生錯誤，請稍後再試'
      console.error('Server Error:', message)
    }

    return Promise.reject(error)
  }
)

// 匯出工具函數
export default apiClient
