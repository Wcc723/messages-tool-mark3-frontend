<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import { useDiscordStore } from '@/stores/discord'

const router = useRouter()
const route = useRoute()
const checkinStore = useCheckinStore()
const discordStore = useDiscordStore()

// 編輯模式
const scheduleId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!scheduleId.value)

// UI 狀態
const channelSearch = ref('')
const isChannelDropdownOpen = ref(false)
const isSubmitting = ref(false)
const keywordInput = ref('')

// 表單資料
const form = ref({
  name: '',
  slug: '',
  channelId: '',
  startDate: '',
  endDate: '',
  keywords: [] as string[],
  expectedThreadCount: undefined as number | undefined,
  checkinMode: 'standard' as 'standard' | 'extended' | 'all_period',
  extendedHours: undefined as number | undefined,
})

// Slug 驗證錯誤訊息
const slugError = ref('')

// 驗證 Slug 格式
function validateSlug(value: string): string | null {
  if (!value) return null // 選填欄位

  // 長度檢查
  if (value.length < 3 || value.length > 50) {
    return 'Slug 長度須為 3-50 字元'
  }

  // 字元檢查（小寫英文、數字、連字號）
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Slug 只能包含小寫英文、數字及連字號'
  }

  // 開頭必須為英文字母
  if (!/^[a-z]/.test(value)) {
    return 'Slug 開頭必須為英文字母'
  }

  // 結尾不可為連字號
  if (value.endsWith('-')) {
    return 'Slug 結尾不可為連字號'
  }

  // 不允許連續連字號
  if (/--/.test(value)) {
    return 'Slug 不可包含連續連字號'
  }

  return null
}

// 即時驗證 Slug
function onSlugInput() {
  slugError.value = validateSlug(form.value.slug) || ''
}

// 頻道過濾
const filteredChannels = computed(() => {
  if (!channelSearch.value) return discordStore.textChannels
  const search = channelSearch.value.toLowerCase()
  return discordStore.textChannels.filter((channel) => channel.name.toLowerCase().includes(search))
})

// 頻道分組（按分類）
const groupedChannels = computed(() => {
  const groups: Record<string, typeof discordStore.textChannels> = {}
  filteredChannels.value.forEach((channel) => {
    const category = channel.parentName || '未分類'
    if (!groups[category]) groups[category] = []
    groups[category].push(channel)
  })
  return groups
})

// 已選頻道
const selectedChannel = computed(() => {
  return discordStore.channels.find((c) => c.id === form.value.channelId)
})

// 選擇頻道
function selectChannel(channelId: string) {
  form.value.channelId = channelId
  isChannelDropdownOpen.value = false
  channelSearch.value = ''
}

// 新增關鍵字
function addKeyword() {
  const keyword = keywordInput.value.trim()
  if (keyword && !form.value.keywords.includes(keyword)) {
    form.value.keywords.push(keyword)
    keywordInput.value = ''
  }
}

// 移除關鍵字
function removeKeyword(index: number) {
  form.value.keywords.splice(index, 1)
}

// 表單驗證
function validateForm(): string | null {
  if (!form.value.name.trim()) {
    return '請輸入排程名稱'
  }

  // 驗證 Slug
  const slugValidationError = validateSlug(form.value.slug)
  if (slugValidationError) {
    return slugValidationError
  }

  if (!form.value.channelId) {
    return '請選擇 Discord 頻道'
  }

  if (!form.value.startDate) {
    return '請選擇開始日期'
  }

  if (!form.value.endDate) {
    return '請選擇結束日期'
  }

  // 驗證日期邏輯
  const startDate = new Date(form.value.startDate)
  const endDate = new Date(form.value.endDate)

  if (endDate < startDate) {
    return '結束日期不可早於開始日期'
  }

  // 驗證延後時數（extended 模式時必填）
  if (form.value.checkinMode === 'extended') {
    if (!form.value.extendedHours) {
      return '請輸入延後計算時數'
    }
    if (form.value.extendedHours < 1 || form.value.extendedHours > 72) {
      return '延後計算時數須在 1-72 小時之間'
    }
  }

  return null
}

// 提交表單
async function handleSubmit() {
  const validationError = validateForm()
  if (validationError) {
    alert(validationError)
    return
  }

  isSubmitting.value = true

  try {
    const payload = {
      name: form.value.name.trim(),
      slug: form.value.slug.trim() || undefined,
      channelId: form.value.channelId,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      keywords: form.value.keywords.length > 0 ? form.value.keywords : undefined,
      expectedThreadCount: form.value.expectedThreadCount,
      checkinMode: form.value.checkinMode,
      extendedHours:
        form.value.checkinMode === 'extended' ? form.value.extendedHours : undefined,
    }

    if (isEditMode.value && scheduleId.value) {
      // 更新模式
      await checkinStore.updateSchedule(scheduleId.value, payload)
      alert('排程已更新！')
    } else {
      // 新增模式
      await checkinStore.createSchedule(payload)
      alert('排程已建立！')
    }

    router.push({ name: 'CheckinSchedules' })
  } catch (error: any) {
    console.error('Failed to save schedule:', error)
    alert(checkinStore.error || '操作失敗')
  } finally {
    isSubmitting.value = false
  }
}

