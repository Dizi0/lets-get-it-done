import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (import.meta.client) {
    authStore.initializeFromStorage();
  }

  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(to.path);

  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo('/login');
  }

  if (authStore.isAuthenticated && isPublicRoute) {
    return navigateTo('/');
  }
});
