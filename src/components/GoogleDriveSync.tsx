import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  LogOut,
  AlertTriangle,
  FileCheck,
  Shield,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { googleSignIn, googleSignOut } from '../services/driveAuth';
import {
  findDatabaseFileOnDrive,
  loadDatabaseFromDrive,
  saveDatabaseToDrive,
  DriveFileInfo,
} from '../services/googleDrive';
import { Transaction } from '../types';
import { toPersianDigits, formatPersianCurrency } from '../utils/persian';

interface GoogleDriveSyncProps {
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthSignOut: () => void;
  transactions: Transaction[];
  onUpdateTransactionsFromDrive: (transactions: Transaction[]) => void;
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({
  user,
  accessToken,
  onAuthSuccess,
  onAuthSignOut,
  transactions,
  onUpdateTransactionsFromDrive,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveFile, setDriveFile] = useState<DriveFileInfo | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // دیالوگ تأیید برای عملیات جایگزینی (الزام قوانین Workspace برای عملیات بازنویسی)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'save_to_drive' | 'load_from_drive';
  } | null>(null);

  // ورود با گوگل
  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setFeedback(null);
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        setFeedback({
          type: 'success',
          text: `خوش آمدید! به عنوان ${res.user.email} وارد شدید و اتصال گوگل درایو برقرار شد.`,
        });

