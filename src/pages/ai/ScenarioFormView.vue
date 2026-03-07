<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAiScenarioStore } from '@/stores/aiScenario'
import ScenarioImageUpload from '@/components/ai/ScenarioImageUpload.vue'
import type {
  Scenario,
  ScenarioCreateRequest,
  ScenarioUpdateRequest,
  ScenarioDefaultSettings,
} from '@/types/ai-generation'

const router = useRouter()
const route = useRoute()
const aiScenarioStore = useAiScenarioStore()

const { currentScenario, tags: allTags, isLoading, error } = storeToRefs(aiScenarioStore)

const isEditMode = computed(() => !!route.params.id)
const scenarioId = computed(() => route.params.id as string | undefined)

// 表單資料
const form = reactive({
  name: '',
  description: '',
  tags: [] as string[],
  isPublic: false,
  defaultAspectRatio: '' as string,
  defaultImageSize: '' as string,
})

const newTag = ref('')
const isUploading = ref(false)

const aspectRatioOptions = [
  { value: '', label: '不指定' },
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
]

const imageSizeOptions = [
  { value: '', label: '不指定' },
  { value: '1K', label: '1K (標準)' },
  { value: '2K', label: '2K (高畫質)' },
]

function initForm(scenario?: Scenario | null) {
  if (scenario) {
    form.name = scenario.name
    form.description = scenario.description || ''
    form.tags = [...(scenario.tags || [])]
    form.isPublic = scenario.isPublic
    form.defaultAspectRatio = scenario.defaultSettings?.aspectRatio || ''
    form.defaultImageSize = scenario.defaultSettings?.imageSize || ''
  } else {
    form.name = ''
    form.description = ''
    form.tags = []
    form.isPublic = false
    form.defaultAspectRatio = ''
    form.defaultImageSize = ''
  }
}

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  newTag.value = ''
}

function removeTag(index: number) {
  form.tags.splice(index, 1)
}

function selectExistingTag(tag: string) {
  if (!form.tags.includes(tag)) {
    form.tags.push(tag)
  }
}

async function handleImageUpload(file: File, metadata: { description?: string }) {
  if (!scenarioId.value) return

  isUploading.value = true
  try {
    await aiScenarioStore.uploadImage(scenarioId.value, file, metadata.description)
  } finally {
    isUploading.value = false
  }
}

async function handleDeleteImage(index: number) {
  if (!scenarioId.value) return

  if (!confirm('確定要刪除這張圖片嗎？')) return

  await aiScenarioStore.deleteImage(scenarioId.value, index)
}

function buildDefaultSettings(): ScenarioDefaultSettings | undefined {
  const ds: ScenarioDefaultSettings = {}
  if (form.defaultAspectRatio) {
    ds.aspectRatio = form.defaultAspectRatio as ScenarioDefaultSettings['aspectRatio']
  }
  if (form.defaultImageSize) {
    ds.imageSize = form.defaultImageSize as ScenarioDefaultSettings['imageSize']
  }
  return Object.keys(ds).length > 0 ? ds : undefined
}

async function handleSubmit() {
  if (!form.name.trim()) {
    alert('請輸入情境名稱')
    return
  }

  try {
    if (isEditMode.value && scenarioId.value) {
      const data: ScenarioUpdateRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        isPublic: form.isPublic,
        defaultSettings: buildDefaultSettings(),
      }
      await aiScenarioStore.updateScenario(scenarioId.value, data)
    } else {
      const data: ScenarioCreateRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        isPublic: form.isPublic,
        defaultSettings: buildDefaultSettings(),
      }
      const newScenario = await aiScenarioStore.createScenario(data)
      router.replace({ name: 'ScenarioEdit', params: { id: newScenario.id } })
      return
    }

    router.push({ name: 'ScenarioList' })
  } catch (err) {
    console.error('儲存失敗:', err)
  }
}

function handleCancel() {
  router.back()
}

