import { useState, useEffect } from 'react';
import { Timer, BarChart2, Settings, CloudOff, Flame } from 'lucide-react';
import { usePomodoroStore } from './store/usePomodoroStore';
import { TimerCard } from './components/TimerCard';
import { TaskList } from './components/TaskList';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';

type ActiveTab = 'timer' | 'stats' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');
  const darkMode = usePomodoroStore((state) => state.settings.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-20 sm:pb-10">
      {/* Top Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                PomoFocus
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <CloudOff className="w-3 h-3 text-emerald-500" />
                Local-First Mode (Không cần tài khoản)
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'timer'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Bộ đếm & Việc cần làm</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Thống kê</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài đặt</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {activeTab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <TimerCard />
            </div>
            <div className="lg:col-span-7">
              <TaskList />
            </div>
          </div>
        )}

        {activeTab === 'stats' && <StatsView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-around">
        <button
          type="button"
          onClick={() => setActiveTab('timer')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'timer'
              ? 'text-rose-500'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Timer className="w-5 h-5" />
          <span>Pomodoro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'stats'
              ? 'text-rose-500'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span>Thống kê</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'settings'
              ? 'text-rose-500'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Cài đặt</span>
        </button>
      </nav>
    </div>
  );
}
