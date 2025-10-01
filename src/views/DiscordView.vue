<script setup lang="ts">
import { ref } from 'vue'

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  memberCount: number
}

interface DiscordChannel {
  id: string
  name: string
  type: number
  permissions: {
    viewChannel: boolean
    sendMessages: boolean
  }
}

// Mock Discord Bot Info
const botInfo = ref({
  id: '1234567890',
  username: 'My Discord Bot',
  discriminator: '0001',
  avatar: 'https://ui-avatars.com/api/?name=Discord+Bot&background=5865F2&color=fff',
  isConnected: true,
})

// Mock Guilds Data
const guilds = ref<DiscordGuild[]>([
  {
    id: '111111111',
    name: 'Hexschool 開發團隊',
    icon: null,
    memberCount: 156,
  },
  {
    id: '222222222',
    name: '測試伺服器',
    icon: null,
    memberCount: 42,
  },
  {
    id: '333333333',
    name: '前端社群',
    icon: null,
    memberCount: 328,
  },
])

const selectedGuildId = ref('')
const channels = ref<DiscordChannel[]>([])
const isLoadingChannels = ref(false)

const testMessage = ref({
  channelId: '',
  content: '',
})

const handleGuildSelect = async (guildId: string) => {
  selectedGuildId.value = guildId
  isLoadingChannels.value = true

  // Mock loading channels
  setTimeout(() => {
    channels.value = [
      {
        id: '123456789',
        name: 'general',
        type: 0,
        permissions: { viewChannel: true, sendMessages: true },
      },
      {
        id: '987654321',
        name: 'announcements',
        type: 0,
        permissions: { viewChannel: true, sendMessages: true },
      },
      {
        id: '456789123',
        name: 'development',
        type: 0,
        permissions: { viewChannel: true, sendMessages: true },
      },
      {
        id: '789123456',
        name: 'testing',
        type: 0,
        permissions: { viewChannel: true, sendMessages: true },
      },
    ]
    isLoadingChannels.value = false
  }, 500)
}

const handleTestMessage = () => {
  if (!testMessage.value.channelId || !testMessage.value.content) {
    alert('請選擇頻道並輸入訊息內容')
    return
  }

  // Mock sending test message
  alert('測試訊息已發送！')
  testMessage.value.content = ''
}

const handleRefreshBot = () => {
  alert('Bot 連接狀態已刷新')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Discord 設定</h1>
      <p class="text-gray-600">管理 Discord Bot 和伺服器設定</p>
    </div>

    <!-- Bot Status Card -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-800">Bot 連接狀態</h2>
        <button
          @click="handleRefreshBot"
          class="p-2 hover:bg-gray-100 rounded-lg transition"
          title="刷新狀態"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div class="flex items-center gap-4">
        <img
          :src="botInfo.avatar"
          alt="Bot Avatar"
          class="w-16 h-16 rounded-full"
        >
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ botInfo.username }}#{{ botInfo.discriminator }}
          </h3>
          <div class="flex items-center gap-2 mt-1">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                botInfo.isConnected ? 'bg-green-500' : 'bg-red-500'
              ]"
            ></div>
            <span :class="[
              'text-sm font-medium',
              botInfo.isConnected ? 'text-green-600' : 'text-red-600'
            ]">
              {{ botInfo.isConnected ? '已連接' : '未連接' }}
            </span>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">Bot ID</p>
          <p class="text-sm font-mono text-gray-800">{{ botInfo.id }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Guilds List -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">伺服器列表</h2>
        <p class="text-sm text-gray-600 mb-4">Bot 已加入 {{ guilds.length }} 個伺服器</p>

        <div class="space-y-2">
          <button
            v-for="guild in guilds"
            :key="guild.id"
            @click="handleGuildSelect(guild.id)"
            :class="[
              'w-full flex items-center gap-3 p-4 rounded-lg border-2 transition text-left',
              selectedGuildId === guild.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            ]"
          >
            <div
              class="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg"
            >
              {{ guild.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-800">{{ guild.name }}</h3>
              <p class="text-sm text-gray-500">{{ guild.memberCount }} 位成員</p>
            </div>
            <svg
              v-if="selectedGuildId === guild.id"
              class="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Channels List -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">頻道列表</h2>

        <div v-if="!selectedGuildId" class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <p class="text-gray-500">請先選擇一個伺服器</p>
        </div>

        <div v-else-if="isLoadingChannels" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p class="text-gray-500 mt-4">載入頻道中...</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="channel in channels"
            :key="channel.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <div class="flex-1">
              <h3 class="font-medium text-gray-800"># {{ channel.name }}</h3>
              <p class="text-xs text-gray-500">ID: {{ channel.id }}</p>
            </div>
            <div class="flex gap-1">
              <span
                v-if="channel.permissions.viewChannel"
                class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                title="可檢視"
              >
                👁️
              </span>
              <span
                v-if="channel.permissions.sendMessages"
                class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                title="可發送訊息"
              >
                💬
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Message Section -->
    <div class="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">測試訊息</h2>
      <p class="text-sm text-gray-600 mb-4">發送測試訊息到指定頻道</p>

      <form @submit.prevent="handleTestMessage" class="space-y-4">
        <div>
          <label for="testChannel" class="block text-sm font-medium text-gray-700 mb-2">
            選擇頻道
          </label>
          <select
            id="testChannel"
            v-model="testMessage.channelId"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="" disabled>請選擇頻道</option>
            <option v-for="channel in channels" :key="channel.id" :value="channel.id">
              # {{ channel.name }}
            </option>
          </select>
        </div>

        <div>
          <label for="testContent" class="block text-sm font-medium text-gray-700 mb-2">
            訊息內容
          </label>
          <textarea
            id="testContent"
            v-model="testMessage.content"
            rows="3"
            maxlength="2000"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            placeholder="輸入測試訊息內容..."
          ></textarea>
        </div>

        <button
          type="submit"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          發送測試訊息
        </button>
      </form>
    </div>
  </div>
</template>
