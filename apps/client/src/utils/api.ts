import type {
  AuthResponse,
  CloudSyncPayload,
  CloudSyncResponse,
  PomodoroSession,
  Task,
  UserProfile,
  UserSettings,
} from '@pomodoro/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `Lỗi kết nối (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) errorMessage = data.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  googleLogin: (credential: string) =>
    request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: (token: string) => request<UserProfile>('/auth/me', { method: 'GET' }, token),

  syncAll: (token: string, payload: CloudSyncPayload) =>
    request<CloudSyncResponse>(
      '/sessions/sync',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    ),

  updateSettings: (token: string, settings: Partial<UserSettings>) =>
    request<UserSettings>(
      '/settings',
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      },
      token
    ),

  createTask: (token: string, task: Task) =>
    request<Task>(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify(task),
      },
      token
    ),

  updateTask: (token: string, id: string, updates: Partial<Task>) =>
    request<Task>(
      `/tasks/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      token
    ),

  deleteTask: (token: string, id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }, token),

  createSession: (token: string, session: PomodoroSession) =>
    request<PomodoroSession>(
      '/sessions',
      {
        method: 'POST',
        body: JSON.stringify(session),
      },
      token
    ),
};
