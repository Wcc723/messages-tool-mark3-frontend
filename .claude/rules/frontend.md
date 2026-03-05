---
description: Vue + TypeScript + Tailwind 前端開發規範
paths: ["src/**/*.ts", "src/**/*.vue"]
---

# 前端開發規範

## 通用

- 使用 pnpm 執行所有指令
- 無分號、單引號、100 字元行寬
- `@/` path alias 引用 src/ 下的檔案
- 優先使用 `interface` 而非 `type`（除非需要 union type）
- 業務邏輯註解使用繁體中文
- 完成工作前執行 `pnpm run lint` 確認無錯誤

## Vue 元件

- 一律使用 `<script setup lang="ts">` 語法
- Props: `interface Props` + `withDefaults(defineProps<Props>(), {...})`
- Emits: typed `defineEmits<{ eventName: [payload: Type] }>()`
- 超過約 200 行的邏輯提取至 `composables/` 作為 `useXxx` 函式

## Tailwind CSS 4

- 使用 utility classes，避免 inline styles
- 遵循現有間距/顏色慣例
- 使用 `@import 'tailwindcss'` 語法（Tailwind 4）

## API Service

- API 透過 `apiClient`（Axios 實例）發送請求
- 一個 domain 一個檔案，置於 `src/services/api/`
- 回應使用 `ApiResponse<T>` 型別包裝
- 新增服務後在 `index.ts` 加入 barrel export：`export * as xxxApi from './xxx'`

## Pinia Store

- 使用 `defineStore('name', () => { ... })` Composition API 模式
- State: `ref()`
- Getters: `computed()`
- Actions: plain functions
- return 所有需公開的 state、getters、actions
