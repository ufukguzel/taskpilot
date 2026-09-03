import type { Metrics, Stats, Task, TaskInput, TaskRun } from "./types";

// In production (Vercel) point the frontend at the backend origin via
// VITE_API_BASE_URL; in dev it's empty and Vite proxies "/api" to :8000.
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const BASE = `${API_ORIGIN}/api`;
const TOKEN_KEY = "taskpilot_token";

export const auth = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Thrown on 401 so the UI can drop back to the login screen. */
export class AuthError extends Error {}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = auth.get();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    auth.clear();
    throw new AuthError("Oturum gerekli");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? "Giriş başarısız");
    }
    const data = (await res.json()) as { access_token: string };
    auth.set(data.access_token);
    return data;
  },
  me: () => request<{ id: number; username: string }>("/auth/me"),
  health: () =>
    request<{ status: string; demo_mode: boolean; demo_user: string | null }>("/health"),
  logout: () => auth.clear(),

  listTasks: () => request<Task[]>("/tasks"),
  createTask: (data: TaskInput) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: number, data: Partial<TaskInput>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
  runTask: (id: number) => request<TaskRun>(`/tasks/${id}/run`, { method: "POST" }),
  taskRuns: (id: number) => request<TaskRun[]>(`/tasks/${id}/runs`),
  stats: () => request<Stats>("/stats"),
  metrics: () => request<Metrics>("/stats/metrics"),
};
