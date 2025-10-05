# Google OAuth 設定指南

## 📋 功能說明

本專案已整合 Google Identity Services SDK，提供以下認證方式：
- ✅ 傳統帳號密碼登入/註冊
- ✅ Google OAuth 登入（前端 SDK 模式）
- ✅ Cookie 儲存 Token（可輕鬆升級為 httpOnly）

## 🚀 快速開始

### 1. 設定環境變數

複製 `.env.example` 並建立 `.env` 檔案：

```bash
cp .env.example .env
```

在 `.env` 中設定：

```env
# 後端 API URL
VITE_API_BASE_URL=http://localhost:3000

# Google OAuth Client ID (從 Google Cloud Console 取得)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 2. 取得 Google OAuth Client ID

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google+ API**
4. 建立 OAuth 2.0 憑證（Web 應用程式）
5. 設定授權的 JavaScript 來源：
   ```
   http://localhost:5173
   https://yourdomain.com
   ```
6. 複製 Client ID 到 `.env` 檔案

## 🔧 技術實作

### Cookie 管理

所有認證 Token 現在儲存在 Cookie 中（`src/utils/cookies.ts`）：

```typescript
// Cookie 名稱
COOKIE_NAMES.AUTH_TOKEN      // hex_toolman_token
COOKIE_NAMES.REFRESH_TOKEN   // hex_toolman_refresh

// Cookie 預設設定
{
  path: '/',
  sameSite: 'Lax',
  expires: 7  // Auth token 7 天
}
```

**未來升級為 httpOnly：**
只需要後端在登入時設定 httpOnly cookie，前端會自動使用 `withCredentials: true` 發送 cookie。

### Google OAuth 流程

```
1. 使用者點擊 "Sign in with Google" 按鈕
   ↓
2. Google Identity Services SDK 處理登入
   ↓
3. 取得 Google credential (JWT)
   ↓
4. 發送到後端 POST /api/auth/google
   ↓
5. 後端驗證並回傳應用 token
   ↓
6. 儲存 token 到 Cookie
   ↓
7. 導向 Dashboard
```

## 📁 重要檔案

```
src/
├── utils/
│   ├── cookies.ts              # Cookie 工具函數
│   └── axios.ts                # Axios 實例 (支援 Cookie)
├── types/
│   ├── api.ts                  # API 類型定義
│   └── google.d.ts             # Google SDK 類型定義
├── services/
│   └── auth.ts                 # 認證 API 服務
├── stores/
│   └── auth.ts                 # 認證 Store (使用 Cookie)
└── pages/
    └── LoginView.vue           # 登入頁面 (整合 Google SDK)
```

## 🔒 安全性

### 目前實作（Client-side Cookie）
- Cookie 名稱：`hex_toolman_token`
- SameSite：`Lax`
- 過期時間：7 天
- JavaScript 可存取：✅

### 未來升級（HttpOnly Cookie）
後端需要修改：

```javascript
// 後端登入 API 回應
res.cookie('hex_toolman_token', token, {
  httpOnly: true,    // JavaScript 無法存取
  secure: true,      // 僅 HTTPS
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 天
})
```

前端已經設定 `withCredentials: true`，不需要額外修改。

## 🎨 UI 元件

Google 登入按鈕由 Google SDK 自動渲染：

```typescript
window.google.accounts.id.renderButton(container, {
  type: 'standard',
  theme: 'outline',
  size: 'large',
  text: 'signin_with',
  shape: 'rectangular',
})
```

可在 `LoginView.vue` 的 `onMounted` 中調整樣式。

## 🧪 測試

1. 啟動後端：`cd backend && npm run dev`
2. 啟動前端：`pnpm run dev`
3. 開啟 `http://localhost:5173`
4. 測試：
   - 傳統登入/註冊
   - Google OAuth 登入
   - Cookie 儲存檢查（開發者工具 → Application → Cookies）

## ⚠️ 注意事項

1. **開發環境**：Google OAuth 僅支援 `localhost` 和已註冊的域名
2. **生產環境**：需在 Google Cloud Console 加入正式域名
3. **CORS**：確保後端允許前端域名的跨域請求
4. **Cookie Domain**：跨子域名需設定 `domain` 屬性

## 📚 參考文件

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Cookie 最佳實踐](https://web.dev/samesite-cookies-explained/)
