<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import { useDiscordStore } from '@/stores/discord'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import type { ScanStatusResponse, ScanResultResponse } from '@/services/api/types'

const router = useRouter()
const checkinStore = useCheckinStore()
const discordStore = useDiscordStore()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('checkin', 'canCreate'))
const canEdit = computed(() => hasPermission('checkin', 'canEdit'))
const canDelete = computed(() => hasPermission('checkin', 'canDelete'))

// Rescan Modal 狀態
const showRescanModal = ref(false)
const rescanScheduleId = ref('')
const rescanScheduleName = ref('')
const rescanMode = ref<'all' | 'single'>('all')
const rescanDate = ref('')
const isRescanning = ref(false)

// 掃描狀態追蹤
const currentScanLogId = ref<string | null>(null)
const scanStatus = ref<ScanStatusResponse | null>(null)
const scanResult = ref<ScanResultResponse | null>(null)
const isFetchingStatus = ref(false)

// 掃描狀態顏色
const statusColorClass = computed(() => {
  if (!scanStatus.value) return 'bg-gray-400'
  switch (scanStatus.value.status) {
    case 'queued':
      return 'bg-yellow-500'
    case 'running':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-emerald-500'
    case 'failed':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
})

// 掃描狀態文字
const statusText = computed(() => {
  if (!scanStatus.value) return '未知'
  switch (scanStatus.value.status) {
    case 'queued':
      return '排隊中'
    case 'running':
      return '掃描中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失敗'
    default:
      return scanStatus.value.status
  }
})

// 解析頻道名稱
function getChannelName(channelId: string): string {
  const channel = discordStore.channels.find((c) => c.id === channelId)
  return channel ? `#${channel.name}` : '未知頻道'
}

// 複製排程識別碼到剪貼簿（優先使用 slug）
async function copyScheduleIdentifier(slug: string | undefined, id: string) {
  const valueToCopy = slug || id
  const label = slug ? 'Slug' : '排程 ID'
  try {
    await navigator.clipboard.writeText(valueToCopy)
    toast.success(`${label} 已複製到剪貼簿`)
  } catch (err) {
    console.error('複製失敗:', err)
    toast.error('複製失敗，請手動複製')
  }
}

// 刪除排程
async function handleDelete(id: string, name: string) {
  if (!confirm(`確定要刪除排程「${name}」嗎？此操作無法復原。`)) {
    return
  }

  try {
    await checkinStore.deleteSchedule(id)
    toast.success('排程已刪除')
  } catch {
    toast.error(checkinStore.error || '刪除失敗')
  }
}

// 切換啟用狀態
async function handleToggle(id: string) {
  try {
    await checkinStore.toggleSchedule(id)
  } catch {
    toast.error(checkinStore.error || '切換狀態失敗')
  }
}

// 打開重新掃描 Modal
function openRescanModal(id: string, name: string) {
  rescanScheduleId.value = id
  rescanScheduleName.value = name
  rescanMode.value = 'all'
  rescanDate.value = ''
  // 清除之前的掃描狀態
  currentScanLogId.value = null
  scanStatus.value = null
  scanResult.value = null
  showRescanModal.value = true
}

// 關閉 Modal
function closeRescanModal() {
  showRescanModal.value = false
  rescanScheduleId.value = ''
  rescanScheduleName.value = ''
  rescanMode.value = 'all'
  rescanDate.value = ''
}

// 執行重新掃描
async function executeRescan() {
  if (rescanMode.value === 'single') {
    // 驗證日期
    if (!rescanDate.value) {
      toast.warning('請選擇要掃描的日期')
      return
    }
  }

  isRescanning.value = true

  try {
    const scanLogId = await checkinStore.rescanSchedule(
      rescanScheduleId.value,
      rescanMode.value === 'single' ? rescanDate.value : undefined
    )

    if (scanLogId) {
      currentScanLogId.value = scanLogId
      // 自動查詢一次狀態
      await refreshScanStatus()
    } else {
      // 如果沒有返回 scanLogId，顯示傳統提示
      const msg =
        rescanMode.value === 'all'
          ? '已開始重新掃描全部日期'
          : `已開始重新掃描 ${rescanDate.value}`
      toast.success(msg)
      closeRescanModal()
    }
  } catch {
    toast.error(checkinStore.error || '掃描失敗')
  } finally {
    isRescanning.value = false
  }
}

// 刷新掃描狀態
async function refreshScanStatus() {
  if (!currentScanLogId.value) return

  isFetchingStatus.value = true
  try {
    scanStatus.value = await checkinStore.fetchScanStatus(currentScanLogId.value)

    // 如果完成，同時取得結果
    if (scanStatus.value.status === 'completed') {
      scanResult.value = await checkinStore.fetchScanResult(currentScanLogId.value)
    }
  } catch (err) {
    console.error('取得掃描狀態失敗:', err)
  } finally {
    isFetchingStatus.value = false
  }
}

// 查看報告
function viewReport(id: string) {
  router.push({ name: 'CheckinScheduleReport', params: { id } })
}

// 編輯排程
function handleEdit(id: string) {
  router.push({ name: 'CheckinScheduleEdit', params: { id } })
}

// 新增排程
function handleCreate() {
  router.push({ name: 'CheckinScheduleCreate' })
}

const hasSchedules = computed(() => {
  return (checkinStore.schedules?.length ?? 0) > 0
})

onMounted(async () => {
  // 載入頻道列表（用於解析頻道名稱）
  if (discordStore.channels.length === 0) {
    await discordStore.fetchChannels().catch(() => {
      // 忽略錯誤，後續會顯示 "未知頻道"
    })
  }

  // 載入排程列表
  try {
    await checkinStore.fetchSchedules()
  } catch (error) {
    console.error('載入排程失敗:', error)
    // 錯誤訊息會顯示在頁面上（來自 checkinStore.error）
  }
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">打卡排程管理</h1>
        <p class="text-gray-600 mt-1">管理 Discord 頻道的打卡排程設定</p>
      </div>
      <button
        v-if="canCreate"
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
        @click="handleCreate"
      >
        <i class="bi bi-plus-circle"></i>
        新增排程
      </button>
    </header>

    <section class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="relative">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                排程名稱
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Discord 頻道
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                日期範圍
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                關鍵字
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                狀態
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Slug / ID
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="checkinStore.isLoading">
              <td colspan="7" class="px-6 py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="relative">
                    <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                  <div class="text-gray-600">
                    <p class="font-medium">載入排程資料中</p>
                    <p class="text-sm text-gray-400 mt-1">請稍候...</p>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-else-if="!hasSchedules">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                <div class="flex flex-col items-center gap-2">
                  <i class="bi bi-clipboard-check text-3xl text-gray-300"></i>
                  <span>尚無打卡排程</span>
                  <button
                    v-if="canCreate"
                    type="button"
                    class="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                    @click="handleCreate"
                  >
                    <i class="bi bi-plus-circle"></i>
                    建立第一個排程
                  </button>
                </div>
              </td>
            </tr>
            <tr
              v-else
              v-for="schedule in (checkinStore.schedules || [])"
              :key="schedule.id"
              class="hover:bg-gray-50 transition"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ schedule.name }}</p>
                  <p class="text-xs text-gray-500">
                    預期討論串: {{ schedule.expectedThreadCount || '-' }} 個
                  </p>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-gray-700">{{ getChannelName(schedule.channelId) }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-700">
                  <div>{{ schedule.startDate }}</div>
                  <div class="text-xs text-gray-500">至 {{ schedule.endDate }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div v-if="schedule.keywords && schedule.keywords.length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="(keyword, index) in schedule.keywords"
                    :key="index"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ keyword }}
                  </span>
                </div>
                <span v-else class="text-sm text-gray-400">全部訊息</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 text-sm font-medium cursor-pointer"
                  :class="schedule.isActive ? 'text-emerald-600' : 'text-gray-400'"
                  @click="handleToggle(schedule.id)"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="schedule.isActive ? 'bg-emerald-500' : 'bg-gray-400'"
                  ></span>
                  {{ schedule.isActive ? '啟用' : '停用' }}
                </button>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span
                    class="text-xs font-mono truncate max-w-[100px]"
                    :class="schedule.slug ? 'text-indigo-600' : 'text-gray-600'"
                    :title="schedule.slug || schedule.id"
                  >
                    {{ schedule.slug || schedule.id }}
                  </span>
                  <button
                    type="button"
                    class="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    :title="schedule.slug ? '複製 Slug' : '複製排程 ID'"
                    @click="copyScheduleIdentifier(schedule.slug, schedule.id)"
                  >
                    <i class="bi bi-clipboard text-sm"></i>
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                    title="查看報告"
                    @click="viewReport(schedule.id)"
                  >
                    <i class="bi bi-bar-chart-line"></i>
                  </button>
                  <button
                    type="button"
                    class="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="重新掃描"
                    @click="openRescanModal(schedule.id, schedule.name)"
                  >
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                  <button
                    v-if="canEdit"
                    type="button"
                    class="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="編輯"
                    @click="handleEdit(schedule.id)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    v-if="canDelete"
                    type="button"
                    class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="刪除"
                    @click="handleDelete(schedule.id, schedule.name)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="checkinStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ checkinStore.error }}
    </div>

    <!-- Rescan Modal -->
    <div
      v-if="showRescanModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="closeRescanModal"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 class="text-lg font-semibold text-gray-800">重新掃描排程</h3>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 transition"
            @click="closeRescanModal"
          >
            <i class="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            排程：<span class="font-semibold text-gray-800">{{ rescanScheduleName }}</span>
          </p>

          <!-- 掃描模式選擇 -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">掃描範圍</label>

            <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
              :class="rescanMode === 'all' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="rescanMode"
                value="all"
                class="w-4 h-4 text-indigo-600"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-800">掃描全部日期</div>
                <div class="text-xs text-gray-500">重新掃描排程內所有日期的討論串</div>
              </div>
            </label>

            <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
              :class="rescanMode === 'single' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="rescanMode"
                value="single"
                class="w-4 h-4 text-indigo-600"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-800">掃描單一日期</div>
                <div class="text-xs text-gray-500">指定特定日期進行掃描</div>
              </div>
            </label>
          </div>

          <!-- 單日掃描日期選擇 -->
          <div v-if="rescanMode === 'single'" class="space-y-2">
            <label for="rescanDate" class="block text-sm font-medium text-gray-700">
              選擇日期 <span class="text-red-500">*</span>
            </label>
            <input
              id="rescanDate"
              type="date"
              v-model="rescanDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- 掃描狀態顯示區塊 -->
          <div v-if="currentScanLogId" class="mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">掃描狀態</span>
              <button
                type="button"
                class="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                :disabled="isFetchingStatus"
                @click="refreshScanStatus"
              >
                <i class="bi bi-arrow-clockwise" :class="{ 'animate-spin': isFetchingStatus }"></i>
                刷新
              </button>
            </div>

            <!-- 狀態指示器 -->
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="statusColorClass"></span>
              <span class="text-sm">{{ statusText }}</span>
            </div>

            <!-- 進度資訊 -->
            <div v-if="scanStatus?.progress" class="mt-2 text-xs text-gray-500">
              階段: {{ scanStatus.progress.phase }}
              <br />
              處理中: {{ scanStatus.progress.processedThreads }} / {{ scanStatus.progress.totalThreads }} 討論串
              <template v-if="scanStatus.progress.currentThread">
                <br />
                目前: {{ scanStatus.progress.currentThread.name }}
              </template>
            </div>

            <!-- 錯誤訊息 -->
            <div v-if="scanStatus?.errorMessage" class="mt-2 text-xs text-red-600">
              錯誤: {{ scanStatus.errorMessage }}
            </div>

            <!-- 完成結果 -->
            <div v-if="scanResult" class="mt-3 p-3 bg-white rounded border border-gray-200">
              <p class="text-sm font-medium text-gray-800">掃描完成</p>
              <p class="text-xs text-gray-600 mt-1">
                發現 {{ scanResult.threadsFound }} 個討論串，
                記錄 {{ scanResult.checkinsRecorded }} 筆打卡
              </p>
              <p v-if="scanResult.duration" class="text-xs text-gray-500 mt-1">
                耗時: {{ Math.round(scanResult.duration / 1000) }} 秒
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            :disabled="isRescanning"
            @click="closeRescanModal"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            :disabled="isRescanning"
            @click="executeRescan"
          >
            <i v-if="isRescanning" class="bi bi-arrow-repeat animate-spin"></i>
            <span>{{ isRescanning ? '掃描中...' : '開始掃描' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
