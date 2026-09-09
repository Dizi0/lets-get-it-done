export interface Task {
  id: string;
  shortDesc: string;
  longDesc?: string | null;
  dueDate: string;
  isCompleted: boolean;
  listId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  shortDesc: string;
  longDesc?: string;
  dueDate: string;
}

export interface UpdateTaskPayload {
  shortDesc?: string;
  longDesc?: string;
  dueDate?: string;
  isCompleted?: boolean;
}
