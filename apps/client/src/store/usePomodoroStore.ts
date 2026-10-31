import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TimerMode, UserSettings, Task, PomodoroSession, UserProfile } from '@pomodoro/shared';
import { apiClient } from '../utils/api';

interface PomodoroState {
  // Optional Auth & Cloud Sync State
  user: UserProfile | null;
  token: string | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;

  // Auth & Sync Actions
  setAuth: (user: UserProfile, token: string) => Promise<void>;
  logout: () => void;
  syncWithCloud: () => Promise<void>;

  // Settings
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;

  // Timer State
  mode: TimerMode;
  remainingSeconds: number;
  isRunning: boolean;
  sessionStartedAt: string | null;
  completedPomodorosInCycle: number;

  // Timer Actions
  setMode: (mode: TimerMode) => void;
  setRemainingSeconds: (seconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  completeCurrentSession: (wasSkipped?: boolean) => void;

  // Tasks State
  tasks: Task[];
  activeTaskId: string | null;

  // Task Actions
  addTask: (title: string, estimatedPomodoros: number, note?: string) => void;
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'note' | 'estimatedPomodoros' | 'isCompleted'>>
  ) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
  setActiveTask: (id: string | null) => void;

  // Sessions History (Local-first analytics & cloud sync queue)
  sessions: PomodoroSession[];
  clearHistory: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  pomodoroDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  alarmSound: 'bell',
  alarmVolume: 80,
  darkMode: true,
};

