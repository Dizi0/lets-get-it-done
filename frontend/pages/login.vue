<script setup lang="ts">
import { ref } from 'vue';
import { CheckCircle2, Lock, Mail, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs';
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value,
    });
    navigateTo('/');
  } catch (err: any) {
    errorMessage.value =
      err.data?.message || 'Identifiants invalides. Veuillez réessayer.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-950 selection:bg-indigo-500/30 selection:text-indigo-200">
    <div class="w-full max-w-md">
      <!-- App Brand Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-sm mb-4">
          <CheckCircle2 class="w-7 h-7" />
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-white">
          Connexion à TaskFlow
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Gérez vos tâches et projets en temps réel
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-300"
          >
            {{ errorMessage }}
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-300">
              Adresse email
            </label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="votre.email@exemple.com"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-300">
              Mot de passe
            </label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <span v-if="!isLoading">Se connecter</span>
            <span v-else>Connexion en cours...</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4" />
          </button>
        </form>

        <!-- Footer link to register -->
        <div class="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Pas encore de compte ?
          <NuxtLink to="/register" class="font-bold text-indigo-400 hover:text-indigo-300 ml-1 transition">
            Créer un compte
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
