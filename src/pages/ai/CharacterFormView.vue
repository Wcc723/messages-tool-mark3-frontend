<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAiCharacterStore } from '@/stores/aiCharacter'
import CharacterImageUpload from '@/components/ai/CharacterImageUpload.vue'
import type {
  Character,
  CharacterCreateRequest,
  CharacterUpdateRequest,
  ReferenceImageAngle,
  CharacterImageType,
} from '@/types/ai-generation'

const router = useRouter()
const route = useRoute()
const aiCharacterStore = useAiCharacterStore()

const { currentCharacter, tags: allTags, isLoading, error } = storeToRefs(aiCharacterStore)

// 編輯模式
const isEditMode = computed(() => !!route.params.id)
const characterId = computed(() => route.params.id as string | undefined)

// 表單資料
const form = reactive({
  name: '',
  description: '',
  tags: [] as string[],
  isPublic: false,
})

// 新標籤輸入
const newTag = ref('')

// 圖片上傳狀態
const isUploading = ref(false)

// 角度顯示名稱
const angleLabels: Record<ReferenceImageAngle, string> = {
  front: '正面',
  side: '側面',
  back: '背面',
  detail: '細節',
}

// 初始化表單
function initForm(character?: Character | null) {
  if (character) {
    form.name = character.name
    form.description = character.description || ''
    form.tags = [...(character.tags || [])]
    form.isPublic = character.isPublic
  } else {
    form.name = ''
    form.description = ''
    form.tags = []
    form.isPublic = false
  }
}

// 新增標籤
function addTag() {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  newTag.value = ''
}

// 移除標籤
function removeTag(index: number) {
  form.tags.splice(index, 1)
}

// 選擇現有標籤
function selectExistingTag(tag: string) {
  if (!form.tags.includes(tag)) {
    form.tags.push(tag)
  }
}

// 上傳圖片
async function handleImageUpload(
  type: CharacterImageType,
  file: File,
  metadata: { angle?: ReferenceImageAngle; description?: string; name?: string }
) {
  if (!characterId.value) return

  isUploading.value = true
  try {
    await aiCharacterStore.uploadImage(characterId.value, file, type, metadata)
  } finally {
    isUploading.value = false
  }
}

// 刪除圖片
async function handleDeleteImage(type: CharacterImageType, index: number) {
  if (!characterId.value) return

  if (!confirm('確定要刪除這張圖片嗎？')) return

  await aiCharacterStore.deleteImage(characterId.value, index, type)
}

// 儲存表單
async function handleSubmit() {
  if (!form.name.trim()) {
    alert('請輸入角色名稱')
    return
  }

  try {
    if (isEditMode.value && characterId.value) {
      const data: CharacterUpdateRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        isPublic: form.isPublic,
      }
      await aiCharacterStore.updateCharacter(characterId.value, data)
    } else {
      const data: CharacterCreateRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        isPublic: form.isPublic,
      }
      const newCharacter = await aiCharacterStore.createCharacter(data)
      // 建立後導向編輯頁（以便上傳圖片）
      router.replace({ name: 'CharacterEdit', params: { id: newCharacter.id } })
      return
    }

    router.push({ name: 'CharacterList' })
  } catch (err) {
    console.error('儲存失敗:', err)
  }
}

// 取消
function handleCancel() {
  router.back()
}

