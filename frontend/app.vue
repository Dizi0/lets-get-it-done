<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

if (import.meta.client) {
  authStore.initializeFromStorage();
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
    <NuxtLoadingIndicator color="#6366f1" :height="3" />
    <NuxtPage />
  </div>
</template>

