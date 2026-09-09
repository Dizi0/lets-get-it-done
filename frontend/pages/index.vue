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
  <div class="relative h-screen w-screen flex overflow-hidden bg-[#07090e] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
    <!-- Ambient Apple Light Glows -->
    <div class="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
    <div class="pointer-events-none absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>
    <div class="pointer-events-none absolute -bottom-40 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>

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
