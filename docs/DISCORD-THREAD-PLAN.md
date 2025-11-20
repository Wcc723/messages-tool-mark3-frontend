# Discord Thread 功能實作計劃

## 概述

本計劃旨在為 Discord 自動化排程訊息工具新增 Thread（子討論串）功能。當用戶建立或編輯排程時，可以選擇是否在訊息發送後自動建立一個 Thread，方便後續討論。

## API 更新分析

根據 `openapi.json` 的更新，後端已支援以下 Thread 功能：

### 1. ThreadConfig Schema

```typescript
interface ThreadConfig {
  enabled: boolean                    // 是否啟用子討論串功能
  title?: string                      // 子討論串標題（enabled=true 時必填，最多 100 字元）
  initialMessage?: string | null      // 子討論串初始訊息（選填，最多 2000 字元）
}
```

### 2. Schedule 資料結構更新

- **Schedule Schema** 新增欄位：
  - `threadConfig`: ThreadConfig | null

- **ScheduleRequest** 支援 `threadConfig` 參數

### 3. 測試訊息 API 更新

**Endpoint**: `POST /api/discord/test-message`

**請求新增參數**:
```typescript
{
  channelId: string
  content: string
  threadConfig?: ThreadConfig | null  // 新增
}
```

**回應新增欄位**:
```typescript
{
  success: boolean
  message: string
  data: {
    messageId: string
    channelId: string
    guildId: string
    content: string
    timestamp: number
    url: string
    threadId?: string | null          // 新增：Thread ID
    threadUrl?: string | null         // 新增：Thread URL
    threadStatus: 'success' | 'failed' | 'not_configured'  // 新增
    threadError?: string | null       // 新增：錯誤訊息
  }
}
```

### 4. ExecutionLog 資料結構更新

```typescript
interface ExecutionLog {
  // ... 原有欄位
  threadId?: string | null
  threadUrl?: string | null
  threadStatus?: 'success' | 'failed' | 'skipped' | 'not_configured' | null
  threadError?: string | null
}
```

## 前端實作計劃

### 階段一：型別定義更新

**檔案**: `src/services/api/types.ts` 或 `src/types/api.ts`

**任務**:
1. 新增 `ThreadConfig` 介面定義
2. 更新 `Schedule` 介面，新增 `threadConfig` 欄位
3. 更新 `CreateScheduleRequest` 和 `UpdateScheduleRequest` 介面
4. 更新 `ExecutionLog` 介面，新增 thread 相關欄位

**程式碼範例**:
```typescript
export interface ThreadConfig {
  enabled: boolean
  title?: string
  initialMessage?: string | null
}

export interface Schedule {
  id: string
  // ... 其他欄位
  threadConfig?: ThreadConfig | null  // 新增
  // ... 其他欄位
}

export interface CreateScheduleRequest {
  title: string
  content: string
  // ... 其他欄位
  threadConfig?: ThreadConfig | null  // 新增
}

export interface ExecutionLog {
  id: string
  // ... 其他欄位
  threadId?: string | null           // 新增
  threadUrl?: string | null          // 新增
  threadStatus?: 'success' | 'failed' | 'skipped' | 'not_configured' | null  // 新增
  threadError?: string | null        // 新增
}
```

### 階段二：ScheduleCreateView.vue 修改

**檔案**: `src/pages/ScheduleCreateView.vue`

#### 2.1 表單資料結構更新

在 `form` ref 中新增 thread 相關欄位：

```typescript
const form = ref({
  // ... 原有欄位
  threadEnabled: false,
  threadTitle: '',
  threadInitialMessage: '',
})
```

#### 2.2 UI 設計

在「訊息內容」區塊下方或「發送設定」區塊內新增「Thread 設定」區塊：

