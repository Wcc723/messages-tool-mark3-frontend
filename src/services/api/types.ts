import type { Role } from '@/types/permission'

// ============================================
// 基礎回應格式
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
}

// ============================================
// 使用者相關
// ============================================

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string
  createdAt: string
  updatedAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AdminUser extends User {
  isActive: boolean
  scheduleLimit: number
}

export interface UsersListResponse {
  users: AdminUser[]
  pagination: PaginationMeta
}

export interface AuthResponse {
  success: boolean
  message?: string
  data: {
    user: User
    token: string
    refreshToken: string
    expiresAt: string
  }
}

// ============================================
// Discord 相關
// ============================================

export interface DiscordBot {
  id: string
  username: string
  discriminator: string
  avatar?: string
}

export interface DiscordGuild {
  id: string
  name: string
  icon?: string
  owner: boolean
  permissions: string[]
  memberCount: number
  description?: string
}

export interface DiscordChannel {
  id: string
  name: string
  type: number
  position: number
  parentId?: string
  parentName?: string
  topic?: string
  nsfw?: boolean
  permissions?: {
    viewChannel: boolean
    sendMessages: boolean
    embedLinks: boolean
    attachFiles: boolean
    mentionEveryone: boolean
  }
}

export interface DiscordMessage {
  messageId: string
  channelId: string
  guildId?: string
  content: string
  timestamp: number
  url: string
}

export interface DiscordChannelsResponse {
  guildId: string
  channels: DiscordChannel[]
  count: number
}

export interface DiscordGuildsResponse {
  guilds: DiscordGuild[]
  count: number
}

// ============================================
// 排程相關
// ============================================

export type ScheduleType = 'once' | 'weekly' | 'monthly'
export type ScheduleStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface ThreadConfig {
  enabled: boolean
  title?: string
  initialMessage?: string | null
}

export interface ScheduleAttachmentImage {
  imageId: string
  firebaseUrl: string
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  discordUrl?: string | null
}

export interface ScheduleAttachments {
  images: ScheduleAttachmentImage[]
}

export interface Schedule {
  id: string
  userId: string
  title: string
  content: string
  scheduleType: ScheduleType
  scheduledTime: string // HH:mm:ss
  scheduledDate?: string // YYYY-MM-DD (once only)
  weekDay?: number // 0-6 (weekly only, 0=Sunday)
  monthDay?: number // 1-31 (monthly only)
  channelId: string
  timezone: string
  validUntil?: string
  attachments?: ScheduleAttachments | null
  threadConfig?: ThreadConfig | null
  status: ScheduleStatus
  lastExecutedAt?: string
  nextExecutionAt?: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleCreateRequest {
  title: string
  content: string
  scheduleType: ScheduleType
  scheduledTime: string // HH:mm:ss
  scheduledDate?: string // YYYY-MM-DD (once only)
  weekDay?: number // 0-6 (weekly only)
  monthDay?: number // 1-31 (monthly only)
  channelId: string
  timezone?: string
  validUntil?: string
  attachments?: ScheduleAttachments | null
  threadConfig?: ThreadConfig | null
  status?: 'draft' | 'active'
}

export interface ScheduleUpdateRequest {
  title?: string
  content?: string
  scheduleType?: ScheduleType
  scheduledTime?: string
  scheduledDate?: string
  weekDay?: number
  monthDay?: number
  channelId?: string
  timezone?: string
  validUntil?: string
  attachments?: ScheduleAttachments | null
  threadConfig?: ThreadConfig | null
  status?: ScheduleStatus
}

export interface StorageUploadImageResponse {
  imageId: string
  publicUrl: string
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface ScheduleListResponse {
  schedules: Schedule[]
  pagination: PaginationMeta
}

export interface ScheduleQueryParams {
  page?: number
  limit?: number
  status?: ScheduleStatus
  search?: string
}

// ============================================
// 時區相關
// ============================================

export interface Timezone {
  value: string
  label: string
  offset: string
}

// ============================================
// 執行記錄
// ============================================

export type ExecutionStatus = 'success' | 'failed' | 'pending'
export type ThreadStatus = 'success' | 'failed' | 'skipped' | 'not_configured'

export interface ExecutionLog {
  id: string
  scheduleId: string
  status: ExecutionStatus
  executedAt: string
  message?: string
  error?: string
  discordMessageId?: string
  threadId?: string | null
  threadUrl?: string | null
  threadStatus?: ThreadStatus | null
  threadError?: string | null
}

export interface ExecutionLogListResponse {
  logs: ExecutionLog[]
  pagination: PaginationMeta
}

export interface ExecutionLogQueryParams {
  page?: number
  limit?: number
}

// ============================================
// 打卡排程相關
// ============================================

export interface CheckinSchedule {
  id: string
  name: string
  channelId: string
  guildId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  keywords?: string[]
  expectedThreadCount?: number
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CheckinScheduleCreateRequest {
  name: string
  channelId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  keywords?: string[]
  expectedThreadCount?: number
}

export interface CheckinScheduleUpdateRequest {
  name?: string
  keywords?: string[]
  expectedThreadCount?: number
  isActive?: boolean
}

export interface CheckinScheduleListResponse {
  schedules: CheckinSchedule[]
  count: number
}

export interface CheckinScheduleQueryParams {
  includeStats?: boolean
}

export interface CheckinRescanRequest {
  scanDate?: string // YYYY-MM-DD，可選，不指定則掃描全部
}

export interface CheckinRescanResponse {
  scanLogId: string
  message: string
}

// ============================================
// 掃描狀態相關
// ============================================

export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface ScanProgress {
  phase: string
  totalThreads: number
  processedThreads: number
  currentThread?: {
    id: string
    name: string
  }
}

export interface ScanStatusResponse {
  id: string
  status: ScanStatus
  progress?: ScanProgress
  startTime?: string
  endTime?: string
  threadsFound?: number
  checkinsRecorded?: number
  errorMessage?: string
}

export interface ScanResultThread {
  id: string
  name: string
  checkinsFound: number
  status: string
  error?: string
}

export interface ScanResultSummary {
  totalApiCalls: number
  totalDuration: number
  failedThreads: number
}

export interface ScanResultResponse {
  id: string
  status: string
  result?: {
    threads: ScanResultThread[]
    summary: ScanResultSummary
  }
  duration?: number
  threadsFound?: number
  checkinsRecorded?: number
}

// ============================================
// 打卡統計與用戶相關（Public API）
// ============================================

export interface CheckinStats {
  scheduleId: string
  scheduleName: string
  totalCheckins: number
  dailyTasks: number
  expectedTasks: number
  progress: number
  uniqueUsers: number
  channelInfo?: Record<string, unknown>
  dailyStats?: Array<Record<string, unknown>>
}

export interface CheckinUser {
  discordUserId: string
  username: string
  displayName: string
  avatarUrl?: string
  totalCheckinDays: number
  checkinStatus?: Record<string, unknown>
}

export interface CheckinUsersResponse {
  users: CheckinUser[]
  pagination: PaginationMeta
}

export interface CheckinUsersQueryParams {
  page?: number
  limit?: number
  search?: string
}
