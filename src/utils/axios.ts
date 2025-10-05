import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types/api'
import { getCookie, COOKIE_NAMES } from './cookies'

// Backend API base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Frontend app base URL (for OAuth callbacks)
export const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
})

// Request interceptor - add auth token from Cookie
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCookie(COOKIE_NAMES.AUTH_TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Server responded with error status
      const apiError = error.response.data
      return Promise.reject(apiError)
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        success: false,
        message: '無法連接到伺服器，請檢查網路連線',
      })
    } else {
      // Something happened in setting up the request
      return Promise.reject({
        success: false,
        message: error.message || '發生未知錯誤',
      })
    }
  },
)

export default apiClient
