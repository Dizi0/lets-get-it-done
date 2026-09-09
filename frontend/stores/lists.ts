import { defineStore } from 'pinia';
import type { TaskList, CreateListPayload, UpdateListPayload } from '~/types/list';
import { useAuthStore } from './auth';

export const useListStore = defineStore('lists', () => {
  const lists = ref<TaskList[]>([]);
  const currentListId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const currentList = computed(() => {
    return lists.value.find((l) => l.id === currentListId.value) || null;
  });

  async function fetchLists() {
    const authStore = useAuthStore();
    const api = useApi();
    if (!authStore.accessToken) return;

    isLoading.value = true;
    error.value = null;
    try {
      const data = await api.fetch<TaskList[]>('/api/lists', {
        method: 'GET',
      });
      lists.value = data;

      // Select first list by default if none selected
      if (!currentListId.value && data.length > 0) {
        currentListId.value = data[0].id;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Erreur lors de la récupération des listes';
    } finally {
      isLoading.value = false;
    }
  }

  async function createList(payload: CreateListPayload) {
    const api = useApi();
    try {
      const newList = await api.fetch<TaskList>('/api/lists', {
        method: 'POST',
        body: payload,
      });
      lists.value.unshift({ ...newList, _count: { tasks: 0 } });
      currentListId.value = newList.id;
      return newList;
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Erreur lors de la création de la liste');
    }
  }

  async function updateList(id: string, payload: UpdateListPayload) {
    const api = useApi();
    try {
      const updated = await api.fetch<TaskList>(`/api/lists/${id}`, {
        method: 'PATCH',
        body: payload,
      });
      const index = lists.value.findIndex((l) => l.id === id);
      if (index !== -1) {
        lists.value[index] = { ...lists.value[index], ...updated };
      }
      return updated;
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Erreur lors de la mise à jour de la liste');
    }
  }

  async function deleteList(id: string) {
    const api = useApi();
    try {
      await api.fetch(`/api/lists/${id}`, {
        method: 'DELETE',
      });
      lists.value = lists.value.filter((l) => l.id !== id);
      if (currentListId.value === id) {
        currentListId.value = lists.value.length > 0 ? lists.value[0].id : null;
      }
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Erreur lors de la suppression de la liste');
    }
  }

  function selectList(id: string) {
    currentListId.value = id;
  }

  function updateTaskCount(listId: string, delta: number) {
    const list = lists.value.find((l) => l.id === listId);
    if (list && list._count) {
      list._count.tasks = Math.max(0, list._count.tasks + delta);
    }
  }

  return {
    lists,
    currentListId,
    currentList,
    isLoading,
    error,
    fetchLists,
    createList,
    updateList,
    deleteList,
    selectList,
    updateTaskCount,
  };
});
