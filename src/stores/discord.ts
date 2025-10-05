import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { discordApi } from '@/services/api'
import type { DiscordChannel, DiscordGuild } from '@/services/api'

export const useDiscordStore = defineStore('discord', () => {
  // State
  const channels = ref<DiscordChannel[]>([])
  const guilds = ref<DiscordGuild[]>([])
  const currentGuildId = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache management
  const cacheTimestamp = ref<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 分鐘

  // Getters
  const channelsByCategory = computed(() => {
    const grouped: Record<string, DiscordChannel[]> = {}

    channels.value.forEach((channel) => {
      const category = channel.parentId || '未分類'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(channel)
    })

    // 每個分類內按 position 排序
    Object.keys(grouped).forEach((category) => {
      grouped[category]?.sort((a, b) => (a.position || 0) - (b.position || 0))
    })

    return grouped
  })

  const textChannels = computed(() => {
    // Discord 頻道類型: 0 = 文字頻道
    return channels.value.filter((channel) => channel.type === 0)
  })

  // Actions
  async function fetchChannels(guildId?: string, forceRefresh = false) {
    const now = Date.now()

    // 檢查快取（只在未強制刷新時）
    if (
      !forceRefresh &&
      channels.value.length > 0 &&
      now - cacheTimestamp.value < CACHE_DURATION
    ) {
      return channels.value
    }

    isLoading.value = true
    error.value = null

    try {
      const data = await discordApi.getDiscordChannels(guildId)
      channels.value = data.channels
      currentGuildId.value = data.guildId
      cacheTimestamp.value = now
      return data.channels
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入 Discord 頻道失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchGuilds() {
    isLoading.value = true
    error.value = null

    try {
      const data = await discordApi.getDiscordGuilds()
      guilds.value = data.guilds
      return data.guilds
    } catch (err: any) {
      error.value = err.response?.data?.message || '載入 Discord 伺服器列表失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function sendTestMessage(channelId: string, content: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await discordApi.sendTestMessage(channelId, content)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || '發送測試訊息失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getChannelById(channelId: string) {
    return channels.value.find((c) => c.id === channelId)
  }

  function getGuildById(guildId: string) {
    return guilds.value.find((g) => g.id === guildId)
  }

  function clearError() {
    error.value = null
  }

  function clearCache() {
    channels.value = []
    guilds.value = []
    currentGuildId.value = ''
    cacheTimestamp.value = 0
  }

  return {
    // State
    channels,
    guilds,
    currentGuildId,
    isLoading,
    error,
    // Getters
    channelsByCategory,
    textChannels,
    // Actions
    fetchChannels,
    fetchGuilds,
    sendTestMessage,
    getChannelById,
    getGuildById,
    clearError,
    clearCache,
  }
})
