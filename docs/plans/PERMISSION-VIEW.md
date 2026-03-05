# 權限管理系統實作計劃

## 📋 專案概述

本文件說明 Discord 自動化排程訊息工具的前端權限管理系統架構與實作計劃。

## 🎯 需求說明

### 核心需求
1. **選單權限控制**：根據使用者角色動態顯示/隱藏側邊欄選單項目
2. **角色管理功能**：管理員能夠查看所有使用者並調整其角色權限
3. **路由權限保護**：防止無權限使用者訪問受限頁面

### 目標使用者
- **系統管理員 (Super Admin)**：完整系統控制權
- **管理員 (Admin)**：使用者與排程管理權
- **訊息管理員 (Manager)**：僅能管理自己的排程
- **無權限使用者 (No Permission)**：僅能查看個人資料

---

## 🏗️ 系統架構

### 權限系統層級

```
┌─────────────────────────────────────────┐
│         使用者介面層 (UI Layer)          │
│  • 選單項目                              │
│  • 按鈕/功能                             │
│  • 頁面內容                              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      權限檢查層 (Permission Layer)       │
│  • v-permission 指令                     │
│  • usePermission Composable             │
│  • 路由守衛                              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      權限狀態層 (State Layer)            │
│  • Permission Store (Pinia)             │
│  • Auth Store (包含 user.role)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      權限配置層 (Config Layer)           │
│  • frontend-permissions.json            │
│  • 角色定義                              │
│  • 功能權限映射                          │
└─────────────────────────────────────────┘
```

---

## 👥 角色與權限對照表

### 1. 系統管理員 (super_admin)

**顯示名稱**：系統管理員
**描述**：系統最高管理員，擁有所有權限

#### 功能權限

| 功能分類 | 權限項目 | 權限 |
|---------|---------|------|
| **使用者管理** | 查看使用者 | ✅ |
| | 查看所有使用者 | ✅ |
| | 創建使用者 | ✅ |
| | 編輯使用者 | ✅ |
| | 編輯所有使用者 | ✅ |
| | 刪除使用者 | ✅ |
| | 管理角色 | ✅ |
| **排程管理** | 查看排程 | ✅ |
| | 查看所有排程 | ✅ |
| | 創建排程 | ✅ |
| | 編輯排程 | ✅ |
| | 編輯所有排程 | ✅ |
| | 刪除排程 | ✅ |
| | 刪除所有排程 | ✅ |
| **Discord 整合** | 查看 Discord 設定 | ✅ |
| | 查看所有 Discord 資料 | ✅ |
| | 發送訊息 | ✅ |
| | 管理 Bot | ✅ |
| **圖片管理** | 查看圖片 | ✅ |
| | 查看所有圖片 | ✅ |
| | 上傳圖片 | ✅ |
| | 刪除圖片 | ✅ |
| | 刪除所有圖片 | ✅ |
| **系統管理** | 查看日誌 | ✅ |
| | 查看儀表板 | ✅ |
| | 管理設定 | ✅ |

#### 導航權限

| 選單項目 | 顯示 |
|---------|------|
| 新增排程 | ✅ |
| 排程編輯 | ✅ |
| 排程行事曆 | ✅ |
| 排程狀態 | ✅ |
| Discord 設定 | ✅ |
| 個人資料 | ✅ |
| **使用者管理** | ✅ |

#### 允許路由
- `/dashboard`
- `/dashboard/schedule/new`
- `/dashboard/schedule/edit/:id`
- `/dashboard/schedule/calendar`
- `/dashboard/schedule/status`
- `/dashboard/discord`
- `/dashboard/profile`
- `/dashboard/admin/users` (管理專用)

---

### 2. 管理員 (admin)

**顯示名稱**：管理員
**描述**：管理員，可管理使用者和系統設定

#### 功能權限

