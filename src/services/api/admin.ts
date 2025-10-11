import apiClient from './client'
import type { ApiResponse, AdminUser, UsersListResponse } from './types'
import type { Role, PermissionConfig } from '@/types/permission'

export async function getUsers(params?: {
  page?: number
  limit?: number
  role?: Role
  search?: string
  isActive?: boolean
}) {
  const response = await apiClient.get<ApiResponse<UsersListResponse>>('/api/admin/users', {
    params,
  })
  return response.data.data!
}

export async function getUserById(id: string) {
  const response = await apiClient.get<ApiResponse<AdminUser>>(`/api/admin/users/${id}`)
  return response.data.data!
}

export async function updateUserRole(id: string, role: Role) {
  await apiClient.put<ApiResponse>(`/api/admin/users/${id}/role`, { role })
}

export async function getPermissions() {
  const response = await apiClient.get<ApiResponse<PermissionConfig>>('/api/admin/permissions')
  return response.data.data!
}
