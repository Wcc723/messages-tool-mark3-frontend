# 設計規範（Design Tokens）

本文件記錄專案的 Tailwind CSS 設計慣例，作為開發與 AI 代理修改介面時的依據。

## 色彩系統

### 中性色（Gray）
| 用途 | Class |
|------|-------|
| 主文字 | `text-gray-900` |
| 次要文字 | `text-gray-800` |
| Label / 標籤 | `text-gray-700` |
| 輔助文字 | `text-gray-600` |
| Placeholder / 禁用 | `text-gray-500` |
| 淡化 icon | `text-gray-400` |
| 主要邊框 | `border-gray-200` |
| 輸入框邊框 | `border-gray-300` |
| 淺色背景 | `bg-gray-50` |
| 輕色背景 | `bg-gray-100` |

### 品牌色（Indigo）— 互動元素主色
| 用途 | Class |
|------|-------|
| 主要按鈕 | `bg-indigo-600 hover:bg-indigo-700` |
| 主要按鈕禁用 | `bg-indigo-400` |
| 連結文字 | `text-indigo-600 hover:text-indigo-800` |
| Focus 環 | `focus:ring-indigo-500` |
| 選中邊框 | `border-indigo-500` |
| 選中背景 | `bg-indigo-50` |
| 輕量按鈕 | `text-indigo-600 hover:bg-indigo-50` |

### 狀態色
| 狀態 | 文字 | 背景 | 邊框 | Badge |
|------|------|------|------|-------|
| 成功 | `text-emerald-600` | `bg-emerald-50` | `border-emerald-200` | `bg-green-100 text-green-700` |
| 錯誤 | `text-red-600` | `bg-red-50` | `border-red-200` | `bg-red-100 text-red-700` |
| 警告 | `text-amber-800` | `bg-amber-50` | `border-amber-200` | `bg-yellow-100 text-yellow-700` |
| 資訊 | `text-blue-600` | `bg-blue-50` | `border-blue-200` | `bg-blue-100 text-blue-700` |

### 必填標記
- `<span class="text-red-500">*</span>`

---

## 佈局

### 容器寬度
- 表單頁面：`max-w-6xl mx-auto`
- 個人資料：`max-w-4xl mx-auto`
- Modal 大：`max-w-3xl w-full`
- Modal 小：`max-w-md w-full`

### 常用間距
- 頁面標題與內容：`mb-8`
- 區塊之間：`space-y-6`
- 卡片內部：`p-6`
- 表單欄位間：`space-y-6`
- 項目間距：`gap-3` 或 `gap-4`
- Grid 間距：`gap-4` 或 `gap-6`

---

## 元件模式

### 卡片（Card）
```html
<div class="bg-white rounded-lg border border-gray-200 p-6">
```

### 區塊標題（Section Header）
```html
<div class="flex items-center gap-3 mb-6">
  <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
    <i class="bi bi-{icon} text-gray-600 text-lg"></i>
  </div>
  <div>
    <h2 class="text-lg font-semibold text-gray-900">{標題}</h2>
    <p class="text-sm text-gray-600">{描述}</p>
  </div>
</div>
```

### 頁面標題
```html
<h1 class="text-3xl font-bold text-gray-900 mb-2">{標題}</h1>
<p class="text-gray-600">{描述}</p>
```

### 表單 Label
```html
<label class="block text-sm font-medium text-gray-700 mb-2">
  {標籤} <span class="text-red-500">*</span>
</label>
```

### Input / Textarea
```html
<input class="w-full px-4 py-3 border border-gray-300 rounded-md
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
```

### Select
```html
<select class="w-full px-4 py-3 border border-gray-300 rounded-md
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
  cursor-pointer transition">
```

### 字數計數
```html
<p class="text-sm text-gray-500 mt-2">{{ count }} / {{ max }} 字元</p>
```

---

## 按鈕

### Primary
```html
<button class="px-4 py-2 bg-indigo-600 text-white rounded-lg
  hover:bg-indigo-700 transition cursor-pointer
  disabled:bg-indigo-400 disabled:cursor-not-allowed">
```

