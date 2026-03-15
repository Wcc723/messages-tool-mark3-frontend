import { ref } from 'vue'
import { defineStore } from 'pinia'
import { aiScenarioApi } from '@/services/api'
import { getApiErrorMessage } from '@/utils/error'
import type {
  Scenario,
  ScenarioCreateRequest,
  ScenarioUpdateRequest,
  ScenarioQueryParams,
  ScenarioPagination,
  TagItem,
} from '@/types/ai-generation'

export const useAiScenarioStore = defineStore('aiScenario', () => {
  // ============================================
  // State
  // ============================================

  const scenarios = ref<Scenario[]>([])
  const currentScenario = ref<Scenario | null>(null)
  const tags = ref<TagItem[]>([])
  const pagination = ref<ScenarioPagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================
  // 情境 CRUD
  // ============================================

  async function fetchScenarios(params?: ScenarioQueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const result = await aiScenarioApi.getScenarios(params)
      scenarios.value = result.scenarios || []
      if (result.pagination) {
        pagination.value = result.pagination
      }
      return result
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, '載入情境列表失敗')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchScenario(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const scenario = await aiScenarioApi.getScenario(id)
      currentScenario.value = scenario
      return scenario
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, '載入情境失敗')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createScenario(data: ScenarioCreateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const scenario = await aiScenarioApi.createScenario(data)
      if (scenario) {
        if (!scenarios.value) {
          scenarios.value = []
        }
        scenarios.value.unshift(scenario)
        pagination.value.total++
      }
      return scenario
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, '建立情境失敗')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateScenario(id: string, data: ScenarioUpdateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await aiScenarioApi.updateScenario(id, data)

      if (updated && scenarios.value) {
        const index = scenarios.value.findIndex((s) => s.id === id)
        if (index !== -1) {
          scenarios.value[index] = updated
        }
      }

      if (currentScenario.value?.id === id) {
        currentScenario.value = updated
      }

      return updated
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, '更新情境失敗')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteScenario(id: string) {
    if (!scenarios.value) {
      scenarios.value = []
    }

    // 樂觀更新
    const index = scenarios.value.findIndex((s) => s.id === id)
    const backup = index !== -1 ? scenarios.value[index] : null
    const originalTotal = pagination.value.total

    if (index !== -1) {
      scenarios.value.splice(index, 1)
      pagination.value.total--
    }

    isLoading.value = true
    error.value = null

    try {
      await aiScenarioApi.deleteScenario(id)

      if (currentScenario.value?.id === id) {
        currentScenario.value = null
      }
    } catch (err: unknown) {
      if (backup && index !== -1 && scenarios.value) {
        scenarios.value.splice(index, 0, backup)
        pagination.value.total = originalTotal
      }
      error.value = getApiErrorMessage(err, '刪除情境失敗')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // 圖片管理
  // ============================================

  async function uploadImage(id: string, file: File, description?: string) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await aiScenarioApi.uploadScenarioImage(id, file, description)

      if (updated && scenarios.value) {
        const index = scenarios.value.findIndex((s) => s.id === id)
        if (index !== -1) {
          scenarios.value[index] = updated
        }
      }

      if (currentScenario.value?.id === id) {
        currentScenario.value = updated
      }

      return updated
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, '上傳圖片失敗')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteImage(id: string, imageIndex: number) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await aiScenarioApi.deleteScenarioImage(id, imageIndex)

      if (updated && scenarios.value) {
        const listIndex = scenarios.value.findIndex((s) => s.id === id)
        if (listIndex !== -1) {
          scenarios.value[listIndex] = updated
        }
      }

      if (currentScenario.value?.id === id) {
        currentScenario.value = updated
      }

      return updated
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, '刪除圖片失敗')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // 標籤管理
  // ============================================

  async function fetchTags() {
    if (tags.value.length > 0) {
      return tags.value
    }

    try {
      const data = await aiScenarioApi.getTags()
      tags.value = data
      return data
    } catch (err: unknown) {
      console.error('載入標籤失敗:', err)
      return []
    }
  }

  // ============================================
  // 工具方法
  // ============================================

  function clearCurrentScenario() {
    currentScenario.value = null
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    scenarios.value = []
    currentScenario.value = null
    tags.value = []
    error.value = null
    pagination.value = {
      page: 1,
      totalPages: 1,
      total: 0,
      limit: 10,
    }
  }

  return {
    // State
    scenarios,
    currentScenario,
    tags,
    pagination,
    isLoading,
    error,
    // Actions
    fetchScenarios,
    fetchScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    uploadImage,
    deleteImage,
    fetchTags,
    clearCurrentScenario,
    clearError,
    reset,
  }
})
