# Discord 打卡排程管理功能 - 實作計劃

**專案**: Discord 自動化排程訊息工具 (hex-toolman-frontend)
**功能**: 打卡排程管理（管理者端）
**日期**: 2025-12-12
**計劃版本**: v1.0

---

## 專案概述

本計劃旨在實作 Discord 打卡排程的管理者端功能，讓管理員可以建立、編輯、檢視和刪除打卡排程。系統會自動掃描 Discord 頻道的討論串，收集用戶打卡資訊並儲存於資料庫。

### 核心功能
1. **建立打卡排程** - 設定排程名稱、Discord 頻道、日期範圍、關鍵字篩選等
2. **檢視排程列表** - 以表格形式顯示所有排程，支援搜尋、篩選
3. **編輯排程** - 修改排程設定
4. **刪除排程** - 移除不需要的排程
5. **切換啟用狀態** - 快速啟用/停用排程
6. **複製排程 ID** - 方便分享和查詢

### 技術架構
- **前端框架**: Vue 3 + TypeScript + Composition API
- **狀態管理**: Pinia
- **路由**: Vue Router 4
- **樣式**: Tailwind CSS 4
- **API 通訊**: Axios

---

## 檔案結構

### 需要新增的檔案

```
src/
├── services/api/
│   └── checkin.ts                           # 打卡排程 API 服務層
├── stores/
│   └── checkin.ts                           # 打卡排程 Store
└── pages/
    └── checkin/
        ├── CheckinScheduleListView.vue      # 排程列表頁
        └── CheckinScheduleFormView.vue      # 新增/編輯排程頁
```

### 需要修改的檔案

1. **doc/frontend-permissions.json** - 新增 checkin 權限配置
2. **src/types/permission.ts** - 新增 CheckinPermissions 型別
3. **src/services/api/types.ts** - 新增打卡排程相關型別定義
4. **src/services/api/index.ts** - 匯出 checkinApi
5. **src/router/index.ts** - 新增打卡排程路由
6. **src/components/SidebarNav.vue** - 新增側邊欄導航項目

---

## 實作步驟（按順序執行）

### Phase 1: 基礎設施 (20%)

#### 1.1 更新權限配置
- **檔案**: `doc/frontend-permissions.json`
- **動作**: 在每個角色的 `features` 中新增 `checkin` 權限
- **權限項目**:
  - canView, canViewAll - 檢視權限
  - canCreate - 建立權限
  - canEdit, canEditAll - 編輯權限
  - canDelete, canDeleteAll - 刪除權限
- **導航項目**: 在 `navigation` 中新增 `showCheckinSchedules`
- **路由權限**: 在 `routes.allowedPaths` 中新增打卡路由

**角色權限分配**:
- super_admin / admin: 全部權限
- manager: 只能管理自己的排程（canViewAll=false, canEditAll=false, canDeleteAll=false）
- no_permission: 無權限

#### 1.2 新增 TypeScript 型別
- **檔案**: `src/types/permission.ts`
- **動作**: 新增 `CheckinPermissions` 介面和 `showCheckinSchedules` 導航權限

- **檔案**: `src/services/api/types.ts`
- **動作**: 新增以下型別定義
  - CheckinSchedule - 打卡排程資料結構
  - CheckinScheduleCreateRequest - 建立排程請求
  - CheckinScheduleUpdateRequest - 更新排程請求
  - CheckinScheduleListResponse - 列表響應
  - CheckinScheduleQueryParams - 查詢參數

#### 1.3 實作 API 服務層
- **檔案**: `src/services/api/checkin.ts` (新增)
- **動作**: 實作以下 API 函數
  - createCheckinSchedule() - 建立排程
  - getCheckinSchedules() - 取得列表
  - getCheckinScheduleById() - 取得單一排程
  - updateCheckinSchedule() - 更新排程
  - deleteCheckinSchedule() - 刪除排程
  - toggleCheckinSchedule() - 切換啟用狀態
  - rescanCheckinSchedule() - 手動重新掃描

- **檔案**: `src/services/api/index.ts`
- **動作**: 新增 `export * as checkinApi from './checkin'`

---

### Phase 2: Store 層 (15%)

#### 2.1 建立 Checkin Store
- **檔案**: `src/stores/checkin.ts` (新增)
- **狀態**:
  - schedules: CheckinSchedule[] - 排程列表
  - currentSchedule: CheckinSchedule | null - 當前排程
  - isLoading: boolean - 載入狀態
  - error: string | null - 錯誤訊息

- **Actions**:
  - fetchSchedules() - 載入列表
  - fetchScheduleById() - 載入單一排程
  - createSchedule() - 建立排程
  - updateSchedule() - 更新排程
  - deleteSchedule() - 刪除排程（樂觀更新）
  - toggleSchedule() - 切換狀態
  - rescanSchedule() - 重新掃描
  - clearCurrentSchedule() - 清除當前排程
  - clearError() - 清除錯誤
  - reset() - 重置 store

---

### Phase 3: 路由設定 (10%)

#### 3.1 新增路由配置
- **檔案**: `src/router/index.ts`
- **動作**: 在 `/dashboard` 的 children 中新增以下路由

