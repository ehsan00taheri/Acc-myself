import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { formatPersianCurrency } from '../utils/persian';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/**
 * نمایش سه کارت آماری در بالای صفحه:
 * ۱. مجموع درآمدها
 * ۲. مجموع هزینه‌ها
 * ۳. مانده حساب (درآمد منهای هزینه)
 */
export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  balance,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
      {/* کارت مجموع درآمدها */}
      <div
        id="card-total-income"
        className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col justify-between transition-all hover:border-emerald-200"
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-700">
            مجموع درآمدها
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600 tracking-tight">
            {formatPersianCurrency(totalIncome)}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            کل دریافتی‌ها و دستمزدها
          </p>
        </div>
      </div>

      {/* کارت مجموع هزینه‌ها */}
      <div
        id="card-total-expense"
        className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex flex-col justify-between transition-all hover:border-rose-200"
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-700">
            مجموع هزینه‌ها
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-xl font-bold text-rose-600 tracking-tight">
            {formatPersianCurrency(totalExpense)}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            کل مخارج و خریدهای ثبت شده
          </p>
        </div>
      </div>

      {/* کارت مانده حساب */}
      <div
        id="card-account-balance"
        className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col justify-between transition-all ${
          balance >= 0
            ? 'border-indigo-100 hover:border-indigo-200'
            : 'border-amber-200 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-700">
            مانده حساب
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              balance >= 0
                ? 'bg-indigo-50 text-indigo-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div
            className={`text-lg sm:text-xl font-bold tracking-tight ${
              balance > 0
                ? 'text-indigo-600'
                : balance === 0
                ? 'text-slate-700'
                : 'text-amber-600'
            }`}
          >
            {formatPersianCurrency(balance)}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            {balance >= 0 ? 'درآمد منهای هزینه (مثبت)' : 'کسری بودجه (منفی)'}
          </p>
        </div>
      </div>
    </section>
  );
};
