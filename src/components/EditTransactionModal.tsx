import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  CreditCard,
  Calendar,
  FileText,
  Tag,
  ArrowRightLeft,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Transaction, TransactionType, CustomCategory, Account } from '../types';
import {
  formatPersianCurrency,
  toPersianDigits,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '../utils/persian';
import { CategoryIcon } from './CategoryIcon';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (updated: Transaction) => void;
  customCategories: CustomCategory[];
  availableAccounts: string[];
  accounts?: Account[];
  onOpenCategoryManager: () => void;
  onOpenAccountManager?: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  customCategories,
  availableAccounts,
  accounts = [],
  onOpenCategoryManager,
  onOpenAccountManager,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('سایر');
  const [account, setAccount] = useState<string>('کارت اصلی');
  const [persianDate, setPersianDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // تمام دسته‌بندی‌های فعال (پیش‌فرض + شخصی)
  const allCategories: CustomCategory[] = [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ];

  // دسته‌های متناسب با نوع تراکنش فعلی (هزینه یا درآمد)
  const relevantCategories = allCategories.filter(
    (c) => c.type === 'both' || c.type === type
  );

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title || '');
      setAmount(transaction.amount || 0);
      setAmountStr(String(transaction.amount || 0));
      setType(transaction.type || 'expense');
      setCategory(transaction.category || 'سایر');
      setAccount(transaction.account || 'کارت اصلی');
      setPersianDate(transaction.persianDate || '');
      setNote(transaction.note || '');
      setErrorMessage(null);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // حذف هرگونه کاراکتر غیر عددی
    const rawDigits = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(rawDigits);
    setAmount(Number(rawDigits) || 0);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // اگر دسته فعلی با نوع جدید ناسازگار است، اولین دسته معتبر یا سایر را ست کن
    const compatible = allCategories.filter(
      (c) => c.type === 'both' || c.type === newType
    );
    const isCurrentCatCompatible = compatible.some((c) => c.name === category);
    if (!isCurrentCatCompatible && compatible.length > 0) {
      setCategory(compatible[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('عنوان تراکنش نمی‌تواند خالی باشد.');
      return;
    }

    if (amount <= 0) {
      setErrorMessage('مبلغ تراکنش باید عددی بزرگتر از صفر باشد.');
      return;
    }

    const updatedTx: Transaction = {
      ...transaction,
      title: trimmedTitle,
      amount: Math.round(amount),
      type,
      category: category || 'سایر',
      account: account || 'کارت اصلی',
      persianDate: persianDate.trim() || transaction.persianDate,
      note: note.trim() || undefined,
    };

    onSave(updatedTx);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* هدر */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ویرایش تراکنش مالی
              </h2>
              <p className="text-xs text-slate-500">
                به‌روزرسانی عنوان، مبلغ و اختصاص به دسته‌بندی‌های شخصی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فرم ویرایش */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* نوع تراکنش: هزینه یا درآمد */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع تراکنش
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                id="edit-tx-type-expense"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                هزینه (پرداخت)
              </button>
              <button
                type="button"
                id="edit-tx-type-income"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                درآمد (دریافت)
              </button>
            </div>
          </div>

          {/* عنوان تراکنش */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان تراکنش
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خرید خواربار، حقوق ماهانه، باشگاه..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* مبلغ به تومان */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                مبلغ تراکنش (تومان)
              </label>
              {amount > 0 && (
                <span className="text-xs text-indigo-600 font-bold">
                  {formatPersianCurrency(amount)}
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={handleAmountChange}
              placeholder="مثال: 50000"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-left dir-ltr"
            />
          </div>

          {/* انتخاب دسته‌بندی (شامل دسته‌های پیش‌فرض و جدید کاربر) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>دسته‌بندی</span>
              </label>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>مدیریت دسته‌ها</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
              {relevantCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`p-2 rounded-xl text-right flex items-center gap-2 transition cursor-pointer border ${
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-white/70 border-slate-200/80 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.iconName} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium truncate flex-1">
                      {cat.name}
                    </span>
                    {cat.isCustom && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" title="دسته‌بندی شخصی" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* حساب بانکی یا کارت */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>حساب / کارت</span>
                </label>
                {onOpenAccountManager && (
                  <button
                    type="button"
                    onClick={onOpenAccountManager}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    + کارت جدید
                  </button>
                )}
              </div>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {accounts.length > 0
                  ? accounts.map((acc) => (
                      <option key={acc.id} value={acc.name}>
                        {acc.name} {acc.cardNumber ? `(•• ${toPersianDigits(acc.cardNumber.slice(-4))})` : ''} {acc.bankName ? `[${acc.bankName}]` : ''}
                      </option>
                    ))
                  : Array.from(new Set([...DEFAULT_ACCOUNTS, ...availableAccounts])).map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
              </select>
            </div>

            {/* تاریخ شمسی */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>تاریخ شمسی</span>
              </label>
              <input
                type="text"
                value={persianDate}
                onChange={(e) => setPersianDate(e.target.value)}
                placeholder="مثال: ۱۴۰۳/۰۶/۱۱"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-left dir-ltr"
              />
            </div>
          </div>

          {/* یادداشت اختیاری */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>یادداشت یا توضیحات (اختیاری)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="توضیحات بیشتر درباره این تراکنش..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* دکمه‌های اقدام */}
          <div className="pt-3 flex items-center gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
