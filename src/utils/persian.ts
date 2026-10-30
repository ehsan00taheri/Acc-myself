/**
 * توابع کمکی برای محاسبات و تبدیل اعداد و تاریخ‌های شمسی و فارسی
 */

// تبدیل اعداد انگلیسی به فارسی
export function toPersianDigits(val: number | string): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

// فرمت‌بندی مبلغ به تومان با جداکننده سه رقمی و ارقام فارسی
export function formatPersianCurrency(amount: number, includeUnit = true): string {
  if (isNaN(amount)) return '۰';
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const persianFormatted = toPersianDigits(formatted);
  return includeUnit ? `${persianFormatted} تومان` : persianFormatted;
}

// دریافت تاریخ امروز به فرمت شمسی (مثلاً ۱۴۰۳/۰۶/۱۱)
export function getCurrentPersianDate(): string {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch (e) {
    return 'امروز';
  }
}

// دریافت نام روز و تاریخ کامل شمسی
export function getFullPersianDateHeader(): string {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(new Date());
  } catch (e) {
    return getCurrentPersianDate();
  }
}

import { Transaction, CustomCategory } from '../types';

// پیکربندی دسته‌بندی‌ها به همراه رنگ و استایل
export interface CategoryConfig {
  name: string;
  iconName: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
  chartColor: string;
}

// دسته‌بندی‌های پیش‌فرض سیستم برای هزینه و درآمد
export const DEFAULT_CATEGORIES: CustomCategory[] = [
  {
    id: 'def-food',
    name: 'خوراک و نوشیدنی',
    type: 'expense',
    iconName: 'Utensils',
    color: '#f59e0b',
    isCustom: false,
  },
  {
    id: 'def-transport',
    name: 'حمل‌ونقل',
    type: 'expense',
    iconName: 'Car',
    color: '#0284c7',
    isCustom: false,
  },
  {
    id: 'def-home',
    name: 'مسکن و قبوض',
    type: 'expense',
    iconName: 'Home',
    color: '#9333ea',
    isCustom: false,
  },
  {
    id: 'def-shopping',
    name: 'خرید و پوشاک',
    type: 'expense',
    iconName: 'ShoppingBag',
    color: '#db2777',
    isCustom: false,
  },
  {
    id: 'def-health',
    name: 'سلامت و درمان',
    type: 'expense',
    iconName: 'HeartPulse',
    color: '#e11d48',
    isCustom: false,
  },
  {
    id: 'def-entertainment',
    name: 'تفریح و سرگرمی',
    type: 'expense',
    iconName: 'Sparkles',
    color: '#6366f1',
    isCustom: false,
  },
  {
    id: 'def-education',
    name: 'آموزش و کتاب',
    type: 'expense',
    iconName: 'BookOpen',
    color: '#0d9488',
    isCustom: false,
  },
  {
    id: 'def-salary',
    name: 'حقوق و دستمزد',
    type: 'income',
    iconName: 'Wallet',
    color: '#10b981',
    isCustom: false,
  },
  {
    id: 'def-invest',
    name: 'سرمایه‌گذاری و پس‌انداز',
    type: 'both',
    iconName: 'TrendingUp',
    color: '#059669',
    isCustom: false,
  },
  {
    id: 'def-gift',
    name: 'پاداش و هدیه',
    type: 'income',
    iconName: 'Gift',
    color: '#8b5cf6',
    isCustom: false,
  },
  {
    id: 'def-business',
    name: 'فروش و تجارت',
    type: 'income',
    iconName: 'Briefcase',
    color: '#2563eb',
    isCustom: false,
  },
  {
    id: 'def-other',
    name: 'سایر',
    type: 'both',
    iconName: 'Receipt',
    color: '#64748b',
    isCustom: false,
  },
];

export const CATEGORY_STYLES: Record<string, CategoryConfig> = {
  'خوراک و نوشیدنی': {
    name: 'خوراک و نوشیدنی',
    iconName: 'Utensils',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    chartColor: '#f59e0b',
  },
  'حمل‌ونقل': {
    name: 'حمل‌ونقل',
    iconName: 'Car',
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-800',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    chartColor: '#0284c7',
  },
  'مسکن و قبوض': {
    name: 'مسکن و قبوض',
    iconName: 'Home',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-800',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    chartColor: '#9333ea',
  },
  'خرید و پوشاک': {
    name: 'خرید و پوشاک',
    iconName: 'ShoppingBag',
    bgClass: 'bg-pink-100',
    textClass: 'text-pink-800',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    chartColor: '#db2777',
  },
  'سلامت و درمان': {
    name: 'سلامت و درمان',
    iconName: 'HeartPulse',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-800',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    chartColor: '#e11d48',
  },
  'تفریح و سرگرمی': {
    name: 'تفریح و سرگرمی',
    iconName: 'Sparkles',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-800',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    chartColor: '#6366f1',
  },
  'آموزش و کتاب': {
    name: 'آموزش و کتاب',
    iconName: 'BookOpen',
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-800',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    chartColor: '#0d9488',
  },
  'حقوق و دستمزد': {
    name: 'حقوق و دستمزد',
    iconName: 'Wallet',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    chartColor: '#10b981',
  },
  'سرمایه‌گذاری و پس‌انداز': {
    name: 'سرمایه‌گذاری و پس‌انداز',
    iconName: 'TrendingUp',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    chartColor: '#059669',
  },
  'پاداش و هدیه': {
    name: 'پاداش و هدیه',
    iconName: 'Gift',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-800',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    chartColor: '#8b5cf6',
  },
  'فروش و تجارت': {
    name: 'فروش و تجارت',
    iconName: 'Briefcase',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    chartColor: '#2563eb',
  },
  'سایر': {
    name: 'سایر',
    iconName: 'Receipt',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    chartColor: '#64748b',
  },
};

// دریافت اطلاعات استایل یک دسته‌بندی با بررسی دسته‌های سفارشی
export function getCategoryStyle(
  categoryName: string,
  customCategories?: CustomCategory[]
): CategoryConfig {
  const trimmed = (categoryName || '').trim();

  // ۱. بررسی در دسته‌بندی‌های شخصی کاربر
  if (customCategories && customCategories.length > 0) {
    const found = customCategories.find(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      return {
        name: found.name,
        iconName: found.iconName || 'Tag',
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-800',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-300',
        chartColor: found.color || '#6366f1',
      };
    }
  }

  // ۲. بررسی در دسته‌بندی‌های استاتیک
  if (CATEGORY_STYLES[trimmed]) {
    return CATEGORY_STYLES[trimmed];
  }

  // ۳. جستجوی تقریبی در دسته‌های استاتیک
  for (const key of Object.keys(CATEGORY_STYLES)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return CATEGORY_STYLES[key];
    }
  }

  // ۴. مقدار پیش‌فرض
  return {
    name: trimmed || 'سایر',
    iconName: 'Tag',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    chartColor: '#64748b',
  };
}

// لیست حساب‌های پیش‌فرض برای انتخاب سریع
export const DEFAULT_ACCOUNTS = [
  'کارت اصلی',
  'کارت بانک ملی',
  'حساب بانک ملت',
  'بلو بانک',
  'بانک سامان',
  'بانک پاسارگاد',
  'نقدی / کیف پول',
];

// تراکنش‌های اولیه خالی برای شروع پاک و بدون اطلاعات تستی
export const INITIAL_TRANSACTIONS: Transaction[] = [];
