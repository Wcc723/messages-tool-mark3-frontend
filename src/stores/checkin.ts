import { ref } from 'vue'
import { defineStore } from 'pinia'
import { checkinApi } from '@/services/api'
import type {
  CheckinSchedule,
  CheckinScheduleCreateRequest,
  CheckinScheduleUpdateRequest,
  CheckinScheduleQueryParams,
  CheckinRescanRequest
} from '@/services/api'

export const useCheckinStore = defineStore('checkin', () => {
  // State
  const schedules = ref<CheckinSchedule[]>([])
  const currentSchedule = ref<CheckinSchedule | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions

  /**
   * 載入打卡排程列表
   */
  async function fetchSchedules(params?: CheckinScheduleQueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const data = await checkinApi.getCheckinSchedules(params)
      schedules.value = data
      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入打卡排程列表失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 取得單一打卡排程
   */
  async function fetchScheduleById(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const schedule = await checkinApi.getCheckinScheduleById(id)
      currentSchedule.value = schedule
      return schedule
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入打卡排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 建立打卡排程
   */
  async function createSchedule(data: CheckinScheduleCreateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const schedule = await checkinApi.createCheckinSchedule(data)
      schedules.value.unshift(schedule)
      return schedule
    } catch (err: any) {
      error.value = err.response?.data?.message || '建立打卡排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新打卡排程
   */
  async function updateSchedule(id: string, data: CheckinScheduleUpdateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await checkinApi.updateCheckinSchedule(id, data)

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
      error.value = err.response?.data?.message || '更新打卡排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刪除打卡排程（支援樂觀更新）
   */
  async function deleteSchedule(id: string) {
    const index = schedules.value.findIndex((s) => s.id === id)
    const backup = index !== -1 ? schedules.value[index] : null

    // 樂觀更新：立即從 UI 移除
    if (index !== -1) {
      schedules.value.splice(index, 1)
    }

    isLoading.value = true
    error.value = null

    try {
      await checkinApi.deleteCheckinSchedule(id)

      // 如果當前排程被刪除，清除 currentSchedule
      if (currentSchedule.value?.id === id) {
        currentSchedule.value = null
      }
    } catch (err: any) {
      // 失敗時還原
      if (backup && index !== -1) {
        schedules.value.splice(index, 0, backup)
      }
      error.value = err.response?.data?.message || '刪除打卡排程失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 切換啟用狀態
   */
  async function toggleSchedule(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await checkinApi.toggleCheckinSchedule(id)

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
      error.value = err.response?.data?.message || '切換狀態失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 手動重新掃描
   * @param id 排程 ID
   * @param scanDate 可選，指定掃描日期（YYYY-MM-DD）。不指定則掃描全部
   */
  async function rescanSchedule(id: string, scanDate?: string) {
    isLoading.value = true
    error.value = null

    try {
      const data: CheckinRescanRequest | undefined = scanDate ? { scanDate } : undefined
      await checkinApi.rescanCheckinSchedule(id, data)
    } catch (err: any) {
      error.value = err.response?.data?.message || '重新掃描失敗'
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
    error.value = null
  }

  return {
    // State
    schedules,
    currentSchedule,
    isLoading,
    error,
    // Actions
    fetchSchedules,
    fetchScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    rescanSchedule,
    clearCurrentSchedule,
    clearError,
    reset,
  }
})
