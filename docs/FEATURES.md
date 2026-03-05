# 功能模組

## 認證與使用者管理

- **登入方式**：Email/Password、Google OAuth
- **JWT 認證**：Bearer token + Refresh token 自動刷新
- **使用者資料**：id、email、name、role（admin/user）、avatar
- **功能**：登入、註冊、登出、個人資料編輯、密碼變更

相關檔案：
- `src/services/api/auth.ts`
- `src/stores/auth.ts`
- `src/pages/LoginView.vue`、`src/pages/ProfileView.vue`

## Discord 整合

- **Bot 驗證**：檢查 Discord Bot 連線狀態
- **伺服器管理**：列出 Bot 已加入的 Guild
- **頻道存取**：取得特定 Guild 的頻道列表
- **訊息發送**：傳送測試訊息與排程訊息至 Discord 頻道

相關檔案：
- `src/services/api/discord.ts`
- `src/stores/discord.ts`
- `src/pages/DiscordView.vue`

## 排程管理

### 排程類型
- `once` — 單次執行（指定日期時間）
- `weekly` — 每週循環（指定星期幾）
- `monthly` — 每月循環（指定日期）

### 排程狀態
- `draft` → `active` → `paused` / `completed`

### 功能
- 排程建立/編輯（含附件圖片、Discord Thread 設定）
- 排程日曆檢視
- 排程狀態管理
- 執行記錄追蹤（成功/失敗/pending）
- 時區支援（預設 Asia/Taipei）

相關檔案：
- `src/services/api/schedule.ts`、`src/services/api/storage.ts`
- `src/stores/schedule.ts`
- `src/pages/ScheduleCreateView.vue`、`ScheduleCalendarView.vue`、`ScheduleStatusView.vue`

## 打卡系統

- **打卡排程**：建立打卡活動（名稱、頻道、日期範圍、關鍵字）
- **打卡模式**：standard、extended（延後計算）、all_period
- **掃描功能**：掃描 Discord Thread 中的打卡訊息
- **統計報告**：每日統計、用戶打卡紀錄、完成進度
- **公開 API**：打卡報告頁面可不登入檢視

相關檔案：
- `src/services/api/checkin.ts`、`src/services/api/checkinPublic.ts`
- `src/stores/checkin.ts`
- `src/pages/checkin/`

## AI 圖片生成

- **角色管理**：建立/編輯 AI 角色（名稱、描述、風格提示詞）
- **Session 管理**：建立生成 Session、歷史紀錄查詢
- **即時生成**：透過 WebSocket 接收生成進度與結果
- **管理後台**：AI 功能的系統設定與統計

相關檔案：
- `src/services/api/aiCharacter.ts`、`aiAdmin.ts`、`aiSessions.ts`
- `src/stores/aiCharacter.ts`、`aiGeneration.ts`
- `src/composables/useImageGeneration.ts`
- `src/pages/ai/`、`src/components/ai/`

## 管理後台

- **使用者管理**：檢視/編輯使用者列表、角色指派、帳號啟用/停用
- **權限控管**：基於 role 的路由權限（admin/user），透過 `permissionStore` 管理
- **AI 管理**：AI 功能系統設定

相關檔案：
- `src/services/api/admin.ts`
- `src/stores/permission.ts`
- `src/pages/admin/`

## API 回應格式

所有 API 回應遵循統一結構：
```typescript
interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}
```

分頁端點額外包含：
```typescript
interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
}
```
