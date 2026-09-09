<script setup lang="ts">
import {
  ListTodo,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FolderPlus,
  CheckCircle2,
} from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useListStore } from '~/stores/lists';

const props = defineProps<{
  isCollapsed: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleCollapse'): void;
}>();

const authStore = useAuthStore();
const listStore = useListStore();

const isCreatingList = ref(false);
const newListName = ref('');
const createError = ref('');
const isSubmitting = ref(false);

const listToDelete = ref<{ id: string; title: string } | null>(null);
const isDeleteModalOpen = ref(false);

async function handleCreateList() {
  if (!newListName.value.trim()) return;
  createError.value = '';
  isSubmitting.value = true;
  try {
    await listStore.createList({ title: newListName.value.trim() });
    newListName.value = '';
    isCreatingList.value = false;
  } catch (err: any) {
    createError.value = err.message || 'Erreur lors de la création';
  } finally {
    isSubmitting.value = false;
  }
}

function promptDeleteList(list: { id: string; title: string }) {
  listToDelete.value = list;
  isDeleteModalOpen.value = true;
}

async function confirmDeleteList() {
  if (!listToDelete.value) return;
  try {
    await listStore.deleteList(listToDelete.value.id);
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la suppression');
  } finally {
    isDeleteModalOpen.value = false;
    listToDelete.value = null;
  }
}
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col apple-glass-sidebar transition-all duration-300 select-none z-20 flex-shrink-0',
      isCollapsed ? 'w-16' : 'w-72 md:w-80',
    ]"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-slate-200/60 flex-shrink-0">
      <div v-if="!isCollapsed" class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <span class="font-bold text-base tracking-tight text-slate-900">
          TaskFlow
        </span>
      </div>

      <button
        type="button"
        class="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/60 transition cursor-pointer mx-auto"
        :title="isCollapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'"
        @click="emit('toggleCollapse')"
      >
        <ChevronRight v-if="isCollapsed" class="w-5 h-5" />
        <ChevronLeft v-else class="w-5 h-5" />
      </button>
    </div>

    <!-- Create List Action -->
    <div class="p-3 border-b border-slate-200/50">
      <button
        v-if="!isCreatingList"
        type="button"
        :class="[
          'w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-medium text-xs transition cursor-pointer',
          'bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80 hover:border-slate-300 shadow-sm backdrop-blur-md',
          isCollapsed ? 'justify-center' : '',
        ]"
        :title="isCollapsed ? 'Nouvelle liste' : ''"
        @click="isCreatingList = true"
      >
        <Plus class="w-4 h-4 text-blue-600" />
        <span v-if="!isCollapsed">Nouvelle liste</span>
      </button>

      <!-- Create Form when Expanded -->
      <form
        v-else-if="!isCollapsed"
        class="space-y-2 p-2.5 bg-white/90 rounded-xl border border-slate-200 shadow-sm backdrop-blur-md"
        @submit.prevent="handleCreateList"
      >
        <input
          v-model="newListName"
          type="text"
          placeholder="Nom de la liste..."
          class="w-full px-3 py-1.5 text-xs apple-glass-input rounded-lg placeholder-slate-400 focus:outline-none"
          autofocus
        />
        <div v-if="createError" class="text-xs text-rose-600 font-medium">
          {{ createError }}
        </div>
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 rounded-md transition"
            @click="isCreatingList = false; createError = '';"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="!newListName.trim() || isSubmitting"
            class="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
          >
            Créer
          </button>
        </div>
      </form>
    </div>

    <!-- Task Lists Scrollable Navigation -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <!-- Light Shimmer Skeleton Loader -->
      <div v-if="listStore.isLoading" class="space-y-2 p-1">
        <div v-for="i in 4" :key="i" class="h-10 rounded-xl skeleton-shimmer flex items-center px-3 gap-2.5 border border-white/60">
          <div class="w-4 h-4 rounded-md bg-slate-300/60"></div>
          <div v-if="!isCollapsed" class="h-3 w-32 rounded bg-slate-300/60"></div>
        </div>
      </div>

      <div
        v-else-if="listStore.lists.length === 0 && !isCollapsed"
        class="p-4 text-center text-xs text-slate-500"
      >
        Aucune liste. Créez-en une pour démarrer !
      </div>

      <div
        v-for="list in listStore.lists"
        :key="list.id"
        :class="[
          'group relative flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer',
          listStore.currentListId === list.id
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
            : 'text-slate-700 hover:bg-white/70 hover:text-slate-900',
          isCollapsed ? 'justify-center' : '',
        ]"
        :title="isCollapsed ? list.title : ''"
        @click="listStore.selectList(list.id)"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <FolderPlus class="w-4 h-4 flex-shrink-0" />
          <span v-if="!isCollapsed" class="truncate">
            {{ list.title }}
          </span>
        </div>

        <!-- Task Count Badge & Delete Action -->
        <div v-if="!isCollapsed" class="flex items-center gap-1.5 flex-shrink-0">
          <span
            :class="[
              'px-2 py-0.5 text-[10px] rounded-full font-bold',
              listStore.currentListId === list.id
                ? 'bg-blue-800/50 text-blue-100'
                : 'bg-slate-200/70 text-slate-600 group-hover:bg-slate-200',
            ]"
          >
            {{ list._count?.tasks || 0 }}
          </span>

          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100/80 hover:text-rose-600 text-slate-400 rounded-md transition cursor-pointer"
            title="Supprimer la liste"
            @click.stop="promptDeleteList(list)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- User Profile & Logout Footer -->
    <div class="p-3 border-t border-slate-200/50 bg-slate-50/50 backdrop-blur-md flex items-center justify-between gap-2 flex-shrink-0">
      <div v-if="!isCollapsed" class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-full bg-blue-100 border border-blue-200/60 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
          {{ authStore.user?.firstName?.charAt(0) }}{{ authStore.user?.lastName?.charAt(0) }}
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-900 truncate">
            {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          </p>
          <p class="text-[10px] text-slate-500 truncate">
            {{ authStore.user?.email }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer mx-auto"
        title="Se déconnecter"
        @click="authStore.logout()"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>

    <!-- Confirmation Modal for List Deletion -->
    <ConfirmModal
      v-model:is-open="isDeleteModalOpen"
      title="Supprimer cette liste ?"
      :message="`Êtes-vous sûr de vouloir supprimer la liste « ${listToDelete?.title} » ? Toutes les tâches associées seront également supprimées définitivement.`"
      confirm-text="Supprimer la liste"
      :danger="true"
      @confirm="confirmDeleteList"
    />
  </aside>
</template>
