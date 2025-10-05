import apiClient from './client'
import type { ApiResponse, User, LoginRequest, RegisterRequest, AuthResponse } from './types'

// ============================================
// 認證相關
// ============================================

/**
 * 使用者註冊
 * POST /api/auth/register
 *
 * @param data - 註冊資料 (email, password, name)
 */
export async function register(data: RegisterRequest) {
  const response = await apiClient.post<AuthResponse>('/api/auth/register', data)
  return response.data
}

/**
 * 使用者登入
 * POST /api/auth/login
 *
 * @param data - 登入資料 (email, password)
 */
export async function login(data: LoginRequest) {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', data)
  return response.data
}

/**
 * 使用者登出
 * POST /api/auth/logout
 */
export async function logout() {
  const response = await apiClient.post<ApiResponse>('/api/auth/logout')
  return response.data
}

/**
 * 刷新認證 Token
 * POST /api/auth/refresh
 */
export async function refreshToken() {
  const response = await apiClient.post<AuthResponse>('/api/auth/refresh')
  return response.data
}

// ============================================
// Google OAuth
// ============================================

/**
 * 驗證前端 Google ID Token
 * POST /api/auth/google
 *
 * @param googleToken - Google ID Token
 */
export async function loginWithGoogle(googleToken: string) {
  const response = await apiClient.post<AuthResponse>('/api/auth/google', { googleToken })
  return response.data
}

// ============================================
// 使用者個人資料
// ============================================

/**
 * 取得使用者個人資料
 * GET /api/auth/profile
 */
export async function getProfile() {
  const response = await apiClient.get<ApiResponse<User>>('/api/auth/profile')
  return response.data.data!
}

/**
 * 更新使用者個人資料
 * PUT /api/auth/profile
 *
 * @param data - 要更新的資料 (name, avatar)
 */
export async function updateProfile(data: { name: string; avatar?: string }) {
  const response = await apiClient.put<ApiResponse>('/api/auth/profile', data)
  return response.data
}

/**
 * 修改密碼
 * PUT /api/auth/password
 *
 * @param data - 密碼修改資料 (currentPassword, newPassword, confirmPassword)
 */
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  const response = await apiClient.put<ApiResponse>('/api/auth/password', data)
  return response.data
}
