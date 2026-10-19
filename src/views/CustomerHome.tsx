import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Pill,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  MessageCircle,
  X,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Store,
  Navigation,
  FileText,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Package,
  Tag,
  RotateCcw,
  User as UserIcon,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  Key
} from 'lucide-react';
import { MedicineItem, Order, OrderItem, User } from '../types';
import { storage } from '../services/storage';
import { Language, translations } from '../i18n';
import { CustomSelect, SelectOption } from '../components/CustomSelect';
import { PullToRefresh } from '../components/PullToRefresh';

interface CustomerHomeProps {
  lang: Language;
  currentUser: User | null;
  onOpenAuth: () => void;
  onUserChange?: (user: User | null) => void;
  cart: { item: MedicineItem; quantity: number }[];
  onAddToCart: (item: MedicineItem, qty?: number) => void;
  onUpdateCartQty: (medicineId: string, quantity: number) => void;
  onClearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeCustomerTab: 'home' | 'medicines' | 'orders' | 'cart' | 'profile';
  setActiveCustomerTab: (tab: 'home' | 'medicines' | 'orders' | 'cart' | 'profile') => void;
  refreshTrigger: number;
}

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'stock_desc' | 'name_asc' | 'discount_desc';

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  lang,
  currentUser,
  onOpenAuth,
  onUserChange,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onClearCart,
  isCartOpen,
  setIsCartOpen,
  activeCustomerTab,
  setActiveCustomerTab,
  refreshTrigger
}) => {
  const t = translations[lang];
  const shopSettings = storage.getShopSettings();

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedComposition, setSelectedComposition] = useState('ALL');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Checkout state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'home_delivery' | 'store_pickup'>('home_delivery');
  const [custName, setCustName] = useState(currentUser?.name || '');
  const [custPhone, setCustPhone] = useState(currentUser?.phone || '');
  const [fullAddress, setFullAddress] = useState(
    currentUser?.addresses?.[0]?.fullAddress || 'Ward No. 04, Near Shiv Mandir'
  );
  const [locality, setLocality] = useState(
    currentUser?.addresses?.[0]?.locality || 'Chanman, Baheri'
  );
  const [pinCode, setPinCode] = useState(
    currentUser?.addresses?.[0]?.pinCode || '847101'
  );
  const [landmark, setLandmark] = useState(
    currentUser?.addresses?.[0]?.landmark || ''
  );
  const [instructions, setInstructions] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(
    currentUser?.addresses?.[0]?.lat && currentUser?.addresses?.[0]?.lng
      ? { lat: currentUser.addresses[0].lat, lng: currentUser.addresses[0].lng }
      : null
  );
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Home Screen Direct Login & Gmail State
  const [homeAuthTab, setHomeAuthTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [homeEmailOrPhone, setHomeEmailOrPhone] = useState('');
  const [homePassword, setHomePassword] = useState('');
  const [homeConfirmPassword, setHomeConfirmPassword] = useState('');
  const [homeFullName, setHomeFullName] = useState('');
  const [homeMobileNumber, setHomeMobileNumber] = useState('');
  const [showHomePassword, setShowHomePassword] = useState(false);
  const [homeAuthLoading, setHomeAuthLoading] = useState(false);
  const [homeAuthError, setHomeAuthError] = useState('');
  const [homeAuthSuccess, setHomeAuthSuccess] = useState('');
  const [homeResetToken, setHomeResetToken] = useState('');
  const [guestBypassed, setGuestBypassed] = useState(false);

  // Home screen login submit
  const handleHomeLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHomeAuthError('');
    setHomeAuthLoading(true);

    setTimeout(() => {
      const users = storage.getUsers();
      const input = homeEmailOrPhone.trim().toLowerCase();
      const matched = users.find(
        u => u.email.toLowerCase() === input || u.phone === input
      );

      if (matched) {
        storage.setCurrentUser(matched);
        onUserChange?.(matched);
        setHomeAuthSuccess(
          lang === 'hi'
            ? `स्वागत है, ${matched.name}! लॉगिन सफल रहा।`
            : `Welcome back, ${matched.name}! Successfully logged in.`
        );
        setTimeout(() => setHomeAuthSuccess(''), 2500);
      } else {
        setHomeAuthError(
          lang === 'hi'
            ? 'अमान्य क्रेडेंशियल्स। कृपया पंजीकृत ईमेल या मोबाइल दर्ज करें (परीक्षण: customer@gmail.com या 9122260360)'
            : 'Invalid credentials. Please enter registered Gmail or mobile. (Demo: customer@gmail.com)'
        );
      }
      setHomeAuthLoading(false);
    }, 400);
  };

  // Google / Gmail 1-Click Login
  const handleHomeGmailLogin = (presetEmail?: string) => {
    setHomeAuthError('');
    setHomeAuthLoading(true);
    const target = presetEmail || (homeEmailOrPhone.includes('@gmail.com') ? homeEmailOrPhone.trim().toLowerCase() : 'customer@gmail.com');

    setTimeout(() => {
      const users = storage.getUsers();
      let matched = users.find(u => u.email.toLowerCase() === target.toLowerCase());

      if (!matched) {
        matched = {
          id: `user_gmail_${Date.now()}`,
          name: target === 'madhavmedicalhall2016@gmail.com' ? 'Madhav Medical Owner' : 'Gmail Customer',
          email: target,
          phone: '9122260360',
          role: target === 'madhavmedicalhall2016@gmail.com' ? 'admin' : 'customer',
          isApproved: true,
          addresses: [
            {
              id: 'addr_1',
              label: 'Home',
              fullAddress: 'Ward No. 04, Near Shiv Mandir, Main Road',
              locality: 'Chanman, Baheri',
              pinCode: '847101',
              landmark: 'Near Shiv Mandir',
              isDefault: true
            }
          ],
          createdAt: new Date().toISOString()
        };
        const updated = [...users, matched];
        localStorage.setItem('mmh_users_v2', JSON.stringify(updated));
        storage.addAuditLog(target, 'GMAIL_LOGIN', 'User authenticated via Google / Gmail on home screen');
      }

      storage.setCurrentUser(matched);
      onUserChange?.(matched);
      setHomeAuthSuccess(
        lang === 'hi'
          ? `Google / Gmail से लॉगिन सफल: ${matched.email}`
          : `Signed in with Google / Gmail: ${matched.email}`
      );
      setTimeout(() => setHomeAuthSuccess(''), 2500);
      setHomeAuthLoading(false);
    }, 400);
  };

  // Direct 1-tap quick demo login
  const handleQuickDemoLogin = (role: 'customer' | 'delivery' | 'admin') => {
    const users = storage.getUsers();
    const matched = users.find(u => u.role === role);
    if (matched) {
      storage.setCurrentUser(matched);
      onUserChange?.(matched);
      setHomeAuthSuccess(
        lang === 'hi'
          ? `खाता बदला गया: ${matched.name} (${role})`
          : `Switched account: ${matched.name} (${role})`
      );
      setTimeout(() => setHomeAuthSuccess(''), 2000);
    }
  };

  // Home screen sign-up submit
  const handleHomeSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHomeAuthError('');

    if (homePassword !== homeConfirmPassword) {
      setHomeAuthError(lang === 'hi' ? 'दोनों पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }
    if (homePassword.length < 6) {
      setHomeAuthError(lang === 'hi' ? 'पासवर्ड में कम से कम 6 अक्षर होने चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setHomeAuthLoading(true);
    setTimeout(() => {
      const users = storage.getUsers();
      const cleanEmail = homeEmailOrPhone.trim().toLowerCase();
      const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        setHomeAuthError(
          lang === 'hi'
            ? 'इस ईमेल पते का खाता पहले से मौजूद है। कृपया लॉगिन करें।'
            : 'An account with this email already exists. Please login.'
        );
        setHomeAuthLoading(false);
        return;
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        name: homeFullName.trim() || 'Valued Customer',
        email: cleanEmail,
        phone: homeMobileNumber.trim() || '9122260360',
        role: 'customer',
        isApproved: true,
        addresses: [],
        createdAt: new Date().toISOString()
      };

      const updatedList = [...users, newUser];
      storage.setCurrentUser(newUser);
      localStorage.setItem('mmh_users_v2', JSON.stringify(updatedList));
      storage.addAuditLog(newUser.email, 'USER_REGISTERED', 'Customer account created on home screen.');

      onUserChange?.(newUser);
      setHomeAuthSuccess(lang === 'hi' ? 'खाता सफलतापूर्वक बनाया गया!' : 'Account registered successfully!');
      setTimeout(() => setHomeAuthSuccess(''), 2500);
      setHomeAuthLoading(false);
    }, 450);
  };

  // Home screen forgot password
  const handleHomeForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setHomeAuthError('');
    setHomeAuthLoading(true);

    setTimeout(() => {
      const res = storage.createPasswordResetToken(homeEmailOrPhone);
      setHomeAuthSuccess(res.message);
      if (res.token) {
        setHomeResetToken(res.token);
      }
      setHomeAuthLoading(false);
    }, 400);
  };

  // Home screen logout
  const handleHomeLogout = () => {
    storage.setCurrentUser(null);
    onUserChange?.(null);
    setGuestBypassed(false);
  };

  // Load all medicines from database
  const medicines = useMemo(() => {
    return storage.getMedicines();
  }, [refreshTrigger]);

  // Dynamic Category definitions with live product counts
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = { ALL: medicines.length };
    medicines.forEach(m => {
      if (m.category) {
        map[m.category] = (map[m.category] || 0) + 1;
      }
    });
    return map;
  }, [medicines]);

  const categories = [
    { id: 'ALL', label: t.allCategories, count: categoryCountMap['ALL'] || 0 },
    { id: 'Fever & Pain Relief', label: lang === 'hi' ? 'दर्द एवं बुखार निवारक' : 'Pain Relief & Fever', count: categoryCountMap['Fever & Pain Relief'] || 0 },
    { id: 'Antibiotics & Anti-infectives', label: lang === 'hi' ? 'एंटीबायोटिक (Antibiotics)' : 'Antibiotics & Anti-infectives', count: categoryCountMap['Antibiotics & Anti-infectives'] || 0 },
    { id: 'Cough, Cold & Respiratory', label: t.categoryCough, count: categoryCountMap['Cough, Cold & Respiratory'] || 0 },
    { id: 'Digestive & Gastro Care', label: t.categoryDigestive, count: categoryCountMap['Digestive & Gastro Care'] || 0 },
    { id: 'Syrups & Tonics', label: t.categorySyrups, count: categoryCountMap['Syrups & Tonics'] || 0 },
    { id: 'Ointments, Creams & Skin', label: t.categoryOintments, count: categoryCountMap['Ointments, Creams & Skin'] || 0 },
    { id: 'Vitamins & Supplements', label: t.categoryVitamins, count: categoryCountMap['Vitamins & Supplements'] || 0 },
    { id: 'Medical & Surgical Supplies', label: t.categorySurgical, count: categoryCountMap['Medical & Surgical Supplies'] || 0 },
    { id: 'Veterinary Medicines', label: t.categoryVeterinary, count: categoryCountMap['Veterinary Medicines'] || 0 }
  ];

  // Extract unique brands/companies with product counts for CustomSelect
  const brandOptions: SelectOption[] = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    medicines.forEach(m => {
      const b = (m.company || '').trim();
      if (b) {
        brandCounts[b] = (brandCounts[b] || 0) + 1;
      }
    });
    const sorted = Object.keys(brandCounts).sort();
    return [
      { value: 'ALL', label: t.allBrands },
      ...sorted.map(b => ({
        value: b,
        label: `${b} (${brandCounts[b]})`
      }))
    ];
  }, [medicines, t.allBrands]);

  // Extract unique generic compositions with counts for CustomSelect
  const compositionOptions: SelectOption[] = useMemo(() => {
    const compCounts: Record<string, number> = {};
    medicines.forEach(m => {
      const c = (m.genericComposition || '').trim();
      if (c) {
        compCounts[c] = (compCounts[c] || 0) + 1;
      }
    });
    const sorted = Object.keys(compCounts).sort();
    return [
      { value: 'ALL', label: t.allCompositions },
      ...sorted.map(c => ({
        value: c,
        label: `${c} (${compCounts[c]})`
      }))
    ];
  }, [medicines, t.allCompositions]);

  // Sorting options for selection
  const sortOptions: SelectOption[] = [
    { value: 'default', label: lang === 'hi' ? 'प्राथमिकता (Recommended)' : 'Relevance / Featured' },
    { value: 'price_asc', label: lang === 'hi' ? 'मूल्य: कम से ज्यादा (₹ Low to High)' : 'Price: Low to High' },
    { value: 'price_desc', label: lang === 'hi' ? 'मूल्य: ज्यादा से कम (₹ High to Low)' : 'Price: High to Low' },
    { value: 'discount_desc', label: lang === 'hi' ? 'सर्वाधिक छूट (Best Savings)' : 'Highest Discount (% OFF)' },
    { value: 'stock_desc', label: lang === 'hi' ? 'उपलब्धता (Highest Stock)' : 'Stock Availability' },
    { value: 'name_asc', label: lang === 'hi' ? 'नाम: A से Z' : 'Name: A to Z' }
  ];

  // Popular search suggestions for fast customer discovery
  const popularSearches = [
    { label: 'Paracetamol', query: 'Paracetamol' },
    { label: 'Dolo 650', query: 'Dolo' },
    { label: 'Azithromycin (Azithral)', query: 'Azithral' },
    { label: 'Aciloc 150', query: 'Aciloc' },
    { label: 'Pan 40 (Acidity)', query: 'Pan' },
    { label: 'Cough Syrup (Ambrodil)', query: 'Ambrodil' },
    { label: 'Syringes & Needles', query: 'Syringe' },
    { label: 'Becosules (Vitamins)', query: 'Becosules' },
    { label: 'Betadine Ointment', query: 'Betadine' }
  ];

  // Perform search & multi-attribute filtering against database
  const filteredMedicines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let list = medicines.filter(med => {
      // 1. Text search across name, code, company, genericComposition, rackno
      if (query) {
        const matchesName = med.name.toLowerCase().includes(query);
        const matchesCode = med.code.toLowerCase().includes(query);
        const matchesCompany = (med.company || '').toLowerCase().includes(query);
        const matchesComp = (med.genericComposition || '').toLowerCase().includes(query);
        const matchesCat = (med.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesCompany && !matchesComp && !matchesCat) {
          return false;
        }
      }

      // 2. Category Filter (e.g., Pain Relief, Antibiotics)
      if (selectedCategory !== 'ALL' && med.category !== selectedCategory) {
        return false;
      }

      // 3. Brand Filter
      if (selectedBrand !== 'ALL' && med.company !== selectedBrand) {
        return false;
      }

      // 4. Composition Filter
      if (selectedComposition !== 'ALL' && med.genericComposition !== selectedComposition) {
        return false;
      }

      // 5. In-Stock Filter
      if (onlyInStock && med.stock <= 0) {
        return false;
      }

      return true;
    });

    // Apply Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'price_asc') {
        return a.rate - b.rate;
      }
      if (sortBy === 'price_desc') {
        return b.rate - a.rate;
      }
      if (sortBy === 'discount_desc') {
        const discA = a.mrp > a.rate ? (a.mrp - a.rate) / a.mrp : 0;
        const discB = b.mrp > b.rate ? (b.mrp - b.rate) / b.mrp : 0;
        return discB - discA;
      }
      if (sortBy === 'stock_desc') {
        return b.stock - a.stock;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      // default: in-stock items first, then alphabetic
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (a.stock <= 0 && b.stock > 0) return 1;
      return 0;
    });

    return list;
  }, [
    medicines,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedComposition,
    onlyInStock,
    sortBy
  ]);

  // Active filters count
  const activeFiltersCount = (searchQuery ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedBrand !== 'ALL' ? 1 : 0) +
    (selectedComposition !== 'ALL' ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setSelectedComposition('ALL');
    setOnlyInStock(false);
    setSortBy('default');
  };

  // Cart financial calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.item.rate * item.quantity, 0);
  }, [cart]);

  const deliveryFee =
    deliveryMode === 'store_pickup' || cartSubtotal >= shopSettings.freeDeliveryThreshold || cartSubtotal === 0
      ? 0
      : shopSettings.standardDeliveryFee;

  const totalPayable = cartSubtotal + deliveryFee;

  // Handle GPS location capture
  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          alert('Could not access GPS location. You can still enter your address manually.');
        }
      );
    }
  };

  // Place Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!custName.trim() || !custPhone.trim()) {
      alert('Please provide your name and contact phone number.');
      return;
    }

    if (deliveryMode === 'home_delivery' && !fullAddress.trim()) {
      alert('Please provide complete delivery address.');
      return;
    }

    setIsSubmittingOrder(true);

    const orderItems: OrderItem[] = cart.map(c => ({
      medicineId: c.item.id,
      medicineCode: c.item.code,
      name: c.item.name,
      unit: c.item.unit,
      batchNo: c.item.batchNo,
      quantity: c.quantity,
      rate: c.item.rate,
      mrp: c.item.mrp,
      total: Math.round(c.item.rate * c.quantity * 100) / 100
    }));

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: `MMH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: currentUser?.id || `guest_${Date.now()}`,
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      deliveryMode,
      deliveryAddress: {
        fullAddress: fullAddress.trim(),
        locality: locality.trim(),
        pinCode: pinCode.trim(),
        landmark: landmark.trim(),
        lat: gpsLocation?.lat,
        lng: gpsLocation?.lng
      },
      deliveryInstructions: instructions.trim(),
      items: orderItems,
      subtotal: Math.round(cartSubtotal * 100) / 100,
      deliveryFee,
      discount: 0,
      totalAmount: Math.round(totalPayable * 100) / 100,
      paymentMethod: deliveryMode === 'store_pickup' ? 'pay_at_store' : 'cod',
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = storage.placeOrder(newOrder);
    setIsSubmittingOrder(false);

    if (res.success && res.order) {
      setPlacedOrder(res.order);
      onClearCart();
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    } else {
      alert(res.message);
    }
  };

  // Customer's order list
  const customerOrders = useMemo(() => {
    const all = storage.getOrders();
    if (!currentUser) return all.slice(0, 5);
    return all.filter(
      o => o.customerId === currentUser.id || o.customerPhone === currentUser.phone
    );
  }, [currentUser, refreshTrigger]);

  const handleRefresh = async () => {
    await new Promise(res => setTimeout(res, 300));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="flex-1 pb-28 md:pb-16 text-slate-900 dark:text-slate-100">
      {/* Hero Header & Search Section */}
      <section className="bg-gradient-to-b from-blue-50/80 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 pt-6 pb-5">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Shop Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-400">
                  {t.shopName}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Verified Pharmacy
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                {t.tagline} • चनमन, बहेड़ी (दरभंगा) PIN: 847101
              </p>
            </div>

            {/* Quick Contact Badges */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${shopSettings.phone}`}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Phone size={15} />
                <span>{t.callNow} (9122260360)</span>
              </a>
              <a
                href={`https://wa.me/91${shopSettings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* HOME SCREEN LOGIN GATEWAY & ACCOUNT STATUS */}
          {!currentUser ? (
            !guestBypassed ? (
              <div className="rounded-3xl border-2 border-blue-600/30 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-5 sm:p-7 shadow-xl space-y-4 animate-fade-in text-slate-900 dark:text-white">
                {/* Gateway Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Lock size={16} />
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-blue-900 dark:text-blue-400">
                        {lang === 'hi' ? 'आगे बढ़ने के लिए लॉगिन करें' : 'Login to Proceed'}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {lang === 'hi'
                        ? 'दवाइयाँ खोजने, ऑर्डर करने एवं डिलीवरी ट्रैक करने के लिए कृपया अपने Gmail या मोबाइल नंबर से लॉगिन करें।'
                        : 'Please login with your Gmail or mobile number to order medicines and track home delivery.'}
                    </p>
                  </div>

                  {/* Bypass / Guest button */}
                  <button
                    type="button"
                    onClick={() => setGuestBypassed(true)}
                    className="self-start sm:self-auto min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                  >
                    <span>{lang === 'hi' ? 'बिना लॉगिन के दवाइयाँ देखें ↓' : 'Browse as Guest ↓'}</span>
                  </button>
                </div>

                {/* Notifications */}
                {homeAuthError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{homeAuthError}</span>
                  </div>
                )}
                {homeAuthSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Check size={16} className="flex-shrink-0 stroke-[3]" />
                    <span>{homeAuthSuccess}</span>
                  </div>
                )}

                {/* 1-Click Google / Gmail Button */}
                <button
                  type="button"
                  onClick={() => handleHomeGmailLogin()}
                  disabled={homeAuthLoading}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{lang === 'hi' ? 'Gmail / Google से 1-क्लिक लॉगिन' : 'Continue with Google / Gmail'}</span>
                </button>

                {/* Gateway Mode Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setHomeAuthError('');
                      setHomeAuthTab('login');
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                      homeAuthTab === 'login'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {t.login}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHomeAuthError('');
                      setHomeAuthTab('signup');
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                      homeAuthTab === 'signup'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {t.signup}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHomeAuthError('');
                      setHomeAuthTab('forgot');
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                      homeAuthTab === 'forgot'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {t.forgotPassword}
                  </button>
                </div>

                {/* FORM TAB 1: LOGIN */}
                {homeAuthTab === 'login' && (
                  <form onSubmit={handleHomeLoginSubmit} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'hi' ? 'ईमेल (Gmail) या 10-अंकीय मोबाइल' : 'Email (Gmail) or Mobile'} *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                          <input
                            type="text"
                            required
                            value={homeEmailOrPhone}
                            onChange={e => setHomeEmailOrPhone(e.target.value)}
                            placeholder="customer@gmail.com or 9122260360"
                            className="w-full min-h-[46px] pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t.password} *
                          </label>
                          <button
                            type="button"
                            onClick={() => setHomeAuthTab('forgot')}
                            className="text-[11px] text-blue-600 hover:underline font-semibold"
                          >
                            {t.forgotPassword}
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                          <input
                            type={showHomePassword ? 'text' : 'password'}
                            required
                            value={homePassword}
                            onChange={e => setHomePassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full min-h-[46px] pl-10 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                          />
                          <button
                            type="button"
                            onClick={() => setShowHomePassword(!showHomePassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showHomePassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={homeAuthLoading}
                      className="w-full min-h-[48px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {homeAuthLoading
                        ? (lang === 'hi' ? 'लॉगिन हो रहा है...' : 'Logging in...')
                        : (lang === 'hi' ? 'लॉगिन करें और आगे बढ़ें →' : 'Login and Proceed →')}
                    </button>
                  </form>
                )}

                {/* FORM TAB 2: SIGN UP */}
                {homeAuthTab === 'signup' && (
                  <form onSubmit={handleHomeSignUpSubmit} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.fullName} *
                        </label>
                        <input
                          type="text"
                          required
                          value={homeFullName}
                          onChange={e => setHomeFullName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'hi' ? 'ईमेल (Gmail Address)' : 'Email (Gmail Address)'} *
                        </label>
                        <input
                          type="email"
                          required
                          value={homeEmailOrPhone}
                          onChange={e => setHomeEmailOrPhone(e.target.value)}
                          placeholder="name@gmail.com"
                          className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.phoneNumber} *
                        </label>
                        <input
                          type="tel"
                          required
                          value={homeMobileNumber}
                          onChange={e => setHomeMobileNumber(e.target.value)}
                          placeholder="10-digit mobile"
                          className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.password} * (min 6)
                        </label>
                        <input
                          type={showHomePassword ? 'text' : 'password'}
                          required
                          value={homePassword}
                          onChange={e => setHomePassword(e.target.value)}
                          placeholder="Password"
                          className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.confirmPassword} *
                        </label>
                        <input
                          type={showHomePassword ? 'text' : 'password'}
                          required
                          value={homeConfirmPassword}
                          onChange={e => setHomeConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={homeAuthLoading}
                      className="w-full min-h-[48px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {homeAuthLoading
                        ? (lang === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating...')
                        : (lang === 'hi' ? 'खाता बनाएं एवं आगे बढ़ें →' : 'Register and Proceed →')}
                    </button>
                  </form>
                )}

                {/* FORM TAB 3: FORGOT PASSWORD */}
                {homeAuthTab === 'forgot' && (
                  <form onSubmit={handleHomeForgotPassword} className="space-y-3 pt-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === 'hi'
                        ? 'अपना पंजीकृत जीमेल या मोबाइल दर्ज करें। सुरक्षा रीसेट टोकन तुरंत स्क्रीन पर दिखाई देगा।'
                        : 'Enter your registered Gmail or phone number. A single-use verification token will be prepared.'}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={homeEmailOrPhone}
                        onChange={e => setHomeEmailOrPhone(e.target.value)}
                        placeholder="e.g. customer@gmail.com"
                        className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                      />
                      <button
                        type="submit"
                        disabled={homeAuthLoading}
                        className="min-h-[46px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                      >
                        {lang === 'hi' ? 'टोकन प्राप्त करें' : 'Get Token'}
                      </button>
                    </div>

                    {homeResetToken && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs space-y-2">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">
                          {lang === 'hi' ? 'रीसेट कोड (15 मिनट मान्य):' : 'Reset Token Generated (Valid 15m):'}
                        </p>
                        <div className="font-mono font-bold bg-white dark:bg-slate-900 p-2 text-center rounded border border-emerald-200">
                          {homeResetToken}
                        </div>
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                        >
                          {lang === 'hi' ? 'नया पासवर्ड सेट करें →' : 'Proceed to Set New Password →'}
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* Strict Role Governance & Quick Testing notice */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>{lang === 'hi' ? 'भूमिका एवं सुरक्षा नियम (Role Policy):' : 'Role & Security Governance:'}</span>
                    </span>
                    <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 list-disc list-inside">
                      <li>
                        <strong>{lang === 'hi' ? 'व्यवस्थापक (Admin):' : 'Admin:'}</strong>{' '}
                        {lang === 'hi'
                          ? 'केवल दुकान मालिक (madhavmedicalhall2016@gmail.com) हेतु सुरक्षित।'
                          : 'Strictly restricted to single shop owner (madhavmedicalhall2016@gmail.com).'}
                      </li>
                      <li>
                        <strong>{lang === 'hi' ? 'डिलीवरी स्टाफ (Delivery):' : 'Delivery Staff:'}</strong>{' '}
                        {lang === 'hi'
                          ? 'केवल वही कर्मी जिन्हें व्यवस्थापक (Admin) द्वारा जोड़ा गया हो।'
                          : 'Strictly authorized personnel explicitly added by Admin.'}
                      </li>
                      <li>
                        <strong>{lang === 'hi' ? 'ग्राहक (Customer):' : 'Customer:'}</strong>{' '}
                        {lang === 'hi'
                          ? 'कोई भी नागरिक मोबाइल या जीमेल से खाता बनाकर ऑर्डर कर सकता है।'
                          : 'Public accounts for ordering medicines & tracking deliveries.'}
                      </li>
                    </ul>
                  </div>

                  {/* Pre-fill Quick Test Credentials */}
                  <div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1.5 text-[11px]">
                      {lang === 'hi' ? 'परीक्षण हेतु क्रेडेंशियल्स भरें (Test Accounts):' : 'Fill Test Credentials:'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHomeEmailOrPhone('customer@gmail.com');
                          setHomePassword('customer123');
                          setHomeAuthTab('login');
                        }}
                        className="min-h-[38px] p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] text-center hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHomeEmailOrPhone('9876543210');
                          setHomePassword('staff123');
                          setHomeAuthTab('login');
                        }}
                        className="min-h-[38px] p-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-[11px] text-center hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        Delivery Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHomeEmailOrPhone('madhavmedicalhall2016@gmail.com');
                          setHomePassword('admin123');
                          setHomeAuthTab('login');
                        }}
                        className="min-h-[38px] p-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold text-[11px] text-center hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        Shop Owner
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* When Guest is browsing, show Guest Notification Banner */
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-amber-600" />
                  <span className="text-amber-900 dark:text-amber-200 font-medium">
                    {lang === 'hi'
                      ? 'आप अतिथि (Guest) के रूप में दवाइयाँ देख रहे हैं।'
                      : 'Browsing medicines as Guest. Login to place orders.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGuestBypassed(false)}
                  className="min-h-[36px] px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {lang === 'hi' ? 'लॉगिन करें' : 'Login Now'}
                </button>
              </div>
            )
          ) : (
            /* Logged-In Account Banner */
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800/60 border border-blue-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm text-white ${
                  currentUser.role === 'admin'
                    ? 'bg-blue-600'
                    : currentUser.role === 'delivery'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {lang === 'hi' ? 'नमस्ते,' : 'Welcome,'} {currentUser.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentUser.role === 'admin'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : currentUser.role === 'delivery'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {currentUser.role === 'admin'
                        ? (lang === 'hi' ? '🛡️ दुकान मालिक (Single Owner)' : '🛡️ Single Owner Admin')
                        : currentUser.role === 'delivery'
                        ? (lang === 'hi' ? '🚚 अधिकृत डिलीवरी कर्मी' : '🚚 Authorized Delivery Staff')
                        : (lang === 'hi' ? '✓ सत्यापित ग्राहक' : '✓ Verified Customer')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email} • {currentUser.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                {/* Shortcut to Admin or Delivery workspace if authorized */}
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => onUserChange?.({ ...currentUser, role: 'admin' })}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <ShieldCheck size={14} />
                    <span>{lang === 'hi' ? 'व्यवस्थापक डैशबोर्ड' : 'Admin Dashboard'}</span>
                  </button>
                )}

                {currentUser.role === 'delivery' && (
                  <button
                    type="button"
                    onClick={() => onUserChange?.({ ...currentUser, role: 'delivery' })}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Truck size={14} />
                    <span>{lang === 'hi' ? 'डिलीवरी कार्य देखें' : 'Delivery Tasks'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Key size={13} />
                  <span>{lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleHomeLogout}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>{lang === 'hi' ? 'लॉगआउट' : 'Log Out'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Search Bar Input */}
          <div className="relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full min-h-[54px] pl-12 pr-12 py-3 rounded-2xl border-2 border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm sm:text-base font-medium shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950/50 outline-none transition-all select-text placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none text-xs">
            <span className="text-slate-400 font-semibold text-[11px] whitespace-nowrap flex items-center gap-1 mr-1">
              <Sparkles size={12} className="text-amber-500" />
              {lang === 'hi' ? 'लोकप्रिय खोज:' : 'Popular:'}
            </span>
            {popularSearches.map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSearchQuery(item.query)}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  searchQuery.toLowerCase() === item.query.toLowerCase()
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Category Filter Chips with Live Product Counts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Tag size={14} className="text-blue-600" />
                {lang === 'hi' ? 'श्रेणी अनुसार चुनें (Categories):' : 'Filter by Category:'}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {categories.length - 1} {lang === 'hi' ? 'श्रेणियां उपलब्ध' : 'categories'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none select-none">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Multi-Attribute Filters (Brand, Generic Composition, Stock, Sort) */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-blue-600" />
                <span>{lang === 'hi' ? 'उन्नत फ़िल्टर एवं छँटाई' : 'Brand, Composition & Inventory Filters'}</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{t.resetFilters}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Brand Filter Dropdown */}
              <CustomSelect
                label={lang === 'hi' ? 'ब्रांड / कंपनी फ़िल्टर' : 'Filter by Brand'}
                value={selectedBrand}
                onChange={setSelectedBrand}
                options={brandOptions}
                placeholder={t.allBrands}
              />

              {/* Generic Composition Filter Dropdown */}
              <CustomSelect
                label={lang === 'hi' ? 'साल्ट / कम्पोज़ीशन फ़िल्टर' : 'Filter by Composition'}
                value={selectedComposition}
                onChange={setSelectedComposition}
                options={compositionOptions}
                placeholder={t.allCompositions}
              />

              {/* Sort Order Selector */}
              <CustomSelect
                label={lang === 'hi' ? 'क्रमबद्ध करें (Sort By)' : 'Sort By'}
                value={sortBy}
                onChange={v => setSortBy(v as SortOption)}
                options={sortOptions}
                placeholder="Sort By"
              />

              {/* In-Stock Only Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'स्टॉक उपलब्धता' : 'Availability'}
                </label>
                <button
                  type="button"
                  onClick={() => setOnlyInStock(!onlyInStock)}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
                    onlyInStock
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      onlyInStock ? 'bg-emerald-500 text-white' : 'border border-slate-400'
                    }`}
                  >
                    {onlyInStock && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span>{t.inStockOnly}</span>
                </button>
              </div>
            </div>

            {/* Active Filter Badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Active:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-xs font-bold">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-rose-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedCategory !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-xs font-bold">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory('ALL')} className="hover:text-rose-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedBrand !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-xs font-bold">
                    Brand: {selectedBrand}
                    <button onClick={() => setSelectedBrand('ALL')} className="hover:text-rose-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedComposition !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-xs font-bold">
                    Salt: {selectedComposition}
                    <button onClick={() => setSelectedComposition('ALL')} className="hover:text-rose-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {onlyInStock && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                    {t.inStockOnly}
                    <button onClick={() => setOnlyInStock(false)} className="hover:text-rose-500 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* If Active Tab is 'orders', show full Orders view */}
        {activeCustomerTab === 'orders' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={22} className="text-blue-600" />
                  <span>{t.orders}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Track delivery progress, driver updates, and receipts for Madhav Medical Hall orders.
                </p>
              </div>
              <button
                onClick={() => setActiveCustomerTab('medicines')}
                className="min-h-[40px] px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Order More Medicines</span>
              </button>
            </div>

            {customerOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-blue-900 dark:text-blue-400">
                          {order.orderNumber}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()} at{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : order.status === 'out_for_delivery'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : order.status === 'cancelled' || order.status === 'failed'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {t[`status_${order.status}` as keyof typeof t] || order.status}
                      </span>
                    </div>

                    {/* Delivery Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Ordered</span>
                        <span>Packed</span>
                        <span>Out for Delivery</span>
                        <span>Delivered</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            order.status === 'delivered'
                              ? 'w-full bg-emerald-500'
                              : order.status === 'out_for_delivery'
                              ? 'w-3/4 bg-blue-500'
                              : order.status === 'preparing' || order.status === 'confirmed'
                              ? 'w-1/2 bg-amber-500'
                              : 'w-1/4 bg-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="text-xs text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800/80">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="font-semibold">₹{item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Details Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-slate-500">
                          Mode: <span className="font-semibold text-slate-800 dark:text-slate-200">{order.deliveryMode === 'store_pickup' ? 'Store Pickup' : 'Home Delivery'}</span>
                        </p>
                        {order.deliveryAddress && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {order.deliveryAddress.fullAddress}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">Total Paid/COD</p>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Contact Shop for this Order */}
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={`tel:${shopSettings.phone}`}
                        className="flex-1 min-h-[38px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                      >
                        <Phone size={13} />
                        <span>Call Shop for Order</span>
                      </a>
                      <a
                        href={`https://wa.me/91${shopSettings.whatsapp}?text=${encodeURIComponent(`Hello Madhav Medical Hall, regarding my order ${order.orderNumber}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[38px] rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp Updates</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <Clock size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  No orders placed yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse our genuine medicines database and place your first order with home delivery or store pickup.
                </p>
                <button
                  onClick={() => setActiveCustomerTab('medicines')}
                  className="min-h-[44px] px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Browse Medicines Catalog
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Results Counter & Pharmacy Guarantee */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {t.showingResults.replace('{count}', filteredMedicines.length.toString())}
                {selectedCategory !== 'ALL' && ` in "${selectedCategory}"`}
                {selectedBrand !== 'ALL' && ` • Brand: ${selectedBrand}`}
                {selectedComposition !== 'ALL' && ` • Salt: ${selectedComposition}`}
              </span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <ShieldCheck size={14} />
                100% Genuine Medicines • Baheri Counter, Darbhanga
              </span>
            </div>

            {/* Medicines Catalog Grid */}
            {filteredMedicines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMedicines.map(med => {
                  const inStock = med.stock > 0;
                  const isLowStock = med.stock > 0 && med.stock < 10;
                  const cartItem = cart.find(c => c.item.id === med.id);
                  const qtyInCart = cartItem?.quantity || 0;
                  const discountAmount = med.mrp > med.rate ? med.mrp - med.rate : 0;
                  const discountPercent = med.mrp > med.rate ? Math.round((discountAmount / med.mrp) * 100) : 0;

                  return (
                    <div
                      key={med.id}
                      className="flex flex-col justify-between p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="space-y-2">
                        {/* Header tags: Category & Prescription badge */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                            {med.category}
                          </span>
                          {med.isPrescriptionRequired && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-0.5">
                              <FileText size={10} />
                              Rx Required
                            </span>
                          )}
                        </div>

                        {/* Medicine Name */}
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {med.name}
                        </h3>

                        {/* Generic Salt / Composition */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Salt / Composition: </span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{med.genericComposition}</span>
                        </p>

                        {/* Manufacturer / Company & Unit & Batch */}
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                            {med.company || 'Standard Pharma'}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {med.unit}
                          </span>
                        </div>

                        {/* Accurate Stock Status Indicator from Database */}
                        <div className="pt-1 flex items-center justify-between text-xs">
                          {med.stock > 10 && (
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Check size={14} />
                              {t.inStock} ({med.stock} {med.unit})
                            </span>
                          )}
                          {isLowStock && (
                            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {t.lowStock} (Only {med.stock} left)
                            </span>
                          )}
                          {med.stock <= 0 && (
                            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <X size={14} />
                              {t.outOfStock}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-mono">
                            Exp: {med.expiryDate}
                          </span>
                        </div>
                      </div>

                      {/* Pricing and Add to Cart Section */}
                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-blue-900 dark:text-blue-400">
                              ₹{med.rate.toFixed(2)}
                            </span>
                            {med.mrp > med.rate && (
                              <span className="text-xs text-slate-400 line-through">
                                ₹{med.mrp.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {med.mrp > med.rate && (
                            <span className="text-[10px] font-bold text-emerald-600 block">
                              Save ₹{discountAmount.toFixed(2)} ({discountPercent}% OFF)
                            </span>
                          )}
                        </div>

                        {/* Quantity controls / Add button */}
                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 p-1 rounded-xl border border-blue-200 dark:border-blue-800">
                            <button
                              type="button"
                              onClick={() => onUpdateCartQty(med.id, qtyInCart - 1)}
                              aria-label="Decrease quantity"
                              className="min-h-[36px] min-w-[36px] rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shadow-sm active:scale-95 cursor-pointer"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-xs px-2 text-blue-900 dark:text-blue-200 min-w-[20px] text-center">
                              {qtyInCart}
                            </span>
                            <button
                              type="button"
                              disabled={qtyInCart >= med.stock}
                              onClick={() => onUpdateCartQty(med.id, qtyInCart + 1)}
                              aria-label="Increase quantity"
                              className="min-h-[36px] min-w-[36px] rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm active:scale-95 disabled:opacity-40 cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!inStock}
                            onClick={() => onAddToCart(med, 1)}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Plus size={14} />
                            <span>{t.addToCart}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <Pill size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  {t.noMedicinesFound}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.tryDifferentSearch}
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-2 min-h-[44px] px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t.resetFilters}
                </button>
              </div>
            )}

            {/* Store Location & Direct Contact Card */}
            <section className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Official Pharmacy Counter
                  </span>
                  <h2 className="text-xl font-black mt-1">MADHAV MEDICAL HALL</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    Chanman, Baheri, Darbhanga, Bihar, India - 847101
                  </p>
                  <p className="text-xs text-slate-300">
                    Opening Hours: 7:00 AM - 10:00 PM (All 7 Days)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      'MADHAV MEDICAL HALL, Chanman, Baheri, Darbhanga, Bihar 847101'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Navigation size={16} />
                    <span>{t.getDirections}</span>
                  </a>
                  <a
                    href={`tel:${shopSettings.phone}`}
                    className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                  >
                    <Phone size={16} />
                    <span>Call 9122260360</span>
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Floating Bottom Cart Bar (when cart has items) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-16 md:bottom-6 left-4 right-4 z-30 max-w-lg mx-auto select-none animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>{cart.length} medicine(s) in cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">₹{cartSubtotal.toFixed(2)}</span>
              <ArrowRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Slide-in Shopping Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl text-slate-900 dark:text-white">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 select-none">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-blue-600" />
                <h2 className="font-bold text-base">{t.myCart} ({cart.length})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length > 0 ? (
                cart.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {item.genericComposition}
                        </p>
                      </div>
                      <span className="font-black text-sm text-blue-900 dark:text-blue-400">
                        ₹{(item.rate * quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400">
                        ₹{item.rate.toFixed(2)} / {item.unit}
                      </span>
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => onUpdateCartQty(item.id, quantity - 1)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-slate-700 font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-xs px-1">{quantity}</span>
                        <button
                          disabled={quantity >= item.stock}
                          onClick={() => onUpdateCartQty(item.id, quantity + 1)}
                          className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm disabled:opacity-40 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center space-y-3">
                  <ShoppingCart size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-sm">{t.emptyCart}</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {t.emptyCartDesc}
                  </p>
                </div>
              )}
            </div>

            {/* Cart Footer & Checkout trigger */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 select-none">
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>{t.subtotal}</span>
                    <span className="font-semibold">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.deliveryFee}</span>
                    <span className="font-semibold text-emerald-600">
                      {deliveryFee === 0 ? t.freeDelivery : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>{t.totalPayable}</span>
                    <span className="text-blue-900 dark:text-blue-400">
                      ₹{totalPayable.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full min-h-[50px] py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>{t.checkout}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout & Delivery Address Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 select-none">
              <h2 className="font-bold text-base sm:text-lg">{t.deliveryAddress}</h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-6 overflow-y-auto space-y-4">
              {/* Delivery Mode: Home Delivery vs Store Pickup */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t.deliveryOption}
                </label>
                <div className="grid grid-cols-2 gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('home_delivery')}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      deliveryMode === 'home_delivery'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-bold">
                      <MapPin size={14} /> {t.homeDelivery}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Baheri & local areas
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('store_pickup')}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      deliveryMode === 'store_pickup'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-bold">
                      <Store size={14} /> {t.storePickup}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Free counter collection
                    </span>
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={e => setCustName(e.target.value)}
                    placeholder="Your name"
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.phoneNumber} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={e => setCustPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                  />
                </div>
              </div>

              {/* Home Delivery Address inputs */}
              {deliveryMode === 'home_delivery' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t.fullAddressLabel} *
                      </label>
                      <button
                        type="button"
                        onClick={handleCaptureLocation}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin size={12} />
                        <span>{t.useCurrentLocation}</span>
                      </button>
                    </div>
                    <textarea
                      required
                      rows={2}
                      value={fullAddress}
                      onChange={e => setFullAddress(e.target.value)}
                      placeholder="e.g. Ward No. 04, Near Shiv Mandir, Main Road"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.localityLabel}
                      </label>
                      <input
                        type="text"
                        value={locality}
                        onChange={e => setLocality(e.target.value)}
                        placeholder="Baheri / Chanman"
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.pinCodeLabel}
                      </label>
                      <input
                        type="text"
                        value={pinCode}
                        onChange={e => setPinCode(e.target.value)}
                        placeholder="847101"
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono select-text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.deliveryInstructions}
                    </label>
                    <input
                      type="text"
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      placeholder="e.g. Call upon reaching the gate"
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                    />
                  </div>
                </div>
              )}

              {/* Payment Method Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
                  <ShieldCheck size={16} />
                  Payment Mode: {deliveryMode === 'store_pickup' ? t.payAtStore : t.cashOnDelivery}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total to pay upon delivery/pickup:{' '}
                  <span className="font-black text-slate-900 dark:text-white">
                    ₹{totalPayable.toFixed(2)}
                  </span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full min-h-[50px] py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingOrder ? 'Placing Order...' : t.confirmOrder}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Success Popup */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} className="stroke-[3]" />
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              {t.orderSuccess}
            </h3>
            <p className="text-xs text-slate-500">
              Your order <span className="font-mono font-bold text-blue-600">{placedOrder.orderNumber}</span> has been transmitted to Madhav Medical Hall dispatch.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1 text-left">
              <p><span className="font-semibold">Items:</span> {placedOrder.items.length} medicines</p>
              <p><span className="font-semibold">Amount:</span> ₹{placedOrder.totalAmount.toFixed(2)}</p>
              <p><span className="font-semibold">Mode:</span> {placedOrder.deliveryMode === 'store_pickup' ? 'Store Pickup' : 'Home Delivery'}</p>
            </div>
            <button
              onClick={() => {
                setPlacedOrder(null);
                setActiveCustomerTab('orders');
              }}
              className="w-full min-h-[48px] py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
            >
              View Order Details & Status →
            </button>
          </div>
        </div>
      )}
    </PullToRefresh>
  );
};