```typescript
{
  path: 'checkin/schedules',
  name: 'CheckinSchedules',
  component: () => import('@/pages/checkin/CheckinScheduleListView.vue'),
  meta: {
    requiresAuth: true,
    permissionPath: '/dashboard/checkin/schedules',
  },
},
{
  path: 'checkin/schedules/new',
  name: 'CheckinScheduleCreate',
  component: () => import('@/pages/checkin/CheckinScheduleFormView.vue'),
  meta: {
    requiresAuth: true,
    permissionPath: '/dashboard/checkin/schedules/new',
  },
},
{
  path: 'checkin/schedules/edit/:id',
  name: 'CheckinScheduleEdit',
  component: () => import('@/pages/checkin/CheckinScheduleFormView.vue'),
  meta: {
    requiresAuth: true,
    permissionPath: '/dashboard/checkin/schedules/edit/:id',
  },
},
```

**驗證**: 直接訪問路由，確認權限守衛正常運作

---

### Phase 4: 排程列表頁 (25%)

#### 4.1 建立列表頁元件
- **檔案**: `src/pages/checkin/CheckinScheduleListView.vue` (新增)
- **參考**: `src/pages/admin/UserManagementView.vue` (表格結構)

#### 4.2 核心功能實作
1. **載入排程列表**
   - 使用 checkinStore.fetchSchedules()
   - 顯示 loading 狀態

2. **表格顯示**
   - 欄位: 排程名稱、頻道名稱、日期範圍、關鍵字、狀態、操作
   - 使用 Tailwind 表格樣式
   - 響應式設計

3. **複製排程 ID**
   - 按鈕: 使用 `navigator.clipboard.writeText()`
   - 可選取文字顯示（使用 `font-mono` 樣式）
   - 複製成功提示

4. **切換啟用狀態**
   - Toggle 開關樣式
   - 呼叫 checkinStore.toggleSchedule()
   - 樂觀更新 UI

5. **刪除排程**
   - 刪除按鈕
   - 確認對話框（使用 `confirm()`）
   - 呼叫 checkinStore.deleteSchedule()

6. **搜尋/篩選** (可選，Phase 7 優化)
   - 依排程名稱搜尋
   - 依狀態篩選

7. **新增按鈕**
   - 固定在右上角
   - 跳轉至 `/dashboard/checkin/schedules/new`

---

### Phase 5: 新增/編輯排程表單頁 (25%)

#### 5.1 建立表單元件
- **檔案**: `src/pages/checkin/CheckinScheduleFormView.vue` (新增)
- **參考**: `src/pages/ScheduleCreateView.vue` (完整參考其設計模式)

#### 5.2 表單欄位設計

**必填欄位**:
1. **排程名稱** - text input, maxlength="100"
2. **Discord 頻道** - select dropdown
   - 使用 discordStore.textChannels
   - 按 parentName 分組顯示
   - 顯示格式: `# 頻道名稱 (分類名稱)`
3. **開始日期** - date input, 格式: YYYY-MM-DD
4. **結束日期** - date input, 格式: YYYY-MM-DD

**可選欄位**:
5. **關鍵字篩選** - 動態標籤輸入
   - 輸入框 + 新增按鈕
   - 標籤列表（可刪除）
   - 儲存為 string[]
6. **預期討論串數目** - number input, min="0"

#### 5.3 功能實作

1. **編輯模式偵測**
```typescript
const route = useRoute()
const isEditMode = computed(() => !!route.params.id)
const scheduleId = computed(() => route.params.id as string)
```

2. **載入現有資料**（編輯模式）
```typescript
onMounted(async () => {
  // 載入 Discord 頻道列表
  await discordStore.fetchChannels()

  // 編輯模式：載入排程資料
  if (isEditMode.value) {
    const schedule = await checkinStore.fetchScheduleById(scheduleId.value)
    form.value = {
      name: schedule.name,
      channelId: schedule.channelId,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      keywords: schedule.keywords || [],
      expectedThreadCount: schedule.expectedThreadCount,
    }
  }
})
```

3. **表單驗證**
- 檢查必填欄位
- 驗證日期邏輯（endDate >= startDate）
- 驗證關鍵字格式

4. **提交處理**
```typescript
async function handleSubmit() {
  const error = validateForm()
  if (error) {
    alert(error)
    return
  }

  try {
    if (isEditMode.value) {
      await checkinStore.updateSchedule(scheduleId.value, form.value)
      alert('排程已更新！')
    } else {
      await checkinStore.createSchedule(form.value)
      alert('排程已建立！')
    }
    router.push('/dashboard/checkin/schedules')
  } catch (err) {
    alert(checkinStore.error || '操作失敗')
  }
}
```

5. **關鍵字標籤輸入**
```typescript
const keywordInput = ref('')

function addKeyword() {
  const keyword = keywordInput.value.trim()
  if (keyword && !form.value.keywords.includes(keyword)) {
    form.value.keywords.push(keyword)
    keywordInput.value = ''
  }
}

function removeKeyword(index: number) {
  form.value.keywords.splice(index, 1)
}
```

