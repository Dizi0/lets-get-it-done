<script setup lang="ts">
import { Check, Calendar, ChevronRight } from 'lucide-vue-next';
import type { Task } from '~/types/task';

const props = defineProps<{
  task: Task;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', task: Task): void;
  (e: 'toggle', task: Task): void;
}>();

const formattedDueDate = computed(() => {
  if (!props.task.dueDate) return '';
  const d = new Date(props.task.dueDate);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
});

const isOverdue = computed(() => {
  if (!props.task.dueDate || props.task.isCompleted) return false;
  return new Date(props.task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
});
</script>

<template>
  <div
    :class="[
      'group relative flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none',
      isSelected
        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
        : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80 shadow-sm',
      task.isCompleted ? 'opacity-60 bg-slate-900/40' : '',
    ]"
    @click="emit('select', task)"
  >
    <!-- Toggle Checkbox Button -->
    <button
      type="button"
      :class="[
        'mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition flex-shrink-0 cursor-pointer',
        task.isCompleted
          ? 'bg-emerald-500 border-emerald-500 text-emerald-950'
          : 'border-slate-700 hover:border-indigo-400 bg-slate-950/60',
      ]"
      @click.stop="emit('toggle', task)"
    >
      <Check v-if="task.isCompleted" class="w-3.5 h-3.5 stroke-[3]" />
    </button>

    <!-- Task Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <h4
          :class="[
            'text-sm font-semibold tracking-tight transition break-words',
            task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100 group-hover:text-indigo-200',
          ]"
        >
          {{ task.shortDesc }}
        </h4>
      </div>

      <p
        v-if="task.longDesc"
        class="text-xs text-slate-400 line-clamp-1 mt-1 font-normal"
      >
        {{ task.longDesc }}
      </p>

      <!-- Metadata / Due Date Badge -->
      <div class="flex items-center gap-3 mt-2.5">
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
            task.isCompleted
              ? 'bg-slate-800 text-slate-400'
              : isOverdue
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
          ]"
        >
          <Calendar class="w-3 h-3" />
          {{ formattedDueDate }}
          <span v-if="isOverdue" class="font-bold">• Retard</span>
        </span>
      </div>
    </div>

    <!-- Arrow icon -->
    <div class="self-center text-slate-600 group-hover:text-slate-400 transition-transform group-hover:translate-x-0.5">
      <ChevronRight class="w-4 h-4" />
    </div>
  </div>
</template>
