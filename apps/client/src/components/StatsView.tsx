import { useMemo, useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  Flame,
  CheckCircle,
  Trash2,
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { PomodoroSession } from '@pomodoro/shared';
import { usePomodoroStore } from '../store/usePomodoroStore';
import { apiClient } from '../utils/api';

const PAGE_SIZE = 5;

export function StatsView() {
  const { sessions, tasks, user, token, clearHistory } = usePomodoroStore();

  const [page, setPage] = useState(1);
  const [cloudPageItems, setCloudPageItems] = useState<PomodoroSession[] | null>(null);
  const [cloudTotal, setCloudTotal] = useState<number | null>(null);
  const [cloudTotalPages, setCloudTotalPages] = useState<number>(1);
  const [loadingPage, setLoadingPage] = useState(false);

  // Fetch paginated sessions from server when user is logged in
  useEffect(() => {
    if (!token) {
      setCloudPageItems(null);
      setCloudTotal(null);
      return;
    }

    let cancelled = false;
    setLoadingPage(true);

    apiClient
      .getSessionsPaginated(token, page, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setCloudPageItems(res.items);
        setCloudTotal(res.total);
        setCloudTotalPages(res.totalPages);
      })
      .catch(() => {
        // Fallback to local slice if offline or server error
        if (!cancelled) {
          setCloudPageItems(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPage(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, page, sessions.length]);

  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();

    const pomodoroSessions = sessions.filter((s) => s.mode === 'POMODORO');

    const todayFocusSeconds = pomodoroSessions
      .filter((s) => new Date(s.endedAt).toDateString() === todayStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);

    const totalFocusSeconds = pomodoroSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const completedSessionsCount = pomodoroSessions.filter((s) => s.isCompleted).length;

    // Calculate day streak
    const uniqueDays = new Set(
      pomodoroSessions.map((s) => new Date(s.endedAt).toISOString().slice(0, 10))
    );
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (uniqueDays.has(dateStr)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    // Last 7 days chart data
    const last7Days: { label: string; dateKey: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const daySeconds = pomodoroSessions
        .filter((s) => s.endedAt.slice(0, 10) === dateKey)
        .reduce((acc, s) => acc + s.durationSeconds, 0);

      last7Days.push({
        label: dayLabel,
        dateKey,
        minutes: Math.round(daySeconds / 60),
      });
    }

    return {
      todayMinutes: Math.round(todayFocusSeconds / 60),
      totalHours: (totalFocusSeconds / 3600).toFixed(1),
      completedSessionsCount,
      streak,
      last7Days,
    };
  }, [sessions]);

  const maxMinutesInWeek = Math.max(25, ...stats.last7Days.map((d) => d.minutes));
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;

  // Determine displayed items & pagination metadata (Cloud Paginated vs Local Paginated)
  const localTotal = sessions.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / PAGE_SIZE));
  const safeLocalPage = Math.min(page, localTotalPages);

  const displayedSessions =
    cloudPageItems ??
    sessions.slice((safeLocalPage - 1) * PAGE_SIZE, safeLocalPage * PAGE_SIZE);

  const totalCount = cloudTotal ?? localTotal;
  const totalPages = cloudPageItems ? cloudTotalPages : localTotalPages;
  const currentPage = Math.min(page, totalPages);

  const handleClearHistory = () => {
    clearHistory();
    setPage(1);
    setCloudPageItems([]);
    setCloudTotal(0);
    setCloudTotalPages(1);
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Hôm nay</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.todayMinutes} <span className="text-xs font-normal text-slate-500">phút</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Chuỗi ngày</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.streak} <span className="text-xs font-normal text-slate-500">ngày</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Đã xong</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.completedSessionsCount}{' '}
            <span className="text-xs font-normal text-slate-500">phiên 🍅</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sky-500 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng giờ</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalHours}{' '}
            <span className="text-xs font-normal text-slate-500">giờ ({completedTasksCount} việc)</span>
          </p>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Biểu đồ tập trung 7 ngày qua
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user
                ? 'Tính theo số phút tập trung (Đã đồng bộ Cloud)'
                : 'Tính theo số phút tập trung (Lưu trên thiết bị)'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-6">
          {stats.last7Days.map((day) => {
            const heightPercent = Math.max(6, Math.round((day.minutes / maxMinutesInWeek) * 100));
            return (
              <div key={day.dateKey} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {day.minutes > 0 ? `${day.minutes}p` : ''}
                </span>
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-xl h-28 flex items-end p-1">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-lg transition-all ${
                      day.minutes > 0
                        ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paginated Recent Sessions History */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <History className="w-5 h-5 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                Lịch sử phiên gần đây
              </h3>
              {totalCount > 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Tổng cộng {totalCount} phiên đã ghi nhận
                </p>
              )}
            </div>
          </div>
          {totalCount > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-rose-500/40 hover:text-rose-500 hover:bg-rose-500/5 transition cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Xóa lịch sử</span>
            </button>
          )}
        </div>

        {loadingPage ? (
          <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            <span>Đang tải trang {currentPage}...</span>
          </div>
        ) : displayedSessions.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">
            Chưa có phiên làm việc nào được ghi nhận. Hãy chạy thử một phiên Pomodoro nhé!
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {displayedSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {s.taskTitle ||
                        (s.mode === 'POMODORO' ? 'Phiên tập trung tự do' : 'Nghỉ giải lao')}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5 tabular-nums">
                      {new Date(s.endedAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold tabular-nums ${
                        s.mode === 'POMODORO'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {Math.max(1, Math.round(s.durationSeconds / 60))} phút
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Trang <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> /{' '}
                  {totalPages}
                </span>

                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || loadingPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages || loadingPage}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