#### 5.4 UI 設計風格
- 完全遵循 ScheduleCreateView.vue 的設計
- 區塊式卡片佈局
- 每個區塊有圖示 + 標題
- Sticky footer 按鈕（儲存、取消）

---

### Phase 6: 側邊欄導航整合 (5%)

#### 6.1 更新側邊欄導航
- **檔案**: `src/components/SidebarNav.vue`
- **動作**: 在 `allNavGroups` 中新增打卡管理群組

```typescript
{
  title: '打卡管理',
  items: [
    {
      name: '打卡排程',
      path: '/dashboard/checkin/schedules',
      icon: 'bi-clipboard-check',
      permissionKey: 'showCheckinSchedules',
    },
  ],
}
```

**驗證**: 切換不同角色登入，確認導航項目正確顯示/隱藏

---

### Phase 7: 整合測試與優化

#### 7.1 端到端測試
- 測試新增排程流程
- 測試編輯排程流程
- 測試刪除排程流程
- 測試權限控制（不同角色）
- 測試錯誤處理

#### 7.2 UI/UX 優化
- Loading 動畫
- 空狀態提示（無排程時）
- Toast 通知（取代 alert）
- 表單錯誤提示樣式

#### 7.3 效能優化
- 頻道列表快取
- 避免重複載入

---

## 關鍵技術細節

### 1. 複製到剪貼簿
```typescript
async function copyScheduleId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    // TODO: 顯示成功提示（Toast）
    alert('排程 ID 已複製！')
  } catch (err) {
    console.error('複製失敗:', err)
    alert('複製失敗，請手動複製')
  }
}
```

### 2. 日期格式處理
- HTML input[type="date"] 自動輸出 "YYYY-MM-DD" 格式
- 直接使用 v-model 綁定，無需額外轉換

### 3. Discord 頻道名稱解析
```typescript
// 從 channelId 取得頻道名稱
const channelName = computed(() => {
  const channel = discordStore.channels.find(c => c.id === schedule.channelId)
  return channel ? `#${channel.name}` : '未知頻道'
})
```

### 4. 權限檢查範例
```typescript
import { usePermission } from '@/composables/usePermission'

const { hasPermission } = usePermission()
const canEdit = hasPermission('checkin', 'canEdit')
const canDelete = hasPermission('checkin', 'canDelete')
```

### 5. Loading 狀態處理
```typescript
<template>
  <div v-if="checkinStore.isLoading" class="text-center py-8">
    載入中...
  </div>
  <div v-else>
    <!-- 內容 -->
  </div>
</template>
```

---

## 注意事項

### 1. 權限控制
- 所有 UI 操作按鈕都要根據權限顯示/隱藏
- manager 只能編輯/刪除自己的排程（canEditAll=false）
- 使用 `v-if="hasPermission('checkin', 'canCreate')"` 控制

### 2. 資料驗證
- 前端驗證：必填欄位、日期邏輯
- 後端也會驗證，需處理後端錯誤訊息
- 顯示友善的錯誤提示

### 3. Discord 頻道
- 確保在使用前載入頻道列表
- 處理頻道載入失敗的情況
- 頻道可能不存在時的顯示邏輯

### 4. 日期處理
- 確保結束日期 >= 開始日期
- 使用本地日期（不需考慮時區轉換）

### 5. 關鍵字處理
- 允許空陣列（可選欄位）
- 去除前後空白
- 防止重複關鍵字

### 6. 樂觀更新
- 刪除操作：立即從 UI 移除，失敗時還原
- 切換狀態：立即更新 UI，失敗時還原

### 7. 錯誤處理
- 所有 async 操作使用 try-catch
- 顯示 store.error 或自定義錯誤訊息
- console.error 記錄詳細錯誤供除錯

---

## 關鍵檔案清單

實作時需要特別關注以下檔案：

1. **doc/frontend-permissions.json** - 權限配置的核心
2. **src/services/api/types.ts** - 型別定義基礎
3. **src/stores/checkin.ts** - 狀態管理核心
4. **src/pages/ScheduleCreateView.vue** - UI 設計參考範本
5. **src/router/index.ts** - 路由整合

---

## 後續優化（本階段不實作）

以下功能預留介面，但本階段不實作：

1. **分享連結生成** - 複製公開查詢 URL
2. **排程統計** - 顯示打卡統計數據
3. **搜尋篩選** - 進階搜尋功能
4. **批次操作** - 批次啟用/停用/刪除
5. **匯出功能** - 匯出排程資料

---

## 執行計劃後的下一步

當這個計劃被執行完成後，還需要：

1. **建立計劃文件**
   - 將本計劃內容複製到 `docs/202512-checkin-feature-plan.md`
   - 作為專案文件保存

2. **測試清單**
   - 建立完整的測試案例清單
   - 逐一測試所有功能

3. **使用者文件**
   - 撰寫管理者使用手冊
   - 說明如何建立和管理打卡排程

---

**計劃完成日期**: 2025-12-12
**預估實作時間**: 6-8 小時（依實作者經驗而定）
**建議實作順序**: 嚴格按照 Phase 1-7 的順序執行，確保每個階段都可以獨立測試
