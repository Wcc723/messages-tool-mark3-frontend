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
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">個人資料</h1>
      <p class="text-gray-600">管理您的帳號資訊</p>
    </div>

    <!-- Profile Card -->
    <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 mb-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <i class="bi bi-person-circle text-indigo-600 text-2xl"></i>
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900">基本資料</h2>
          <p class="text-sm text-gray-600">您的個人資訊和頭像</p>
        </div>
        <button
          v-if="!isEditingProfile"
          @click="isEditingProfile = true"
          class="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-semibold cursor-pointer flex items-center gap-2 border-2 border-transparent hover:border-indigo-200"
        >
          <i class="bi bi-pencil-square text-lg"></i>
          編輯
        </button>
      </div>

      <form v-if="isEditingProfile" @submit.prevent="handleUpdateProfile" class="space-y-6">
        <div class="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
          <img
            :src="profileForm.avatar"
            alt="User Avatar"
            class="w-24 h-24 rounded-2xl shadow-lg ring-4 ring-white"
          >
          <div class="flex-1">
            <label for="avatar" class="block text-sm font-semibold text-gray-700 mb-2">
              頭像 URL
            </label>
            <input
              id="avatar"
              v-model="profileForm.avatar"
              type="url"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="https://example.com/avatar.jpg"
            >
          </div>
        </div>

        <div>
          <label for="name" class="block text-sm font-semibold text-gray-700 mb-3">
            姓名 <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            v-model="profileForm.name"
            type="text"
            required
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-lg"
            placeholder="輸入您的姓名"
          >
        </div>

        <div>
          <label for="email" class="block text-sm font-semibold text-gray-700 mb-3">
            電子郵件
          </label>
          <input
            id="email"
            v-model="profileForm.email"
            type="email"
            disabled
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
          >
          <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <i class="bi bi-info-circle"></i>
            電子郵件無法修改
          </p>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="button"
            @click="handleCancelEdit"
            class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold cursor-pointer"
          >
            <i class="bi bi-x-circle mr-2"></i>
            取消
          </button>
          <button
            type="submit"
            class="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold cursor-pointer shadow-lg hover:shadow-xl"
          >
            <i class="bi bi-check-circle-fill mr-2"></i>
            儲存變更
          </button>
        </div>
      </form>

      <div v-else>
        <div class="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 mb-6">
          <img
            :src="profileForm.avatar"
            alt="User Avatar"
            class="w-24 h-24 rounded-2xl shadow-lg ring-4 ring-white"
          >
          <div>
            <h3 class="text-2xl font-bold text-gray-900 mb-1">{{ profileForm.name }}</h3>
            <p class="text-gray-600 flex items-center gap-2">
              <i class="bi bi-envelope"></i>
              {{ profileForm.email }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <i class="bi bi-person-badge text-white text-lg"></i>
              </div>
              <p class="text-sm font-semibold text-gray-600">帳號類型</p>
            </div>
            <p class="text-gray-900 font-bold text-lg ml-13">一般使用者</p>
          </div>
          <div class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <i class="bi bi-calendar-check text-white text-lg"></i>
              </div>
              <p class="text-sm font-semibold text-gray-600">註冊日期</p>
            </div>
            <p class="text-gray-900 font-bold text-lg ml-13">2024-01-15</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Card -->
    <div class="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 mb-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <i class="bi bi-shield-lock text-purple-600 text-2xl"></i>
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900">變更密碼</h2>
          <p class="text-sm text-gray-600">定期更新密碼以保護帳號安全</p>
        </div>
        <button
          v-if="!isChangingPassword"
          @click="isChangingPassword = true"
          class="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all font-semibold cursor-pointer flex items-center gap-2 border-2 border-transparent hover:border-purple-200"
        >
          <i class="bi bi-lock text-lg"></i>
          變更密碼
        </button>
      </div>

      <form v-if="isChangingPassword" @submit.prevent="handleChangePassword" class="space-y-6">
        <div>
          <label for="currentPassword" class="block text-sm font-semibold text-gray-700 mb-3">
            目前密碼 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <i class="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              required
              class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              placeholder="輸入目前密碼"
            >
          </div>
        </div>

        <div>
          <label for="newPassword" class="block text-sm font-semibold text-gray-700 mb-3">
            新密碼 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <i class="bi bi-shield-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              required
              minlength="6"
              class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              placeholder="至少 6 字元"
            >
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 mb-3">
            確認新密碼 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <i class="bi bi-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              minlength="6"
              class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              placeholder="再次輸入新密碼"
            >
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="button"
            @click="handleCancelPassword"
            class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold cursor-pointer"
          >
            <i class="bi bi-x-circle mr-2"></i>
            取消
          </button>
          <button
            type="submit"
            class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold cursor-pointer shadow-lg hover:shadow-xl"
          >
            <i class="bi bi-check-circle-fill mr-2"></i>
            更新密碼
          </button>
        </div>
      </form>

      <div v-else class="text-center py-12">
        <div class="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i class="bi bi-lock text-5xl text-purple-500"></i>
        </div>
        <p class="text-gray-600 font-medium mb-2">密碼安全保護中</p>
        <p class="text-gray-500 text-sm">點擊上方按鈕開始變更密碼</p>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
          <i class="bi bi-exclamation-triangle-fill text-white text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-red-900">危險區域</h2>
          <p class="text-sm text-red-700">以下操作將無法復原，請謹慎操作</p>
        </div>
      </div>
      <button
        class="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl"
        @click="alert('刪除帳號功能尚未實作')"
      >
        <i class="bi bi-trash-fill"></i>
        刪除帳號
      </button>
    </div>
  </div>
</template>