| 功能分類 | 權限項目 | 權限 | 與 Super Admin 差異 |
|---------|---------|------|-------------------|
| **使用者管理** | 管理角色 | ✅ | 相同 |
| **Discord 整合** | 管理 Bot | ❌ | 無法管理 Bot |
| **系統管理** | 管理設定 | ❌ | 無法管理系統設定 |

*其他權限與 Super Admin 相同*

#### 導航權限
與 Super Admin 相同

---

### 3. 訊息管理員 (manager)

**顯示名稱**：訊息管理員
**描述**：Discord 訊息管理員，可管理自己的排程

#### 功能權限

| 功能分類 | 權限項目 | 權限 |
|---------|---------|------|
| **使用者管理** | 查看使用者 | ✅ |
| | 查看所有使用者 | ❌ |
| | 創建使用者 | ❌ |
| | 編輯使用者 | ✅ (僅自己) |
| | 編輯所有使用者 | ❌ |
| | 刪除使用者 | ❌ |
| | 管理角色 | ❌ |
| **排程管理** | 查看排程 | ✅ |
| | 查看所有排程 | ❌ |
| | 創建排程 | ✅ |
| | 編輯排程 | ✅ (僅自己的) |
| | 編輯所有排程 | ❌ |
| | 刪除排程 | ✅ (僅自己的) |
| | 刪除所有排程 | ❌ |
| **Discord 整合** | 查看 Discord 設定 | ✅ |
| | 查看所有 Discord 資料 | ❌ |
| | 發送訊息 | ✅ |
| | 管理 Bot | ❌ |
| **圖片管理** | 查看圖片 | ✅ |
| | 查看所有圖片 | ❌ |
| | 上傳圖片 | ✅ |
| | 刪除圖片 | ✅ (僅自己的) |
| | 刪除所有圖片 | ❌ |
| **系統管理** | 查看日誌 | ❌ |
| | 查看儀表板 | ❌ |
| | 管理設定 | ❌ |

#### 導航權限

| 選單項目 | 顯示 |
|---------|------|
| 新增排程 | ✅ |
| 排程編輯 | ✅ |
| 排程行事曆 | ✅ |
| 排程狀態 | ✅ |
| Discord 設定 | ✅ |
| 個人資料 | ✅ |
| 使用者管理 | ❌ |

#### 允許路由
- `/dashboard`
- `/dashboard/schedule/new`
- `/dashboard/schedule/edit/:id`
- `/dashboard/schedule/calendar`
- `/dashboard/schedule/status`
- `/dashboard/discord`
- `/dashboard/profile`

---

### 4. 無權限使用者 (no_permission)

**顯示名稱**：無權限
**描述**：無權限使用者，僅能查看個人資料
**顏色標記**：#6B7280 (灰色)

#### 功能權限

| 功能分類 | 權限項目 | 權限 |
|---------|---------|------|
| **使用者管理** | 查看使用者 | ✅ (僅自己) |
| | 編輯使用者 | ✅ (僅自己) |
| **所有其他功能** | - | ❌ |

#### 導航權限

| 選單項目 | 顯示 |
|---------|------|
| 新增排程 | ❌ |
| 排程編輯 | ❌ |
| 排程行事曆 | ❌ |
| 排程狀態 | ❌ |
| Discord 設定 | ❌ |
| 個人資料 | ✅ |
| 使用者管理 | ❌ |

#### 允許路由
- `/dashboard`
- `/dashboard/profile`

---

## 🔧 技術實作

### 階段一：核心架構建立

#### 1. 創建權限類型定義 (`src/types/permission.ts`)

```typescript
// 角色類型
export type Role = 'super_admin' | 'admin' | 'manager' | 'no_permission'

// 權限配置介面
export interface PermissionConfig {
  roles: Record<Role, RoleConfig>
  featureDescriptions: Record<string, string>
}

export interface RoleConfig {
  displayName: string
  description: string
  color?: string
  features: FeaturePermissions
  navigation: NavigationPermissions
  routes: RoutePermissions
}

export interface FeaturePermissions {
  users: UserPermissions
  schedules: SchedulePermissions
  discord: DiscordPermissions
  images: ImagePermissions
  system: SystemPermissions
}

// ... 其他權限介面定義
```

