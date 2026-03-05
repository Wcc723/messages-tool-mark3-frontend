# 打卡排程掃描狀態與報告功能 - 實作計劃

**專案**: Discord 自動化排程訊息工具 (hex-toolman-frontend)
**功能**: 打卡排程掃描狀態顯示 + 基礎報告頁面
**日期**: 2025-12-15
**計劃版本**: v1.0

---

## 需求摘要

根據 `openapi.json` 的更新，需要：

1. **調整現有介面** - 整合掃描狀態 API，顯示 rescan 的執行進度
2. **新增報告頁面** - 基礎功能（統計總覽 + 用戶列表），需登入但不需特別授權

---

## 新增的 API 端點

### Checkin Schedules API（需認證）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/checkin-schedules/scan-status/{scanLogId}` | GET | 取得掃描任務狀態（進度、階段） |
| `/api/checkin-schedules/scan-result/{scanLogId}` | GET | 取得掃描任務結果（討論串清單、統計） |

### Checkin Public API（無需認證，但本次需登入）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/checkin/{scheduleId}/stats` | GET | 排程全局統計 |
| `/api/checkin/{scheduleId}/users` | GET | 用戶列表（分頁、搜尋） |
| `/api/checkin/{scheduleId}/threads` | GET | 討論串列表 |

---

## 檔案結構

### 需要新增的檔案

```
src/
├── services/api/
│   └── checkinPublic.ts                    # 打卡公開 API 服務層（新增）
└── pages/checkin/
    └── CheckinReportView.vue               # 排程報告頁面（新增）
```

### 需要修改的檔案

1. **src/services/api/checkin.ts** - 新增 scan-status, scan-result API
2. **src/services/api/types.ts** - 新增相關型別定義
3. **src/services/api/index.ts** - 匯出 checkinPublicApi
4. **src/stores/checkin.ts** - 新增掃描狀態管理
5. **src/pages/checkin/CheckinScheduleListView.vue** - 整合掃描狀態顯示
6. **src/router/index.ts** - 新增報告頁面路由

---

## 實作步驟

### Phase 1: 型別定義（10%）

**檔案**: `src/services/api/types.ts`

新增以下型別：

```typescript
// 掃描狀態
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface ScanProgress {
  phase: string
  totalThreads: number
  processedThreads: number
  currentThread?: {
    id: string
    name: string
  }
}

export interface ScanStatusResponse {
  id: string
  status: ScanStatus
  progress?: ScanProgress
  startTime?: string
  endTime?: string
  threadsFound?: number
  checkinsRecorded?: number
  errorMessage?: string
}

export interface ScanResultThread {
  id: string
  name: string
  checkinsFound: number
  status: string
  error?: string
}

export interface ScanResultSummary {
  totalApiCalls: number
  totalDuration: number
  failedThreads: number
}

export interface ScanResultResponse {
  id: string
  status: string
  result?: {
    threads: ScanResultThread[]
    summary: ScanResultSummary
  }
  duration?: number
  threadsFound?: number
  checkinsRecorded?: number
}

// 打卡統計
export interface CheckinStats {
  scheduleId: string
  scheduleName: string
  totalCheckins: number
  dailyTasks: number
  expectedTasks: number
  progress: number
  uniqueUsers: number
  channelInfo?: object
  dailyStats?: object[]
}

// 打卡用戶
export interface CheckinUser {
  discordUserId: string
  username: string
  displayName: string
  avatarUrl?: string
  totalCheckinDays: number
  checkinStatus?: object
}

export interface CheckinUsersResponse {
  users: CheckinUser[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
  }
}

export interface CheckinUsersQueryParams {
  page?: number
  limit?: number
  search?: string
}
```

---

### Phase 2: API 服務層（15%）

#### 2.1 更新 checkin.ts

**檔案**: `src/services/api/checkin.ts`

新增函數：

```typescript
/**
 * 取得掃描任務狀態
 * GET /api/checkin-schedules/scan-status/:scanLogId
 */
export async function getScanStatus(scanLogId: string) {
  const response = await apiClient.get<ApiResponse<ScanStatusResponse>>(
    `/api/checkin-schedules/scan-status/${scanLogId}`
  )
  return response.data.data!
}

/**
 * 取得掃描任務結果
 * GET /api/checkin-schedules/scan-result/:scanLogId
 */
export async function getScanResult(scanLogId: string) {
  const response = await apiClient.get<ApiResponse<ScanResultResponse>>(
    `/api/checkin-schedules/scan-result/${scanLogId}`
  )
  return response.data.data!
}
```

更新 `rescanCheckinSchedule` 函數回傳型別（需包含 scanLogId）。

#### 2.2 新增 checkinPublic.ts

**檔案**: `src/services/api/checkinPublic.ts` (新增)

