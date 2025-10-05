import apiClient from '@/utils/axios'
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  GoogleAuthRequest,
  User,
} from '@/types/api'

export const authService = {
  /**
   * 使用者登入
   * POST /api/auth/login
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', data)
    return response.data
  },

  /**
   * 使用者註冊
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', data)
    return response.data
  },

  /**
   * Google OAuth 登入
   * POST /api/auth/google
   *
   * 使用 Google Identity Services SDK 取得的 credential (JWT token)
   * 發送到後端驗證並取得應用的 JWT token
   */
  async googleLogin(data: GoogleAuthRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/google', data)
    return response.data
  },

  /**
   * 取得使用者個人資料
   * GET /api/auth/profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/profile')
    return response.data
  },

  /**
   * 登出
   * POST /api/auth/logout
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/api/auth/logout')
    return response.data
  },

  /**
   * 刷新 Token
   * POST /api/auth/refresh
   */
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/refresh')
    return response.data
  },
}