#### 2. 創建 Admin API Service (`src/services/api/admin.ts`)

```typescript
import { apiClient } from './client'
import type { Role } from '@/types/permission'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  scheduleLimit: number
  createdAt: string
  updatedAt: string
}

export interface UsersListResponse {
  users: AdminUser[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
  }
}

export const adminApi = {
  // 取得所有使用者列表
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: Role
    search?: string
    isActive?: boolean
  }): Promise<UsersListResponse> {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  // 取得特定使用者詳情
  async getUserById(id: string): Promise<AdminUser> {
    const response = await apiClient.get(`/admin/users/${id}`)
    return response.data
  },

  // 更新使用者角色
  async updateUserRole(id: string, role: Role): Promise<void> {
    await apiClient.put(`/admin/users/${id}/role`, { role })
  },

  // 取得權限配置
  async getPermissions(): Promise<any> {
    const response = await apiClient.get('/admin/permissions')
    return response.data
  },
}
```

#### 3. 創建權限管理 Store (`src/stores/permission.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Role, PermissionConfig, RoleConfig } from '@/types/permission'
import { useAuthStore } from './auth'
import permissionConfig from '../../doc/frontend-permissions.json'

export const usePermissionStore = defineStore('permission', () => {
  const authStore = useAuthStore()

  // 權限配置
  const config = ref<PermissionConfig>(permissionConfig as PermissionConfig)

  // 當前使用者角色
  const currentRole = computed<Role>(() => {
    return (authStore.user?.role as Role) || 'no_permission'
  })

  // 當前角色配置
  const currentRoleConfig = computed<RoleConfig | null>(() => {
    return config.value.roles[currentRole.value] || null
  })

  // 檢查是否有特定功能權限
  function hasPermission(feature: string, action: string): boolean {
    if (!currentRoleConfig.value) return false

    const featurePath = feature.split('.')
    let permissions: any = currentRoleConfig.value.features

    for (const path of featurePath) {
      permissions = permissions?.[path]
      if (!permissions) return false
    }

    return permissions[action] === true
  }

  // 檢查是否有路由訪問權限
  function canAccessRoute(path: string): boolean {
    if (!currentRoleConfig.value) return false

    const allowedPaths = currentRoleConfig.value.routes.allowedPaths

    // 精確匹配
    if (allowedPaths.includes(path)) return true

    // 動態路由匹配
    return allowedPaths.some(allowedPath => {
      const pattern = allowedPath.replace(/:[^/]+/g, '[^/]+')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(path)
    })
  }

  // 檢查導航項目是否應該顯示
  function shouldShowNavItem(navKey: string): boolean {
    if (!currentRoleConfig.value) return false
    return currentRoleConfig.value.navigation[navKey] === true
  }

  // 檢查是否為管理員
  function isAdmin(): boolean {
    return currentRole.value === 'super_admin' || currentRole.value === 'admin'
  }

  // 檢查是否為超級管理員
  function isSuperAdmin(): boolean {
    return currentRole.value === 'super_admin'
  }

  return {
    config,
    currentRole,
    currentRoleConfig,
    hasPermission,
    canAccessRoute,
    shouldShowNavItem,
    isAdmin,
    isSuperAdmin,
  }
})
```

---

### 階段二：選單權限控制

#### 4. 更新側邊欄組件 (`src/components/SidebarNav.vue`)

**實作重點**：
- 使用 `usePermissionStore` 獲取權限配置
- 根據 `navigation` 配置動態過濾選單項目
- 為管理員添加「使用者管理」選單

**改動說明**：
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'

const route = useRoute()
const permissionStore = usePermissionStore()

interface NavItem {
  name: string
  path: string
  icon: string
  permissionKey: string // 對應 navigation 中的 key
}

interface NavGroup {
  title: string
  items: NavItem[]
  showIf?: () => boolean // 整組顯示條件
}

const allNavGroups: NavGroup[] = [
  {
    title: 'Discord 排程',
    items: [
      {
        name: '新增排程',
        path: '/dashboard/schedule/new',
        icon: 'bi-plus-circle',
        permissionKey: 'showScheduleNew'
      },
      {
        name: '排程行事曆',
        path: '/dashboard/schedule/calendar',
        icon: 'bi-calendar-check',
        permissionKey: 'showScheduleCalendar'
      },
      {
        name: '排程狀態',
        path: '/dashboard/schedule/status',
        icon: 'bi-clock-history',
        permissionKey: 'showScheduleStatus'
      },
      {
        name: 'Discord 設定',
        path: '/dashboard/discord',
        icon: 'bi-discord',
        permissionKey: 'showDiscord'
      },
    ],
  },
  {
    title: '系統管理',
    showIf: () => permissionStore.isAdmin(),
    items: [
      {
        name: '使用者管理',
        path: '/dashboard/admin/users',
        icon: 'bi-people',
        permissionKey: 'showUserManagement'
      },
    ],
  },
  {
    title: '帳號設定',
    items: [
      {
        name: '個人資料',
        path: '/dashboard/profile',
        icon: 'bi-person-circle',
        permissionKey: 'showProfile'
      },
    ],
  },
]

// 過濾後的導航組
const navGroups = computed(() => {
  return allNavGroups
    .filter(group => {
      // 檢查整組顯示條件
      if (group.showIf && !group.showIf()) return false

      // 過濾組內項目
      const visibleItems = group.items.filter(item =>
        permissionStore.shouldShowNavItem(item.permissionKey)
      )

      return visibleItems.length > 0
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        permissionStore.shouldShowNavItem(item.permissionKey)
      )
    }))
})
</script>
```

