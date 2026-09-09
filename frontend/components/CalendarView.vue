<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-vue-next';
import { useTaskStore } from '~/stores/tasks';
import type { Task } from '~/types/task';

const props = defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'selectTask', task: Task): void;
  (e: 'toggleTask', task: Task): void;
}>();

const taskStore = useTaskStore();

// Active navigation date & view mode ('month' | 'week')
const currentDate = ref(new Date());
const viewMode = ref<'month' | 'week'>('month');

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const dayNamesShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const formattedCurrentMonth = computed(() => {
  const month = monthNames[currentDate.value.getMonth()];
  const year = currentDate.value.getFullYear();
  return `${month} ${year}`;
});

function previousPeriod() {
  const d = new Date(currentDate.value);
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() - 1);
  } else {
    d.setDate(d.getDate() - 7);
  }
  currentDate.value = d;
}

function nextPeriod() {
  const d = new Date(currentDate.value);
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + 7);
  }
  currentDate.value = d;
}

function goToToday() {
  currentDate.value = new Date();
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

// Generate the 35 or 42 calendar grid cells for Month View
interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // In France / Europe, Monday is 0 and Sunday is 6
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  const totalDays = lastDayOfMonth.getDate();
  const days: CalendarDay[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: d,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: isToday(d),
      tasks: getTasksForDay(d),
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: isToday(d),
      tasks: getTasksForDay(d),
    });
  }

  // Next month leading days to complete the 7-column grid
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: isToday(d),
      tasks: getTasksForDay(d),
    });
  }

  return days;
});

// Week View Days (Monday to Sunday around currentDate)
const weekDays = computed<CalendarDay[]>(() => {
  const current = new Date(currentDate.value);
  const dayOfWeek = current.getDay() === 0 ? 6 : current.getDay() - 1;
  const monday = new Date(current);
  monday.setDate(current.getDate() - dayOfWeek);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date: d,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === currentDate.value.getMonth(),
      isToday: isToday(d),
      tasks: getTasksForDay(d),
    });
  }
  return days;
});

function getTasksForDay(date: Date): Task[] {
  return props.tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return isSameDay(taskDate, date);
  });
}

