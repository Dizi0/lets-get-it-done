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
      'h-full flex flex-col glass-panel border-r border-white/[0.06] transition-all duration-300 select-none z-20 flex-shrink-0',
      isCollapsed ? 'w-16' : 'w-72 md:w-80',
    ]"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
      <div v-if="!isCollapsed" class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <span class="font-bold text-base tracking-tight text-white">
          TaskFlow
        </span>
      </div>

      <button
        type="button"
        class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer mx-auto"
        :title="isCollapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'"
        @click="emit('toggleCollapse')"
      >
        <ChevronRight v-if="isCollapsed" class="w-5 h-5" />
        <ChevronLeft v-else class="w-5 h-5" />
      </button>
    </div>

    <!-- Create List Action -->
    <div class="p-3 border-b border-white/[0.05]">
      <button
        v-if="!isCreatingList"
        type="button"
        :class="[
          'w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-medium text-xs transition cursor-pointer',
          'bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 backdrop-blur-sm',
          isCollapsed ? 'justify-center' : '',
        ]"
        :title="isCollapsed ? 'Nouvelle liste' : ''"
        @click="isCreatingList = true"
      >
        <Plus class="w-4 h-4" />
        <span v-if="!isCollapsed">Nouvelle liste</span>
      </button>

      <!-- Create Form when Expanded -->
      <form
        v-else-if="!isCollapsed"
        class="space-y-2 p-2.5 bg-slate-950/70 rounded-xl border border-indigo-500/40 backdrop-blur-md"
        @submit.prevent="handleCreateList"
      >
        <input
          v-model="newListName"
          type="text"
          placeholder="Nom de la liste..."
          class="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-white placeholder-slate-500 focus:outline-none"
          autofocus
        />
        <div v-if="createError" class="text-xs text-rose-400 font-medium">
          {{ createError }}
        </div>
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-md transition"
            @click="isCreatingList = false; createError = '';"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="!newListName.trim() || isSubmitting"
            class="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
          >
            Créer
          </button>
        </div>
      </form>
    </div>

    <!-- Task Lists Scrollable Navigation -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <!-- Apple Shimmer Skeleton Loader -->
      <div v-if="listStore.isLoading" class="space-y-2 p-1">
        <div v-for="i in 4" :key="i" class="h-10 rounded-xl skeleton-shimmer flex items-center px-3 gap-2.5 border border-white/[0.04]">
          <div class="w-4 h-4 rounded-md bg-white/[0.08]"></div>
          <div v-if="!isCollapsed" class="h-3 w-32 rounded bg-white/[0.08]"></div>
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
          'group relative flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer',
          listStore.currentListId === list.id
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-950/60 font-semibold'
            : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
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
              'px-2 py-0.5 text-[10px] rounded-full font-bold backdrop-blur-sm',
              listStore.currentListId === list.id
                ? 'bg-indigo-950/60 text-indigo-100 border border-white/10'
                : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700/80',
            ]"
          >
            {{ list._count?.tasks || 0 }}
          </span>

          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 rounded-md transition cursor-pointer"
            title="Supprimer la liste"
            @click.stop="promptDeleteList(list)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- User Profile & Logout Footer -->
    <div class="p-3 border-t border-white/[0.06] bg-slate-950/40 backdrop-blur-md flex items-center justify-between gap-2 flex-shrink-0">
      <div v-if="!isCollapsed" class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0 shadow-inner">
          {{ authStore.user?.firstName?.charAt(0) }}{{ authStore.user?.lastName?.charAt(0) }}
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-white truncate">
            {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          </p>
          <p class="text-[10px] text-slate-400 truncate">
            {{ authStore.user?.email }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer mx-auto"
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
