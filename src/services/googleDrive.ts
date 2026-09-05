/**
 * ماژول تعامل با Google Drive API v3 جهت ذخیره، همگام‌سازی و خواندن تراکنش‌ها
 */

import { Transaction } from '../types';

export const DRIVE_FILENAME = 'hesabdari_personal_finance.json';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

export interface DriveStoragePayload {
  app: string;
  version: string;
  updatedAt: string;
  userEmail?: string;
  transactions: Transaction[];
}

/**
 * جستجوی فایل دیتابیس حسابداری در گوگل درایو کاربر
 */
export async function findDatabaseFileOnDrive(accessToken: string): Promise<DriveFileInfo | null> {
  const query = encodeURIComponent(`name = '${DRIVE_FILENAME}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&pageSize=1`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('اعتبار توکن گوگل منقضی شده است. لطفاً دوباره وارد شوید.');
    }
    const errData = await response.text();
    throw new Error(`خطای درایو: ${response.status} - ${errData}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveFileInfo;
  }
  return null;
}

/**
 * خواندن محتوای دیتابیس از فایل موجود در گوگل درایو
 */
export async function loadDatabaseFromDrive(
  accessToken: string,
  fileId: string
): Promise<{ transactions: Transaction[]; modifiedTime?: string }> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`خطا در خواندن فایل از گوگل درایو: وضعیت ${response.status}`);
  }

  const json = await response.json();
  let list: Transaction[] = [];

  if (Array.isArray(json)) {
    list = json;
  } else if (json && Array.isArray(json.transactions)) {
    list = json.transactions;
  } else if (json && Array.isArray(json.data)) {
    list = json.data;
  }

  // اعتبارسنجی اولیه ساختار تراکنش‌ها
  const validList = list.filter(
    (tx) => tx && typeof tx.amount === 'number' && (tx.type === 'expense' || tx.type === 'income')
  );

  return {
    transactions: validList,
    modifiedTime: json?.updatedAt,
  };
}

/**
 * ذخیره یا به‌روزرسانی فایل تراکنش‌ها در گوگل درایو
 */
export async function saveDatabaseToDrive(
  accessToken: string,
  transactions: Transaction[],
  existingFileId?: string | null,
  userEmail?: string
): Promise<{ fileId: string; modifiedTime: string }> {
  const payload: DriveStoragePayload = {
    app: 'hesabdari-smart-pwa',
    version: '2.5.0',
    updatedAt: new Date().toISOString(),
    userEmail: userEmail || undefined,
    transactions,
  };

  const content = JSON.stringify(payload, null, 2);

  // اگر فایل از قبل در درایو وجود دارد، فقط محتوای آن را PATCH می‌کنیم
  if (existingFileId) {
    const updateResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: content,
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`خطا در به‌روزرسانی فایل در گوگل درایو: ${updateResponse.status}`);
    }

    const resJson = await updateResponse.json();
    return {
      fileId: existingFileId,
      modifiedTime: resJson.modifiedTime || payload.updatedAt,
    };
  }

  // در غیر این صورت، فایل جدیدی در ریشه Google Drive کاربر ایجاد می‌کنیم (Multipart upload)
  const metadata = {
    name: DRIVE_FILENAME,
    mimeType: 'application/json',
    description: 'دیتابیس پشتیبان تراکنش‌های حسابداری شخصی هوشمند',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    content +
    closeDelimiter;

  const createResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!createResponse.ok) {
    throw new Error(`خطا در ایجاد فایل در گوگل درایو: ${createResponse.status}`);
  }

  const createResult = await createResponse.json();
  return {
    fileId: createResult.id,
    modifiedTime: createResult.modifiedTime || payload.updatedAt,
  };
}
