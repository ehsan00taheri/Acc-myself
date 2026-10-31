import React, { useState } from 'react';
import {
  PenTool,
  Plus,
  CreditCard,
  Tag,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { Transaction, CustomCategory, TransactionType, Account } from '../types';
import {
  getCurrentPersianDate,
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  formatPersianCurrency,
  toPersianDigits,
} from '../utils/persian';

interface TransactionInputProps {
  onAddTransaction: (transaction: Transaction) => void;
  availableAccounts?: string[];
  accounts?: Account[];
  customCategories?: CustomCategory[];
  onOpenCategoryManager?: () => void;
  onOpenAccountManager?: () => void;
}

// عناوین متداول برای پر کردن سریع عنوان با یک لمس
const QUICK_TITLES = [
  'ناهار و خوراک',
  'سوپرمارکت',
  'کرایه و تاکسی',
  'بنزین',
  'خرید روزمره',
  'قبض و شارژ',
  'اینترنت و بسته',
  'حقوق و دستمزد',
];

/**
 * کامپوننت ثبت مستقیم و دستی تراکنش
 * بدون نیاز به پردازش هوش مصنوعی - سریع، دقیق و با دسترسی کامل به دسته‌بندی‌های شخصی
 */
export const TransactionInput: React.FC<TransactionInputProps> = ({
  onAddTransaction,
  availableAccounts = DEFAULT_ACCOUNTS,
  accounts = [],
  customCategories = [],
  onOpenCategoryManager,
  onOpenAccountManager,
}) => {
  const defaultAccountName =
    accounts.find((a) => a.isDefault)?.name ||
    accounts[0]?.name ||
    availableAccounts[0] ||
    'کارت اصلی';

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<string>('خوراک و نوشیدنی');
  const [account, setAccount] = useState<string>(defaultAccountName);
  const [persianDate, setPersianDate] = useState<string>(getCurrentPersianDate());
  const [note, setNote] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // ترکیب دسته‌های پیش‌فرض و دسته‌های شخصی تعریف‌شده توسط کاربر
  const allCategories: CustomCategory[] = [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ];

  // فیلتر دسته‌های مرتبط با هزینه یا درآمد
  const relevantCategories = allCategories.filter(
    (c) => c.type === 'both' || c.type === type
  );

  // پاکسازی اعداد غیرمجاز در کادر مبلغ
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(rawVal);
    if (errorMessage) setErrorMessage(null);
  };

  // ثبت نهایی تراکنش
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('لطفاً عنوان یا شرح تراکنش را وارد کنید.');
      return;
    }

    const numAmount = Number(amountStr.replace(/[^0-9]/g, '')) || 0;
    if (numAmount <= 0) {
      setErrorMessage('لطفاً مبلغ تراکنش را به تومان به صورت یک عدد معتبر وارد کنید.');
      return;
    }

    const newTransaction: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: trimmedTitle,
      amount: numAmount,
      type,
      category: category || (type === 'expense' ? 'سایر' : 'حقوق و دستمزد'),
      account: account || 'کارت اصلی',
      persianDate: persianDate.trim() || getCurrentPersianDate(),
      createdAt: Date.now(),
      rawText: trimmedTitle,
      note: note.trim() || undefined,
    };

    onAddTransaction(newTransaction);

    // ریست فرم برای تراکنش بعدی
    setTitle('');
    setAmountStr('');
    setNote('');
    setErrorMessage(null);
    setSuccessInfo(`تراکنش «${newTransaction.title}» به مبلغ ${formatPersianCurrency(newTransaction.amount)} ثبت شد.`);

    setTimeout(() => {
      setSuccessInfo(null);
    }, 3500);
  };

  const handleQuickTitle = (quickTitle: string) => {
    setTitle(quickTitle);
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <section className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
      {/* هدر بخش ثبت دستی */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              ثبت دستی تراکنش جدید
            </h2>
            <p className="text-[11px] text-slate-500">
              اطلاعات تراکنش خود را وارد کنید (ثبت آنی در حافظه گوشی و همگام با درایو)
            </p>
          </div>
        </div>

        {/* دکمه نوع تراکنش: هزینه یا درآمد */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              const comp = allCategories.filter((c) => c.type === 'expense' || c.type === 'both');
              if (comp.length > 0) setCategory(comp[0].name);
            }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هزینه
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              const comp = allCategories.filter((c) => c.type === 'income' || c.type === 'both');
              if (comp.length > 0) setCategory(comp[0].name);
            }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            درآمد
          </button>
        </div>
      </div>

      {/* فرم ثبت دستی */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ردیف ۱: عنوان و مبلغ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* فیلد عنوان */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              عنوان تراکنش
            </label>
            <input
              id="transaction-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="مثال: خرید سوپرمارکت، کرایه اسنپ، ناهار..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 font-medium transition"
            />
          </div>

          {/* فیلد مبلغ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                مبلغ (تومان)
              </label>
              {amountStr && (
                <span className="text-xs text-indigo-600 font-bold">
                  {formatPersianCurrency(Number(amountStr) || 0)}
                </span>
              )}
            </div>
            <input
              id="transaction-amount-input"
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={handleAmountChange}
              placeholder="مثال: 50000"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold text-left dir-ltr transition placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* برچسب‌های سریع عنوان برای راحتی در موبایل */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-slate-400 font-medium ml-1">
            عناوین پرکاربرد:
          </span>
          {QUICK_TITLES.map((qTitle, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickTitle(qTitle)}
              className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-indigo-100 font-medium"
            >
              {qTitle}
            </button>
          ))}
        </div>

        {/* ردیف ۲: دسته‌بندی، کارت و تاریخ شمسی */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* دسته‌بندی */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>دسته‌بندی</span>
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  + دسته جدید
                </button>
              )}
            </div>
            <select
              id="transaction-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium cursor-pointer"
            >
              {relevantCategories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name} {c.isCustom ? '(شخصی)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* حساب یا کارت */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>حساب / کارت</span>
              </label>
              {onOpenAccountManager && (
                <button
                  type="button"
                  onClick={onOpenAccountManager}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  + کارت جدید
                </button>
              )}
            </div>
            <select
              id="transaction-account-select"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium cursor-pointer"
            >
              {accounts.length > 0
                ? accounts.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} {acc.cardNumber ? `(•• ${toPersianDigits(acc.cardNumber.slice(-4))})` : ''} {acc.bankName ? `[${acc.bankName}]` : ''}
                    </option>
                  ))
                : availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
            </select>
          </div>

          {/* تاریخ شمسی */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>تاریخ شمسی</span>
            </label>
            <input
              id="transaction-date-input"
              type="text"
              value={persianDate}
              onChange={(e) => setPersianDate(e.target.value)}
              placeholder="مثال: ۱۴۰۳/۰۸/۰۹"
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium text-left dir-ltr"
            />
          </div>
        </div>

        {/* ردیف ۳: یادداشت اختیاری و دکمه ثبت */}
        <div className="flex flex-col sm:flex-row items-end gap-3 pt-1">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>یادداشت یا توضیحات اضافی (اختیاری)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: خرید برای محل کار، پرداخت به همراه علی..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-normal"
            />
          </div>

          <button
            id="submit-transaction-btn"
            type="submit"
            className="w-full sm:w-auto px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تراکنش</span>
          </button>
        </div>
      </form>

      {/* نمایش خطای ورودی */}
      {errorMessage && (
        <div
          id="error-feedback-banner"
          className="mt-3.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* نمایش پیام موفقیت آمیز بودن ثبت */}
      {successInfo && (
        <div
          id="success-feedback-banner"
          className="mt-3.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="font-medium">{successInfo}</span>
        </div>
      )}
    </section>
  );
};
