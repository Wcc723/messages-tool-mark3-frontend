<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const typeStyles = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: 'bi-check-circle-fill',
    iconColor: 'text-emerald-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'bi-x-circle-fill',
    iconColor: 'text-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'bi-exclamation-triangle-fill',
    iconColor: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'bi-info-circle-fill',
    iconColor: 'text-blue-500',
  },
}

function getStyles(type: keyof typeof typeStyles) {
  return typeStyles[type] || typeStyles.info
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-lg border p-4 shadow-lg flex items-start gap-3"
          :class="[getStyles(toast.type).bg, getStyles(toast.type).border]"
        >
          <i
            class="bi text-lg flex-shrink-0"
            :class="[getStyles(toast.type).icon, getStyles(toast.type).iconColor]"
          ></i>
          <p class="text-sm flex-1" :class="getStyles(toast.type).text">
            {{ toast.message }}
          </p>
          <button
            type="button"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            @click="remove(toast.id)"
          >
            <i class="bi bi-x text-lg"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
