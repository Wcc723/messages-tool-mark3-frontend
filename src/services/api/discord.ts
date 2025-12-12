import apiClient from './client'
import type {
  ApiResponse,
  DiscordChannelsResponse,
  DiscordGuildsResponse,
  DiscordBot,
  DiscordMessage,
} from './types'

// ============================================
// Discord Bot 相關
// ============================================

/**
 * 驗證 Discord Bot 連接狀態
 * GET /api/discord/validate-token
 */
export async function validateBotToken() {
  const response = await apiClient.get<
    ApiResponse<{
      valid: boolean
      botUser: DiscordBot
    }>
  >('/api/discord/validate-token')
  return response.data.data!
}

/**
 * 取得 Bot 資訊和連接狀態
 * GET /api/discord/bot-info
 */
export async function getBotInfo() {
  const response = await apiClient.get<
    ApiResponse<{
      bot: DiscordBot
      guildCount: number
      status: string
    }>
  >('/api/discord/bot-info')
  return response.data.data!
}

// ============================================
// Discord 伺服器相關
// ============================================

/**
 * 取得 Bot 加入的 Discord 伺服器列表
 * GET /api/discord/guilds
 */
export async function getDiscordGuilds() {
  const response = await apiClient.get<ApiResponse<DiscordGuildsResponse>>('/api/discord/guilds')
  return response.data.data!
}

// ============================================
// Discord 頻道相關
// ============================================

/**
 * 取得預設伺服器的頻道列表
 * GET /api/discord/channels
 */
export async function getDefaultChannels() {
  const response = await apiClient.get<ApiResponse<DiscordChannelsResponse>>(
    '/api/discord/channels'
  )
  return response.data.data!
}

/**
 * 取得指定伺服器的頻道列表
 * GET /api/discord/guilds/:guildId/channels
 *
 * @param guildId - Discord 伺服器 ID
 * @param token - Discord Bot Token (optional, 如後端已設定則不需要)
 */
export async function getGuildChannels(guildId: string, token?: string) {
  const response = await apiClient.get<ApiResponse<DiscordChannelsResponse>>(
    `/api/discord/guilds/${guildId}/channels`,
    {
      data: token ? { token } : undefined,
    }
  )
  return response.data.data!
}

/**
 * 取得頻道列表 (自動判斷使用預設或指定 Guild)
 *
 * @param guildId - 可選的 Discord 伺服器 ID
 */
export async function getDiscordChannels(guildId?: string) {
  if (guildId) {
    return getGuildChannels(guildId)
  }
  return getDefaultChannels()
}

// ============================================
// Discord 訊息相關
// ============================================

/**
 * 發送測試訊息到 Discord 頻道
 * POST /api/discord/test-message
 *
 * @param channelId - Discord 頻道 ID
 * @param content - 測試訊息內容 (最大 2000 字元)
 */
export async function sendTestMessage(channelId: string, content: string) {
  const response = await apiClient.post<ApiResponse<DiscordMessage>>(
    '/api/discord/test-message',
    {
      channelId,
      content,
    }
  )
  return response.data
}

/**
 * 發送訊息到 Discord 頻道
 * POST /api/discord/send-message
 *
 * @param channelId - Discord 頻道 ID
 * @param content - 訊息內容 (最大 2000 字元)
 */
export async function sendMessage(channelId: string, content: string) {
  const response = await apiClient.post<ApiResponse<DiscordMessage>>('/api/discord/send-message', {
    channelId,
    content,
  })
  return response.data
}
