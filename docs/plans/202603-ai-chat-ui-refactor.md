# AI 圖片生成頁面 — 對話式 UI 重構計畫

## Context

現有 `AiGeneratorView.vue` 採用傳統表單式佈局（左側設定面板 + 右側生成區 Grid），操作流程不直覺：需手動開始 Session、設定藏在可摺疊面板、結果以卡片 Grid 顯示無法看出對話脈絡。使用者希望改為類似 ChatGPT 的對話式介面，讓產圖體驗更自然流暢。

## 目標佈局

```
+------------+----------------------------------+
| ChatSidebar| ChatToolbar                      |
|            | [連線狀態] [模型切換] [Session 狀態]|
| 歷史對話    +----------------------------------+
| 列表       |                                  |
|            |  ChatMessageList                  |
| - 對話1    |    user: prompt                   |
| - 對話2    |    ai: 圖片 + 操作按鈕             |
| - 對話3    |    user: prompt                   |
|            |    ai: 圖片                       |
|            |    (生成中動畫...)                 |
| [+ 新對話]  +----------------------------------+
|            | ChatInput                        |
|            | [角色▾] [情境▾] [參考圖] [設定]     |
|            | [輸入框...........................] [➤]|
+------------+----------------------------------+
```

角色和情境選擇放在底部輸入區，因為它們屬於產圖前由使用者提供的輸入。

## 實作步驟

### Step 1: 型別新增 `src/types/ai-generation.ts`

新增 `ChatMessageItem` 介面：
```ts
export interface ChatMessageItem {
  id: string
  type: 'user' | 'assistant' | 'system'
  prompt?: string
  result?: GenerationResult
  systemMessage?: string
  timestamp: string
}
```

### Step 2: Store 小幅調整 `src/stores/aiGeneration.ts`

- 新增 `pendingGeneration` ref — 存放等待 session 建立後要執行的生成請求
- 在 `handleSessionCreated` 中：如有 pendingGeneration，自動觸發 `generate` 並清空
- 在 `handleSessionEnded` 中：**不再自動清空** `generationHistory`（改由 View 層控制）
- 新增 `clearHistory()` 方法
- 在 `handleError` 中：如有 pendingGeneration 且為 `start_session_failed`，清空 pending
- Export 新的 `pendingGeneration` 和 `clearHistory`

### Step 3: 新元件 `src/components/ai/chat/ChatMessage.vue`

**Props**: `type: 'user'|'assistant'|'system'`, `prompt?`, `result?: GenerationResult`, `isGenerating?`, `systemMessage?`
**Emits**: `preview(result)`, `download(result)`

顯示邏輯：
- `user`: 右對齊灰色氣泡，顯示 prompt 文字
- `assistant`: 左對齊，顯示圖片（可點擊預覽）+ 狀態 badge + 下載按鈕 + 錯誤訊息；失敗/過濾時顯示對應提示
- `system`: 居中小字灰色提示（如「Session 已自動建立」）
- 複用 `GenerationResult.vue` 的 statusBadge/formattedDate 計算邏輯（內聯，不引用元件）

### Step 4: 新元件 `src/components/ai/chat/ChatMessageList.vue`

**Props**: `messages: ChatMessageItem[]`, `isGenerating: boolean`
**Emits**: `preview(result)`, `download(result)`

功能：
- `overflow-y-auto` 容器，`flex flex-col` 佈局
- 迴圈渲染 `ChatMessage`
- 生成中時在底部顯示 loading 氣泡（骨架動畫）
- 空狀態居中提示
- `watch` messages 長度變化 → `nextTick` → `scrollTo` 底部

### Step 5: 新元件 `src/components/ai/chat/ChatToolbar.vue`

**Props**: `connectionState`, `currentSession`, `selectedModel`, `sessionExpiresIn`
**Emits**: `update:selectedModel`, `reconnect`

佈局：單行水平排列，高度 ~48px
- 左側：ConnectionStatus 元件（複用現有）
- 中間：模型切換（`<select>` 或 toggle）
- 右側：Session 狀態小字（剩餘時間倒計時，過期時顯示提示）

注意：角色和情境選擇不在此元件，而是在底部 ChatInput 中。

### Step 6: 新元件 `src/components/ai/chat/ChatInput.vue`

**Props**: `disabled`, `isGenerating`, `allowEmpty`, `selectedCharacterId`, `selectedScenarioId`, `characters`, `scenarios`, `selectedCharacter`, `availableReferenceImages`, `aspectRatio`, `imageSize`
**Emits**: `submit(payload: { prompt, referenceImage?, settings })`, `update:aspectRatio`, `update:imageSize`, `update:selectedCharacterId`, `update:selectedScenarioId`

佈局（兩行結構）：
```
第一行（選項列）：[角色▾] [情境▾] [參考圖] [設定⚙️]
第二行（輸入列）：[textarea.....................] [➤送出]
```
- 第一行：角色和情境下拉選擇 + 參考圖按鈕（有角色時顯示）+ 設定 popover（比例/尺寸）
- textarea: 單行起始，自動增高至最多 4 行，Ctrl+Enter 送出
- 參考圖按鈕：僅在有選擇角色且有可用圖片時顯示，點擊展開 popover
- 設定按鈕：點擊展開 popover 顯示 aspectRatio + imageSize 選項
- 送出按鈕：生成中時顯示 spinner + 禁用
- 字數限制 2000

