import { useAuthStore } from '~/stores/auth';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function useApi() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();

  async function customFetch<T = any>(
    request: string,
    options: Record<string, any> = {},
  ): Promise<T> {
    const url = request.startsWith('http')
      ? request
      : `${config.public.apiUrl}${request}`;

    const headers = {
      ...options.headers,
      ...(authStore.accessToken
        ? { Authorization: `Bearer ${authStore.accessToken}` }
        : {}),
    };

    try {
      return await $fetch<T>(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (error: any) {
      const status = error?.statusCode || error?.response?.status || error?.status;
      const isAuthRoute =
        request.includes('/auth/login') ||
        request.includes('/auth/register') ||
        request.includes('/auth/refresh');

      if (status === 401 && !options._retry && !isAuthRoute) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            options._retry = true;
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${token}`,
            };
            return customFetch<T>(request, options);
          });
        }

        options._retry = true;
        isRefreshing = true;

        try {
          const newAccessToken = await authStore.refreshAccessToken();
          if (newAccessToken) {
            processQueue(null, newAccessToken);
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${newAccessToken}`,
            };
            return await customFetch<T>(request, options);
          } else {
            throw new Error('Session expired');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          authStore.clearAuth();
          if (import.meta.client) {
            navigateTo('/login');
          }
          throw refreshErr;
        } finally {
          isRefreshing = false;
        }
      }
      throw error;
    }
  }

  return {
    fetch: customFetch,
  };
}
