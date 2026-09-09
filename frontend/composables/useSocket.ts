import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '~/stores/auth';
import { useListStore } from '~/stores/lists';
import { useTaskStore } from '~/stores/tasks';

let socketInstance: Socket | null = null;
let currentJoinedRoom: string | null = null;

export function useSocket() {
  const authStore = useAuthStore();
  const listStore = useListStore();
  const taskStore = useTaskStore();
  const config = useRuntimeConfig();

  function connect() {
    if (socketInstance?.connected) return socketInstance;
    if (!authStore.accessToken) return null;

    socketInstance = io(config.public.wsUrl, {
      auth: {
        token: authStore.accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to WebSocket server:', socketInstance?.id);
      // Join active list room if available
      if (listStore.currentListId) {
        joinRoom(listStore.currentListId);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      currentJoinedRoom = null;
    });

    socketInstance.on('connect_error', async (err) => {
      console.warn('⚠️ WebSocket auth/connection error:', err.message);
      // If token expired, try refreshing
      if (err.message.includes('token') || err.message.includes('auth')) {
        const newToken = await authStore.refreshAccessToken();
        if (newToken && socketInstance) {
          socketInstance.auth = { token: newToken };
          socketInstance.connect();
        }
      }
    });

    // Real-time Event Subscriptions
    socketInstance.on('task:created', (task) => {
      console.log('📥 Real-time event [task:created]:', task);
      taskStore.onTaskCreated(task);
      if (task.listId) {
        listStore.updateTaskCount(task.listId, 1);
      }
    });

    socketInstance.on('task:updated', (task) => {
      console.log('📥 Real-time event [task:updated]:', task);
      taskStore.onTaskUpdated(task);
    });

    socketInstance.on('task:completed', (task) => {
      console.log('📥 Real-time event [task:completed]:', task);
      taskStore.onTaskUpdated(task);
    });

    socketInstance.on('task:deleted', (data: { taskId: string; listId: string }) => {
      console.log('📥 Real-time event [task:deleted]:', data);
      taskStore.onTaskDeleted(data.taskId, data.listId);
      if (data.listId) {
        listStore.updateTaskCount(data.listId, -1);
      }
    });

    return socketInstance;
  }

  function joinRoom(listId: string) {
    if (!socketInstance || !socketInstance.connected) {
      connect();
    }
    if (currentJoinedRoom === listId) return;

    if (currentJoinedRoom) {
      leaveRoom(currentJoinedRoom);
    }

    socketInstance?.emit('joinList', { listId });
    currentJoinedRoom = listId;
    console.log(`📡 Subscribed to WebSocket room: list:${listId}`);
  }

  function leaveRoom(listId: string) {
    if (socketInstance?.connected) {
      socketInstance.emit('leaveList', { listId });
      console.log(`📡 Left WebSocket room: list:${listId}`);
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
      console.log('🔌 WebSocket disconnected cleanly');
    }
  }

  return {
    connect,
    joinRoom,
    leaveRoom,
    disconnect,
  };
}
