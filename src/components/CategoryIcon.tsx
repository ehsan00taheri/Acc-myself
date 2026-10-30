import React from 'react';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  HeartPulse,
  Sparkles,
  BookOpen,
  Wallet,
  TrendingUp,
  Receipt,
  Coffee,
  Dumbbell,
  PawPrint,
  Laptop,
  Plane,
  Music,
  Gift,
  Briefcase,
  GraduationCap,
  Baby,
  Wrench,
  Smartphone,
  Tag,
  CircleDollarSign,
  Fuel,
  Bus,
  Film,
  Building,
  CreditCard,
} from 'lucide-react';

export interface IconOption {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AVAILABLE_CATEGORY_ICONS: IconOption[] = [
  { name: 'Utensils', label: 'غذا و رستوران', icon: Utensils },
  { name: 'Coffee', label: 'کافه و نوشیدنی', icon: Coffee },
  { name: 'ShoppingBag', label: 'خرید و فروشگاه', icon: ShoppingBag },
  { name: 'Car', label: 'خودرو و سوخت', icon: Car },
  { name: 'Fuel', label: 'بنزین و گاز', icon: Fuel },
  { name: 'Bus', label: 'حمل‌ونقل عمومی', icon: Bus },
  { name: 'Home', label: 'خانه و مسکن', icon: Home },
  { name: 'Building', label: 'ساختمان و دفتر', icon: Building },
  { name: 'Wallet', label: 'حقوق و کیف پول', icon: Wallet },
  { name: 'CircleDollarSign', label: 'درآمد و پول', icon: CircleDollarSign },
  { name: 'TrendingUp', label: 'سرمایه‌گذاری و بورس', icon: TrendingUp },
  { name: 'CreditCard', label: 'کارت و وام', icon: CreditCard },
  { name: 'HeartPulse', label: 'پزشکی و سلامت', icon: HeartPulse },
  { name: 'Dumbbell', label: 'ورزش و باشگاه', icon: Dumbbell },
  { name: 'Sparkles', label: 'زیبایی و تفریح', icon: Sparkles },
  { name: 'Film', label: 'سینما و سرگرمی', icon: Film },
  { name: 'BookOpen', label: 'کتاب و آموزش', icon: BookOpen },
  { name: 'GraduationCap', label: 'دانشگاه و تحصیل', icon: GraduationCap },
  { name: 'Laptop', label: 'فناوری و کار', icon: Laptop },
  { name: 'Smartphone', label: 'موبایل و اینترنت', icon: Smartphone },
  { name: 'PawPrint', label: 'حیوانات خانگی', icon: PawPrint },
  { name: 'Baby', label: 'کودک و خانواده', icon: Baby },
  { name: 'Gift', label: 'هدیه و پاداش', icon: Gift },
  { name: 'Plane', label: 'سفر و مسافرت', icon: Plane },
  { name: 'Briefcase', label: 'پروژه و شغل', icon: Briefcase },
  { name: 'Wrench', label: 'تعمیرات و نگهداری', icon: Wrench },
  { name: 'Receipt', label: 'قبوض و اسناد', icon: Receipt },
  { name: 'Tag', label: 'سایر و متفرقه', icon: Tag },
];

export const CATEGORY_COLOR_PALETTE = [
  { hex: '#f59e0b', name: 'کهربایی / نارنجی' },
  { hex: '#0284c7', name: 'آبی آسمانی' },
  { hex: '#9333ea', name: 'بنفش سلطنتی' },
  { hex: '#db2777', name: 'صورتی ملایم' },
  { hex: '#e11d48', name: 'قرمز یاقوتی' },
  { hex: '#6366f1', name: 'نیلی / ایندیگو' },
  { hex: '#0d9488', name: 'سبز کله‌غازی' },
  { hex: '#10b981', name: 'سبز زمردی' },
  { hex: '#059669', name: 'سبز تیره' },
  { hex: '#ea580c', name: 'نارنجی تند' },
  { hex: '#2563eb', name: 'آبی کاربنی' },
  { hex: '#8b5cf6', name: 'بنفش زنبقی' },
  { hex: '#d97706', name: 'عسلی' },
  { hex: '#64748b', name: 'طوسی تیره' },
];

interface CategoryIconProps {
  iconName?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName = 'Tag',
  className = 'w-4 h-4',
}) => {
  const found = AVAILABLE_CATEGORY_ICONS.find((item) => item.name === iconName);
  if (found) {
    const Component = found.icon;
    return <Component className={className} />;
  }

  // Fallback defaults
  switch (iconName) {
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Home':
      return <Home className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'PawPrint':
      return <PawPrint className={className} />;
    case 'Laptop':
      return <Laptop className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Receipt':
      return <Receipt className={className} />;
    default:
      return <Tag className={className} />;
  }
};
