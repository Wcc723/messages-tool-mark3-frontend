# 專案架構

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Linting**: ESLint + oxlint
- **Formatting**: Prettier

## 目錄結構

```
src/
  main.ts                    # 應用程式進入點（Pinia、Router、全域樣式）
  App.vue                    # 根元件
  assets/                    # 靜態資源與全域樣式（main.css）
  components/                # 共用元件
    admin/                   # 管理後台元件
    ai/                      # AI 圖片生成元件
  composables/               # 組合式函式（useToast、usePermission、useImageGeneration）
  pages/                     # 頁面元件（對應路由）
    admin/                   # 管理後台頁面
    ai/                      # AI 功能頁面
    checkin/                 # 打卡功能頁面
  router/                    # Vue Router 設定
  services/api/              # API 服務層
    client.ts                # Axios 實例與攔截器
    types.ts                 # 所有 API 型別定義
    index.ts                 # barrel export
    auth.ts                  # 認證 API
    discord.ts               # Discord API
    schedule.ts              # 排程 API
    storage.ts               # 檔案上傳 API
    admin.ts                 # 管理員 API
    checkin.ts               # 打卡管理 API
    checkinPublic.ts         # 打卡公開 API
    aiCharacter.ts           # AI 角色 API
    aiAdmin.ts               # AI 管理 API
    aiSessions.ts            # AI Session API
  stores/                    # Pinia stores
    auth.ts                  # 認證狀態
    discord.ts               # Discord 狀態
    schedule.ts              # 排程狀態
    checkin.ts               # 打卡狀態
    permission.ts            # 權限狀態
    aiCharacter.ts           # AI 角色狀態
    aiGeneration.ts          # AI 生成狀態
  types/                     # 全域型別定義
  utils/                     # 工具函式
```

## 路由架構

- 使用 **Hash History** 模式（`createWebHashHistory`）
- 路由定義於 `src/router/index.ts`
- 所有需登入頁面皆在 `/dashboard` 底下作為子路由

### Route Meta

```typescript
interface RouteMeta {
  requiresAuth?: boolean       // 是否需要登入
  permissionPath?: string      // 權限檢查路徑
  isRootRedirect?: boolean     // 根路徑重導向
  isDashboardRedirect?: boolean // Dashboard 重導向
}
```

### Navigation Guard

`beforeEach` guard 處理流程：
1. 根路徑重導向（已登入 → 第一個有權限頁面；未登入 → Login）
2. 公開路由直接放行
3. 未持有 token 導向 Login
4. 自動 `fetchProfile`（若 user 為 null）
5. Dashboard 根路徑重導向至第一個有權限子頁
6. 透過 `permissionStore.canAccessRoute()` 檢查路由權限

## API 層架構

### apiClient（Axios 實例）

定義於 `src/services/api/client.ts`：
- Base URL 讀取自 `VITE_API_BASE_URL` 環境變數
- Timeout: 30 秒

### Request Interceptor
- 自動附加 `Authorization: Bearer {token}` header

### Response Interceptor
- **401**：嘗試 refresh token → 成功則重送原始請求；失敗則 logout + 導向 Login
- **400/404/500**：console.error 記錄錯誤訊息

### 模組化服務

每個功能 domain 一個檔案（auth.ts、discord.ts 等），透過 `index.ts` barrel export：
```typescript
export * as authApi from './auth'
export * as discordApi from './discord'
// ...
```

## 認證流程

1. **登入**：Email/Password 或 Google OAuth → 取得 JWT + Refresh Token
2. **Token 儲存**：JWT 存入 Cookie（7 天）、Refresh Token 存入 Cookie（30 天）
3. **自動附加**：Request interceptor 自動附加 Bearer token
4. **Token 刷新**：401 時自動呼叫 `/api/auth/refresh` 取得新 token
5. **登出**：呼叫 logout API + 清除 Cookie + 清除 Pinia state

## 狀態管理模式

所有 Store 使用 Pinia Composition API（setup function）模式：

```typescript
export const useXxxStore = defineStore('xxx', () => {
  // State: ref()
  const items = ref<Item[]>([])
  const isLoading = ref(false)

  // Getters: computed()
  const itemCount = computed(() => items.value.length)

  // Actions: plain functions
  async function fetchItems() { ... }

  return { items, isLoading, itemCount, fetchItems }
})
```
