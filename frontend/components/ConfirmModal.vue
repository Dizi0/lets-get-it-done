<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    danger: true,
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'update:isOpen', value: boolean): void;
}>();

function onConfirm() {
  emit('confirm');
}

function onCancel() {
  emit('cancel');
  emit('update:isOpen', false);
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md"
        @click.self="onCancel"
      >
        <div
          class="relative w-full max-w-md p-6 apple-glass-panel rounded-3xl text-slate-800"
        >
          <button
            class="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition"
            @click="onCancel"
          >
            <X class="w-5 h-5" />
          </button>

          <div class="flex items-start gap-4">
            <div
              :class="[
                'p-3 rounded-2xl flex-shrink-0 backdrop-blur-md',
                danger
                  ? 'bg-rose-50/90 text-rose-600 border border-rose-200/80'
                  : 'bg-blue-50/90 text-blue-600 border border-blue-200/80',
              ]"
            >
              <AlertTriangle class="w-6 h-6" />
            </div>

            <div class="flex-1 pr-4">
              <h3 class="text-base font-semibold tracking-tight text-slate-900 mb-1">
                {{ title }}
              </h3>
              <p class="text-sm text-slate-600 leading-relaxed">
                {{ message }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200/80 rounded-xl transition cursor-pointer shadow-2xs"
              @click="onCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-xl transition cursor-pointer shadow-sm shadow-blue-500/20',
                danger
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white',
              ]"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
