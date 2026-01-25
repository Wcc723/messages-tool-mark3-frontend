import { ref } from 'vue'
import { defineStore } from 'pinia'
import { aiCharacterApi } from '@/services/api'
import type {
  Character,
  CharacterCreateRequest,
  CharacterUpdateRequest,
  CharacterQueryParams,
  CharacterImageType,
  CharacterImageMetadata,
  CharacterPagination,
  TagItem,
} from '@/types/ai-generation'

export const useAiCharacterStore = defineStore('aiCharacter', () => {
  // ============================================
  // State
  // ============================================

  const characters = ref<Character[]>([])
  const currentCharacter = ref<Character | null>(null)
  const tags = ref<TagItem[]>([])
  const pagination = ref<CharacterPagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================
  // 角色 CRUD
  // ============================================

  /**
   * 載入角色列表
   */
  async function fetchCharacters(params?: CharacterQueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const result = await aiCharacterApi.getCharacters(params)
      characters.value = result.characters || []
      if (result.pagination) {
        pagination.value = result.pagination
      }
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入角色列表失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 取得單一角色
   */
  async function fetchCharacter(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const character = await aiCharacterApi.getCharacter(id)
      currentCharacter.value = character
      return character
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入角色失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 建立角色
   */
  async function createCharacter(data: CharacterCreateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const character = await aiCharacterApi.createCharacter(data)
      // 將新角色加到列表前端
      if (character) {
        if (!characters.value) {
          characters.value = []
        }
        characters.value.unshift(character)
        pagination.value.total++
      }
      return character
    } catch (err: any) {
      error.value = err.response?.data?.message || '建立角色失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新角色
   */
  async function updateCharacter(id: string, data: CharacterUpdateRequest) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await aiCharacterApi.updateCharacter(id, data)

      // 更新列表中的角色
      if (updated && characters.value) {
        const index = characters.value.findIndex((c) => c.id === id)
        if (index !== -1) {
          characters.value[index] = updated
        }
      }

      // 更新當前角色
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = updated
      }

      return updated
    } catch (err: any) {
      error.value = err.response?.data?.message || '更新角色失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刪除角色（支援樂觀更新）
   */
  async function deleteCharacter(id: string) {
    if (!characters.value) {
      characters.value = []
    }

    // 樂觀更新：立即從列表移除
    const index = characters.value.findIndex((c) => c.id === id)
    const backup = index !== -1 ? characters.value[index] : null
    const originalTotal = pagination.value.total

    if (index !== -1) {
      characters.value.splice(index, 1)
      pagination.value.total--
    }

    isLoading.value = true
    error.value = null

    try {
      await aiCharacterApi.deleteCharacter(id)

      // 清除當前角色（如果是被刪除的）
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = null
      }
    } catch (err: any) {
      // 失敗時還原
      if (backup && index !== -1 && characters.value) {
        characters.value.splice(index, 0, backup)
        pagination.value.total = originalTotal
      }
      error.value = err.response?.data?.message || '刪除角色失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // 圖片管理
  // ============================================

  /**
   * 上傳角色圖片
   */
  async function uploadImage(
    id: string,
    file: File,
    type: CharacterImageType,
    metadata?: CharacterImageMetadata
  ) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await aiCharacterApi.uploadCharacterImage(id, file, type, metadata)

      // 更新列表中的角色
      if (updated && characters.value) {
        const index = characters.value.findIndex((c) => c.id === id)
        if (index !== -1) {
          characters.value[index] = updated
        }
      }

      // 更新當前角色
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = updated
      }

      return updated
    } catch (err: any) {
      error.value = err.response?.data?.message || '上傳圖片失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刪除角色圖片
   */
  async function deleteImage(id: string, imageIndex: number, type: CharacterImageType) {
    isLoading.value = true
    error.value = null

    try {
      const updated = await aiCharacterApi.deleteCharacterImage(id, imageIndex, type)

      // 更新列表中的角色
      if (updated && characters.value) {
        const listIndex = characters.value.findIndex((c) => c.id === id)
        if (listIndex !== -1) {
          characters.value[listIndex] = updated
        }
      }

      // 更新當前角色
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = updated
      }

      return updated
    } catch (err: any) {
      error.value = err.response?.data?.message || '刪除圖片失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // 標籤管理
  // ============================================

  /**
   * 載入標籤列表
   */
  async function fetchTags() {
    if (tags.value.length > 0) {
      return tags.value // 已有快取，直接返回
    }

    try {
      const data = await aiCharacterApi.getTags()
      tags.value = data
      return data
    } catch (err: any) {
      console.error('載入標籤失敗:', err)
      return []
    }
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 清除當前角色
   */
  function clearCurrentCharacter() {
    currentCharacter.value = null
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
    characters.value = []
    currentCharacter.value = null
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
    characters,
    currentCharacter,
    tags,
    pagination,
    isLoading,
    error,
    // Actions
    fetchCharacters,
    fetchCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    uploadImage,
    deleteImage,
    fetchTags,
    clearCurrentCharacter,
    clearError,
    reset,
  }
})
