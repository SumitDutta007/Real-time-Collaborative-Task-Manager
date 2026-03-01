export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "PENDING" | "COMPLETED";
  priority: "LOW" | "NORMAL" | "HIGH";
  progress: number;
  projectId: string;
  creatorId: string;
  assigneeId?: string | null;
  pendingAssigneeEmail?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: User;
  assignee?: User | null;
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  favorite: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: "LOW" | "NORMAL" | "HIGH";
  dueDate?: string;
  assigneeEmail?: string;
  projectId: string;
}
