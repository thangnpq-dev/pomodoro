import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TimerMode, UserSettings, Task, PomodoroSession } from '@pomodoro/shared';

interface PomodoroState {
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
  updateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'note' | 'estimatedPomodoros' | 'isCompleted'>>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
  setActiveTask: (id: string | null) => void;

  // Sessions History (Local-first analytics & future cloud sync queue)
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
      settings: DEFAULT_SETTINGS,

      updateSettings: (partial) =>
        set((state) => {
          const nextSettings = { ...state.settings, ...partial };
          // If timer is not currently running, update remainingSeconds to match new duration for current mode
          const nextRemaining = state.isRunning
            ? state.remainingSeconds
            : getDurationForMode(state.mode, nextSettings);

          return {
            settings: nextSettings,
            remainingSeconds: nextRemaining,
          };
        }),

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

        // Record session if it wasn't skipped or if user focused for at least 60s
        const newSessions = [...state.sessions];
        if (!wasSkipped || elapsedSeconds >= 60) {
          newSessions.unshift({
            id: crypto.randomUUID(),
            taskId: state.activeTaskId,
            taskTitle: activeTask?.title,
            mode: state.mode,
            durationSeconds: elapsedSeconds,
            startedAt: state.sessionStartedAt ?? nowIso,
            endedAt: nowIso,
            isCompleted: !wasSkipped,
            synced: false,
          });
        }

        // Update task completedPomodoros if this was a completed POMODORO
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

      addTask: (title, estimatedPomodoros, note) =>
        set((state) => {
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
          return {
            tasks: [...state.tasks, newTask],
            activeTaskId: state.activeTaskId ?? newTask.id,
          };
        }),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        })),

      toggleTaskComplete: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  isCompleted: !task.isCompleted,
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => {
          const remaining = state.tasks.filter((t) => t.id !== id);
          const nextActiveId =
            state.activeTaskId === id
              ? remaining.find((t) => !t.isCompleted)?.id ?? null
              : state.activeTaskId;
          return {
            tasks: remaining,
            activeTaskId: nextActiveId,
          };
        }),

      clearCompletedTasks: () =>
        set((state) => {
          const remaining = state.tasks.filter((t) => !t.isCompleted);
          const isActiveStillPresent = remaining.some((t) => t.id === state.activeTaskId);
          return {
            tasks: remaining,
            activeTaskId: isActiveStillPresent
              ? state.activeTaskId
              : remaining[0]?.id ?? null,
          };
        }),

      setActiveTask: (id) => set({ activeTaskId: id }),

      sessions: [],
      clearHistory: () => set({ sessions: [], completedPomodorosInCycle: 0 }),
    }),
    {
      name: 'pomofocus-local-storage-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
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
