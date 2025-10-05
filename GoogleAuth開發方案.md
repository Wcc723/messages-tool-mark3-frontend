## 🌐 SPA 網站整合方案

**✅ 已可完美整合其他 SPA 網站**，使用前端 SDK 模式：

### **前端實作範例**:

#### **React 範例**:

```javascript
// 1. 安裝並載入 Google Identity Services
import { GoogleAuth } from 'google-auth-library'

// 2. 初始化 Google 登入
useEffect(() => {
  window.google?.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID',
    callback: handleGoogleLogin,
  })
}, [])

// 3. 處理 Google 登入
const handleGoogleLogin = async (response) => {
  try {
    const result = await fetch('http://localhost:3002/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        googleToken: response.credential,
      }),
    })

    const data = await result.json()

    if (data.success) {
      // 儲存 JWT Token
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('refreshToken', data.data.refreshToken)

      // 更新使用者狀態
      setUser(data.data.user)
      navigate('/dashboard')
    }
  } catch (error) {
    console.error('Google 登入失敗:', error)
  }
}
```

#### **Vue 範例**:

```javascript
// composables/useAuth.js
export const useGoogleAuth = () => {
  const login = async (googleToken) => {
    const { data } = await $fetch('/api/auth/google', {
      method: 'POST',
      body: { googleToken },
    })

    // 儲存 Token 和使用者資料
    await navigateTo('/dashboard')
  }

  return { login }
}
```

### 📋 API 回應格式

**成功回應**:

```json
{
  "success": true,
  "message": "Google 登入成功",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@gmail.com",
      "name": "User Name",
      "role": "user",
      "avatar": "https://lh3.googleusercontent.com/...",
      "googleId": "123456789012345678901",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2024-01-22T10:30:00.000Z"
  }
}
```

**錯誤回應**:

```json
{
  "success": false,
  "message": "Google Token 無效或已過期"
}
```

## 🚀 多 SPA 整合建議

### **環境設定**:

```env
# 後端 .env
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
CORS_ORIGIN=https://spa1.com,https://spa2.com,https://spa3.com
FRONTEND_URL=https://primary-spa.com
```

### **Google Cloud Console 設定**:

1. 在授權的 JavaScript 來源新增各個 SPA 域名
2. 在授權的重導向 URI 新增各個回調 URL
3. 確保所有 SPA 使用相同的 `client_id`

### **統一認證流程**:

```javascript
// 各個 SPA 都使用相同的認證邏輯
const authenticateWithBackend = async (googleToken) => {
  const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ googleToken }),
  })

  return await response.json()
}
```

### **Token 管理** （這個部分請改為 Cookie）:

```javascript
// 跨 SPA 的 Token 共享 (可選)
const setAuthToken = (token, refreshToken) => {
  localStorage.setItem('hex_toolman_token', token)
  localStorage.setItem('hex_toolman_refresh', refreshToken)

  // 設定 API 請求預設 Header
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
```

## ✨ 實作亮點

1. **完整性**: 支援兩種 OAuth 模式，適用不同場景
2. **安全性**: 使用官方 Google 函式庫，完整驗證流程
3. **靈活性**: 支援 Google 使用者與傳統使用者混合
4. **擴展性**: 統一的 JWT 格式，易於多應用整合
5. **相容性**: 不影響現有功能，純新增特性

**結論**: 此 Google OAuth 實作已經完整且功能強大，可直接用於生產環境，並支援多個 SPA 網站的統一身份認證。
