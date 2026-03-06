# 前端 Scenario（情境）功能實作計畫

> **建立日期**：2026-03-06
> **狀態**：待核准

## Context

後端已完成 Scenario（情境）功能的 API 開發（參見 `../hex-toolman-backend/docs/plans/202602-AI-SCENARIO-PLAN.md`）。情境功能讓使用者定義風格/格式模板，產圖時可同時選擇**角色**（角色一致性）+ **情境**（風格一致性）。前端需新增對應的管理頁面、WebSocket 整合，以及生成器 UI 中的情境選擇功能。

**不含**：Session 列表的 scenarioId 篩選（本次不做）。

---

## 實作步驟

### Step 1: TypeScript 型別定義

**修改檔案**：`src/types/ai-generation.ts`

新增情境相關型別（比照 Character 區塊）：

```typescript
// 情境風格圖片
interface StyleImage {
  url: string
  description?: string
}

// 情境風格圖片集合
interface ScenarioStyleImages {
  images: StyleImage[]
}

// 情境預設設定
interface ScenarioDefaultSettings {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  imageSize?: '1K' | '2K'
}

// 情境
interface Scenario {
  id: string
  userId: string
  name: string
  description?: string
  tags: string[]
  isPublic: boolean
  styleImages: ScenarioStyleImages | null
  defaultSettings: ScenarioDefaultSettings | null
  createdAt: string
  updatedAt: string
}

// 情境建立/更新請求
interface ScenarioCreateRequest { name, description?, tags?, isPublic?, defaultSettings? }
interface ScenarioUpdateRequest { name?, description?, tags?, isPublic?, defaultSettings? }

// 情境查詢參數（複用 CharacterQueryParams 模式）
interface ScenarioQueryParams { page?, limit?, search?, tags?, isPublic? }
```

修改既有型別加入 scenario 欄位：
- `GenerationSession`: 新增 `scenarioId?: string | null`, `scenarioName?: string | null`
- `SessionInfo`: 新增 `scenarioId?: string | null`, `scenarioName?: string | null`
- `SessionItem`: 新增 `scenarioId: string | null`, `scenario: Scenario | null`
- `SessionDetail`: 新增 `scenario: Scenario | null`
- `WSErrorType`: 新增 `'update_session_failed'`

新增 update_session 事件型別：
```typescript
interface SessionUpdatedEvent {
  success: boolean
  session: SessionInfo
}
```

---

### Step 2: API 服務模組

**新增檔案**：`src/services/api/aiScenario.ts`

比照 `src/services/api/aiCharacter.ts` 建立，方法對應：

| 方法 | API 端點 |
|------|---------|
| `getScenarios(params?)` | `GET /api/ai/scenarios` |
| `getScenario(id)` | `GET /api/ai/scenarios/:id` |
| `createScenario(data)` | `POST /api/ai/scenarios` |
| `updateScenario(id, data)` | `PUT /api/ai/scenarios/:id` |
| `deleteScenario(id)` | `DELETE /api/ai/scenarios/:id` |
| `uploadScenarioImage(id, file, description?)` | `POST /api/ai/scenarios/:id/images` |
| `deleteScenarioImage(id, imageIndex)` | `DELETE /api/ai/scenarios/:id/images/:imageIndex` |
| `getTags()` | `GET /api/ai/scenarios/tags/list` |

**修改檔案**：`src/services/api/index.ts`
- 新增 `export * as aiScenarioApi from './aiScenario'`

---

### Step 3: Pinia Store

**新增檔案**：`src/stores/aiScenario.ts`

比照 `src/stores/aiCharacter.ts` 建立（Composition API 模式）：

- **State**: `scenarios`, `currentScenario`, `tags`, `pagination`, `isLoading`, `error`
- **Actions**: CRUD 操作、圖片上傳/刪除、標籤查詢（含 optimistic update + rollback）
- **Utility**: `clearCurrentScenario()`, `clearError()`, `reset()`

---

### Step 4: Vue 元件

#### 4.1 ScenarioCard 元件

**新增檔案**：`src/components/ai/ScenarioCard.vue`

比照 `src/components/ai/CharacterCard.vue`，差異：
- 縮圖取自 `styleImages.images[0]`（非 referenceImages）
- 顯示 `defaultSettings`（aspectRatio、imageSize）
- 支援 `selectable` / `selected` / `showActions` props

#### 4.2 ScenarioImageUpload 元件

**新增檔案**：`src/components/ai/ScenarioImageUpload.vue`

比照 `src/components/ai/CharacterImageUpload.vue`，簡化版：
- 最多 3 張風格參考圖片
- metadata 只有 `description`（無 angle/name）
- 檔案驗證：JPG/PNG/GIF/WebP，最大 10MB

#### 4.3 ScenarioListView 頁面

**新增檔案**：`src/pages/ai/ScenarioListView.vue`

比照 `src/pages/ai/CharacterListView.vue`：
- 搜尋（debounce 300ms）
- 標籤篩選
- 公開/私有切換
- 分頁
- 刪除確認 Modal

#### 4.4 ScenarioFormView 頁面

**新增檔案**：`src/pages/ai/ScenarioFormView.vue`

比照 `src/pages/ai/CharacterFormView.vue`，差異：
- 表單欄位：name、description、tags、isPublic、**defaultSettings**（aspectRatio + imageSize 選擇器）
- 圖片上傳使用 ScenarioImageUpload（最多 3 張）
- 建立後跳轉到編輯頁（才能上傳圖片）

