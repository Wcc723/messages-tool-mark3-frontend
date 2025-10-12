import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/services/api'
import type { User, LoginRequest, RegisterRequest } from '@/services/api'
import { getCookie, setCookie, removeCookie, COOKIE_NAMES, DEFAULT_COOKIE_OPTIONS } from '@/utils/cookies'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(getCookie(COOKIE_NAMES.AUTH_TOKEN))
  const refreshTokenValue = ref<string | null>(getCookie(COOKIE_NAMES.REFRESH_TOKEN))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Prevent duplicate fetchProfile calls
  let fetchProfilePromise: Promise<boolean> | null = null

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login(credentials)

      if (response.success && response.data) {
        user.value = response.data.user
        token.value = response.data.token
        refreshTokenValue.value = response.data.refreshToken

        // Save to Cookie (7 days expiry)
        setCookie(COOKIE_NAMES.AUTH_TOKEN, response.data.token, {
          ...DEFAULT_COOKIE_OPTIONS,
          expires: 7,
        })
        setCookie(COOKIE_NAMES.REFRESH_TOKEN, response.data.refreshToken, {
          ...DEFAULT_COOKIE_OPTIONS,
          expires: 30, // Refresh token 30 days
        })

        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || '登入失敗，請檢查您的帳號密碼'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.register(data)

      if (response.success && response.data) {
        user.value = response.data.user
        token.value = response.data.token
        refreshTokenValue.value = response.data.refreshToken

        // Save to Cookie (7 days expiry)
        setCookie(COOKIE_NAMES.AUTH_TOKEN, response.data.token, {
          ...DEFAULT_COOKIE_OPTIONS,
          expires: 7,
        })
        setCookie(COOKIE_NAMES.REFRESH_TOKEN, response.data.refreshToken, {
          ...DEFAULT_COOKIE_OPTIONS,
          expires: 30,
        })

        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || '註冊失敗，請稍後再試'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function googleLogin(googleToken: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.loginWithGoogle(googleToken)

      if (!response.success || !response.data) {
        const message = response.message || 'Google 登入失敗，請稍後再試'
        error.value = message
        throw new Error(message)
      }

      user.value = response.data.user
      token.value = response.data.token
      refreshTokenValue.value = response.data.refreshToken

      // Save to Cookie (7 days expiry)
      setCookie(COOKIE_NAMES.AUTH_TOKEN, response.data.token, {
        ...DEFAULT_COOKIE_OPTIONS,
        expires: 7,
      })
      setCookie(COOKIE_NAMES.REFRESH_TOKEN, response.data.refreshToken, {
        ...DEFAULT_COOKIE_OPTIONS,
        expires: 30,
      })

      return true
    } catch (err: any) {
      const message = err?.message || 'Google 登入失敗，請稍後再試'
      error.value = message
      throw typeof err === 'object' && err !== null ? err : new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await authApi.logout()
    } catch (err) {
      // Even if API call fails, still clear local state
      console.error('Logout API call failed:', err)
    } finally {
      // Clear state
      user.value = null
      token.value = null
      refreshTokenValue.value = null

      // Clear Cookies
      removeCookie(COOKIE_NAMES.AUTH_TOKEN, DEFAULT_COOKIE_OPTIONS)
      removeCookie(COOKIE_NAMES.REFRESH_TOKEN, DEFAULT_COOKIE_OPTIONS)

      isLoading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return

    // If already fetching, return the existing promise
    if (fetchProfilePromise) {
      return fetchProfilePromise
    }

    isLoading.value = true
    error.value = null

    fetchProfilePromise = (async () => {
      try {
        const userData = await authApi.getProfile()
        user.value = userData
        return true
      } catch (err: any) {
        error.value = err.message || '取得使用者資料失敗'
        // If unauthorized, clear auth state
        if (err.message?.includes('未認證') || err.message?.includes('401')) {
          await logout()
        }
        throw err
      } finally {
        isLoading.value = false
        fetchProfilePromise = null
      }
    })()

    return fetchProfilePromise
  }

  async function refreshAuthToken(): Promise<string | null> {
    try {
      const response = await authApi.refreshToken()

      if (response.success && response.data) {
        token.value = response.data.token
        refreshTokenValue.value = response.data.refreshToken

        // Update cookies
        setCookie(COOKIE_NAMES.AUTH_TOKEN, response.data.token, {
          ...DEFAULT_COOKIE_OPTIONS,
          expires: 7,
        })
        setCookie(COOKIE_NAMES.REFRESH_TOKEN, response.data.refreshToken, {
          ...DEFAULT_COOKIE_OPTIONS,
          expires: 30,
        })

        return response.data.token
      }

      return null
    } catch (err) {
      console.error('Token refresh failed:', err)
      return null
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    token,
    refreshToken: refreshTokenValue,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    login,
    register,
    googleLogin,
    logout,
    fetchProfile,
    refreshAuthToken,
    clearError,
  }
})
