<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import { useDiscordStore } from '@/stores/discord'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const checkinStore = useCheckinStore()
const discordStore = useDiscordStore()
const { hasPermission } = usePermission()

const canCreate = computed(() => hasPermission('checkin', 'canCreate'))
const canEdit = computed(() => hasPermission('checkin', 'canEdit'))
const canDelete = computed(() => hasPermission('checkin', 'canDelete'))

// 解析頻道名稱
function getChannelName(channelId: string): string {
  const channel = discordStore.channels.find((c) => c.id === channelId)
  return channel ? `#${channel.name}` : '未知頻道'
}

// 複製排程 ID 到剪貼簿
async function copyScheduleId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    alert('排程 ID 已複製到剪貼簿！')
  } catch (err) {
    console.error('複製失敗:', err)
    alert('複製失敗，請手動複製')
  }
}

// 刪除排程
async function handleDelete(id: string, name: string) {
  if (!confirm(`確定要刪除排程「${name}」嗎？此操作無法復原。`)) {
    return
  }

  try {
    await checkinStore.deleteSchedule(id)
    alert('排程已刪除')
  } catch {
    alert(checkinStore.error || '刪除失敗')
  }
}

// 切換啟用狀態
async function handleToggle(id: string) {
  try {
    await checkinStore.toggleSchedule(id)
  } catch {
    alert(checkinStore.error || '切換狀態失敗')
  }
}

// 重新掃描
async function handleRescan(id: string, name: string) {
  const scanAll = confirm(
    `是否掃描全部日期？\n\n點擊「確定」掃描全部\n點擊「取消」指定單日掃描`
  )

  if (scanAll) {
    // 掃描全部
    if (!confirm(`確定要重新掃描排程「${name}」的全部日期嗎？`)) {
      return
    }

    try {
      await checkinStore.rescanSchedule(id)
      alert('已開始重新掃描全部日期')
    } catch {
      alert(checkinStore.error || '掃描失敗')
    }
  } else {
    // 指定單日
    const scanDate = prompt('請輸入要掃描的日期（格式：YYYY-MM-DD）：')
    if (!scanDate) return

    // 簡單驗證日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(scanDate)) {
      alert('日期格式錯誤，請使用 YYYY-MM-DD 格式')
      return
    }

    try {
      await checkinStore.rescanSchedule(id, scanDate)
      alert(`已開始重新掃描 ${scanDate}`)
    } catch {
      alert(checkinStore.error || '掃描失敗')
    }
  }
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
  await checkinStore.fetchSchedules()
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
                排程 ID
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
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                <div class="inline-flex items-center gap-2 text-indigo-600">
                  <i class="bi bi-arrow-repeat animate-spin text-lg"></i>
                  載入排程資料中...
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
                  <span class="text-xs font-mono text-gray-600 truncate max-w-[100px]" :title="schedule.id">
                    {{ schedule.id }}
                  </span>
                  <button
                    type="button"
                    class="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    title="複製排程 ID"
                    @click="copyScheduleId(schedule.id)"
                  >
                    <i class="bi bi-clipboard text-sm"></i>
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="重新掃描"
                    @click="handleRescan(schedule.id, schedule.name)"
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
  </div>
</template>
