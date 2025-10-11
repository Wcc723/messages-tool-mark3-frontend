<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import RoleBadge from '@/components/RoleBadge.vue'
import RoleEditModal from '@/components/admin/RoleEditModal.vue'
import { adminApi } from '@/services/api'
import type { AdminUser } from '@/services/api'
import type { Role } from '@/types/permission'
import { usePermission } from '@/composables/usePermission'

const users = ref<AdminUser[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const roleFilter = ref<Role | ''>('')

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 10,
})

const showRoleModal = ref(false)
const selectedUser = ref<AdminUser | null>(null)

const { hasPermission } = usePermission()
const canManageRoles = computed(() => hasPermission('users', 'canManageRoles'))

function openRoleModal(user: AdminUser) {
  if (!canManageRoles.value) return
  selectedUser.value = user
  showRoleModal.value = true
}

function closeRoleModal() {
  showRoleModal.value = false
  selectedUser.value = null
}

async function fetchUsers(page = pagination.value.currentPage) {
  isLoading.value = true
  error.value = null

  try {
    const response = await adminApi.getUsers({
      page,
      limit: pagination.value.limit,
      search: searchQuery.value || undefined,
      role: roleFilter.value || undefined,
    })

    users.value = response.users
    pagination.value = {
      ...pagination.value,
      ...response.pagination,
    }
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      '載入使用者列表時發生錯誤，請稍後再試'
    error.value = message
  } finally {
    isLoading.value = false
  }
}

function changePage(page: number) {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.currentPage) {
    return
  }
  pagination.value.currentPage = page
  fetchUsers(page)
}

function handleRoleSaved(_: { role: Role }) {
  fetchUsers()
}

const hasUsers = computed(() => users.value.length > 0)

watch([searchQuery, roleFilter], () => {
  pagination.value.currentPage = 1
  fetchUsers(1)
})

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-gray-800">使用者管理</h1>
      <p class="text-gray-600 mt-1">檢視並調整系統使用者的角色與權限</p>
    </header>

    <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="flex-1 flex items-center gap-3">
          <span class="relative flex-1">
            <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋姓名或 Email..."
              class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </span>
          <select
            v-model="roleFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">所有角色</option>
            <option value="super_admin">系統管理員</option>
            <option value="admin">管理員</option>
            <option value="manager">訊息管理員</option>
            <option value="no_permission">無權限</option>
          </select>
        </div>
        <div v-if="error" class="text-sm text-red-500">
          {{ error }}
        </div>
      </div>
    </section>

    <section class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="relative">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                使用者
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="isLoading">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                <div class="inline-flex items-center gap-2 text-indigo-600">
                  <i class="bi bi-arrow-repeat animate-spin text-lg"></i>
                  讀取使用者資料中...
                </div>
              </td>
            </tr>
            <tr v-else-if="!hasUsers">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                <div class="flex flex-col items-center gap-2">
                  <i class="bi bi-people text-3xl text-gray-300"></i>
                  <span>尚無符合條件的使用者</span>
                </div>
              </td>
            </tr>
            <tr v-else v-for="user in users" :key="user.id" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ user.name }}</p>
                  <p class="text-xs text-gray-500">建立於 {{ new Date(user.createdAt).toLocaleDateString() }}</p>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <RoleBadge :role="user.role" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-2 text-sm font-medium"
                  :class="user.isActive ? 'text-emerald-600' : 'text-red-500'"
                >
                  <span class="w-2 h-2 rounded-full" :class="user.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  {{ user.isActive ? '啟用' : '停用' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button
                  v-if="canManageRoles"
                  type="button"
                  class="inline-flex items-center gap-2 px-3 py-2 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                  @click="openRoleModal(user)"
                >
                  <i class="bi bi-shield-lock"></i>
                  編輯角色
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="!isLoading && hasUsers"
          class="px-6 py-3 border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600"
        >
          <div>
            共 {{ pagination.totalCount }} 位使用者，第 {{ pagination.currentPage }} / {{ pagination.totalPages }} 頁
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              :disabled="pagination.currentPage === 1"
              @click="changePage(pagination.currentPage - 1)"
            >
              上一頁
            </button>
            <span class="px-2">
              {{ pagination.currentPage }} / {{ pagination.totalPages }}
            </span>
            <button
              type="button"
              class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              :disabled="pagination.currentPage === pagination.totalPages"
              @click="changePage(pagination.currentPage + 1)"
            >
              下一頁
            </button>
          </div>
        </div>
      </div>
    </section>

    <RoleEditModal
      v-if="showRoleModal && selectedUser"
      :user="selectedUser"
      @close="closeRoleModal"
      @saved="handleRoleSaved"
    />
  </div>
</template>
