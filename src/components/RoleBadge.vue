<script setup lang="ts">
import { computed } from 'vue'
import { usePermissionStore } from '@/stores/permission'
import type { Role } from '@/types/permission'

const props = defineProps<{
  role: Role
}>()

const permissionStore = usePermissionStore()

const fallbackColors: Record<Role, string> = {
  super_admin: '#6B21A8',
  admin: '#4338CA',
  manager: '#059669',
  no_permission: '#6B7280',
}

const roleConfig = computed(() => permissionStore.config.roles[props.role])

const colorHex = computed(() => roleConfig.value?.color ?? fallbackColors[props.role])

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const badgeStyle = computed(() => {
  const color = colorHex.value
  return {
    color,
    backgroundColor: hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.4),
  }
})

const label = computed(() => roleConfig.value?.displayName ?? props.role)
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border"
    :style="badgeStyle"
  >
    <span class="inline-block w-2 h-2 rounded-full bg-current"></span>
    <span>{{ label }}</span>
  </span>
</template>
