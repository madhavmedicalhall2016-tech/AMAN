/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, MedicineItem } from './types';
import { storage } from './services/storage';
import { Language } from './i18n';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CustomerHome } from './views/CustomerHome';
import { AdminDashboard } from './views/AdminDashboard';
import { DeliveryDashboard } from './views/DeliveryDashboard';
import { AuthModal } from './components/AuthModal';
import { GooglePlayScanModal } from './components/GooglePlayScanModal';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mmh_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Language state (English / Hindi)
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mmh_lang');
      if (saved === 'hi' || saved === 'en') return saved;
    }
    return 'en';
  });

  // Active user and role state
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser?.role || 'customer';
  });

  // Navigation tab states with preservation
  const [activeCustomerTab, setActiveCustomerTab] = useState<'home' | 'medicines' | 'orders' | 'cart' | 'profile'>('home');
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<'active_deliveries' | 'completed_deliveries' | 'profile'>('active_deliveries');
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'inventory' | 'billing' | 'orders' | 'marg' | 'settings'>('dashboard');

  // Cart state
  const [cart, setCart] = useState<{ item: MedicineItem; quantity: number }[]>(() => {
    try {
      const raw = localStorage.getItem('mmh_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPlayScanOpen, setIsPlayScanOpen] = useState(false);

  // Refresh trigger to reload database states after updates
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const shopSettings = storage.getShopSettings();

  // Sync theme to DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mmh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mmh_theme', 'light');
    }
  }, [isDark]);

  // Sync language
  const handleLanguageToggle = () => {
    const next: Language = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('mmh_lang', next);
  };

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('mmh_cart', JSON.stringify(cart));
  }, [cart]);

  // UNIFIED NAVIGATION & BACK STACK (Android System Back & Browser Popstate handling)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If modal or cart drawer is open, close them on back press
      if (isCartOpen) {
        setIsCartOpen(false);
        return;
      }
      if (isAuthOpen) {
        setIsAuthOpen(false);
        return;
      }
      if (isPlayScanOpen) {
        setIsPlayScanOpen(false);
        return;
      }

      // If in sub-tab, return to home tab
      if (activeCustomerTab !== 'home') {
        setActiveCustomerTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCartOpen, isAuthOpen, isPlayScanOpen, activeCustomerTab]);

  // Push history entry when opening drawers or sub-tabs to ensure proper back-stack popping
  const openCartWithHistory = () => {
    window.history.pushState({ modal: 'cart' }, '');
    setIsCartOpen(true);
  };

  const openAuthWithHistory = () => {
    window.history.pushState({ modal: 'auth' }, '');
    setIsAuthOpen(true);
  };

  const openPlayScanWithHistory = () => {
    window.history.pushState({ modal: 'playscan' }, '');
    setIsPlayScanOpen(true);
  };

  // Cart operations
  const handleAddToCart = (item: MedicineItem, qty: number = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity = Math.min(item.stock, updated[idx].quantity + qty);
        return updated;
      } else {
        return [...prev, { item, quantity: Math.min(item.stock, qty) }];
      }
    });
  };

  const handleUpdateCartQty = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(c => c.item.id !== medicineId));
    } else {
      setCart(prev =>
        prev.map(c =>
          c.item.id === medicineId ? { ...c, quantity: Math.min(c.item.stock, quantity) } : c
        )
      );
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Strict Role switching:
  // Admin is strictly for the single shop owner (madhavmedicalhall2016@gmail.com)
  // Delivery staff is strictly for authorized staff added by Admin
  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'admin') {
      if (storage.isSingleAdmin(currentUser)) {
        setCurrentRole('admin');
      } else {
        openAuthWithHistory();
      }
      return;
    }
    if (newRole === 'delivery') {
      if (storage.isAuthorizedDeliveryStaff(currentUser)) {
        setCurrentRole('delivery');
      } else {
        openAuthWithHistory();
      }
      return;
    }
    setCurrentRole('customer');
  };

  // Bottom tab routing helper
  const handleBottomTabSelect = (tabId: string) => {
    if (currentRole === 'customer') {
      if (tabId === 'cart') {
        openCartWithHistory();
      } else if (tabId === 'profile') {
        openAuthWithHistory();
      } else {
        window.history.pushState({ tab: tabId }, '');
        setActiveCustomerTab(tabId as any);
      }
    } else if (currentRole === 'delivery') {
      if (tabId === 'profile') {
        openAuthWithHistory();
      } else {
        window.history.pushState({ tab: tabId }, '');
        setActiveDeliveryTab(tabId as any);
      }
    } else if (currentRole === 'admin') {
      window.history.pushState({ tab: tabId }, '');
      setActiveAdminTab(tabId as any);
    }
  };

  const totalCartCount = cart.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        lang={lang}
        onLanguageToggle={handleLanguageToggle}
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
        cartCount={totalCartCount}
        onOpenCart={openCartWithHistory}
        onOpenAuth={openAuthWithHistory}
        onOpenAuditReport={openPlayScanWithHistory}
        shopPhone={shopSettings.phone}
        shopWhatsApp={shopSettings.whatsapp}
      />

      {/* THREE SEPARATE HOME SCREENS (Role-Based Display) */}
      <div className="flex-1 flex flex-col animate-fade-in">
        {currentRole === 'customer' && (
          <CustomerHome
            lang={lang}
            currentUser={currentUser}
            onOpenAuth={openAuthWithHistory}
            onUserChange={u => {
              setCurrentUser(u);
              if (u) {
                if (storage.isSingleAdmin(u)) {
                  setCurrentRole('admin');
                } else if (storage.isAuthorizedDeliveryStaff(u)) {
                  setCurrentRole('delivery');
                } else {
                  setCurrentRole('customer');
                }
              } else {
                setCurrentRole('customer');
              }
              triggerRefresh();
            }}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onClearCart={handleClearCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            activeCustomerTab={activeCustomerTab}
            setActiveCustomerTab={setActiveCustomerTab}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboard
            lang={lang}
            refreshTrigger={refreshTrigger}
            onRefreshTrigger={triggerRefresh}
            onOpenAuth={openAuthWithHistory}
            onSwitchToCustomer={() => setCurrentRole('customer')}
          />
        )}

        {currentRole === 'delivery' && (
          <DeliveryDashboard
            lang={lang}
            refreshTrigger={refreshTrigger}
            onRefreshTrigger={triggerRefresh}
            onOpenAuth={openAuthWithHistory}
            onSwitchToCustomer={() => setCurrentRole('customer')}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation with Tab Stack Preservation */}
      <BottomNav
        currentRole={currentRole}
        activeTab={
          currentRole === 'customer'
            ? activeCustomerTab
            : currentRole === 'delivery'
            ? activeDeliveryTab
            : activeAdminTab
        }
        onTabSelect={handleBottomTabSelect}
        cartCount={totalCartCount}
        lang={lang}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={u => {
          setCurrentUser(u);
          if (u) setCurrentRole(u.role);
          triggerRefresh();
        }}
        lang={lang}
      />

      <GooglePlayScanModal
        isOpen={isPlayScanOpen}
        onClose={() => setIsPlayScanOpen(false)}
        lang={lang}
      />
    </div>
  );
}
