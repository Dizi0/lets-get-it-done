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
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-slate-800 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-slate-900 mt-4 mb-1.5">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-extrabold text-slate-900 mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-slate-900 font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="text-slate-600 italic">$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700">$1</li>')
    .replace(/\[ \]\s+(.*$)/gim, '<div class="flex items-center gap-1.5 text-slate-700"><span class="w-3.5 h-3.5 rounded border border-slate-300 inline-block mr-1 bg-white"></span> $1</div>')
    .replace(/\[x\]\s+(.*$)/gim, '<div class="flex items-center gap-1.5 text-emerald-700 line-through"><span class="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400 inline-block mr-1 text-center text-[10px] leading-3 text-emerald-800">✓</span> $1</div>')
    .replace(/\n/gim, '<br/>');
}
</script>

<template>
  <aside
    v-if="task"
    class="w-80 md:w-[420px] h-full flex flex-col apple-glass-inspector transition-all duration-300 z-20 flex-shrink-0"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-between px-5 border-b border-slate-200/50 bg-white/40 flex-shrink-0">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Tag class="w-4 h-4 text-blue-600" />
        {{ isEditing ? 'Modifier la tâche' : 'Détail de la tâche' }}
      </div>

      <div class="flex items-center gap-1.5">
        <button
          v-if="!isEditing"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/70 rounded-xl transition cursor-pointer backdrop-blur-sm shadow-2xs"
          title="Modifier la tâche"
          @click="startEditing"
        >
          <Edit3 class="w-3.5 h-3.5" />
          Modifier
        </button>

        <button
          type="button"
          class="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-white/60 transition cursor-pointer"
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
        class="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ editError }}</span>
      </div>

      <!-- Status Badge & Quick Action -->
      <div class="apple-glass-card flex items-center justify-between gap-3 p-3.5 rounded-2xl">
        <div class="flex items-center gap-2.5">
          <span
            :class="[
              'w-2.5 h-2.5 rounded-full ring-2 ring-white',
              task.isCompleted ? 'bg-emerald-500' : 'bg-amber-500',
            ]"
          />
          <span class="text-xs font-semibold text-slate-800">
            {{ task.isCompleted ? 'Tâche terminée' : 'En cours' }}
          </span>
        </div>

        <button
          type="button"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs',
            task.isCompleted
              ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300/80',
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
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Titre / Description courte
          </label>
          <h3 class="text-base font-bold text-slate-900 leading-snug break-words">
            {{ task.shortDesc }}
          </h3>
        </div>

        <!-- Long Description (Markdown render) -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-blue-600" />
            Notes & Description longue (Markdown)
          </label>
          <div
            v-if="task.longDesc"
            class="apple-glass-card p-4 rounded-2xl text-sm text-slate-700 leading-relaxed break-words"
            v-html="renderSimpleMarkdown(task.longDesc)"
          />
          <div
            v-else
            class="p-4 rounded-2xl border border-dashed border-slate-200/80 text-xs text-slate-500 italic flex items-center justify-between bg-white/40"
          >
            <span>Aucune note ou description longue renseignée.</span>
            <button
              type="button"
              class="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              @click="startEditing"
            >
              + Ajouter
            </button>
          </div>
        </div>

        <!-- Dates Metadata -->
        <div class="space-y-3 pt-3 border-t border-slate-200/50 text-xs">
          <div class="flex items-center justify-between text-slate-700">
            <span class="flex items-center gap-1.5 text-slate-500">
              <Calendar class="w-3.5 h-3.5 text-blue-600" />
              Date d'échéance :
            </span>
            <span
              :class="[
                'font-semibold px-2.5 py-1 rounded-lg border text-xs backdrop-blur-sm',
                task.dueDate
                  ? 'text-blue-700 bg-blue-50/80 border-blue-200/80'
                  : 'text-slate-500 bg-slate-100/70 border-slate-200/60',
              ]"
            >
              {{ formattedDueDate }}
            </span>
          </div>

          <div class="flex items-center justify-between text-slate-700">
            <span class="flex items-center gap-1.5 text-slate-500">
              <Clock class="w-3.5 h-3.5 text-slate-400" />
              Créée le :
            </span>
            <span class="font-medium text-slate-500">
              {{ formattedCreatedAt }}
            </span>
          </div>
        </div>
      </template>

      <!-- EDIT MODE -->
      <template v-else>
        <!-- Short Desc Input -->
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Description courte <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="editForm.shortDesc"
            type="text"
            maxlength="255"
            placeholder="Titre de la tâche..."
            class="w-full px-3.5 py-2.5 apple-glass-input rounded-xl text-sm focus:outline-none"
          />
          <div class="text-[10px] text-slate-500 text-right mt-1">
            {{ editForm.shortDesc.length }}/255
          </div>
        </div>

        <!-- Long Desc (Markdown Editor + Preview Tabs) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText class="w-3.5 h-3.5 text-blue-600" />
              Notes Markdown
            </label>
            <div class="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl border border-slate-200/60 text-[11px] backdrop-blur-sm">
              <button
                type="button"
                :class="[
                  'px-2.5 py-0.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1',
                  activeTab === 'write' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900',
                ]"
                @click="activeTab = 'write'"
              >
                <PenTool class="w-3 h-3" />
                Écrire
              </button>
              <button
                type="button"
                :class="[
                  'px-2.5 py-0.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1',
                  activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900',
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
              class="w-full px-3.5 py-2.5 apple-glass-input rounded-xl text-xs placeholder-slate-400 font-mono focus:outline-none resize-y"
            ></textarea>
            <p class="text-[10px] text-slate-500 mt-1">
              💡 Supporte les titres (#), le gras (**texte**), le code (`inline`) et les listes (- item).
            </p>
          </div>

          <!-- Preview Tab -->
          <div
            v-else
            class="min-h-[140px] p-4 apple-glass-card rounded-2xl text-xs text-slate-700 leading-relaxed break-words"
            v-html="renderSimpleMarkdown(editForm.longDesc || '*Aucun contenu à prévisualiser*')"
          />
        </div>

        <!-- Due Date Picker with quick shortcuts -->
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5 text-blue-600" />
            Date d'échéance
          </label>
          <input
            v-model="editForm.dueDate"
            type="date"
            class="w-full px-3.5 py-2 apple-glass-input rounded-xl text-xs text-slate-800 focus:outline-none"
          />

          <!-- Quick presets -->
          <div class="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
            <button
              type="button"
              class="px-2.5 py-1 bg-white/80 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer border border-slate-200/70 shadow-2xs"
              @click="setQuickDate(0)"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              class="px-2.5 py-1 bg-white/80 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer border border-slate-200/70 shadow-2xs"
              @click="setQuickDate(1)"
            >
              Demain
            </button>
            <button
              type="button"
              class="px-2.5 py-1 bg-white/80 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer border border-slate-200/70 shadow-2xs"
              @click="setQuickDate(7)"
            >
              Dans 7 j
            </button>
            <button
              v-if="editForm.dueDate"
              type="button"
              class="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              @click="clearDueDate"
            >
              Effacer
            </button>
          </div>
        </div>

        <!-- Edit Action Buttons -->
        <div class="pt-3 border-t border-slate-200/50 flex items-center gap-2">
          <button
            type="button"
            :disabled="isSaving"
            class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-sm shadow-blue-500/20"
            @click="handleSave"
          >
            <Save class="w-3.5 h-3.5" />
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>

          <button
            type="button"
            :disabled="isSaving"
            class="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200/80 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-2xs"
            @click="cancelEditing"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </div>

    <!-- Footer Actions (Delete) -->
    <div class="p-4 border-t border-slate-200/50 bg-white/40 flex-shrink-0">
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/80 rounded-xl transition cursor-pointer shadow-2xs"
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