// 取消
function handleCancel() {
  if (confirm('確定要取消嗎？未儲存的變更將會遺失。')) {
    router.push({ name: 'CheckinSchedules' })
  }
}

// 格式化今天的日期
function formatToday(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 載入初始資料
onMounted(async () => {
  // 載入頻道列表
  if (discordStore.channels.length === 0) {
    await discordStore.fetchChannels()
  }

  // 編輯模式：載入排程資料
  if (isEditMode.value && scheduleId.value) {
    try {
      const schedule = await checkinStore.fetchScheduleById(scheduleId.value)
      form.value = {
        name: schedule.name,
        slug: schedule.slug || '',
        channelId: schedule.channelId,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        keywords: schedule.keywords || [],
        expectedThreadCount: schedule.expectedThreadCount,
        checkinMode: schedule.checkinMode || 'standard',
        extendedHours: schedule.extendedHours,
      }
    } catch (error) {
      alert('載入排程失敗')
      router.push({ name: 'CheckinSchedules' })
    }
  } else {
    // 新增模式：設定預設日期為今天
    form.value.startDate = formatToday()
  }
})
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <header>
      <h1 class="text-2xl font-bold text-gray-800">
        {{ isEditMode ? '編輯打卡排程' : '新增打卡排程' }}
      </h1>
      <p class="text-gray-600 mt-1">設定 Discord 頻道的打卡監控排程</p>
    </header>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 基本設定 -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="flex items-center gap-3 border-b border-gray-200 pb-3">
          <i class="bi bi-info-circle text-indigo-600 text-lg"></i>
          <h2 class="text-lg font-semibold text-gray-800">基本設定</h2>
        </div>

        <!-- 排程名稱 -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            排程名稱 <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            maxlength="100"
            placeholder="例如：2025 年度打卡活動"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- 客製化路由（Slug） -->
        <div>
          <label for="slug" class="block text-sm font-medium text-gray-700 mb-1">
            客製化路由（Slug）
          </label>
          <input
            id="slug"
            v-model="form.slug"
            type="text"
            maxlength="50"
            placeholder="例如：react-2025"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :class="slugError ? 'border-red-500' : 'border-gray-300'"
            @input="onSlugInput"
          />
          <p v-if="slugError" class="text-xs text-red-500 mt-1">{{ slugError }}</p>
          <p v-else class="text-xs text-gray-500 mt-1">
            可用於替代 ID 存取 API，僅限小寫英文、數字及連字號，3-50 字元
          </p>
        </div>

        <!-- Discord 頻道 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Discord 頻道 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <button
              type="button"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              @click="isChannelDropdownOpen = !isChannelDropdownOpen"
            >
              <span v-if="selectedChannel" class="text-gray-800">
                <i class="bi bi-hash text-gray-400"></i>
                {{ selectedChannel.name }}
                <span v-if="selectedChannel.parentName" class="text-xs text-gray-500 ml-2">
                  ({{ selectedChannel.parentName }})
                </span>
              </span>
              <span v-else class="text-gray-500">請選擇頻道</span>
              <i class="bi bi-chevron-down text-gray-400"></i>
            </button>

            <!-- 下拉選單 -->
            <div
              v-if="isChannelDropdownOpen"
              class="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-auto"
            >
              <!-- 搜尋框 -->
              <div class="p-3 border-b border-gray-200 sticky top-0 bg-white">
                <input
                  v-model="channelSearch"
                  type="text"
                  placeholder="搜尋頻道..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <!-- 頻道列表（按分類分組） -->
              <div class="py-2">
                <div v-for="(channels, category) in groupedChannels" :key="category" class="mb-3">
                  <div class="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                    {{ category }}
                  </div>
                  <button
                    v-for="channel in channels"
                    :key="channel.id"
                    type="button"
                    class="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                    :class="{ 'bg-indigo-50': form.channelId === channel.id }"
                    @click="selectChannel(channel.id)"
                  >
                    <i class="bi bi-hash text-gray-400"></i>
                    <span class="flex-1 text-sm">{{ channel.name }}</span>
                    <i
                      v-if="form.channelId === channel.id"
                      class="bi bi-check2 text-indigo-600 text-lg"
                    ></i>
                  </button>
                </div>
              </div>

              <!-- 無結果 -->
              <div
                v-if="filteredChannels.length === 0"
                class="px-4 py-8 text-center text-gray-500 text-sm"
              >
                找不到符合的頻道
              </div>
            </div>
          </div>
        </div>

        <!-- 日期範圍 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
              開始日期 <span class="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              v-model="form.startDate"
              type="date"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
              結束日期 <span class="text-red-500">*</span>
            </label>
            <input
              id="endDate"
              v-model="form.endDate"
              type="date"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </section>

      <!-- 進階設定 -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="flex items-center gap-3 border-b border-gray-200 pb-3">
          <i class="bi bi-sliders text-indigo-600 text-lg"></i>
          <h2 class="text-lg font-semibold text-gray-800">進階設定</h2>
        </div>

        <!-- 打卡計算模式 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            打卡計算模式 <span class="text-red-500">*</span>
          </label>
          <div class="space-y-3">
            <!-- Standard 模式 -->
            <label
              class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition"
              :class="
                form.checkinMode === 'standard'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              "
            >
              <input
                v-model="form.checkinMode"
                type="radio"
                name="checkinMode"
                value="standard"
                class="mt-1"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-800">標準模式（24小時內）</div>
                <p class="text-xs text-gray-500 mt-1">
                  用戶須在討論串建立後 24 小時內留言，才算打卡成功
                </p>
              </div>
            </label>

            <!-- Extended 模式 -->
            <label
              class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition"
              :class="
                form.checkinMode === 'extended'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              "
            >
              <input
                v-model="form.checkinMode"
                type="radio"
                name="checkinMode"
                value="extended"
                class="mt-1"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-800">延後計算時間</div>
                <p class="text-xs text-gray-500 mt-1">
                  用戶在當日結束後的指定時數內留言，仍可被計算為打卡成功
                </p>
                <!-- 延後時數輸入 -->
                <div v-if="form.checkinMode === 'extended'" class="mt-3">
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    延後時數（1-72 小時）
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="form.extendedHours"
                      type="number"
                      min="1"
                      max="72"
                      placeholder="12"
                      class="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <span class="text-sm text-gray-500">小時</span>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">
                    例如：設定 12 小時，則用戶在隔日中午 12 點前留言皆可計算
                  </p>
                </div>
              </div>
            </label>

            <!-- All Period 模式 -->
            <label
              class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition"
              :class="
                form.checkinMode === 'all_period'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              "
            >
              <input
                v-model="form.checkinMode"
                type="radio"
                name="checkinMode"
                value="all_period"
                class="mt-1"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-800">不分時段</div>
                <p class="text-xs text-gray-500 mt-1">
                  用戶在整個排程期間（開始日期至結束日期）內的任何時間留言，均可被計算為打卡成功
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- 關鍵字篩選 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            關鍵字篩選（可選）
          </label>
          <p class="text-xs text-gray-500 mb-2">
            輸入關鍵字以篩選討論串標題。若不設定，則會截取所有討論串。
          </p>
          <div class="flex gap-2 mb-2">
            <input
              v-model="keywordInput"
              type="text"
              placeholder="輸入關鍵字..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @keydown.enter.prevent="addKeyword"
            />
            <button
              type="button"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
              @click="addKeyword"
            >
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
          <div v-if="form.keywords.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="(keyword, index) in form.keywords"
              :key="index"
              class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {{ keyword }}
              <button
                type="button"
                class="hover:text-blue-600 cursor-pointer"
                @click="removeKeyword(index)"
              >
                <i class="bi bi-x text-lg"></i>
              </button>
            </span>
          </div>
        </div>

        <!-- 預期討論串數目 -->
        <div>
          <label for="expectedThreadCount" class="block text-sm font-medium text-gray-700 mb-1">
            預期討論串數目（可選）
          </label>
          <input
            id="expectedThreadCount"
            v-model.number="form.expectedThreadCount"
            type="number"
            min="0"
            placeholder="例如：30"
            class="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p class="text-xs text-gray-500 mt-1">用於預估排程的討論串總數</p>
        </div>
      </section>

      <!-- 錯誤訊息 -->
      <div
        v-if="checkinStore.error"
        class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
      >
        {{ checkinStore.error }}
      </div>

      <!-- 操作按鈕 -->
      <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-end gap-3">
        <button
          type="button"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="isSubmitting || checkinStore.isLoading"
        >
          <span v-if="isSubmitting || checkinStore.isLoading">
            <i class="bi bi-arrow-repeat animate-spin"></i>
            儲存中...
          </span>
          <span v-else>
            <i class="bi bi-check2"></i>
            {{ isEditMode ? '更新排程' : '建立排程' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>
