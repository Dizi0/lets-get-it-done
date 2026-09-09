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
  Edit3,
  Save,
  RotateCcw,
  Eye,
  PenTool,
  AlertCircle,
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
const isEditing = ref(false);
const isSaving = ref(false);
const activeTab = ref<'write' | 'preview'>('write');
const editError = ref<string | null>(null);

// Form state for editing
const editForm = reactive({
  shortDesc: '',
  longDesc: '',
  dueDate: '',
});

// Reset form when selected task changes
watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      editForm.shortDesc = newTask.shortDesc || '';
      editForm.longDesc = newTask.longDesc || '';
      editForm.dueDate = newTask.dueDate ? newTask.dueDate.slice(0, 10) : '';
      isEditing.value = false;
      editError.value = null;
      activeTab.value = 'write';
    }
  },
  { immediate: true }
);

const formattedDueDate = computed(() => {
  if (!props.task?.dueDate) return 'Aucune échéance';
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

function startEditing() {
  if (!props.task) return;
  editForm.shortDesc = props.task.shortDesc || '';
  editForm.longDesc = props.task.longDesc || '';
  editForm.dueDate = props.task.dueDate ? props.task.dueDate.slice(0, 10) : '';
  isEditing.value = true;
  editError.value = null;
}

function cancelEditing() {
  if (!props.task) return;
  editForm.shortDesc = props.task.shortDesc || '';
  editForm.longDesc = props.task.longDesc || '';
  editForm.dueDate = props.task.dueDate ? props.task.dueDate.slice(0, 10) : '';
  isEditing.value = false;
  editError.value = null;
}

function setQuickDate(daysToAdd: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  editForm.dueDate = date.toISOString().slice(0, 10);
}

function clearDueDate() {
  editForm.dueDate = '';
}

async function handleSave() {
  if (!props.task) return;
  if (!editForm.shortDesc.trim()) {
    editError.value = 'La description courte est requise.';
    return;
  }

  isSaving.value = true;
  editError.value = null;

  try {
    await taskStore.updateTask(props.task.id, {
      shortDesc: editForm.shortDesc.trim(),
      longDesc: editForm.longDesc.trim() || undefined,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : undefined,
    });
    isEditing.value = false;
  } catch (err: any) {
    editError.value = err.message || 'Erreur lors de la sauvegarde';
  } finally {
    isSaving.value = false;
  }
}

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

// Lightweight safe Markdown renderer for previews
function renderSimpleMarkdown(rawText: string): string {
  if (!rawText) return '';
  const escaped = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-indigo-300 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-indigo-200 mt-4 mb-1.5">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="text-slate-300 italic">$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    .replace(/\[ \]\s+(.*$)/gim, '<div class="flex items-center gap-1.5 text-slate-300"><span class="w-3.5 h-3.5 rounded border border-slate-600 inline-block mr-1"></span> $1</div>')
    .replace(/\[x\]\s+(.*$)/gim, '<div class="flex items-center gap-1.5 text-emerald-400 line-through"><span class="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500 inline-block mr-1 text-center text-[10px] leading-3">✓</span> $1</div>')
    .replace(/\n/gim, '<br/>');
}
</script>

<template>
  <aside
    v-if="task"
    class="w-80 md:w-[420px] h-full flex flex-col glass-panel border-l border-white/[0.06] transition-all duration-300 z-20 flex-shrink-0 shadow-2xl"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Tag class="w-4 h-4 text-indigo-400" />
        {{ isEditing ? 'Modifier la tâche' : 'Détail de la tâche' }}
      </div>

      <div class="flex items-center gap-1.5">
        <button
          v-if="!isEditing"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600/30 border border-indigo-500/20 rounded-xl transition cursor-pointer backdrop-blur-sm"
          title="Modifier la tâche"
          @click="startEditing"
        >
          <Edit3 class="w-3.5 h-3.5" />
          Modifier
        </button>

        <button
          type="button"
          class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition cursor-pointer"
          title="Fermer le panneau"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Content Body -->
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <!-- Error notice -->
      <div
        v-if="editError"
        class="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ editError }}</span>
      </div>

      <!-- Status Badge & Quick Action -->
      <div class="glass-card flex items-center justify-between gap-3 p-3 rounded-2xl">
        <div class="flex items-center gap-2.5">
          <span
            :class="[
              'w-2.5 h-2.5 rounded-full',
              task.isCompleted ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 shadow-sm shadow-amber-500/50',
            ]"
          />
          <span class="text-xs font-semibold text-slate-200">
            {{ task.isCompleted ? 'Tâche terminée' : 'En cours' }}
          </span>
        </div>

        <button
          type="button"
          :class="[
            'px-3 py-1 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5',
            task.isCompleted
              ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/[0.06]'
              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30',
          ]"
          @click="handleToggleStatus"
        >
          <CheckCircle v-if="!task.isCompleted" class="w-3.5 h-3.5" />
          <Circle v-else class="w-3.5 h-3.5" />
          {{ task.isCompleted ? 'Marquer active' : 'Marquer terminée' }}
        </button>
      </div>

      <!-- VIEW MODE -->
      <template v-if="!isEditing">
        <!-- Short Description -->
        <div>
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Titre / Description courte
          </label>
          <h3 class="text-base font-bold text-white leading-snug break-words">
            {{ task.shortDesc }}
          </h3>
        </div>

        <!-- Long Description (Markdown render) -->
        <div>
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-indigo-400" />
            Notes & Description longue (Markdown)
          </label>
          <div
            v-if="task.longDesc"
            class="glass-card p-4 rounded-2xl text-sm text-slate-300 leading-relaxed break-words"
            v-html="renderSimpleMarkdown(task.longDesc)"
          />
          <div
            v-else
            class="p-4 rounded-2xl border border-dashed border-white/10 text-xs text-slate-500 italic flex items-center justify-between bg-slate-950/20"
          >
            <span>Aucune note ou description longue renseignée.</span>
            <button
              type="button"
              class="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              @click="startEditing"
            >
              + Ajouter
            </button>
          </div>
        </div>

        <!-- Dates Metadata -->
        <div class="space-y-3 pt-3 border-t border-white/[0.06] text-xs">
          <div class="flex items-center justify-between text-slate-300">
            <span class="flex items-center gap-1.5 text-slate-400">
              <Calendar class="w-3.5 h-3.5 text-indigo-400" />
              Date d'échéance :
            </span>
            <span
              :class="[
                'font-semibold px-2.5 py-1 rounded-lg border text-xs backdrop-blur-sm',
                task.dueDate
                  ? 'text-indigo-200 bg-indigo-500/10 border-indigo-500/20'
                  : 'text-slate-500 bg-slate-800/40 border-slate-800',
              ]"
            >
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
      </template>

      <!-- EDIT MODE -->
      <template v-else>
        <!-- Short Desc Input -->
        <div>
          <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Description courte <span class="text-rose-400">*</span>
          </label>
          <input
            v-model="editForm.shortDesc"
            type="text"
            maxlength="255"
            placeholder="Titre de la tâche..."
            class="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-white focus:outline-none"
          />
          <div class="text-[10px] text-slate-500 text-right mt-1">
            {{ editForm.shortDesc.length }}/255
          </div>
        </div>

        <!-- Long Desc (Markdown Editor + Preview Tabs) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText class="w-3.5 h-3.5 text-indigo-400" />
              Notes Markdown
            </label>
            <div class="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-white/[0.08] text-[11px]">
              <button
                type="button"
                :class="[
                  'px-2 py-0.5 rounded font-medium transition cursor-pointer flex items-center gap-1',
                  activeTab === 'write' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white',
                ]"
                @click="activeTab = 'write'"
              >
                <PenTool class="w-3 h-3" />
                Écrire
              </button>
              <button
                type="button"
                :class="[
                  'px-2 py-0.5 rounded font-medium transition cursor-pointer flex items-center gap-1',
                  activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white',
                ]"
                @click="activeTab = 'preview'"
              >
                <Eye class="w-3 h-3" />
                Aperçu
              </button>
            </div>
          </div>

          <!-- Write Tab -->
          <div v-if="activeTab === 'write'">
            <textarea
              v-model="editForm.longDesc"
              rows="6"
              placeholder="Détails, notes, listes à puces Markdown, code..."
              class="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none resize-y"
            ></textarea>
            <p class="text-[10px] text-slate-500 mt-1">
              💡 Supporte les titres (#), le gras (**texte**), le code (`inline`) et les listes (- item).
            </p>
          </div>

          <!-- Preview Tab -->
          <div
            v-else
            class="min-h-[140px] p-4 glass-card rounded-2xl text-xs text-slate-300 leading-relaxed break-words"
            v-html="renderSimpleMarkdown(editForm.longDesc || '*Aucun contenu à prévisualiser*')"
          />
        </div>

        <!-- Due Date Picker with quick shortcuts -->
        <div>
          <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5 text-indigo-400" />
            Date d'échéance
          </label>
          <input
            v-model="editForm.dueDate"
            type="date"
            class="w-full px-3.5 py-2 glass-input rounded-xl text-xs text-white focus:outline-none"
          />

          <!-- Quick presets -->
          <div class="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
            <button
              type="button"
              class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 rounded-lg transition cursor-pointer"
              @click="setQuickDate(0)"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 rounded-lg transition cursor-pointer"
              @click="setQuickDate(1)"
            >
              Demain
            </button>
            <button
              type="button"
              class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 rounded-lg transition cursor-pointer"
              @click="setQuickDate(7)"
            >
              Dans 7 j
            </button>
            <button
              v-if="editForm.dueDate"
              type="button"
              class="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
              @click="clearDueDate"
            >
              Effacer
            </button>
          </div>
        </div>

        <!-- Edit Action Buttons -->
        <div class="pt-3 border-t border-white/[0.06] flex items-center gap-2">
          <button
            type="button"
            :disabled="isSaving"
            class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/20"
            @click="handleSave"
          >
            <Save class="w-3.5 h-3.5" />
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>

          <button
            type="button"
            :disabled="isSaving"
            class="px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-50 rounded-xl transition cursor-pointer"
            @click="cancelEditing"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </div>

    <!-- Footer Actions (Delete) -->
    <div class="p-4 border-t border-white/[0.06] bg-slate-950/40 backdrop-blur-md flex-shrink-0">
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
