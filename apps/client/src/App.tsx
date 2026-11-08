import { useState, useEffect } from 'react';
import {
  Timer,
  BarChart2,
  Settings,
  CloudOff,
  Cloud,
  Flame,
  UserCheck,
  WifiOff,
} from 'lucide-react';
import { usePomodoroStore } from './store/usePomodoroStore';
import { TimerCard } from './components/TimerCard';
import { TaskList } from './components/TaskList';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { useNetworkStatus } from './hooks/useBrowserFeatures';

type ActiveTab = 'timer' | 'stats' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isOnline = useNetworkStatus();
  const darkMode = usePomodoroStore((state) => state.settings.darkMode);
  const user = usePomodoroStore((state) => state.user);
  const token = usePomodoroStore((state) => state.token);
  const isSyncing = usePomodoroStore((state) => state.isSyncing);
  const syncWithCloud = usePomodoroStore((state) => state.syncWithCloud);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Automatically sync when coming back online or opening the app while logged in
  useEffect(() => {
    if (!token) return;
    syncWithCloud();

    const handleOnline = () => {
      syncWithCloud();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [token, syncWithCloud]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-24 md:pb-10">
      {/* Top Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                PomoFocus
              </h1>
              {!isOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 truncate">
                  <WifiOff className="w-3 h-3 shrink-0" />
                  Đang Offline (Tự lưu trên máy)
                </span>
              ) : user ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                  <Cloud className="w-3 h-3 shrink-0" />
                  {isSyncing ? 'Đang đồng bộ...' : 'Đã đồng bộ Cloud'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <CloudOff className="w-3 h-3 text-amber-500 shrink-0" />
                  Local Mode
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'timer'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Bộ đếm & Việc</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài đặt</span>
            </button>
          </nav>

          {/* Clean Header Actions: PWA Install + Profile Pill (Sync/Logout moved to Settings) */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallBanner />

            {user ? (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title="Quản lý tài khoản & đồng bộ trong Cài đặt"
                className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-500 text-xs font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Lưu tiến trình</span>
              </button>
            )}
          </div>
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

        {activeTab === 'settings' && (
          <SettingsView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 pt-2 safe-area-bottom flex items-center justify-around">
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

      {/* Optional Login/Register Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