onMounted(async () => {
  await aiCharacterStore.fetchTags()

  if (isEditMode.value && characterId.value) {
    await aiCharacterStore.fetchCharacter(characterId.value)
    initForm(currentCharacter.value)
  } else {
    aiCharacterStore.clearCurrentCharacter()
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
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        @click="handleCancel"
      >
        <i class="bi-arrow-left text-xl"></i>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ isEditMode ? '編輯角色' : '新增角色' }}
        </h1>
        <p class="mt-1 text-gray-500">
          {{ isEditMode ? '修改角色資訊與參考圖片' : '建立新的 AI 生成角色' }}
        </p>
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
          @click="aiCharacterStore.clearError()"
        >
          關閉
        </button>
      </div>
    </div>

    <!-- 表單 -->
    <form @submit.prevent="handleSubmit">
      <!-- 基本資訊 -->
      <div class="bg-white border rounded-lg p-6 space-y-6">
        <h2 class="text-lg font-semibold text-gray-900">基本資訊</h2>

        <!-- 名稱 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            角色名稱 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="輸入角色名稱"
            class="w-full border rounded-lg px-4 py-2"
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
            placeholder="描述這個角色的特徵..."
            class="w-full border rounded-lg px-4 py-2 resize-none"
          ></textarea>
        </div>

        <!-- 標籤 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            標籤
          </label>
          <!-- 已選標籤 -->
          <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="(tag, index) in form.tags"
              :key="tag"
              class="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
            >
              {{ tag }}
              <button
                type="button"
                class="hover:text-indigo-900"
                @click="removeTag(index)"
              >
                <i class="bi-x"></i>
              </button>
            </span>
          </div>
          <!-- 新增標籤 -->
          <div class="flex gap-2">
            <input
              v-model="newTag"
              type="text"
              placeholder="新增標籤"
              class="flex-1 border rounded-lg px-4 py-2"
              @keydown.enter.prevent="addTag"
            />
            <button
              type="button"
              class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              @click="addTag"
            >
              新增
            </button>
          </div>
          <!-- 現有標籤建議 -->
          <div v-if="allTags.length > 0" class="mt-3">
            <p class="text-xs text-gray-500 mb-2">點擊快速選擇：</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tagItem in allTags.filter(t => !form.tags.includes(t.tag))"
                :key="tagItem.tag"
                type="button"
                class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
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
            {{ form.isPublic ? '其他使用者可以看到並使用這個角色' : '只有你可以使用這個角色' }}
          </span>
        </div>
      </div>

      <!-- 參考圖片（僅編輯模式） -->
      <template v-if="isEditMode && currentCharacter">
        <!-- 角色參考圖片 -->
        <div class="bg-white border rounded-lg p-6 space-y-4 mt-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">角色參考圖片</h2>
            <span class="text-sm text-gray-500">
              {{ currentCharacter.referenceImages?.images?.length || 0 }} / 5
            </span>
          </div>
          <p class="text-sm text-gray-500">
            上傳角色的參考圖片，可選擇不同角度（正面、側面、背面、細節）
          </p>

          <!-- 現有圖片 -->
          <div
            v-if="currentCharacter.referenceImages?.images?.length"
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            <div
              v-for="(img, index) in currentCharacter.referenceImages.images"
              :key="index"
              class="relative group"
            >
              <img
                :src="img.url"
                :alt="`參考圖片 ${index + 1}`"
                class="w-full aspect-square object-cover rounded-lg"
              />
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  @click="handleDeleteImage('character', index)"
                >
                  <i class="bi-trash"></i>
                </button>
              </div>
              <div class="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs rounded-b-lg">
                {{ angleLabels[img.angle || 'front'] }}
              </div>
            </div>
          </div>

          <!-- 上傳區域 -->
          <CharacterImageUpload
            type="character"
            :disabled="isUploading"
            :max-files="5"
            :current-count="currentCharacter.referenceImages?.images?.length || 0"
            @upload="(file, meta) => handleImageUpload('character', file, meta)"
          />
        </div>

        <!-- 物件參考圖片 -->
        <div class="bg-white border rounded-lg p-6 space-y-4 mt-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">物件參考圖片</h2>
            <span class="text-sm text-gray-500">
              {{ currentCharacter.referenceImages?.objectImages?.length || 0 }} / 6
            </span>
          </div>
          <p class="text-sm text-gray-500">
            上傳角色相關物件的圖片，例如武器、裝備等
          </p>

          <!-- 現有圖片 -->
          <div
            v-if="currentCharacter.referenceImages?.objectImages?.length"
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            <div
              v-for="(img, index) in currentCharacter.referenceImages.objectImages"
              :key="index"
              class="relative group"
            >
              <img
                :src="img.url"
                :alt="`物件圖片 ${index + 1}`"
                class="w-full aspect-square object-cover rounded-lg"
              />
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  @click="handleDeleteImage('object', index)"
                >
                  <i class="bi-trash"></i>
                </button>
              </div>
              <div
                v-if="img.name"
                class="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs rounded-b-lg truncate"
              >
                {{ img.name }}
              </div>
            </div>
          </div>

          <!-- 上傳區域 -->
          <CharacterImageUpload
            type="object"
            :disabled="isUploading"
            :max-files="6"
            :current-count="currentCharacter.referenceImages?.objectImages?.length || 0"
            @upload="(file, meta) => handleImageUpload('object', file, meta)"
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
          建立角色後可以上傳參考圖片
        </p>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex justify-end gap-4 mt-6">
        <button
          type="button"
          class="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <span v-if="isLoading" class="animate-spin">
            <i class="bi-arrow-repeat"></i>
          </span>
          <span>{{ isEditMode ? '儲存變更' : '建立角色' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
