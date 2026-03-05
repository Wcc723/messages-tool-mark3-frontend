# AI 圖片生成功能開發計畫

## 概述

本計畫將實作 AI 圖片生成功能，包含 WebSocket 即時通訊、角色管理、圖片生成介面及管理員統計儀表板。

---

## 1. 新增檔案結構

```
src/
├── types/
│   └── ai-generation.ts          # AI 生成相關型別定義
├── services/
│   ├── api/
│   │   ├── aiCharacter.ts        # 角色管理 REST API
│   │   └── aiAdmin.ts            # 管理員 AI API
│   └── imageGenerationSocket.ts  # WebSocket 連線管理
├── stores/
│   ├── aiGeneration.ts           # AI 生成狀態管理
│   └── aiCharacter.ts            # 角色管理狀態
├── composables/
│   └── useImageGeneration.ts     # 圖片生成 Composable
├── pages/
│   └── ai/
│       ├── AiGeneratorView.vue   # AI 圖片生成主頁面
│       ├── CharacterListView.vue # 角色列表頁面
│       ├── CharacterFormView.vue # 角色建立/編輯表單
│       └── AiAdminView.vue       # 管理員統計儀表板
└── components/
    └── ai/
        ├── ConnectionStatus.vue   # 連線狀態指示器
        ├── GenerationResult.vue   # 生成結果顯示
        ├── PromptInput.vue        # Prompt 輸入區
        ├── SessionInfo.vue        # Session 資訊顯示
        ├── CharacterCard.vue      # 角色卡片
        ├── CharacterImageUpload.vue  # 角色圖片上傳
        └── GenerationHistory.vue  # 生成歷史記錄
```

---

## 2. 實作步驟

### Phase 1: 基礎建設

#### 1.1 安裝依賴
```bash
pnpm add socket.io-client
```

#### 1.2 建立型別定義 (`src/types/ai-generation.ts`)
- `AIModel`: 'nano-banana' | 'nano-banana-pro'
- `GenerationStatus`: 'success' | 'failed' | 'filtered'
- `SessionStatus`: 'active' | 'completed' | 'expired'
- `Character`, `ReferenceImage`, `ObjectImage` 介面
- `GenerationSession`, `GenerationResult`, `GenerationHistory` 介面
- `WSError`, `AuthenticatedUser` 介面
- `SessionSettings` (aspectRatio, imageSize)

#### 1.3 建立 REST API 服務

**`src/services/api/aiCharacter.ts`** - 角色管理 API:
- `list(params)` - GET `/api/ai/characters`
- `get(id)` - GET `/api/ai/characters/{id}`
- `create(data)` - POST `/api/ai/characters`
- `update(id, data)` - PUT `/api/ai/characters/{id}`
- `delete(id)` - DELETE `/api/ai/characters/{id}`
- `uploadImage(id, file, type, metadata)` - POST `/api/ai/characters/{id}/images`
- `deleteImage(id, index, type)` - DELETE `/api/ai/characters/{id}/images/{index}`
- `getTags()` - GET `/api/ai/characters/tags/list`

**`src/services/api/aiAdmin.ts`** - 管理員 API:
- `getStatistics(params)` - GET `/api/admin/ai/statistics`
- `getHistory(params)` - GET `/api/admin/ai/history`
- `getUserUsage(userId, params)` - GET `/api/admin/ai/users/{userId}/usage`
- `getTrend(days)` - GET `/api/admin/ai/trend`
- `getLeaderboard(params)` - GET `/api/admin/ai/leaderboard`

#### 1.4 建立 WebSocket 服務 (`src/services/imageGenerationSocket.ts`)
- `ImageGenerationSocket` class
- 連線管理 (connect, disconnect, reconnect)
- Session 管理 (start_session, resume_session, end_session)
- 生成請求 (generate)
- 事件處理器 (authenticated, session_created, generating, generated, error)
- 連線狀態追蹤 (disconnected, connecting, connected, authenticated)

---

### Phase 2: 狀態管理