---

### 階段三：路由權限保護

#### 5. 實作路由守衛 (`src/router/index.ts`)

**實作重點**：
- 添加 `beforeEach` 導航守衛
- 檢查使用者是否已登入
- 驗證使用者是否有權限訪問該路由
- 無權限時重定向到首頁或登入頁

**改動說明**：
```typescript
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

const router = createRouter({
  // ... 路由配置
})

// 路由守衛
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const permissionStore = usePermissionStore()

  // 公開路由（不需要登入）
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(to.path)

  // 未登入且訪問受保護路由
  if (!authStore.isAuthenticated && !isPublicRoute) {
    return next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
  }

  // 已登入但訪問登入頁，重定向到首頁
  if (authStore.isAuthenticated && to.path === '/login') {
    return next({ name: 'Dashboard' })
  }

  // 檢查路由權限
  if (authStore.isAuthenticated && !isPublicRoute) {
    // 確保已載入使用者資料
    if (!authStore.user) {
      try {
        await authStore.fetchProfile()
      } catch (error) {
        return next({ name: 'Login' })
      }
    }

    // 檢查路由訪問權限
    if (!permissionStore.canAccessRoute(to.path)) {
      // 無權限，重定向到有權限的首頁
      const defaultRoute = permissionStore.currentRoleConfig?.routes.allowedPaths[0]

      if (defaultRoute) {
        return next({ path: defaultRoute })
      } else {
        return next({ name: 'Login' })
      }
    }
  }

  next()
})

export default router
```

---

### 階段四：使用者管理功能

#### 6. 創建使用者管理頁面 (`src/pages/admin/UserManagementView.vue`)

**功能需求**：
1. 顯示使用者列表（表格形式）
2. 支援分頁、搜尋、角色篩選
3. 顯示角色徽章
4. 提供角色編輯按鈕（點擊開啟 Modal）
5. 顯示使用者狀態（啟用/停用）

**UI 元素**：
- 搜尋框
- 角色篩選下拉選單
- 使用者表格（姓名、Email、角色、狀態、操作）
- 分頁器