```typescript
import apiClient from './client'
import type { ApiResponse, CheckinStats, CheckinUsersResponse, CheckinUsersQueryParams } from './types'

/**
 * 取得排程全局統計
 * GET /api/checkin/:scheduleId/stats
 */
export async function getCheckinStats(scheduleId: string) {
  const response = await apiClient.get<ApiResponse<CheckinStats>>(
    `/api/checkin/${scheduleId}/stats`
  )
  return response.data.data!
}

/**
 * 取得排程用戶列表
 * GET /api/checkin/:scheduleId/users
 */
export async function getCheckinUsers(scheduleId: string, params?: CheckinUsersQueryParams) {
  const response = await apiClient.get<ApiResponse<CheckinUsersResponse>>(
    `/api/checkin/${scheduleId}/users`,
    { params }
  )
  return response.data.data!
}

/**
 * 取得排程討論串列表
 * GET /api/checkin/:scheduleId/threads
 */
export async function getCheckinThreads(scheduleId: string) {
  const response = await apiClient.get<ApiResponse>(
    `/api/checkin/${scheduleId}/threads`
  )
  return response.data.data!
}
```

#### 2.3 更新 index.ts

**檔案**: `src/services/api/index.ts`

新增：
```typescript
export * as checkinPublicApi from './checkinPublic'
```

---

### Phase 3: Store 層更新（15%）

**檔案**: `src/stores/checkin.ts`

新增狀態和 Actions：

```typescript
// 新增 State
const currentScanLog = ref<{
  scanLogId: string
  scheduleId: string
  status: ScanStatusResponse | null
  result: ScanResultResponse | null
} | null>(null)

// 新增 Actions
async function startRescan(scheduleId: string, scanDate?: string) {
  // 執行 rescan，取得 scanLogId
  const response = await checkinApi.rescanCheckinSchedule(scheduleId, scanDate ? { scanDate } : undefined)

  // 儲存 scanLogId 以便後續查詢
  currentScanLog.value = {
    scanLogId: response.data.scanLogId,
    scheduleId,
    status: null,
    result: null
  }

  return response.data.scanLogId
}

async function fetchScanStatus(scanLogId: string) {
  const status = await checkinApi.getScanStatus(scanLogId)
  if (currentScanLog.value?.scanLogId === scanLogId) {
    currentScanLog.value.status = status
  }
  return status
}

async function fetchScanResult(scanLogId: string) {
  const result = await checkinApi.getScanResult(scanLogId)
  if (currentScanLog.value?.scanLogId === scanLogId) {
    currentScanLog.value.result = result
  }
  return result
}

function clearScanLog() {
  currentScanLog.value = null
}
```

---

### Phase 4: 調整列表頁面（25%）

**檔案**: `src/pages/checkin/CheckinScheduleListView.vue`

#### 4.1 修改 Rescan Modal

在現有 Modal 中新增掃描狀態顯示區塊：

- 顯示掃描狀態（queued/running/completed/failed）
- 顯示進度資訊（處理中的討論串數量）
- 新增「刷新狀態」按鈕（手動刷新）
- 掃描完成後顯示結果摘要

#### 4.2 新增狀態顯示邏輯

```typescript
// 新增 ref
const currentScanLogId = ref<string | null>(null)
const scanStatus = ref<ScanStatusResponse | null>(null)
const scanResult = ref<ScanResultResponse | null>(null)
const isFetchingStatus = ref(false)

// 修改 executeRescan
async function executeRescan() {
  // ... 驗證邏輯 ...

  isRescanning.value = true
  try {
    const scanLogId = await checkinStore.startRescan(
      rescanScheduleId.value,
      rescanMode.value === 'single' ? rescanDate.value : undefined
    )
    currentScanLogId.value = scanLogId
    // 自動查詢一次狀態
    await refreshScanStatus()
  } catch {
    alert(checkinStore.error || '掃描失敗')
  } finally {
    isRescanning.value = false
  }
}

// 新增刷新狀態函數
async function refreshScanStatus() {
  if (!currentScanLogId.value) return

  isFetchingStatus.value = true
  try {
    scanStatus.value = await checkinStore.fetchScanStatus(currentScanLogId.value)

    // 如果完成，同時取得結果
    if (scanStatus.value.status === 'completed') {
      scanResult.value = await checkinStore.fetchScanResult(currentScanLogId.value)
    }
  } catch (err) {
    console.error('取得掃描狀態失敗:', err)
  } finally {
    isFetchingStatus.value = false
  }
}
```

#### 4.3 更新 Modal 模板

