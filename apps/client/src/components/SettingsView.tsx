import { useState, useEffect } from 'react';
import {
  Sliders,
  Volume2,
  Moon,
  Sun,
  PlayCircle,
  Square,
  RotateCcw,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  UserCheck,
  Plus,
  Minus,
} from 'lucide-react';
import { usePomodoroStore } from '../store/usePomodoroStore';
import { soundEngine } from '../utils/sound';
import { useNetworkStatus } from '../hooks/useBrowserFeatures';

interface SettingsViewProps {
  onOpenAuthModal: () => void;
}

interface IOSToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}

function IOSToggle({ checked, onChange, label }: IOSToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface ThemeSwitchProps {
  darkMode: boolean;
  onChange: (dark: boolean) => void;
}

function ThemeSwitch({ darkMode, onChange }: ThemeSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label="Chuyển đổi giao diện Sáng / Tối"
      onClick={() => onChange(!darkMode)}
      className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-300 ease-out border ${
        darkMode
          ? 'bg-slate-700/90 border-slate-600 shadow-inner shadow-slate-950/60'
          : 'bg-slate-200/90 border-white shadow-inner shadow-slate-400/40'
      }`}
    >
      {/* Background Track Icons */}
      <span className="flex w-full items-center justify-between px-2 pointer-events-none">
        <Sun
          className={`w-4 h-4 transition-opacity duration-300 ${
            darkMode ? 'text-slate-400 opacity-60' : 'opacity-0'
          }`}
        />
        <div
          className={`relative transition-opacity duration-300 ${
            darkMode ? 'opacity-0' : 'text-slate-400 opacity-65'
          }`}
        >
          <Moon className="w-4 h-4" />
        </div>
      </span>

      {/* Raised Sliding Knob with Active Icon */}
      <span
        className={`pointer-events-none absolute top-0.5 left-0.5 flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform duration-300 ease-out ${
          darkMode ? 'translate-x-10' : 'translate-x-0'
        }`}
      >
        {darkMode ? (
          <svg
            className="w-5 h-5 text-indigo-600 transition-transform duration-300 rotate-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            <path d="M19 3v4" />
            <path d="M21 5h-4" />
          </svg>
        ) : (
          <Sun className="w-5 h-5 text-amber-500 transition-transform duration-300 rotate-0" />
        )}
      </span>
    </button>
  );
}

export function SettingsView({ onOpenAuthModal }: SettingsViewProps) {
  const {
    settings,
    updateSettings,
    user,
    isSyncing,
    lastSyncedAt,
    syncWithCloud,
    logout,
  } = usePomodoroStore();
  const isOnline = useNetworkStatus();
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    return () => {
      soundEngine.stopAlarm();
    };
  }, []);

  const pomodoroMins = Math.round(settings.pomodoroDuration / 60);
  const shortBreakMins = Math.round(settings.shortBreakDuration / 60);
  const longBreakMins = Math.round(settings.longBreakDuration / 60);
  const currentAlarmDuration = settings.alarmDuration ?? 5;

  const handleResetDefaults = () => {
    soundEngine.stopAlarm();
    setIsPlayingPreview(false);
    updateSettings({
      pomodoroDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      alarmSound: 'bell',
      alarmVolume: 80,
      alarmDuration: 5,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-xl shadow-slate-900/5 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              Cài đặt & Tài khoản
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Tự động lưu trên máy & đồng bộ Cloud
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Mặc định</span>
        </button>
      </div>

      {/* Cloud Account & Sync Management */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Tài khoản & Đồng bộ đám mây (Cloud Sync)
        </h3>

        {user ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-base shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Cloud className="w-3 h-3" />
                    Đã kết nối
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                {lastSyncedAt && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Đồng bộ lần cuối:{' '}
                    {new Date(lastSyncedAt).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => syncWithCloud()}
                disabled={isSyncing || !isOnline}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-rose-500' : ''}`}
                />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-500/25 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                <CloudOff className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Đang dùng chế độ Local (Chưa đăng nhập)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đăng nhập bằng Google để sao lưu tiến trình lên đám mây và đồng bộ giữa máy tính & điện thoại.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Kết nối tài khoản</span>
            </button>
          </div>
        )}
      </div>

      {/* Time Durations */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Thời lượng (Phút)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex sm:flex-col items-center sm:items-stretch justify-between gap-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Pomodoro (Tập trung)
            </label>
            <div className="inline-flex items-center justify-between p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    pomodoroDuration: Math.max(1, pomodoroMins - 5) * 60,
                  })
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={120}
                value={pomodoroMins}
                onChange={(e) =>
                  updateSettings({
                    pomodoroDuration: Math.max(1, Math.min(120, Number(e.target.value) || 1)) * 60,
                  })
                }
                className="w-14 text-center bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    pomodoroDuration: Math.min(120, pomodoroMins + 5) * 60,
                  })
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex sm:flex-col items-center sm:items-stretch justify-between gap-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nghỉ ngắn (Short Break)
            </label>
            <div className="inline-flex items-center justify-between p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    shortBreakDuration: Math.max(1, shortBreakMins - 1) * 60,
                  })
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={60}
                value={shortBreakMins}
                onChange={(e) =>
                  updateSettings({
                    shortBreakDuration: Math.max(1, Math.min(60, Number(e.target.value) || 1)) * 60,
                  })
                }
                className="w-14 text-center bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    shortBreakDuration: Math.min(60, shortBreakMins + 1) * 60,
                  })
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex sm:flex-col items-center sm:items-stretch justify-between gap-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nghỉ dài (Long Break)
            </label>
            <div className="inline-flex items-center justify-between p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    longBreakDuration: Math.max(1, longBreakMins - 5) * 60,
                  })
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={90}
                value={longBreakMins}
                onChange={(e) =>
                  updateSettings({
                    longBreakDuration: Math.max(1, Math.min(90, Number(e.target.value) || 1)) * 60,
                  })
                }
                className="w-14 text-center bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    longBreakDuration: Math.min(90, longBreakMins + 5) * 60,
                  })
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Automation & Cycle */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Chu kỳ & Tự động chuyển
        </h3>

        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Số phiên Pomodoro trước kỳ nghỉ dài
            </p>
            <p className="text-xs text-slate-500">Mặc định sau 4 phiên sẽ có 1 lần nghỉ dài</p>
          </div>
          <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shrink-0">
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  longBreakInterval: Math.max(2, settings.longBreakInterval - 1),
                })
              }
              disabled={settings.longBreakInterval <= 2}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white tabular-nums select-none">
              {settings.longBreakInterval}
            </span>
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  longBreakInterval: Math.min(12, settings.longBreakInterval + 1),
                })
              }
              disabled={settings.longBreakInterval >= 12}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          onClick={() => updateSettings({ autoStartBreaks: !settings.autoStartBreaks })}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 cursor-pointer select-none"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Tự động bắt đầu giờ nghỉ
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuyển sang đếm ngược giờ nghỉ ngay khi xong Pomodoro
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <IOSToggle
              checked={settings.autoStartBreaks}
              onChange={(val) => updateSettings({ autoStartBreaks: val })}
              label="Tự động bắt đầu giờ nghỉ"
            />
          </div>
        </div>

        <div
          onClick={() => updateSettings({ autoStartPomodoros: !settings.autoStartPomodoros })}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 cursor-pointer select-none"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Tự động bắt đầu Pomodoro mới
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động chạy phiên tập trung tiếp theo ngay khi hết giờ nghỉ
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <IOSToggle
              checked={settings.autoStartPomodoros}
              onChange={(val) => updateSettings({ autoStartPomodoros: val })}
              label="Tự động bắt đầu Pomodoro mới"
            />
          </div>
        </div>
      </div>

      {/* Sound & Appearance */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Âm báo & Giao diện
        </h3>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-5">
          {/* Alarm Sound Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Kiểu chuông báo hết giờ
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isPlayingPreview) {
                    soundEngine.stopAlarm();
                    setIsPlayingPreview(false);
                  } else {
                    setIsPlayingPreview(true);
                    soundEngine.playAlarm(
                      settings.alarmSound,
                      settings.alarmVolume,
                      currentAlarmDuration,
                      () => setIsPlayingPreview(false)
                    );
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isPlayingPreview
                    ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-rose-500/40 hover:text-rose-500'
                }`}
              >
                {isPlayingPreview ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Dừng thử</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Nghe thử</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(['bell', 'digital', 'chime'] as const).map((sound) => (
                <button
                  key={sound}
                  type="button"
                  onClick={() => {
                    updateSettings({ alarmSound: sound });
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    settings.alarmSound === sound
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-500/40'
                  }`}
                >
                  <span>{sound === 'bell' ? 'Chuông' : sound === 'digital' ? 'Điện tử' : 'Gió'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Alarm Duration */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Thời lượng đổ chuông
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Chuông sẽ kêu lặp lại trong khoảng thời gian này
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 3, 5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    updateSettings({ alarmDuration: sec });
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition cursor-pointer ${
                    currentAlarmDuration === sec
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-500/40'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Alarm Volume */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
            <span className="text-xs font-medium text-slate-500 w-24 shrink-0 tabular-nums">
              Âm lượng: {settings.alarmVolume}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.alarmVolume}
              onChange={(e) => updateSettings({ alarmVolume: Number(e.target.value) })}
              className="flex-1 accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        <div
          onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            {settings.darkMode ? (
              <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Giao diện {settings.darkMode ? 'Tối (Dark Mode)' : 'Sáng (Light Mode)'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Giúp dịu mắt khi tập trung ban đêm
              </p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <ThemeSwitch
              darkMode={settings.darkMode}
              onChange={(val) => updateSettings({ darkMode: val })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
