<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useListStore } from '~/stores/lists';
import { useTaskStore } from '~/stores/tasks';
import { useSocket } from '~/composables/useSocket';
import LeftSidebar from '~/components/LeftSidebar.vue';
import MainContent from '~/components/MainContent.vue';
import RightSidebar from '~/components/RightSidebar.vue';

const authStore = useAuthStore();
const listStore = useListStore();
const taskStore = useTaskStore();
const socket = useSocket();

const isLeftSidebarCollapsed = ref(false);

onMounted(async () => {
  await listStore.fetchLists();
  socket.connect();
});

onUnmounted(() => {
  socket.disconnect();
});

// Watch current list changes to load tasks and subscribe to real-time room
watch(
  () => listStore.currentListId,
  async (newListId, oldListId) => {
    if (oldListId) {
      socket.leaveRoom(oldListId);
    }
    if (newListId) {
      await taskStore.fetchTasks(newListId);
      socket.joinRoom(newListId);
    } else {
      taskStore.tasks = [];
      taskStore.selectTask(null);
    }
  },
  { immediate: true }
);

function toggleLeftSidebar() {
  isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value;
}
</script>

<template>
  <div class="relative h-screen w-screen flex overflow-hidden bg-gradient-to-br from-slate-100 via-[#f1f5f9] to-slate-100 text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
    <!-- Ambient Apple Light Mesh for Translucent Glass Depth -->
    <div class="pointer-events-none absolute -top-32 -left-32 w-[550px] h-[550px] bg-sky-200/40 rounded-full blur-[120px]"></div>
    <div class="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-100/40 rounded-full blur-[140px]"></div>
    <div class="pointer-events-none absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-amber-100/35 rounded-full blur-[130px]"></div>
    <div class="pointer-events-none absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-100/30 rounded-full blur-[110px]"></div>

    <!-- 1. Left Sidebar (Collapsible) -->
    <LeftSidebar
      :is-collapsed="isLeftSidebarCollapsed"
      @toggle-collapse="toggleLeftSidebar"
    />

    <!-- 2. Main Content -->
    <MainContent
      :is-left-sidebar-collapsed="isLeftSidebarCollapsed"
      @toggle-left-sidebar="toggleLeftSidebar"
    />

    <!-- 3. Right Sidebar (Task Details - only when a task is selected) -->
    <RightSidebar
      :task="taskStore.selectedTask"
      @close="taskStore.selectTask(null)"
    />
  </div>
</template>
