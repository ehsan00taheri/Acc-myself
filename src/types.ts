/**
 * انواع داده و تایپ‌های اصلی اپلیکیشن حسابداری شخصی
 */

export type TransactionType = 'expense' | 'income';
export type CategoryType = 'expense' | 'income' | 'both';

export interface CustomCategory {
  id: string;
  name: string;
  type: CategoryType;
  iconName: string;
  color: string;
  isCustom?: boolean;
}

export interface Account {
  id: string;
  name: string; // نام حساب یا کارت (مثلاً کارت اصلی، بلو بانک، نقدی)
  bankName?: string; // نام بانک یا نوع (سامان، ملی، ملت، بلو، صادرات، نقدی، ...)
  cardNumber?: string; // شماره کارت یا ۴ رقم آخر (اختیاری)
  color: string; // کد رنگ هگز یا کلاس گرادینت
  iconName?: string; // آیکون کارت
  initialBalance: number; // موجودی اولیه حساب به تومان
  isDefault?: boolean; // آیا کارت پیش‌فرض است؟
  isCustom?: boolean; // تعریف‌شده توسط کاربر
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // مبلغ به تومان
  type: TransactionType;
  category: string;
  account?: string; // حسابی که از آن پرداخت یا دریافت شده (مثلاً: کارت بانک ملی، حساب ملت، بلو بانک، نقدی و...)
  persianDate: string; // تاریخ به صورت شمسی (مثلاً ۱۴۰۳/۰۶/۱۱)
  createdAt: number; // برچسب زمان میلی‌ثانیه برای مرتب‌سازی دقیق
  rawText: string; // متنی که کاربر در ابتدا نوشته بود
  note?: string;
}

export type FilterType = 'all' | 'expense' | 'income';

export interface ParseTransactionResponse {
  isValidTransaction: boolean;
  amount?: number;
  type?: TransactionType;
  category?: string;
  account?: string;
  title?: string;
  persianDate?: string;
  note?: string;
  errorMessage?: string;
}
