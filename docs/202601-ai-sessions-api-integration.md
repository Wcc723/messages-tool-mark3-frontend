# AI 圖片生成功能 - 前端串接開發文件

> **適用對象**：前端開發人員
> **更新日期**：2026-01-27
> **API 規格**：`openapi/ai-sessions.json`

## 目錄

1. [概述](#概述)
2. [現有架構分析](#現有架構分析)
3. [需新增的 REST API 服務](#需新增的-rest-api-服務)
4. [TypeScript 型別定義](#typescript-型別定義)
5. [頁面整合：恢復過去 Session](#頁面整合恢復過去-session)
6. [WebSocket 串接](#websocket-串接)
7. [完整使用流程](#完整使用流程)
8. [錯誤處理](#錯誤處理)

---

## 概述

本專案已具備 AI 圖片生成的基礎架構，包含：
- WebSocket 連線管理 (`/src/services/imageGenerationSocket.ts`)
- 完整型別定義 (`/src/types/ai-generation.ts`)
- AI 角色管理 API (`/src/services/api/aiCharacter.ts`)
- AI 管理員統計 API (`/src/services/api/aiAdmin.ts`)

需新增：**REST API 服務**（`/src/services/api/aiSessions.ts`）用於歷史記錄查詢與 Session 管理。

### 必要條件
- 使用者必須已登入並取得 JWT Token
- 使用者角色需為 `manager` 以上（具備 `ai_generation:use` 權限）

---

## 現有架構分析

### 檔案結構
```
src/
├── services/
│   ├── api/
│   │   ├── client.ts              # Axios 實例（自動帶入 JWT）
│   │   ├── types.ts               # API 型別定義
│   │   ├── aiCharacter.ts         # AI 角色管理
│   │   ├── aiAdmin.ts             # AI 管理員統計
│   │   └── aiSessions.ts          # 🆕 需新增：Session & 歷史記錄
│   └── imageGenerationSocket.ts   # ✅ 已存在：WebSocket 服務
├── types/
│   └── ai-generation.ts           # ✅ 已存在：AI 相關型別
├── stores/
│   └── aiGeneration.ts            # ✅ 已存在：生成狀態管理
└── composables/
    └── useImageGeneration.ts      # ✅ 已存在：組合式函式
```

### 現有 API Client 使用方式
```typescript
// /src/services/api/client.ts 已配置：
// - 自動從 auth store 取得 token
// - 自動加入 Authorization header
// - 401 自動 refresh token
// - 統一錯誤處理

import apiClient from './client'

// 使用範例
const response = await apiClient.get('/api/ai/history')
```

---

## 需新增的 REST API 服務

### 建立檔案：`/src/services/api/aiSessions.ts`

```typescript
import apiClient from './client'
import type {
  GenerationHistoryItem,
  GenerationHistoryQueryParams,
  SessionItem,
  SessionQueryParams,
  SessionDetail,
  PaginatedResponse,
} from '@/types/ai-generation'

/**
 * 取得所有生成歷史（團隊共用）
 * GET /api/ai/history
 */
export async function getGenerationHistory(
  params?: GenerationHistoryQueryParams
): Promise<PaginatedResponse<GenerationHistoryItem>> {
  const response = await apiClient.get('/api/ai/history', { params })
  return response.data
}

/**
 * 取得單筆生成記錄詳情
 * GET /api/ai/history/:id
 */
export async function getHistoryDetail(historyId: string) {
  const response = await apiClient.get(`/api/ai/history/${historyId}`)
  return response.data
}

/**
 * 取得所有 Sessions（團隊共用）
 * GET /api/ai/sessions
 */
export async function getSessions(
  params?: SessionQueryParams
): Promise<PaginatedResponse<SessionItem>> {
  const response = await apiClient.get('/api/ai/sessions', { params })
  return response.data
}

/**
 * 取得 Session 詳情與完整對話歷史
 * GET /api/ai/sessions/:id
 */
export async function getSessionDetail(sessionId: string): Promise<{
  success: boolean
  data: SessionDetail
}> {
  const response = await apiClient.get(`/api/ai/sessions/${sessionId}`)
  return response.data
}

/**
 * 刪除 Session
 * DELETE /api/ai/sessions/:id
 * @param keepHistory - 是否保留生成記錄（預設 false）
 */
export async function deleteSession(
  sessionId: string,
  keepHistory = false
): Promise<{
  success: boolean
  message: string
  data: { sessionId: string; deletedHistoryCount: number }
}> {
  const response = await apiClient.delete(`/api/ai/sessions/${sessionId}`, {
    params: { keepHistory },
  })
  return response.data
}
```

### 匯出更新：`/src/services/api/index.ts`

```typescript
// 新增匯出
export * as aiSessionsApi from './aiSessions'
```

---

## TypeScript 型別定義

### 需新增至 `/src/types/ai-generation.ts`

```typescript
// ============================================
// REST API 專用型別（Session 查詢）
// ============================================

// 通用分頁回應
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}

// Session 查詢參數
export interface SessionQueryParams {
  userId?: string
  status?: SessionStatus
  characterId?: string
  page?: number
  limit?: number
}

// Session 列表項目（對應 OpenAPI SessionItem）
export interface SessionItem {
  id: string
  userId: string
  model: AIModel
  status: SessionStatus
  settings: SessionSettings
  characterId: string | null
  character: Character | null
  user: {
    id: string
    displayName: string
    email: string
  }
  generationCount: number
  totalTokens: number
  createdAt: string
  expiresAt: string
}

// Session 統計資訊
export interface SessionStatistics {
  generationCount: number
  successCount: number
  failedCount: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
}

// Session 詳情（含對話歷史）
export interface SessionDetail {
  id: string
  userId: string
  model: AIModel
  status: SessionStatus
  settings: SessionSettings
  character: Character | null
  user: {
    id: string
    displayName: string
    email: string
  }
  statistics: SessionStatistics
  history: GenerationHistoryItem[]
  createdAt: string
  expiresAt: string
}

// 生成歷史列表項目（更新，對應 OpenAPI）
export interface GenerationHistoryItem {
  id: string
  sessionId: string
  userId: string
  prompt: string
  responseText: string | null
  generatedImageUrl: string | null
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  status: GenerationStatus
  errorMessage: string | null
  metadata: Record<string, unknown>
  createdAt: string
  user: {
    id: string
    displayName: string
    email: string
  }
  session?: {
    id: string
    model: AIModel
  }
}

// 生成歷史查詢參數（更新）
export interface GenerationHistoryQueryParams {
  userId?: string
  sessionId?: string
  status?: GenerationStatus
  startDate?: string  // YYYY-MM-DD
  endDate?: string    // YYYY-MM-DD
  page?: number
  limit?: number      // 最大 100
}
```

---

## 頁面整合：恢復過去 Session

### 功能需求

在 `AiGeneratorView.vue` 頁面中新增「恢復過去對話」功能：
1. 使用者可透過彈出視窗選擇過去的 Session
2. 支援恢復 **active** 與 **completed** 狀態的 Session
3. Active Session：直接恢復，繼續對話
4. Completed Session：建立新 Session 並載入歷史對話記錄

### UI 設計

#### 1. 觸發按鈕位置

在「開始 Session」按鈕下方新增連結：

```html
<!-- 在「開始 Session」按鈕後面新增 -->
<button
  type="button"
  :disabled="!isAuthenticated"
  class="w-full py-2.5 rounded-lg font-medium bg-indigo-600 text-white"
  @click="handleStartSession"
>
  開始 Session
</button>

<!-- 🆕 新增：恢復過去對話連結 -->
<div class="text-center mt-3">
  <button
    type="button"
    class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
    :disabled="!isAuthenticated"
    @click="showSessionSelectModal = true"
  >
    或 恢復過去對話
  </button>
</div>
```

#### 2. Session 選擇彈窗元件

建立新元件：`/src/components/ai/SessionSelectModal.vue`

**彈窗內容：**
- 標題：「選擇要恢復的對話」
- Session 列表（顯示 active + completed）
- 每個 Session 卡片顯示：
  - 最後一張生成圖片縮圖（左側，64x64）
  - 模型名稱（Nano Banana / Nano Banana Pro）
  - 角色名稱（如有使用）
  - 生成次數
  - 建立時間
  - 狀態標籤（active: 綠色 / completed: 灰色）
- 分頁控制
- 關閉按鈕

**Props：**
```typescript
interface Props {
  modelValue: boolean  // v-model 控制顯示
}
```

**Emits：**
```typescript
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', session: SessionItem): void
}
```

#### 3. 彈窗 UI 範例

```html
<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">選擇要恢復的對話</h2>
          <button @click="close" class="p-1 hover:bg-gray-100 rounded">
            <i class="bi-x-lg"></i>
          </button>
        </div>

        <!-- Session List -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="isLoading" class="text-center py-8 text-gray-500">
            載入中...
          </div>

          <div v-else-if="sessions.length === 0" class="text-center py-8 text-gray-500">
            目前沒有可恢復的對話
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="session in sessions"
              :key="session.id"
              class="w-full flex items-center gap-4 p-3 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
              @click="handleSelect(session)"
            >
              <!-- 縮圖 -->
              <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  v-if="session.lastImage"
                  :src="session.lastImage"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  <i class="bi-image text-2xl"></i>
                </div>
              </div>

              <!-- 資訊 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">
                    {{ session.model === 'nano-banana' ? 'Nano Banana' : 'Nano Banana Pro' }}
                  </span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="{
                      'bg-green-100 text-green-700': session.status === 'active',
                      'bg-gray-100 text-gray-600': session.status === 'completed',
                    }"
                  >
                    {{ session.status === 'active' ? '進行中' : '已完成' }}
                  </span>
                </div>
                <p v-if="session.character" class="text-sm text-gray-600 truncate">
                  角色：{{ session.character.name }}
                </p>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span><i class="bi-images"></i> {{ session.generationCount }} 張</span>
                  <span>{{ formatDate(session.createdAt) }}</span>
                </div>
              </div>

              <i class="bi-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="p-4 border-t flex justify-center gap-2">
          <button
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded disabled:opacity-50"
            @click="currentPage--"
          >
            上一頁
          </button>
          <span class="px-3 py-1">{{ currentPage }} / {{ totalPages }}</span>
          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border rounded disabled:opacity-50"
            @click="currentPage++"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

### 整合邏輯

#### AiGeneratorView.vue 修改

```typescript
// 新增 imports
import SessionSelectModal from '@/components/ai/SessionSelectModal.vue'
import { aiSessionsApi } from '@/services/api'
import type { SessionItem, SessionDetail } from '@/types/ai-generation'

// 新增狀態
const showSessionSelectModal = ref(false)

// 處理 Session 選擇
async function handleSessionSelect(session: SessionItem) {
  showSessionSelectModal.value = false

  if (session.status === 'active') {
    // Active Session：直接恢復
    aiGenerationStore.resumeSession(session.id)
  } else {
    // Completed Session：取得歷史後建立新 Session
    const detail = await aiSessionsApi.getSessionDetail(session.id)

    // 1. 載入歷史對話到 UI（將歷史記錄顯示在生成結果區）
    aiGenerationStore.loadHistoryFromSession(detail.data.history)

    // 2. 使用相同設定建立新 Session
    aiGenerationStore.startSession(
      session.model,
      session.characterId ?? undefined,
      session.settings
    )
  }
}
```

#### Store 更新：`/src/stores/aiGeneration.ts`

新增 action 處理歷史記錄載入：

```typescript
/**
 * 從 Session 詳情載入歷史對話記錄
 * 用於恢復 completed Session 時顯示既有對話
 */
function loadHistoryFromSession(history: GenerationHistoryItem[]) {
  // 轉換為 GenerationResult 格式並載入
  generationHistory.value = history.map(item => ({
    sessionId: item.sessionId,
    success: item.status === 'success',
    historyId: item.id,
    imageUrl: item.generatedImageUrl ?? undefined,
    text: item.responseText ?? undefined,
    prompt: item.prompt,
    inputTokens: item.inputTokens,
    outputTokens: item.outputTokens,
    status: item.status,
    errorMessage: item.errorMessage ?? undefined,
    generatedAt: item.createdAt,
  }))
}

// 在 return 中匯出
return {
  // ... 現有匯出
  loadHistoryFromSession,
}
```

### API 呼叫：取得 Session 列表

彈窗開啟時載入 Session 列表：

```typescript
// SessionSelectModal.vue 內部
const sessions = ref<SessionItem[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

async function fetchSessions() {
  isLoading.value = true
  try {
    // 取得 active 和 completed 狀態的 Sessions
    // 注意：API 可能需要分兩次呼叫，或支援多狀態篩選
    const [activeResult, completedResult] = await Promise.all([
      aiSessionsApi.getSessions({ status: 'active', page: currentPage.value, limit: 10 }),
      aiSessionsApi.getSessions({ status: 'completed', page: currentPage.value, limit: 10 }),
    ])

    // 合併並排序（active 在前）
    sessions.value = [
      ...activeResult.data,
      ...completedResult.data,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 計算總頁數（簡化處理）
    totalPages.value = Math.max(activeResult.pagination.totalPages, completedResult.pagination.totalPages)
  } catch (error) {
    console.error('載入 Sessions 失敗:', error)
  } finally {
    isLoading.value = false
  }
}

// 監聽彈窗開啟
watch(() => props.modelValue, (visible) => {
  if (visible) {
    currentPage.value = 1
    fetchSessions()
  }
})

// 監聽分頁變化
watch(currentPage, fetchSessions)
```

### 取得最後一張圖片（lastImage）

Session 列表 API 預設不回傳最後一張圖片，需要額外處理：

**方案 A：後端支援**（推薦）
請後端在 SessionItem 中新增 `lastGeneratedImage` 欄位。

**方案 B：前端額外請求**
```typescript
// 取得 Session 列表後，額外取得每個 Session 的最後一張圖片
async function enrichSessionsWithImages(sessions: SessionItem[]) {
  const enriched = await Promise.all(
    sessions.map(async (session) => {
      if (session.generationCount > 0) {
        const history = await aiSessionsApi.getGenerationHistory({
          sessionId: session.id,
          status: 'success',
          limit: 1,
        })
        return {
          ...session,
          lastImage: history.data[0]?.generatedImageUrl ?? null,
        }
      }
      return { ...session, lastImage: null }
    })
  )
  return enriched
}
```

---

## WebSocket 串接

### 現有架構

WebSocket 服務已完整實作於 `/src/services/imageGenerationSocket.ts`。

#### 連線建立
```typescript
import { imageGenerationSocket } from '@/services/imageGenerationSocket'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 連線
imageGenerationSocket.connect(authStore.token!)
```

#### 事件監聽
```typescript
imageGenerationSocket.setEventHandlers({
  onAuthenticated: (user) => {
    console.log('認證成功', user)
  },
  onSessionCreated: (data) => {
    console.log('Session 已建立', data.session)
  },
  onSessionResumed: (data) => {
    console.log('Session 已恢復', data.session)
  },
  onGenerating: (data) => {
    console.log('生成中...', data.message)
  },
  onGenerated: (result) => {
    if (result.success) {
      console.log('圖片 URL:', result.imageUrl)
      console.log('AI 回應:', result.text)
      console.log('使用設定:', result.settings)  // 🆕 本次實際使用的設定
    } else {
      console.error('生成失敗:', result.errorMessage)
    }
  },
  onError: (error) => {
    console.error(`錯誤 [${error.type}]:`, error.message)
  },
})
```

#### Session 管理
```typescript
// 開始新 Session
imageGenerationSocket.startSession(
  'nano-banana',           // 模型
  'character-uuid',        // 角色 ID（選填）
  { aspectRatio: '16:9' }  // 設定（選填）
)

// 恢復既有 Session
imageGenerationSocket.resumeSession('session-uuid')

// 發送生成請求（基本）
imageGenerationSocket.generate('session-uuid', '一隻穿太空服的貓咪')

// 發送生成請求（帶參考圖片）
imageGenerationSocket.generate(
  'session-uuid',
  '把這隻貓放到月球上',
  { url: 'https://example.com/cat.jpg', description: '一隻橘色的貓' }
)

// 發送生成請求（覆蓋 Session 預設設定）🆕
imageGenerationSocket.generate(
  'session-uuid',
  '一隻穿太空服的貓咪',
  undefined,                // referenceImage（選填）
  { aspectRatio: '16:9', imageSize: '2K' }  // 覆蓋預設設定
)

// 結束 Session
imageGenerationSocket.endSession('session-uuid')

// 斷開連線
imageGenerationSocket.disconnect()
```

### 使用 Composable（推薦）

```typescript
import { useImageGeneration } from '@/composables/useImageGeneration'

const {
  // 狀態
  connectionState,
  currentSession,
  generatedResults,
  isGenerating,
  error,

  // 方法
  connect,
  disconnect,
  startSession,
  resumeSession,
  generate,
  endSession,
} = useImageGeneration()

// 連線（自動使用 auth store token）
connect()

// 開始 Session
startSession('nano-banana')

// 生成圖片
generate('一隻在月球上的太空貓')
```

---

## 完整使用流程

### 流程一：瀏覽歷史記錄

```typescript
import { aiSessionsApi } from '@/services/api'

// 1. 取得歷史列表
const history = await aiSessionsApi.getGenerationHistory({
  status: 'success',
  page: 1,
  limit: 20,
})

// 2. 顯示列表
history.data.forEach((item) => {
  console.log(item.prompt)
  console.log(item.generatedImageUrl)
  console.log(item.user.displayName)
})

// 3. 查看詳情
const detail = await aiSessionsApi.getHistoryDetail(historyId)
console.log(detail.data.responseText)
```

### 流程二：查看 Session 對話

```typescript
import { aiSessionsApi } from '@/services/api'

// 1. 取得 Session 列表
const sessions = await aiSessionsApi.getSessions({ status: 'active' })

// 2. 取得 Session 詳情（含完整對話）
const session = await aiSessionsApi.getSessionDetail(sessionId)

// 3. 渲染對話介面
session.data.history.forEach((item) => {
  console.log('使用者:', item.prompt)
  console.log('AI:', item.responseText)
  console.log('圖片:', item.generatedImageUrl)
})

// 4. 顯示統計
console.log('總生成次數:', session.data.statistics.generationCount)
console.log('總成本:', session.data.statistics.totalCost)
```

### 流程三：新建對話並生成圖片

```typescript
import { useImageGeneration } from '@/composables/useImageGeneration'

const { connect, startSession, generate, endSession, currentSession, generatedResults } =
  useImageGeneration()

// 1. 連線
connect()

// 2. 開始新 Session
startSession('nano-banana', undefined, { aspectRatio: '16:9' })

// 3. 等待 Session 建立後生成
watch(currentSession, (session) => {
  if (session) {
    generate('一隻穿太空服的貓咪')
  }
})

// 4. 監聽生成結果
watch(generatedResults, (results) => {
  const latest = results[results.length - 1]
  if (latest?.success) {
    console.log('圖片:', latest.imageUrl)
  }
})

// 5. 結束對話
onUnmounted(() => {
  endSession()
})
```

### 流程四：延續既有對話

```typescript
import { aiSessionsApi } from '@/services/api'
import { useImageGeneration } from '@/composables/useImageGeneration'

const { connect, resumeSession, generate, currentSession } = useImageGeneration()

// 1. 取得要恢復的 Session
const session = await aiSessionsApi.getSessionDetail(sessionId)

// 2. 檢查狀態
if (session.data.status !== 'active') {
  throw new Error('此 Session 已結束或過期')
}

// 3. 顯示既有對話
session.data.history.forEach((item) => {
  // 渲染對話記錄...
})

// 4. 連線並恢復 Session
connect()
resumeSession(sessionId)

// 5. 繼續對話
watch(currentSession, (s) => {
  if (s) {
    // 啟用輸入框，允許繼續對話
  }
})
```

---

## 錯誤處理

### HTTP 狀態碼對照

| 狀態碼 | 說明 | 處理方式 |
|--------|------|----------|
| 401 | 未認證 / Token 過期 | API Client 自動 refresh token |
| 403 | 權限不足 | 顯示權限不足提示 |
| 404 | 資源不存在 | 顯示「找不到資料」訊息 |
| 500 | 伺服器錯誤 | 顯示「系統錯誤，請稍後再試」|

### WebSocket 錯誤類型

| 錯誤類型 | 說明 | 處理方式 |
|----------|------|----------|
| `start_session_failed` | Session 建立失敗 | 重試或顯示錯誤 |
| `resume_session_failed` | Session 恢復失敗 | 建立新 Session |
| `generation_failed` | 生成過程錯誤 | 顯示錯誤，允許重試 |
| `session_expired` | Session 已過期 | 建立新 Session |
| `permission_denied` | 權限不足 | 導向登入頁 |

### 統一錯誤處理

API Client 已內建錯誤處理（位於 `/src/services/api/client.ts`）：
- 401 自動嘗試 refresh token
- 自動轉換錯誤訊息為中文
- 失敗時自動登出並導向登入頁

---

## 注意事項

1. **Token 管理**：API Client 自動處理 token 刷新
2. **WebSocket 重連**：已設定自動重連（最多 5 次）
3. **Session 過期**：預設 1 小時，過期後需建立新 Session
4. **圖片儲存**：生成的圖片永久儲存於 Firebase Storage，URL 不會過期
5. **團隊共用**：所有記錄為團隊共用，設計 UI 時請考慮顯示建立者資訊

---

## 實作檢查清單

### API 層
- [ ] 新增 `/src/services/api/aiSessions.ts`
- [ ] 更新 `/src/services/api/index.ts` 匯出

### 型別定義
- [ ] 補充 `/src/types/ai-generation.ts` 型別定義
  - `Pagination`, `PaginatedResponse`
  - `SessionQueryParams`, `SessionItem`, `SessionStatistics`, `SessionDetail`
  - 更新 `GenerationHistoryItem`, `GenerationHistoryQueryParams`

### UI 元件
- [ ] 新增 `/src/components/ai/SessionSelectModal.vue`
  - Session 列表顯示
  - 縮圖、模型、角色、生成次數、建立時間
  - 狀態標籤（active / completed）
  - 分頁功能

### 頁面整合
- [ ] 修改 `/src/pages/ai/AiGeneratorView.vue`
  - 新增「或 恢復過去對話」連結
  - 整合 SessionSelectModal
  - 處理 Session 選擇邏輯

### Store 更新
- [ ] 修改 `/src/stores/aiGeneration.ts`
  - 新增 `loadHistoryFromSession` action

### 驗證
- [ ] 執行 `pnpm run type-check` 確認型別正確
- [ ] 執行 `pnpm run lint` 確認程式碼風格
- [ ] 測試：開啟彈窗載入 Session 列表
- [ ] 測試：恢復 active Session
- [ ] 測試：恢復 completed Session（載入歷史 + 建立新 Session）
