import React, { useState, useRef } from 'react';
import { Sparkles, ArrowLeft, Loader2, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { Transaction } from '../types';
import { getCurrentPersianDate, DEFAULT_ACCOUNTS } from '../utils/persian';

interface TransactionInputProps {
  onAddTransaction: (transaction: Transaction) => void;
  availableAccounts?: string[];
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
 * کامپوننت ورودی هوشمند تراکنش:
 * کاربر یک جمله طبیعی می‌نویسد و هوش مصنوعی مبلغ، نوع، دسته‌بندی و حساب پرداختی را تشخیص می‌دهد.
 */
export const TransactionInput: React.FC<TransactionInputProps> = ({
  onAddTransaction,
  availableAccounts = DEFAULT_ACCOUNTS,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
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
        body: JSON.stringify({ text: trimmed }),
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

      // تعیین حساب نهایی: اگر کاربر دستی حساب انتخاب کرده باشد اولویت دارد، در غیر این صورت استخراج هوش مصنوعی
      const finalAccount = selectedAccount !== 'auto' ? selectedAccount : (data.account || 'کارت اصلی');

      // ایجاد شیء تراکنش جدید
      const newTransaction: Transaction = {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: data.title || 'تراکنش جدید',
        amount: Number(data.amount) || 0,
        type: data.type === 'income' ? 'income' : 'expense',
        category: data.category || 'سایر',
        account: finalAccount,
        persianDate: data.persianDate || getCurrentPersianDate(),
        createdAt: Date.now(),
        rawText: trimmed,
        note: data.note,
      };

      onAddTransaction(newTransaction);
      setInputText('');
      setSuccessInfo(`تراکنش «${newTransaction.title}» (${newTransaction.account}) با موفقیت ثبت شد.`);

      // پاک کردن پیام موفقیت بعد از ۳ ثانیه
      setTimeout(() => {
        setSuccessInfo(null);
      }, 3500);
    } catch (err: any) {
      console.error('خطا در ارتباط با هوش مصنوعی:', err);
      setErrorMessage('خطا در اتصال به سرویس تحلیل هوش مصنوعی. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
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
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">
          ثبت تراکنش با زبان طبیعی
        </h2>
      </div>

      <p className="text-xs text-slate-500 mb-3.5">
        فقط به زبان عامیانه بنویسید؛ هوش مصنوعی مبلغ، نوع، دسته‌بندی، کارت و تاریخ را خودکار استخراج می‌کند.
      </p>

      {/* فرم ورودی متنی و انتخاب حساب */}
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
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

        {/* انتخابگر حساب پرداخت / دریافت */}
        <div className="relative shrink-0">
          <select
            id="account-input-selector"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full sm:w-auto h-full px-3 py-3.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium"
            title="مشخص کردن حساب یا کارت پرداختی"
          >
            <option value="auto">💳 تشخیص خودکار کارت/حساب</option>
            {availableAccounts.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
        </div>

        <button
          id="submit-transaction-btn"
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-sm rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>در حال تحلیل...</span>
            </>
          ) : (
            <>
              <span>ثبت تراکنش</span>
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* نمایش پیام خطا در صورت نامعتبر بودن ورودی */}
      {errorMessage && (
        <div
          id="error-feedback-banner"
          className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">متوجه نشدیم: </span>
            {errorMessage}
          </div>
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
    </section>
  );
};