```vue
<!-- Thread 設定區塊 -->
<div class="bg-white rounded-lg border border-gray-200 p-6">
  <div class="flex items-center gap-3 mb-6">
    <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
      <i class="bi bi-chat-dots text-gray-600 text-lg"></i>
    </div>
    <div>
      <h2 class="text-lg font-semibold text-gray-900">Thread 設定</h2>
      <p class="text-sm text-gray-600">設定是否在訊息發送後建立討論串</p>
    </div>
  </div>

  <div class="space-y-6">
    <!-- 啟用開關 -->
    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-900 mb-1">
          啟用 Thread 功能
        </label>
        <p class="text-sm text-gray-500">
          訊息發送後自動建立一個討論串，方便團隊成員討論
        </p>
      </div>
      <div class="ml-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            v-model="form.threadEnabled"
            type="checkbox"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
        </label>
      </div>
    </div>

    <!-- Thread 標題（當啟用時顯示） -->
    <div v-if="form.threadEnabled">
      <label for="threadTitle" class="block text-sm font-medium text-gray-700 mb-2">
        Thread 標題 <span class="text-red-500">*</span>
      </label>
      <input
        id="threadTitle"
        v-model="form.threadTitle"
        type="text"
        required
        maxlength="100"
        class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
        placeholder="例如：每週例會討論區"
      />
      <p class="text-sm text-gray-500 mt-2">{{ form.threadTitle.length }} / 100 字元</p>
    </div>

    <!-- Thread 初始訊息（當啟用時顯示） -->
    <div v-if="form.threadEnabled">
      <label for="threadInitialMessage" class="block text-sm font-medium text-gray-700 mb-2">
        Thread 初始訊息（選填）
      </label>
      <textarea
        id="threadInitialMessage"
        v-model="form.threadInitialMessage"
        maxlength="2000"
        rows="4"
        class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none transition"
        placeholder="輸入 Thread 的第一則訊息（選填）"
      ></textarea>
      <p class="text-sm text-gray-500 mt-2">{{ form.threadInitialMessage.length }} / 2000 字元</p>
    </div>

    <!-- 說明提示 -->
    <div v-if="form.threadEnabled" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <i class="bi bi-info-circle text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
        <div class="text-sm text-blue-800">
          <p class="font-medium mb-1">關於 Thread 功能</p>
          <ul class="list-disc list-inside space-y-1 text-blue-700">
            <li>Thread 會在訊息發送後自動建立</li>
            <li>團隊成員可以在 Thread 內進行討論，不會干擾主頻道</li>
            <li>初始訊息可以用來說明討論主題或提供指引</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 2.3 資料載入邏輯更新

**`loadSchedule` 函數**（編輯模式）:
```typescript
async function loadSchedule(id: string) {
  try {
    const schedule = await scheduleStore.fetchScheduleById(id)

    form.value = {
      // ... 原有欄位
      threadEnabled: schedule.threadConfig?.enabled ?? false,
      threadTitle: schedule.threadConfig?.title ?? '',
      threadInitialMessage: schedule.threadConfig?.initialMessage ?? '',
    }
    // ...
  } catch (error: any) {
    // 錯誤處理
  }
}
```

**`loadCopiedSchedule` 函數**（複製模式）:
```typescript
function loadCopiedSchedule() {
  if (!copiedScheduleData.value) return

  const copied = copiedScheduleData.value

  form.value = {
    // ... 原有欄位
    threadEnabled: copied.threadConfig?.enabled ?? false,
    threadTitle: copied.threadConfig?.title ?? '',
    threadInitialMessage: copied.threadConfig?.initialMessage ?? '',
  }

  scheduleStore.clearCopiedSchedule()
}
```

#### 2.4 表單驗證更新

在 `validateForm` 函數中新增 thread 欄位驗證：

```typescript
const validateForm = ({ alertOnError = false } = {}) => {
  const fail = (message: string) => {
    if (alertOnError) {
      alert(message)
    }
    return false
  }

  // ... 原有驗證邏輯

  // Thread 驗證
  if (form.value.threadEnabled) {
    if (!form.value.threadTitle || form.value.threadTitle.trim() === '') {
      return fail('啟用 Thread 功能時，Thread 標題為必填')
    }
    if (form.value.threadTitle.length > 100) {
      return fail('Thread 標題不可超過 100 字元')
    }
    if (form.value.threadInitialMessage && form.value.threadInitialMessage.length > 2000) {
      return fail('Thread 初始訊息不可超過 2000 字元')
    }
  }

  return true
}
```

#### 2.5 提交資料建構更新

在 `buildPayload` 函數中新增 threadConfig：

```typescript
function buildPayload() {
  const payload: any = {
    title: form.value.title,
    content: form.value.content,
    // ... 其他欄位
  }

  // ... 原有邏輯

  // Thread 配置
  if (form.value.threadEnabled) {
    payload.threadConfig = {
      enabled: true,
      title: form.value.threadTitle.trim(),
      initialMessage: form.value.threadInitialMessage.trim() || null,
    }
  } else {
    payload.threadConfig = null
  }

  return payload
}
```

### 階段三：ScheduleCalendarView.vue 修改

**檔案**: `src/pages/ScheduleCalendarView.vue`

#### 3.1 顯示 Thread 資訊

在排程詳情區域（列表檢視和行事曆檢視的排程卡片）新增 Thread 標記：

**列表檢視中的排程項目**：
```vue
<!-- 在排程卡片的標籤區域新增 Thread 標記 -->
<div class="flex flex-wrap gap-3 text-sm">
  <!-- 原有的標籤 -->
  <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
    <i class="bi bi-calendar-event text-gray-600"></i>
    <span class="font-medium text-gray-800">{{ schedule.scheduledDate || '-' }}</span>
  </div>
  <!-- ... 其他標籤 -->

  <!-- Thread 標記（如果有啟用） -->
  <div
    v-if="schedule.threadConfig?.enabled"
    class="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-md"
    :title="schedule.threadConfig.title"
  >
    <i class="bi bi-chat-dots text-purple-600"></i>
    <span class="font-medium text-purple-800">Thread 已啟用</span>
  </div>
