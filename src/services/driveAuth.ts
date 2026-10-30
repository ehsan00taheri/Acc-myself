import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Initialize Firebase App safely to prevent module loading crashes in restricted environments
let firebaseAuth: ReturnType<typeof getAuth> | null = null;
let provider: GoogleAuthProvider | null = null;

try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  provider = new GoogleAuthProvider();
  SCOPES.forEach((scope) => provider?.addScope(scope));
  provider.setCustomParameters({ prompt: 'select_account' });
} catch (error) {
  console.warn('Firebase Auth initialization deferred or restricted in current frame:', error);
}

export const auth = firebaseAuth;

// پرچم نشان‌دهنده در حال ورود بودن
let isSigningIn = false;
// کش کردن Access Token در حافظه (RAM) - هرگز در localStorage ذخیره نمی‌شود
let cachedAccessToken: string | null = null;

/**
 * مقداردهی اولیه شنونده وضعیت ورود کاربر به همراه بازیابی نتیجه در صورت هدایت مجدد (Redirect) در مرورگرهای موبایل
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  // بررسی وضعیت ورود پس از هدایت صفحه در موبایل (Redirect Result)
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          if (onAuthSuccess) {
            onAuthSuccess(result.user, credential.accessToken);
          }
        }
      }
    })
    .catch((err) => {
      console.warn('Redirect sign-in resolution:', err);
    });

  try {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          // کاربر در فایربیس لاگین است ولی توکن گوگل را در نشست جدید لازم داریم
          if (onAuthFailure) onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  } catch (error) {
    console.warn('onAuthStateChanged error in iframe:', error);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

/**
 * ورود با اکانت گوگل و دریافت Access Token برای Google Drive
 * با پشتیبانی از پاپ‌آپ و پشتیبانی خودکار از Redirect در صورت مسدود بودن پاپ‌آپ روی گوشی
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth || !provider) {
    throw new Error('سرویس احراز هویت در این پنجره محدود شده است. لطفاً برنامه را در یک تب جدید (Open in new tab) باز کنید.');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('عدم دریافت Access Token از احراز هویت گوگل');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('خطای ورود به گوگل (Popup):', error?.code, error?.message);

    // اگر پاپ‌آپ در مرورگر موبایل مسدود شد یا در تلفن همراه هستیم، به حالت هدایت مستقیم (Redirect) سوئیچ می‌کنیم
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.log('سوئیچ خودکار به ورود با Redirect در مرورگر موبایل...');
      await signInWithRedirect(auth, provider);
      return null;
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * دریافت Access Token فعلی
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * خروج از حساب کاربری
 */
export const googleSignOut = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
  }
  cachedAccessToken = null;
};

