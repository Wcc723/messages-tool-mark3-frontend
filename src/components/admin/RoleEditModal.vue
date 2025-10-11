<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { adminApi } from '@/services/api'
import { usePermissionStore } from '@/stores/permission'
import RoleBadge from '@/components/RoleBadge.vue'
import type { AdminUser } from '@/services/api'
import type { Role } from '@/types/permission'

const props = defineProps<{
  user: AdminUser
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'saved', payload: { role: Role }): void
}>()

const permissionStore = usePermissionStore()

const selectedRole = ref<Role>(props.user.role)
const isSaving = ref(false)
const error = ref<string | null>(null)

watch(
  () => props.user,
  (user) => {
    selectedRole.value = user.role
    error.value = null
  },
  { immediate: true }
)

const showWarning = computed(() => selectedRole.value !== props.user.role)

const roleOptions = computed(() =>
  Object.entries(permissionStore.config.roles).map(([role, config]) => ({
    value: role as Role,
    label: config.displayName,
    description: config.description,
  }))
)

const selectedRoleConfig = computed(() => permissionStore.config.roles[selectedRole.value])

const actionLabels: Record<string, string> = {
  canView: '查看',
  canViewAll: '查看所有',
  canCreate: '建立',
  canEdit: '編輯',
  canEditAll: '編輯所有',
  canDelete: '刪除',
  canDeleteAll: '刪除所有',
  canManageRoles: '管理角色',
  canSendMessage: '發送訊息',
  canManageBot: '管理 Bot',
  canUpload: '上傳',
  canViewLogs: '查看日誌',
  canViewDashboard: '查看儀表板',
  canManageSettings: '管理設定',
}

const featureList = computed(() => {
  if (!selectedRoleConfig.value) return []

  return Object.entries(selectedRoleConfig.value.features).map(([featureKey, actions]) => ({
    key: featureKey,
    label: permissionStore.config.featureDescriptions[featureKey] ?? featureKey,
    actions: Object.entries(actions as Record<string, boolean>).map(([actionKey, allowed]) => ({
      key: actionKey,
      label: actionLabels[actionKey] ?? actionKey,
      allowed,
    })),
  }))
})

async function handleSave() {
  if (isSaving.value) return

  if (selectedRole.value === props.user.role) {
    emit('close')
    return
  }

  try {
    isSaving.value = true
    error.value = null

    await adminApi.updateUserRole(props.user.id, selectedRole.value)

    emit('saved', { role: selectedRole.value })
    emit('close')
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      '更新角色失敗，請稍後再試'
    error.value = message
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full" role="dialog" aria-modal="true">
      <header class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-800">編輯使用者角色</h2>
          <p class="text-sm text-gray-500 mt-1">調整使用者的角色與權限設定</p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 transition cursor-pointer"
          aria-label="Close"
          @click="emit('close')"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </header>

      <section class="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <p class="text-sm text-gray-500">使用者</p>
            <p class="text-lg font-semibold text-gray-800">{{ user.name }}</p>
            <p class="text-sm text-gray-500">{{ user.email }}</p>
          </div>
          <RoleBadge :role="user.role" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">選擇角色</label>
          <select
            v-model="selectedRole"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="option in roleOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-2">
            {{ roleOptions.find((opt) => opt.value === selectedRole)?.description }}
          </p>
        </div>

        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 class="font-medium text-gray-700 mb-3">權限預覽</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div
              v-for="feature in featureList"
              :key="feature.key"
              class="bg-white border border-gray-200 rounded-md p-3 space-y-2"
            >
              <h4 class="text-sm font-semibold text-gray-700">{{ feature.label }}</h4>
              <ul class="space-y-1">
                <li
                  v-for="action in feature.actions"
                  :key="action.key"
                  class="text-sm flex items-center gap-2"
                >
                  <i
                    :class="[
                      action.allowed ? 'bi-check-circle text-emerald-500' : 'bi-x-circle text-gray-300',
                      'text-base',
                    ]"
                  ></i>
                  <span :class="action.allowed ? 'text-gray-700' : 'text-gray-400'">
                    {{ action.label }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          v-if="showWarning"
          class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800"
        >
          ⚠️ 變更角色將立即生效，該使用者的權限會同步更新。
        </div>

        <div
          v-if="error"
          class="bg-red-50 border border-red-200 text-sm text-red-600 rounded-lg p-3"
        >
          {{ error }}
        </div>
      </section>

      <footer class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isSaving"
          @click="handleSave"
        >
          <span v-if="isSaving" class="inline-flex items-center gap-2">
            <i class="bi bi-arrow-repeat animate-spin"></i>
            儲存中…
          </span>
          <span v-else>確認變更</span>
        </button>
      </footer>
    </div>
  </div>
</template>
