import React from 'react';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  HeartPulse,
  Sparkles,
  BookOpen,
  Wallet,
  TrendingUp,
  Receipt,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Transaction, FilterType } from '../types';
import { formatPersianCurrency, toPersianDigits, getCategoryStyle } from '../utils/persian';

interface TransactionListProps {
  transactions: Transaction[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onDeleteTransaction: (id: string) => void;
}

// کامپوننت انتخاب و رندر آیکون مربوط به دسته‌بندی
const CategoryIcon: React.FC<{ iconName: string; className?: string }> = ({
  iconName,
  className = 'w-4 h-4',
}) => {
  switch (iconName) {
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Home':
      return <Home className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    default:
      return <Receipt className={className} />;
  }
};

/**
 * لیست تراکنش‌ها با فیلتر ساده (همه، هزینه‌ها، درآمدها) و مرتب‌سازی جدیدترین در بالا
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  filter,
  onFilterChange,
  onDeleteTransaction,
}) => {
  // فیلتر کردن تراکنش‌ها
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'expense') return tx.type === 'expense';
    if (filter === 'income') return tx.type === 'income';
    return true;
  });

  // مرتب‌سازی بر اساس جدیدترین زمان ایجاد در بالا
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const expenseCount = transactions.filter((t) => t.type === 'expense').length;
  const incomeCount = transactions.filter((t) => t.type === 'income').length;

  return (
    <section className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
      {/* هدر بخش لیست و فیلترها */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>تاریخچه تراکنش‌ها</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {toPersianDigits(sortedTransactions.length)} مورد
            </span>
          </h2>
        </div>

        {/* فیلتر ساده: همه / هزینه‌ها / درآمدها */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            id="filter-all-btn"
            onClick={() => onFilterChange('all')}
            className={`flex-1 sm:flex-none text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            همه ({toPersianDigits(transactions.length)})
          </button>
          <button
            id="filter-expense-btn"
            onClick={() => onFilterChange('expense')}
            className={`flex-1 sm:flex-none text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'expense'
                ? 'bg-white text-rose-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هزینه‌ها ({toPersianDigits(expenseCount)})
          </button>
          <button
            id="filter-income-btn"
            onClick={() => onFilterChange('income')}
            className={`flex-1 sm:flex-none text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'income'
                ? 'bg-white text-emerald-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            درآمدها ({toPersianDigits(incomeCount)})
          </button>
        </div>
      </div>

      {/* نمایش لیست تراکنش‌ها */}
      {sortedTransactions.length === 0 ? (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            هیچ تراکنشی یافت نشد
          </p>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {filter !== 'all'
              ? 'در این دسته‌بندی هنوز تراکنشی ثبت نشده است.'
              : 'برای شروع، یک جمله مثل «امروز ناهار ۳۵ هزار تومان» در کادر بالا بنویسید.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 mt-1">
          {sortedTransactions.map((tx) => {
            const categoryStyle = getCategoryStyle(tx.category);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                id={`transaction-item-${tx.id}`}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
              >
                {/* بخش سمت راست: آیکون دسته‌بندی و عنوان و توضیحات */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryStyle.bgClass} ${categoryStyle.textClass}`}
                  >
                    <CategoryIcon
                      iconName={categoryStyle.iconName}
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {tx.title}
                      </h3>
                      {/* برچسب حساب بانکی یا کارت */}
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                        <span>{tx.account || 'کارت اصلی'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${categoryStyle.badgeClass}`}
                      >
                        {tx.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{tx.persianDate}</span>
                      </span>
                      {tx.rawText && tx.rawText !== tx.title && (
                        <span className="hidden md:inline truncate max-w-[200px] text-slate-400 text-[11px]">
                          «{tx.rawText}»
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* بخش سمت چپ: مبلغ و دکمه حذف */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left">
                    <div
                      className={`text-sm sm:text-base font-bold ${
                        isIncome ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isIncome ? '+ ' : '- '}
                      {formatPersianCurrency(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 text-left">
                      {isIncome ? 'درآمد' : 'هزینه'}
                    </div>
                  </div>

                  {/* دکمه حذف تراکنش */}
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    title="حذف تراکنش"
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
