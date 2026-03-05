# CLAUDE.md

Vue 3 + TypeScript 前端應用，Discord 自動化排程訊息工具（Hexschool Toolman Mark 3）。
本專案採用 `pnpm` 作為套件管理工具，所有指令請以 `pnpm` 執行。

## 環境需求

- Node.js: ^20.19.0 || >=22.12.0
- Package Manager: pnpm 9.9.0

## 常用指令

```bash
pnpm install              # 安裝依賴
pnpm run dev              # 啟動開發伺服器
pnpm run build            # Type-check + 正式建置
pnpm run build-only       # 僅建置（不檢查型別）
pnpm run type-check       # TypeScript 型別檢查
pnpm run lint             # 執行所有 linter（oxlint + eslint）
pnpm run format           # Prettier 格式化
```

## 文件索引

| 文件 | 說明 |
|------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 專案架構：目錄結構、路由、API 層、認證流程、狀態管理 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 開發規範：程式碼風格、元件模式、API/Store 撰寫慣例 |
| [docs/FEATURES.md](docs/FEATURES.md) | 功能模組：認證、Discord、排程、打卡、AI 圖片生成、管理後台 |
| [docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) | 設計規範：色彩、間距、元件模式、按鈕、表單、Modal 等 |
| [docs/plans/](docs/plans/) | 歷史計畫文件歸檔 |

## 關鍵慣例

- **Path Alias**: `@/` → `./src/`（vite.config.ts）
- **程式碼風格**: 無分號、單引號、100 字元行寬
- **Vue SFC**: `<script setup lang="ts">` 語法
- **Tailwind CSS 4**: `@import 'tailwindcss'` 語法，無需設定檔
- **API 回應格式**: `{ success: boolean, message?: string, data?: T }`
- **Store 模式**: Pinia Composition API（`defineStore('name', () => { ... })`）
- **API 模組**: 一個 domain 一個檔案，barrel export（`export * as xxxApi from './xxx'`）
