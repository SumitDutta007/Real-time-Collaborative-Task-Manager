export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  progress: number;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToEmail?: string | null;
  assignedTo?: User | null;
  createdBy: User;
  projectId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  tasks: Task[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  assignedToEmail?: string;
  projectId?: string;
}
