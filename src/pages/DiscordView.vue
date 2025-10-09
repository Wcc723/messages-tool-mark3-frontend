<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiscordStore } from '@/stores/discord'
import { discordApi } from '@/services/api'

const discordStore = useDiscordStore()
const { guilds, channels } = storeToRefs(discordStore)

const botInfo = ref<{ id: string; username: string; discriminator: string; avatar?: string } | null>(null)
const botStatus = ref<'connected' | 'disconnected' | 'unknown'>('unknown')
const botGuildCount = ref(0)
const isLoadingBot = ref(false)
const botError = ref<string | null>(null)

const isLoadingGuilds = ref(false)
const guildError = ref<string | null>(null)

const selectedGuildId = ref('')
const isLoadingChannels = ref(false)
const channelError = ref<string | null>(null)

const isSendingTest = ref(false)
const testChannelId = ref('')
const testContent = ref('')
const testError = ref<string | null>(null)

const avatarUrl = computed(() => {
  if (!botInfo.value) return 'https://ui-avatars.com/api/?name=Discord+Bot&background=111827&color=fff'
  const { id, avatar, username } = botInfo.value
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
  }
  const initials = encodeURIComponent(username || 'Bot')
  return `https://ui-avatars.com/api/?name=${initials}&background=111827&color=fff`
})

const connectionLabel = computed(() => {
  if (botStatus.value === 'connected') return '已連接'
  if (botStatus.value === 'disconnected') return '未連接'
  return '未知'
})

const connectionBadgeClass = computed(() => {
  if (botStatus.value === 'connected') return 'bg-green-500'
  if (botStatus.value === 'disconnected') return 'bg-red-500'
  return 'bg-gray-400'
})

const filteredChannels = computed(() => channels.value.filter((channel) => channel.type === 0))

const selectedGuild = computed(() => guilds.value.find((guild) => guild.id === selectedGuildId.value) || null)

const loadBotInfo = async () => {
  isLoadingBot.value = true
  botError.value = null
  try {
    const data = await discordApi.getBotInfo()
    botInfo.value = data.bot
    botStatus.value = data.status === 'connected' ? 'connected' : 'disconnected'
    botGuildCount.value = data.guildCount
  } catch (error: any) {
    botError.value = error.response?.data?.message || '無法取得 Bot 資訊'
    botStatus.value = 'unknown'
  } finally {
    isLoadingBot.value = false
  }
}

const loadGuilds = async () => {
  isLoadingGuilds.value = true
  guildError.value = null
  try {
    const data = await discordStore.fetchGuilds()
    if (!selectedGuildId.value && data.length > 0) {
      selectedGuildId.value = data[0].id
    }
  } catch (error: any) {
    guildError.value = error.response?.data?.message || '載入伺服器列表失敗'
  } finally {
    isLoadingGuilds.value = false
  }
}

