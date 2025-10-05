<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { GoogleCredentialResponse } from '@/types/google'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const name = ref('')
const isRegisterMode = ref(false)
const localError = ref<string | null>(null)
const googleButtonContainer = ref<HTMLDivElement | null>(null)

const isLoading = computed(() => authStore.isLoading)
const errorMessage = computed(() => localError.value || authStore.error)
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const handleSubmit = async () => {
  localError.value = null
  authStore.clearError()

  // Form validation
  if (!email.value || !password.value) {
    localError.value = '請填寫所有必填欄位'
    return
  }

  if (isRegisterMode.value && !name.value) {
    localError.value = '請填寫姓名'
    return
  }

  if (password.value.length < 6) {
    localError.value = '密碼至少需要 6 個字元'
    return
  }

  try {
    if (isRegisterMode.value) {
      await authStore.register({
        email: email.value,
        password: password.value,
        name: name.value,
      })
    } else {
      await authStore.login({
        email: email.value,
        password: password.value,
      })
    }

    // Success - redirect to dashboard
    router.push('/dashboard')
  } catch (error: any) {
    // Error is already set in store, but we can add additional handling here
    console.error('Authentication error:', error)
  }
}

// Handle Google Login callback
const handleGoogleLogin = async (response: GoogleCredentialResponse) => {
  localError.value = null
  authStore.clearError()

  try {
    await authStore.googleLogin(response.credential)
    // Success - redirect to dashboard
    router.push('/dashboard')
  } catch (error: any) {
    console.error('Google login error:', error)
    localError.value = error.message || 'Google 登入失敗'
  }
}

// Initialize Google Identity Services
onMounted(() => {
  if (!googleClientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID not configured')
    return
  }

  if (!window.google) {
    console.error('Google Identity Services SDK not loaded')
    return
  }

  // Initialize Google Sign-In
  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleGoogleLogin,
    auto_select: false,
  })

  // Render Google Sign-In button
  if (googleButtonContainer.value) {
    window.google.accounts.id.renderButton(googleButtonContainer.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 400,
    })
  }
})

// Clear error when switching modes
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  localError.value = null
  authStore.clearError()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Discord 訊息排程工具</h1>
        <p class="text-gray-600">{{ isRegisterMode ? '建立新帳號' : '登入您的帳號' }}</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-600 text-sm">{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="isRegisterMode">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
          <input
            id="name"
            v-model="name"
            type="text"
            :required="isRegisterMode"
            :disabled="isLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="輸入您的姓名"
          >
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :disabled="isLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="example@email.com"
          >
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            :disabled="isLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="至少 6 字元"
          >
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium cursor-pointer disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? '處理中...' : (isRegisterMode ? '註冊' : '登入') }}
        </button>
      </form>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">或</span>
        </div>
      </div>

      <!-- Google Sign-In Button (rendered by Google SDK) -->
      <div ref="googleButtonContainer" class="flex justify-center"></div>

      <div class="mt-6 text-center">
        <button
          @click="toggleMode"
          :disabled="isLoading"
          class="text-indigo-600 hover:text-indigo-800 text-sm font-medium cursor-pointer disabled:text-indigo-400 disabled:cursor-not-allowed"
        >
          {{ isRegisterMode ? '已有帳號？立即登入' : '沒有帳號？立即註冊' }}
        </button>
      </div>
    </div>
  </div>
</template>