---

### Step 5: 路由與導覽

#### 5.1 路由

**修改檔案**：`src/router/index.ts`

在 Character 路由後方新增（第 178 行之後）：

```typescript
{
  path: 'ai/scenarios',
  name: 'ScenarioList',
  component: () => import('@/pages/ai/ScenarioListView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/ai/scenarios' }
},
{
  path: 'ai/scenarios/new',
  name: 'ScenarioCreate',
  component: () => import('@/pages/ai/ScenarioFormView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/ai/scenarios/new' }
},
{
  path: 'ai/scenarios/edit/:id',
  name: 'ScenarioEdit',
  component: () => import('@/pages/ai/ScenarioFormView.vue'),
  meta: { requiresAuth: true, permissionPath: '/dashboard/ai/scenarios/edit/:id' }
},
```

#### 5.2 側邊欄導覽

**修改檔案**：`src/components/SidebarNav.vue`

在「AI 圖片生成」區塊的 items 陣列中（第 78 行後），新增：

```typescript
{
  name: '情境管理',
  path: '/dashboard/ai/scenarios',
  icon: 'bi-palette',
  permissionKey: 'showAiScenarios',
},
```

#### 5.3 權限型別

**修改檔案**：`src/types/permission.ts`

- `NavigationPermissions`: 新增 `showAiScenarios: boolean`
- `AIPermissions`: 新增 `canManageScenarios: boolean`

---

### Step 6: WebSocket 整合

#### 6.1 Socket 服務

**修改檔案**：`src/services/imageGenerationSocket.ts`

- `startSession()`: 新增 `scenarioId` 參數
  ```typescript
  startSession(model: AIModel, characterId?: string, scenarioId?: string, settings?: SessionSettings)
  ```
  emit payload 加入 `scenarioId`

- **新增** `updateSession()` 方法：
  ```typescript
  updateSession(sessionId: string, data: { characterId?: string | null, scenarioId?: string | null, settings?: SessionSettings })
  ```

- 事件監聯新增 `session_updated` 事件處理

#### 6.2 Generation Store

**修改檔案**：`src/stores/aiGeneration.ts`

- `startSession()`: 新增 `scenarioId` 參數，傳遞給 socket
- **新增** `updateSession()` action
- `handleSessionCreated` / `handleSessionResumed`: 映射 `scenarioId` + `scenarioName` 到 `currentSession`
- **新增** `handleSessionUpdated` 事件處理器
- 事件處理器註冊新增 `onSessionUpdated`

---

### Step 7: AiGeneratorView 情境選擇

**修改檔案**：`src/pages/ai/AiGeneratorView.vue`

比照現有角色選擇 UI，新增情境選擇：

- import `useAiScenarioStore`
- 新增 `selectedScenarioId` ref
- 在生成設定區新增情境選擇下拉（與角色選擇並列）
- `startSession()` 傳入 `selectedScenarioId`
- SessionInfo 區域顯示 `scenarioName`

---

## 新增檔案清單

| 檔案 | 說明 |
|------|------|
| `src/services/api/aiScenario.ts` | 情境 API 服務 |
| `src/stores/aiScenario.ts` | 情境 Pinia Store |
| `src/components/ai/ScenarioCard.vue` | 情境卡片元件 |
| `src/components/ai/ScenarioImageUpload.vue` | 風格圖片上傳元件 |
| `src/pages/ai/ScenarioListView.vue` | 情境列表頁 |
| `src/pages/ai/ScenarioFormView.vue` | 情境建立/編輯頁 |

## 修改檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `src/types/ai-generation.ts` | 新增 Scenario 型別、修改 Session 型別加入 scenarioId |
| `src/types/permission.ts` | 新增 showAiScenarios、canManageScenarios |
| `src/services/api/index.ts` | 新增 aiScenarioApi 匯出 |
| `src/services/imageGenerationSocket.ts` | startSession 加入 scenarioId、新增 updateSession |
| `src/stores/aiGeneration.ts` | startSession/updateSession 支援 scenario、事件處理 |
| `src/router/index.ts` | 新增 3 條情境路由 |
| `src/components/SidebarNav.vue` | 新增「情境管理」導覽項目 |
| `src/pages/ai/AiGeneratorView.vue` | 新增情境選擇 UI |

## 參考檔案（比照實作）

| 用途 | 檔案 |
|------|------|
| API 範本 | `src/services/api/aiCharacter.ts` |
| Store 範本 | `src/stores/aiCharacter.ts` |
| 卡片元件範本 | `src/components/ai/CharacterCard.vue` |
| 圖片上傳範本 | `src/components/ai/CharacterImageUpload.vue` |
| 列表頁範本 | `src/pages/ai/CharacterListView.vue` |
| 表單頁範本 | `src/pages/ai/CharacterFormView.vue` |

## 驗證方式

1. `pnpm run type-check` — 確認型別無錯誤
2. `pnpm run lint` — 確認程式碼風格
3. `pnpm run build` — 確認建置成功
4. 手動驗證：
   - 側邊欄出現「情境管理」連結
   - 情境列表頁：搜尋、標籤篩選、分頁、刪除
   - 情境表單：建立 → 跳轉編輯 → 上傳風格圖片
   - 生成器頁面：選擇情境後建立 Session
   - Session 資訊顯示 scenarioName