### Step 7: 新元件 `src/components/ai/chat/ChatSidebar.vue`

**Props**: `currentSessionId`
**Emits**: `select(session: SessionItem)`, `new-chat`, `delete(sessionId, keepHistory)`

功能：
- `onMounted` 載入 sessions（active + completed），複用 `aiSessionsApi.getSessions` 邏輯
- 列表項顯示：縮圖、模型、角色名、生成數、時間
- 當前 session 高亮
- 「+ 新對話」按鈕
- 刪除功能（hover 顯示刪除按鈕，確認 popover）
- 簡易分頁（載入更多）
- 響應式：`md:` 以下隱藏，工具列加漢堡按鈕展開 drawer

### Step 8: 重寫 `src/pages/ai/AiGeneratorView.vue`

**Template**: 完全重寫為新佈局
```html
<div class="flex h-[calc(100vh-64px)]">
  <ChatSidebar class="w-72 border-r hidden md:flex" ... />
  <div class="flex-1 flex flex-col min-w-0">
    <ChatToolbar class="border-b" ... />
    <ChatMessageList class="flex-1 overflow-y-auto" ... />
    <ChatInput class="border-t" ... />
  </div>
</div>
```

**Script 改動**:
- 移除 `showGenerationSettings` 等舊 UI 狀態
- 新增 `chatMessages` computed：反轉 `generationHistory` 並展開為 user+assistant 對
- 修改 `handleGenerate`：無 active session 時自動建立（設定 pendingGeneration）
- 新增 `handleNewChat`：清空歷史 + endSession
- 保留：handleSessionSelect、handleDownload、handlePreview、previewImage Modal
- 移除：handleStartSession、handleEndSession、handleRestartSession（自動管理）
- 保留刪除確認 Modal（簡化）

**自動 Session 管理流程**:
```
handleGenerate():
  if hasActiveSession → generate(prompt, refImg, settings)
  else → store 設定 pendingGeneration → startSession(model, characterId, scenarioId)
        → session_created 事件 → store 自動 generate pending → 清空 pending

Session 過期:
  → store 更新狀態 → UI 自動在工具列顯示「已過期」
  → 使用者下次送出 → 走上述 "無 active session" 流程，自動重建
```

### Step 9: 測試與調整

- 測試完整流程：首次生成（自動建立 session）→ 連續生成 → session 過期後重新生成
- 測試側邊欄：切換歷史對話（active/completed）→ 載入歷史 → 新對話
- 測試響應式佈局：桌面 / 平板寬度
- 測試邊界情況：WebSocket 斷線重連、生成失敗、內容過濾

## 關鍵檔案

| 檔案 | 動作 |
|------|------|
| `src/types/ai-generation.ts` | 新增 ChatMessageItem |
| `src/stores/aiGeneration.ts` | 修改：pendingGeneration、clearHistory、handleSessionEnded 不清空歷史 |
| `src/components/ai/chat/ChatMessage.vue` | 新建 |
| `src/components/ai/chat/ChatMessageList.vue` | 新建 |
| `src/components/ai/chat/ChatToolbar.vue` | 新建 |
| `src/components/ai/chat/ChatInput.vue` | 新建 |
| `src/components/ai/chat/ChatSidebar.vue` | 新建 |
| `src/pages/ai/AiGeneratorView.vue` | 完全重寫 |
| `src/components/ai/ConnectionStatus.vue` | 保留不動（被 ChatToolbar 引用） |

## 可複用的現有資源

- `ConnectionStatus.vue` — 直接嵌入 ChatToolbar
- `GenerationResult.vue` 的 statusBadge / formattedDate 邏輯 — 在 ChatMessage 中內聯複用
- `SessionSelectModal.vue` 的 session 載入 + 縮圖邏輯 — 在 ChatSidebar 中複用
- `aiSessionsApi` — getSessions、getSessionDetail、deleteSession
- Store 的 generate、startSession、resumeSession、loadHistoryFromSession 方法全部保留

## 不被淘汰但不再使用的元件

`SessionSelectModal.vue`、`SessionInfo.vue`、`GenerationHistory.vue`、`PromptInput.vue` — 功能被新元件取代，先保留檔案不刪除，待確認穩定後再清理。

## 驗證方式

1. `pnpm run type-check` 確認型別正確
2. `pnpm run lint` 確認程式碼風格
3. `pnpm run dev` 啟動開發伺服器，手動測試：
   - 頁面載入 → 自動連線 → 工具列顯示連線狀態
   - 輸入 prompt 送出 → 自動建立 session → 生成圖片 → 對話流顯示
   - 切換角色/情境 → 工具列選擇器變更
   - 側邊欄顯示歷史對話 → 點擊切換 → 載入歷史
   - 新對話按鈕 → 清空對話流
   - 圖片點擊預覽 → 下載功能正常
