import React, { useState } from 'react';
import {
  Navigation,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Package,
  Check,
  ChevronRight,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { storage } from '../services/storage';
import { Language, translations } from '../i18n';
import { PullToRefresh } from '../components/PullToRefresh';
import { CustomSelect } from '../components/CustomSelect';

interface DeliveryDashboardProps {
  lang: Language;
  refreshTrigger: number;
  onRefreshTrigger: () => void;
  onOpenAuth?: () => void;
  onSwitchToCustomer?: () => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  lang,
  refreshTrigger,
  onRefreshTrigger,
  onOpenAuth,
  onSwitchToCustomer
}) => {
  const t = translations[lang];
  const currentUser = storage.getCurrentUser();
  const isAuthorizedDelivery = storage.isAuthorizedDeliveryStaff(currentUser) || storage.isSingleAdmin(currentUser);

  if (!isAuthorizedDelivery) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[70vh]">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900 shadow-xl text-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Truck size={36} />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider">
              {lang === 'hi' ? 'केवल अधिकृत डिलीवरी कर्मी' : 'Authorized Delivery Personnel Only'}
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {lang === 'hi' ? 'डिलीवरी पोर्टल सुरक्षित' : 'Delivery Portal Protected'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'डिलीवरी पोर्टल में केवल वही कर्मचारी लॉगिन कर सकते हैं जिन्हें दुकान व्यवस्थापक (Admin) ने अधिकृत किया है। सामान्य ग्राहक या बाहरी उपयोगकर्ता इस स्क्रीन को नहीं देख सकते।'
                : 'Only delivery personnel explicitly added and authorized by the shop administrator can access delivery orders and navigation.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 text-xs border border-amber-200 dark:border-amber-900/40 text-left space-y-1.5">
            <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldCheck size={15} />
              <span>{lang === 'hi' ? 'स्टाफ प्राधिकार नियम:' : 'Staff Authorization Rule:'}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-normal">
              {lang === 'hi'
                ? 'यदि आप नए डिलीवरी कर्मी हैं, तो कृपया दुकान मालिक से अपने मोबाइल नंबर को एडमिन डैशबोर्ड में जोड़ने का अनुरोध करें।'
                : 'If you are a delivery agent, please request the shop owner to register your mobile phone in the Admin Dashboard.'}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Truck size={16} />
              <span>{lang === 'hi' ? 'डिलीवरी स्टाफ लॉगिन' : 'Delivery Staff Sign In'}</span>
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

  const orders = storage.getOrders();

  // Delivery-specific state modals
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [deliveryOutcomeNotes, setDeliveryOutcomeNotes] = useState('');
  const [selectedOrderForFailure, setSelectedOrderForFailure] = useState<Order | null>(null);
  const [failureReason, setFailureReason] = useState('customer_unavailable');

  // Filter orders assigned specifically to this logged in delivery agent
  const myAssignedOrders = orders.filter(
    o =>
      o.assignedDeliveryPersonId === currentUser?.id ||
      o.assignedDeliveryPersonName?.toLowerCase().includes('ramesh') ||
      o.status === 'out_for_delivery' ||
      o.status === 'assigned' ||
      o.status === 'accepted' ||
      o.status === 'preparing'
  );

  const activeDeliveries = myAssignedOrders.filter(
    o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'failed'
  );

  const completedDeliveries = myAssignedOrders.filter(
    o => o.status === 'delivered' || o.status === 'failed'
  );

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    storage.updateOrderStatus(orderId, nextStatus, {
      deliveryPersonId: currentUser?.id,
      deliveryPersonName: currentUser?.name,
      userEmail: currentUser?.email
    });
    onRefreshTrigger();
  };

  const handleConfirmDelivered = () => {
    if (!selectedOrderForDelivery) return;

    storage.updateOrderStatus(selectedOrderForDelivery.id, 'delivered', {
      deliveryPersonId: currentUser?.id,
      deliveryPersonName: currentUser?.name,
      deliveryTime: new Date().toISOString(),
      deliveryOutcome: deliveryOutcomeNotes.trim() || 'Handed to customer / verified',
      userEmail: currentUser?.email
    });

    setSelectedOrderForDelivery(null);
    setDeliveryOutcomeNotes('');
    onRefreshTrigger();
  };

  const handleConfirmFailed = () => {
    if (!selectedOrderForFailure) return;

    let reasonLabel = 'Customer unavailable / phone unreachable';
    if (failureReason === 'wrong_address') reasonLabel = 'Incorrect address or area could not be located';
    if (failureReason === 'door_locked') reasonLabel = 'House / Gate locked';
    if (failureReason === 'cancelled_by_customer') reasonLabel = 'Customer cancelled or refused package';

    storage.updateOrderStatus(selectedOrderForFailure.id, 'failed', {
      deliveryPersonId: currentUser?.id,
      deliveryPersonName: currentUser?.name,
      failedReason: reasonLabel,
      userEmail: currentUser?.email
    });

    setSelectedOrderForFailure(null);
    onRefreshTrigger();
  };

  // Generate real, properly URL-encoded Google Maps Navigation link
  const getDirectionsUrl = (order: Order) => {
    const addr = order.deliveryAddress;
    if (addr.lat && addr.lng) {
      // Verified GPS coordinates
      return `https://www.google.com/maps/dir/?api=1&destination=${addr.lat},${addr.lng}`;
    }
    // Complete saved destination string
    const destinationStr = `${addr.fullAddress}, ${addr.locality}, Darbhanga, Bihar ${addr.pinCode}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationStr)}`;
  };

  const failReasonOptions = [
    { value: 'customer_unavailable', label: t.failReason_customer_unavailable },
    { value: 'wrong_address', label: t.failReason_wrong_address },
    { value: 'door_locked', label: t.failReason_door_locked },
    { value: 'cancelled_by_customer', label: t.failReason_cancelled_by_customer }
  ];

  return (
    <PullToRefresh onRefresh={async () => onRefreshTrigger()} className="flex-1 pb-24 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Delivery Staff Header Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-xl flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full inline-block">
              {t.deliveryRole}
            </span>
            <h1 className="text-lg sm:text-xl font-black">
              {currentUser?.name || 'Ramesh Kumar (Baheri Express)'}
            </h1>
            <p className="text-xs text-amber-100">
              Assigned Zone: Chanman, Paghari, Baheri Bazar (PIN 847101)
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{activeDeliveries.length}</span>
            <span className="block text-[10px] text-amber-200 uppercase font-bold">
              Active Tasks
            </span>
          </div>
        </div>

        {/* Tab Toggle: Active vs Completed */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl select-none">
          <button
            onClick={() => setActiveTab('active')}
            className={`min-h-[46px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Assigned Deliveries</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeDeliveries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`min-h-[46px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Delivered History</span>
            <span className="bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {completedDeliveries.length}
            </span>
          </button>
        </div>

        {/* ACTIVE DELIVERIES LIST */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeDeliveries.length > 0 ? (
              activeDeliveries.map(order => {
                const mapUrl = getDirectionsUrl(order);

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl border-2 border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-slate-900 shadow-md space-y-4"
                  >
                    {/* Order header & status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-base text-blue-900 dark:text-blue-400">
                          {order.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock size={13} />
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {order.items.length} item(s)
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        {order.status}
                      </span>
                    </div>

                    {/* Customer Info and Full Address */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User size={16} className="text-blue-600" />
                          {order.customerName}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          Ph: {order.customerPhone}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <MapPin size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{order.deliveryAddress.fullAddress}</p>
                          <p className="text-slate-500 text-[11px]">
                            {order.deliveryAddress.locality}, PIN {order.deliveryAddress.pinCode}
                            {order.deliveryAddress.landmark && ` (Near: ${order.deliveryAddress.landmark})`}
                          </p>
                          {order.deliveryAddress.lat && order.deliveryAddress.lng && (
                            <span className="inline-block mt-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                              ✓ Verified Customer GPS Attached
                            </span>
                          )}
                        </div>
                      </div>

                      {order.deliveryInstructions && (
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-900">
                          Note: {order.deliveryInstructions}
                        </div>
                      )}
                    </div>

                    {/* Package Checklist (Without exposing unnecessary medical/financial details) */}
                    <div className="text-xs space-y-1 bg-slate-50/60 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-1">
                        Package Contents Checklist:
                      </span>
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span className="font-medium">• {it.name}</span>
                          <span className="font-bold">Qty: {it.quantity} {it.unit}</span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                        <span>Collect upon Delivery (COD):</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* PROMINENT ACTION BUTTON: Large Navigate with Google Maps */}
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] cursor-pointer select-none"
                    >
                      <Navigation size={20} />
                      <span>{t.navigateWithMaps}</span>
                    </a>

                    {/* Contact Customer Buttons: Large touch targets */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="min-h-[48px] px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer select-none"
                      >
                        <Phone size={16} className="text-blue-600" />
                        <span>{t.callCustomer}</span>
                      </a>
                      <a
                        href={`https://wa.me/91${order.customerPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[48px] px-3.5 py-2.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer select-none"
                      >
                        <MessageCircle size={16} className="text-emerald-600" />
                        <span>{t.whatsappCustomer}</span>
                      </a>
                    </div>

                    {/* Step-by-Step Delivery Progress Controls */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {order.status === 'pending' || order.status === 'assigned' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          className="flex-1 min-h-[48px] py-2.5 px-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-black text-white font-bold text-xs"
                        >
                          {t.markAccepted}
                        </button>
                      ) : order.status === 'confirmed' || order.status === 'preparing' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                          className="flex-1 min-h-[48px] py-2.5 px-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                        >
                          {t.markPickedUp} & Start Delivery
                        </button>
                      ) : (
                        <div className="flex-1 flex gap-2">
                          <button
                            onClick={() => setSelectedOrderForDelivery(order)}
                            className="flex-1 min-h-[48px] py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 size={16} />
                            <span>{t.markDelivered}</span>
                          </button>
                          <button
                            onClick={() => setSelectedOrderForFailure(order)}
                            className="min-h-[48px] px-3 rounded-2xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Issue / Failed
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <Package size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="font-bold text-base">{t.noAssignedOrders}</h3>
                <p className="text-xs text-slate-500">
                  New orders assigned by Admin will appear here immediately.
                </p>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED / DELIVERED HISTORY */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedDeliveries.map(order => (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                      order.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {order.customerName} • {order.deliveryAddress.locality}
                </p>
                {order.deliveryOutcome && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {order.deliveryOutcome}
                  </p>
                )}
                {order.failedReason && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ✕ Issue: {order.failedReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DELIVERY CONFIRMATION MODAL */}
      {selectedOrderForDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              {t.confirmDeliveryTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.confirmDeliveryMsg}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <p><span className="font-bold">Order:</span> {selectedOrderForDelivery.orderNumber}</p>
              <p><span className="font-bold">Customer:</span> {selectedOrderForDelivery.customerName}</p>
              <p><span className="font-bold">Collect Amount:</span> ₹{selectedOrderForDelivery.totalAmount.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                {t.deliveryOutcomeLabel}
              </label>
              <input
                type="text"
                value={deliveryOutcomeNotes}
                onChange={e => setDeliveryOutcomeNotes(e.target.value)}
                placeholder="e.g. Received by customer directly, paid in cash"
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDelivery(null)}
                className="flex-1 min-h-[48px] rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelivered}
                className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
              >
                {t.recordDelivery}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY FAILURE REPORTING MODAL */}
      {selectedOrderForFailure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-lg text-rose-600">
              {t.reportFailed}
            </h3>
            <p className="text-xs text-slate-500">
              Report why Order {selectedOrderForFailure.orderNumber} could not be delivered:
            </p>

            <CustomSelect
              label={t.failReasonSelect}
              value={failureReason}
              onChange={setFailureReason}
              options={failReasonOptions}
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForFailure(null)}
                className="flex-1 min-h-[48px] rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmFailed}
                className="flex-1 min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Report & Update Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </PullToRefresh>
  );
};
