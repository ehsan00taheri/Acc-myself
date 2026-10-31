import React from 'react';
import {
  Trash2,
  Calendar,
  Layers,
  Edit2,
  Tag,
} from 'lucide-react';
import { Transaction, FilterType, CustomCategory, Account } from '../types';
import {
  formatPersianCurrency,
  toPersianDigits,
  getCategoryStyle,
} from '../utils/persian';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  customCategories?: CustomCategory[];
  onOpenCategoryManager?: () => void;
  accounts?: Account[];
  selectedAccountFilter?: string;
  onClearAccountFilter?: () => void;
}

/**
 * لیست تراکنش‌ها با فیلتر، قابلیت ویرایش، دسته‌بندی‌های شخصی و حذف
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  filter,
  onFilterChange,
  onDeleteTransaction,
  onEditTransaction,
  customCategories = [],
  onOpenCategoryManager,
  accounts = [],
  selectedAccountFilter = 'all',
  onClearAccountFilter,
}) => {
  // فیلتر کردن تراکنش‌ها بر اساس نوع و حساب انتخابی
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'expense' && tx.type !== 'expense') return false;
    if (filter === 'income' && tx.type !== 'income') return false;
    if (
      selectedAccountFilter !== 'all' &&
      (tx.account || '').trim().toLowerCase() !== selectedAccountFilter.trim().toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  // نقشه حساب‌ها برای رنگ کارت در برچسب
  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.name.trim().toLowerCase(), a));

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
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>تاریخچه تراکنش‌ها</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {toPersianDigits(sortedTransactions.length)} مورد
            </span>
          </h2>

          {onOpenCategoryManager && (
            <button
              onClick={onOpenCategoryManager}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 cursor-pointer mr-2"
              title="مدیریت دسته‌بندی‌ها"
            >
              <Tag className="w-3 h-3" />
              <span>مدیریت دسته‌ها</span>
            </button>
          )}
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
              ? 'در این فیلتر هنوز تراکنشی ثبت نشده است.'
              : 'برای شروع، جمله‌ای مثل «ناهار ۳۵ هزار تومان با کارت ملی» بنویسید.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 mt-1">
          {sortedTransactions.map((tx) => {
            const categoryStyle = getCategoryStyle(tx.category, customCategories);
            const isIncome = tx.type === 'income';

            // آیا دسته شخصی است؟
            const matchingCustom = customCategories.find(
              (c) => c.name.trim().toLowerCase() === (tx.category || '').trim().toLowerCase()
            );

            return (
              <div
                key={tx.id}
                id={`transaction-item-${tx.id}`}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
              >
                {/* بخش سمت راست: آیکون دسته‌بندی و عنوان و توضیحات */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                    style={{ backgroundColor: categoryStyle.chartColor }}
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
                      {(() => {
                        const accName = tx.account || 'کارت اصلی';
                        const matchedAcc = accountMap.get(accName.trim().toLowerCase());
                        return (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-medium"
                            style={
                              matchedAcc?.color
                                ? {
                                    backgroundColor: `${matchedAcc.color}12`,
                                    borderColor: `${matchedAcc.color}35`,
                                    color: matchedAcc.color,
                                  }
                                : {
                                    backgroundColor: '#f1f5f9',
                                    borderColor: '#e2e8f0',
                                    color: '#334155',
                                  }
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: matchedAcc?.color || '#64748b' }}
                            />
                            <span>{accName}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: `${categoryStyle.chartColor}15`,
                          borderColor: `${categoryStyle.chartColor}40`,
                          color: categoryStyle.chartColor,
                        }}
                      >
                        <span>{tx.category}</span>
                        {matchingCustom && (
                          <span className="text-[9px] opacity-75 font-normal">
                            (شخصی)
                          </span>
                        )}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{tx.persianDate}</span>
                      </span>

                      {tx.note && (
                        <span className="text-slate-500 text-[11px] truncate max-w-[150px]">
                          • {tx.note}
                        </span>
                      )}

                      {tx.rawText && tx.rawText !== tx.title && !tx.note && (
                        <span className="hidden md:inline truncate max-w-[200px] text-slate-400 text-[11px]">
                          «{tx.rawText}»
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* بخش سمت چپ: مبلغ و دکمه‌های ویرایش و حذف */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

                  <div className="flex items-center gap-1">
                    {/* دکمه ویرایش تراکنش */}
                    <button
                      onClick={() => onEditTransaction(tx)}
                      title="ویرایش تراکنش و تغییر دسته‌بندی"
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* دکمه حذف تراکنش */}
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="حذف تراکنش"
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
