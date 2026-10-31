import React from 'react';
import { CreditCard, Plus, Settings2, Wallet } from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatPersianCurrency, toPersianDigits } from '../utils/persian';
import { AccountCard } from './AccountCard';

interface AccountCardsBannerProps {
  accounts: Account[];
  transactions: Transaction[];
  selectedAccountFilter: string; // 'all' or account name
  onSelectAccountFilter: (accountName: string) => void;
  onOpenAccountManager: () => void;
}

export const AccountCardsBanner: React.FC<AccountCardsBannerProps> = ({
  accounts,
  transactions,
  selectedAccountFilter,
  onSelectAccountFilter,
  onOpenAccountManager,
}) => {
  // محاسبه موجودی زنده هر حساب
  const getAccountLiveBalance = (acc: Account) => {
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

  // کل موجودی در تمام حساب‌ها
  const totalAssets = accounts.reduce((acc, curr) => acc + getAccountLiveBalance(curr), 0);

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      {/* سربرگ بخش کارت‌ها */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">حساب‌ها و کارت‌های بانکی شما</h2>
            <p className="text-[11px] text-slate-500">
              کل دارایی‌های ثبت‌شده: <strong className="text-slate-800 font-bold">{formatPersianCurrency(totalAssets)}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAccountManager}
          className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 px-2.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>تعریف و ویرایش کارت‌ها</span>
        </button>
      </div>

      {/* نوارهای فیلتر و کارت‌های قابل اسکرول */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-thin">
        {/* دکمه "همه حساب‌ها" */}
        <button
          onClick={() => onSelectAccountFilter('all')}
          className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
            selectedAccountFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>همه کارت‌ها</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            selectedAccountFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {toPersianDigits(accounts.length)}
          </span>
        </button>

        {/* تک تک کارت‌ها در ابعاد فشرده */}
        {accounts.map((acc) => {
          const liveBal = getAccountLiveBalance(acc);
          const isSelected = selectedAccountFilter === acc.name;

          return (
            <div key={acc.id} className="shrink-0 w-56 sm:w-64">
              <AccountCard
                compact
                account={acc}
                currentBalance={liveBal}
                isSelected={isSelected}
                onClick={() => onSelectAccountFilter(isSelected ? 'all' : acc.name)}
              />
            </div>
          );
        })}

        {/* دکمه افزودن کارت جدید در انتهای لیست */}
        <button
          onClick={onOpenAccountManager}
          className="shrink-0 w-32 h-[92px] rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-medium">+ افزودن کارت</span>
        </button>
      </div>

      {selectedAccountFilter !== 'all' && (
        <div className="flex items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100 px-3 py-2 rounded-xl text-indigo-900">
          <span>
            تراکنش‌ها هم‌اکنون برای کارت <strong>«{selectedAccountFilter}»</strong> فیلتر شده‌اند.
          </span>
          <button
            onClick={() => onSelectAccountFilter('all')}
            className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
          >
            نمایش همه
          </button>
        </div>
      )}
    </section>
  );
};