onMounted(async () => {
  await aiScenarioStore.fetchTags()

  if (isEditMode.value && scenarioId.value) {
    await aiScenarioStore.fetchScenario(scenarioId.value)
    initForm(currentScenario.value)
  } else {
    aiScenarioStore.clearCurrentScenario()
    initForm()
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
        aria-label="返回"
        @click="handleCancel"
      >
        <i class="bi-arrow-left text-xl"></i>
      </button>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
          <i class="bi bi-palette text-gray-600 text-lg"></i>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ isEditMode ? '編輯情境' : '新增情境' }}
          </h1>
          <p class="text-gray-600">
            {{ isEditMode ? '修改情境資訊與風格圖片' : '建立新的 AI 生成情境' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
    >
      <i class="bi-exclamation-triangle text-red-500 text-lg"></i>
      <div class="flex-1">
        <p class="text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          @click="aiScenarioStore.clearError()"
        >
          關閉
        </button>
      </div>
    </div>

    <!-- 表單 -->
    <form @submit.prevent="handleSubmit">
      <!-- 基本資訊 -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-info-circle text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">基本資訊</h2>
            <p class="text-sm text-gray-600">設定情境的名稱與描述</p>
          </div>
        </div>

        <!-- 名稱 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            情境名稱 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="輸入情境名稱"
            class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <!-- 描述 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="描述這個情境的風格特徵..."
            class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
          ></textarea>
        </div>

        <!-- 標籤 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            標籤
          </label>
          <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="(tag, index) in form.tags"
              :key="tag"
              class="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:shadow-sm transition"
            >
              {{ tag }}
              <button
                type="button"
                class="hover:text-indigo-900 cursor-pointer"
                @click="removeTag(index)"
              >
                <i class="bi-x"></i>
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newTag"
              type="text"
              placeholder="新增標籤"
              class="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              @keydown.enter.prevent="addTag"
            />
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              @click="addTag"
            >
              新增
            </button>
          </div>
          <div v-if="allTags.length > 0" class="mt-3">
            <p class="text-xs text-gray-500 mb-2">點擊快速選擇：</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tagItem in allTags.filter(t => !form.tags.includes(t.tag))"
                :key="tagItem.tag"
                type="button"
                class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                @click="selectExistingTag(tagItem.tag)"
              >
                {{ tagItem.tag }} ({{ tagItem.count }})
              </button>
            </div>
          </div>
        </div>

        <!-- 可見性 -->
        <div class="flex items-center gap-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="form.isPublic"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
          <span class="text-sm text-gray-700">
            {{ form.isPublic ? '公開' : '私人' }}
          </span>
          <span class="text-xs text-gray-500">
            {{ form.isPublic ? '其他使用者可以看到並使用這個情境' : '只有你可以使用這個情境' }}
          </span>
        </div>
      </div>

      <!-- 預設設定 -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 space-y-6 mt-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-gear text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">預設設定</h2>
            <p class="text-sm text-gray-600">選擇此情境的預設圖片設定，生成時會自動套用</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- 預設比例 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              預設比例
            </label>
            <select
              v-model="form.defaultAspectRatio"
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition"
            >
              <option
                v-for="option in aspectRatioOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 預設尺寸 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              預設尺寸
            </label>
            <select
              v-model="form.defaultImageSize"
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition"
            >
              <option
                v-for="option in imageSizeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 風格圖片（僅編輯模式） -->
      <template v-if="isEditMode && currentScenario">
        <div class="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                <i class="bi bi-brush text-gray-600 text-lg"></i>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">風格參考圖片</h2>
            </div>
            <span class="text-sm text-gray-500">
              {{ currentScenario.styleImages?.images?.length || 0 }} / 3
            </span>
          </div>
          <p class="text-sm text-gray-500">
            上傳風格參考圖片，AI 會參考這些圖片的風格來生成
          </p>

          <!-- 現有圖片 -->
          <div
            v-if="currentScenario.styleImages?.images?.length"
            class="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            <div
              v-for="(img, index) in currentScenario.styleImages.images"
              :key="index"
              class="relative group"
            >
              <img
                :src="img.url"
                :alt="`風格圖片 ${index + 1}`"
                class="w-full aspect-square object-cover rounded-lg"
              />
              <div class="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer transition"
                  @click="handleDeleteImage(index)"
                >
                  <i class="bi-trash"></i>
                </button>
              </div>
              <div
                v-if="img.description"
                class="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs rounded-b-lg truncate"
              >
                {{ img.description }}
              </div>
            </div>
          </div>

          <!-- 上傳區域 -->
          <ScenarioImageUpload
            :disabled="isUploading"
            :max-files="3"
            :current-count="currentScenario.styleImages?.images?.length || 0"
            @upload="(file, meta) => handleImageUpload(file, meta)"
          />
        </div>
      </template>

      <!-- 新增模式提示 -->
      <div
        v-if="!isEditMode"
        class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6"
      >
        <p class="text-blue-700 text-sm">
          <i class="bi-info-circle mr-2"></i>
          建立情境後可以上傳風格參考圖片
        </p>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6 border-t border-gray-200 pt-6">
        <button
          type="button"
          class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <i v-if="isLoading" class="bi bi-arrow-repeat animate-spin"></i>
          <span>{{ isEditMode ? '儲存變更' : '建立情境' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