        // جستجوی خودکار فایل در درایو پس از ورود
        try {
          const file = await findDatabaseFileOnDrive(res.accessToken);
          if (file) {
            setDriveFile(file);
            setFeedback({
              type: 'info',
              text: `یک نسخه دیتابیس قبلی در گوگل درایو شما یافت شد. می‌توانید آن را بارگذاری یا با داده‌های فعلی ادغام کنید.`,
            });
          }
        } catch (searchErr) {
          console.error('خطا در بررسی فایل درایو:', searchErr);
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      let errorMsg = 'خطا در ورود به حساب گوگل. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره امتحان کنید.';
      if (err?.code === 'auth/popup-blocked') {
        errorMsg = 'پنجره پاپ‌آپ ورود توسط مرورگر مسدود شد. لطفاً به مرورگر اجازه باز شدن پنجره را بدهید یا برنامه را در یک تب جدید (Open in new tab) باز کنید.';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        errorMsg = 'پنجره ورود توسط کاربر بسته شد.';
      } else if (err?.code === 'auth/unauthorized-domain') {
        errorMsg = 'دامنه فعلی در فایربیس مجاز نشده است. برنامه را در تب مستقل باز کنید.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setFeedback({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // خروج از حساب گوگل
  const handleSignOut = async () => {
    try {
      await googleSignOut();
      onAuthSignOut();
      setDriveFile(null);
      setLastSyncTime(null);
      setFeedback({ type: 'info', text: 'با موفقیت از حساب گوگل خارج شدید.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'خطا در خروج از حساب.' });
    }
  };

  // ذخیره دیتابیس در گوگل درایو
  const executeSaveToDrive = async () => {
    if (!accessToken) {
      setFeedback({ type: 'error', text: 'ابتدا وارد حساب گوگل خود شوید.' });
      return;
    }

    try {
      setIsSyncing(true);
      setFeedback(null);
      const result = await saveDatabaseToDrive(
        accessToken,
        transactions,
        driveFile?.id,
        user?.email || undefined
      );

      setDriveFile((prev) => ({
        id: result.fileId,
        name: 'hesabdari_personal_finance.json',
        modifiedTime: result.modifiedTime,
      }));

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastSyncTime(timeStr);

      setFeedback({
        type: 'success',
        text: `تعداد ${toPersianDigits(transactions.length)} تراکنش با موفقیت در دیتابیس Google Drive ایمیل شما ذخیره شد.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'خطا در ذخیره فایل در گوگل درایو.',
      });
    } finally {
      setIsSyncing(false);
      setConfirmDialog(null);
    }
  };

  // خواندن و بارگذاری دیتابیس از گوگل درایو
  const executeLoadFromDrive = async () => {
    if (!accessToken) {
      setFeedback({ type: 'error', text: 'ابتدا وارد حساب گوگل خود شوید.' });
      return;
    }

    try {
      setIsSyncing(true);
      setFeedback(null);

      let targetFileId = driveFile?.id;
      if (!targetFileId) {
        const file = await findDatabaseFileOnDrive(accessToken);
        if (!file) {
          setFeedback({
            type: 'info',
            text: 'هنوز فایلی در Google Drive شما ذخیره نشده است. با زدن دکمه «ذخیره در گوگل درایو» اولین نسخه را ایجاد کنید.',
          });
          setIsSyncing(false);
          setConfirmDialog(null);
          return;
        }
        targetFileId = file.id;
        setDriveFile(file);
      }

      const { transactions: driveTransactions } = await loadDatabaseFromDrive(accessToken, targetFileId);

      onUpdateTransactionsFromDrive(driveTransactions);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastSyncTime(timeStr);

      setFeedback({
        type: 'success',
        text: `دیتابیس از Google Drive بارگذاری شد (${toPersianDigits(driveTransactions.length)} تراکنش جایگزین گردید).`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'خطا در خواندن داده‌ها از گوگل درایو.',
      });
    } finally {
      setIsSyncing(false);
      setConfirmDialog(null);
    }
  };

  return (
    <section className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                همگام‌سازی ابری با Google Drive
              </h2>
              {user && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>متصل به حساب</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              ذخیره دائمی تراکنش‌ها روی Google Drive ایمیل شما بدون نیاز به دیتابیس جانبی
            </p>
          </div>
        </div>

        {/* وضعیت و دکمه خروج در صورت لاگین بودن */}
        {user && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'کاربر'}
                  className="w-5 h-5 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Shield className="w-4 h-4 text-slate-500" />
              )}
              <span className="font-medium truncate max-w-[140px] sm:max-w-[180px]">
                {user.email}
              </span>
            </div>

            <button
              id="signout-drive-btn"
              onClick={handleSignOut}
              title="خروج از حساب گوگل"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* اعلان‌های وضعیت */}
      {feedback && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-sky-50 text-sky-800 border border-sky-200'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          {feedback.type === 'info' && <Cloud className="w-4 h-4 text-sky-600 shrink-0" />}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}

      {/* اگر کاربر هنوز لاگین نکرده است: دکمه رسمی ورود با گوگل مطابق استانداردهای Google Workspace */}
      {!user ? (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-3">
          <div className="space-y-1 text-center sm:text-right">
            <div className="text-xs font-bold text-slate-700">
              ورود با حساب گوگل جهت همگام‌سازی مستقیم با Drive
            </div>
            <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
              با ورود به حساب گوگل، فایل دیتابیس <code className="text-indigo-600 font-mono">hesabdari_personal_finance.json</code> مستقیماً در درایو شما ایجاد و با هر دستگاهی قابل بازیابی خواهد بود.
            </p>
          </div>

          {/* استایل استاندارد دکمه رسمی Sign in with Google */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60 shrink-0"
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-4 h-4 shrink-0"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            )}
            <span>{isSigningIn ? 'درحال اتصال...' : 'ورود با حساب گوگل (Drive)'}</span>
          </button>
        </div>
      ) : (
        /* اگر کاربر وارد شده است: ابزارهای همگام‌سازی دوطرفه */
        <div className="pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* دکمه ذخیره در درایو */}
            <button
              id="save-to-drive-btn"
              type="button"
              disabled={isSyncing}
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'ذخیره دیتابیس در Google Drive',
                  description: `آیا مایلید فایل دیتابیس حسابداری روی درایو با ${toPersianDigits(
                    transactions.length
                  )} تراکنش فعلی ذخیره و به‌روزرسانی شود؟`,
                  actionType: 'save_to_drive',
                });
              }}
              className="flex items-center gap-3 p-3 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-50 text-sky-950 transition-all text-right cursor-pointer disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">ذخیره داده‌ها در Google Drive</div>
                <div className="text-[10px] text-sky-700/80 mt-0.5">
                  ارسال آخرین تغییرات به فایل ابری
                </div>
              </div>
            </button>

            {/* دکمه بازیابی/همگام‌سازی از درایو */}
            <button
              id="load-from-drive-btn"
              type="button"
              disabled={isSyncing}
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'بارگذاری داده‌ها از Google Drive',
                  description:
                    'بارگذاری اطلاعات از گوگل درایو باعث جایگزینی تراکنش‌های فعلی این مرورگر با نسخه ذخیره‌شده روی گوگل درایو شما می‌شود. آیا ادامه می‌دهید؟',
                  actionType: 'load_from_drive',
                });
              }}
              className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950 transition-all text-right cursor-pointer disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DownloadCloud className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">بارگذاری از Google Drive</div>
                <div className="text-[10px] text-emerald-700/80 mt-0.5">
                  دریافت تراکنش‌ها در دستگاه یا مرورگر جدید
                </div>
              </div>
            </button>
          </div>

          {/* وضعیت فایل و آخرین همگام‌سازی */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>نام فایل در درایو: <code className="font-mono text-slate-700 font-bold">hesabdari_personal_finance.json</code></span>
            </div>
            {lastSyncTime && (
              <div className="text-slate-400">
                آخرین همگام‌سازی: ساعت {toPersianDigits(lastSyncTime)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* دیالوگ تأیید اجباری قبل از عملیات تغییر یا بازنویسی داده در Google Drive */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تأیید عملیات همگام‌سازی داده‌ها
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => {
                  if (confirmDialog.actionType === 'save_to_drive') {
                    executeSaveToDrive();
                  } else {
                    executeLoadFromDrive();
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSyncing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>تأیید و اجرا</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
