# Discord 訊息排程複製功能改造計劃

## 📋 需求說明

### 現況
目前在行事曆中點選「複製」按鈕時，系統會：
1. 直接呼叫 API 建立一份新的草稿排程
2. 標題自動加上「(複本)」後綴
3. 立即導向編輯頁面

相關程式碼位置：
- `src/pages/ScheduleCalendarView.vue:254-263` - `handleDuplicate()` 函式
- `src/stores/schedule.ts:193-223` - `duplicateSchedule()` 方法

### 目標
改變複製功能的行為：
1. 點選複製時，**僅將資料儲存至 Pinia Store**（不呼叫 API）
2. 導向 `/dashboard/schedule/new` 頁面
3. 在 New 頁面中，從 Pinia Store 完整帶入資料（**除了日期以外**）
4. 由使用者自行編輯並決定是否儲存

---

## 🎯 功能規格

### 複製時帶入的欄位
以下欄位會從原排程複製到表單：
- ✅ `title` - 標題（不加「(複本)」後綴）
- ✅ `content` - 訊息內容
- ✅ `scheduleType` - 排程類型（once/weekly/monthly）
- ✅ `weekDay` - 週幾（weekly 類型）
- ✅ `monthDay` - 每月幾號（monthly 類型）
- ✅ `channelId` - Discord 頻道 ID
- ✅ `timezone` - 時區
- ✅ `attachments` - 圖片附件
- ✅ `status` - 狀態（固定為 `draft`）

### 複製時排除的欄位（使用新建預設值）
- ❌ `scheduledDate` - 執行日期（once 類型）→ 使用**明天日期**
- ❌ `scheduledTime` - 執行時間 → 使用**當前時間 + 10 分鐘**
- ❌ `validUntil` - 截止時間（週期性排程）→ **清空**，由使用者重新設定

### 使用者體驗流程
```
[行事曆頁面]
    ↓ 點選「複製」按鈕
[儲存資料到 Pinia Store]
    ↓ 導向
[New 頁面 - 自動帶入複製的資料]
    ↓ 使用者編輯表單
[使用者決定是否儲存]
    ↓ 點選「建立排程」
[呼叫 API 建立新排程]
```

---

## 🔧 技術實作計劃

### 1️⃣ 修改 Pinia Store (`src/stores/schedule.ts`)

#### 1.1 新增狀態
```typescript
// 在 State 區塊新增
const copiedScheduleData = ref<Partial<Schedule> | null>(null)
```

#### 1.2 修改/新增方法

##### 新增：`setCopiedSchedule()`
```typescript
/**
 * 設定要複製的排程資料（暫存到 Store）
 */
function setCopiedSchedule(schedule: Schedule) {
  copiedScheduleData.value = {
    title: schedule.title,
    content: schedule.content,
    scheduleType: schedule.scheduleType,
    weekDay: schedule.weekDay,
    monthDay: schedule.monthDay,
    channelId: schedule.channelId,
    timezone: schedule.timezone,
    attachments: schedule.attachments,
    status: 'draft' as const,
    // 不包含：scheduledDate, scheduledTime, validUntil
  }
}
```

##### 新增：`clearCopiedSchedule()`
```typescript
/**
 * 清除暫存的複製資料
 */
function clearCopiedSchedule() {
  copiedScheduleData.value = null
}
```

##### 刪除：`duplicateSchedule()`
舊的 `duplicateSchedule()` 方法（193-223 行）可以移除，因為不再需要直接建立草稿。

#### 1.3 更新 return 區塊
```typescript
return {
  // State
  schedules,
  currentSchedule,
  copiedScheduleData, // 新增
  timezones,
  isLoading,
  error,
  pagination,
  // Actions
  fetchSchedules,
  fetchScheduleById,
  createSchedule,
  updateSchedule,
  updateScheduleStatus,
  deleteSchedule,
  setCopiedSchedule,    // 新增
  clearCopiedSchedule,  // 新增
  fetchTimezones,
  fetchScheduleLogs,
  clearCurrentSchedule,
  clearError,
  reset,
}
```

#### 1.4 更新 `reset()` 方法
```typescript
function reset() {
  schedules.value = []
  currentSchedule.value = null
  copiedScheduleData.value = null  // 新增這行
  timezones.value = []
  error.value = null
  pagination.value = {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  }
}
```

---

### 2️⃣ 修改行事曆頁面 (`src/pages/ScheduleCalendarView.vue`)

#### 2.1 修改 `handleDuplicate()` 函式（254-263 行）

