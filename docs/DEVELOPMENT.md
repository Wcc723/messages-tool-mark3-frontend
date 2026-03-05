# 開發規範

## 程式碼風格

- **無分號**（semi: false）
- **單引號**（singleQuote: true）
- **100 字元行寬**（printWidth: 100）
- 設定檔：`.prettierrc.json`

## Linting 策略

兩層式 linting，依序執行：
1. **oxlint** — 快速正確性檢查（忽略風格問題）
2. **ESLint** — Vue + TypeScript 規則
3. 執行 `pnpm run lint` 會依序跑兩者

設定檔：`eslint.config.ts`

## Vue 元件撰寫模式

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

// Emits
const emit = defineEmits<{
  update: [value: string]
  close: []
}>()

// 邏輯
const internalValue = ref('')
</script>

<template>
  <!-- 模板 -->
</template>
```

### 元件拆分原則
- 超過約 200 行的邏輯，提取至 `composables/` 作為組合式函式
- 組合式函式命名：`useXxx`（如 `useToast`、`usePermission`）

## Tailwind CSS 4

- 透過 `@tailwindcss/vite` plugin 整合
- 全域樣式於 `src/assets/main.css` 使用 `@import 'tailwindcss'` 語法
- 無需額外設定檔（Tailwind 4 特性）
- 使用 utility classes，避免 inline styles
- 遵循現有間距/顏色慣例

## API Service 撰寫模式

每個功能 domain 一個檔案，置於 `src/services/api/`：

```typescript
import { apiClient } from './client'
import type { ApiResponse, SomeType } from './types'

export async function getItems(): Promise<ApiResponse<SomeType[]>> {
  const { data } = await apiClient.get('/api/items')
  return data
}

export async function createItem(payload: CreateRequest): Promise<ApiResponse<SomeType>> {
  const { data } = await apiClient.post('/api/items', payload)
  return data
}
```

新增服務後需在 `index.ts` 加入 barrel export：
```typescript
export * as newServiceApi from './newService'
```

## Pinia Store 撰寫模式

使用 Composition API（setup function）模式：

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { someApi } from '@/services/api'

export const useSomeStore = defineStore('some', () => {
  // State
  const items = ref<Item[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isEmpty = computed(() => items.value.length === 0)

  // Actions
  async function fetchItems() {
    isLoading.value = true
    try {
      const response = await someApi.getItems()
      if (response.success && response.data) {
        items.value = response.data
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, error, isEmpty, fetchItems }
})
```

## Type 定義慣例

- 所有 API 相關型別定義於 `src/services/api/types.ts`
- 使用 `interface` 而非 `type`（除非需要 union type）
- API 回應一律使用 `ApiResponse<T>` 泛型包裝
- 分頁資訊使用 `PaginationMeta` interface
- 各功能區塊以註解分隔（`// ====... 區塊名稱 ====...`）
- 全域型別（如 Permission）定義於 `src/types/`
