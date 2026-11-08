import { useState } from 'react';
import {
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Check,
  X,
  ListTodo,
  Sparkles,
} from 'lucide-react';
import type { Task } from '@pomodoro/shared';
import { usePomodoroStore } from '../store/usePomodoroStore';

export function TaskList() {
  const {
    tasks,
    activeTaskId,
    settings,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    clearCompletedTasks,
    setActiveTask,
  } = usePomodoroStore();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [estimated, setEstimated] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editEstimated, setEditEstimated] = useState(1);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title, estimated, note);
    setTitle('');
    setNote('');
    setEstimated(1);
    setIsAdding(false);
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditNote(task.note || '');
    setEditEstimated(task.estimatedPomodoros);
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    updateTask(id, {
      title: editTitle.trim(),
      note: editNote.trim() || undefined,
      estimatedPomodoros: Math.max(1, editEstimated),
    });
    setEditingId(null);
  };

  const unfinishedTasks = tasks.filter((t) => !t.isCompleted);
  const remainingPomodoros = unfinishedTasks.reduce(
    (sum, t) => sum + Math.max(0, t.estimatedPomodoros - t.completedPomodoros),
    0
  );

  const estimatedFinishMinutes = Math.round(
    (remainingPomodoros * settings.pomodoroDuration) / 60
  );

  const hasCompletedTasks = tasks.some((t) => t.isCompleted);

  return (
    <div className="w-full bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md flex flex-col">
      {/* Header - Action button right on header, compact on mobile so it never wraps */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              Công việc hôm nay
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {remainingPomodoros > 0
                ? `Còn ${remainingPomodoros} 🍅 (~${estimatedFinishMinutes} phút)`
                : unfinishedTasks.length > 0
                ? `Còn ${unfinishedTasks.length} việc đang làm`
                : 'Đã hoàn thành hết mục tiêu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasCompletedTasks && (
            <button
              type="button"
              onClick={clearCompletedTasks}
              title="Xóa các công việc đã hoàn thành"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-300 hover:border-rose-500/40 hover:text-rose-500 hover:bg-rose-500/5 transition cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">Xóa việc đã xong</span>
            </button>
          )}
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Thêm</span>
              <span className="hidden sm:inline">việc</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3"
        >
          <input
            type="text"
            placeholder="Bạn đang cần tập trung làm gì?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <textarea
            placeholder="Ghi chú thêm (không bắt buộc)..."
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Dự kiến (🍅):
              </span>
              <div className="inline-flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setEstimated((v) => Math.max(1, v - 1))}
                  disabled={estimated <= 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white tabular-nums select-none">
                  {estimated}
                </span>
                <button
                  type="button"
                  onClick={() => setEstimated((v) => Math.min(20, v + 1))}
                  disabled={estimated >= 20}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Sparkles className="w-7 h-7 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Chưa có công việc nào
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Nhấn nút "+ Thêm" ở góc trên để tạo mục tiêu mới nhé!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isSelected = task.id === activeTaskId;
            const isEditing = task.id === editingId;

            if (isEditing) {
              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-rose-500/40 space-y-3"
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <textarea
                    rows={2}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Ghi chú..."
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Dự kiến (🍅):
                      </span>
                      <div className="inline-flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setEditEstimated((v) => Math.max(1, v - 1))}
                          disabled={editEstimated <= 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white tabular-nums select-none">
                          {editEstimated}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditEstimated((v) => Math.min(30, v + 1))}
                          disabled={editEstimated >= 30}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(task.id)}
                        className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={task.id}
                onClick={() => setActiveTask(task.id)}
                className={`group px-3.5 py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-500/50 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskComplete(task.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium leading-snug break-words ${
                        task.isCompleted
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.note && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {task.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 mr-0.5">
                    {task.completedPomodoros}/{task.estimatedPomodoros}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(task);
                    }}
                    title="Sửa công việc"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    title="Xóa công việc"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
