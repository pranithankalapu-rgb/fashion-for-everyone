import React, { useState, useEffect } from 'react';
import type { CustomerOrder, OrderStatus } from '../../types/fashion';
import {
  ShoppingCart,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Edit3,
  X,
  Truck,
  PackageCheck,
  Clock,
  Ban,
  User,
  MapPin,
  CreditCard,
  DollarSign,
} from 'lucide-react';

interface AdminOrdersViewProps {
  onLogout?: () => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Pending');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const statuses: string[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenEditStatus = (order: CustomerOrder) => {
    setEditingOrder(order);
    setNewStatus(order.status as OrderStatus);
    setTrackingNumber(order.trackingNumber || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'retailer',
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber ? trackingNumber.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order status');
      }

      const updated = await res.json();
      showNotification('success', `Order ${updated.orderNumber || updated.id} updated to "${updated.status}"`);
      setEditingOrder(null);
      fetchOrders();
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to cancel and delete order ${orderNumber}?`)) return;

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'retailer',
        },
      });

      if (!res.ok) throw new Error('Failed to delete order');

      showNotification('success', `Order ${orderNumber} deleted successfully.`);
      if (selectedOrder?.id === id) setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete order');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <PackageCheck className="w-3 h-3 text-emerald-400" />
            <span>Delivered</span>
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <Truck className="w-3 h-3 text-cyan-400" />
            <span>Shipped</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Processing</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <Ban className="w-3 h-3 text-rose-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{status || 'Pending'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-slideDown max-w-md ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Customer Orders Management</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-theme-heading">Order Operations & Fulfillment</h1>
          <p className="text-xs text-theme-muted">
            Monitor incoming customer orders, assign tracking numbers, update shipping status, and process order cancellations.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-theme border border-theme-main rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-theme-muted" />
          <input
            type="text"
            placeholder="Search by order #, name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'bg-modal-theme border border-theme-main text-theme-muted hover:text-theme-heading'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-theme border border-theme-main rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-theme-main bg-modal-theme text-theme-muted font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Order ID & Date</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Items Count</th>
                <th className="py-4 px-4">Total Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Tracking #</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-main/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-theme-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span>Loading customer orders from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-theme-muted">
                    No orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-subtle-theme/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-amber-300 text-sm">
                          {order.orderNumber || order.id}
                        </span>
                        <div className="text-[11px] text-theme-muted">{order.date}</div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-theme-heading text-xs">
                          {order.customerName || 'Guest Customer'}
                        </div>
                        <div className="text-[11px] text-theme-muted">{order.customerEmail || 'No email'}</div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-theme-heading">
                      {order.items?.length || 0} line item(s)
                    </td>

                    <td className="py-4 px-4 font-bold text-amber-300 text-sm">
                      {order.currency || '$'}{order.totalAmount}
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(order.status)}</td>

                    <td className="py-4 px-4 font-mono text-[11px] text-theme-muted">
                      {order.trackingNumber || '—'}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-cyan-400 hover:text-cyan-300 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditStatus(order)}
                        className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-amber-400 hover:text-amber-300 transition-all"
                        title="Update Status & Tracking"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id, order.orderNumber || order.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all"
                        title="Cancel & Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-serif font-bold text-theme-heading">
                  Order {selectedOrder.orderNumber || selectedOrder.id}
                </h2>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <p className="text-xs text-theme-muted">Placed on {selectedOrder.date}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-theme-main">
              <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Information</span>
                </div>
                <div className="text-xs text-theme-heading font-semibold">
                  {selectedOrder.customerName || 'N/A'}
                </div>
                <div className="text-xs text-theme-muted">{selectedOrder.customerEmail}</div>
                <div className="text-xs text-theme-muted">{selectedOrder.customerPhone || 'Phone not provided'}</div>
              </div>

              <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Shipping Address & Method</span>
                </div>
                <div className="text-xs text-theme-heading">{selectedOrder.shippingAddress || 'N/A'}</div>
                <div className="text-xs text-theme-muted flex items-center gap-1 mt-1">
                  <CreditCard className="w-3 h-3 text-emerald-400" />
                  <span>{selectedOrder.paymentMethod || 'Credit Card'}</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-wider">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 p-3 bg-surface-theme rounded-2xl border border-theme-main"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-14 object-cover rounded-xl border border-theme-main"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">{item.brand}</span>
                        <h4 className="font-bold text-theme-heading text-xs">{item.title}</h4>
                        <div className="text-[11px] text-theme-muted flex gap-2">
                          <span>Size: {item.size}</span>
                          {item.color && <span>• Color: {item.color}</span>}
                          {item.sku && <span>• SKU: {item.sku}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-300 text-xs">
                        ${item.price} x {item.quantity}
                      </div>
                      <div className="font-bold text-theme-heading text-xs">
                        ${item.price * item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-theme-main">
              <div className="text-xs text-theme-muted flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Total Amount Paid:</span>
              </div>
              <div className="text-xl font-bold text-amber-300">
                {selectedOrder.currency || '$'}{selectedOrder.totalAmount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Status Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-theme-heading">
                Update Order Status
              </h3>
              <p className="text-xs text-theme-muted">
                Change status for order <code className="text-amber-300">{editingOrder.orderNumber || editingOrder.id}</code>
              </p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                >
                  {statuses.filter((s) => s !== 'All').map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Carrier Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK-948201948"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
