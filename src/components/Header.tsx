import React from 'react';
import { WalletCards, RotateCcw, Calendar, HardDrive, CloudCheck, Tag } from 'lucide-react';
import { getFullPersianDateHeader, toPersianDigits } from '../utils/persian';

interface HeaderProps {
  transactionCount: number;
  onResetData: () => void;
  onOpenBackupModal: () => void;
  onOpenCategoryModal?: () => void;
  userEmail?: string | null;
}

/**
 * هدر اصلی برنامه با نمایش عنوان، تاریخ روز و کنترل پاک‌سازی و پشتیبان‌گیری داده‌ها
 */
export const Header: React.FC<HeaderProps> = ({
  transactionCount,
  onResetData,
  onOpenBackupModal,
  onOpenCategoryModal,
  userEmail,
}) => {
  const currentDate = getFullPersianDateHeader();

  const handleReset = () => {
    if (window.confirm('آیا از پاک‌سازی تمامی تراکنش‌ها و شروع مجدد با لیست خالی اطمینان دارید؟')) {
      onResetData();
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* عنوان و لوگوی اپلیکیشن */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <WalletCards className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  حسابداری شخصی هوشمند
                </h1>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-700">
                ثبت سریع دخل و خرج با هوش مصنوعی و همگام‌سازی ابری
              </p>
            </div>
          </div>

          {/* تعداد تراکنش‌ها در حالت موبایل */}
          <span className="sm:hidden text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            {toPersianDigits(transactionCount)} تراکنش
          </span>
        </div>

        {/* بخش تاریخ و دکمه‌های کنترل */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex-wrap">
          {userEmail && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg" title={`متصل به گوگل درایو: ${userEmail}`}>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline font-medium">درایو متصل</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/80 px-2.5 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{currentDate}</span>
          </div>

          {/* دکمه مدیریت دسته‌بندی‌ها */}
          {onOpenCategoryModal && (
            <button
              id="category-manager-btn"
              onClick={onOpenCategoryModal}
              title="مدیریت دسته‌بندی‌های شخصی و پیش‌فرض"
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-indigo-600 bg-slate-100/80 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>دسته‌بندی‌ها</span>
            </button>
          )}

          {/* دکمه پشتیبان‌گیری و انتقال داده‌ها */}
          <button
            id="backup-manager-btn"
            onClick={onOpenBackupModal}
            title="مدیریت پشتیبان و خروجی داده‌ها"
            className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span>پشتیبان‌گیری</span>
          </button>

          <button
            id="reset-data-button"
            onClick={handleReset}
            title="بازنشانی داده‌ها"
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بازنشانی</span>
          </button>
        </div>
      </div>
    </header>
  );
};


