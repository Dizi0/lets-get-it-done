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
    const api = useApi();
    if (!authStore.accessToken) return;

    isLoading.value = true;
    error.value = null;
    try {
      const data = await api.fetch<Task[]>(
        `/api/lists/${listId}/tasks`,
        {
          method: 'GET',
        },
      );
      tasks.value = data;
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Erreur lors du chargement des tâches';
    } finally {
      isLoading.value = false;
    }
  }

  async function createTask(listId: string, payload: CreateTaskPayload) {
    const listStore = useListStore();
    const api = useApi();

    try {
      const newTask = await api.fetch<Task>(
        `/api/lists/${listId}/tasks`,
        {
          method: 'POST',
          body: payload,
        },
      );
      // Local optimistic / immediate update
      onTaskCreated(newTask);
      listStore.updateTaskCount(listId, 1);
      return newTask;
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Erreur lors de la création de la tâche');
    }
  }

  async function updateTask(taskId: string, payload: UpdateTaskPayload) {
    const api = useApi();

    try {
      const updated = await api.fetch<Task>(
        `/api/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: payload,
        },
      );
      onTaskUpdated(updated);
      return updated;
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Erreur lors de la mise à jour de la tâche');
    }
  }

  async function toggleTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    return updateTask(taskId, { isCompleted: !task.isCompleted });
  }

  async function deleteTask(taskId: string) {
    const listStore = useListStore();
    const api = useApi();

    const task = tasks.value.find((t) => t.id === taskId);
    const listId = task?.listId;

    try {
      await api.fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      onTaskDeleted(taskId, listId);
      if (listId) {
        listStore.updateTaskCount(listId, -1);
      }
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Erreur lors de la suppression de la tâche');
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
