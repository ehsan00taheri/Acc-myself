import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Tag,
  PenTool,
  Plus,
  Calendar,
} from 'lucide-react';
import { Transaction, CustomCategory, TransactionType } from '../types';
import {
  getCurrentPersianDate,
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  formatPersianCurrency,
} from '../utils/persian';
import { CategoryIcon } from './CategoryIcon';

interface TransactionInputProps {
  onAddTransaction: (transaction: Transaction) => void;
  availableAccounts?: string[];
  customCategories?: CustomCategory[];
  onOpenCategoryManager?: () => void;
}

// مثال‌های آماده جهت تسهیل تست و ایده دادن به کاربر
const SUGGESTIONS = [
  'امروز برای ناهار ۳۵ هزار تومان با کارت ملی خرج کردم',
  'حقوق اردیبهشت ۱۵ میلیون به حساب بانک ملت',
  'خرید میوه و سوپرمارکت ۲۴۰ هزار تومان با بلو بانک',
  'کرایه اسنپ تا محل کار ۴۵ هزار تومن نقدی',
  'پرداخت قبض برق و گاز ۹۵ هزار تومان با کارت سامان',
];

/**
 * کامپوننت ورودی تراکنش:
 * امکان ثبت با تحلیل هوشمند متن یا ثبت دستی مستقیم با انتخاب دسته‌بندی‌های شخصی
 */
