import { defineStore } from 'pinia';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '~/types/task';
import { useAuthStore } from './auth';
import { useListStore } from './lists';

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);
  const selectedTaskId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const activeTasks = computed(() => {
    return tasks.value.filter((t) => !t.isCompleted);
  });

  const completedTasks = computed(() => {
    return tasks.value.filter((t) => t.isCompleted);
  });

  const selectedTask = computed(() => {
    return tasks.value.find((t) => t.id === selectedTaskId.value) || null;
  });

  async function fetchTasks(listId: string) {
    if (!listId) {
      tasks.value = [];
      return;
    }
    const authStore = useAuthStore();
    const config = useRuntimeConfig();

    isLoading.value = true;
    error.value = null;
    try {
      const data = await $fetch<Task[]>(
        `${config.public.apiUrl}/api/lists/${listId}/tasks`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${authStore.accessToken}` },
          credentials: 'include',
        },
      );
      tasks.value = data;
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur lors du chargement des tâches';
    } finally {
      isLoading.value = false;
    }
  }

  async function createTask(listId: string, payload: CreateTaskPayload) {
    const authStore = useAuthStore();
    const listStore = useListStore();
    const config = useRuntimeConfig();

    try {
      const newTask = await $fetch<Task>(
        `${config.public.apiUrl}/api/lists/${listId}/tasks`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${authStore.accessToken}` },
          body: payload,
          credentials: 'include',
        },
      );
      // Local optimistic / immediate update
      onTaskCreated(newTask);
      listStore.updateTaskCount(listId, 1);
      return newTask;
    } catch (err: any) {
      throw new Error(err.data?.message || 'Erreur lors de la création de la tâche');
    }
  }

  async function updateTask(taskId: string, payload: UpdateTaskPayload) {
    const authStore = useAuthStore();
    const config = useRuntimeConfig();

    try {
      const updated = await $fetch<Task>(
        `${config.public.apiUrl}/api/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${authStore.accessToken}` },
          body: payload,
          credentials: 'include',
        },
      );
      onTaskUpdated(updated);
      return updated;
    } catch (err: any) {
      throw new Error(err.data?.message || 'Erreur lors de la mise à jour de la tâche');
    }
  }

  async function toggleTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    return updateTask(taskId, { isCompleted: !task.isCompleted });
  }

  async function deleteTask(taskId: string) {
    const authStore = useAuthStore();
    const listStore = useListStore();
    const config = useRuntimeConfig();

    const task = tasks.value.find((t) => t.id === taskId);
    const listId = task?.listId;

    try {
      await $fetch(`${config.public.apiUrl}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
        credentials: 'include',
      });
      onTaskDeleted(taskId, listId);
      if (listId) {
        listStore.updateTaskCount(listId, -1);
      }
    } catch (err: any) {
      throw new Error(err.data?.message || 'Erreur lors de la suppression de la tâche');
    }
  }

  function selectTask(taskOrId: Task | string | null) {
    if (!taskOrId) {
      selectedTaskId.value = null;
    } else if (typeof taskOrId === 'string') {
      selectedTaskId.value = taskOrId;
    } else {
      selectedTaskId.value = taskOrId.id;
    }
  }

  // --- Real-time WebSocket event mutations (without HTTP re-fetch) ---

  function onTaskCreated(task: Task) {
    const listStore = useListStore();
    if (task.listId === listStore.currentListId) {
      const exists = tasks.value.some((t) => t.id === task.id);
      if (!exists) {
        tasks.value.unshift(task);
      }
    }
  }

  function onTaskUpdated(task: Task) {
    const index = tasks.value.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...task };
    }
  }

  function onTaskDeleted(taskId: string, listId?: string) {
    tasks.value = tasks.value.filter((t) => t.id !== taskId);
    if (selectedTaskId.value === taskId) {
      selectedTaskId.value = null;
    }
  }

  return {
    tasks,
    selectedTaskId,
    selectedTask,
    isLoading,
    error,
    activeTasks,
    completedTasks,
    fetchTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    selectTask,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
  };
});
