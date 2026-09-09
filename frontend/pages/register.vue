<script setup lang="ts">
import { ref } from 'vue';
import { CheckCircle2, User, Mail, Lock, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const emailConfirmation = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleRegister() {
  if (
    !firstName.value ||
    !lastName.value ||
    !email.value ||
    !emailConfirmation.value ||
    !password.value ||
    !passwordConfirmation.value
  ) {
    errorMessage.value = 'Veuillez renseigner tous les champs obligatoires';
    return;
  }

  if (email.value.trim() !== emailConfirmation.value.trim()) {
    errorMessage.value = 'Les adresses email ne correspondent pas';
    return;
  }

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas';
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Le mot de passe doit comporter au moins 6 caractères';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    await authStore.register({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      emailConfirmation: emailConfirmation.value.trim(),
      password: password.value,
      passwordConfirmation: passwordConfirmation.value,
    });
    navigateTo('/');
  } catch (err: any) {
    errorMessage.value =
      err.data?.message || 'Erreur lors de l inscription. Veuillez vérifier vos données.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-[#f1f5f9] to-slate-100 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
    <!-- Ambient Apple Light Mesh for Translucent Glass Depth -->
    <div class="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[130px]"></div>
    <div class="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-amber-100/35 rounded-full blur-[130px]"></div>
    <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-indigo-100/35 rounded-full blur-[120px]"></div>

    <div class="relative w-full max-w-lg z-10">
      <!-- App Brand Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25 mb-4">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Créer un compte
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          Rejoignez TaskFlow et organisez votre quotidien
        </p>
      </div>

      <!-- Register Apple Glass Card -->
      <div class="apple-glass-panel rounded-3xl p-8">
        <form class="space-y-4" @submit.prevent="handleRegister">
          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="p-3 bg-rose-50/90 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 backdrop-blur-sm"
          >
            {{ errorMessage }}
          </div>

          <!-- First & Last Name Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-700">
                Prénom
              </label>
              <div class="relative">
                <User class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  v-model="firstName"
                  type="text"
                  required
                  placeholder="Jean"
                  class="w-full pl-10 pr-3 py-2.5 apple-glass-input rounded-xl text-sm placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-700">
                Nom
              </label>
              <div class="relative">
                <User class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  v-model="lastName"
                  type="text"
                  required
                  placeholder="Dupont"
                  class="w-full pl-10 pr-3 py-2.5 apple-glass-input rounded-xl text-sm placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              Adresse email
            </label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="jean.dupont@exemple.com"
                class="w-full pl-10 pr-4 py-2.5 apple-glass-input rounded-xl text-sm placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <!-- Email Confirmation -->
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              Confirmation de l'adresse email
            </label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                v-model="emailConfirmation"
                type="email"
                required
                placeholder="jean.dupont@exemple.com"
                class="w-full pl-10 pr-4 py-2.5 apple-glass-input rounded-xl text-sm placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <!-- Password Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-700">
                Mot de passe
              </label>
              <div class="relative">
                <Lock class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  v-model="password"
                  type="password"
                  required
                  placeholder="Min. 6 caractères"
                  class="w-full pl-10 pr-3 py-2.5 apple-glass-input rounded-xl text-sm placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-700">
                Confirmation mot de passe
              </label>
              <div class="relative">
                <Lock class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  v-model="passwordConfirmation"
                  type="password"
                  required
                  placeholder="Répétez mot de passe"
                  class="w-full pl-10 pr-3 py-2.5 apple-glass-input rounded-xl text-sm placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-sm shadow-blue-500/25 active:scale-[0.99]"
          >
            <span v-if="!isLoading">Créer mon compte</span>
            <span v-else>Création en cours...</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4" />
          </button>
        </form>

        <!-- Footer link to login -->
        <div class="mt-6 pt-6 border-t border-slate-200/50 text-center text-xs text-slate-500">
          Déjà un compte ?
          <NuxtLink to="/login" class="font-semibold text-blue-600 hover:text-blue-700 ml-1 transition">
            Se connecter
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
