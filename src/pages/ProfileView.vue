<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { User } from '@/services/api'
import { authApi } from '@/services/api'

const profile = ref<User | null>(null)
const isLoadingProfile = ref(true)
const profileError = ref<string | null>(null)

const isEditingProfile = ref(false)
const isSavingProfile = ref(false)

const profileForm = reactive({
  name: '',
  avatar: '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isChangingPassword = ref(false)
const isSavingPassword = ref(false)
const passwordError = ref<string | null>(null)

const email = computed(() => profile.value?.email ?? '')

const avatarPreview = computed(() => {
  if (profileForm.avatar.trim()) return profileForm.avatar
  if (profile.value?.avatar) {
    return profile.value.avatar
  }
  const fallbackName = profileForm.name || profile.value?.name || 'User'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=111827&color=fff`
})

const resetProfileForm = () => {
  profileForm.name = profile.value?.name || ''
  profileForm.avatar = profile.value?.avatar || ''
}

const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = null
}

const fetchProfile = async () => {
  isLoadingProfile.value = true
  profileError.value = null
  try {
    const data = await authApi.getProfile()
    profile.value = data
    resetProfileForm()
  } catch (error: any) {
    profileError.value = error.response?.data?.message || '無法取得個人資料'
  } finally {
    isLoadingProfile.value = false
  }
}

const handleStartEdit = () => {
  resetProfileForm()
  isEditingProfile.value = true
}

const handleCancelEdit = () => {
  isEditingProfile.value = false
  resetProfileForm()
}

const handleUpdateProfile = async () => {
  if (!profileForm.name.trim()) {
    profileError.value = '姓名為必填'
    return
  }
  isSavingProfile.value = true
  profileError.value = null
  try {
    await authApi.updateProfile({
      name: profileForm.name.trim(),
      avatar: profileForm.avatar.trim() || undefined,
    })
    await fetchProfile()
    isEditingProfile.value = false
    alert('個人資料已更新')
  } catch (error: any) {
    profileError.value = error.response?.data?.message || '更新個人資料失敗'
  } finally {
    isSavingProfile.value = false
  }
}

const handleStartChangePassword = () => {
  resetPasswordForm()
  isChangingPassword.value = true
}

const handleCancelPassword = () => {
  isChangingPassword.value = false
  resetPasswordForm()
}

const handleChangePassword = async () => {
  if (!passwordForm.currentPassword.trim()) {
    passwordError.value = '請輸入目前密碼'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    passwordError.value = '新密碼至少需要 6 個字元'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '新密碼與確認密碼不一致'
    return
  }

  isSavingPassword.value = true
  passwordError.value = null
  try {
    await authApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    })
    alert('密碼已更新')
    handleCancelPassword()
  } catch (error: any) {
    passwordError.value = error.response?.data?.message || '更新密碼失敗'
  } finally {
    isSavingPassword.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">個人資料</h1>
      <p class="text-gray-600">管理帳號資料與安全設定</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-person-circle text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">基本資訊</h2>
            <p class="text-sm text-gray-600">檢視與更新個人資料</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="profileError" class="text-sm text-red-600">{{ profileError }}</span>
          <button
            v-if="!isEditingProfile"
            type="button"
            @click="handleStartEdit"
            :disabled="isLoadingProfile"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            編輯資料
          </button>
        </div>
      </div>

      <div v-if="isLoadingProfile" class="py-10 text-center text-sm text-gray-600">
        載入中...
      </div>

      <template v-else>
        <form v-if="isEditingProfile" @submit.prevent="handleUpdateProfile" class="mt-6 space-y-5">
          <div class="flex items-start gap-4">
            <img :src="avatarPreview" alt="avatar" class="w-20 h-20 rounded-lg border border-gray-200" />
            <div class="flex-1 space-y-3">
              <div>
                <label for="avatar" class="block text-sm font-medium text-gray-700 mb-2">頭像 URL</label>
                <input
                  id="avatar"
                  v-model="profileForm.avatar"
                  type="url"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">姓名</label>
              <input
                id="name"
                v-model="profileForm.name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                placeholder="輸入您的姓名"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
              <input
                type="email"
                :value="email"
                disabled
                class="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600"
              />
              <p class="text-xs text-gray-500 mt-1">電子郵件僅供顯示，無法修改</p>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center pt-2">
            <button
              type="button"
              @click="handleCancelEdit"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSavingProfile"
              class="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isSavingProfile ? '儲存中...' : '儲存變更' }}
            </button>
          </div>
        </form>

        <div v-else class="mt-6 flex flex-col gap-4">
          <div class="flex items-start gap-4">
            <img :src="avatarPreview" alt="avatar" class="w-20 h-20 rounded-lg border border-gray-200" />
            <div>
              <p class="text-lg font-semibold text-gray-900">{{ profile?.name || '—' }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ email || '—' }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
              <p class="text-xs text-gray-500">帳號類型</p>
              <p class="text-sm font-semibold text-gray-900 mt-1">一般使用者</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
              <p class="text-xs text-gray-500">註冊日期</p>
              <p class="text-sm font-semibold text-gray-900 mt-1">
                {{ profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-TW') : '—' }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
            <i class="bi bi-shield-lock text-gray-600 text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">變更密碼</h2>
            <p class="text-sm text-gray-600">建議定期更新密碼以保護帳號</p>
          </div>
        </div>
        <button
          v-if="!isChangingPassword"
          type="button"
          @click="handleStartChangePassword"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          變更密碼
        </button>
      </div>

      <form v-if="isChangingPassword" @submit.prevent="handleChangePassword" class="mt-6 space-y-4 max-w-xl">
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">目前密碼</label>
          <input
            id="currentPassword"
            v-model="passwordForm.currentPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            placeholder="輸入目前密碼"
          />
        </div>
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">新密碼</label>
          <input
            id="newPassword"
            v-model="passwordForm.newPassword"
            type="password"
            minlength="6"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            placeholder="至少 6 個字元"
          />
        </div>
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">確認新密碼</label>
          <input
            id="confirmPassword"
            v-model="passwordForm.confirmPassword"
            type="password"
            minlength="6"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            placeholder="再次輸入新密碼"
          />
        </div>
        <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center pt-2">
          <button
            type="button"
            @click="handleCancelPassword"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSavingPassword"
            class="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {{ isSavingPassword ? '更新中...' : '更新密碼' }}
          </button>
        </div>
      </form>

      <div v-else class="mt-6 text-sm text-gray-600">保持強度高且獨特的密碼，保障您的帳號安全。</div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
          <i class="bi bi-exclamation-triangle text-gray-600 text-lg"></i>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900">帳號刪除</h2>
          <p class="text-sm text-gray-600">目前尚未開放刪除帳號功能</p>
        </div>
      </div>
      <p class="text-sm text-gray-500 mb-4">
        若需要協助，請聯繫客服或管理員。我們將儘速協助處理相關需求。
      </p>
      <button
        type="button"
        disabled
        class="px-4 py-2 border border-gray-300 text-gray-500 rounded-md bg-gray-100 cursor-not-allowed"
      >
        刪除帳號 (尚未開放)
      </button>
    </div>
  </div>
</template>
