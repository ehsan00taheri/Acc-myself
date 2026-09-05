/**
 * ماژول مدیریت حافظه، پشتیبان‌گیری، خروجی اکسل/CSV و ذخیره‌سازی داده‌ها
 * این لایه به گونه‌ای طراحی شده که در آینده به سادگی به دیتابیس ابری یا Google Drive متصل شود.
 */

import { Transaction } from '../types';

export const STORAGE_KEY = 'smart_accounting_transactions_v2';

// ذخیره‌سازی در LocalStorage
export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('خطا در ذخیره‌سازی تراکنش‌ها:', error);
  }
}

// بارگذاری از LocalStorage
export function loadTransactions(): Transaction[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('خطا در خواندن داده‌ها از حافظه:', error);
  }
  return null;
}

// خروجی پشتیبان به صورت فایل JSON برای ذخیره در Google Drive یا دستگاه کاربر
export function exportBackupJSON(transactions: Transaction[]): void {
  const exportData = {
    appName: 'حسابداری شخصی هوشمند',
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    transactionsCount: transactions.length,
    data: transactions,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `hesabdari-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// خروجی اکسل / CSV با پشتیبانی کامل از حروف فارسی (UTF-8 with BOM)
export function exportToCSV(transactions: Transaction[]): void {
  const headers = ['ردیف', 'عنوان تراکنش', 'مبلغ (تومان)', 'نوع', 'دسته‌بندی', 'حساب / کارت', 'تاریخ', 'متن اولیه', 'توضیحات'];
  
  const rows = transactions.map((tx, idx) => [
    idx + 1,
    `"${(tx.title || '').replace(/"/g, '""')}"`,
    tx.amount || 0,
    tx.type === 'income' ? 'درآمد' : 'هزینه',
    `"${(tx.category || '').replace(/"/g, '""')}"`,
    `"${(tx.account || 'کارت اصلی').replace(/"/g, '""')}"`,
    `"${(tx.persianDate || '').replace(/"/g, '""')}"`,
    `"${(tx.rawText || '').replace(/"/g, '""')}"`,
    `"${(tx.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const link = document.createElement('a');
  link.href = url;
  link.download = `hesabdari-report-${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// خواندن و اعتبارسنجی فایل پشتیبان JSON
export function importBackupJSON(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        let txList: Transaction[] = [];
        if (Array.isArray(parsed)) {
          txList = parsed;
        } else if (parsed && Array.isArray(parsed.data)) {
          txList = parsed.data;
        } else {
          throw new Error('ساختار فایل پشتیبان معتبر نیست.');
        }

        // اعتبارسنجی فیلدهای ضروری
        const validated = txList.filter(
          (t) => t && typeof t.amount === 'number' && (t.type === 'expense' || t.type === 'income')
        );

        if (validated.length === 0) {
          throw new Error('هیچ تراکنش معتبری در فایل یافت نشد.');
        }

        resolve(validated);
      } catch (err: any) {
        reject(err.message || 'خطا در خواندن فایل پشتیبان.');
      }
    };
    reader.onerror = () => reject('خطا در خواندن فایل.');
    reader.readAsText(file);
  });
}
