/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Transaction, FilterType, CustomCategory } from './types';
import { INITIAL_TRANSACTIONS, DEFAULT_ACCOUNTS } from './utils/persian';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { ExpenseDistributionChart } from './components/ExpenseDistributionChart';
import { TransactionInput } from './components/TransactionInput';
import { TransactionList } from './components/TransactionList';
import { BackupManagerModal } from './components/BackupManagerModal';
import { GoogleDriveSync } from './components/GoogleDriveSync';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import {
  loadTransactions,
  saveTransactions,
  loadCustomCategories,
  saveCustomCategories,
} from './services/storage';
import { initAuth } from './services/driveAuth';

export default function App() {
  // بارگذاری اولیه تراکنش‌ها از ذخیره‌سازی محلی گوشی یا سیستم کاربر
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = loadTransactions();
    if (saved !== null) {
      return saved;
    }
    return INITIAL_TRANSACTIONS;
  });

  // بارگذاری دسته‌بندی‌های شخصی کاربر از حافظه محلی
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => {
    const saved = loadCustomCategories();
    return saved || [];
  });

  // کاربر گوگل و توکن دسترسی Google Drive
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // شنونده وضعیت احراز هویت گوگل
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // فیلتر فعال لیست تراکنش‌ها
  const [filter, setFilter] = useState<FilterType>('all');

  // فیلتر حساب برای نمودار دایره‌ای
  const [chartAccountFilter, setChartAccountFilter] = useState<string>('all');

  // وضعیت باز/بسته بودن مودال پشتیبان‌گیری
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // وضعیت باز/بسته بودن مودال مدیریت دسته‌بندی‌ها
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // تراکنش در حال ویرایش
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // لیست حساب‌های منحصر به فرد موجود در تراکنش‌ها + حساب‌های پیش‌فرض
  const availableAccounts = useMemo(() => {
    const set = new Set<string>(DEFAULT_ACCOUNTS);
    transactions.forEach((tx) => {
      if (tx.account) set.add(tx.account);
    });
    return Array.from(set);
  }, [transactions]);

  // ذخیره‌سازی خودکار تغییرات تراکنش‌ها در حافظه محلی
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // ذخیره‌سازی خودکار دسته‌بندی‌های شخصی در حافظه محلی
  useEffect(() => {
    saveCustomCategories(customCategories);
  }, [customCategories]);

  // افزودن تراکنش جدید به ابتدای لیست
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // ذخیره ویرایش تراکنش موجود (و به‌روزرسانی دسته‌بندی یا مبلغ)
  const handleSaveEditTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx))
    );
  };

  // حذف یک تراکنش بر اساس شناسه
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // افزودن یک دسته‌بندی شخصی جدید
  const handleAddCategory = (newCat: CustomCategory) => {
    setCustomCategories((prev) => [...prev, newCat]);
  };

  // ویرایش دسته‌بندی شخصی و انتقال خودکار تراکنش‌های قدیمی به نام جدید
  const handleUpdateCategory = (oldName: string, updatedCat: CustomCategory) => {
    setCustomCategories((prev) =>
      prev.map((c) => (c.name === oldName ? updatedCat : c))
    );

    // اگر نام دسته‌بندی تغییر کرد، تمام تراکنش‌های ثبت‌شده قبلی نیز به‌روز می‌شوند
    if (oldName !== updatedCat.name) {
      setTransactions((prev) =>
        prev.map((tx) =>
          (tx.category || '').trim().toLowerCase() === oldName.trim().toLowerCase()
            ? { ...tx, category: updatedCat.name }
            : tx
        )
      );
    }
  };

  // حذف دسته‌بندی شخصی و انتقال تراکنش‌های آن به دسته پیش‌فرض
  const handleDeleteCategory = (categoryName: string, reassignTo: string = 'سایر') => {
    setCustomCategories((prev) =>
      prev.filter(
        (c) => c.name.trim().toLowerCase() !== categoryName.trim().toLowerCase()
      )
    );

    // انتقال تراکنش‌های دارای این دسته‌بندی به دسته تعیین‌شده (پیش‌فرض «سایر»)
    setTransactions((prev) =>
      prev.map((tx) =>
        (tx.category || '').trim().toLowerCase() === categoryName.trim().toLowerCase()
          ? { ...tx, category: reassignTo }
          : tx
      )
    );
  };

  // بازنشانی و پاک‌سازی کامل تمامی تراکنش‌ها برای شروع مجدد
  const handleResetData = () => {
    setTransactions([]);
    saveTransactions([]);
    setChartAccountFilter('all');
  };

  // وارد کردن تراکنش‌ها از فایل پشتیبان محلی
  const handleImportTransactions = (imported: Transaction[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setTransactions(imported);
    } else {
      // ادغام بدون تکرار شناسه‌ها
      setTransactions((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newOnes = imported.filter((t) => !existingIds.has(t.id));
        return [...newOnes, ...prev];
      });
    }
  };

  // وارد کردن دسته‌بندی‌های شخصی از فایل پشتیبان
  const handleImportCustomCategories = (importedCats: CustomCategory[]) => {
    setCustomCategories((prev) => {
      const existingNames = new Set(prev.map((c) => c.name.trim().toLowerCase()));
      const toAdd = importedCats.filter(
        (c) => !existingNames.has(c.name.trim().toLowerCase())
      );
      return [...prev, ...toAdd];
    });
  };

  // به‌روزرسانی تراکنش‌ها از Google Drive
  const handleUpdateTransactionsFromDrive = (driveTransactions: Transaction[]) => {
    setTransactions(driveTransactions);
  };

  // به‌روزرسانی دسته‌بندی‌های شخصی از Google Drive
  const handleUpdateCategoriesFromDrive = (driveCategories: CustomCategory[]) => {
    setCustomCategories(driveCategories);
  };

  // محاسبه مجموع درآمدها
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // محاسبه مجموع هزینه‌ها
  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // محاسبه مانده حساب (درآمد منهای هزینه)
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      <div>
        {/* هدر صفحه با دکمه دسته‌بندی‌ها و پشتیبان‌گیری */}
        <Header
          transactionCount={transactions.length}
          onResetData={handleResetData}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          userEmail={user?.email || null}
        />

        {/* بدنه اصلی اپلیکیشن */}
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {/* بنر نصب اپلیکیشن روی گوشی (PWA اندروید) */}
          <PWAInstallBanner />

          {/* بخش ۱: کارت‌های خلاصه وضعیت مالی (درآمد، هزینه، مانده حساب) */}
          <SummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />

          {/* بخش ۲: همگام‌سازی ابری با Google Drive (ذخیره مستقیم روی درایو ایمیل لاگین‌شده) */}
          <GoogleDriveSync
            user={user}
            accessToken={accessToken}
            onAuthSuccess={(authedUser, token) => {
              setUser(authedUser);
              setAccessToken(token);
            }}
            onAuthSignOut={() => {
              setUser(null);
              setAccessToken(null);
            }}
            transactions={transactions}
            onUpdateTransactionsFromDrive={handleUpdateTransactionsFromDrive}
            customCategories={customCategories}
            onUpdateCategoriesFromDrive={handleUpdateCategoriesFromDrive}
          />

          {/* بخش ۳: نمودار دایره‌ای توزیع هزینه‌ها بر اساس دسته‌بندی و حساب با Recharts */}
          <ExpenseDistributionChart
            transactions={transactions}
            selectedAccountFilter={chartAccountFilter}
            onAccountFilterChange={setChartAccountFilter}
            availableAccounts={availableAccounts}
            customCategories={customCategories}
          />

          {/* بخش ۴: ورودی ثبت تراکنش (با هوش مصنوعی یا دستی مستقیم به همراه دسته‌بندی‌های شخصی) */}
          <TransactionInput
            onAddTransaction={handleAddTransaction}
            availableAccounts={availableAccounts}
            customCategories={customCategories}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          />

          {/* بخش ۵: لیست تراکنش‌ها به همراه قابلیت ویرایش و تغییر دسته */}
          <TransactionList
            transactions={transactions}
            filter={filter}
            onFilterChange={setFilter}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            customCategories={customCategories}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          />
        </main>
      </div>

      {/* مودال مدیریت و ایجاد دسته‌بندی‌های شخصی */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        customCategories={customCategories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        transactions={transactions}
      />

      {/* مودال ویرایش تراکنش‌های ثبت‌شده */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSave={handleSaveEditTransaction}
        customCategories={customCategories}
        availableAccounts={availableAccounts}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
      />

      {/* مودال پشتیبان‌گیری و انتقال به Google Drive */}
      <BackupManagerModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        transactions={transactions}
        onImportTransactions={handleImportTransactions}
        customCategories={customCategories}
        onImportCustomCategories={handleImportCustomCategories}
      />

      {/* فوتر مینیمال */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>حسابداری شخصی هوشمند • نسخه PWA قابل نصب روی اندروید</span>
          <span>ذخیره خودکار در حافظه دستگاه و همگام‌سازی مستقیم با Google Drive</span>
        </div>
      </footer>
    </div>
  );
}
