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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        @click.self="onCancel"
      >
        <div
          class="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100"
        >
          <button
            class="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
            @click="onCancel"
          >
            <X class="w-5 h-5" />
          </button>

          <div class="flex items-start gap-4">
            <div
              :class="[
                'p-3 rounded-xl flex-shrink-0',
                danger
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
              ]"
            >
              <AlertTriangle class="w-6 h-6" />
            </div>

            <div class="flex-1 pr-4">
              <h3 class="text-lg font-bold tracking-tight text-white mb-1.5">
                {{ title }}
              </h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                {{ message }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition cursor-pointer"
              @click="onCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              :class="[
                'px-4 py-2 text-sm font-semibold rounded-xl transition cursor-pointer shadow-lg',
                danger
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30',
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
