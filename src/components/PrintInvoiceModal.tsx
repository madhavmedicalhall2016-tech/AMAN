import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../types';
import { Logo } from './Logo';

interface PrintInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  onClose
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
      >
        {/* Action bar (hidden in print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden select-none">
          <div className="flex items-center gap-2">
            <h2 id="invoice-modal-title" className="font-bold text-base text-slate-800">
              Retail Pharma Invoice #{invoice.invoiceNumber}
            </h2>
            {invoice.isCancelled ? (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold">
                CANCELLED
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> PAID
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <Logo size={64} />
              <div>
                <h1 className="text-xl font-black text-blue-900 leading-tight">
                  MADHAV MEDICAL HALL
                </h1>
                <p className="text-xs text-emerald-800 font-bold">
                  — आपके स्वास्थ्य का भरोसेमंद साथी —
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Chanman, Baheri, Darbhanga, Bihar - 847101
                </p>
                <p className="text-xs text-slate-600">
                  Phone / WhatsApp: <span className="font-semibold">9122260360</span>
                </p>
              </div>
            </div>
            <div className="text-right text-xs space-y-1">
              <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl text-left">
                <p><span className="font-bold text-slate-700">D.L. No:</span> BR-DAR-2016-104928</p>
                <p><span className="font-bold text-slate-700">GSTIN:</span> 10ABCDE1234F1Z5</p>
                <p><span className="font-bold text-slate-700">Invoice:</span> #{invoice.invoiceNumber}</p>
                <p><span className="font-bold text-slate-700">Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <p className="text-slate-500 font-semibold uppercase text-[10px]">Patient / Customer</p>
              <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
              <p className="text-slate-600">Ph: {invoice.customerPhone}</p>
              {invoice.customerAddress && <p className="text-slate-600">{invoice.customerAddress}</p>}
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-semibold uppercase text-[10px]">Doctor / Prescriber</p>
              <p className="font-bold text-slate-900">{invoice.doctorName || 'Self / Reg. Practitioner'}</p>
              <p className="text-slate-600">Payment: <span className="font-bold uppercase">{invoice.paymentMode}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-700 font-bold bg-slate-100">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Medicine / Item</th>
                  <th className="py-2 px-2">Batch</th>
                  <th className="py-2 px-2">Exp</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">MRP</th>
                  <th className="py-2 px-2 text-right">Rate</th>
                  <th className="py-2 px-2 text-right">GST</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium">{item.name}</td>
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-600">{item.batchNo}</td>
                    <td className="py-2 px-2 text-slate-600">{item.expiryDate}</td>
                    <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 px-2 text-right text-slate-500">₹{item.mrp.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-medium">₹{item.rate.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-slate-500">{item.gstPercent}%</td>
                    <td className="py-2 px-2 text-right font-bold">₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-start pt-3 border-t">
            <div className="text-[11px] text-slate-500 max-w-xs space-y-1">
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p>1. Goods once sold can be returned within 7 days in unopened condition with original invoice.</p>
              <p>2. Keep medicines stored in cool & dry place away from direct sunlight.</p>
            </div>
            <div className="text-right text-xs space-y-1 min-w-[200px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-₹{invoice.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Estimated GST:</span>
                <span>₹{invoice.totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-blue-900 border-t pt-1.5 mt-1">
                <span>Grand Total:</span>
                <span>₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-8 text-xs text-slate-600 border-t border-dashed">
            <div>
              <p className="font-semibold">Customer Signature</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-900">For MADHAV MEDICAL HALL</p>
              <div className="h-10"></div>
              <p className="border-t border-slate-400 pt-1">Authorized Pharmacist / Dispenser</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
