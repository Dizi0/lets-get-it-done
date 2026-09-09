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
      'group relative flex items-start gap-3.5 p-4 rounded-2xl transition-all duration-200 cursor-pointer select-none',
      isSelected
        ? 'bg-blue-50/90 border border-blue-400/80 shadow-md ring-2 ring-blue-500/20 backdrop-blur-xl'
        : 'apple-glass-card',
      task.isCompleted ? 'opacity-65' : '',
    ]"
    @click="emit('select', task)"
  >
    <!-- Toggle Checkbox Button (Apple Reminders style) -->
    <button
      type="button"
      :class="[
        'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-150 flex-shrink-0 cursor-pointer shadow-2xs',
        task.isCompleted
          ? 'bg-emerald-600 border-emerald-600 text-white'
          : 'border-slate-300 hover:border-blue-500 bg-white/90 hover:bg-blue-50',
      ]"
      @click.stop="emit('toggle', task)"
    >
      <Check v-if="task.isCompleted" class="w-3 h-3 stroke-[3.5]" />
    </button>

    <!-- Task Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <h4
          :class="[
            'text-sm font-medium tracking-tight transition break-words',
            task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-blue-600',
          ]"
        >
          {{ task.shortDesc }}
        </h4>
      </div>

      <p
        v-if="task.longDesc"
        class="text-xs text-slate-500 line-clamp-1 mt-1 font-normal"
      >
        {{ task.longDesc }}
      </p>

      <!-- Metadata / Due Date Badge -->
      <div class="flex items-center gap-3 mt-2.5">
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium backdrop-blur-md',
            task.isCompleted
              ? 'bg-slate-100/70 text-slate-400 border border-slate-200/60'
              : isOverdue
              ? 'bg-rose-50/90 text-rose-700 border border-rose-200/80 font-semibold'
              : 'bg-slate-100/80 text-slate-600 border border-slate-200/60',
          ]"
        >
          <Calendar class="w-3 h-3" />
          {{ formattedDueDate }}
          <span v-if="isOverdue">• En retard</span>
        </span>
      </div>
    </div>

    <!-- Arrow icon -->
    <div class="self-center text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5">
      <ChevronRight class="w-4 h-4" />
    </div>
  </div>
</template>
