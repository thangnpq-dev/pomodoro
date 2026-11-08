import { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/useBrowserFeatures';

export function PWAInstallBanner() {
  const { canInstall, isIOSInstallable, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!canInstall && !isIOSInstallable) return null;

  return (
    <>
      {canInstall && (
        <button
          type="button"
          onClick={promptInstall}
          title="Cài đặt ứng dụng PomoFocus lên thiết bị"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cài App</span>
        </button>
      )}

      {isIOSInstallable && (
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Hướng dẫn cài ứng dụng trên iPhone/iPad"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cài lên iPhone</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cài PomoFocus lên iOS
                </h3>
                <p className="text-xs text-slate-500">Dùng toàn màn hình như ứng dụng thật</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70">
                <Share className="w-4 h-4 text-sky-500 shrink-0" />
                <span>
                  1. Nhấn vào nút <strong>Chia sẻ (Share)</strong> ở thanh công cụ trình duyệt Safari.
                </span>
              </li>
              <li className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70">
                <PlusSquare className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  2. Cuộn xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-semibold cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