**範例結構**：
```vue
<template>
  <div class="p-6">
    <!-- 頁面標題 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">使用者管理</h1>
      <p class="text-gray-600 mt-1">管理系統使用者與權限設定</p>
    </div>

    <!-- 搜尋與篩選 -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋使用者..."
          class="flex-1 px-4 py-2 border rounded-lg"
        />
        <select v-model="roleFilter" class="px-4 py-2 border rounded-lg">
          <option value="">所有角色</option>
          <option value="super_admin">系統管理員</option>
          <option value="admin">管理員</option>
          <option value="manager">訊息管理員</option>
          <option value="no_permission">無權限</option>
        </select>
      </div>
    </div>

    <!-- 使用者表格 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              使用者
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              角色
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              狀態
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id">
            <!-- 使用者資料行 -->
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 角色編輯 Modal -->
    <RoleEditModal
      v-if="showRoleModal"
      :user="selectedUser"
      @close="showRoleModal = false"
      @saved="handleRoleSaved"
    />
  </div>
</template>
```

#### 7. 創建角色編輯 Modal (`src/components/admin/RoleEditModal.vue`)

**功能需求**：
1. 顯示使用者資訊
2. 角色選擇下拉選單
3. 顯示選中角色的權限預覽
4. 確認/取消按鈕
5. 變更警告提示

**範例結構**：
```vue
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
      <!-- Modal 標題 -->
      <div class="px-6 py-4 border-b">
        <h2 class="text-xl font-bold">編輯使用者角色</h2>
      </div>

      <!-- Modal 內容 -->
      <div class="px-6 py-4">
        <!-- 使用者資訊 -->
        <div class="mb-4">
          <p class="text-gray-600">使用者：{{ user.name }}</p>
          <p class="text-gray-600">Email：{{ user.email }}</p>
        </div>

        <!-- 角色選擇 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            選擇角色
          </label>
          <select v-model="selectedRole" class="w-full px-4 py-2 border rounded-lg">
            <option value="super_admin">系統管理員</option>
            <option value="admin">管理員</option>
            <option value="manager">訊息管理員</option>
            <option value="no_permission">無權限</option>
          </select>
        </div>

        <!-- 權限預覽 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-medium mb-2">權限預覽</h3>
          <div class="text-sm text-gray-600">
            <!-- 顯示選中角色的權限列表 -->
          </div>
        </div>

        <!-- 警告提示 -->
        <div v-if="showWarning" class="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p class="text-sm text-yellow-700">
            ⚠️ 變更角色將立即生效，該使用者的權限將會改變。
          </p>
        </div>
      </div>

      <!-- Modal 按鈕 -->
      <div class="px-6 py-4 border-t flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          取消
        </button>
        <button @click="handleSave" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          確認變更
        </button>
      </div>
    </div>
  </div>
</template>
```

---

### 階段五：權限 Composables

#### 8. 創建權限 Composable (`src/composables/usePermission.ts`)

```typescript
import { usePermissionStore } from '@/stores/permission'

export function usePermission() {
  const permissionStore = usePermissionStore()

  return {
    hasPermission: permissionStore.hasPermission,
    canAccessRoute: permissionStore.canAccessRoute,
    shouldShowNavItem: permissionStore.shouldShowNavItem,
    isAdmin: permissionStore.isAdmin,
    isSuperAdmin: permissionStore.isSuperAdmin,
    currentRole: permissionStore.currentRole,
    currentRoleConfig: permissionStore.currentRoleConfig,
  }
}

// Vue 指令：v-permission
export const vPermission = {
  mounted(el: HTMLElement, binding: { value: { feature: string; action: string } }) {
    const permissionStore = usePermissionStore()
    const { feature, action } = binding.value

    if (!permissionStore.hasPermission(feature, action)) {
      el.style.display = 'none'
    }
  },
}
```

