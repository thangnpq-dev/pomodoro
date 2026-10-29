import { Sliders, Volume2, Moon, Sun, PlayCircle, RotateCcw } from 'lucide-react';
import { usePomodoroStore } from '../store/usePomodoroStore';
import { soundEngine } from '../utils/sound';

export function SettingsView() {
  const { settings, updateSettings } = usePomodoroStore();

  const pomodoroMins = Math.round(settings.pomodoroDuration / 60);
  const shortBreakMins = Math.round(settings.shortBreakDuration / 60);
  const longBreakMins = Math.round(settings.longBreakDuration / 60);

  const handleResetDefaults = () => {
    updateSettings({
      pomodoroDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      alarmSound: 'bell',
      alarmVolume: 80,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Cài đặt bộ đếm & Giao diện
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tự động lưu trên thiết bị của bạn (không cần tài khoản)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Mặc định</span>
        </button>
      </div>

      {/* Time Durations */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Thời lượng (Phút)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Pomodoro (Tập trung)
            </label>
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
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Nghỉ ngắn (Short Break)
            </label>
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
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Nghỉ dài (Long Break)
            </label>
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
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Automation & Cycle */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Chu kỳ & Tự động chuyển
        </h3>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Số phiên Pomodoro trước kỳ nghỉ dài
            </p>
            <p className="text-xs text-slate-500">Mặc định sau 4 phiên sẽ có 1 lần nghỉ dài</p>
          </div>
          <input
            type="number"
            min={2}
            max={12}
            value={settings.longBreakInterval}
            onChange={(e) =>
              updateSettings({
                longBreakInterval: Math.max(2, Math.min(12, Number(e.target.value) || 4)),
              })
            }
            className="w-20 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-center text-slate-900 dark:text-white"
          />
        </div>

        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Tự động bắt đầu giờ nghỉ (Auto-start Breaks)
            </p>
            <p className="text-xs text-slate-500">
              Chuyển sang đếm ngược giờ nghỉ ngay khi xong Pomodoro
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoStartBreaks}
            onChange={(e) => updateSettings({ autoStartBreaks: e.target.checked })}
            className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Tự động bắt đầu Pomodoro mới (Auto-start Pomodoros)
            </p>
            <p className="text-xs text-slate-500">
              Tự động chạy phiên tập trung tiếp theo ngay khi hết giờ nghỉ
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoStartPomodoros}
            onChange={(e) => updateSettings({ autoStartPomodoros: e.target.checked })}
            className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Sound & Appearance */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Âm báo & Giao diện
        </h3>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Kiểu chuông báo hết giờ
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(['bell', 'digital', 'chime'] as const).map((sound) => (
                <button
                  key={sound}
                  type="button"
                  onClick={() => {
                    updateSettings({ alarmSound: sound });
                    soundEngine.playAlarm(sound, settings.alarmVolume);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer flex items-center gap-1 ${
                    settings.alarmSound === sound
                      ? 'bg-rose-500 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>{sound === 'bell' ? 'Chuông' : sound === 'digital' ? 'Điện tử' : 'Gió'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 w-24">
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

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {settings.darkMode ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Giao diện Tối (Dark Mode)
              </p>
              <p className="text-xs text-slate-500">Giúp dịu mắt khi tập trung ban đêm</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              settings.darkMode
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
            }`}
          >
            {settings.darkMode ? 'Đang bật Tối' : 'Đang bật Sáng'}
          </button>
        </div>
      </div>
    </div>
  );
}
