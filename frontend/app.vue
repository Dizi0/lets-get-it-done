<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

if (import.meta.client) {
  authStore.initializeFromStorage();
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
    <NuxtLoadingIndicator color="#2563eb" :height="3" />
    <NuxtPage />
  </div>
</template>

