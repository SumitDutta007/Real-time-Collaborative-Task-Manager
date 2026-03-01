import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

export const taskApi = {
  getAll: (filter?: "created" | "assigned" | "all") =>
    api.get("/api/tasks", { params: { filter } }),
  getById: (id: string) => api.get(`/api/tasks/${id}`),
  create: (data: object) => api.post("/api/tasks", data),
  update: (id: string, data: object) => api.put(`/api/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
  updateStatus: (id: string, status: "PENDING" | "COMPLETED") =>
    api.patch(`/api/tasks/${id}/status`, { status }),
  assign: (id: string, data: { assigneeEmail?: string; assigneeId?: string }) =>
    api.patch(`/api/tasks/${id}/assign`, data),
};

export const projectApi = {
  getAll: () => api.get("/api/projects"),
  getById: (id: string) => api.get(`/api/projects/${id}`),
  create: (data: object) => api.post("/api/projects", data),
  update: (id: string, data: object) => api.put(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
  toggleFavorite: (id: string) => api.patch(`/api/projects/${id}/favorite`),
};

export const analyticsApi = {
  getStats: () => api.get("/api/analytics/stats"),
  getTasksByStatus: () => api.get("/api/analytics/tasks/by-status"),
  getTasksByPriority: () => api.get("/api/analytics/tasks/by-priority"),
  getTasksByProject: () => api.get("/api/analytics/tasks/by-project"),
  getCompletionTrend: (days?: number) =>
    api.get("/api/analytics/trends/completion", { params: { days } }),
  getRecentActivity: (limit?: number) =>
    api.get("/api/analytics/activity/recent", { params: { limit } }),
  getUserStats: () => api.get("/api/analytics/users/stats"),
  getProjectAnalytics: (projectId: string) =>
    api.get(`/api/analytics/projects/${projectId}`),
};

export const authApi = {
  syncUser: (data: { email: string; name: string; image?: string | null }) =>
    api.post("/api/auth/sync", data),
  verifyToken: () => api.get("/api/auth/verify"),
};