**原始程式碼：**
```typescript
const handleDuplicate = async (schedule: Schedule) => {
  try {
    const duplicated = await scheduleStore.duplicateSchedule(schedule)
    // 導向編輯頁面，草稿狀態
    router.push(`/dashboard/schedule/edit/${duplicated.id}`)
  } catch (error: any) {
    console.error('Failed to duplicate schedule:', error)
    alert(error.response?.data?.message || '複製排程失敗')
  }
}
```

**修改後：**
```typescript
const handleDuplicate = (schedule: Schedule) => {
  // 將排程資料儲存到 Store
  scheduleStore.setCopiedSchedule(schedule)
  // 導向新建頁面
  router.push('/dashboard/schedule/new')
}
```

#### 修改說明
- 移除 `async/await`（不再需要等待 API 回應）
- 移除 `try/catch`（不會發生錯誤）
- 呼叫 `setCopiedSchedule()` 取代 `duplicateSchedule()`
- 導向 `/dashboard/schedule/new` 取代 `/dashboard/schedule/edit/${id}`

#### 影響位置
此函式在以下三個地方被呼叫，修改後全部適用：
1. 行事曆檢視 - 選中日期的排程卡片（511 行）
2. 列表檢視 - 排程列表項目（589 行）
3. 排程詳細 Modal - Footer 按鈕（751 行）

---

### 3️⃣ 修改建立/編輯頁面 (`src/pages/ScheduleCreateView.vue`)

#### 3.1 引入 Store 的複製資料
在 `<script setup>` 區塊中：

```typescript
import { storeToRefs } from 'pinia'

// 取得複製的資料
const { copiedScheduleData } = storeToRefs(scheduleStore)
```

#### 3.2 修改 `onMounted` 生命週期（121-147 行）

**在現有的程式碼中加入複製資料處理邏輯：**

```typescript
onMounted(async () => {
  try {
    // Load channels and timezones in parallel
    await Promise.all([discordStore.fetchChannels(), scheduleStore.fetchTimezones()])

    // Edit mode: load existing schedule
    if (isEditMode.value && scheduleId.value) {
      await loadSchedule(scheduleId.value)
    }
    // 新增：檢查是否有複製的資料
    else if (copiedScheduleData.value) {
      loadCopiedSchedule()
    }
    // Create mode: set default date to tomorrow
    else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      form.value.scheduledDate = formatLocalDate(tomorrow)

      const now = new Date()
      now.setMinutes(now.getMinutes() + 10)
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      form.value.scheduledTime = `${hours}:${minutes}`
      uploadedImages.value = []
    }
  } catch (error: any) {
    console.error('Failed to load initial data:', error)
    alert(error.response?.data?.message || '載入資料失敗')
  }
})
```

#### 3.3 新增 `loadCopiedSchedule()` 函式

在 `loadSchedule()` 函式（149-178 行）後面新增：

```typescript
/**
 * 載入複製的排程資料到表單
 */
function loadCopiedSchedule() {
  if (!copiedScheduleData.value) return

  const copied = copiedScheduleData.value

  // 設定預設日期和時間（不使用複製的資料）
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = formatLocalDate(tomorrow)

  const now = new Date()
  now.setMinutes(now.getMinutes() + 10)
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const defaultTime = `${hours}:${minutes}`

  // 填入表單
  form.value = {
    title: copied.title || '',
    content: copied.content || '',
    scheduleType: copied.scheduleType || 'once',
    scheduledTime: defaultTime,  // 使用預設時間
    scheduledDate: defaultDate,  // 使用預設日期（明天）
    weekDay: copied.weekDay || 1,
    monthDay: copied.monthDay || 1,
    channelId: copied.channelId || '',
    timezone: copied.timezone || 'Asia/Taipei',
    status: 'draft',  // 固定為草稿
    validUntil: '',  // 清空，由使用者重新設定
  }

  // 載入圖片附件
  uploadedImages.value = copied.attachments?.images
    ? copied.attachments.images.map((image) => ({
        ...image,
        discordUrl: image.discordUrl ?? null,
      }))
    : []

  // 清除 Store 中的複製資料
  scheduleStore.clearCopiedSchedule()
}
```

---

## 📝 測試檢查清單

