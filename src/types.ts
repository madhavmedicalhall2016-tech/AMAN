export type UserRole = 'admin' | 'delivery' | 'customer';

export interface UserAddress {
  id: string;
  label: string; // e.g. Home, Work
  fullAddress: string;
  locality: string;
  pinCode: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isApproved: boolean; // delivery personnel require explicit admin creation/approval
  deliveryArea?: string; // assigned delivery route / zone in Baheri
  addedByAdmin?: boolean; // strictly created by admin
  addresses: UserAddress[];
  createdAt: string;
}

export interface MedicineItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  stock: number;
  deal: number;
  free: number;
  pur_deal: number;
  pur_free: number;
  value: number;
  mrp: number;
  pur_rate: number;
  rate: number; // selling price
  company: string;
  manufact: string;
  rackno: string;
  batchNo: string;
  expiryDate: string; // YYYY-MM
  genericComposition: string;
  category: string;
  isPrescriptionRequired: boolean;
}

export interface OrderItem {
  medicineId: string;
  medicineCode: string;
  name: string;
  unit: string;
  batchNo: string;
  quantity: number;
  rate: number; // unit selling price
  mrp: number;
  total: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryAddressDetail {
  houseFlat?: string; // House / Flat number
  street?: string; // Street / Road / Gali
  villageArea: string; // Village / Area / Locality (e.g. Chanman, Baheri Bazar, Paghari)
  city: string; // City (e.g. Baheri / Darbhanga)
  district: string; // District (e.g. Darbhanga)
  state: string; // State (Bihar)
  pinCode: string; // PIN Code (847101)
  landmark?: string;
  fullAddress: string; // Complete human-readable address
  lat?: number; // Latitude from interactive draggable map pin or GPS
  lng?: number; // Longitude from interactive draggable map pin or GPS
  locationAccuracy?: 'gps' | 'map_pin' | 'address';
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryMode: 'home_delivery' | 'store_pickup';
  deliveryAddress: DeliveryAddressDetail;
  deliveryInstructions?: string;
  prescriptionImage?: string; // Base64 data URL of photographed or uploaded prescription
  prescriptionFileName?: string;
  detectedMedicines?: string[]; // Extracted/noted medicines from prescription review
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'pay_at_store' | 'upi';
  paymentStatus: 'pending' | 'paid';
  status: OrderStatus;
  assignedDeliveryPersonId?: string;
  assignedDeliveryPersonName?: string;
  deliveryTime?: string;
  deliveryOutcome?: string;
  failedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  medicineId: string;
  medicineCode: string;
  name: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  rate: number;
  mrp: number;
  discountPercent: number;
  gstPercent: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  doctorName?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  paymentMode: 'cash' | 'upi' | 'card';
  createdAt: string;
  createdBy: string;
  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  taglineHi: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  openingHoursHi: string;
  gstNumber: string;
  dlNumber: string; // Drug License Number
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  allowHomeDelivery: boolean;
  allowStorePickup: boolean;
  deliveryAreas: string[];
}

export interface MargImportRow {
  code: string;
  name: string;
  unit: string;
  stock: number;
  deal: number;
  free: number;
  pur_deal: number;
  pur_free: number;
  value: number;
  mrp: number;
  pur_rate: number;
  rate: number;
  company: string;
  manufact: string;
  rackno: string;
}

export interface MargImportSummary {
  id: string;
  fileName: string;
  timestamp: string;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  duplicateRows: number;
  rejectedRows: number;
  errors: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
}

export interface PlayScanCheckResult {
  id: string;
  title: string;
  titleHi: string;
  status: 'PASS' | 'WARNING' | 'BLOCKING';
  summary: string;
  summaryHi: string;
  technicalDetails: string;
}
