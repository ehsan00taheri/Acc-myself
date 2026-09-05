import React from 'react';
import { Smartphone, Download, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { canInstall, isInstalled, dismiss, triggerInstall } = usePWAInstall();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <aside
      aria-label="نصب اپلیکیشن روی گوشی"
      className="w-full bg-linear-to-r from-indigo-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 border border-indigo-800/40 animate-fade-in"
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
          <Smartphone className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-white">
              نصب وب‌اپلیکیشن روی گوشی (اندروید)
            </h3>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-1.5 py-0.2 rounded-md font-medium">
              PWA
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            اجرای سریع، دسترسی بدون باز کردن مرورگر و قابلیت کارکرد به صورت آفلاین
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          id="pwa-install-action-btn"
          type="button"
          onClick={triggerInstall}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>نصب روی گوشی</span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="بستن اعلان نصب"
          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
