import React, { useState, useEffect, useCallback } from 'react';
import type { CustomerOrder, OrderStatus, AdminOrderStats } from '../../types/fashion';
import { api } from '../../services/api';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
  DollarSign,
  PackageCheck,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  X,
  Layers,
  ArrowUpDown,
  Trash2,
  ExternalLink,
} from 'lucide-react';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
];

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stats, setStats] = useState<AdminOrderStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'totalAmount' | 'orderNumber' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal / Detail View
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [editTracking, setEditTracking] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAdminOrders({
        status: selectedStatus,
        search: searchQuery,
        sortBy,
        sortOrder,
      });

      setOrders(response.orders || []);
      setStats(response.stats || null);
    } catch (err: any) {
      console.error('Failed to load admin orders:', err);
      setError(err.message || 'Failed to connect to PostgreSQL database.');
      showNotification('error', err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenOrderDetails = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditTracking(order.trackingNumber || '');
  };

  const handleSaveOrderStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const res = await api.updateAdminOrderStatus(selectedOrder.id, editStatus, editTracking);

      showNotification('success', `Order #${res.order.orderNumber} status updated to ${res.order.status} in PostgreSQL.`);

      // Update in local state
      setOrders((prev) =>
        prev.map((o) => (o.id === res.order.id ? res.order : o))
      );
      setSelectedOrder(res.order);

      // Refresh stats in background
      api.getAdminOrderStats().then(setStats).catch(() => {});
    } catch (err: any) {
      console.error('Error updating order:', err);
      showNotification('error', err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleInlineStatusChange = async (order: CustomerOrder, newStatus: OrderStatus) => {
    try {
      const res = await api.updateAdminOrderStatus(order.id, newStatus, order.trackingNumber);
      showNotification('success', `Order #${order.orderNumber} updated to ${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? res.order : o))
      );
      api.getAdminOrderStats().then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update status');
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Order ${orderNumber}? This will remove it from PostgreSQL.`)) {
      return;
    }

    setDeletingId(orderId);
    try {
      await api.deleteAdminOrder(orderId);
      showNotification('success', `Order #${orderNumber} deleted from PostgreSQL.`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      api.getAdminOrderStats().then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete order');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
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

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Shipped':
        return <Truck className="w-3.5 h-3.5 text-blue-400" />;
      case 'Processing':
        return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Pending':
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />;
      case 'Cancelled':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'Returned':
        return <RotateCcw className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return null;
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

      {/* Admin Panel Header Banner */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>PostgreSQL & Prisma Admin Orders Management</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-theme-heading">Admin Orders Management</h1>
          <p className="text-xs text-theme-muted">
            Monitor real-time customer purchases, update order statuses, assign tracking codes, and audit PostgreSQL transaction records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Orders from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sync Database</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-3xl p-5 border border-theme-main space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">Total Orders</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-serif text-theme-heading">{stats.totalOrders}</div>
            <div className="text-[11px] text-theme-muted flex items-center gap-1">
              <span className="text-emerald-400 font-bold">Active in DB:</span>
              <span>{stats.totalOrders - stats.cancelledCount} orders</span>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5 border border-theme-main space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">Gross Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-[11px] text-theme-muted flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Avg: ${stats.avgOrderValue}/order</span>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5 border border-theme-main space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">Pending & In-Flight</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-theme-heading">
              {stats.pendingCount + stats.processingCount + stats.shippedCount}
            </div>
            <div className="text-[11px] text-theme-muted">
              {stats.pendingCount} Pending • {stats.processingCount} Processing • {stats.shippedCount} Shipped
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5 border border-theme-main space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">Delivered & Fulfilled</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.deliveredCount}</div>
            <div className="text-[11px] text-theme-muted">
              {stats.cancelledCount} Cancelled • {stats.returnedCount} Returned
            </div>
          </div>
        </div>
      )}

      {/* Filter, Search & Sort Control Bar */}
      <div className="bg-surface-theme border border-theme-main rounded-3xl p-4 sm:p-5 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-theme-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order # (e.g. ORD-1028), customer name, email, item title, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 transition-all placeholder:text-theme-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 rounded-lg text-theme-muted hover:text-theme-heading"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-muted">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-theme-heading font-semibold outline-none cursor-pointer"
              >
                <option value="date" className="bg-slate-900 text-slate-100">Date Placed</option>
                <option value="totalAmount" className="bg-slate-900 text-slate-100">Total Amount</option>
                <option value="orderNumber" className="bg-slate-900 text-slate-100">Order Number</option>
                <option value="status" className="bg-slate-900 text-slate-100">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="ml-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 px-1.5 py-0.5 rounded bg-surface-theme"
                title={`Switch to ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-theme-subtle pt-3">
          <Layers className="w-4 h-4 text-amber-400 flex-shrink-0 hidden sm:block" />
          <button
            onClick={() => setSelectedStatus('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStatus === 'All'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner'
                : 'bg-modal-theme border border-theme-main text-theme-muted hover:text-theme-heading'
            }`}
          >
            All Orders ({stats?.totalOrders ?? orders.length})
          </button>

          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatus === st
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner'
                  : 'bg-modal-theme border border-theme-main text-theme-muted hover:text-theme-heading'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-surface-theme border border-theme-main rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-theme-main bg-modal-theme text-theme-muted font-bold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Order Reference & Date</th>
                <th className="py-4 px-4">Customer Details</th>
                <th className="py-4 px-4">Purchased Items</th>
                <th className="py-4 px-4">Total Amount</th>
                <th className="py-4 px-4">Payment & Tracking</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-main/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-theme-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
                      <span className="text-xs font-semibold">Streaming orders from PostgreSQL database...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-rose-400">
                      <AlertCircle className="w-8 h-8" />
                      <span className="text-xs font-bold">{error}</span>
                      <button
                        onClick={fetchOrders}
                        className="mt-2 px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-theme-heading text-xs font-bold hover:bg-surface-subtle-theme"
                      >
                        Retry Database Query
                      </button>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-theme-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-theme-muted opacity-40" />
                      <span className="text-sm font-semibold text-theme-heading">No orders found</span>
                      <span className="text-xs">No customer orders match your current filters or search query.</span>
                      {(selectedStatus !== 'All' || searchQuery) && (
                        <button
                          onClick={() => {
                            setSelectedStatus('All');
                            setSearchQuery('');
                          }}
                          className="mt-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const firstItem = order.items?.[0];
                  const totalItemsCount = order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 1;

                  return (
                    <tr key={order.id} className="hover:bg-surface-subtle-theme/50 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <button
                            onClick={() => handleOpenOrderDetails(order)}
                            className="font-mono font-bold text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 text-left cursor-pointer"
                          >
                            <span>{order.orderNumber}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </button>
                          <div className="text-[11px] text-theme-muted">{order.date}</div>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 max-w-[180px]">
                          <div className="font-bold text-theme-heading text-xs truncate">
                            {order.customerName || 'Anonymous Customer'}
                          </div>
                          <div className="text-[11px] text-theme-muted truncate" title={order.customerEmail}>
                            {order.customerEmail || 'No email provided'}
                          </div>
                          {order.customerPhone && (
                            <div className="text-[10px] text-theme-secondary font-mono">{order.customerPhone}</div>
                          )}
                        </div>
                      </td>

                      {/* Purchased Items */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {firstItem?.imageUrl ? (
                            <img
                              src={firstItem.imageUrl}
                              alt={firstItem.title}
                              className="w-10 h-12 object-cover rounded-xl border border-theme-main bg-black/20 flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-12 rounded-xl bg-surface-theme border border-theme-main flex items-center justify-center text-amber-400 flex-shrink-0">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                          <div className="space-y-0.5 max-w-[160px]">
                            <div className="font-semibold text-theme-heading text-xs truncate" title={firstItem?.title}>
                              {firstItem?.title || 'Fashion Order Item'}
                            </div>
                            <div className="text-[10px] text-theme-muted">
                              Size {firstItem?.size || 'M'} • {totalItemsCount} item{totalItemsCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4">
                        <div className="font-bold font-mono text-amber-300 text-sm">
                          {order.currency || '$'}{order.totalAmount}
                        </div>
                        <div className="text-[10px] text-theme-muted">Paid in Full</div>
                      </td>

                      {/* Payment & Tracking */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-[11px]">
                          <div className="text-theme-heading font-medium truncate">
                            {order.paymentMethod || 'Credit Card'}
                          </div>
                          {order.trackingNumber ? (
                            <div className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                              <Truck className="w-3 h-3 text-blue-400" />
                              <span>{order.trackingNumber}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-theme-muted italic">No tracking yet</div>
                          )}
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={order.status}
                            onChange={(e) => handleInlineStatusChange(order, e.target.value as OrderStatus)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer ${getStatusBadgeStyle(
                              order.status
                            )}`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-slate-900 text-slate-100 font-semibold">
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenOrderDetails(order)}
                          className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                          disabled={deletingId === order.id}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all cursor-pointer disabled:opacity-50"
                          title="Delete Order Record"
                        >
                          {deletingId === order.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order Details Breakdown Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-theme-main pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 text-base">
                    Order #{selectedOrder.orderNumber}
                  </span>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeStyle(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusIcon(selectedOrder.status)}
                    <span>{selectedOrder.status}</span>
                  </div>
                </div>
                <p className="text-xs text-theme-muted">
                  PostgreSQL Record ID: <span className="font-mono text-theme-heading">{selectedOrder.id}</span> • Placed on {selectedOrder.date}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Fulfillment Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info Card */}
              <div className="bg-surface-theme p-5 rounded-2xl border border-theme-main space-y-3 text-xs">
                <div className="font-bold text-theme-heading flex items-center gap-2 border-b border-theme-subtle pb-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Customer Profile</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Name:</span>
                    <span className="text-theme-heading font-semibold">{selectedOrder.customerName || 'Anonymous'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Email:</span>
                    <span className="text-theme-heading font-semibold">{selectedOrder.customerEmail || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Phone:</span>
                    <span className="text-theme-heading font-semibold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>{selectedOrder.customerPhone || 'Not provided'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment & Shipping Card */}
              <div className="bg-surface-theme p-5 rounded-2xl border border-theme-main space-y-3 text-xs">
                <div className="font-bold text-theme-heading flex items-center gap-2 border-b border-theme-subtle pb-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Payment & Delivery Destination</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Payment Method:</span>
                    <span className="text-theme-heading font-semibold">{selectedOrder.paymentMethod || 'Credit Card'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-theme-muted">Delivery Address:</span>
                    <span className="text-theme-heading font-semibold text-right max-w-[200px] flex items-start gap-1 justify-end">
                      <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span>{selectedOrder.shippingAddress}</span>
                    </span>
                  </div>
                  {selectedOrder.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Delivered Date:</span>
                      <span className="text-emerald-400 font-semibold">{selectedOrder.deliveryDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Order Items ({selectedOrder.items?.length || 0})</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-surface-theme p-4 rounded-2xl border border-theme-main flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-16 object-cover rounded-xl border border-theme-subtle bg-black/20"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {item.brand || 'Fashion Studio'}
                        </span>
                        <h4 className="font-bold text-xs text-theme-heading">{item.title}</h4>
                        <div className="text-[11px] text-theme-muted">
                          Size: <span className="text-theme-heading font-semibold">{item.size}</span>
                          {item.color && (
                            <span> • Color: <span className="text-theme-heading font-semibold">{item.color}</span></span>
                          )}
                        </div>
                        {item.sku && (
                          <div className="text-[10px] font-mono text-amber-300">SKU: {item.sku}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="font-mono font-bold text-sm text-amber-300">
                        {selectedOrder.currency || '$'}{item.price * item.quantity}
                      </div>
                      <div className="text-[10px] text-theme-muted">
                        ${item.price} × {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Fulfillment Update Form */}
            <form
              onSubmit={handleSaveOrderStatus}
              className="bg-surface-theme p-5 rounded-2xl border border-amber-500/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-theme-heading flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-amber-400" />
                  <span>Update Fulfillment & Status in PostgreSQL</span>
                </div>
                <span className="text-[10px] text-theme-muted uppercase tracking-wider">Admin Authorized</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Carrier Tracking Number</span>
                  </label>
                  <input
                    type="text"
                    value={editTracking}
                    onChange={(e) => setEditTracking(e.target.value)}
                    placeholder="e.g. TRK-948201948"
                    className="w-full px-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Change Order Status</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                    className="w-full px-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading font-semibold focus:outline-none focus:border-amber-400"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-slate-100">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{updating ? 'Saving to Database...' : 'Save & Sync Status'}</span>
                </button>
              </div>
            </form>

            {/* Modal Footer / Grand Total */}
            <div className="flex items-center justify-between pt-2 border-t border-theme-main">
              <div>
                <span className="text-xs text-theme-muted">Order Grand Total:</span>
                <span className="text-2xl font-bold font-mono text-amber-300 ml-2">
                  {selectedOrder.currency || '$'}{selectedOrder.totalAmount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
