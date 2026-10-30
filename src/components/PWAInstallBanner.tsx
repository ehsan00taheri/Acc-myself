import React, { useState } from 'react';
import { Smartphone, Download, X, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { canInstall, isInstalled, dismiss, triggerInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <aside
      aria-label="نصب اپلیکیشن روی گوشی"
      className="w-full bg-linear-to-r from-indigo-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex flex-col gap-3 border border-indigo-800/40 animate-fade-in"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            <Smartphone className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                نصب وب‌اپلیکیشن روی گوشی (PWA)
              </h3>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-1.5 py-0.2 rounded-md font-medium">
                اندروید / iOS
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              ذخیره‌سازی آفلاین اطلاعات روی حافظه گوشی + دسترسی مستقیم از صفحه اصلی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {canInstall ? (
            <button
              id="pwa-install-action-btn"
              type="button"
              onClick={triggerInstall}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>نصب فوری روی گوشی</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
              <span>راهنمای افزودن به صفحه اصلی</span>
            </button>
          )}

          <button
            type="button"
            onClick={dismiss}
            aria-label="بستن اعلان نصب"
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="pt-2 border-t border-white/10 text-xs text-slate-200 leading-relaxed space-y-1.5 animate-fade-in">
          <p className="font-semibold text-white">نحوه نصب در مرورگر گوشی:</p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
            <li><strong>در کروم اندروید:</strong> منوی سه‌نقطه بالا سمت راست را باز کرده و گزینه <span className="text-white font-bold">«افزودن به صفحه اصلی» (Add to Home screen)</span> یا <span className="text-white font-bold">«نصب برنامه» (Install app)</span> را انتخاب کنید.</li>
            <li><strong>در سافاری آیفون:</strong> دکمه اشتراک‌گذاری (Share) در پایین صفحه را زده و <span className="text-white font-bold">«Add to Home Screen»</span> را لمس فرمایید.</li>
          </ul>
        </div>
      )}
    </aside>
  );
};
