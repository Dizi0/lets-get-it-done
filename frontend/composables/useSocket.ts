import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '~/stores/auth';
import { useListStore } from '~/stores/lists';
import { useTaskStore } from '~/stores/tasks';

let socketInstance: Socket | null = null;
let currentJoinedRoom: string | null = null;
let isConnecting = false;

export function useSocket() {
  const authStore = useAuthStore();
  const listStore = useListStore();
  const taskStore = useTaskStore();
  const config = useRuntimeConfig();

  function connect(): Socket | null {
    if (typeof window === 'undefined') return null;
    if (!authStore.accessToken) return null;

    if (socketInstance) {
      if (socketInstance.connected) {
        return socketInstance;
      }
      if (isConnecting) {
        return socketInstance;
      }
    }

    isConnecting = true;

    socketInstance = io(config.public.wsUrl, {
      auth: {
        token: authStore.accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      isConnecting = false;
      console.log('[WebSocket] Connected to server:', socketInstance?.id);
      if (listStore.currentListId) {
        joinRoom(listStore.currentListId);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      isConnecting = false;
      console.log('[WebSocket] Disconnected:', reason);
      currentJoinedRoom = null;
    });

    socketInstance.on('connect_error', async (err) => {
      isConnecting = false;
      console.warn('[WebSocket] Connection notice:', err.message);
      // Try refreshing access token once if rejected
      if (authStore.isAuthenticated) {
        const newToken = await authStore.refreshAccessToken();
        if (newToken && socketInstance) {
          socketInstance.auth = { token: newToken };
        }
      }
    });

    // Real-time Event Subscriptions
    socketInstance.on('task:created', (task) => {
      taskStore.onTaskCreated(task);
      if (task.listId) {
        listStore.updateTaskCount(task.listId, 1);
      }
    });

    socketInstance.on('task:updated', (task) => {
      taskStore.onTaskUpdated(task);
    });

    socketInstance.on('task:completed', (task) => {
      taskStore.onTaskUpdated(task);
    });

    socketInstance.on('task:deleted', (data: { taskId: string; listId: string }) => {
      taskStore.onTaskDeleted(data.taskId, data.listId);
      if (data.listId) {
        listStore.updateTaskCount(data.listId, -1);
      }
    });

    return socketInstance;
  }

  function joinRoom(listId: string) {
    if (!listId) return;
    if (!socketInstance || !socketInstance.connected) {
      connect();
    }
    if (currentJoinedRoom === listId) return;

    if (currentJoinedRoom && socketInstance?.connected) {
      leaveRoom(currentJoinedRoom);
    }

    if (socketInstance?.connected) {
      socketInstance.emit('joinList', { listId });
      currentJoinedRoom = listId;
    }
  }

  function leaveRoom(listId: string) {
    if (socketInstance?.connected && listId) {
      socketInstance.emit('leaveList', { listId });
    }
    if (currentJoinedRoom === listId) {
      currentJoinedRoom = null;
    }
  }

  function disconnect() {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      currentJoinedRoom = null;
      isConnecting = false;
    }
  }

  return {
    connect,
    joinRoom,
    leaveRoom,
    disconnect,
  };
}