const loadChannels = async (guildId: string) => {
  if (!guildId) {
    channelError.value = null
    testChannelId.value = ''
    channels.value = []
    return
  }
  isLoadingChannels.value = true
  channelError.value = null
  try {
    await discordStore.fetchChannels(guildId, true)
    if (!filteredChannels.value.some((channel) => channel.id === testChannelId.value)) {
      testChannelId.value = ''
    }
  } catch (error: any) {
    channelError.value = error.response?.data?.message || '載入頻道失敗'
  } finally {
    isLoadingChannels.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([loadBotInfo(), loadGuilds()])
}

const handleTestMessage = async () => {
  if (!testChannelId.value || !testContent.value.trim()) {
    testError.value = '請選擇頻道並輸入訊息內容'
    return
  }
  testError.value = null
  isSendingTest.value = true
  try {
    await discordApi.sendTestMessage(testChannelId.value, testContent.value.trim())
    alert('測試訊息已發送')
    testContent.value = ''
  } catch (error: any) {
    testError.value = error.response?.data?.message || '發送測試訊息失敗'
  } finally {
    isSendingTest.value = false
  }
}

watch(selectedGuildId, (guildId) => {
  loadChannels(guildId)
})

onMounted(async () => {
  await refreshAll()
  if (selectedGuildId.value) {
    await loadChannels(selectedGuildId.value)
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Discord 設定</h1>
        <p class="text-gray-600">管理 Discord Bot 與伺服器頻道</p>
      </div>
      <button
        type="button"
        @click="refreshAll"
        :disabled="isLoadingBot || isLoadingGuilds"
        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <i class="bi bi-arrow-clockwise"></i>
        重新整理
      </button>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-robot text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Bot 連線資訊</h2>
            <p class="text-sm text-gray-600">檢視 Discord Bot 連線狀態與資訊</p>
          </div>
        </div>
        <span v-if="botError" class="text-sm text-red-600">{{ botError }}</span>
      </div>

      <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div class="flex items-center gap-4 flex-1">
          <img :src="avatarUrl" alt="Bot Avatar" class="w-16 h-16 rounded-xl border border-gray-200" />
          <div>
            <p class="text-lg font-semibold text-gray-900">
              <span v-if="botInfo">{{ botInfo.username }}#{{ botInfo.discriminator }}</span>
              <span v-else class="text-gray-500">未取得 Bot 資訊</span>
            </p>
            <div class="flex items-center gap-2 mt-2">
              <span :class="['w-2.5 h-2.5 rounded-full', connectionBadgeClass]"></span>
              <span class="text-sm text-gray-700">{{ connectionLabel }}</span>
              <span v-if="isLoadingBot" class="text-xs text-gray-500">更新中...</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 sm:w-auto">
          <div class="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
            <p class="text-xs text-gray-500">Bot ID</p>
            <p class="text-sm font-mono text-gray-900 mt-1">
              {{ botInfo?.id || '—' }}
            </p>
          </div>
          <div class="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
            <p class="text-xs text-gray-500">已加入伺服器</p>
            <p class="text-sm font-semibold text-gray-900 mt-1">{{ botGuildCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-buildings text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">伺服器列表</h2>
            <p class="text-sm text-gray-600">共 {{ guilds.length }} 個伺服器</p>
          </div>
        </div>
        <div v-if="guildError" class="mb-4 text-sm text-red-600">{{ guildError }}</div>
        <div v-if="isLoadingGuilds" class="py-12 text-center text-sm text-gray-600">載入伺服器中...</div>
        <div v-else-if="guilds.length === 0" class="py-12 text-center text-sm text-gray-500">
          尚未連接任何伺服器
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="guild in guilds"
            :key="guild.id"
            type="button"
            @click="selectedGuildId = guild.id"
            :class="[
              'w-full border rounded-md px-4 py-3 flex items-center gap-3 text-left transition-colors',
              selectedGuildId === guild.id
                ? 'border-gray-900 bg-gray-100'
                : 'border-gray-300 hover:border-gray-400'
            ]"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ guild.name }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ guild.memberCount }} 位成員</p>
            </div>
            <i
              v-if="selectedGuildId === guild.id"
              class="bi bi-check-circle-fill text-base text-gray-900"
            ></i>
          </button>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-hash text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">頻道列表</h2>
            <p class="text-sm text-gray-600">
              <span v-if="selectedGuild">{{ selectedGuild.name }} · {{ filteredChannels.length }} 個頻道</span>
              <span v-else>請選擇伺服器</span>
            </p>
          </div>
        </div>
        <div v-if="channelError" class="mb-4 text-sm text-red-600">{{ channelError }}</div>
        <div v-if="!selectedGuildId" class="py-12 text-center text-sm text-gray-500">
          請先選擇伺服器
        </div>
        <div v-else-if="isLoadingChannels" class="py-12 text-center text-sm text-gray-600">
          載入頻道中...
        </div>
        <div v-else-if="filteredChannels.length === 0" class="py-12 text-center text-sm text-gray-500">
          目前沒有可發送訊息的文字頻道
        </div>
        <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
          <div
            v-for="channel in filteredChannels"
            :key="channel.id"
            class="flex items-center gap-3 border border-gray-200 rounded-md px-4 py-3"
          >
            <div class="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
              <i class="bi bi-chat-dots text-gray-600 text-base"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">#{{ channel.name }}</p>
              <p class="text-xs text-gray-500 mt-1">ID：{{ channel.id }}</p>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-600">
              <span v-if="channel.permissions?.viewChannel" class="px-2 py-1 border border-gray-300 rounded">
                可檢視
              </span>
              <span v-if="channel.permissions?.sendMessages" class="px-2 py-1 border border-gray-300 rounded">
                可發送
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
          <i class="bi bi-send text-gray-600 text-lg"></i>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900">發送測試訊息</h2>
          <p class="text-sm text-gray-600">向所選伺服器的頻道發送測試訊息</p>
        </div>
      </div>

      <form @submit.prevent="handleTestMessage" class="space-y-4 max-w-2xl">
        <div>
          <label for="testChannel" class="block text-sm font-medium text-gray-700 mb-2">選擇頻道</label>
          <select
            id="testChannel"
            v-model="testChannelId"
            :disabled="filteredChannels.length === 0"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-100"
          >
            <option value="" disabled>請選擇頻道</option>
            <option v-for="channel in filteredChannels" :key="channel.id" :value="channel.id">
              #{{ channel.name }}
            </option>
          </select>
        </div>
        <div>
          <label for="testContent" class="block text-sm font-medium text-gray-700 mb-2">訊息內容</label>
          <textarea
            id="testContent"
            v-model="testContent"
            rows="4"
            maxlength="2000"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
            placeholder="輸入要發送的訊息內容"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">{{ testContent.length }} / 2000 字元</p>
        </div>
        <div v-if="testError" class="text-sm text-red-600">{{ testError }}</div>
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="isSendingTest || filteredChannels.length === 0"
            class="px-5 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <i v-if="isSendingTest" class="bi bi-hourglass-split"></i>
            <i v-else class="bi bi-send"></i>
            發送測試訊息
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
