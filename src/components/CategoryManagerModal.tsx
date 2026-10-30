import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Tag,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CustomCategory, CategoryType, Transaction } from '../types';
import { DEFAULT_CATEGORIES, toPersianDigits } from '../utils/persian';
import {
  CategoryIcon,
  AVAILABLE_CATEGORY_ICONS,
  CATEGORY_COLOR_PALETTE,
} from './CategoryIcon';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCategories: CustomCategory[];
  onAddCategory: (category: CustomCategory) => void;
  onUpdateCategory: (oldName: string, updatedCategory: CustomCategory) => void;
  onDeleteCategory: (categoryName: string, reassignTo?: string) => void;
  transactions: Transaction[];
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  customCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  transactions,
}) => {
  // فیلتر فعال نوع دسته: همه / هزینه / درآمد
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');

  // فرم افزودن دسته جدید
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CategoryType>('expense');
  const [newIcon, setNewIcon] = useState('Tag');
  const [newColor, setNewColor] = useState('#6366f1');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // حالت ویرایش یک دسته موجود
  const [editingCategory, setEditingCategory] = useState<{
    originalName: string;
    id: string;
    name: string;
    type: CategoryType;
    iconName: string;
    color: string;
  } | null>(null);

  // دیالوگ تأیید حذف
  const [deletingCategory, setDeletingCategory] = useState<{
    name: string;
    count: number;
  } | null>(null);

  if (!isOpen) return null;

  // ترکیب دسته‌های پیش‌فرض و سفارشی
  const allCategories: CustomCategory[] = [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ];

  // محاسبه تعداد استفاده از هر دسته در تراکنش‌ها
  const getUsageCount = (catName: string) => {
    return transactions.filter(
      (tx) => (tx.category || '').trim().toLowerCase() === catName.trim().toLowerCase()
    ).length;
  };

  // فیلتر دسته‌بندی‌ها بر اساس تب
  const filteredCategories = allCategories.filter((cat) => {
    if (activeTab === 'all') return true;
    if (cat.type === 'both') return true;
    return cat.type === activeTab;
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingCategory(null);
    setNewName('');
    setNewType(activeTab === 'income' ? 'income' : 'expense');
    setNewIcon('Tag');
    setNewColor(CATEGORY_COLOR_PALETTE[Math.floor(Math.random() * CATEGORY_COLOR_PALETTE.length)].hex);
    setErrorMessage(null);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMessage('لطفاً نام دسته‌بندی را وارد کنید.');
      return;
    }

    // بررسی عدم تکراری بودن نام
    const exists = allCategories.some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorMessage('دسته‌بندی با این نام از قبل وجود دارد.');
      return;
    }

    const created: CustomCategory = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: trimmed,
      type: newType,
      iconName: newIcon,
      color: newColor,
      isCustom: true,
    };

    onAddCategory(created);
    setIsAdding(false);
    setNewName('');
    setErrorMessage(null);
  };

  const handleStartEdit = (cat: CustomCategory) => {
    setEditingCategory({
      originalName: cat.name,
      id: cat.id,
      name: cat.name,
      type: cat.type,
      iconName: cat.iconName,
      color: cat.color,
    });
    setIsAdding(false);
    setErrorMessage(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const trimmed = editingCategory.name.trim();
    if (!trimmed) {
      setErrorMessage('نام دسته‌بندی نمی‌تواند خالی باشد.');
      return;
    }

    // اگر نام تغییر کرده، بررسی عدم تکراری بودن
    if (trimmed.toLowerCase() !== editingCategory.originalName.trim().toLowerCase()) {
      const exists = allCategories.some(
        (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) {
        setErrorMessage('دسته‌بندی دیگری با این نام وجود دارد.');
        return;
      }
    }

    const updated: CustomCategory = {
      id: editingCategory.id,
      name: trimmed,
      type: editingCategory.type,
      iconName: editingCategory.iconName,
      color: editingCategory.color,
      isCustom: true,
    };

    onUpdateCategory(editingCategory.originalName, updated);
    setEditingCategory(null);
    setErrorMessage(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    onDeleteCategory(deletingCategory.name, 'سایر');
    setDeletingCategory(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* هدر مودال */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                مدیریت دسته‌بندی‌های دخل و خرج
              </h2>
              <p className="text-xs text-slate-500">
                ایجاد، ویرایش و شخصی‌سازی دسته‌ها با نام، رنگ و آیکون دلخواه
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فیلتر تب‌ها و دکمه افزودن */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه ({toPersianDigits(allCategories.length)})
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هزینه‌ها
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              درآمدها
            </button>
          </div>

          {!isAdding && !editingCategory && (
            <button
              id="btn-add-custom-category"
              onClick={handleStartAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>دسته‌بندی جدید</span>
            </button>
          )}
        </div>

        {/* فرم ایجاد / ویرایش دسته‌بندی */}
        {(isAdding || editingCategory) && (
          <form
            onSubmit={isAdding ? handleSaveNew : handleSaveEdit}
            className="p-4 sm:p-5 bg-indigo-50/40 border-b border-indigo-100 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {isAdding ? 'ایجاد دسته‌بندی جدید' : `ویرایش دسته‌بندی: ${editingCategory?.originalName}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingCategory(null);
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                انصراف
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* نام دسته‌بندی */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  نام دسته‌بندی
                </label>
                <input
                  type="text"
                  placeholder="مثال: باشگاه و تناسب اندام، اقساط، پت شاپ..."
                  value={isAdding ? newName : editingCategory?.name || ''}
                  onChange={(e) => {
                    if (isAdding) setNewName(e.target.value);
                    else if (editingCategory)
                      setEditingCategory({ ...editingCategory, name: e.target.value });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {/* نوع دسته‌بندی */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  نوع تراکنش
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {(['expense', 'income', 'both'] as CategoryType[]).map((t) => {
                    const currentType = isAdding ? newType : editingCategory?.type;
                    const labels: Record<CategoryType, string> = {
                      expense: 'هزینه',
                      income: 'درآمد',
                      both: 'هر دو',
                    };
                    const isSelected = currentType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (isAdding) setNewType(t);
                          else if (editingCategory)
                            setEditingCategory({ ...editingCategory, type: t });
                        }}
                        className={`text-[11px] py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* انتخاب رنگ */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                انتخاب رنگ نمایش و نمودار
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_COLOR_PALETTE.map((c) => {
                  const currentColor = isAdding ? newColor : editingCategory?.color;
                  const isSelected = currentColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => {
                        if (isAdding) setNewColor(c.hex);
                        else if (editingCategory)
                          setEditingCategory({ ...editingCategory, color: c.hex });
                      }}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                        isSelected ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* انتخاب آیکون */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                انتخاب نماد / آیکون
              </label>
              <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                {AVAILABLE_CATEGORY_ICONS.map((iconItem) => {
                  const currentIcon = isAdding ? newIcon : editingCategory?.iconName;
                  const isSelected = currentIcon === iconItem.name;
                  const IconComp = iconItem.icon;
                  return (
                    <button
                      key={iconItem.name}
                      type="button"
                      title={iconItem.label}
                      onClick={() => {
                        if (isAdding) setNewIcon(iconItem.name);
                        else if (editingCategory)
                          setEditingCategory({ ...editingCategory, iconName: iconItem.name });
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* پیش‌نمایش زنده و دکمه ذخیره */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-indigo-100/60">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">پیش‌نمایش:</span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: isAdding ? newColor : editingCategory?.color }}
                >
                  <CategoryIcon
                    iconName={isAdding ? newIcon : editingCategory?.iconName}
                    className="w-3.5 h-3.5"
                  />
                  <span>
                    {(isAdding ? newName : editingCategory?.name) || 'نام دسته‌بندی'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isAdding ? 'افزودن دسته‌بندی' : 'ذخیره تغییرات'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* لیست دسته‌بندی‌ها */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              دسته‌بندی در این فیلتر یافت نشد.
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const usageCount = getUsageCount(cat.name);
              const isCustom = Boolean(cat.isCustom);

              return (
                <div
                  key={cat.id || cat.name}
                  className="pt-2.5 pb-2.5 first:pt-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.iconName} className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">
                          {cat.name}
                        </span>

                        {isCustom ? (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                            شخصی
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            پیش‌فرض
                          </span>
                        )}

                        <span className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          {cat.type === 'expense'
                            ? 'هزینه'
                            : cat.type === 'income'
                            ? 'درآمد'
                            : 'هزینه و درآمد'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {toPersianDigits(usageCount)} تراکنش ثبت‌شده
                      </div>
                    </div>
                  </div>

                  {/* دکمه‌های ویرایش و حذف فقط برای دسته‌های شخصی */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isCustom ? (
                      <>
                        <button
                          onClick={() => handleStartEdit(cat)}
                          title="ویرایش دسته‌بندی"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeletingCategory({
                              name: cat.name,
                              count: usageCount,
                            })
                          }
                          title="حذف دسته‌بندی"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 px-2 py-1">
                        سیستمی
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* مودال تأیید حذف */}
        {deletingCategory && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
              <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                حذف دسته‌بندی «{deletingCategory.name}»
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {deletingCategory.count > 0
                  ? `این دسته‌بندی در ${toPersianDigits(deletingCategory.count)} تراکنش استفاده شده است. با حذف آن، دسته‌بندی این تراکنش‌ها به صورت خودکار به «سایر» تغییر خواهد کرد.`
                  : 'آیا از حذف این دسته‌بندی اطمینان دارید؟'}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  تأیید و حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* فوتر مودال */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>دسته‌بندی‌های شخصی همزمان در حافظه محلی و Google Drive ذخیره می‌شوند.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