### Secondary
```html
<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg
  hover:bg-gray-100 transition-colors cursor-pointer">
```

### Danger
```html
<button class="px-4 py-2 text-red-600 hover:bg-red-50 rounded transition cursor-pointer">
```

### Ghost（輕量操作）
```html
<button class="inline-flex items-center gap-2 px-3 py-2 text-sm
  text-indigo-600 border border-indigo-200 rounded-lg
  hover:bg-indigo-50 transition cursor-pointer">
```

### Loading 狀態
```html
<button disabled>
  <i class="bi bi-arrow-repeat animate-spin"></i>
  儲存中...
</button>
```

### 按鈕群組
```html
<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
  <button class="...secondary">取消</button>
  <button class="...primary">確認</button>
</div>
```

---

## Radio / Checkbox 選擇卡

### Radio 選擇卡
```html
<label :class="[
  'flex items-start gap-3 p-4 border rounded-md cursor-pointer transition-colors',
  selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
]">
  <input type="radio" class="sr-only" />
  <i :class="['text-xl mt-1', selected ? 'text-indigo-600' : 'text-gray-500']"></i>
  <div class="flex-1">
    <p class="text-sm font-medium text-gray-900">{標籤}</p>
    <p class="text-xs text-gray-500">{描述}</p>
  </div>
  <i v-if="selected" class="bi bi-check-circle-fill text-indigo-600 text-base"></i>
</label>
```

### Toggle Switch
```html
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer" />
  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2
    peer-focus:ring-indigo-500 rounded-full peer
    peer-checked:after:translate-x-full peer-checked:after:border-white
    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
    after:bg-white after:border-gray-300 after:border after:rounded-full
    after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
</label>
```

---

## Badge / Tag

```html
<span class="px-2 py-0.5 rounded text-xs font-medium {bg-class} {text-class}">
  {文字}
</span>
```

狀態對應見上方「狀態色」表格。

---

## 提示區塊（Alert）

```html
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div class="flex items-start gap-3">
    <i class="bi bi-info-circle text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
    <div class="text-sm text-blue-800">
      <p class="font-medium mb-1">{標題}</p>
      <p class="text-blue-700">{內容}</p>
    </div>
  </div>
</div>
```

替換色系：`blue` → `red`（錯誤）、`amber`（警告）、`emerald`（成功）。

---

## 表格

```html
<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4 whitespace-nowrap">
    </tbody>
  </table>
</div>
```

### 分頁
```html
<div class="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
```

---

## Modal / Dialog

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
  <!-- Content -->
  <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">{標題}</h3>
      <button class="text-gray-400 hover:text-gray-600 transition cursor-pointer">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    <!-- Body -->
    <div class="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">
    </div>
    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
    </div>
  </div>
</div>
```

---

## 空狀態

```html
<div class="text-center py-12">
  <i class="bi bi-{icon} text-4xl text-gray-300"></i>
  <p class="mt-2 text-gray-500">{提示文字}</p>
</div>
```

---

## 陰影層級

| 用途 | Class |
|------|-------|
| 卡片 | `shadow-sm` |
| 下拉選單 | `shadow-lg` |
| 浮層 | `shadow-lg` |
| Modal | `shadow-2xl` |

---

## 圖示

- **圖示庫**：Bootstrap Icons（`bi bi-{name}`）
- 小：`text-sm`
- 中：`text-lg`
- 大：`text-3xl`
- 超大：`text-4xl`

---

## 動畫

| 用途 | Class |
|------|-------|
| 通用過渡 | `transition` |
| 僅顏色 | `transition-colors` |
| 所有屬性 | `transition-all` |
| Loading 旋轉 | `animate-spin` |
| 活動指示器 | `animate-ping` |

---

## 響應式斷點

- `sm:` (640px) — 手機 → 平板
- `md:` (768px) — 平板 → 桌面
- `lg:` (1024px) — 大桌面

常見模式：
```
flex flex-col md:flex-row
grid grid-cols-1 md:grid-cols-2
hidden md:block
```