### 功能測試
- [ ] 在行事曆檢視點選「複製」按鈕，確認導向 `/dashboard/schedule/new`
- [ ] 在列表檢視點選「複製」按鈕，確認導向 `/dashboard/schedule/new`
- [ ] 在 Modal 點選「複製」按鈕，確認導向 `/dashboard/schedule/new`
- [ ] 確認 New 頁面表單正確帶入複製的資料
- [ ] 確認標題**沒有**「(複本)」後綴
- [ ] 確認日期為**明天**，時間為**當前 + 10 分鐘**
- [ ] 確認 `validUntil` 截止時間欄位為**空白**
- [ ] 確認圖片附件有正確帶入
- [ ] 確認狀態預設為「草稿」
- [ ] 點選「建立排程」後，確認新排程成功建立
- [ ] 點選「取消」後，確認複製資料被清除（重新進入 New 頁面不會再看到）

### 邊界情況測試
- [ ] 複製「單次執行」排程 → 確認日期使用明天
- [ ] 複製「每週重複」排程 → 確認 `weekDay` 正確帶入
- [ ] 複製「每月重複」排程 → 確認 `monthDay` 正確帶入
- [ ] 複製有截止時間的週期性排程 → 確認 `validUntil` 被清空
- [ ] 複製有圖片附件的排程 → 確認圖片正確顯示
- [ ] 複製後不儲存，直接導向其他頁面 → 確認複製資料不影響其他操作

### 原有功能測試
- [ ] 直接點選「新增排程」按鈕，確認表單為空白（預設值）
- [ ] 編輯現有排程，確認資料正確載入
- [ ] 搜尋和篩選功能正常運作
- [ ] 刪除排程功能正常運作

---

## 🔍 程式碼位置總結

### 需要修改的檔案

| 檔案 | 修改內容 | 行數參考 |
|------|---------|---------|
| `src/stores/schedule.ts` | 新增 `copiedScheduleData` 狀態 | ~17 |
| `src/stores/schedule.ts` | 新增 `setCopiedSchedule()` 方法 | ~224 |
| `src/stores/schedule.ts` | 新增 `clearCopiedSchedule()` 方法 | ~232 |
| `src/stores/schedule.ts` | 刪除 `duplicateSchedule()` 方法 | 193-223 |
| `src/stores/schedule.ts` | 更新 `return` 區塊 | ~296-317 |
| `src/stores/schedule.ts` | 更新 `reset()` 方法 | ~283-294 |
| `src/pages/ScheduleCalendarView.vue` | 簡化 `handleDuplicate()` 函式 | 254-263 |
| `src/pages/ScheduleCreateView.vue` | 引入 `copiedScheduleData` | ~13 |
| `src/pages/ScheduleCreateView.vue` | 修改 `onMounted` 邏輯 | 121-147 |
| `src/pages/ScheduleCreateView.vue` | 新增 `loadCopiedSchedule()` 函式 | ~179 |

---

## 🎨 使用者體驗改善

### 優點
1. **更直覺**：複製後直接看到可編輯的表單，而非先建立草稿再編輯
2. **更靈活**：使用者可以決定是否真的要儲存，不會產生多餘的草稿
3. **更清楚**：標題不會自動加「(複本)」，使用者可以自行命名
4. **更安全**：日期和時間不會直接複製，避免誤用過去的時間設定

### 注意事項
1. 複製的資料暫存在 Pinia Store 中，**重新整理頁面會遺失**
2. 如果使用者複製後導向其他頁面再回到 New 頁面，複製資料仍會存在（直到清除或建立排程）
3. 可考慮在 New 頁面顯示提示訊息：「已從『標題名稱』複製資料」

---

## 🚀 部署建議

1. 先在開發環境完整測試所有功能
2. 確認不會影響編輯現有排程的功能
3. 確認 Store 的 `reset()` 在登出時有被呼叫
4. 部署後觀察是否有使用者回報問題

---

## 📌 未來可能的優化

1. **增加視覺提示**：在 New 頁面頂部顯示「✨ 已從『原標題』複製資料」的提示卡片
2. **支援鍵盤快捷鍵**：按 `Ctrl+D` 快速複製選中的排程
3. **複製歷史記錄**：保留最近複製的 3 筆資料，讓使用者可以選擇
4. **自動標題建議**：根據原標題智慧建議新標題（例如：增加日期或序號）

---

## ✅ 完成標準

當以下條件全部滿足時，即完成此功能改造：

1. ✅ 點選複製按鈕後，不再呼叫 API 建立草稿
2. ✅ 資料正確儲存到 Pinia Store
3. ✅ New 頁面正確載入複製的資料（排除日期/時間/截止時間）
4. ✅ 使用者可以正常編輯並儲存
5. ✅ 不影響原有的新建和編輯功能
6. ✅ 所有測試檢查項目通過
