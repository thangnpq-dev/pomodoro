export type TimerMode = 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';

export interface UserSettings {
  pomodoroDuration: number; // in seconds, default 1500 (25m)
  shortBreakDuration: number; // in seconds, default 300 (5m)
  longBreakDuration: number; // in seconds, default 900 (15m)
  longBreakInterval: number; // default 4
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  alarmSound: 'bell' | 'digital' | 'chime';
  alarmVolume: number; // 0 to 100
  darkMode: boolean;
}

export interface Task {
  id: string;
  title: string;
  note?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroSession {
  id: string;
  taskId: string | null;
  taskTitle?: string;
  mode: TimerMode;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  isCompleted: boolean;
  synced?: boolean; // For Phase 2 Cloud Sync
}
