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
  ListTodo,
  CalendarDays,
} from 'lucide-vue-next';
import { useListStore } from '~/stores/lists';
import { useTaskStore } from '~/stores/tasks';
import type { Task } from '~/types/task';
import CalendarView from './CalendarView.vue';

const props = defineProps<{
  isLeftSidebarCollapsed: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleLeftSidebar'): void;
}>();

const listStore = useListStore();
const taskStore = useTaskStore();

const activeView = ref<'list' | 'calendar'>('list');
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
  <main class="flex-1 h-full flex flex-col bg-transparent overflow-hidden z-10">
    <!-- Top Bar Header -->
    <header class="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl flex-shrink-0">
      <div class="flex items-center gap-3">
        <button
          v-if="isLeftSidebarCollapsed"
          type="button"
          class="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-white/60 transition cursor-pointer"
          @click="emit('toggleLeftSidebar')"
        >
          <Menu class="w-5 h-5" />
        </button>

        <div v-if="listStore.currentList">
          <h1 class="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {{ listStore.currentList.title }}
          </h1>
          <p class="text-[11px] text-slate-500 font-medium">
            {{ taskStore.activeTasks.length }} active(s) • {{ taskStore.completedTasks.length }} terminée(s)
          </p>
        </div>
        <div v-else>
          <h1 class="text-sm font-semibold text-slate-500">
            Aucune liste sélectionnée
          </h1>
        </div>
      </div>

      <!-- View Switcher (Liste / Calendrier) -->
      <div v-if="listStore.currentList" class="flex items-center bg-slate-200/60 p-0.5 rounded-xl border border-slate-200/60 text-xs backdrop-blur-sm">
        <button
          type="button"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer',
            activeView === 'list'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
          @click="activeView = 'list'"
        >
          <ListTodo class="w-3.5 h-3.5" />
          <span>Liste</span>
        </button>
        <button
          type="button"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer',
            activeView === 'calendar'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
          @click="activeView = 'calendar'"
        >
          <CalendarDays class="w-3.5 h-3.5" />
          <span>Calendrier</span>
        </button>
      </div>
    </header>

    <!-- Main Scrollable Area -->
    <div class="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto space-y-6">
      <!-- Empty State when no list is selected -->
      <div
        v-if="!listStore.currentList"
        class="h-96 flex flex-col items-center justify-center text-center p-8 apple-glass-panel rounded-3xl"
      >
        <div class="p-4 bg-blue-50/80 text-blue-600 rounded-2xl mb-4 border border-blue-100/80 backdrop-blur-md">
          <Inbox class="w-8 h-8" />
        </div>
        <h2 class="text-base font-bold text-slate-900 mb-1.5">
          Sélectionnez une liste
        </h2>
        <p class="text-xs text-slate-500 max-w-sm">
          Choisissez une liste dans la barre latérale ou créez-en une nouvelle pour gérer vos tâches.
        </p>
      </div>

      <template v-else>
        <!-- CALENDAR VIEW -->
        <CalendarView
          v-if="activeView === 'calendar'"
          :tasks="taskStore.tasks"
          @select-task="handleSelectTask"
          @toggle-task="handleToggleTask"
        />

        <!-- LIST VIEW -->
        <div v-else class="space-y-6">
        <!-- Task Creation Card Form (Apple Light Glassmorphism Card) -->
        <div class="apple-glass-panel rounded-2xl p-4">
          <form class="space-y-3" @submit.prevent="handleCreateTask">
            <div class="flex items-center gap-3">
              <input
                v-model="shortDesc"
                type="text"
                placeholder="Ajouter une tâche... (Description courte obligatoire)"
                class="flex-1 apple-glass-input rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                @focus="isFormExpanded = true"
              />

              <div class="flex items-center gap-2">
                <input
                  v-model="dueDate"
                  type="date"
                  class="apple-glass-input rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none"
                  title="Date d'échéance"
                />

                <button
                  type="submit"
                  :disabled="!shortDesc.trim() || isSubmitting"
                  class="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95"
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
              <div v-if="isFormExpanded" class="space-y-2 pt-2 border-t border-slate-200/50">
                <textarea
                  v-model="longDesc"
                  rows="2"
                  placeholder="Notes, détails ou Markdown (optionnel)..."
                  class="w-full apple-glass-input rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none font-mono"
                />
              </div>
            </Transition>

            <div v-if="formError" class="text-xs text-rose-600 font-medium">
              {{ formError }}
            </div>
          </form>
        </div>

        <!-- Active Tasks Section -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tâches actives ({{ taskStore.activeTasks.length }})
            </h2>
          </div>

          <!-- Light Shimmer Skeleton for Tasks -->
          <div v-if="taskStore.isLoading" class="space-y-2.5">
            <div v-for="i in 3" :key="i" class="h-20 rounded-2xl skeleton-shimmer border border-white/60 flex items-center px-4 justify-between">
              <div class="flex items-center gap-3">
                <div class="w-5 h-5 rounded-full bg-slate-300/70"></div>
                <div class="space-y-2">
                  <div class="h-3.5 w-56 rounded-md bg-slate-300/70"></div>
                  <div class="h-2.5 w-28 rounded-md bg-slate-300/50"></div>
                </div>
              </div>
              <div class="h-5 w-20 rounded-full bg-slate-300/50"></div>
            </div>
          </div>

          <div
            v-else-if="taskStore.activeTasks.length === 0"
            class="p-8 text-center apple-glass-panel rounded-2xl text-xs text-slate-500"
          >
            Toutes les tâches actives sont terminées !
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
          class="pt-4 border-t border-slate-200/50 space-y-3"
        >
          <button
            type="button"
            class="flex items-center justify-between w-full p-3 rounded-2xl apple-glass-panel hover:bg-white/80 text-slate-700 transition cursor-pointer select-none"
            @click="isCompletedSectionOpen = !isCompletedSectionOpen"
          >
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 class="w-4 h-4 text-emerald-600" />
              <span>Mes tâches terminées ({{ taskStore.completedTasks.length }})</span>
            </div>

            <ChevronUp v-if="isCompletedSectionOpen" class="w-4 h-4 text-slate-500" />
            <ChevronDown v-else class="w-4 h-4 text-slate-500" />
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
        </div>
      </template>
    </div>
  </main>
</template>
