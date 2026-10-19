import React from 'react';
import {
  Home,
  Pill,
  ShoppingBag,
  ShoppingCart,
  User,
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  Truck,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react';
import { UserRole } from '../types';
import { Language, translations } from '../i18n';

interface BottomNavProps {
  currentRole: UserRole;
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  cartCount: number;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRole,
  activeTab,
  onTabSelect,
  cartCount,
  lang
}) => {
  const t = translations[lang];

  interface TabItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number | string;
  }

  // Configure role tabs
  const customerTabs: TabItem[] = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'medicines', label: t.medicines, icon: Pill },
    { id: 'orders', label: t.orders, icon: ShoppingBag },
    { id: 'cart', label: t.cart, icon: ShoppingCart, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'profile', label: t.profile, icon: User }
  ];

  const adminTabs: TabItem[] = [
    { id: 'dashboard', label: t.home, icon: LayoutDashboard },
    { id: 'inventory', label: t.inventory, icon: Pill },
    { id: 'billing', label: t.billing, icon: Receipt },
    { id: 'orders', label: t.orders, icon: Clock },
    { id: 'marg', label: 'Marg CSV', icon: FileSpreadsheet },
    { id: 'settings', label: t.settings, icon: Settings }
  ];

  const deliveryTabs: TabItem[] = [
    { id: 'active_deliveries', label: 'Assigned', icon: Truck },
    { id: 'completed_deliveries', label: 'Delivered', icon: CheckCircle2 },
    { id: 'profile', label: t.profile, icon: User }
  ];

  const tabs =
    currentRole === 'admin'
      ? adminTabs
      : currentRole === 'delivery'
      ? deliveryTabs
      : customerTabs;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe select-none shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              aria-selected={isActive}
              aria-label={tab.label}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[50px] min-w-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[64px] leading-tight text-center">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
