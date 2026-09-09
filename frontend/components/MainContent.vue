<script setup lang="ts">
import {
  Plus,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Inbox,
  Sparkles,
  Menu,
} from 'lucide-vue-next';
import { useListStore } from '~/stores/lists';
import { useTaskStore } from '~/stores/tasks';
import type { Task } from '~/types/task';

const props = defineProps<{
  isLeftSidebarCollapsed: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleLeftSidebar'): void;
}>();

const listStore = useListStore();
const taskStore = useTaskStore();

const isCompletedSectionOpen = ref(false);
const isFormExpanded = ref(false);

const shortDesc = ref('');
const longDesc = ref('');
const dueDate = ref(new Date().toISOString().split('T')[0]);
const formError = ref('');
const isSubmitting = ref(false);

async function handleCreateTask() {
  if (!listStore.currentListId) return;
  if (!shortDesc.value.trim() || !dueDate.value) {
    formError.value = 'La description courte et la date d échéance sont obligatoires';
    return;
  }

  formError.value = '';
  isSubmitting.value = true;
  try {
    await taskStore.createTask(listStore.currentListId, {
      shortDesc: shortDesc.value.trim(),
      longDesc: longDesc.value.trim() || undefined,
      dueDate: new Date(dueDate.value).toISOString(),
    });

    shortDesc.value = '';
    longDesc.value = '';
    dueDate.value = new Date().toISOString().split('T')[0];
    isFormExpanded.value = false;
  } catch (err: any) {
    formError.value = err.message || 'Erreur lors de la création';
  } finally {
    isSubmitting.value = false;
  }
}

function handleSelectTask(task: Task) {
  taskStore.selectTask(task);
}

function handleToggleTask(task: Task) {
  taskStore.toggleTask(task.id);
}
</script>

<template>
  <main class="flex-1 h-full flex flex-col bg-transparent overflow-hidden">
    <!-- Top Bar Header -->
    <header class="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-slate-950/40 backdrop-blur-xl flex-shrink-0">
      <div class="flex items-center gap-3">
        <button
          v-if="isLeftSidebarCollapsed"
          type="button"
          class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition cursor-pointer"
          @click="emit('toggleLeftSidebar')"
        >
          <Menu class="w-5 h-5" />
        </button>

        <div v-if="listStore.currentList">
          <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
            {{ listStore.currentList.title }}
          </h1>
          <p class="text-[11px] text-slate-400 font-medium">
            {{ taskStore.activeTasks.length }} active(s) • {{ taskStore.completedTasks.length }} terminée(s)
          </p>
        </div>
        <div v-else>
          <h1 class="text-sm font-semibold text-slate-400">
            Aucune liste sélectionnée
          </h1>
        </div>
      </div>
    </header>

    <!-- Main Scrollable Area -->
    <div class="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-6">
      <!-- Empty State when no list is selected -->
      <div
        v-if="!listStore.currentList"
        class="h-96 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-3xl bg-slate-900/20 backdrop-blur-sm"
      >
        <div class="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-950/50">
          <Inbox class="w-8 h-8" />
        </div>
        <h2 class="text-base font-bold text-white mb-1.5">
          Sélectionnez une liste
        </h2>
        <p class="text-xs text-slate-400 max-w-sm">
          Choisissez une liste dans la barre latérale ou créez-en une nouvelle pour gérer vos tâches.
        </p>
      </div>

      <template v-else>
        <!-- Task Creation Card Form (Apple Glassmorphism) -->
        <div class="glass-card rounded-2xl p-4 shadow-xl">
          <form class="space-y-3" @submit.prevent="handleCreateTask">
            <div class="flex items-center gap-3">
              <input
                v-model="shortDesc"
                type="text"
                placeholder="Ajouter une tâche... (Description courte obligatoire)"
                class="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                @focus="isFormExpanded = true"
              />

              <div class="flex items-center gap-2">
                <input
                  v-model="dueDate"
                  type="date"
                  class="glass-input rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                  title="Date d'échéance"
                />

                <button
                  type="submit"
                  :disabled="!shortDesc.trim() || isSubmitting"
                  class="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <Plus class="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            <!-- Optional Long Description Expandable Area -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div v-if="isFormExpanded" class="space-y-2 pt-2 border-t border-white/[0.06]">
                <textarea
                  v-model="longDesc"
                  rows="2"
                  placeholder="Notes, détails ou Markdown (optionnel)..."
                  class="w-full glass-input rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none font-mono"
                />
              </div>
            </Transition>

            <div v-if="formError" class="text-xs text-rose-400 font-medium">
              {{ formError }}
            </div>
          </form>
        </div>

        <!-- Active Tasks Section -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tâches actives ({{ taskStore.activeTasks.length }})
            </h2>
          </div>

          <!-- Apple Premium Shimmer Skeleton for Tasks -->
          <div v-if="taskStore.isLoading" class="space-y-2.5">
            <div v-for="i in 3" :key="i" class="h-20 rounded-2xl skeleton-shimmer border border-white/[0.04] flex items-center px-4 justify-between">
              <div class="flex items-center gap-3">
                <div class="w-5 h-5 rounded-full bg-white/[0.08]"></div>
                <div class="space-y-2">
                  <div class="h-3.5 w-56 rounded-md bg-white/[0.08]"></div>
                  <div class="h-2.5 w-28 rounded-md bg-white/[0.05]"></div>
                </div>
              </div>
              <div class="h-5 w-20 rounded-full bg-white/[0.05]"></div>
            </div>
          </div>

          <div
            v-else-if="taskStore.activeTasks.length === 0"
            class="p-8 text-center border border-dashed border-white/10 rounded-2xl text-xs text-slate-400 bg-slate-900/10"
          >
            Toutes les tâches actives sont terminées ! ✨
          </div>

          <div v-else class="space-y-2">
            <TaskCard
              v-for="task in taskStore.activeTasks"
              :key="task.id"
              :task="task"
              :is-selected="taskStore.selectedTaskId === task.id"
              @select="handleSelectTask"
              @toggle="handleToggleTask"
            />
          </div>
        </section>

        <!-- Completed Tasks Collapsible Section -->
        <section
          v-if="taskStore.completedTasks.length > 0"
          class="pt-4 border-t border-slate-800/80 space-y-3"
        >
          <button
            type="button"
            class="flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 transition cursor-pointer select-none"
            @click="isCompletedSectionOpen = !isCompletedSectionOpen"
          >
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              <span>Mes tâches terminées ({{ taskStore.completedTasks.length }})</span>
            </div>

            <ChevronUp v-if="isCompletedSectionOpen" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div v-if="isCompletedSectionOpen" class="space-y-2">
              <TaskCard
                v-for="task in taskStore.completedTasks"
                :key="task.id"
                :task="task"
                :is-selected="taskStore.selectedTaskId === task.id"
                @select="handleSelectTask"
                @toggle="handleToggleTask"
              />
            </div>
          </Transition>
        </section>
      </template>
    </div>
  </main>
</template>
