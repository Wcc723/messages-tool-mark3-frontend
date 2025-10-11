import type { Role } from './permission'

// API Response Types based on OpenAPI spec

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string
  createdAt: string
  updatedAt?: string
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresAt: string
}

export interface GoogleAuthRequest {
  googleToken: string
}

// Error Response
export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}