function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.isCompleted) return false;
  return new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Calendar Controls Header -->
    <div class="apple-glass-panel rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
      <!-- Period Navigation & Title -->
      <div class="flex items-center gap-3">
        <div class="flex items-center bg-white/70 border border-slate-200/70 rounded-xl p-0.5 shadow-2xs backdrop-blur-md">
          <button
            type="button"
            class="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
            title="Période précédente"
            @click="previousPeriod"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition cursor-pointer"
            @click="goToToday"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            class="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
            title="Période suivante"
            @click="nextPeriod"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <h2 class="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarIcon class="w-4 h-4 text-blue-600" />
          {{ formattedCurrentMonth }}
        </h2>
      </div>

      <!-- Mode Selector (Mois / Semaine) -->
      <div class="flex items-center bg-slate-200/60 p-0.5 rounded-xl border border-slate-200/60 text-xs backdrop-blur-sm">
        <button
          type="button"
          :class="[
            'px-3 py-1 rounded-lg font-medium transition cursor-pointer',
            viewMode === 'month'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
          @click="viewMode = 'month'"
        >
          Mois
        </button>
        <button
          type="button"
          :class="[
            'px-3 py-1 rounded-lg font-medium transition cursor-pointer',
            viewMode === 'week'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
          @click="viewMode = 'week'"
        >
          Semaine
        </button>
      </div>
    </div>

    <!-- MONTH VIEW -->
    <div v-if="viewMode === 'month'" class="apple-glass-panel rounded-3xl p-4 overflow-hidden">
      <!-- Days of week Header -->
      <div class="grid grid-cols-7 gap-1.5 text-center mb-2">
        <div
          v-for="name in dayNamesShort"
          :key="name"
          class="py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400"
        >
          {{ name }}
        </div>
      </div>

      <!-- Month Grid -->
      <div class="grid grid-cols-7 gap-1.5">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[
            'min-h-[105px] md:min-h-[120px] p-2 rounded-2xl border transition-all duration-150 flex flex-col',
            day.isCurrentMonth
              ? 'bg-white/70 border-white/80 hover:bg-white/95'
              : 'bg-slate-100/40 border-slate-200/40 opacity-45',
            day.isToday ? 'ring-2 ring-blue-500/40 bg-blue-50/40' : '',
          ]"
        >
          <!-- Date number header -->
          <div class="flex items-center justify-between mb-1.5">
            <span
              :class="[
                'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center',
                day.isToday
                  ? 'bg-blue-600 text-white shadow-xs'
                  : day.isCurrentMonth
                  ? 'text-slate-800'
                  : 'text-slate-400',
              ]"
            >
              {{ day.dayNumber }}
            </span>

            <span
              v-if="day.tasks.length > 0"
              class="text-[10px] font-semibold text-slate-400 px-1"
            >
              {{ day.tasks.length }}
            </span>
          </div>

          <!-- Task pills list for this day -->
          <div class="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
            <div
              v-for="task in day.tasks"
              :key="task.id"
              :class="[
                'group flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer select-none border',
                taskStore.selectedTaskId === task.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : task.isCompleted
                  ? 'bg-slate-100/80 text-slate-400 border-slate-200/70 line-through'
                  : isTaskOverdue(task)
                  ? 'bg-rose-50/90 text-rose-700 border-rose-200/80 hover:bg-rose-100'
                  : 'bg-white/90 text-slate-700 border-slate-200/70 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200',
              ]"
              :title="task.shortDesc"
              @click.stop="emit('selectTask', task)"
            >
              <button
                type="button"
                :class="[
                  'w-3.5 h-3.5 rounded-full flex items-center justify-center border flex-shrink-0 transition',
                  task.isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 bg-white hover:border-blue-500',
                ]"
                @click.stop="emit('toggleTask', task)"
              >
                <Check v-if="task.isCompleted" class="w-2.5 h-2.5 stroke-[3]" />
              </button>

              <span class="truncate flex-1">
                {{ task.shortDesc }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WEEK VIEW -->
    <div v-else class="apple-glass-panel rounded-3xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-7 gap-3">
        <div
          v-for="(day, index) in weekDays"
          :key="index"
          :class="[
            'min-h-[300px] p-3 rounded-2xl border flex flex-col transition-all',
            day.isToday
              ? 'bg-blue-50/50 border-blue-200/80 ring-2 ring-blue-500/20'
              : 'bg-white/70 border-white/80',
          ]"
        >
          <!-- Day Header -->
          <div class="text-center pb-2 mb-2 border-b border-slate-200/50">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {{ dayNamesShort[index] }}
            </span>
            <span
              :class="[
                'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mt-0.5',
                day.isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-800',
              ]"
            >
              {{ day.dayNumber }}
            </span>
          </div>

          <!-- Tasks list for the day -->
          <div class="flex-1 space-y-2 overflow-y-auto">
            <div
              v-if="day.tasks.length === 0"
              class="h-24 flex items-center justify-center text-[11px] text-slate-400 italic text-center"
            >
              Aucune tâche
            </div>

            <div
              v-for="task in day.tasks"
              :key="task.id"
              :class="[
                'p-2.5 rounded-xl border transition cursor-pointer select-none text-xs flex items-start gap-2',
                taskStore.selectedTaskId === task.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : task.isCompleted
                  ? 'bg-slate-100/80 text-slate-400 border-slate-200/70'
                  : isTaskOverdue(task)
                  ? 'bg-rose-50/90 text-rose-700 border-rose-200/80 hover:bg-rose-100'
                  : 'bg-white/90 text-slate-700 border-slate-200/80 hover:border-blue-300 hover:shadow-2xs',
              ]"
              @click="emit('selectTask', task)"
            >
              <button
                type="button"
                :class="[
                  'mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border flex-shrink-0 transition',
                  task.isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 bg-white hover:border-blue-500',
                ]"
                @click.stop="emit('toggleTask', task)"
              >
                <Check v-if="task.isCompleted" class="w-2.5 h-2.5 stroke-[3]" />
              </button>

              <div class="min-w-0 flex-1">
                <p
                  :class="[
                    'font-medium truncate',
                    task.isCompleted ? 'line-through text-slate-400' : '',
                  ]"
                >
                  {{ task.shortDesc }}
                </p>
                <p v-if="task.longDesc" class="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {{ task.longDesc }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
