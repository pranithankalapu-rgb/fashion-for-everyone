import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  Clock,
  Plus,
  Boxes,
  Tag,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Truck,
  RotateCcw,
} from 'lucide-react';
import type { CustomerOrder, RetailProduct } from '../../types/fashion';

interface RetailerDashboardProps {
  orders: CustomerOrder[];
  products: RetailProduct[];
  onNavigate: (tab: string) => void;
  onOpenAddProduct?: () => void;
  onOpenCreatePromo?: () => void;
}

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({
  orders,
  products,
  onNavigate,
  onOpenAddProduct,
  onOpenCreatePromo,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '1y'>('30d');

  // Business calculations
  const totalSales = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0);
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing');
  const lowStockProducts = products.filter((p) => (p.stockQuantity !== undefined ? p.stockQuantity <= 5 : p.status === 'Low Stock'));
  const totalCustomersCount = 128; // Active client accounts

  // Mock revenue chart data points based on period
  const chartData = {
    '7d': [
      { label: 'Mon', revenue: 1240 },
      { label: 'Tue', revenue: 1890 },
      { label: 'Wed', revenue: 2100 },
      { label: 'Thu', revenue: 1650 },
      { label: 'Fri', revenue: 2840 },
      { label: 'Sat', revenue: 3450 },
      { label: 'Sun', revenue: 2980 },
    ],
    '30d': [
      { label: 'Wk 1', revenue: 8400 },
      { label: 'Wk 2', revenue: 11200 },
      { label: 'Wk 3', revenue: 9800 },
      { label: 'Wk 4', revenue: 14500 },
    ],
    '1y': [
      { label: 'Q1', revenue: 32000 },
      { label: 'Q2', revenue: 41500 },
      { label: 'Q3', revenue: 38900 },
      { label: 'Q4', revenue: 54200 },
    ],
  }[chartPeriod];

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Retail Operations Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
              Store Dashboard
            </h1>
            <p className="text-xs text-theme-muted mt-1">
              Real-time snapshot of sales performance, inventory alerts, and recent customer orders.
            </p>
          </div>

          {/* Quick Actions Header Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onNavigate('retailer-products');
                onOpenAddProduct?.();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
            <button
              onClick={() => onNavigate('retailer-inventory')}
              className="px-3.5 py-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Manage Inventory</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (6 Main Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Sales */}
        <div className="glass-card rounded-2xl p-4 space-y-2 border border-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-theme-heading font-mono">${totalSales.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.2% vs last month</span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="glass-card rounded-2xl p-4 space-y-2 border border-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-theme-heading font-mono">{totalOrdersCount}</div>
          <div className="flex items-center gap-1 text-[10px] text-purple-400 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+8.4% fulfillment rate</span>
          </div>
        </div>

        {/* KPI 3: Total Products */}
        <div className="glass-card rounded-2xl p-4 space-y-2 border border-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Products</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-theme-heading font-mono">{products.length}</div>
          <div className="text-[10px] text-theme-muted">Active in store catalog</div>
        </div>

        {/* KPI 4: Total Customers */}
        <div className="glass-card rounded-2xl p-4 space-y-2 border border-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Customers</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-theme-heading font-mono">{totalCustomersCount}</div>
          <div className="text-[10px] text-rose-400 font-semibold">+12 new this week</div>
        </div>

        {/* KPI 5: Low Stock Products */}
        <div className="glass-card rounded-2xl p-4 space-y-2 border border-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Low Stock</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">{lowStockProducts.length} Items</div>
          <button
            onClick={() => onNavigate('retailer-inventory')}
            className="text-[10px] text-amber-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>Review inventory</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* KPI 6: Pending Orders */}
        <div className="glass-card rounded-2xl p-4 space-y-2 border border-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-400 font-mono">{pendingOrders.length} Orders</div>
          <button
            onClick={() => onNavigate('retailer-orders')}
            className="text-[10px] text-indigo-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>Process orders</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Action Hub & Revenue Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Overview Chart (Left 8 Cols) */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 space-y-6 border border-theme-main">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-subtle pb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-theme-heading flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Sales & Revenue Overview</span>
              </h2>
              <p className="text-xs text-theme-muted">Gross store earnings across selected timeframe</p>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 p-1 bg-surface-theme rounded-xl border border-theme-main text-xs">
              {(['7d', '30d', '1y'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    chartPeriod === p
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                      : 'text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '1 Year'}
                </button>
              ))}
            </div>
          </div>

          {/* Bar / Trend Chart Representation */}
          <div className="h-56 flex items-end justify-between gap-4 pt-6 px-2">
            {chartData.map((d, index) => {
              const heightPercent = Math.round((d.revenue / maxRevenue) * 100);
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${d.revenue.toLocaleString()}
                  </div>
                  <div className="w-full max-w-[48px] bg-surface-theme rounded-t-xl overflow-hidden h-full flex items-end border border-theme-subtle p-0.5">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 via-teal-500 to-amber-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-theme-muted group-hover:text-theme-heading transition-colors">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Panel & Store Status (Right 4 Cols) */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 space-y-4 border border-theme-main flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-theme-heading mb-1">Quick Actions</h2>
            <p className="text-xs text-theme-muted mb-4">Fast shortcuts for daily business workflows</p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onNavigate('retailer-products');
                  onOpenAddProduct?.();
                }}
                className="w-full p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-heading">Add New Product</div>
                    <div className="text-[10px] text-theme-muted">Upload images, set prices & stock</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('retailer-inventory')}
                className="w-full p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-heading">Manage Inventory</div>
                    <div className="text-[10px] text-theme-muted">Update stock counts & SKUs</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('retailer-orders')}
                className="w-full p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-heading">View All Orders</div>
                    <div className="text-[10px] text-theme-muted">Track pending & shipped packages</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onNavigate('retailer-promotions');
                  onOpenCreatePromo?.();
                }}
                className="w-full p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-heading">Create Promotion</div>
                    <div className="text-[10px] text-theme-muted">Setup coupons & sales campaigns</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-theme-subtle flex items-center justify-between text-xs text-theme-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Store Status: Online</span>
            </span>
            <span className="font-mono text-[10px]">Nordstrom Partner</span>
          </div>
        </div>

      </div>

      {/* Bottom Grid: Recent Orders & Best-Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 space-y-4 border border-theme-main">
          <div className="flex items-center justify-between pb-3 border-b border-theme-subtle">
            <div>
              <h2 className="text-base font-serif font-bold text-theme-heading">Recent Orders</h2>
              <p className="text-xs text-theme-muted">Latest customer purchases requiring fulfillment</p>
            </div>
            <button
              onClick={() => onNavigate('retailer-orders')}
              className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {orders.slice(0, 4).map((order) => {
              const firstItem = order.items[0];
              return (
                <div
                  key={order.id}
                  onClick={() => onNavigate('retailer-orders')}
                  className="p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={firstItem?.imageUrl}
                      alt={firstItem?.title}
                      className="w-10 h-12 object-cover rounded-xl border border-theme-subtle flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-theme-heading group-hover:text-amber-400 transition-colors truncate">
                        {order.orderNumber} • {order.customerName || 'Customer'}
                      </div>
                      <div className="text-[10px] text-theme-muted truncate">
                        {firstItem?.title} (Qty: {firstItem?.quantity})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold font-mono text-amber-300">
                      {order.currency}{order.totalAmount}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : order.status === 'Shipped'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : order.status === 'Pending'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : order.status === 'Cancelled'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      }`}
                    >
                      {order.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                      {order.status === 'Shipped' && <Truck className="w-3 h-3" />}
                      {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {order.status === 'Returned' && <RotateCcw className="w-3 h-3" />}
                      <span>{order.status}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best-Selling Products (Right 5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 space-y-4 border border-theme-main">
          <div className="flex items-center justify-between pb-3 border-b border-theme-subtle">
            <div>
              <h2 className="text-base font-serif font-bold text-theme-heading">Best-Selling Products</h2>
              <p className="text-xs text-theme-muted">Top catalog performers by volume</p>
            </div>
            <button
              onClick={() => onNavigate('retailer-products')}
              className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {products.slice(0, 3).map((prod) => (
              <div key={prod.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface-theme border border-theme-main">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={prod.imageUrl} alt={prod.title} className="w-10 h-12 object-cover rounded-xl border border-theme-subtle flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-theme-heading truncate">{prod.title}</div>
                    <div className="text-[10px] text-theme-muted">{prod.brand} • {prod.category}</div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-amber-400 font-mono">${prod.price}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">Stock: {prod.stockQuantity ?? 12}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
