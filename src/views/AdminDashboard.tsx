import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  FileSpreadsheet,
  Receipt,
  Users,
  Settings,
  ShieldCheck,
  Check,
  X,
  Printer,
  Trash2,
  RefreshCw,
  Eye,
  Edit,
  ArrowRight,
  Database,
  Download,
  Upload,
  Calendar,
  Phone,
  Truck,
  UserCheck,
  UserX,
  ShieldAlert
} from 'lucide-react';
import {
  MedicineItem,
  Order,
  Invoice,
  InvoiceItem,
  User,
  ShopSettings,
  MargImportSummary
} from '../types';
import { storage, parseCsvRows } from '../services/storage';
import { Language, translations } from '../i18n';
import { CustomSelect } from '../components/CustomSelect';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import rawInventoryCsv from '../data/initial_inventory.csv?raw';

interface AdminDashboardProps {
  lang: Language;
  refreshTrigger: number;
  onRefreshTrigger: () => void;
  onOpenAuth?: () => void;
  onSwitchToCustomer?: () => void;
}

type AdminSection = 'overview' | 'inventory' | 'billing' | 'orders' | 'marg' | 'users' | 'settings' | 'logs';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  refreshTrigger,
  onRefreshTrigger,
  onOpenAuth,
  onSwitchToCustomer
}) => {
  const t = translations[lang];
  const currentUser = storage.getCurrentUser();
  const isOwnerAdmin = storage.isSingleAdmin(currentUser);

  if (!isOwnerAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[70vh]">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900 shadow-xl text-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 text-[11px] font-black uppercase tracking-wider">
              {lang === 'hi' ? 'केवल दुकान मालिक (Single Owner)' : 'Single Owner Admin Only'}
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {lang === 'hi' ? 'व्यवस्थापक डैशबोर्ड सुरक्षित' : 'Admin Dashboard Protected'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'यह व्यवस्थापक पोर्टल केवल माधव मेडिकल हॉल के एकमात्र स्वामी (madhavmedicalhall2016@gmail.com) के लिए आरक्षित है।'
                : 'This admin dashboard is exclusively reserved for the single verified shop owner (madhavmedicalhall2016@gmail.com).'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-left space-y-1 font-mono">
            <p className="text-slate-500 font-sans font-semibold text-[11px]">Authorized Single Admin:</p>
            <p className="font-bold text-blue-600 dark:text-blue-400">madhavmedicalhall2016@gmail.com</p>
            <p className="text-slate-400 text-[10px]">Phone: 9122260360 (Baheri, Darbhanga)</p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>{lang === 'hi' ? 'मालिक खाते से लॉगिन करें' : 'Login as Shop Owner'}</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToCustomer}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>{lang === 'hi' ? 'दुकान स्क्रीन पर लौटें' : 'Return to Customer Store'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Database records
  const medicines = storage.getMedicines();
  const orders = storage.getOrders();
  const invoices = storage.getInvoices();
  const users = storage.getUsers();
  const auditLogs = storage.getAuditLogs();
  const importHistory = storage.getImportHistory();
  const [shopSettings, setShopSettings] = useState<ShopSettings>(storage.getShopSettings());

  // Search & Filters in Inventory
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'expiry'>('all');

  // Edit / Add Medicine Modal
  const [editingMedicine, setEditingMedicine] = useState<MedicineItem | null>(null);
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);

  // Billing POS State
  const [billingCustomerName, setBillingCustomerName] = useState('Counter Customer');
  const [billingCustomerPhone, setBillingCustomerPhone] = useState('9122260360');
  const [billingDoctor, setBillingDoctor] = useState('Dr. Self');
  const [billingItems, setBillingItems] = useState<InvoiceItem[]>([]);
  const [billingSearch, setBillingSearch] = useState('');
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<Invoice | null>(null);

  // Marg ERP Import State
  const [csvRawText, setCsvRawText] = useState(rawInventoryCsv);
  const [csvFileName, setCsvFileName] = useState('Marg_Inventory_Export.csv');
  const [duplicatePolicy, setDuplicatePolicy] = useState<'update' | 'skip'>('update');
  const [importSummaryResult, setImportSummaryResult] = useState<MargImportSummary | null>(null);

  // Delivery Staff Management State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffArea, setNewStaffArea] = useState('Chanman, Baheri Bazar, Paghari');
  const [staffSuccessMsg, setStaffSuccessMsg] = useState('');
  const [staffErrorMsg, setStaffErrorMsg] = useState('');
  const [isAddingStaffFormOpen, setIsAddingStaffFormOpen] = useState(false);

  // Add delivery personnel handler
  const handleCreateDeliveryStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffErrorMsg('');
    setStaffSuccessMsg('');

    if (!newStaffName.trim() || !newStaffPhone.trim() || !newStaffEmail.trim()) {
      setStaffErrorMsg('Please fill in staff name, phone number, and email.');
      return;
    }

    const res = storage.addDeliveryStaff({
      name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      email: newStaffEmail.trim(),
      deliveryArea: newStaffArea.trim()
    });

    if (res.success) {
      setStaffSuccessMsg(res.message);
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffEmail('');
      setIsAddingStaffFormOpen(false);
      onRefreshTrigger();
      setTimeout(() => setStaffSuccessMsg(''), 3000);
    } else {
      setStaffErrorMsg(res.message);
    }
  };

  const handleToggleStaffStatus = (staffId: string) => {
    const res = storage.toggleDeliveryStaffStatus(staffId);
    if (res.success) {
      onRefreshTrigger();
    }
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to remove delivery staff "${staffName}"? They will immediately lose access to the delivery portal.`)) {
      storage.deleteDeliveryStaff(staffId);
      onRefreshTrigger();
    }
  };

  // Summary statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter(
      i => !i.isCancelled && i.createdAt.startsWith(today)
    );
    const todaySales = todayInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
    const totalSales = invoices
      .filter(i => !i.isCancelled)
      .reduce((acc, i) => acc + i.grandTotal, 0);

    const lowStockCount = medicines.filter(m => m.stock < 10).length;
    const nearExpiryCount = medicines.filter(m => {
      // Near expiry within 90 days
      const [year, month] = m.expiryDate.split('-').map(Number);
      if (!year || !month) return false;
      const expDate = new Date(year, month - 1, 1);
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      return expDate <= ninetyDaysFromNow;
    }).length;

    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

    return {
      todaySales,
      totalSales,
      totalMedicines: medicines.length,
      lowStockCount,
      nearExpiryCount,
      pendingOrdersCount
    };
  }, [medicines, invoices, orders]);

  // Delivery staff list for order assignment
  const deliveryStaff = useMemo(() => {
    return users.filter(u => u.role === 'delivery');
  }, [users]);

  // Handle stock adjustment
  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine) return;

    if (isAddingMedicine) {
      storage.addMedicine(editingMedicine);
    } else {
      storage.updateMedicine(editingMedicine, 'Admin edited stock/price details');
    }

    setEditingMedicine(null);
    setIsAddingMedicine(false);
    onRefreshTrigger();
  };

  // POS Add item
  const handleAddBillingItem = (med: MedicineItem) => {
    if (med.stock <= 0) {
      alert(`Cannot bill "${med.name}". Out of stock.`);
      return;
    }

    const existingIdx = billingItems.findIndex(i => i.medicineId === med.id);
    if (existingIdx !== -1) {
      const existing = billingItems[existingIdx];
      if (existing.quantity >= med.stock) {
        alert(`Cannot add more than available stock (${med.stock} ${med.unit}).`);
        return;
      }
      const updated = [...billingItems];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].amount = Math.round(updated[existingIdx].rate * updated[existingIdx].quantity * 100) / 100;
      setBillingItems(updated);
    } else {
      const newItem: InvoiceItem = {
        medicineId: med.id,
        medicineCode: med.code,
        name: med.name,
        batchNo: med.batchNo,
        expiryDate: med.expiryDate,
        quantity: 1,
        rate: med.rate,
        mrp: med.mrp,
        discountPercent: 0,
        gstPercent: 12,
        amount: med.rate
      };
      setBillingItems([newItem, ...billingItems]);
    }
  };

  // Complete POS Sale
  const handleCompleteSale = () => {
    if (billingItems.length === 0) return;

    const subtotal = billingItems.reduce((acc, it) => acc + it.amount, 0);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      customerName: billingCustomerName.trim() || 'Counter Patient',
      customerPhone: billingCustomerPhone.trim() || '9122260360',
      doctorName: billingDoctor.trim(),
      items: billingItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: 0,
      totalGst: Math.round(subtotal * 0.12 * 100) / 100,
      grandTotal: Math.round(subtotal * 100) / 100,
      paymentMode: 'cash',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin (Counter POS)'
    };

    const res = storage.createInvoice(invoice);
    if (res.success && res.invoice) {
      setSelectedInvoiceToPrint(res.invoice);
      setBillingItems([]);
      onRefreshTrigger();
    } else {
      alert(res.message);
    }
  };

  // Assign Order to Delivery Executive
  const handleAssignOrder = (orderId: string, deliveryId: string) => {
    const staff = users.find(u => u.id === deliveryId);
    if (!staff) return;

    storage.updateOrderStatus(orderId, 'assigned', {
      deliveryPersonId: staff.id,
      deliveryPersonName: staff.name
    });
    onRefreshTrigger();
  };

  // Marg CSV Preview rows
  const previewMargRows = useMemo(() => {
    try {
      return parseCsvRows(csvRawText).slice(0, 10);
    } catch {
      return [];
    }
  }, [csvRawText]);

  // Execute Marg CSV Import
  const handleExecuteImport = () => {
    const summary = storage.importMargCsv(csvRawText, csvFileName, duplicatePolicy);
    setImportSummaryResult(summary);
    onRefreshTrigger();
  };

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    let list = medicines;
    if (inventoryFilter === 'low') {
      list = list.filter(m => m.stock < 10);
    } else if (inventoryFilter === 'expiry') {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      list = list.filter(m => {
        const [year, month] = m.expiryDate.split('-').map(Number);
        if (!year || !month) return false;
        return new Date(year, month - 1, 1) <= ninetyDaysFromNow;
      });
    }

    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      list = list.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.batchNo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [medicines, inventoryFilter, inventorySearch]);

  return (
    <div className="flex-1 pb-20 text-slate-900 dark:text-slate-100">
      {/* Top Section Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[95px] z-20 px-4 py-2 select-none shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'inventory', label: t.inventory, icon: Package },
            { id: 'billing', label: t.billing, icon: Receipt },
            { id: 'orders', label: t.orders, icon: Clock, badge: stats.pendingOrdersCount || undefined },
            { id: 'marg', label: 'Marg ERP CSV', icon: FileSpreadsheet },
            { id: 'users', label: 'Accounts & Staff', icon: Users },
            { id: 'settings', label: t.settings, icon: Settings },
            { id: 'logs', label: 'Audit Logs', icon: ShieldCheck }
          ].map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as AdminSection)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{sec.label}</span>
                {sec.badge && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* SECTION: OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-1">
                <span className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider block">
                  {t.todaySales}
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-950 dark:text-blue-100">
                  ₹{stats.todaySales.toFixed(2)}
                </span>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  Retail counter & online orders
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-1">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                  Total Medicines Listed
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
                  {stats.totalMedicines}
                </span>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Synchronized with Marg ERP
                </p>
              </div>

              <div
                onClick={() => {
                  setInventoryFilter('low');
                  setActiveSection('inventory');
                }}
                className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-1 cursor-pointer hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider block">
                    {t.lowStockAlerts}
                  </span>
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100">
                  {stats.lowStockCount}
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium underline">
                  View low stock list →
                </p>
              </div>

              <div
                onClick={() => {
                  setInventoryFilter('expiry');
                  setActiveSection('inventory');
                }}
                className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-1 cursor-pointer hover:border-rose-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider block">
                    {t.nearExpiryAlerts}
                  </span>
                  <Clock size={16} className="text-rose-600" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-rose-950 dark:text-rose-100">
                  {stats.nearExpiryCount}
                </span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium underline">
                  Review expiry dates →
                </p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveSection('billing')}
                className="min-h-[52px] p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Receipt size={18} />
                  <span>New Counter POS Bill</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setActiveSection('marg')}
                className="min-h-[52px] p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} />
                  <span>Import Marg ERP CSV</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => {
                  setIsAddingMedicine(true);
                  setEditingMedicine({
                    id: `med_${Date.now()}`,
                    code: `MMH-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: '',
                    unit: 'TAB.',
                    stock: 50,
                    deal: 0,
                    free: 0,
                    pur_deal: 0,
                    pur_free: 0,
                    value: 0,
                    mrp: 100,
                    pur_rate: 70,
                    rate: 90,
                    company: '',
                    manufact: '',
                    rackno: 'R-1',
                    batchNo: `BAT-${Date.now().toString().slice(-4)}`,
                    expiryDate: '2027-12',
                    genericComposition: '',
                    category: 'Fever & Pain Relief',
                    isPrescriptionRequired: false
                  });
                }}
                className="min-h-[52px] p-4 rounded-2xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/40 active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus size={18} />
                  <span>{t.newMedicine}</span>
                </div>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Recent Orders Overview */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Live Customer Orders & Delivery Queue
                </h3>
                <button
                  onClick={() => setActiveSection('orders')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage All Orders ({orders.length}) →
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-sm text-blue-900 dark:text-blue-400">
                        {o.orderNumber}
                      </span>
                      <p className="text-xs text-slate-500">
                        {o.customerName} • {o.deliveryAddress.locality} • {o.items.length} items
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        {o.status}
                      </span>
                      <span className="font-bold text-sm">₹{o.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: INVENTORY */}
        {activeSection === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  placeholder="Search code, name, batch, company..."
                  className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm select-text"
                />
              </div>

              <div className="flex items-center gap-2 select-none">
                {(['all', 'low', 'expiry'] as const).map(flt => (
                  <button
                    key={flt}
                    onClick={() => setInventoryFilter(flt)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      inventoryFilter === flt
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {flt === 'all' && `All (${medicines.length})`}
                    {flt === 'low' && `Low Stock (<10)`}
                    {flt === 'expiry' && `Expiring Soon`}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/60">
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Medicine Name</th>
                    <th className="py-3 px-3">Company</th>
                    <th className="py-3 px-3">Batch & Expiry</th>
                    <th className="py-3 px-3 text-center">Stock</th>
                    <th className="py-3 px-3 text-right">MRP</th>
                    <th className="py-3 px-3 text-right">Sale Rate</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInventory.slice(0, 100).map(med => (
                    <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{med.code}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{med.name}</span>
                        <span className="text-[10px] text-slate-400">{med.genericComposition}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                        {med.company}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] block">{med.batchNo}</span>
                        <span className="text-[10px] text-slate-500">Exp: {med.expiryDate}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-black px-2 py-0.5 rounded-full text-[11px] ${
                            med.stock <= 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : med.stock < 10
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {med.stock} {med.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">₹{med.mrp.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        ₹{med.rate.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setIsAddingMedicine(false);
                            setEditingMedicine({ ...med });
                          }}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-blue-600 font-bold text-xs"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: BILLING POS */}
        {activeSection === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Product Selector */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {t.searchAndAddMedicine}
                </h3>
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={billingSearch}
                    onChange={e => setBillingSearch(e.target.value)}
                    placeholder="Search medicine to add (e.g. Dolo, Calpol, Pan, Azithral)..."
                    className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm select-text"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl">
                  {medicines
                    .filter(m =>
                      billingSearch
                        ? m.name.toLowerCase().includes(billingSearch.toLowerCase()) ||
                          m.code.toLowerCase().includes(billingSearch.toLowerCase())
                        : true
                    )
                    .slice(0, 15)
                    .map(m => (
                      <div
                        key={m.id}
                        onClick={() => handleAddBillingItem(m)}
                        className="p-3 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                          <span className="text-slate-500">
                            Batch: {m.batchNo} • Exp: {m.expiryDate} • Stock: {m.stock} {m.unit}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-blue-900 dark:text-blue-400 block">
                            ₹{m.rate.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">+ Add to bill</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Items in Current Bill */}
              <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h3 className="font-bold text-sm">Billed Medicines ({billingItems.length})</h3>

                {billingItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b font-bold text-slate-500">
                          <th className="py-2">Medicine</th>
                          <th className="py-2">Batch</th>
                          <th className="py-2 text-center">Qty</th>
                          <th className="py-2 text-right">Rate</th>
                          <th className="py-2 text-right">Amount</th>
                          <th className="py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {billingItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 font-medium">{item.name}</td>
                            <td className="py-2 font-mono text-[11px] text-slate-500">{item.batchNo}</td>
                            <td className="py-2 text-center font-bold">{item.quantity}</td>
                            <td className="py-2 text-right">₹{item.rate.toFixed(2)}</td>
                            <td className="py-2 text-right font-bold">₹{item.amount.toFixed(2)}</td>
                            <td className="py-2 text-center">
                              <button
                                onClick={() => {
                                  setBillingItems(billingItems.filter((_, i) => i !== idx));
                                }}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No items added yet. Click any medicine above to add to this counter sale bill.
                  </p>
                )}
              </div>
            </div>

            {/* Right: Bill Summary & Checkout */}
            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Invoice & Patient Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Customer / Patient Name</label>
                  <input
                    type="text"
                    value={billingCustomerName}
                    onChange={e => setBillingCustomerName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={billingCustomerPhone}
                    onChange={e => setBillingCustomerPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Prescribing Doctor (Optional)</label>
                  <input
                    type="text"
                    value={billingDoctor}
                    onChange={e => setBillingDoctor(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    ₹{billingItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-blue-950 dark:text-blue-100 border-t pt-2">
                  <span>Grand Total:</span>
                  <span>
                    ₹{billingItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                disabled={billingItems.length === 0}
                onClick={handleCompleteSale}
                className="w-full min-h-[50px] py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {t.completeSale}
              </button>
            </div>
          </div>
        )}

        {/* SECTION: MARG ERP CSV IMPORT */}
        {activeSection === 'marg' && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase text-emerald-600 tracking-wider">
                Database Synchronization
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {t.margTitle}
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed mt-1">
                {t.margDesc}
              </p>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duplicate Policy
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDuplicatePolicy('update')}
                    className={`min-h-[44px] p-2 rounded-xl border font-bold ${
                      duplicatePolicy === 'update'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Update Stock & Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicatePolicy('skip')}
                    className={`min-h-[44px] p-2 rounded-xl border font-bold ${
                      duplicatePolicy === 'skip'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Skip Duplicates
                  </button>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Upload size={16} />
                  <span>{t.startImport}</span>
                </button>
                <button
                  type="button"
                  onClick={() => storage.restoreBackup()}
                  className="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Restore Backup
                </button>
              </div>
            </div>

            {/* Import Summary Result if run */}
            {importSummaryResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  ✓ {t.importCompleted}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
                  <p>Total Rows: <span className="font-bold">{importSummaryResult.totalRows}</span></p>
                  <p>New Medicines: <span className="font-bold text-emerald-600">{importSummaryResult.importedRows}</span></p>
                  <p>Updated Records: <span className="font-bold text-blue-600">{importSummaryResult.updatedRows}</span></p>
                  <p>Duplicates Skipped: <span className="font-bold text-amber-600">{importSummaryResult.duplicateRows}</span></p>
                </div>
              </div>
            )}

            {/* CSV Data Preview */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-500">
                Data Preview (First 10 Rows from Marg Export)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
                      <th className="py-2 px-2.5">Code</th>
                      <th className="py-2 px-2.5">Name</th>
                      <th className="py-2 px-2.5">Unit</th>
                      <th className="py-2 px-2.5">Stock</th>
                      <th className="py-2 px-2.5">MRP</th>
                      <th className="py-2 px-2.5">Rate</th>
                      <th className="py-2 px-2.5">Company</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewMargRows.map((r, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2.5 font-mono">{r.code}</td>
                        <td className="py-1.5 px-2.5 font-medium">{r.name}</td>
                        <td className="py-1.5 px-2.5">{r.unit}</td>
                        <td className="py-1.5 px-2.5 font-bold">{r.stock}</td>
                        <td className="py-1.5 px-2.5">₹{r.mrp}</td>
                        <td className="py-1.5 px-2.5 text-blue-600 font-bold">₹{r.rate}</td>
                        <td className="py-1.5 px-2.5 text-slate-500">{r.company}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ORDERS & DELIVERY ASSIGNMENT */}
        {activeSection === 'orders' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base">Customer Orders Management</h3>

            <div className="space-y-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-base text-blue-900 dark:text-blue-400">
                        {order.orderNumber}
                      </span>
                      <p className="text-xs text-slate-500">
                        Placed by {order.customerName} ({order.customerPhone}) on{' '}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="font-black text-sm">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Delivery destination */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                    <p><span className="font-semibold">Address:</span> {order.deliveryAddress.fullAddress}, {order.deliveryAddress.locality}</p>
                    <p><span className="font-semibold">Items:</span> {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                  </div>

                  {/* Assign to delivery executive */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 font-medium">
                      Assigned to: <span className="font-bold text-slate-800 dark:text-slate-200">{order.assignedDeliveryPersonName || 'Unassigned'}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {deliveryStaff.map(staff => (
                        <button
                          key={staff.id}
                          onClick={() => handleAssignOrder(order.id, staff.id)}
                          className="min-h-[36px] px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all"
                        >
                          Assign to {staff.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: AUDIT LOGS */}
        {activeSection === 'logs' && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-bold text-base">Pharma Regulatory & Activity Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Immutable logs for stock deductions, POS sales, cancellations, CSV imports, and user authorizations.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{log.details}</p>
                  <p className="text-[10px] text-slate-400">Initiated by: {log.userEmail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: USERS & DELIVERY STAFF AUTHORIZATION */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            {/* 1. SINGLE ADMIN OWNER EXCLUSIVE PANEL */}
            <div className="p-6 rounded-3xl border-2 border-blue-600/30 bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Single Admin • Exclusive Owner
                    </span>
                    <span className="text-xs text-blue-200">
                      MADHAV MEDICAL HALL
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black">
                    {lang === 'hi' ? 'दुकान मालिक व्यवस्थापक खाता (Single Admin)' : 'Shop Owner Admin Account (Exclusive)'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    {lang === 'hi'
                      ? 'यह एडमिन पैनल केवल आपके (दुकान मालिक) लिए सुरक्षित है। कोई बाहरी व्यक्ति या ग्राहक एडमिन नहीं बन सकता।'
                      : 'This admin panel is strictly reserved for you (the shop owner). No external user or customer can create or claim admin access.'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-xs space-y-1 self-start sm:self-auto min-w-[220px]">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>madhavmedicalhall2016@gmail.com</span>
                  </p>
                  <p className="text-slate-300 font-mono text-[11px]">
                    Phone: 9122260360 (Chanman, Baheri)
                  </p>
                </div>
              </div>
            </div>

            {/* 2. DELIVERY STAFF AUTHORIZATION (ONLY PERSONS ADDED BY ADMIN) */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Truck size={20} className="text-amber-500" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {lang === 'hi' ? 'डिलीवरी स्टाफ प्रबंधन (केवल एडमिन द्वारा अधिकृत)' : 'Delivery Personnel Management'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'hi'
                      ? 'डिलीवरी पोर्टल में केवल वही कर्मचारी लॉगिन कर सकते हैं जिन्हें एडमिन यहाँ जोड़ता है।'
                      : 'Only delivery personnel explicitly added and approved by Admin below can access the Delivery Portal.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingStaffFormOpen(!isAddingStaffFormOpen)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer select-none"
                >
                  <Plus size={16} />
                  <span>{lang === 'hi' ? '+ नया डिलीवरी कर्मी जोड़ें' : '+ Add Delivery Staff'}</span>
                </button>
              </div>

              {/* Success / Error Alerts */}
              {staffSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check size={16} className="stroke-[3]" />
                  <span>{staffSuccessMsg}</span>
                </div>
              )}
              {staffErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{staffErrorMsg}</span>
                </div>
              )}

              {/* Form to Add Authorized Delivery Person */}
              {isAddingStaffFormOpen && (
                <form
                  onSubmit={handleCreateDeliveryStaff}
                  className="p-5 rounded-2xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-200 dark:border-amber-900/60 space-y-3.5 animate-slide-up"
                >
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck size={16} className="text-amber-600" />
                    <span>{lang === 'hi' ? 'अधिकृत डिलीवरी स्टाफ का विवरण दर्ज करें' : 'Add Authorized Delivery Personnel'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'hi' ? 'स्टाफ का नाम' : 'Staff Full Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={e => setNewStaffName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'hi' ? 'मोबाइल नंबर (लॉगिन हेतु)' : 'Mobile Phone (for login)'} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newStaffPhone}
                        onChange={e => setNewStaffPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'hi' ? 'ईमेल (Gmail)' : 'Email / Gmail'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={newStaffEmail}
                        onChange={e => setNewStaffEmail(e.target.value)}
                        placeholder="staff@gmail.com"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'hi' ? 'डिलीवरी रूट / क्षेत्र' : 'Assigned Route / Area'}
                      </label>
                      <input
                        type="text"
                        value={newStaffArea}
                        onChange={e => setNewStaffArea(e.target.value)}
                        placeholder="e.g. Baheri Bazar & Chanman"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingStaffFormOpen(false)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      {lang === 'hi' ? 'स्टाफ अधिकृत करें एवं जोड़ें' : 'Authorize & Add Staff'}
                    </button>
                  </div>
                </form>
              )}

              {/* Delivery Staff List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'hi'
                    ? `एडमिन द्वारा जोड़े गए डिलीवरी कर्मी (${deliveryStaff.length})`
                    : `Admin-Authorized Delivery Staff (${deliveryStaff.length})`}
                </span>

                {deliveryStaff.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deliveryStaff.map(staff => (
                      <div
                        key={staff.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center">
                              {staff.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {staff.name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {staff.phone} • {staff.email}
                              </p>
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                Route: {staff.deliveryArea || 'Baheri Local Area'}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              staff.isApproved
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {staff.isApproved ? 'Active & Approved' : 'Suspended'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                          <a
                            href={`tel:${staff.phone}`}
                            className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
                          >
                            <Phone size={12} />
                            <span>Call {staff.phone}</span>
                          </a>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffStatus(staff.id)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                staff.isApproved
                                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400'
                                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400'
                              }`}
                            >
                              {staff.isApproved ? 'Pause Access' : 'Activate Access'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id, staff.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete staff"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                    <Truck size={32} className="mx-auto text-slate-400" />
                    <p className="text-xs text-slate-500">
                      No delivery staff added yet. Click "+ Add Delivery Staff" above to authorize delivery personnel.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. REGISTERED CUSTOMER ACCOUNTS LIST */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'hi' ? 'पंजीकृत ग्राहक (Customer Accounts)' : 'Registered Customer Accounts'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total {users.filter(u => u.role === 'customer').length} customers registered. Customer accounts can only order and track their own purchases.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {users
                  .filter(u => u.role === 'customer')
                  .map(cust => (
                    <div key={cust.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-sm block text-slate-900 dark:text-white">{cust.name}</span>
                        <span className="text-slate-500">{cust.email} • {cust.phone}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Customer
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: SETTINGS */}
        {activeSection === 'settings' && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-bold text-base">Pharmacy Shop & Delivery Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Shop Name</label>
                <input
                  type="text"
                  value={shopSettings.shopName}
                  onChange={e => setShopSettings({ ...shopSettings, shopName: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={shopSettings.phone}
                  onChange={e => setShopSettings({ ...shopSettings, phone: e.target.value, whatsapp: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Drug License (D.L.) Number</label>
                <input
                  type="text"
                  value={shopSettings.dlNumber}
                  onChange={e => setShopSettings({ ...shopSettings, dlNumber: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Standard Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={shopSettings.standardDeliveryFee}
                  onChange={e => setShopSettings({ ...shopSettings, standardDeliveryFee: Number(e.target.value) })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                />
              </div>
            </div>
            <button
              onClick={() => {
                storage.saveShopSettings(shopSettings);
                alert('Shop settings updated successfully.');
                onRefreshTrigger();
              }}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* EDIT / ADD MEDICINE MODAL */}
      {editingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base">
                {isAddingMedicine ? 'Add New Medicine Item' : `Edit ${editingMedicine.name}`}
              </h3>
              <button
                onClick={() => setEditingMedicine(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Code</label>
                <input
                  type="text"
                  required
                  value={editingMedicine.code}
                  onChange={e => setEditingMedicine({ ...editingMedicine, code: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono select-text"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={editingMedicine.name}
                  onChange={e => setEditingMedicine({ ...editingMedicine, name: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Generic Composition</label>
                <input
                  type="text"
                  value={editingMedicine.genericComposition}
                  onChange={e => setEditingMedicine({ ...editingMedicine, genericComposition: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    value={editingMedicine.stock}
                    onChange={e => setEditingMedicine({ ...editingMedicine, stock: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    value={editingMedicine.unit}
                    onChange={e => setEditingMedicine({ ...editingMedicine, unit: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingMedicine.mrp}
                    onChange={e => setEditingMedicine({ ...editingMedicine, mrp: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Selling Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingMedicine.rate}
                    onChange={e => setEditingMedicine({ ...editingMedicine, rate: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={editingMedicine.batchNo}
                    onChange={e => setEditingMedicine({ ...editingMedicine, batchNo: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Expiry Date (YYYY-MM)</label>
                  <input
                    type="text"
                    value={editingMedicine.expiryDate}
                    onChange={e => setEditingMedicine({ ...editingMedicine, expiryDate: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 select-text"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingMedicine(null)}
                  className="flex-1 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-blue-600 text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT INVOICE MODAL */}
      <PrintInvoiceModal
        invoice={selectedInvoiceToPrint}
        onClose={() => setSelectedInvoiceToPrint(null)}
      />
    </div>
  );
};
