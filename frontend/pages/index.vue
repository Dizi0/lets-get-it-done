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
  <div class="h-screen w-screen flex overflow-hidden bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
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
