import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Moon,
  Sun,
  Globe,
  ShoppingCart,
  User as UserIcon,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronDown,
  Lock,
  Check
} from 'lucide-react';
import { Logo } from './Logo';
import { User, UserRole } from '../types';
import { Language, translations } from '../i18n';
import { storage } from '../services/storage';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: User | null;
  onRoleChange: (role: UserRole) => void;
  lang: Language;
  onLanguageToggle: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenAuditReport: () => void;
  shopPhone: string;
  shopWhatsApp: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onRoleChange,
  lang,
  onLanguageToggle,
  isDark,
  onThemeToggle,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenAuditReport,
  shopPhone,
  shopWhatsApp
}) => {
  const t = translations[lang];
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close role menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    if (isRoleMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isRoleMenuOpen]);

  // Properly encoded Google Maps store location link
  const storeMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    'MADHAV MEDICAL HALL, Chanman, Baheri, Darbhanga, Bihar 847101'
  )}`;

  const isOwnerAdmin = storage.isSingleAdmin(currentUser);
  const isAuthorizedDelivery = storage.isAuthorizedDeliveryStaff(currentUser);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors select-none">
      {/* Top micro contact banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-emerald-900 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-medium hidden sm:inline">
              📍 Chanman, Baheri (Darbhanga) - 847101
            </span>
            <a
              href={storeMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              <MapPin size={12} />
              <span>{t.getDirections}</span>
            </a>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <a
              href={`tel:${shopPhone}`}
              className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition-colors"
            >
              <Phone size={12} className="text-emerald-400" />
              <span>{shopPhone}</span>
            </a>
            <a
              href={`https://wa.me/91${shopWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-600 px-2 py-0.5 rounded-full transition-colors"
            >
              <MessageCircle size={12} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <Logo size={42} />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-blue-900 dark:text-blue-400 text-base sm:text-lg leading-tight tracking-tight">
                MADHAV MEDICAL HALL
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                2016
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.tagline}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Role selector dropdown badge with strict permission guard */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              title="Select portal (Customer / Admin / Delivery)"
              className="min-h-[44px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
            >
              {currentRole === 'admin' && (
                <>
                  <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">{t.adminRole}</span>
                  <span className="sm:hidden">Admin</span>
                </>
              )}
              {currentRole === 'delivery' && (
                <>
                  <Truck size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">{t.deliveryRole}</span>
                  <span className="sm:hidden">Delivery</span>
                </>
              )}
              {currentRole === 'customer' && (
                <>
                  <UserIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">{t.customerRole}</span>
                  <span className="sm:hidden">Shop</span>
                </>
              )}
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Role Switcher Menu Popover */}
            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 z-50 animate-slide-up text-left">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === 'hi' ? 'पोर्टल चयन (Select Workspace)' : 'Select Workspace / Portal'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'hi' ? 'भूमिका अनुसार सुरक्षित पहुंच' : 'Role-based authorized access'}
                  </span>
                </div>

                {/* 1. Customer Store (Always Accessible) */}
                <button
                  type="button"
                  onClick={() => {
                    onRoleChange('customer');
                    setIsRoleMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                    currentRole === 'customer'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {lang === 'hi' ? 'ग्राहक दुकान (Customer Store)' : 'Customer Medicine Store'}
                      </span>
                      {currentRole === 'customer' && <Check size={14} className="text-emerald-600 stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {lang === 'hi' ? 'दवाई खोज, कार्ट एवं ऑर्डर' : 'Medicine search, cart & orders'}
                    </span>
                  </div>
                </button>

                {/* 2. Admin Dashboard (Strict Single Owner Only) */}
                <button
                  type="button"
                  onClick={() => {
                    if (isOwnerAdmin) {
                      onRoleChange('admin');
                      setIsRoleMenuOpen(false);
                    } else {
                      setIsRoleMenuOpen(false);
                      onOpenAuth();
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                    currentRole === 'admin'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {lang === 'hi' ? 'व्यवस्थापक डैशबोर्ड (Admin)' : 'Admin Dashboard'}
                      </span>
                      {currentRole === 'admin' ? (
                        <Check size={14} className="text-blue-600 stroke-[3]" />
                      ) : !isOwnerAdmin ? (
                        <Lock size={12} className="text-amber-500" />
                      ) : null}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {isOwnerAdmin
                        ? (lang === 'hi' ? 'दुकान मालिक (सत्यापित)' : 'Shop Owner (Verified)')
                        : (lang === 'hi' ? 'केवल मालिक (madhavmedicalhall2016@gmail.com)' : 'Owner Only (Login Required)')}
                    </span>
                  </div>
                </button>

                {/* 3. Delivery Staff Portal (Admin-Authorized Personnel Only) */}
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthorizedDelivery) {
                      onRoleChange('delivery');
                      setIsRoleMenuOpen(false);
                    } else {
                      setIsRoleMenuOpen(false);
                      onOpenAuth();
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                    currentRole === 'delivery'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {lang === 'hi' ? 'डिलीवरी पोर्टल (Delivery)' : 'Delivery Staff Portal'}
                      </span>
                      {currentRole === 'delivery' ? (
                        <Check size={14} className="text-amber-600 stroke-[3]" />
                      ) : !isAuthorizedDelivery ? (
                        <Lock size={12} className="text-amber-500" />
                      ) : null}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {isAuthorizedDelivery
                        ? (lang === 'hi' ? 'अधिकृत कर्मी (सत्यापित)' : 'Authorized Staff (Active)')
                        : (lang === 'hi' ? 'केवल एडमिन द्वारा जोड़े गए कर्मी' : 'Admin-Authorized Staff Only')}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Play Store Scan audit modal launcher */}
          <button
            onClick={onOpenAuditReport}
            title={t.playScanTitle}
            className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles size={16} />
            <span className="hidden md:inline">Play Scan</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onLanguageToggle}
            aria-label="Toggle Hindi or English language"
            className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Globe size={16} />
            <span className="font-bold">{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            aria-label="Toggle Dark Mode"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {/* Cart Icon (Customer view only) */}
          {currentRole === 'customer' && (
            <button
              onClick={onOpenCart}
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative min-h-[44px] min-w-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[11px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User profile / Login button */}
          <button
            onClick={onOpenAuth}
            aria-label="User Account"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <UserIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
