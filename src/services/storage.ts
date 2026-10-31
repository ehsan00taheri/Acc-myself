/**
 * ماژول مدیریت حافظه، پشتیبان‌گیری، خروجی اکسل/CSV و ذخیره‌سازی داده‌ها و دسته‌بندی‌ها
 */

import { Transaction, CustomCategory, Account } from '../types';

export const STORAGE_KEY = 'smart_accounting_transactions_v2';
export const CATEGORIES_STORAGE_KEY = 'smart_accounting_custom_categories_v1';
export const ACCOUNTS_STORAGE_KEY = 'smart_accounting_accounts_v1';

// ذخیره‌سازی تراکنش‌ها در LocalStorage
export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('خطا در ذخیره‌سازی تراکنش‌ها:', error);
  }
}

// بارگذاری تراکنش‌ها از LocalStorage (با پالایش خودکار داده‌های تستی اولیه)
export function loadTransactions(): Transaction[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // حذف خودکار تمام داده‌های تستی قدیمی با شناسه init-
      const cleanList = parsed.filter(
        (t) => t && typeof t === 'object' && !String(t.id || '').startsWith('init-')
      );
      return cleanList;
    }
  } catch (error) {
    console.error('خطا در خواندن داده‌ها از حافظه:', error);
  }
  return null;
}

// ذخیره‌سازی دسته‌بندی‌های شخصی در LocalStorage
export function saveCustomCategories(categories: CustomCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('خطا در ذخیره‌سازی دسته‌بندی‌های شخصی:', error);
  }
}

// بارگذاری دسته‌بندی‌های شخصی از LocalStorage
export function loadCustomCategories(): CustomCategory[] | null {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('خطا در خواندن دسته‌بندی‌ها از حافظه:', error);
  }
  return null;
}

// ذخیره‌سازی حساب‌ها و کارت‌های کاربر در LocalStorage
export function saveAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('خطا در ذخیره‌سازی حساب‌ها:', error);
  }
}

// بارگذاری حساب‌ها و کارت‌های کاربر از LocalStorage
export function loadAccounts(): Account[] | null {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('خطا در خواندن حساب‌ها از حافظه:', error);
  }
  return null;
}

// خروجی پشتیبان به صورت فایل JSON برای ذخیره در Google Drive یا دستگاه کاربر
export function exportBackupJSON(
  transactions: Transaction[],
  customCategories?: CustomCategory[],
  accounts?: Account[]
): void {
  const exportData = {
    appName: 'حسابداری شخصی هوشمند',
    version: '2.2.0',
    exportDate: new Date().toISOString(),
    transactionsCount: transactions.length,
    customCategoriesCount: (customCategories || []).length,
    customCategories: customCategories || [],
    accountsCount: (accounts || []).length,
    accounts: accounts || [],
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
  const headers = [
    'ردیف',
    'عنوان تراکنش',
    'مبلغ (تومان)',
    'نوع',
    'دسته‌بندی',
    'حساب / کارت',
    'تاریخ',
    'متن اولیه',
    'توضیحات',
  ];

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

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
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

export interface ImportResult {
  transactions: Transaction[];
  customCategories?: CustomCategory[];
  accounts?: Account[];
}

// خواندن و اعتبارسنجی فایل پشتیبان JSON
export function importBackupJSON(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        let txList: Transaction[] = [];
        let categories: CustomCategory[] = [];
        let importedAccounts: Account[] = [];

        if (Array.isArray(parsed)) {
          txList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.data)) {
            txList = parsed.data;
          } else if (Array.isArray(parsed.transactions)) {
            txList = parsed.transactions;
          }

          if (Array.isArray(parsed.customCategories)) {
            categories = parsed.customCategories;
          }

          if (Array.isArray(parsed.accounts)) {
            importedAccounts = parsed.accounts;
          }
        } else {
          throw new Error('ساختار فایل پشتیبان معتبر نیست.');
        }

        // اعتبارسنجی فیلدهای ضروری
        const validated = txList.filter(
          (t) =>
            t &&
            typeof t.amount === 'number' &&
            (t.type === 'expense' || t.type === 'income')
        );

        if (validated.length === 0) {
          throw new Error('هیچ تراکنش معتبری در فایل یافت نشد.');
        }

        resolve({
          transactions: validated,
          customCategories: categories.length > 0 ? categories : undefined,
          accounts: importedAccounts.length > 0 ? importedAccounts : undefined,
        });
      } catch (err: any) {
        reject(err.message || 'خطا در خواندن فایل پشتیبان.');
      }
    };
    reader.onerror = () => reject('خطا در خواندن فایل.');
    reader.readAsText(file);
  });
}