#### 2.1 AI 生成 Store (`src/stores/aiGeneration.ts`)
```typescript
// State
- socket: ImageGenerationSocket | null
- connectionState: ConnectionState
- currentSession: GenerationSession | null
- generationHistory: GenerationResult[]
- isGenerating: boolean
- error: string | null

// Actions
- connect(token)
- disconnect()
- startSession(model, characterId?, settings?)
- resumeSession(sessionId)
- generate(prompt, referenceImage?)
- endSession()
```

#### 2.2 角色管理 Store (`src/stores/aiCharacter.ts`)
```typescript
// State
- characters: Character[]
- currentCharacter: Character | null
- tags: string[]
- pagination: PaginationMeta
- isLoading: boolean
- error: string | null

// Actions
- fetchCharacters(params)
- fetchCharacter(id)
- createCharacter(data)
- updateCharacter(id, data)
- deleteCharacter(id)
- uploadImage(id, file, type, metadata)
- deleteImage(id, index, type)
- fetchTags()
```

---

### Phase 3: 頁面與元件

#### 3.1 AI 圖片生成主頁面 (`src/pages/ai/AiGeneratorView.vue`)
功能:
- 連線狀態顯示
- Session 管理 (開始/恢復/結束)
- 模型選擇 (nano-banana, nano-banana-pro)
- 角色選擇 (可選)
- 設定調整 (aspectRatio, imageSize)
- Prompt 輸入
- 參考圖片上傳 (可選)
- 生成結果即時顯示
- 生成歷史列表

#### 3.2 角色列表頁面 (`src/pages/ai/CharacterListView.vue`)
功能:
- 角色卡片列表 (grid layout)
- 搜尋篩選 (名稱、描述)
- 標籤篩選
- 公開/私人篩選
- 分頁
- 新增角色按鈕
- 編輯/刪除操作

#### 3.3 角色表單頁面 (`src/pages/ai/CharacterFormView.vue`)
功能:
- 基本資訊 (名稱、描述、標籤)
- 公開/私人設定
- 角色參考圖片上傳 (最多 5 張)
  - 角度選擇 (front, side, back, detail)
  - 描述輸入
- 物件參考圖片上傳 (最多 5 張)
  - 名稱輸入
- 圖片預覽與刪除

#### 3.4 管理員儀表板 (`src/pages/ai/AiAdminView.vue`)
功能:
- 統計概覽卡片
  - 總生成次數
  - 總 Token 使用量
  - 估算成本
  - 活躍使用者數
- 使用量趨勢表格 (每日數據表格，不使用圖表)
- 使用者排行榜表格
- 生成歷史審計日誌
  - 篩選 (使用者、狀態、日期範圍)
  - 分頁

**注意**: 不安裝額外圖表套件，使用表格形式呈現數據

#### 3.5 共用元件

**ConnectionStatus.vue**:
- 🔴 未連線 / 🟡 連線中 / 🟢 已連線
- 重新連線按鈕

**GenerationResult.vue**:
- 圖片預覽
- Prompt 顯示
- Token 使用量
- 狀態 badge
- 下載按鈕

**PromptInput.vue**:
- 多行文字輸入
- 字數計數
- 送出按鈕
- Loading 狀態

**SessionInfo.vue**:
- Session ID
- 模型資訊
- 角色資訊 (如有選擇)
- 設定資訊
- 剩餘時間/過期時間

**CharacterCard.vue**:
- 縮圖
- 名稱
- 描述 (truncated)
- 標籤
- 公開/私人 badge
- 操作按鈕 (編輯、刪除)

**CharacterImageUpload.vue**:
- 拖放上傳區
- 圖片預覽
- 角度/名稱輸入
- 刪除按鈕

**GenerationHistory.vue**:
- 列表或格狀顯示
- 時間排序
- 快速預覽

---

### Phase 4: 路由設定

更新 `src/router/index.ts`:

在 `/dashboard` 子路由中新增:
```typescript
// AI 圖片生成相關路由 (在 dashboard children 內)
{
  path: 'ai/generator',
  name: 'AiGenerator',
  component: () => import('@/pages/ai/AiGeneratorView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/ai/generator' }
},
{
  path: 'ai/characters',
  name: 'CharacterList',
  component: () => import('@/pages/ai/CharacterListView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/ai/characters' }
},
{
  path: 'ai/characters/new',
  name: 'CharacterCreate',
  component: () => import('@/pages/ai/CharacterFormView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/ai/characters' }
},
{
  path: 'ai/characters/edit/:id',
  name: 'CharacterEdit',
  component: () => import('@/pages/ai/CharacterFormView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/ai/characters' }
},
{
  path: 'admin/ai',
  name: 'AiAdmin',
  component: () => import('@/pages/ai/AiAdminView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/admin/ai' }
}
```

---

### Phase 5: 側邊欄導航

更新 `src/components/SidebarNav.vue`:

在 `allNavGroups` 陣列中新增:
```typescript
{
  title: 'AI 圖片生成',
  items: [
    {
      name: 'AI 生成器',
      path: '/dashboard/ai/generator',
      icon: 'bi-stars',
      permissionKey: 'showAiGenerator',
    },
    {
      name: '角色管理',
      path: '/dashboard/ai/characters',
      icon: 'bi-person-badge',
      permissionKey: 'showAiCharacters',
    },
  ],
},

// 在「系統管理」區塊中新增
{
  name: 'AI 統計',
  path: '/dashboard/admin/ai',
  icon: 'bi-bar-chart-line',
  permissionKey: 'showAiAdmin',
},
```

---

### Phase 6: 環境變數

更新 `.env.example`:
```env
# WebSocket URL (如與 API 相同可省略)
VITE_WS_URL=http://localhost:3000
```

---

### Phase 7: 權限設定

**權限策略**: 所有登入使用者 (manager、admin、super_admin) 皆可使用 AI 生成功能

更新 `doc/frontend-permissions.json`:

```json
// 在 features 中新增 ai 區塊
"ai": {
  "canView": true,              // 可使用 AI 生成功能 (所有角色)
  "canViewAll": true/false,     // 可查看所有人的生成歷史 (admin/super_admin only)
  "canManageCharacters": true,  // 可管理自己的角色 (所有角色)
  "canViewStatistics": true/false  // 可查看統計資料 (admin/super_admin only)
}

// 在 navigation 中新增
"showAiGenerator": true,
"showAiCharacters": true,
"showAiAdmin": true        // 僅 admin/super_admin

// 在 routes.allowedPaths 中新增
"/dashboard/ai/generator",
"/dashboard/ai/characters",
"/dashboard/ai/characters/new",
"/dashboard/ai/characters/edit/:id",
"/dashboard/admin/ai"      // 僅 admin/super_admin
```

更新 `src/types/permission.ts`:
```typescript
// NavigationKey 新增
| 'showAiGenerator'
| 'showAiCharacters'
| 'showAiAdmin'

// FeatureKey 新增
| 'ai'

// AIFeatureActions 介面
interface AIFeatureActions {
  canView: boolean
  canViewAll: boolean
  canManageCharacters: boolean
  canViewStatistics: boolean
}
```

---

## 3. 開發優先順序

按照優先級依序實作:

### 第一優先: AI 生成器核心功能
1. 型別定義 (`src/types/ai-generation.ts`)
2. WebSocket 服務 (`src/services/imageGenerationSocket.ts`)
3. AI 生成 Store (`src/stores/aiGeneration.ts`)
4. AI 生成器頁面 (`src/pages/ai/AiGeneratorView.vue`)
5. 連線狀態元件 (`src/components/ai/ConnectionStatus.vue`)
6. Prompt 輸入元件 (`src/components/ai/PromptInput.vue`)
7. 生成結果元件 (`src/components/ai/GenerationResult.vue`)
8. Session 資訊元件 (`src/components/ai/SessionInfo.vue`)
9. 路由與導航更新

