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
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Discord 設定</h1>
      <p class="text-gray-600">管理 Discord Bot 和伺服器設定</p>
    </div>

    <!-- Bot Status Card -->
    <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 mb-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <i class="bi bi-robot text-indigo-600 text-2xl"></i>
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900">Bot 連接狀態</h2>
          <p class="text-sm text-gray-600">Discord Bot 連線資訊</p>
        </div>
        <button
          @click="handleRefreshBot"
          class="p-3 hover:bg-gray-100 rounded-xl transition-all cursor-pointer hover:shadow-md"
          title="刷新狀態"
        >
          <i class="bi bi-arrow-clockwise text-xl text-gray-600"></i>
        </button>
      </div>

      <div class="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
        <img
          :src="botInfo.avatar"
          alt="Bot Avatar"
          class="w-20 h-20 rounded-2xl shadow-lg ring-4 ring-white"
        >
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            {{ botInfo.username }}#{{ botInfo.discriminator }}
          </h3>
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-4 h-4 rounded-full ring-4',
                botInfo.isConnected ? 'bg-green-500 ring-green-100' : 'bg-red-500 ring-red-100'
              ]"
            ></div>
            <span :class="[
              'text-sm font-bold',
              botInfo.isConnected ? 'text-green-600' : 'text-red-600'
            ]">
              {{ botInfo.isConnected ? '已連接' : '未連接' }}
            </span>
          </div>
        </div>
        <div class="text-right bg-white px-6 py-3 rounded-xl border border-gray-200">
          <p class="text-xs text-gray-500 mb-1">Bot ID</p>
          <p class="text-sm font-mono font-bold text-gray-800">{{ botInfo.id }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Guilds List -->
      <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-buildings text-purple-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">伺服器列表</h2>
            <p class="text-sm text-gray-600">Bot 已加入 {{ guilds.length }} 個伺服器</p>
          </div>
        </div>

        <div class="space-y-3">
          <button
            v-for="guild in guilds"
            :key="guild.id"
            @click="handleGuildSelect(guild.id)"
            :class="[
              'w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left cursor-pointer',
              selectedGuildId === guild.id
                ? 'border-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
            ]"
          >
            <div
              :class="[
                'w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md',
                selectedGuildId === guild.id ? 'bg-indigo-600' : 'bg-purple-500'
              ]"
            >
              <i class="bi bi-discord"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-gray-900 mb-1">{{ guild.name }}</h3>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <i class="bi bi-people-fill"></i>
                <span class="font-semibold">{{ guild.memberCount }} 位成員</span>
              </div>
            </div>
            <i
              v-if="selectedGuildId === guild.id"
              class="bi bi-check-circle-fill text-2xl text-indigo-600"
            ></i>
          </button>
        </div>
      </div>

      <!-- Channels List -->
      <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <i class="bi bi-hash text-blue-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">頻道列表</h2>
            <p class="text-sm text-gray-600">
              <span v-if="channels.length > 0">共 {{ channels.length }} 個頻道</span>
              <span v-else>請選擇伺服器</span>
            </p>
          </div>
        </div>

        <div v-if="!selectedGuildId" class="text-center py-16">
          <div class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="bi bi-chat-dots text-6xl text-gray-400"></i>
          </div>
          <p class="text-gray-500 font-medium">請先選擇一個伺服器</p>
        </div>

        <div v-else-if="isLoadingChannels" class="text-center py-16">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p class="text-gray-500 font-medium">載入頻道中...</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="channel in channels"
            :key="channel.id"
            class="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="bi bi-chat-dots text-xl text-blue-600"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-gray-900"># {{ channel.name }}</h3>
              <p class="text-xs text-gray-500 font-mono">ID: {{ channel.id }}</p>
            </div>
            <div class="flex gap-2">
              <span
                v-if="channel.permissions.viewChannel"
                class="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg font-bold border border-green-200"
                title="可檢視"
              >
                <i class="bi bi-eye-fill"></i>
              </span>
              <span
                v-if="channel.permissions.sendMessages"
                class="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-lg font-bold border border-blue-200"
                title="可發送訊息"
              >
                <i class="bi bi-chat-dots-fill"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Message Section -->
    <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <i class="bi bi-send text-green-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">測試訊息</h2>
          <p class="text-sm text-gray-600">發送測試訊息到指定頻道</p>
        </div>
      </div>

      <form @submit.prevent="handleTestMessage" class="space-y-6">
        <div>
          <label for="testChannel" class="block text-sm font-semibold text-gray-700 mb-3">
            選擇頻道 <span class="text-red-500">*</span>
          </label>
          <select
            id="testChannel"
            v-model="testMessage.channelId"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none cursor-pointer transition text-lg font-medium"
          >
            <option value="" disabled>請選擇頻道</option>
            <option v-for="channel in channels" :key="channel.id" :value="channel.id">
              # {{ channel.name }}
            </option>
          </select>
        </div>

        <div>
          <label for="testContent" class="block text-sm font-semibold text-gray-700 mb-3">
            訊息內容 <span class="text-red-500">*</span>
          </label>
          <textarea
            id="testContent"
            v-model="testMessage.content"
            rows="4"
            maxlength="2000"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none transition"
            placeholder="輸入測試訊息內容..."
          ></textarea>
          <p class="text-sm text-gray-500 mt-2">{{ testMessage.content.length }} / 2000 字元</p>
        </div>

        <button
          type="submit"
          class="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl cursor-pointer"
        >
          <i class="bi bi-send-fill mr-2"></i>
          發送測試訊息
        </button>
      </form>
    </div>
  </div>
</template>
