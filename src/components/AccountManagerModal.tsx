import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Star,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import {
  formatPersianCurrency,
  toPersianDigits,
  IRAN_BANKS,
  CARD_COLOR_PRESETS,
} from '../utils/persian';
import { AccountCard, renderAccountIcon } from './AccountCard';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddAccount: (account: Account) => void;
  onUpdateAccount: (oldName: string, updatedAccount: Account) => void;
  onDeleteAccount: (accountId: string, reassignToAccountName?: string) => void;
  onSetDefaultAccount: (accountId: string) => void;
  transactions: Transaction[];
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onSetDefaultAccount,
  transactions,
}) => {
  // فرم افزودن / ویرایش
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // فیلدهای فرم
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('بلو بانک');
  const [cardNumber, setCardNumber] = useState('');
  const [initialBalanceStr, setInitialBalanceStr] = useState('0');
  const [color, setColor] = useState('#6366f1');
  const [iconName, setIconName] = useState('CreditCard');
  const [isDefault, setIsDefault] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // دیالوگ تأیید حذف
  const [deletingAccount, setDeletingAccount] = useState<{
    account: Account;
    txCount: number;
    reassignTo: string;
  } | null>(null);

  if (!isOpen) return null;

  // محاسبه موجودی زنده هر حساب (موجودی اولیه + دریافتی‌ها - پرداختی‌ها)
  const calculateAccountBalance = (acc: Account) => {
    const accTxs = transactions.filter(
      (tx) => (tx.account || '').trim().toLowerCase() === acc.name.trim().toLowerCase()
    );
    const income = accTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = accTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return (acc.initialBalance || 0) + income - expense;
  };

  // محاسبه آمار تراکنش‌های متصل به حساب
  const getAccountTxCount = (accName: string) => {
    return transactions.filter(
      (tx) => (tx.account || '').trim().toLowerCase() === accName.trim().toLowerCase()
    ).length;
  };

  // باز کردن فرم برای افزودن حساب جدید
  const handleOpenAddForm = () => {
    setEditingAccount(null);
    setName('');
    setBankName('بلو بانک');
    setCardNumber('');
    setInitialBalanceStr('0');
    setColor(CARD_COLOR_PRESETS[0].hex);
    setIconName('CreditCard');
    setIsDefault(accounts.length === 0);
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  // باز کردن فرم برای ویرایش حساب موجود
  const handleOpenEditForm = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBankName(acc.bankName || 'بلو بانک');
    setCardNumber(acc.cardNumber || '');
    setInitialBalanceStr(String(acc.initialBalance || 0));
    setColor(acc.color || '#6366f1');
    setIconName(acc.iconName || 'CreditCard');
    setIsDefault(Boolean(acc.isDefault));
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  // بستن فرم
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
    setErrorMessage(null);
  };

  // انتخاب سریع بانک از لیست پیشنهادی
  const handleSelectBankPreset = (bank: (typeof IRAN_BANKS)[0]) => {
    setBankName(bank.name);
    if (!name || name === bankName) {
      setName(bank.name);
    }
    setColor(bank.defaultColor);
    setIconName(bank.iconName);
  };

  // ذخیره فرم افزودن یا ویرایش
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage('لطفاً یک نام برای حساب یا کارت خود بنویسید.');
      return;
    }

    // بررسی تکراری نبودن نام حساب
    const isDuplicate = accounts.some(
      (a) =>
        a.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        a.id !== editingAccount?.id
    );

    if (isDuplicate) {
      setErrorMessage('حسابی با این نام قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.');
      return;
    }

    const cleanCardNum = cardNumber.replace(/[^0-9]/g, '').slice(0, 16);
    const initialBal = Number(initialBalanceStr.replace(/[^0-9]/g, '')) || 0;

    if (editingAccount) {
      // ویرایش حساب موجود
      const updated: Account = {
        ...editingAccount,
        name: trimmedName,
        bankName: bankName.trim() || undefined,
        cardNumber: cleanCardNum,
        color,
        iconName,
        initialBalance: initialBal,
        isDefault,
        isCustom: true,
      };
      onUpdateAccount(editingAccount.name, updated);
      if (isDefault) {
        onSetDefaultAccount(editingAccount.id);
      }
    } else {
      // افزودن حساب جدید
      const newAcc: Account = {
        id: 'acc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: trimmedName,
        bankName: bankName.trim() || undefined,
        cardNumber: cleanCardNum,
        color,
        iconName,
        initialBalance: initialBal,
        isDefault,
        isCustom: true,
      };
      onAddAccount(newAcc);
      if (isDefault || accounts.length === 0) {
        onSetDefaultAccount(newAcc.id);
      }
    }

    handleCloseForm();
  };

  // باز کردن دیالوگ حذف
  const handlePromptDelete = (acc: Account) => {
    if (accounts.length <= 1) {
      alert('حداقل یک حساب یا کارت باید در برنامه وجود داشته باشد.');
      return;
    }

    const count = getAccountTxCount(acc.name);
    const otherAccount = accounts.find((a) => a.id !== acc.id);
    setDeletingAccount({
      account: acc,
      txCount: count,
      reassignTo: otherAccount?.name || 'کارت اصلی',
    });
  };

  // تأیید نهایی حذف
  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    onDeleteAccount(deletingAccount.account.id, deletingAccount.reassignTo);
    setDeletingAccount(null);
  };

  // پیش‌نمایش زنده کارت برای فرم
  const previewAccount: Account = {
    id: editingAccount?.id || 'preview',
    name: name.trim() || 'نام کارت شما',
    bankName: bankName || 'نام بانک',
    cardNumber: cardNumber.replace(/[^0-9]/g, ''),
    color,
    iconName,
    initialBalance: Number(initialBalanceStr.replace(/[^0-9]/g, '')) || 0,
    isDefault,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* هدر مودال */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                مدیریت حساب‌ها و کارت‌های بانکی
              </h2>
              <p className="text-xs text-slate-500">
                تعریف کارت‌ها، شماره کارت، موجودی اولیه و پیگیری موجودی زنده
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه مودال */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* فرم افزودن یا ویرایش حساب */}
          {isFormOpen ? (
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  {editingAccount ? 'ویرایش حساب و کارت' : 'تعریف حساب / کارت جدید'}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  انصراف و بازگشت به لیست
                </button>
              </div>

              {/* پیش‌نمایش زنده کارت بانکی */}
              <div className="max-w-sm mx-auto">
                <p className="text-[11px] text-slate-400 text-center mb-1">پیش‌نمایش زنده کارت</p>
                <AccountCard account={previewAccount} currentBalance={previewAccount.initialBalance} />
              </div>

              {/* انتخاب سریع بانک‌های متداول ایران */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  انتخاب سریع از میان بانک‌های کشور:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {IRAN_BANKS.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => handleSelectBankPreset(b)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        bankName === b.name
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: b.defaultColor }}
                      />
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* فیلدهای نام و نام بانک */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نام حساب یا کارت <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="مثال: بلو بانک خرید روزمره"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نام صادرکننده / بانک
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثال: بانک سامان"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* شماره کارت و موجودی اولیه */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ۴ رقم آخر یا شماره ۱۶ رقمی کارت (اختیاری)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    dir="ltr"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="مثال: ۶۰۳۷ یا ۶۲۱۹..."
                    className="w-full px-3 py-2 text-sm font-mono text-center bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    موجودی اولیه (تومان)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={initialBalanceStr}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setInitialBalanceStr(clean);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-mono text-center bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <span className="text-[11px] text-slate-400 block mt-0.5 text-right">
                    معادل: {formatPersianCurrency(Number(initialBalanceStr) || 0)}
                  </span>
                </div>
              </div>

              {/* انتخاب رنگ کارت */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  رنگ و پوسته کارت:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {CARD_COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setColor(p.hex)}
                      title={p.label}
                      className={`relative h-10 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-gradient-to-br ${p.gradient} ${
                        color.toLowerCase() === p.hex.toLowerCase()
                          ? 'ring-3 ring-indigo-500 ring-offset-2 scale-105 shadow-md'
                          : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'
                      }`}
                    >
                      {color.toLowerCase() === p.hex.toLowerCase() && (
                        <Check className="w-4 h-4 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* تیک کارت پیش‌فرض */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is-default-checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="is-default-checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                  این کارت به عنوان <strong>کارت پیش‌فرض</strong> در ثبت تراکنش‌ها قرار گیرد
                </label>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* دکمه‌های ثبت فرم */}
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAccount ? 'ذخیره تغییرات کارت' : 'ثبت و افزودن کارت'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          ) : (
            /* لیست کارت‌ها و حساب‌های تعریف‌شده */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    کارت‌های فعال شما ({toPersianDigits(accounts.length)})
                  </h3>
                  <p className="text-xs text-slate-500">
                    برای ویرایش هر کارت روی آیکون مداد کلیک کنید یا کارت جدید اضافه نمایید.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن حساب جدید</span>
                </button>
              </div>

              {/* گرید نمایش کارت‌ها */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((acc) => {
                  const liveBalance = calculateAccountBalance(acc);
                  const txCount = getAccountTxCount(acc.name);

                  return (
                    <div key={acc.id} className="relative group">
                      <AccountCard
                        account={acc}
                        currentBalance={liveBalance}
                        onEdit={() => handleOpenEditForm(acc)}
                        onDelete={() => handlePromptDelete(acc)}
                        onSetDefault={() => onSetDefaultAccount(acc.id)}
                      />
                      <div className="mt-1 px-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{toPersianDigits(txCount)} تراکنش ثبت‌شده</span>
                        {acc.isDefault && (
                          <span className="text-amber-600 font-medium">کارت انتخابی پیش‌فرض</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* راهنما */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>نکته هوشمند:</strong> با تغییر نام هر حساب، تمام تراکنش‌هایی که قبلاً با آن
                  حساب ثبت کرده‌اید به‌صورت خودکار به نام جدید به‌روزرسانی می‌شوند تا هیچ سابقه‌ای قطع
                  نشود. همچنین با تغییر موجودی اولیه، موجودی زنده کارت مجدداً محاسبه خواهد شد.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* دیالوگ تأیید حذف حساب */}
        {deletingAccount && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 max-w-md w-full space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    حذف حساب «{deletingAccount.account.name}»
                  </h3>
                  <p className="text-xs text-slate-500">آیا از حذف این حساب اطمینان دارید؟</p>
                </div>
              </div>

              {deletingAccount.txCount > 0 ? (
                <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <p>
                    تعداد <strong>{toPersianDigits(deletingAccount.txCount)}</strong> تراکنش با این حساب ثبت
                    شده است. لطفاً حسابی را برای انتقال این تراکنش‌ها مشخص کنید:
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      انتقال تراکنش‌ها به:
                    </label>
                    <select
                      value={deletingAccount.reassignTo}
                      onChange={(e) =>
                        setDeletingAccount((prev) =>
                          prev ? { ...prev, reassignTo: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-hidden"
                    >
                      {accounts
                        .filter((a) => a.id !== deletingAccount.account.id)
                        .map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name} ({a.bankName || 'بانک'})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  هیچ تراکنشی به این حساب متصل نیست و با خیال راحت می‌توانید آن را حذف کنید.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingAccount(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  تأیید و حذف حساب
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
