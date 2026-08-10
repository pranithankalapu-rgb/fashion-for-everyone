import React from 'react';
import { X, Package, CheckCircle2, Clock, Truck, MapPin } from 'lucide-react';
import type { CustomerOrder } from '../types/fashion';

interface OrderDetailsModalProps {
  order: CustomerOrder | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const getStatusBadge = (status: CustomerOrder['status']) => {
    switch (status) {
      case 'Delivered':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
          icon: CheckCircle2,
          label: 'Delivered ✓',
        };
      case 'Shipped':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
          icon: Truck,
          label: 'Shipped 🚚',
        };
      case 'Processing':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300',
          icon: Clock,
          label: 'Processing ⏳',
        };
      case 'Cancelled':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
          icon: X,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
          icon: Package,
          label: status,
        };
    }
  };

  const statusInfo = getStatusBadge(order.status);
  const StatusIcon = statusInfo.icon;

  const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIndex =
    order.status === 'Delivered'
      ? 3
      : order.status === 'Shipped'
      ? 2
      : order.status === 'Processing'
      ? 1
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
              Customer Order Summary
            </span>
            <div className={`px-2.5 py-0.5 rounded-full border text-xs font-bold flex items-center gap-1 ${statusInfo.bg}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusInfo.label}</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-theme-heading flex items-center gap-2 pt-1">
            <span>Order #{order.orderNumber}</span>
          </h2>
          <p className="text-xs text-theme-muted">
            Placed on {order.date} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Status Progress Stepper */}
        {order.status !== 'Cancelled' && (
          <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
              Fulfillment Status
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-theme-main -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-4 h-0.5 bg-amber-400 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 88}%` }}
              />
              {steps.map((step, idx) => {
                const isComplete = idx <= currentStepIndex;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isComplete
                          ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md'
                          : 'bg-surface-theme border-theme-main text-theme-muted'
                      }`}
                    >
                      {isComplete ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        isComplete ? 'text-theme-heading' : 'text-theme-muted'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Purchased Items List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-theme-heading">
            Purchased Items
          </div>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-surface-theme rounded-2xl border border-theme-main"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-14 h-16 object-cover rounded-xl border border-theme-subtle flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate">
                    {item.brand}
                  </div>
                  <div className="text-xs font-bold text-theme-heading truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-theme-muted mt-0.5 flex items-center gap-2">
                    <span>Size: {item.size}</span>
                    {item.color && <span>• Color: {item.color}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-amber-300">
                    {order.currency}{item.price.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-theme-muted">Qty: {item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Delivery Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="bg-surface-theme p-3.5 rounded-2xl border border-theme-main space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-theme-heading">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Delivery Address</span>
            </div>
            <div className="text-[11px] text-theme-muted leading-relaxed">
              {order.shippingAddress}
            </div>
          </div>

          <div className="bg-surface-theme p-3.5 rounded-2xl border border-theme-main space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-theme-heading">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Tracking Info</span>
            </div>
            <div className="text-[11px] text-theme-muted font-mono">
              {order.trackingNumber || 'Tracking ID Pending'}
            </div>
            {order.deliveryDate && (
              <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                {order.deliveryDate}
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary Footer */}
        <div className="pt-4 border-t border-theme-main flex items-center justify-between">
          <div>
            <div className="text-[10px] text-theme-muted font-semibold">Total Amount Paid</div>
            <div className="text-xl font-bold text-amber-400">
              {order.currency}{order.totalAmount.toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <span>Close Details</span>
          </button>
        </div>

      </div>
    </div>
  );
};
