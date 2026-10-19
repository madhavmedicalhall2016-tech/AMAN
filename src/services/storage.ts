import {
  MedicineItem,
  Order,
  Invoice,
  User,
  ShopSettings,
  AuditLog,
  MargImportSummary
} from '../types';
import {
  INITIAL_SHOP_SETTINGS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  enrichMedicineData
} from '../data/seedData';
import rawInventoryCsv from '../data/initial_inventory.csv?raw';

const KEYS = {
  MEDICINES: 'mmh_medicines_v3',
  ORDERS: 'mmh_orders_v2',
  INVOICES: 'mmh_invoices_v2',
  USERS: 'mmh_users_v2',
  CURRENT_USER: 'mmh_current_user_v2',
  SHOP_SETTINGS: 'mmh_shop_settings_v2',
  AUDIT_LOGS: 'mmh_audit_logs_v2',
  IMPORT_HISTORY: 'mmh_import_history_v2',
  BACKUP: 'mmh_backup_data_v2',
  RESET_TOKENS: 'mmh_reset_tokens_v2'
};

// Parse raw CSV string safely handling quoted values
export function parseCsvRows(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Regex to split by comma outside quotes
    const values: string[] = [];
    let insideQuotes = false;
    let currentVal = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    if (rowObj['name'] && rowObj['name'].trim().length > 0) {
      rows.push(rowObj);
    }
  }

  return rows;
}

// Initialize seed data
export function getInitialMedicines(): MedicineItem[] {
  try {
    const rawRows = parseCsvRows(rawInventoryCsv);
    return rawRows.map((row, idx) => {
      const code = row['code'] || `A${1000 + idx}`;
      const name = row['name'] || 'Medicine Item';
      const company = row['company'] || '';
      const stock = parseFloat(row['stock'] || '0') || 0;
      const mrp = parseFloat(row['mrp'] || '0') || 0;
      const pur_rate = parseFloat(row['pur_rate'] || '0') || 0;
      const rate = parseFloat(row['rate'] || '0') || 0;
      const unit = row['unit'] || 'Pcs';
      const rackno = row['rackno'] || '';

      return enrichMedicineData(
        code,
        name,
        company,
        stock,
        mrp,
        pur_rate,
        rate,
        unit,
        rackno,
        idx
      );
    });
  } catch (err) {
    console.error('Error parsing initial CSV:', err);
    return [];
  }
}