### 第二優先: 角色管理功能
1. 角色 API 服務 (`src/services/api/aiCharacter.ts`)
2. 角色 Store (`src/stores/aiCharacter.ts`)
3. 角色列表頁面 (`src/pages/ai/CharacterListView.vue`)
4. 角色表單頁面 (`src/pages/ai/CharacterFormView.vue`)
5. 角色卡片元件 (`src/components/ai/CharacterCard.vue`)
6. 圖片上傳元件 (`src/components/ai/CharacterImageUpload.vue`)

### 第三優先: 管理員功能
1. 管理員 API 服務 (`src/services/api/aiAdmin.ts`)
2. 管理員儀表板頁面 (`src/pages/ai/AiAdminView.vue`)
3. 生成歷史元件 (`src/components/ai/GenerationHistory.vue`)

### 第四優先: 權限與整合
1. 權限設定更新 (`doc/frontend-permissions.json`)
2. 權限型別更新 (`src/types/permission.ts`)

---

## 4. 關鍵檔案

需修改的現有檔案:
- `src/router/index.ts` - 新增路由
- `src/components/SidebarNav.vue` - 新增導航項目
- `src/services/api/index.ts` - 匯出新 API 模組
- `src/types/permission.ts` - 新增權限型別
- `doc/frontend-permissions.json` - 新增 AI 權限設定
- `.env.example` - 新增環境變數範例

需新增的檔案:
- `src/types/ai-generation.ts`
- `src/services/api/aiCharacter.ts`
- `src/services/api/aiAdmin.ts`
- `src/services/imageGenerationSocket.ts`
- `src/stores/aiGeneration.ts`
- `src/stores/aiCharacter.ts`
- `src/composables/useImageGeneration.ts`
- `src/pages/ai/AiGeneratorView.vue`
- `src/pages/ai/CharacterListView.vue`
- `src/pages/ai/CharacterFormView.vue`
- `src/pages/ai/AiAdminView.vue`
- `src/components/ai/ConnectionStatus.vue`
- `src/components/ai/GenerationResult.vue`
- `src/components/ai/PromptInput.vue`
- `src/components/ai/SessionInfo.vue`
- `src/components/ai/CharacterCard.vue`
- `src/components/ai/CharacterImageUpload.vue`
- `src/components/ai/GenerationHistory.vue`

---

## 5. 驗證方式

### 開發階段測試
1. 執行 `pnpm run dev` 啟動開發伺服器
2. 確認 TypeScript 無編譯錯誤 (`pnpm run type-check`)
3. 確認 ESLint 無錯誤 (`pnpm run lint`)

### 功能測試
1. **WebSocket 連線**:
   - 開啟 AI 生成器頁面
   - 確認連線狀態變為綠燈
   - 測試斷線重連機制

2. **Session 管理**:
   - 建立新 Session
   - 選擇不同模型
   - 選擇角色 (可選)
   - 恢復既有 Session
   - 結束 Session

3. **圖片生成**:
   - 輸入 prompt 送出
   - 確認 loading 狀態
   - 確認生成結果顯示
   - 測試錯誤處理

4. **角色管理**:
   - 建立新角色
   - 上傳參考圖片
   - 編輯角色資訊
   - 刪除角色

5. **管理員統計**:
   - 確認統計數據顯示
   - 測試日期篩選
   - 確認排行榜顯示

---

## 6. 注意事項

1. **Session 過期處理**: Session 預設 1 小時過期，需在 UI 顯示剩餘時間並於過期前提醒

2. **錯誤處理**: 參考錯誤碼對照表處理各種錯誤狀況
   - `auth_failed`, `token_expired` → 重新登入
   - `session_expired` → 建立新 Session
   - `content_filtered` → 提示修改 prompt
   - `rate_limited` → 顯示稍後再試

3. **圖片上傳限制**:
   - 角色圖片最多 5 張
   - 物件圖片最多 5 張
   - 支援格式: JPG, PNG, WebP

4. **響應式設計**:
   - 生成的圖片支援縮放預覽
   - 行動裝置適配

5. **權限控制**:
   - AI 生成功能需登入
   - 管理員統計頁面需 admin 權限
   - 角色編輯/刪除需檢查擁有者