**使用範例**：
```vue
<template>
  <!-- 使用 Composable -->
  <button v-if="hasPermission('users', 'canManageRoles')">
    編輯角色
  </button>

  <!-- 使用指令 -->
  <button v-permission="{ feature: 'users', action: 'canManageRoles' }">
    編輯角色
  </button>
</template>

<script setup lang="ts">
import { usePermission } from '@/composables/usePermission'

const { hasPermission, isAdmin } = usePermission()
</script>
```

---

### 階段六：更新 User 類型定義

#### 9. 更新 User 介面 (`src/types/api.ts` 或 `src/services/api/types.ts`)

```typescript
import type { Role } from './permission'

export interface User {
  id: string
  email: string
  name: string
  role: Role // 更新為 Role 類型
  avatar?: string
  createdAt: string
  updatedAt?: string
}
```

---

## 📱 使用者操作流程

### 管理員操作流程

```
1. 登入系統
   ↓
2. 從側邊欄點擊「使用者管理」
   ↓
3. 查看使用者列表
   • 可使用搜尋框搜尋使用者
   • 可使用角色篩選器篩選
   ↓
4. 點擊「編輯角色」按鈕
   ↓
5. 在彈出的 Modal 中選擇新角色
   • 查看權限預覽
   • 閱讀警告提示
   ↓
6. 點擊「確認變更」
   ↓
7. 系統更新使用者角色
   ↓
8. 列表自動更新，顯示新角色
```

### 一般使用者登入流程

```
1. 使用者登入
   ↓
2. 系統檢查使用者角色
   ↓
3. 載入對應的權限配置
   ↓
4. 根據權限：
   • 顯示可用的選單項目
   • 隱藏無權限的選單
   • 設定路由訪問限制
   ↓
5. 使用者看到符合其角色的介面
```

---

## 🔒 安全性考量

### 前端安全

1. **雙重驗證**：
   - UI 層：隱藏無權限的按鈕和選單
   - 路由層：阻止未授權的路由訪問

2. **權限檢查時機**：
   - 登入後立即載入權限
   - 路由切換前驗證權限
   - 關鍵操作前再次確認權限

3. **狀態同步**：
   - 使用者角色變更後，通知前端重新載入權限
   - 定期刷新 Token 確保權限最新

### 後端安全（API 層）

⚠️ **重要提醒**：前端權限控制僅用於 UI 展示，**不能取代後端驗證**。

後端 API 必須實作：
1. 每個 API 請求都驗證 JWT Token
2. 檢查使用者角色是否有權限執行該操作
3. 對資源進行所有權驗證（例如：manager 只能編輯自己的排程）
4. 記錄所有權限相關的操作日誌

---

## 🧪 測試計劃

### 功能測試

| 測試項目 | 測試內容 | 預期結果 |
|---------|---------|---------|
| **登入測試** | 不同角色登入 | 顯示對應權限的介面 |
| **選單顯示** | 檢查各角色的選單項目 | 僅顯示有權限的選單 |
| **路由保護** | 嘗試訪問無權限路由 | 自動重定向到有權限頁面 |
| **角色編輯** | 管理員更改使用者角色 | 成功更新並刷新列表 |
| **權限檢查** | 無權限使用者嘗試管理操作 | 被阻止並顯示提示 |

### 測試案例

#### 案例 1：Manager 無法訪問使用者管理
```
1. 以 manager 角色登入
2. 確認側邊欄沒有「使用者管理」選單
3. 嘗試直接訪問 /dashboard/admin/users
4. 應被重定向到 /dashboard/schedule/new
```

#### 案例 2：Admin 成功更改使用者角色
```
1. 以 admin 角色登入
2. 點擊「使用者管理」
3. 選擇一個 manager 使用者
4. 點擊「編輯角色」
5. 變更為 no_permission
6. 點擊「確認變更」
7. 驗證 API 呼叫成功
8. 驗證列表中角色已更新
```

