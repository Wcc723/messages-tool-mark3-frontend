<script setup lang="ts">
import { ref } from 'vue'

const profileForm = ref({
  name: '測試使用者',
  email: 'user@example.com',
  avatar: 'https://ui-avatars.com/api/?name=Test+User&background=4F46E5&color=fff',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isEditingProfile = ref(false)
const isChangingPassword = ref(false)

const handleUpdateProfile = () => {
  // Mock update profile - no API call
  alert('個人資料已更新！')
  isEditingProfile.value = false
}

const handleChangePassword = () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('新密碼與確認密碼不符！')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    alert('新密碼至少需要 6 個字元！')
    return
  }

  // Mock change password - no API call
  alert('密碼已更新！')
  isChangingPassword.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

const handleCancelEdit = () => {
  isEditingProfile.value = false
  // Reset to original values
  profileForm.value = {
    name: '測試使用者',
    email: 'user@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Test+User&background=4F46E5&color=fff',
  }
}

const handleCancelPassword = () => {
  isChangingPassword.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">個人資料</h1>
      <p class="text-gray-600">管理您的帳號資訊</p>
    </div>

    <!-- Profile Card -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-800">基本資料</h2>
        <button
          v-if="!isEditingProfile"
          @click="isEditingProfile = true"
          class="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition font-medium"
        >
          編輯
        </button>
      </div>

      <form v-if="isEditingProfile" @submit.prevent="handleUpdateProfile" class="space-y-4">
        <div class="flex items-center gap-6 mb-6">
          <img
            :src="profileForm.avatar"
            alt="User Avatar"
            class="w-24 h-24 rounded-full"
          >
          <div class="flex-1">
            <label for="avatar" class="block text-sm font-medium text-gray-700 mb-2">
              頭像 URL
            </label>
            <input
              id="avatar"
              v-model="profileForm.avatar"
              type="url"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="https://example.com/avatar.jpg"
            >
          </div>
        </div>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            姓名 <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            v-model="profileForm.name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="輸入您的姓名"
          >
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            電子郵件
          </label>
          <input
            id="email"
            v-model="profileForm.email"
            type="email"
            disabled
            class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          >
          <p class="text-xs text-gray-500 mt-1">電子郵件無法修改</p>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="button"
            @click="handleCancelEdit"
            class="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            儲存變更
          </button>
        </div>
      </form>

      <div v-else>
        <div class="flex items-center gap-6 mb-6">
          <img
            :src="profileForm.avatar"
            alt="User Avatar"
            class="w-24 h-24 rounded-full"
          >
          <div>
            <h3 class="text-2xl font-semibold text-gray-800">{{ profileForm.name }}</h3>
            <p class="text-gray-600">{{ profileForm.email }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
          <div>
            <p class="text-sm text-gray-500 mb-1">帳號類型</p>
            <p class="text-gray-800 font-medium">一般使用者</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">註冊日期</p>
            <p class="text-gray-800 font-medium">2024-01-15</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Card -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-800">變更密碼</h2>
          <p class="text-sm text-gray-600 mt-1">定期更新密碼以保護帳號安全</p>
        </div>
        <button
          v-if="!isChangingPassword"
          @click="isChangingPassword = true"
          class="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition font-medium"
        >
          變更密碼
        </button>
      </div>

      <form v-if="isChangingPassword" @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
            目前密碼 <span class="text-red-500">*</span>
          </label>
          <input
            id="currentPassword"
            v-model="passwordForm.currentPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="輸入目前密碼"
          >
        </div>

        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
            新密碼 <span class="text-red-500">*</span>
          </label>
          <input
            id="newPassword"
            v-model="passwordForm.newPassword"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="至少 6 字元"
          >
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            確認新密碼 <span class="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            v-model="passwordForm.confirmPassword"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="再次輸入新密碼"
          >
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="button"
            @click="handleCancelPassword"
            class="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            更新密碼
          </button>
        </div>
      </form>

      <div v-else class="text-center py-8 text-gray-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p>點擊上方按鈕開始變更密碼</p>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
      <h2 class="text-xl font-semibold text-red-800 mb-2">危險區域</h2>
      <p class="text-sm text-red-600 mb-4">以下操作將無法復原，請謹慎操作</p>
      <button
        class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        @click="alert('刪除帳號功能尚未實作')"
      >
        刪除帳號
      </button>
    </div>
  </div>
</template>