</div>
```

#### 3.2 排程詳情 Modal 更新

在 Modal 的「排程資訊」區塊中新增 Thread 詳細資訊：

```vue
<!-- 在 Modal Body 的排程資訊區塊中 -->
<div v-if="modalSchedule.threadConfig?.enabled" class="bg-white rounded-lg p-4 border border-gray-200 col-span-2">
  <div class="flex items-center gap-2 mb-3">
    <div class="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center border border-purple-200">
      <i class="bi bi-chat-dots text-purple-600"></i>
    </div>
    <h3 class="text-base font-semibold text-gray-900">Thread 設定</h3>
  </div>
  <div class="space-y-3">
    <div>
      <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Thread 標題</p>
      <p class="text-sm font-medium text-gray-900">{{ modalSchedule.threadConfig.title }}</p>
    </div>
    <div v-if="modalSchedule.threadConfig.initialMessage">
      <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">初始訊息</p>
      <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ modalSchedule.threadConfig.initialMessage }}</p>
    </div>
    <div class="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-md">
      <i class="bi bi-info-circle"></i>
      <span>此排程會在訊息發送後自動建立討論串</span>
    </div>
  </div>
</div>
```

### 階段四：ScheduleStatusView.vue 修改（如果存在）

**檔案**: `src/pages/ScheduleStatusView.vue`

如果專案中有 ScheduleStatusView（排程狀態/執行記錄檢視），需要顯示 Thread 執行結果：

```vue
<!-- 在執行記錄的詳細資訊中 -->
<div v-if="log.threadStatus && log.threadStatus !== 'not_configured'" class="mt-4">
  <h4 class="text-sm font-medium text-gray-900 mb-2">Thread 建立結果</h4>

  <!-- Thread 成功 -->
  <div v-if="log.threadStatus === 'success'" class="bg-green-50 border border-green-200 rounded-lg p-3">
    <div class="flex items-start gap-3">
      <i class="bi bi-check-circle-fill text-green-600 text-lg flex-shrink-0"></i>
      <div class="flex-1">
        <p class="text-sm font-medium text-green-900 mb-1">Thread 建立成功</p>
        <a
          v-if="log.threadUrl"
          :href="log.threadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-green-700 hover:text-green-800 underline flex items-center gap-1"
        >
          <span>查看 Thread</span>
          <i class="bi bi-box-arrow-up-right text-xs"></i>
        </a>
      </div>
    </div>
  </div>

  <!-- Thread 失敗 -->
  <div v-if="log.threadStatus === 'failed'" class="bg-red-50 border border-red-200 rounded-lg p-3">
    <div class="flex items-start gap-3">
      <i class="bi bi-exclamation-triangle-fill text-red-600 text-lg flex-shrink-0"></i>
      <div class="flex-1">
        <p class="text-sm font-medium text-red-900 mb-1">Thread 建立失敗</p>
        <p v-if="log.threadError" class="text-sm text-red-700">{{ log.threadError }}</p>
      </div>
    </div>
  </div>

  <!-- Thread 跳過 -->
  <div v-if="log.threadStatus === 'skipped'" class="bg-gray-50 border border-gray-200 rounded-lg p-3">
    <div class="flex items-start gap-3">
      <i class="bi bi-dash-circle text-gray-500 text-lg flex-shrink-0"></i>
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-700">Thread 建立已跳過</p>
      </div>
    </div>
  </div>
