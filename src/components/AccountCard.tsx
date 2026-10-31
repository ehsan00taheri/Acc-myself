import React from 'react';
import {
  CreditCard,
  Landmark,
  Wallet,
  PiggyBank,
  Coins,
  Edit2,
  Trash2,
  Check,
  Star,
  Smartphone,
} from 'lucide-react';
import { Account } from '../types';
import { formatPersianCurrency, toPersianDigits, CARD_COLOR_PRESETS } from '../utils/persian';

interface AccountCardProps {
  account: Account;
  currentBalance?: number;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  onSetDefault?: (account: Account) => void;
  onClick?: (account: Account) => void;
  isSelected?: boolean;
  compact?: boolean;
}

// نگاشت نام آیکون به کامپوننت آیکون
export const renderAccountIcon = (iconName?: string, className = 'w-5 h-5') => {
  switch (iconName) {
    case 'Wallet':
      return <Wallet className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'PiggyBank':
      return <PiggyBank className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'CreditCard':
    default:
      return <CreditCard className={className} />;
  }
};

/**
 * کامپوننت نمایش شکیل کارت بانکی / حساب با استایل واقعی کارت‌های بانکی ایران
 */
export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  currentBalance,
  onEdit,
  onDelete,
  onSetDefault,
  onClick,
  isSelected = false,
  compact = false,
}) => {
  // یافتن گرادینت متناسب با رنگ انتخابی
  const colorPreset = CARD_COLOR_PRESETS.find(
    (p) => p.hex.toLowerCase() === (account.color || '').toLowerCase()
  );
  const gradientClass = colorPreset?.gradient || 'from-slate-700 to-slate-900';

  // فرمت ۴ رقم یا شماره کارت
  const formattedCardNumber = account.cardNumber
    ? account.cardNumber.length === 4
      ? `•••• •••• •••• ${toPersianDigits(account.cardNumber)}`
      : account.cardNumber.length === 16
      ? `${toPersianDigits(account.cardNumber.slice(0, 4))}  ••••  ••••  ${toPersianDigits(account.cardNumber.slice(12))}`
      : toPersianDigits(account.cardNumber)
    : 'حساب نقدی / عمومی';

  const balanceToDisplay = currentBalance !== undefined ? currentBalance : account.initialBalance || 0;

  if (compact) {
    return (
      <div
        onClick={() => onClick && onClick(account)}
        className={`relative overflow-hidden rounded-xl p-3.5 text-white transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md select-none bg-gradient-to-br ${gradientClass} ${
          isSelected ? 'ring-3 ring-indigo-500 ring-offset-2 scale-[1.02]' : 'hover:scale-[1.01]'
        }`}
        style={!colorPreset ? { backgroundColor: account.color } : undefined}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              {renderAccountIcon(account.iconName, 'w-4 h-4 text-white')}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold truncate leading-tight">{account.name}</h4>
              <p className="text-[11px] text-white/80 truncate">{account.bankName || 'بانک'}</p>
            </div>
          </div>
          {account.isDefault && (
            <span className="shrink-0 text-[10px] bg-white/25 backdrop-blur-xs text-white px-1.5 py-0.5 rounded font-medium">
              پیش‌فرض
            </span>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-white/15 flex items-end justify-between">
          <div className="text-[11px] font-mono tracking-wider text-white/80 dir-ltr text-right">
            {formattedCardNumber}
          </div>
          <div className="text-right">
            <span className="text-[10px] text-white/70 block">موجودی فعلی</span>
            <span className="text-sm font-extrabold tracking-tight">
              {formatPersianCurrency(balanceToDisplay)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-br ${gradientClass}`}
      style={!colorPreset ? { backgroundColor: account.color } : undefined}
    >
      {/* الگوهای دکوراتیو نیمه‌شفاف برای حس کارت بانکی مدرن */}
      <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-black/20 blur-xl pointer-events-none" />

      {/* بخش بالای کارت: نام بانک، چیپ و نشان پیش‌فرض */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            {renderAccountIcon(account.iconName, 'w-5 h-5 text-white')}
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">{account.name}</h3>
            <span className="text-xs text-white/80">{account.bankName || 'حساب بانکی'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {account.isDefault ? (
            <span className="flex items-center gap-1 text-[11px] bg-amber-400/90 text-amber-950 font-bold px-2 py-0.5 rounded-full shadow-xs">
              <Star className="w-3 h-3 fill-amber-950" />
              <span>پیش‌فرض</span>
            </span>
          ) : (
            onSetDefault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(account);
                }}
                title="تنظیم به عنوان کارت پیش‌فرض"
                className="text-[11px] bg-white/15 hover:bg-white/25 text-white/90 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                کارت اصلی شود؟
              </button>
            )
          )}
        </div>
      </div>

      {/* چیپ کارت هوشمند و نشان تراکنش بدون تماس */}
      <div className="relative z-10 my-4 flex items-center justify-between">
        <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-400/50 shadow-inner flex items-center justify-center">
          <div className="w-7 h-4 border border-amber-600/40 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
            <div className="border-r border-amber-600/40" />
            <div />
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/60">
          <div className="w-2 h-2 rounded-full border border-white/60" />
          <div className="w-3 h-3 rounded-full border border-white/60 border-l-0" />
          <div className="w-4 h-4 rounded-full border border-white/60 border-l-0" />
        </div>
      </div>

      {/* شماره کارت */}
      <div className="relative z-10 my-2 dir-ltr text-center font-mono text-base tracking-widest text-white/90 drop-shadow-xs">
        {formattedCardNumber}
      </div>

      {/* بخش پایین: موجودی فعلی و اولیه + دکمه‌های کنترل */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-end justify-between">
        <div>
          <span className="text-[11px] text-white/70 block mb-0.5">موجودی فعلی (زنده)</span>
          <span className="text-lg font-black tracking-tight text-white drop-shadow-xs">
            {formatPersianCurrency(balanceToDisplay)}
          </span>
          {account.initialBalance > 0 && (
            <span className="text-[10px] text-white/65 block mt-0.5">
              موجودی اولیه: {formatPersianCurrency(account.initialBalance)}
            </span>
          )}
        </div>

        {/* دکمه‌های ویرایش و حذف */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account);
                }}
                title="ویرایش حساب و کارت"
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(account);
                }}
                title="حذف حساب"
                className="p-1.5 rounded-lg bg-white/20 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
