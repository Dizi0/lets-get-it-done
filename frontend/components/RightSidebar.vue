<script setup lang="ts">
import {
  X,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  FileText,
  Tag,
} from 'lucide-vue-next';
import { useTaskStore } from '~/stores/tasks';
import type { Task } from '~/types/task';

const props = defineProps<{
  task: Task | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const taskStore = useTaskStore();
const isDeleteModalOpen = ref(false);

const formattedDueDate = computed(() => {
  if (!props.task?.dueDate) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(props.task.dueDate));
});

const formattedCreatedAt = computed(() => {
  if (!props.task?.createdAt) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.task.createdAt));
});

async function handleToggleStatus() {
  if (!props.task) return;
  await taskStore.toggleTask(props.task.id);
}

async function confirmDeleteTask() {
  if (!props.task) return;
  try {
    await taskStore.deleteTask(props.task.id);
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la suppression de la tâche');
  } finally {
    isDeleteModalOpen.value = false;
  }
}
</script>

<template>
  <aside
    v-if="task"
    class="w-80 md:w-96 h-full flex flex-col bg-slate-900 border-l border-slate-800 transition-all duration-300 z-20 flex-shrink-0 shadow-2xl"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-between px-5 border-b border-slate-800 flex-shrink-0">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Tag class="w-4 h-4 text-indigo-400" />
        Détail de la tâche
      </div>

      <button
        type="button"
        class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
        title="Fermer le panneau"
        @click="emit('close')"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Content Body -->
    <div class="flex-1 overflow-y-auto p-5 space-y-6">
      <!-- Status Badge & Action -->
      <div class="flex items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
        <div class="flex items-center gap-2">
          <span
            :class="[
              'w-2.5 h-2.5 rounded-full',
              task.isCompleted ? 'bg-emerald-500' : 'bg-amber-500',
            ]"
          />
          <span class="text-xs font-semibold text-slate-200">
            {{ task.isCompleted ? 'Tâche terminée' : 'En cours' }}
          </span>
        </div>

        <button
          type="button"
          :class="[
            'px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5',
            task.isCompleted
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30',
          ]"
          @click="handleToggleStatus"
        >
          <CheckCircle v-if="!task.isCompleted" class="w-3.5 h-3.5" />
          <Circle v-else class="w-3.5 h-3.5" />
          {{ task.isCompleted ? 'Marquer active' : 'Marquer terminée' }}
        </button>
      </div>

      <!-- Short Description / Title -->
      <div>
        <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Description courte
        </label>
        <h3 class="text-base font-bold text-white leading-snug break-words">
          {{ task.shortDesc }}
        </h3>
      </div>

      <!-- Long Description -->
      <div>
        <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <FileText class="w-3.5 h-3.5" />
          Description longue
        </label>
        <div class="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
          {{ task.longDesc || 'Aucune description longue saisie.' }}
        </div>
      </div>

      <!-- Dates Metadata -->
      <div class="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
        <div class="flex items-center justify-between text-slate-300">
          <span class="flex items-center gap-1.5 text-slate-400">
            <Calendar class="w-3.5 h-3.5 text-indigo-400" />
            Date d'échéance :
          </span>
          <span class="font-semibold text-white bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            {{ formattedDueDate }}
          </span>
        </div>

        <div class="flex items-center justify-between text-slate-300">
          <span class="flex items-center gap-1.5 text-slate-400">
            <Clock class="w-3.5 h-3.5 text-slate-500" />
            Créée le :
          </span>
          <span class="font-medium text-slate-400">
            {{ formattedCreatedAt }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer Actions (Delete) -->
    <div class="p-4 border-t border-slate-800 bg-slate-900/90 flex-shrink-0">
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition cursor-pointer"
        @click="isDeleteModalOpen = true"
      >
        <Trash2 class="w-4 h-4" />
        Supprimer cette tâche
      </button>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      v-model:is-open="isDeleteModalOpen"
      title="Supprimer la tâche ?"
      :message="`Êtes-vous sûr de vouloir supprimer définitivement la tâche « ${task.shortDesc} » ?`"
      confirm-text="Supprimer"
      :danger="true"
      @confirm="confirmDeleteTask"
    />
  </aside>
</template>