</div>
```

## 測試計劃

### 單元測試

1. **表單驗證測試**
   - Thread 啟用時，標題為空的驗證
   - Thread 標題超過 100 字元的驗證
   - Thread 初始訊息超過 2000 字元的驗證

2. **資料建構測試**
   - `buildPayload()` 正確建構 threadConfig
   - Thread 未啟用時，threadConfig 為 null

### 整合測試

1. **建立排程流程**
   - 啟用 Thread 功能並建立排程
   - 不啟用 Thread 功能並建立排程
   - 建立後返回列表檢視，確認顯示正確

2. **編輯排程流程**
   - 編輯現有排程，啟用 Thread 功能
   - 編輯現有排程，停用 Thread 功能
   - 編輯現有排程的 Thread 標題和初始訊息

3. **複製排程流程**
   - 複製有 Thread 設定的排程
   - 複製沒有 Thread 設定的排程

4. **檢視排程流程**
   - 行事曆檢視中顯示 Thread 標記
   - 列表檢視中顯示 Thread 標記
   - Modal 中顯示完整 Thread 資訊

### 使用者驗收測試（UAT）

1. **UI/UX 驗證**
   - Thread 設定區塊的視覺設計符合整體風格
   - 啟用/停用 Thread 的交互流暢
   - 表單欄位的提示文字清晰易懂

2. **功能驗證**
   - Thread 功能開關正常運作
   - 必填欄位驗證正確
   - 資料儲存後可正確讀取

## 時程規劃

| 階段 | 任務 | 預估時間 |
|------|------|----------|
| 階段一 | 型別定義更新 | 30 分鐘 |
| 階段二 | ScheduleCreateView.vue 修改 | 2-3 小時 |
| 階段三 | ScheduleCalendarView.vue 修改 | 1-2 小時 |
| 階段四 | ScheduleStatusView.vue 修改（如適用） | 1 小時 |
| 測試 | 單元測試、整合測試 | 1-2 小時 |
| 總計 | | 約 5.5-8.5 小時 |

## 注意事項

1. **向後相容性**
   - 確保舊的排程資料（沒有 threadConfig）能正常顯示
   - 使用 optional chaining (`?.`) 和 nullish coalescing (`??`) 處理 threadConfig

2. **錯誤處理**
   - Thread 建立失敗時，主訊息應該仍然成功發送
   - 在執行記錄中清楚標示 Thread 的狀態

3. **使用者體驗**
   - Thread 設定應該預設為關閉（false）
   - 提供清晰的說明，讓使用者理解 Thread 的用途
   - 字數限制提示應該即時顯示

4. **效能考量**
   - Thread 相關欄位不會顯著增加頁面負載
   - 使用 `v-if` 而非 `v-show` 來控制條件渲染，減少不必要的 DOM

## 參考資源

- [Discord API - Threads Documentation](https://discord.com/developers/docs/topics/threads)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 版本紀錄

| 版本 | 日期 | 修改內容 |
|------|------|----------|
| 1.0 | 2025-01-20 | 初始版本，完整功能規劃 |