export const getDurationForMode = (mode: TimerMode, settings: UserSettings): number => {
  switch (mode) {
    case 'POMODORO':
      return settings.pomodoroDuration;
    case 'SHORT_BREAK':
      return settings.shortBreakDuration;
    case 'LONG_BREAK':
      return settings.longBreakDuration;
  }
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,

      setAuth: async (user, token) => {
        set({ user, token, syncError: null });
        await get().syncWithCloud();
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isSyncing: false,
          syncError: null,
        });
      },

      syncWithCloud: async () => {
        const { token, settings, tasks, sessions } = get();
        if (!token) return;

        set({ isSyncing: true, syncError: null });
        try {
          const merged = await apiClient.syncAll(token, {
            settings,
            tasks,
            sessions,
          });

          const currentState = get();
          const nextRemaining = currentState.isRunning
            ? currentState.remainingSeconds
            : getDurationForMode(currentState.mode, merged.settings);

          set({
            settings: merged.settings,
            tasks: merged.tasks.length > 0 ? merged.tasks : currentState.tasks,
            sessions: merged.sessions,
            remainingSeconds: nextRemaining,
            activeTaskId:
              currentState.activeTaskId &&
              merged.tasks.some((t) => t.id === currentState.activeTaskId)
                ? currentState.activeTaskId
                : merged.tasks[0]?.id ?? currentState.activeTaskId,
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
            syncError: null,
          });
        } catch (err) {
          set({
            isSyncing: false,
            syncError: err instanceof Error ? err.message : 'Không thể đồng bộ đám mây',
          });
        }
      },

      settings: DEFAULT_SETTINGS,

      updateSettings: (partial) => {
        const state = get();
        const nextSettings = { ...state.settings, ...partial };
        const nextRemaining = state.isRunning
          ? state.remainingSeconds
          : getDurationForMode(state.mode, nextSettings);

        set({
          settings: nextSettings,
          remainingSeconds: nextRemaining,
        });

        if (state.token) {
          apiClient.updateSettings(state.token, partial).catch(() => {});
        }
      },

      mode: 'POMODORO',
      remainingSeconds: DEFAULT_SETTINGS.pomodoroDuration,
      isRunning: false,
      sessionStartedAt: null,
      completedPomodorosInCycle: 0,

      setMode: (mode) =>
        set((state) => ({
          mode,
          isRunning: false,
          sessionStartedAt: null,
          remainingSeconds: getDurationForMode(mode, state.settings),
        })),

      setRemainingSeconds: (seconds) => set({ remainingSeconds: seconds }),

      startTimer: () =>
        set((state) => ({
          isRunning: true,
          sessionStartedAt: state.sessionStartedAt ?? new Date().toISOString(),
        })),

      pauseTimer: () => set({ isRunning: false }),

      resetTimer: () =>
        set((state) => ({
          isRunning: false,
          sessionStartedAt: null,
          remainingSeconds: getDurationForMode(state.mode, state.settings),
        })),

      completeCurrentSession: (wasSkipped = false) => {
        const state = get();
        const totalModeDuration = getDurationForMode(state.mode, state.settings);
        const elapsedSeconds = wasSkipped
          ? Math.max(0, totalModeDuration - state.remainingSeconds)
          : totalModeDuration;

        const nowIso = new Date().toISOString();
        const activeTask = state.tasks.find((t) => t.id === state.activeTaskId);

        const newSessions = [...state.sessions];
        let createdSession: PomodoroSession | null = null;

        if (!wasSkipped || elapsedSeconds >= 60) {
          createdSession = {
            id: crypto.randomUUID(),
            taskId: state.activeTaskId === 'welcome-task-1' ? null : state.activeTaskId,
            taskTitle: activeTask?.title,
            mode: state.mode,
            durationSeconds: elapsedSeconds,
            startedAt: state.sessionStartedAt ?? nowIso,
            endedAt: nowIso,
            isCompleted: !wasSkipped,
            synced: false,
          };
          newSessions.unshift(createdSession);
        }

        let updatedTasks = state.tasks;
        let nextCycleCount = state.completedPomodorosInCycle;
        let nextMode: TimerMode = 'POMODORO';

        if (state.mode === 'POMODORO') {
          if (!wasSkipped && state.activeTaskId) {
            updatedTasks = state.tasks.map((t) =>
              t.id === state.activeTaskId
                ? {
                    ...t,
                    completedPomodoros: t.completedPomodoros + 1,
                    updatedAt: nowIso,
                  }
                : t
            );
          }
          nextCycleCount = state.completedPomodorosInCycle + 1;
          const isLongBreakDue = nextCycleCount % state.settings.longBreakInterval === 0;
          nextMode = isLongBreakDue ? 'LONG_BREAK' : 'SHORT_BREAK';
        } else {
          nextMode = 'POMODORO';
        }

        const shouldAutoStart =
          nextMode === 'POMODORO'
            ? state.settings.autoStartPomodoros
            : state.settings.autoStartBreaks;

        const nextDuration = getDurationForMode(nextMode, state.settings);

        set({
          tasks: updatedTasks,
          sessions: newSessions,
          mode: nextMode,
          remainingSeconds: nextDuration,
          completedPomodorosInCycle: nextCycleCount,
          isRunning: !wasSkipped && shouldAutoStart,
          sessionStartedAt: !wasSkipped && shouldAutoStart ? nowIso : null,
        });

        // Push session to Cloud if user is logged in
        if (state.token && createdSession) {
          apiClient
            .createSession(state.token, createdSession)
            .then(() => {
              set((curr) => ({
                sessions: curr.sessions.map((s) =>
                  s.id === createdSession!.id ? { ...s, synced: true } : s
                ),
                lastSyncedAt: new Date().toISOString(),
              }));
            })
            .catch(() => {});
        }
      },

      tasks: [
        {
          id: 'welcome-task-1',
          title: 'Hoàn thành phiên Pomodoro đầu tiên của bạn',
          note: 'Bấm vào task này để chọn làm mục tiêu hiện tại, sau đó nhấn Bắt đầu!',
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          isCompleted: false,
          orderIndex: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      activeTaskId: 'welcome-task-1',

      addTask: (title, estimatedPomodoros, note) => {
        const state = get();
        const now = new Date().toISOString();
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: title.trim(),
          note: note?.trim() || undefined,
          estimatedPomodoros: Math.max(1, estimatedPomodoros),
          completedPomodoros: 0,
          isCompleted: false,
          orderIndex: state.tasks.length,
          createdAt: now,
          updatedAt: now,
        };

        set({
          tasks: [...state.tasks, newTask],
          activeTaskId: state.activeTaskId ?? newTask.id,
        });

        if (state.token) {
          apiClient.createTask(state.token, newTask).catch(() => {});
        }
      },

      updateTask: (id, updates) => {
        const state = get();
        set({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        });

        if (state.token && id !== 'welcome-task-1') {
          apiClient.updateTask(state.token, id, updates).catch(() => {});
        }
      },

      toggleTaskComplete: (id) => {
        const state = get();
        const target = state.tasks.find((t) => t.id === id);
        if (!target) return;
        const nextCompleted = !target.isCompleted;

        set({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  isCompleted: nextCompleted,
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        });

        if (state.token && id !== 'welcome-task-1') {
          apiClient
            .updateTask(state.token, id, { isCompleted: nextCompleted })
            .catch(() => {});
        }
      },

      deleteTask: (id) => {
        const state = get();
        const remaining = state.tasks.filter((t) => t.id !== id);
        const nextActiveId =
          state.activeTaskId === id
            ? remaining.find((t) => !t.isCompleted)?.id ?? null
            : state.activeTaskId;

        set({
          tasks: remaining,
          activeTaskId: nextActiveId,
        });

        if (state.token && id !== 'welcome-task-1') {
          apiClient.deleteTask(state.token, id).catch(() => {});
        }
      },

      clearCompletedTasks: () => {
        const state = get();
        const completedIds = state.tasks
          .filter((t) => t.isCompleted && t.id !== 'welcome-task-1')
          .map((t) => t.id);
        const remaining = state.tasks.filter((t) => !t.isCompleted);
        const isActiveStillPresent = remaining.some((t) => t.id === state.activeTaskId);

        set({
          tasks: remaining,
          activeTaskId: isActiveStillPresent
            ? state.activeTaskId
            : remaining[0]?.id ?? null,
        });

        if (state.token) {
          completedIds.forEach((id) => {
            apiClient.deleteTask(state.token!, id).catch(() => {});
          });
        }
      },

      setActiveTask: (id) => set({ activeTaskId: id }),

      sessions: [],
      clearHistory: () => set({ sessions: [], completedPomodorosInCycle: 0 }),
    }),
    {
      name: 'pomofocus-local-storage-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        lastSyncedAt: state.lastSyncedAt,
        settings: state.settings,
        mode: state.mode,
        remainingSeconds: state.remainingSeconds,
        completedPomodorosInCycle: state.completedPomodorosInCycle,
        tasks: state.tasks,
        activeTaskId: state.activeTaskId,
        sessions: state.sessions,
      }),
    }
  )
);
