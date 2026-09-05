import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, CreditCard, Layers } from 'lucide-react';
import { Transaction } from '../types';
import {
  formatPersianCurrency,
  toPersianDigits,
  getCategoryStyle,
} from '../utils/persian';

interface ExpenseDistributionChartProps {
  transactions: Transaction[];
  selectedAccountFilter: string;
  onAccountFilterChange: (account: string) => void;
  availableAccounts: string[];
}

interface CategoryExpenseData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  count: number;
}

/**
 * کامپوننت نمودار دایره‌ای Recharts برای نمایش توزیع هزینه‌ها بر اساس دسته‌بندی و فیلتر حساب بانکی
 */
export const ExpenseDistributionChart: React.FC<ExpenseDistributionChartProps> = ({
  transactions,
  selectedAccountFilter,
  onAccountFilterChange,
  availableAccounts,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // فیلتر هزینه‌ها بر اساس حساب انتخاب شده (در صورت انتخاب حسابی خاص)
  const filteredExpenses = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    if (selectedAccountFilter !== 'all' && (tx.account || 'کارت اصلی') !== selectedAccountFilter) {
      return false;
    }
    return true;
  });

  // محاسبه مجموع کل هزینه‌ها در این بازه یا حساب
  const totalExpenseSum = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // تجمیع هزینه‌ها بر اساس دسته‌بندی
  const categoryMap: Record<string, { total: number; count: number }> = {};

  filteredExpenses.forEach((tx) => {
    const cat = tx.category || 'سایر';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { total: 0, count: 0 };
    }
    categoryMap[cat].total += tx.amount;
    categoryMap[cat].count += 1;
  });

  const chartData: CategoryExpenseData[] = Object.entries(categoryMap)
    .map(([catName, data]) => {
      const percentage = totalExpenseSum > 0 ? (data.total / totalExpenseSum) * 100 : 0;
      const style = getCategoryStyle(catName);
      return {
        name: catName,
        value: data.total,
        percentage: Number(percentage.toFixed(1)),
        color: style.chartColor,
        count: data.count,
      };
    })
    .sort((a, b) => b.value - a.value);

  // تول‌تیپ سفارشی و بومی‌سازی شده برای Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: CategoryExpenseData = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs border border-slate-800 dir-rtl text-right min-w-[160px]">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-700">
            <span className="font-bold flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="text-[11px] text-slate-300">
              {toPersianDigits(item.percentage)}٪
            </span>
          </div>
          <div className="text-emerald-400 font-bold text-sm">
            {formatPersianCurrency(item.value)}
          </div>
          <div className="text-slate-400 text-[10px] mt-1">
            {toPersianDigits(item.count)} تراکنش
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
      {/* هدر بخش نمودار همراه با فیلتر حساب پرداخت‌کننده */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PieIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              نمودار توزیع هزینه‌ها
            </h2>
            <p className="text-[11px] text-slate-500">
              سهم هر دسته‌بندی از کل مخارج ثبت شده
            </p>
          </div>
        </div>

        {/* انتخابگر فیلتر حساب */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <CreditCard className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            id="account-chart-filter"
            value={selectedAccountFilter}
            onChange={(e) => onAccountFilterChange(e.target.value)}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium"
          >
            <option value="all">همه حساب‌ها و کارت‌ها</option>
            {availableAccounts.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            داده‌ای برای رسم نمودار هزینه وجود ندارد
          </p>
          <p className="text-xs text-slate-400">
            با ثبت اولین هزینه، نمودار توزیع دسته‌بندی‌ها به صورت خودکار نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4">
          {/* نمودار دایره‌ای Recharts */}
          <div className="md:col-span-6 h-64 sm:h-72 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="transition-all duration-200 hover:opacity-85 cursor-pointer outline-hidden"
                      style={{
                        transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: 'center center',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* نشانگر متنی وسط دایره (Donut Center) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] text-slate-600 font-medium">
                {selectedAccountFilter === 'all' ? 'کل هزینه‌ها' : selectedAccountFilter}
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5">
                {formatPersianCurrency(totalExpenseSum, false)}
              </span>
              <span className="text-[10px] text-slate-500">تومان</span>
            </div>
          </div>

          {/* راهنمای دسته‌بندی‌ها و درصدها (Legend) */}
          <div className="md:col-span-6 space-y-2 max-h-64 overflow-y-auto pr-1">
            {chartData.map((item, idx) => (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-slate-50 border-slate-300'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({toPersianDigits(item.count)})
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-800">
                    {formatPersianCurrency(item.value)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md min-w-[40px] text-center">
                    {toPersianDigits(item.percentage)}٪
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
