import type { Task } from './task'

export interface TaskList {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

export interface CreateListPayload {
  title: string;
}

export interface UpdateListPayload {
  title: string;
}