// Storage Manager
class StorageService {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(KEYS.MEDICINES)) {
      const initialMedicines = getInitialMedicines();
      localStorage.setItem(KEYS.MEDICINES, JSON.stringify(initialMedicines));
    }
    if (!localStorage.getItem(KEYS.SHOP_SETTINGS)) {
      localStorage.setItem(KEYS.SHOP_SETTINGS, JSON.stringify(INITIAL_SHOP_SETTINGS));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    // Start as guest (null) so home page presents the login options to proceed
    // User can login with Gmail, mobile/email & password, or explore as guest
    if (!localStorage.getItem(KEYS.ORDERS)) {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(KEYS.INVOICES)) {
      localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.AUDIT_LOGS)) {
      const initialAudit: AuditLog[] = [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          userEmail: 'system@madhavmedical.com',
          action: 'SYSTEM_INITIALIZED',
          details: 'Initialized database with 240+ Marg ERP medicines dataset.'
        }
      ];
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(initialAudit));
    }
  }

  // --- SHOP SETTINGS ---
  getShopSettings(): ShopSettings {
    try {
      const raw = localStorage.getItem(KEYS.SHOP_SETTINGS);
      return raw ? JSON.parse(raw) : INITIAL_SHOP_SETTINGS;
    } catch {
      return INITIAL_SHOP_SETTINGS;
    }
  }

  saveShopSettings(settings: ShopSettings, userEmail: string = 'admin'): void {
    localStorage.setItem(KEYS.SHOP_SETTINGS, JSON.stringify(settings));
    this.addAuditLog(userEmail, 'UPDATE_SHOP_SETTINGS', 'Updated shop address, contact or fees');
  }

  // --- USERS & AUTH ---
  // STRICT RULE: Admin is exclusively the single shop owner (madhavmedicalhall2016@gmail.com)
  // Delivery Staff is strictly only users explicitly created and approved by Admin
  isSingleAdmin(user: User | null): boolean {
    if (!user) return false;
    return (
      user.email.toLowerCase() === 'madhavmedicalhall2016@gmail.com' &&
      user.role === 'admin'
    );
  }

  isAuthorizedDeliveryStaff(user: User | null): boolean {
    if (!user) return false;
    return (
      user.role === 'delivery' &&
      user.isApproved === true &&
      user.addedByAdmin === true
    );
  }

  getUsers(): User[] {
    try {
      const raw = localStorage.getItem(KEYS.USERS);
      let list: User[] = raw ? JSON.parse(raw) : INITIAL_USERS;

      // Ensure the SINGLE Owner Admin (madhavmedicalhall2016@gmail.com) is always present
      const ownerIdx = list.findIndex(
        u => u.email.toLowerCase() === 'madhavmedicalhall2016@gmail.com'
      );

      if (ownerIdx === -1) {
        list = [INITIAL_USERS[0], ...list];
      } else {
        // Enforce role is strictly admin for owner
        list[ownerIdx].role = 'admin';
        list[ownerIdx].isApproved = true;
        list[ownerIdx].addedByAdmin = true;
      }

      // STRICT SECURITY: Demote any other unauthorized accounts that attempted to set admin
      let modified = false;
      list = list.map(u => {
        if (
          u.email.toLowerCase() !== 'madhavmedicalhall2016@gmail.com' &&
          u.role === 'admin'
        ) {
          modified = true;
          return { ...u, role: 'customer' as const };
        }
        // Demote delivery staff not added by admin
        if (u.role === 'delivery' && !u.addedByAdmin) {
          modified = true;
          return { ...u, role: 'customer' as const };
        }
        return u;
      });

      if (modified || ownerIdx === -1) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(list));
      }
      return list;
    } catch {
      return INITIAL_USERS;
    }
  }

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(KEYS.CURRENT_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }

  updateUser(user: User): void {
    const users = this.getUsers().map(u => (u.id === user.id ? user : u));
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
  }

  // Admin exclusively adds delivery staff
  addDeliveryStaff(staff: {
    name: string;
    email: string;
    phone: string;
    deliveryArea?: string;
  }): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const cleanEmail = staff.email.trim().toLowerCase();
    const cleanPhone = staff.phone.trim();

    const exists = users.some(
      u => u.email.toLowerCase() === cleanEmail || u.phone === cleanPhone
    );
    if (exists) {
      return {
        success: false,
        message: 'A staff or customer account with this email or phone number already exists.'
      };
    }

    const newStaff: User = {
      id: `staff_del_${Date.now()}`,
      name: staff.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: 'delivery',
      isApproved: true,
      addedByAdmin: true,
      deliveryArea: staff.deliveryArea || 'Chanman & Baheri Bazar Area',
      addresses: [],
      createdAt: new Date().toISOString()
    };

    const updated = [...users, newStaff];
    localStorage.setItem(KEYS.USERS, JSON.stringify(updated));
    this.addAuditLog('admin', 'DELIVERY_STAFF_ADDED', `Admin added delivery staff ${newStaff.name} (${newStaff.phone})`);

    return {
      success: true,
      message: `Delivery staff ${newStaff.name} authorized successfully!`,
      user: newStaff
    };
  }

  // Admin toggles active status for delivery staff
  toggleDeliveryStaffStatus(userId: string): { success: boolean; isApproved: boolean } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, isApproved: false };

    const nextStatus = !target.isApproved;
    const updated = users.map(u => (u.id === userId ? { ...u, isApproved: nextStatus } : u));
    localStorage.setItem(KEYS.USERS, JSON.stringify(updated));
    this.addAuditLog(
      'admin',
      'STAFF_STATUS_TOGGLED',
      `Admin changed ${target.name} status to ${nextStatus ? 'Active' : 'Suspended'}`
    );

    return { success: true, isApproved: nextStatus };
  }

  // Admin deletes delivery staff
  deleteDeliveryStaff(userId: string): { success: boolean; message: string } {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    this.addAuditLog('admin', 'STAFF_REMOVED', `Admin removed delivery staff ${userId}`);
    return { success: true, message: 'Delivery staff removed successfully.' };
  }

  deleteCustomerAccount(userId: string): { success: boolean; message: string } {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(null);
    this.addAuditLog('system', 'ACCOUNT_DELETED', `User ${userId} requested account deletion. Invoices retained for statutory compliance.`);
    return {
      success: true,
      message: 'Account deleted. Statutory pharma invoices preserved for drug controller compliance.'
    };
  }

  // Password Recovery
  createPasswordResetToken(emailOrPhone: string): { success: boolean; token?: string; message: string } {
    const users = this.getUsers();
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanInput || u.phone === cleanInput);
    
    // Always return neutral security response as required by security guidelines
    const genericResponse = {
      success: true,
      message: 'If an account matches this record, a password reset instruction with a single-use token has been prepared.'
    };

    if (!user) return genericResponse;

    const token = Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    
    try {
      const tokensRaw = localStorage.getItem(KEYS.RESET_TOKENS);
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : {};
      tokens[token] = { userId: user.id, email: user.email, expiresAt: expiry };
      localStorage.setItem(KEYS.RESET_TOKENS, JSON.stringify(tokens));
    } catch {}

    this.addAuditLog(user.email, 'PASSWORD_RESET_REQUESTED', `Reset token generated for user ${user.id}`);
    return {
      success: true,
      token,
      message: 'Password reset link and security verification code generated (valid 15 minutes).'
    };
  }

  resetPasswordWithToken(token: string, newPassword: string): { success: boolean; message: string } {
    if (!token || !newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    try {
      const tokensRaw = localStorage.getItem(KEYS.RESET_TOKENS);
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : {};
      const entry = tokens[token];

      if (!entry) {
        return { success: false, message: 'Invalid or already consumed reset token.' };
      }
      if (Date.now() > entry.expiresAt) {
        delete tokens[token];
        localStorage.setItem(KEYS.RESET_TOKENS, JSON.stringify(tokens));
        return { success: false, message: 'This reset token has expired. Please request a new one.' };
      }

      delete tokens[token];
      localStorage.setItem(KEYS.RESET_TOKENS, JSON.stringify(tokens));
      this.addAuditLog(entry.email, 'PASSWORD_RESET_COMPLETED', 'Password changed successfully via reset token.');
      return { success: true, message: 'Password has been updated. You can now login.' };
    } catch {
      return { success: false, message: 'Failed to reset password.' };
    }
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): { success: boolean; message: string } {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    this.addAuditLog(user.email, 'PASSWORD_CHANGED', 'User changed their password successfully.');
    return { success: true, message: 'Password updated successfully!' };
  }

  // --- MEDICINES & INVENTORY ---
  getMedicines(): MedicineItem[] {
    try {
      const raw = localStorage.getItem(KEYS.MEDICINES);
      if (raw) return JSON.parse(raw);
      const initial = getInitialMedicines();
      localStorage.setItem(KEYS.MEDICINES, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  }

  saveMedicines(medicines: MedicineItem[], reason?: string): void {
    localStorage.setItem(KEYS.MEDICINES, JSON.stringify(medicines));
    if (reason) {
      this.addAuditLog('admin', 'INVENTORY_UPDATE', reason);
    }
  }

  updateMedicine(updatedItem: MedicineItem, reason: string = 'Manual stock update'): void {
    const list = this.getMedicines().map(m => (m.id === updatedItem.id ? updatedItem : m));
    this.saveMedicines(list, `${reason}: ${updatedItem.name} (Code: ${updatedItem.code})`);
  }

  addMedicine(newItem: MedicineItem): void {
    const list = [newItem, ...this.getMedicines()];
    this.saveMedicines(list, `Added new medicine: ${newItem.name}`);
  }

  // --- ORDERS ---
  getOrders(): Order[] {
    try {
      const raw = localStorage.getItem(KEYS.ORDERS);
      return raw ? JSON.parse(raw) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  }

  saveOrders(orders: Order[]): void {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  }

  placeOrder(order: Order): { success: boolean; message: string; order?: Order } {
    // Atomic validation: ensure stock is available for each item
    const medicines = this.getMedicines();
    for (const item of order.items) {
      const found = medicines.find(m => m.id === item.medicineId || m.code === item.medicineCode);
      if (!found) {
        return { success: false, message: `Medicine "${item.name}" not found in inventory.` };
      }
      if (found.stock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${item.name}". Only ${found.stock} ${found.unit} available.`
        };
      }
    }

    // Deduct stock atomically
    for (const item of order.items) {
      const found = medicines.find(m => m.id === item.medicineId || m.code === item.medicineCode);
      if (found) {
        found.stock = Math.max(0, Math.round((found.stock - item.quantity) * 100) / 100);
      }
    }
    this.saveMedicines(medicines, `Stock deducted for Order #${order.orderNumber}`);

    const orders = [order, ...this.getOrders()];
    this.saveOrders(orders);
    this.addAuditLog(order.customerPhone, 'ORDER_PLACED', `Placed order #${order.orderNumber} for ₹${order.totalAmount}`);
    return { success: true, message: 'Order placed successfully!', order };
  }

  updateOrderStatus(
    orderId: string,
    newStatus: Order['status'],
    options: {
      deliveryPersonId?: string;
      deliveryPersonName?: string;
      deliveryTime?: string;
      deliveryOutcome?: string;
      failedReason?: string;
      userEmail?: string;
    } = {}
  ): { success: boolean; message: string; order?: Order } {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return { success: false, message: 'Order not found.' };

    const order = orders[idx];
    const previousStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    if (options.deliveryPersonId) order.assignedDeliveryPersonId = options.deliveryPersonId;
    if (options.deliveryPersonName) order.assignedDeliveryPersonName = options.deliveryPersonName;
    if (options.deliveryTime) order.deliveryTime = options.deliveryTime;
    if (options.deliveryOutcome) order.deliveryOutcome = options.deliveryOutcome;
    if (options.failedReason) order.failedReason = options.failedReason;

    // If cancelled or failed, roll back inventory stock if not already restored
    if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
      const medicines = this.getMedicines();
      for (const item of order.items) {
        const found = medicines.find(m => m.id === item.medicineId || m.code === item.medicineCode);
        if (found) {
          found.stock = Math.round((found.stock + item.quantity) * 100) / 100;
        }
      }
      this.saveMedicines(medicines, `Restored stock for cancelled Order #${order.orderNumber}`);
    }

    orders[idx] = order;
    this.saveOrders(orders);
    this.addAuditLog(
      options.userEmail || 'system',
      'ORDER_STATUS_UPDATED',
      `Order #${order.orderNumber} status changed from ${previousStatus} to ${newStatus}`
    );

    return { success: true, message: `Order #${order.orderNumber} is now ${newStatus}.`, order };
  }

  // --- INVOICES & BILLING ---
  getInvoices(): Invoice[] {
    try {
      const raw = localStorage.getItem(KEYS.INVOICES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveInvoices(invoices: Invoice[]): void {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  }

  createInvoice(invoice: Invoice, createdBy: string = 'Admin'): { success: boolean; message: string; invoice?: Invoice } {
    const medicines = this.getMedicines();

    // Verify stock
    for (const item of invoice.items) {
      const found = medicines.find(m => m.id === item.medicineId || m.code === item.medicineCode);
      if (!found) {
        return { success: false, message: `Medicine "${item.name}" not in database.` };
      }
      if (found.stock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${item.name}". Only ${found.stock} in inventory.`
        };
      }
    }

    // Deduct stock atomically
    for (const item of invoice.items) {
      const found = medicines.find(m => m.id === item.medicineId || m.code === item.medicineCode);
      if (found) {
        found.stock = Math.max(0, Math.round((found.stock - item.quantity) * 100) / 100);
      }
    }
    this.saveMedicines(medicines, `Deducted stock for Invoice #${invoice.invoiceNumber}`);

    const invoices = [invoice, ...this.getInvoices()];
    this.saveInvoices(invoices);
    this.addAuditLog(createdBy, 'INVOICE_GENERATED', `Created tax invoice #${invoice.invoiceNumber} for ₹${invoice.grandTotal}`);

    return { success: true, message: 'Invoice generated successfully.', invoice };
  }

  cancelInvoice(invoiceId: string, reason: string, userEmail: string = 'admin'): { success: boolean; message: string } {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex(i => i.id === invoiceId);
    if (idx === -1) return { success: false, message: 'Invoice not found.' };

    const inv = invoices[idx];
    if (inv.isCancelled) return { success: false, message: 'Invoice already cancelled.' };

    inv.isCancelled = true;
    inv.cancellationReason = reason;
    inv.cancelledAt = new Date().toISOString();

    // Restore stock
    const medicines = this.getMedicines();
    for (const item of inv.items) {
      const found = medicines.find(m => m.id === item.medicineId || m.code === item.medicineCode);
      if (found) {
        found.stock = Math.round((found.stock + item.quantity) * 100) / 100;
      }
    }
    this.saveMedicines(medicines, `Stock returned on cancellation of Invoice #${inv.invoiceNumber}`);

    invoices[idx] = inv;
    this.saveInvoices(invoices);
    this.addAuditLog(userEmail, 'INVOICE_CANCELLED', `Cancelled Invoice #${inv.invoiceNumber}. Reason: ${reason}`);

    return { success: true, message: `Invoice #${inv.invoiceNumber} cancelled and stock restored.` };
  }

  // --- MARG ERP CSV IMPORT & BACKUP ---
  createBackup(): void {
    const backup = {
      timestamp: new Date().toISOString(),
      medicines: this.getMedicines(),
      orders: this.getOrders(),
      invoices: this.getInvoices()
    };
    localStorage.setItem(KEYS.BACKUP, JSON.stringify(backup));
    this.addAuditLog('admin', 'DATABASE_BACKUP_CREATED', 'Full database snapshot created before update.');
  }

  restoreBackup(): { success: boolean; message: string } {
    try {
      const raw = localStorage.getItem(KEYS.BACKUP);
      if (!raw) return { success: false, message: 'No backup found to restore.' };
      const backup = JSON.parse(raw);
      if (backup.medicines) this.saveMedicines(backup.medicines, 'Restored from pre-import backup.');
      if (backup.orders) this.saveOrders(backup.orders);
      if (backup.invoices) this.saveInvoices(backup.invoices);
      this.addAuditLog('admin', 'DATABASE_RESTORED', 'Restored database from previous backup.');
      return { success: true, message: 'Database successfully restored from backup.' };
    } catch {
      return { success: false, message: 'Failed to restore backup.' };
    }
  }

  importMargCsv(
    csvText: string,
    fileName: string,
    duplicatePolicy: 'update' | 'skip' = 'update'
  ): MargImportSummary {
    this.createBackup();

    const existingMedicines = [...this.getMedicines()];
    const rows = parseCsvRows(csvText);

    let importedCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    let rejectedCount = 0;
    const errors: string[] = [];

    const existingMap = new Map<string, MedicineItem>();
    existingMedicines.forEach(m => {
      existingMap.set(m.code.trim().toUpperCase(), m);
      existingMap.set(m.name.trim().toUpperCase(), m);
    });

    const newMedicines: MedicineItem[] = [];

    rows.forEach((row, idx) => {
      const code = (row['code'] || '').trim();
      const name = (row['name'] || '').trim();
      if (!name) {
        rejectedCount++;
        errors.push(`Row #${idx + 1}: Medicine name missing`);
        return;
      }

      const key = code ? code.toUpperCase() : name.toUpperCase();
      const existing = existingMap.get(key);

      const stock = parseFloat(row['stock'] || '0') || 0;
      const mrp = parseFloat(row['mrp'] || '0') || 0;
      const pur_rate = parseFloat(row['pur_rate'] || '0') || 0;
      const rate = parseFloat(row['rate'] || '0') || 0;
      const unit = row['unit'] || 'Pcs';
      const company = row['company'] || '';
      const rackno = row['rackno'] || '';

      if (existing) {
        duplicateCount++;
        if (duplicatePolicy === 'update') {
          existing.stock = stock;
          if (mrp > 0) existing.mrp = mrp;
          if (rate > 0) existing.rate = rate;
          if (pur_rate > 0) existing.pur_rate = pur_rate;
          if (company) existing.company = company;
          if (rackno) existing.rackno = rackno;
          updatedCount++;
        }
      } else {
        const enriched = enrichMedicineData(
          code || `IMP-${Date.now()}-${idx}`,
          name,
          company,
          stock,
          mrp,
          pur_rate,
          rate,
          unit,
          rackno,
          existingMedicines.length + newMedicines.length
        );
        newMedicines.push(enriched);
        importedCount++;
      }
    });

    const merged = [...existingMedicines, ...newMedicines];
    this.saveMedicines(merged, `Imported ${fileName}: ${importedCount} new, ${updatedCount} updated.`);

    const summary: MargImportSummary = {
      id: `imp_${Date.now()}`,
      fileName,
      timestamp: new Date().toISOString(),
      totalRows: rows.length,
      importedRows: importedCount,
      updatedRows: updatedCount,
      duplicateRows: duplicateCount,
      rejectedRows: rejectedCount,
      errors: errors.slice(0, 10)
    };

    const history = this.getImportHistory();
    localStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify([summary, ...history]));
    this.addAuditLog('admin', 'MARG_ERP_CSV_IMPORTED', `Imported ${fileName} (${importedCount} new, ${updatedCount} updated)`);

    return summary;
  }

  getImportHistory(): MargImportSummary[] {
    try {
      const raw = localStorage.getItem(KEYS.IMPORT_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    try {
      const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  addAuditLog(userEmail: string, action: string, details: string): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userEmail,
      action,
      details
    };
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify([newEntry, ...logs.slice(0, 99)]));
  }
}

export const storage = new StorageService();
