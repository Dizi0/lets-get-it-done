import { defineStore } from 'pinia';
import type { User, AuthResponse, RegisterPayload, LoginPayload } from '~/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  function setAuth(data: AuthResponse) {
    accessToken.value = data.accessToken;
    user.value = data.user;
    if (import.meta.client) {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }
  }

  function clearAuth() {
    accessToken.value = null;
    user.value = null;
    if (import.meta.client) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
    }
  }

  function initializeFromStorage() {
    if (import.meta.client && !isInitialized.value) {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user_data');
      if (storedToken && storedUser) {
        try {
          accessToken.value = storedToken;
          user.value = JSON.parse(storedUser);
        } catch {
          clearAuth();
        }
      }
      isInitialized.value = true;
    }
  }

  async function login(payload: LoginPayload) {
    const config = useRuntimeConfig();
    const response = await $fetch<AuthResponse>(`${config.public.apiUrl}/api/auth/login`, {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });
    setAuth(response);
    return response;
  }

  async function register(payload: RegisterPayload) {
    const config = useRuntimeConfig();
    const response = await $fetch<AuthResponse>(`${config.public.apiUrl}/api/auth/register`, {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });
    setAuth(response);
    return response;
  }

  async function logout() {
    const config = useRuntimeConfig();
    try {
      if (accessToken.value) {
        await $fetch(`${config.public.apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken.value}` },
          credentials: 'include',
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuth();
      navigateTo('/login');
    }
  }

  async function refreshAccessToken(): Promise<string | null> {
    const config = useRuntimeConfig();
    try {
      const response = await $fetch<AuthResponse>(`${config.public.apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      setAuth(response);
      return response.accessToken;
    } catch (error) {
      clearAuth();
      return null;
    }
  }

  async function fetchMe() {
    if (!accessToken.value) return null;
    const config = useRuntimeConfig();
    try {
      const profile = await $fetch<User>(`${config.public.apiUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken.value}` },
        credentials: 'include',
      });
      user.value = profile;
      if (import.meta.client) {
        localStorage.setItem('user_data', JSON.stringify(profile));
      }
      return profile;
    } catch {
      return null;
    }
  }

  return {
    user,
    accessToken,
    isInitialized,
    isAuthenticated,
    setAuth,
    clearAuth,
    initializeFromStorage,
    login,
    register,
    logout,
    refreshAccessToken,
    fetchMe,
  };
});
