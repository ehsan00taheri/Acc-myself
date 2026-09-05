import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Cloud,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
  FileJson,
  ShieldCheck,
} from 'lucide-react';
import { Transaction } from '../types';
import { exportBackupJSON, exportToCSV, importBackupJSON } from '../services/storage';
import { toPersianDigits } from '../utils/persian';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImportTransactions: (imported: Transaction[], mode: 'replace' | 'merge') => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onImportTransactions,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    try {
      exportBackupJSON(transactions);
      setStatusMessage({
        text: `فایل پشتیبان JSON شامل ${toPersianDigits(transactions.length)} تراکنش دانلود شد. می‌توانید آن را در Google Drive خود ذخیره کنید.`,
        type: 'success',
      });
    } catch (e: any) {
      setStatusMessage({ text: 'خطا در خروجی فایل پشتیبان.', type: 'error' });
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(transactions);
      setStatusMessage({
        text: `گزارش اکسل (CSV) با موفقیت دانلود شد.`,
        type: 'success',
      });
    } catch (e: any) {
      setStatusMessage({ text: 'خطا در تولید فایل اکسل.', type: 'error' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importBackupJSON(file);
      onImportTransactions(imported, importMode);
      setStatusMessage({
        text: `تعداد ${toPersianDigits(imported.length)} تراکنش با موفقیت ${
          importMode === 'merge' ? 'ادغام شد' : 'جایگزین شد'
        }.`,
        type: 'success',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setStatusMessage({
        text: typeof err === 'string' ? err : 'فایل پشتیبان معتبر نیست.',
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* هدر مودال */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                مدیریت داده‌ها و پشتیبان‌گیری
              </h3>
              <p className="text-[11px] text-slate-500">
                ذخیره روی Google Drive، خروجی اکسل و بازیابی اطلاعات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* بدنه مودال */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* پیام وضعیت */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* بخش خروجی و ذخیره سازی */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>خروجی گرفتن و پشتیبان‌گیری</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* دکمه خروجی JSON */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-900 transition-all text-right group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <FileJson className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold">دانلود فایل پشتیبان (JSON)</div>
                  <div className="text-[10px] text-indigo-600/80 mt-0.5">
                    مناسب برای ذخیره در Google Drive
                  </div>
                </div>
              </button>

              {/* دکمه خروجی اکسل */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-900 transition-all text-right group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold">خروجی اکسل (CSV)</div>
                  <div className="text-[10px] text-emerald-600/80 mt-0.5">
                    سازگار با فونت فارسی اکسل
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* بخش بازیابی اطلاعات */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-amber-600" />
              <span>بازیابی از فایل پشتیبان</span>
            </h4>

            <div className="flex items-center gap-4 text-xs text-slate-600 mb-2">
              <span className="font-medium text-[11px]">نحوه بارگذاری:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>ادغام با داده‌های فعلی</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>جایگزینی کامل</span>
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-input"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>انتخاب و بارگذاری فایل پشتیبان (.json)</span>
            </button>
          </div>

          {/* راهنمای ذخیره روی گوگل درایو و توسعه آینده */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Cloud className="w-3.5 h-3.5 text-sky-600" />
              <span>چگونه داده‌ها را در Google Drive نگهداری کنیم؟</span>
            </div>
            <p className="leading-relaxed">
              با دانلود فایل JSON بالا، می‌توانید آن را در پوشه Google Drive خود کپی کنید تا همیشه یک نسخه امن ابری داشته باشید. هر زمان که در دستگاه دیگر بودید، می‌توانید همان فایل را در این بخش بازیابی کنید.
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>داده‌ها همیشه در حافظه مرورگر شما به صورت خودکار ذخیره می‌شوند.</span>
            </div>
          </div>
        </div>

        {/* فوتر مودال */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