#### 案例 3：No Permission 使用者僅能訪問個人資料
```
1. 以 no_permission 角色登入
2. 確認僅顯示「個人資料」選單
3. 確認無法訪問任何排程頁面
4. 確認可以更新自己的個人資料
```

---

## 📊 實作檢查清單

### 核心功能

- [ ] 創建權限類型定義 (`src/types/permission.ts`)
- [ ] 創建 Admin API Service (`src/services/api/admin.ts`)
- [ ] 創建權限 Store (`src/stores/permission.ts`)
- [ ] 更新 Auth Store 的 User 類型
- [ ] 實作權限 Composable (`src/composables/usePermission.ts`)

### UI 組件

- [ ] 更新側邊欄選單權限控制 (`src/components/SidebarNav.vue`)
- [ ] 創建使用者管理頁面 (`src/pages/admin/UserManagementView.vue`)
- [ ] 創建角色編輯 Modal (`src/components/admin/RoleEditModal.vue`)
- [ ] 創建角色徽章組件 (`src/components/RoleBadge.vue`)

### 路由與守衛

- [ ] 實作路由守衛 (`src/router/index.ts`)
- [ ] 新增使用者管理路由
- [ ] 為所有路由添加權限 meta 資訊

### 整合與測試

- [ ] 在 `main.ts` 中註冊 `v-permission` 指令
- [ ] 更新 DashboardLayout 添加管理員選單
- [ ] 撰寫單元測試
- [ ] 撰寫 E2E 測試
- [ ] 測試不同角色的權限流程

---

## 🚀 部署注意事項

### 環境變數

確保設定以下環境變數：
```env
VITE_API_BASE_URL=你的API地址
```

### 建置檢查

1. 確認 `doc/frontend-permissions.json` 檔案已包含在建置輸出
2. 確認所有權限相關的類型定義無錯誤
3. 執行完整的 lint 和 type-check

### 部署後驗證

1. 測試不同角色的登入流程
2. 驗證路由守衛是否正常運作
3. 確認 API 權限與前端權限一致
4. 檢查錯誤處理和使用者提示

---

## 📚 開發者指南

### 新增新角色

1. 更新 `doc/frontend-permissions.json`
2. 在 `src/types/permission.ts` 中添加新角色類型
3. 更新後端 API 的角色列舉
4. 在 UI 組件中添加新角色的顯示選項

### 新增新權限

1. 在 `frontend-permissions.json` 的對應角色中添加權限
2. 更新 `FeaturePermissions` 介面
3. 在組件中使用 `hasPermission()` 檢查新權限
4. 確保後端 API 也實作對應權限檢查

### 權限檢查最佳實踐

```typescript
// ✅ 好的做法
const canEdit = permissionStore.hasPermission('schedules', 'canEdit')

// ❌ 避免硬編碼角色檢查
if (user.role === 'admin') {
  // 不推薦
}

// ✅ 使用語義化的權限檢查
if (permissionStore.isAdmin()) {
  // 推薦
}
```

---

## 🔄 未來擴展計劃

### 階段一（當前）
- ✅ 基礎權限系統
- ✅ 角色管理功能
- ✅ 選單與路由控制

### 階段二（規劃中）
- [ ] 細粒度權限控制（欄位級別）
- [ ] 權限審計日誌
- [ ] 權限變更通知

### 階段三（未來）
- [ ] 自定義角色
- [ ] 權限組合與繼承
- [ ] 臨時權限授予

---

## 📞 支援與聯絡

如有任何問題或建議，請聯絡：
- **開發團隊**：[您的郵箱]
- **技術文件**：參考本文件
- **Issue 回報**：透過專案 Issue Tracker

---

## 📝 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|-----|------|---------|------|
| 1.0.0 | 2025-01-11 | 初始版本，完整權限系統規劃 | Claude |

---

**文件狀態**：✅ 已完成
**最後更新**：2025-01-11
**維護者**：開發團隊
