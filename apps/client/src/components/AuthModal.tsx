import { useState, useEffect, useRef } from 'react';
import {
  X,
  Cloud,
  Loader2,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiClient } from '../utils/api';
import { usePomodoroStore } from '../store/usePomodoroStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number;
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill';
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showEmailForm, setShowEmailForm] = useState(!GOOGLE_CLIENT_ID);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  const setAuth = usePomodoroStore((s) => s.setAuth);
  const tasksCount = usePomodoroStore(
    (s) => s.tasks.filter((t) => t.id !== 'welcome-task-1').length
  );
  const sessionsCount = usePomodoroStore((s) => s.sessions.length);

  // Load Google Identity Services SDK & render official 1-click button
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID) return;

    const handleGoogleCredential = async (response: { credential?: string }) => {
      if (!response.credential) return;
      setError(null);
      setLoading(true);
      try {
        const res = await apiClient.googleLogin(response.credential);
        await setAuth(res.user, res.token);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.');
      } finally {
        setLoading(false);
      }
    };

    const initGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      googleBtnContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'continue_with',
        shape: 'pill',
      });
    };

    const existingScript = document.getElementById('google-gsi-script') as HTMLScriptElement | null;
    if (existingScript) {
      initGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleButton;
    document.head.appendChild(script);
  }, [isOpen, onClose, setAuth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res =
        mode === 'login'
          ? await apiClient.login(email, password)
          : await apiClient.register(email, password, name);

      await setAuth(res.user, res.token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Lưu & Đồng bộ Tiến trình
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              1 chạm với Google để sao lưu công việc & lịch sử Pomodoro
            </p>
          </div>
        </div>

        {/* Info Banner about Local Merge */}
        {(tasksCount > 0 || sessionsCount > 0) && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>
              Bạn đang có <strong>{tasksCount} công việc</strong> và{' '}
              <strong>{sessionsCount} phiên Pomodoro</strong> trên máy. Khi đăng nhập, dữ liệu này sẽ tự động được gộp lên Cloud!
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Method: 1-Click Google OAuth2 */}
        <div className="space-y-3 mb-4">
          {GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center justify-center min-h-[44px]">
              <div ref={googleBtnContainerRef} className="flex justify-center w-full" />
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.9 7.4 24 12 24z"
                  />
                </svg>
                <span>Đăng nhập 1 chạm với Google</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Điền <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">VITE_GOOGLE_CLIENT_ID</code> vào file <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">apps/client/.env</code> để hiển thị nút Google Sign-In chính thức.
              </p>
            </div>
          )}
        </div>

        {/* Collapsible Email/Password Fallback */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowEmailForm((v) => !v)}
            className="w-full flex items-center justify-between py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <span>Hoặc dùng Email & Mật khẩu</span>
            {showEmailForm ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showEmailForm && (
            <div className="mt-3 space-y-3.5">
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng ký mới</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Minh Thắng"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ban@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý & đồng bộ...</span>
                    </>
                  ) : mode === 'login' ? (
                    <span>Đăng nhập & Đồng bộ</span>
                  ) : (
                    <span>Tạo tài khoản & Lưu tiến trình</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-4">
          Không bắt buộc: Bạn có thể đóng cửa sổ này và dùng tiếp ở chế độ Local.
        </p>
      </div>
    </div>
  );
}
