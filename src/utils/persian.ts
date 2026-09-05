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

// پیکربندی دسته‌بندی‌ها به همراه رنگ و استایل
export interface CategoryConfig {
  name: string;
  iconName: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
  chartColor: string;
}

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
  'سایر': {
    name: 'سایر',
    iconName: 'Receipt',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    chartColor: '#64748b',
  },
};

// دریافت اطلاعات استایل یک دسته‌بندی با مقدار پیش‌فرض مطمئن
export function getCategoryStyle(categoryName: string): CategoryConfig {
  if (CATEGORY_STYLES[categoryName]) {
    return CATEGORY_STYLES[categoryName];
  }
  
  // جستجوی تقریبی در صورت تشابه نام
  for (const key of Object.keys(CATEGORY_STYLES)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return CATEGORY_STYLES[key];
    }
  }
  
  return CATEGORY_STYLES['سایر'];
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

// تراکنش‌های نمونه اولیه برای بار اول کاربر
export const INITIAL_TRANSACTIONS = [
  {
    id: 'init-1',
    title: 'حقوق ماهانه',
    amount: 18500000,
    type: 'income' as const,
    category: 'حقوق و دستمزد',
    account: 'حساب بانک ملت',
    persianDate: getCurrentPersianDate(),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    rawText: 'واریز حقوق ماهانه ۱۸ میلیون و ۵۰۰ هزار تومان به بانک ملت',
  },
  {
    id: 'init-2',
    title: 'خرید هفتگی سوپرمارکت',
    amount: 680000,
    type: 'expense' as const,
    category: 'خوراک و نوشیدنی',
    account: 'کارت بانک ملی',
    persianDate: getCurrentPersianDate(),
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    rawText: 'خرید از سوپرمارکت و میوه‌فروشی ۶۸۰ هزار تومن با کارت ملی',
  },
  {
    id: 'init-3',
    title: 'کرایه تاکسی اینترنتی',
    amount: 45000,
    type: 'expense' as const,
    category: 'حمل‌ونقل',
    account: 'بلو بانک',
    persianDate: getCurrentPersianDate(),
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    rawText: 'امروز کرایه اسنپ تا شرکت ۴۵ هزار تومان با بلو بانک',
  },
  {
    id: 'init-4',
    title: 'کافه با دوستان',
    amount: 180000,
    type: 'expense' as const,
    category: 'تفریح و سرگرمی',
    account: 'کارت اصلی',
    persianDate: getCurrentPersianDate(),
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    rawText: 'کافه و قهوه با دوستان ۱۸۰ هزار تومان',
  },
];