```html
<!-- 掃描狀態顯示區塊 -->
<div v-if="currentScanLogId" class="mt-4 p-4 bg-gray-50 rounded-lg">
  <div class="flex items-center justify-between mb-2">
    <span class="text-sm font-medium text-gray-700">掃描狀態</span>
    <button
      type="button"
      class="text-sm text-indigo-600 hover:text-indigo-800"
      :disabled="isFetchingStatus"
      @click="refreshScanStatus"
    >
      <i class="bi bi-arrow-clockwise" :class="{ 'animate-spin': isFetchingStatus }"></i>
      刷新
    </button>
  </div>

  <!-- 狀態指示器 -->
  <div class="flex items-center gap-2">
    <span class="w-2 h-2 rounded-full" :class="statusColorClass"></span>
    <span class="text-sm">{{ statusText }}</span>
  </div>

  <!-- 進度資訊 -->
  <div v-if="scanStatus?.progress" class="mt-2 text-xs text-gray-500">
    處理中: {{ scanStatus.progress.processedThreads }} / {{ scanStatus.progress.totalThreads }} 討論串
  </div>

  <!-- 完成結果 -->
  <div v-if="scanResult" class="mt-3 p-3 bg-white rounded border border-gray-200">
    <p class="text-sm font-medium text-gray-800">掃描完成</p>
    <p class="text-xs text-gray-600 mt-1">
      發現 {{ scanResult.threadsFound }} 個討論串，
      記錄 {{ scanResult.checkinsRecorded }} 筆打卡
    </p>
  </div>
</div>
```

---

### Phase 5: 新增報告頁面（25%）

**檔案**: `src/pages/checkin/CheckinReportView.vue` (新增)

#### 5.1 頁面結構

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { checkinPublicApi } from '@/services/api'
import type { CheckinStats, CheckinUser } from '@/services/api/types'

const route = useRoute()
const scheduleId = computed(() => route.params.id as string)

// 狀態
const stats = ref<CheckinStats | null>(null)
const users = ref<CheckinUser[]>([])
const pagination = ref({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 50 })
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

// 載入統計資料
async function loadStats() {
  try {
    stats.value = await checkinPublicApi.getCheckinStats(scheduleId.value)
  } catch (err) {
    error.value = '載入統計資料失敗'
  }
}

// 載入用戶列表
async function loadUsers(page = 1) {
  isLoading.value = true
  try {
    const response = await checkinPublicApi.getCheckinUsers(scheduleId.value, {
      page,
      limit: 50,
      search: searchQuery.value || undefined
    })
    users.value = response.users
    pagination.value = response.pagination
  } catch (err) {
    error.value = '載入用戶列表失敗'
  } finally {
    isLoading.value = false
  }
}

// 搜尋
function handleSearch() {
  loadUsers(1)
}

// 分頁
function goToPage(page: number) {
  loadUsers(page)
}

onMounted(() => {
  loadStats()
  loadUsers()
})
</script>
```

#### 5.2 模板結構

1. **統計卡片區** - 顯示總打卡數、完成率、參與人數
2. **用戶列表區** - 含搜尋框、表格、分頁
3. **錯誤/載入狀態處理**

---

### Phase 6: 路由配置（5%）

**檔案**: `src/router/index.ts`

新增路由：

```typescript
{
  path: 'checkin/schedules/:id/report',
  name: 'CheckinScheduleReport',
  component: () => import('@/pages/checkin/CheckinReportView.vue'),
  meta: {
    requiresAuth: true,
    // 不需要特別授權，只需登入
  },
}
```

---

### Phase 7: 整合與測試（5%）

1. 在 CheckinScheduleListView 新增「查看報告」按鈕
2. 測試掃描狀態顯示流程
3. 測試報告頁面載入
4. 錯誤處理測試

---

## 關鍵檔案路徑清單

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/services/api/types.ts` | 修改 | 新增型別定義 |
| `src/services/api/checkin.ts` | 修改 | 新增 scan-status/result API |
| `src/services/api/checkinPublic.ts` | 新增 | 公開 API 服務層 |
| `src/services/api/index.ts` | 修改 | 匯出新模組 |
| `src/stores/checkin.ts` | 修改 | 新增掃描狀態管理 |
| `src/pages/checkin/CheckinScheduleListView.vue` | 修改 | 整合掃描狀態顯示 |
| `src/pages/checkin/CheckinReportView.vue` | 新增 | 報告頁面 |
| `src/router/index.ts` | 修改 | 新增路由 |

---

## 注意事項

1. **掃描狀態刷新** - 採用手動刷新，避免自動 polling 造成 API 負擔
2. **報告頁面權限** - 需登入但不需特別授權（`meta.requiresAuth: true`）
3. **錯誤處理** - 所有 API 呼叫需適當處理錯誤
4. **API 回應處理** - rescan API 回傳的 scanLogId 需要正確解析
