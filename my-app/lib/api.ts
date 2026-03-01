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
  getAll: () => api.get("/api/tasks"),
  getById: (id: string) => api.get(`/api/tasks/${id}`),
  create: (data: object) => api.post("/api/tasks", data),
  update: (id: string, data: object) => api.patch(`/api/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
  complete: (id: string) => api.patch(`/api/tasks/${id}/complete`),
  updateProgress: (id: string, progress: number) =>
    api.patch(`/api/tasks/${id}/progress`, { progress }),
};

export const projectApi = {
  getAll: () => api.get("/api/projects"),
  getById: (id: string) => api.get(`/api/projects/${id}`),
  create: (data: object) => api.post("/api/projects", data),
  update: (id: string, data: object) => api.put(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
};

export const authApi = {
  login: (data: { email: string; password?: string; googleToken?: string }) =>
    api.post("/api/auth/login", data),
  register: (data: { name: string; email: string; password?: string }) =>
    api.post("/api/auth/register", data),
  me: () => api.get("/api/auth/me"),
};