export const TransactionInput: React.FC<TransactionInputProps> = ({
  onAddTransaction,
  availableAccounts = DEFAULT_ACCOUNTS,
  customCategories = [],
  onOpenCategoryManager,
}) => {
  // حالت ثبت: هوش مصنوعی (ai) یا دستی (manual)
  const [entryMode, setEntryMode] = useState<'ai' | 'manual'>('ai');

  // متغیرهای حالت هوش مصنوعی
  const [inputText, setInputText] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('auto');
  const [overrideCategory, setOverrideCategory] = useState<string>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // متغیرهای حالت دستی
  const [manualTitle, setManualTitle] = useState('');
  const [manualAmountStr, setManualAmountStr] = useState('');
  const [manualType, setManualType] = useState<TransactionType>('expense');
  const [manualCategory, setManualCategory] = useState<string>('خوراک و نوشیدنی');
  const [manualAccount, setManualAccount] = useState<string>('کارت اصلی');
  const [manualDate, setManualDate] = useState<string>(getCurrentPersianDate());

  // تجمیع دسته‌های پیش‌فرض و شخصی
  const allCategories: CustomCategory[] = [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ];

  // لیست اسامی تمام دسته‌بندی‌ها برای هوش مصنوعی
  const allCategoryNames = Array.from(new Set(allCategories.map((c) => c.name)));

  // دسته‌های متناسب با نوع هزینه/درآمد در فرم دستی
  const manualRelevantCategories = allCategories.filter(
    (c) => c.type === 'both' || c.type === manualType
  );

  // ثبت به روش هوش مصنوعی
  const handleAISubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = inputText.trim();
    if (!trimmed) {
      setErrorMessage('لطفاً جمله‌ای درباره هزینه یا درآمد خود بنویسید.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const response = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          availableCategories: allCategoryNames,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.isValidTransaction) {
        setErrorMessage(
          data.errorMessage ||
            'متن وارد شده شامل اطلاعات تراکنش یا مبلغ مشخصی نیست. لطفاً مجدداً با ذکر مبلغ تلاش کنید.'
        );
        setIsLoading(false);
        return;
      }

      // تعیین حساب نهایی
      const finalAccount =
        selectedAccount !== 'auto'
          ? selectedAccount
          : data.account || 'کارت اصلی';

      // تعیین دسته‌بندی نهایی
      const finalCategory =
        overrideCategory !== 'auto'
          ? overrideCategory
          : data.category || 'سایر';

      // ایجاد شیء تراکنش جدید
      const newTransaction: Transaction = {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: data.title || 'تراکنش جدید',
        amount: Number(data.amount) || 0,
        type: data.type === 'income' ? 'income' : 'expense',
        category: finalCategory,
        account: finalAccount,
        persianDate: data.persianDate || getCurrentPersianDate(),
        createdAt: Date.now(),
        rawText: trimmed,
        note: data.note,
      };

      onAddTransaction(newTransaction);
      setInputText('');
      setSuccessInfo(
        `تراکنش «${newTransaction.title}» به دسته‌بندی [${newTransaction.category}] با موفقیت ثبت شد.`
      );

      setTimeout(() => {
        setSuccessInfo(null);
      }, 3500);
    } catch (err: any) {
      console.error('خطا در ارتباط با هوش مصنوعی:', err);
      setErrorMessage(
        'خطا در اتصال به سرویس تحلیل هوش مصنوعی. لطفاً دوباره تلاش کنید.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ثبت به روش دستی مستقیم
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = manualTitle.trim();
    if (!trimmedTitle) {
      setErrorMessage('لطفاً عنوان تراکنش را وارد کنید.');
      return;
    }

    const numAmount = Number(manualAmountStr.replace(/[^0-9]/g, '')) || 0;
    if (numAmount <= 0) {
      setErrorMessage('لطفاً مبلغ معتبری وارد کنید.');
      return;
    }

    const newTransaction: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: trimmedTitle,
      amount: numAmount,
      type: manualType,
      category: manualCategory || 'سایر',
      account: manualAccount || 'کارت اصلی',
      persianDate: manualDate.trim() || getCurrentPersianDate(),
      createdAt: Date.now(),
      rawText: trimmedTitle,
    };

    onAddTransaction(newTransaction);
    setManualTitle('');
    setManualAmountStr('');
    setErrorMessage(null);
    setSuccessInfo(`تراکنش «${newTransaction.title}» با موفقیت اضافه شد.`);

    setTimeout(() => {
      setSuccessInfo(null);
    }, 3500);
  };

  const handleApplySuggestion = (suggestion: string) => {
    setInputText(suggestion);
    setErrorMessage(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <section className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
      {/* هدر بخش و انتخاب حالت هوش مصنوعی / دستی */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            {entryMode === 'ai' ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <PenTool className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              ثبت تراکنش جدید
            </h2>
          </div>
        </div>

        {/* سوئیچ بین حالت هوش مصنوعی و فرم دستی */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setEntryMode('ai');
              setErrorMessage(null);
            }}
            className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              entryMode === 'ai'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>هوش مصنوعی</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEntryMode('manual');
              setErrorMessage(null);
            }}
            className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              entryMode === 'manual'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>ثبت دستی مستقیم</span>
          </button>
        </div>
      </div>

      {/* ۱. حالت هوش مصنوعی */}
      {entryMode === 'ai' && (
        <div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            به زبان عامیانه بنویسید؛ هوش مصنوعی مبلغ، نوع، کارت و مناسب‌ترین دسته‌بندی (شامل دسته‌های شخصی شما) را استخراج می‌کند.
          </p>

          <form onSubmit={handleAISubmit} className="space-y-2">
            <div className="relative">
              <input
                id="natural-language-input"
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="مثال: امروز ناهار ۳۵ هزار تومان با کارت ملی دادم..."
                disabled={isLoading}
                className="w-full px-4 py-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 disabled:opacity-60"
              />
            </div>

            {/* گزینه‌های تکمیلی (کارت پرداختی و دسته دلخواه) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* انتخابگر حساب */}
                <select
                  id="account-input-selector"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer font-medium"
                >
                  <option value="auto">💳 تشخیص خودکار حساب</option>
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>

                {/* پیش‌فرض یا اجبار به یک دسته‌بندی خاص */}
                <div className="flex items-center gap-1.5">
                  <select
                    id="category-override-selector"
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer font-medium"
                  >
                    <option value="auto">🏷️ تشخیص خودکار دسته‌بندی</option>
                    {allCategories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name} {c.isCustom ? '(شخصی)' : ''}
                      </option>
                    ))}
                  </select>

                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      title="مدیریت دسته‌ها"
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <button
                id="submit-transaction-btn"
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>در حال تحلیل...</span>
                  </>
                ) : (
                  <>
                    <span>ثبت هوشمند</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* پیشنهادات سریع برای استفاده راحت‌تر کاربر */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium ml-1">
              پیشنهادها:
            </span>
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySuggestion(item)}
                className="text-[11px] bg-slate-100/90 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ۲. حالت ثبت دستی مستقیم */}
      {entryMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3.5 animate-in fade-in">
          {/* نوع تراکنش */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl max-w-xs">
            <button
              type="button"
              onClick={() => {
                setManualType('expense');
                const comp = allCategories.filter((c) => c.type === 'expense' || c.type === 'both');
                if (comp.length > 0) setManualCategory(comp[0].name);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                manualType === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هزینه
            </button>
            <button
              type="button"
              onClick={() => {
                setManualType('income');
                const comp = allCategories.filter((c) => c.type === 'income' || c.type === 'both');
                if (comp.length > 0) setManualCategory(comp[0].name);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                manualType === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              درآمد
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* عنوان */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                عنوان تراکنش
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="مثال: ناهار، اشتراک اینترنت، حقوق، باشگاه..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* مبلغ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  مبلغ (تومان)
                </label>
                {manualAmountStr && (
                  <span className="text-[11px] text-indigo-600 font-bold">
                    {formatPersianCurrency(Number(manualAmountStr.replace(/[^0-9]/g, '')) || 0)}
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={manualAmountStr}
                onChange={(e) => setManualAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="مثال: 50000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-left dir-ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* انتخاب دسته‌بندی */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-600" />
                  <span>دسته‌بندی</span>
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    + دسته جدید
                  </button>
                )}
              </div>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {manualRelevantCategories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name} {c.isCustom ? '(شخصی)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* حساب یا کارت */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-500" />
                <span>حساب / کارت</span>
              </label>
              <select
                value={manualAccount}
                onChange={(e) => setManualAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {availableAccounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            {/* تاریخ شمسی */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>تاریخ شمسی</span>
              </label>
              <input
                type="text"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                placeholder="مثال: ۱۴۰۳/۰۶/۱۱"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-left dir-ltr"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>ثبت مستقیم تراکنش</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* نمایش پیام خطا */}
      {errorMessage && (
        <div
          id="error-feedback-banner"
          className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* نمایش پیام موفقیت ثبت */}
      {successInfo && (
        <div
          id="success-feedback-banner"
          className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="font-medium">{successInfo}</span>
        </div>
      )}
    </section>
  );
};
