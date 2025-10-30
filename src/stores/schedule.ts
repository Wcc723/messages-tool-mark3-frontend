import { ref } from 'vue'
import { defineStore } from 'pinia'
import { scheduleApi } from '@/services/api'
import type {
  Schedule,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
  ScheduleQueryParams,
  PaginationMeta,
  Timezone,
} from '@/services/api'

export const useScheduleStore = defineStore('schedule', () => {
  // State
  const schedules = ref<Schedule[]>([])
  const currentSchedule = ref<Schedule | null>(null)
  const copiedScheduleData = ref<Partial<Schedule> | null>(null)
  const timezones = ref<Timezone[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  })

  // Actions

  /**
   * 載入排程列表
   */
  async function fetchSchedules(params?: ScheduleQueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const data = await scheduleApi.getSchedules(params)
      schedules.value = data.schedules
      pagination.value = data.pagination
      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入排程列表失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 取得單一排程
   */
  async function fetchScheduleById(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const schedule = await scheduleApi.getScheduleById(id)
      currentSchedule.value = schedule
      return schedule
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 建立排程
   */
  async function createSchedule(data: ScheduleCreateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const schedule = await scheduleApi.createSchedule(data)
      // 將新排程加到列表前端
      schedules.value.unshift(schedule)
      // 更新總數
      pagination.value.totalCount++
      return schedule
    } catch (err: any) {
      error.value = err.response?.data?.message || '建立排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新排程
   */
  async function updateSchedule(id: string, data: ScheduleUpdateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await scheduleApi.updateSchedule(id, data)

      // 更新列表中的排程
      const index = schedules.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        schedules.value[index] = updated
      }

      // 更新當前排程
      if (currentSchedule.value?.id === id) {
        currentSchedule.value = updated
      }

      return updated
    } catch (err: any) {
      error.value = err.response?.data?.message || '更新排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新排程狀態
   */
  async function updateScheduleStatus(
    id: string,
    status: 'draft' | 'active' | 'paused' | 'completed'
  ) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await scheduleApi.updateScheduleStatus(id, status)

      // 更新列表中的排程
      const index = schedules.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        schedules.value[index] = updated
      }

      // 更新當前排程
      if (currentSchedule.value?.id === id) {
        currentSchedule.value = updated
      }

      return updated
    } catch (err: any) {
      error.value = err.response?.data?.message || '更新排程狀態失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刪除排程（支援樂觀更新）
   */
  async function deleteSchedule(id: string) {
    // 樂觀更新：立即從列表移除
    const index = schedules.value.findIndex((s) => s.id === id)
    const backup = index !== -1 ? schedules.value[index] : null
    const originalCount = pagination.value.totalCount

    if (index !== -1) {
      schedules.value.splice(index, 1)
      pagination.value.totalCount--
    }

    isLoading.value = true
    error.value = null

    try {
      await scheduleApi.deleteSchedule(id)

      // 清除當前排程（如果是被刪除的）
      if (currentSchedule.value?.id === id) {
        currentSchedule.value = null
      }
    } catch (err: any) {
      // 失敗時還原
      if (backup && index !== -1) {
        schedules.value.splice(index, 0, backup)
        pagination.value.totalCount = originalCount
      }
      error.value = err.response?.data?.message || '刪除排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 暫存複製排程資料
   */
  function setCopiedSchedule(schedule: Schedule) {
    copiedScheduleData.value = {
      title: schedule.title,
      content: schedule.content,
      scheduleType: schedule.scheduleType,
      weekDay: schedule.weekDay,
      monthDay: schedule.monthDay,
      channelId: schedule.channelId,
      timezone: schedule.timezone,
      attachments: schedule.attachments,
      status: 'draft',
    }
  }

  /**
   * 清除暫存複製資料
   */
  function clearCopiedSchedule() {
    copiedScheduleData.value = null
  }

  /**
   * 載入時區列表
   */
  async function fetchTimezones() {
    if (timezones.value.length > 0) {
      return timezones.value // 已有快取，直接返回
    }

    isLoading.value = true
    error.value = null

    try {
      const data = await scheduleApi.getTimezones()
      timezones.value = data
      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入時區列表失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 取得排程執行記錄
   */
  async function fetchScheduleLogs(id: string, params?: { page?: number; limit?: number }) {
    isLoading.value = true
    error.value = null

    try {
      const data = await scheduleApi.getScheduleLogs(id, params)
      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入執行記錄失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除當前排程
   */
  function clearCurrentSchedule() {
    currentSchedule.value = null
  }

  /**
   * 清除錯誤訊息
   */
  function clearError() {
    error.value = null
  }

  /**
   * 重置 Store
   */
  function reset() {
    schedules.value = []
    currentSchedule.value = null
    copiedScheduleData.value = null
    timezones.value = []
    error.value = null
    pagination.value = {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      limit: 10,
    }
  }

  return {
    // State
    schedules,
    currentSchedule,
    copiedScheduleData,
    timezones,
    isLoading,
    error,
    pagination,
    // Actions
    fetchSchedules,
    fetchScheduleById,
    createSchedule,
    updateSchedule,
    updateScheduleStatus,
    deleteSchedule,
    setCopiedSchedule,
    clearCopiedSchedule,
    fetchTimezones,
    fetchScheduleLogs,
    clearCurrentSchedule,
    clearError,
    reset,
  }
})
