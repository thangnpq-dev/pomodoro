import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Flame, Coffee, Sparkles, Target } from 'lucide-react';
import type { TimerMode } from '@pomodoro/shared';
import { usePomodoroStore, getDurationForMode } from '../store/usePomodoroStore';
import { soundEngine } from '../utils/sound';
import { useNotification, useWakeLock } from '../hooks/useBrowserFeatures';

const MODE_CONFIG: Record<
  TimerMode,
  {
    label: string;
    shortLabel: string;
    accentText: string;
    accentBg: string;
    accentRing: string;
    strokeColor: string;
    badgeBg: string;
    icon: typeof Flame;
  }
> = {
  POMODORO: {
    label: 'Tập trung',
    shortLabel: 'Pomodoro',
    accentText: 'text-rose-500',
    accentBg: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25',
    accentRing: 'ring-rose-500/30',
    strokeColor: '#f43f5e',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: Flame,
  },
  SHORT_BREAK: {
    label: 'Nghỉ ngắn',
    shortLabel: 'Nghỉ ngắn',
    accentText: 'text-emerald-500',
    accentBg: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25',
    accentRing: 'ring-emerald-500/30',
    strokeColor: '#10b981',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Coffee,
  },
  LONG_BREAK: {
    label: 'Nghỉ dài',
    shortLabel: 'Nghỉ dài',
    accentText: 'text-sky-500',
    accentBg: 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/25',
    accentRing: 'ring-sky-500/30',
    strokeColor: '#0ea5e9',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    icon: Sparkles,
  },
};

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TimerCard() {
  const {
    mode,
    remainingSeconds,
    isRunning,
    settings,
    completedPomodorosInCycle,
    tasks,
    activeTaskId,
    setMode,
    setRemainingSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    completeCurrentSession,
  } = usePomodoroStore();

  const workerRef = useRef<Worker | null>(null);
  const { notify, requestPermission, permission } = useNotification();

  // Keep mobile screen awake while timer is running
  useWakeLock(isRunning);

  const totalSeconds = getDurationForMode(mode, settings);
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const currentConfig = MODE_CONFIG[mode];

  // Update document title with live timer
  useEffect(() => {
    const timeStr = formatTime(remainingSeconds);
    const modeLabel = currentConfig.label;
    document.title = `${timeStr} - ${modeLabel} | PomoFocus`;
  }, [remainingSeconds, currentConfig.label]);

  // Initialize Web Worker
  useEffect(() => {
    const worker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<{ type: 'TICK' | 'COMPLETE'; remainingSeconds?: number }>) => {
      if (e.data.type === 'TICK' && typeof e.data.remainingSeconds === 'number') {
        setRemainingSeconds(e.data.remainingSeconds);
      } else if (e.data.type === 'COMPLETE') {
        const state = usePomodoroStore.getState();
        soundEngine.playAlarm(state.settings.alarmSound, state.settings.alarmVolume);

        const finishedMode = state.mode;
        notify(
          finishedMode === 'POMODORO' ? 'Hoàn thành phiên Tập trung!' : 'Hết giờ nghỉ!',
          finishedMode === 'POMODORO'
            ? 'Tuyệt vời! Hãy dành chút thời gian nghỉ ngơi nhé.'
            : 'Đã đến lúc quay lại tập trung rồi!'
        );

        state.completeCurrentSession(false);
      }
    };

    return () => {
      worker.terminate();
    };
  }, [setRemainingSeconds, notify]);

  // Synchronize running state with Web Worker
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    if (isRunning) {
      const currentRemaining = usePomodoroStore.getState().remainingSeconds;
      const targetEndTime = Date.now() + currentRemaining * 1000;
      worker.postMessage({ type: 'START', targetEndTime });
    } else {
      worker.postMessage({ type: 'STOP' });
    }
  }, [isRunning, mode]);

  const handleToggleStart = () => {
    soundEngine.playClick(settings.alarmVolume);
    if (permission === 'default') {
      requestPermission();
    }
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handleReset = () => {
    soundEngine.playClick(settings.alarmVolume);
    resetTimer();
  };

  const handleSkip = () => {
    soundEngine.playClick(settings.alarmVolume);
    completeCurrentSession(true);
  };

  // SVG Circle dimensions
  const size = 280;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 backdrop-blur-md transition-colors">
      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl mb-8">
        {(['POMODORO', 'SHORT_BREAK', 'LONG_BREAK'] as TimerMode[]).map((m) => {
          const cfg = MODE_CONFIG[m];
          const Icon = cfg.icon;
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                soundEngine.playClick(settings.alarmVolume);
                setMode(m);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? cfg.accentText : ''}`} />
              <span>{cfg.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Circular Countdown Timer */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <div className="relative w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Progress */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={currentConfig.strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>

          {/* Center Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2 ${currentConfig.badgeBg}`}
            >
              #{completedPomodorosInCycle + 1} • {currentConfig.label}
            </span>
            <div className="text-6xl sm:text-7xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {formatTime(remainingSeconds)}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Chu kỳ nghỉ dài: {(completedPomodorosInCycle % settings.longBreakInterval) + 1}/
              {settings.longBreakInterval}
            </p>
          </div>
        </div>
      </div>

      {/* Active Task Banner */}
      <div className="mt-4 mb-6 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Target className={`w-4 h-4 shrink-0 ${currentConfig.accentText}`} />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
               Công việc đang chọn
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {activeTask ? activeTask.title : 'Chưa chọn công việc nào'}
            </p>
          </div>
        </div>
        {activeTask && (
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 tabular-nums">
            {activeTask.completedPomodoros}/{activeTask.estimatedPomodoros} 🍅
          </span>
        )}
      </div>

      {/* Primary Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          title="Đặt lại bộ đếm"
          className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleToggleStart}
          className={`flex-1 max-w-[200px] py-4 px-6 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2.5 text-base transition transform active:scale-95 cursor-pointer ${currentConfig.accentBg}`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Bắt đầu</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          title="Bỏ qua phiên hiện tại"
          className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
