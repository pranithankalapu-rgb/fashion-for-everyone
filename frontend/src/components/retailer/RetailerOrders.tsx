import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Eye,
  MapPin,
  Mail,
  X,
} from 'lucide-react';
import type { CustomerOrder, OrderStatus } from '../../types/fashion';

interface RetailerOrdersProps {
  orders: CustomerOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => void;
}

const ALL_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

export const RetailerOrders: React.FC<RetailerOrdersProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [selectedOrderModal, setSelectedOrderModal] = useState<CustomerOrder | null>(null);
  const [modalTrackingInput, setModalTrackingInput] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchQuery.trim() ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatusTab === 'All' || o.status === selectedStatusTab;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (st: OrderStatus) => {
    switch (st) {
      case 'Delivered':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'Shipped':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'Processing':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
      case 'Pending':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'Cancelled':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'Returned':
        return 'bg-slate-500/10 border-slate-500/30 text-slate-300';
      default:
        return 'bg-surface-theme border-theme-subtle text-theme-muted';
    }
  };

  const handleOpenDetails = (order: CustomerOrder) => {
    setSelectedOrderModal(order);
    setModalTrackingInput(order.trackingNumber || '');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Fulfillment Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Orders Management
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Track customer purchases, review delivery status, update order progress, and manage returns.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-panel rounded-3xl p-5 space-y-4 border border-theme-main">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number (e.g. ORD-1028), customer name, email..."
              className="w-full h-10 pl-10 pr-4 bg-surface-theme border border-theme-main focus:border-amber-400/50 rounded-xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-theme rounded-xl border border-theme-main text-xs w-full md:w-auto">
            {['All', ...ALL_STATUSES].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusTab(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatusTab === st
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                    : 'text-theme-muted hover:text-theme-heading'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-theme-main shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-main bg-surface-theme/50 text-theme-muted uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3.5 px-4">Order Number & Date</th>
                <th className="py-3.5 px-4">Customer Information</th>
                <th className="py-3.5 px-4">Items Ordered</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {filteredOrders.map((order) => {
                const firstItem = order.items[0];
                return (
                  <tr key={order.id} className="hover:bg-surface-subtle-theme/60 transition-colors">
                    {/* Order Number & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-theme-heading text-xs font-mono">{order.orderNumber}</div>
                      <div className="text-[10px] text-theme-muted">{order.date}</div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-theme-heading">{order.customerName || 'Sophia Laurent'}</div>
                      <div className="text-[10px] text-theme-muted">{order.customerEmail || 'customer@example.com'}</div>
                    </td>

                    {/* Items Ordered */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={firstItem?.imageUrl}
                          alt={firstItem?.title}
                          className="w-9 h-11 object-cover rounded-lg border border-theme-subtle flex-shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-theme-heading line-clamp-1 text-xs">{firstItem?.title}</div>
                          <div className="text-[10px] text-theme-muted">
                            {order.items.length > 1 ? `+${order.items.length - 1} more items` : `Size: ${firstItem?.size || 'M'}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300 text-sm">
                      {order.currency}{order.totalAmount}
                    </td>

                    {/* Status Badge & Inline Select */}
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer ${getStatusBadgeStyle(order.status)}`}
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-slate-900 text-slate-100 font-semibold">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(order)}
                        className="px-3 py-1.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-theme-main pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-amber-400">Order Details Breakdown</div>
                <h2 className="text-xl font-serif font-bold text-theme-heading mt-0.5">
                  {selectedOrderModal.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main space-y-2 text-xs">
                <div className="font-bold text-theme-heading flex items-center gap-1.5 border-b border-theme-subtle pb-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Customer Profile</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Name:</span>
                  <span className="text-theme-heading font-semibold">{selectedOrderModal.customerName || 'Sophia Laurent'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Email:</span>
                  <span className="text-theme-heading font-semibold">{selectedOrderModal.customerEmail || 'sophia@example.com'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Phone:</span>
                  <span className="text-theme-heading font-semibold">{selectedOrderModal.customerPhone || '+1 (206) 555-0192'}</span>
                </div>
              </div>

              <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main space-y-2 text-xs">
                <div className="font-bold text-theme-heading flex items-center gap-1.5 border-b border-theme-subtle pb-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Fulfillment & Payment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Payment Method:</span>
                  <span className="text-theme-heading font-semibold">{selectedOrderModal.paymentMethod || 'Credit Card (Visa)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Shipping Address:</span>
                  <span className="text-theme-heading font-semibold text-right max-w-[180px] truncate">{selectedOrderModal.shippingAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Order Date:</span>
                  <span className="text-theme-heading font-semibold">{selectedOrderModal.date}</span>
                </div>
              </div>
            </div>

            {/* Purchased Products Matrix */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-theme-muted">Purchased Products</div>
              <div className="space-y-2">
                {selectedOrderModal.items.map((item, idx) => (
                  <div key={idx} className="bg-surface-theme p-3 rounded-2xl border border-theme-main flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={item.imageUrl} alt={item.title} className="w-12 h-14 object-cover rounded-xl border border-theme-subtle" />
                      <div>
                        <div className="font-bold text-xs text-theme-heading">{item.title}</div>
                        <div className="text-[10px] text-theme-muted">
                          Brand: {item.brand} • Size: {item.size} {item.color ? `• Color: ${item.color}` : ''}
                        </div>
                        {item.sku && <div className="text-[10px] font-mono text-amber-400">SKU: {item.sku}</div>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-amber-300">
                        {selectedOrderModal.currency}{item.price * item.quantity}
                      </div>
                      <div className="text-[10px] text-theme-muted">Qty: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Number Input & Status Update */}
            <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main space-y-3">
              <div className="text-xs font-bold text-theme-heading">Update Fulfillment Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase mb-1">Carrier Tracking #</label>
                  <input
                    type="text"
                    value={modalTrackingInput}
                    onChange={(e) => setModalTrackingInput(e.target.value)}
                    placeholder="TRK-948201948"
                    className="w-full bg-surface-subtle-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase mb-1">Update Order Status</label>
                  <select
                    value={selectedOrderModal.status}
                    onChange={(e) => {
                      const newSt = e.target.value as OrderStatus;
                      onUpdateOrderStatus(selectedOrderModal.id, newSt, modalTrackingInput);
                      setSelectedOrderModal({ ...selectedOrderModal, status: newSt, trackingNumber: modalTrackingInput });
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${getStatusBadgeStyle(selectedOrderModal.status)}`}
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-slate-100 font-semibold">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Total Amount & Close */}
            <div className="flex items-center justify-between pt-3 border-t border-theme-main">
              <div>
                <span className="text-xs text-theme-muted">Grand Total Amount:</span>
                <span className="text-xl font-bold font-mono text-amber-300 ml-2">
                  {selectedOrderModal.currency}{selectedOrderModal.totalAmount}
                </span>
              </div>

              <button
                onClick={() => setSelectedOrderModal(null)}
                className="bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
