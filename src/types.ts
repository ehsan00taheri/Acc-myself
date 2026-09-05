/**
 * انواع داده و تایپ‌های اصلی اپلیکیشن حسابداری شخصی
 */

export type TransactionType = 'expense' | 'income';

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
