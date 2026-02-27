export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED';
  creatorId: string;
  assigneeId?: string;
  pendingAssigneeEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  assigneeEmail?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'COMPLETED';
  assigneeEmail?: string;
}
