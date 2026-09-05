/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Transaction, FilterType } from './types';
import { INITIAL_TRANSACTIONS, DEFAULT_ACCOUNTS } from './utils/persian';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { ExpenseDistributionChart } from './components/ExpenseDistributionChart';
import { TransactionInput } from './components/TransactionInput';
import { TransactionList } from './components/TransactionList';
import { BackupManagerModal } from './components/BackupManagerModal';
import { GoogleDriveSync } from './components/GoogleDriveSync';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { loadTransactions, saveTransactions } from './services/storage';
import { initAuth } from './services/driveAuth';

export default function App() {
  // بارگذاری اولیه داده‌ها از سرویس ذخیره‌سازی محلی
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = loadTransactions();
    if (saved && saved.length > 0) {
      return saved;
    }
    return INITIAL_TRANSACTIONS;
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

  // وضعیت باز/بسته بودن مودال مدیریت داده‌ها و پشتیبان‌گیری
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // لیست حساب‌های منحصر به فرد موجود در تراکنش‌ها + حساب‌های پیش‌فرض
  const availableAccounts = useMemo(() => {
    const set = new Set<string>(DEFAULT_ACCOUNTS);
    transactions.forEach((tx) => {
      if (tx.account) set.add(tx.account);
    });
    return Array.from(set);
  }, [transactions]);

  // ذخیره‌سازی خودکار تغییرات در سرویس دیتابیس محلی (آفلاین اول)
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // افزودن تراکنش جدید به ابتدای لیست
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // حذف یک تراکنش بر اساس شناسه
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // بازنشانی داده‌ها به حالت نمونه اولیه
  const handleResetData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
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

  // به‌روزرسانی تراکنش‌ها از Google Drive
  const handleUpdateTransactionsFromDrive = (driveTransactions: Transaction[]) => {
    setTransactions(driveTransactions);
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
        {/* هدر صفحه با دکمه پشتیبان‌گیری */}
        <Header
          transactionCount={transactions.length}
          onResetData={handleResetData}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
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
          />

          {/* بخش ۳: نمودار دایره‌ای توزیع هزینه‌ها بر اساس دسته‌بندی و حساب با Recharts */}
          <ExpenseDistributionChart
            transactions={transactions}
            selectedAccountFilter={chartAccountFilter}
            onAccountFilterChange={setChartAccountFilter}
            availableAccounts={availableAccounts}
          />

          {/* بخش ۴: ورودی متن طبیعی با تحلیل هوش مصنوعی و تفکیک حساب */}
          <TransactionInput
            onAddTransaction={handleAddTransaction}
            availableAccounts={availableAccounts}
          />

          {/* بخش ۵: لیست تراکنش‌ها به همراه فیلتر ساده و برچسب حساب */}
          <TransactionList
            transactions={transactions}
            filter={filter}
            onFilterChange={setFilter}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </main>
      </div>

      {/* مودال پشتیبان‌گیری و انتقال به Google Drive */}
      <BackupManagerModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        transactions={transactions}
        onImportTransactions={handleImportTransactions}
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


