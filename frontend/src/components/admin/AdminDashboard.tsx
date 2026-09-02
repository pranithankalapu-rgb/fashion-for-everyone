import React, { useState, useEffect } from 'react';
import type {
  AdminDashboardOverview,
} from '../../types/fashion';
import { api } from '../../services/api';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Award,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Activity,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab?: (tab: 'dashboard' | 'products' | 'orders' | 'users' | 'retailers' | 'designers') => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminDashboardOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to fetch admin executive overview:', err);
      setError(err.message || 'Failed to aggregate live metrics from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const navigateTo = (tab: 'dashboard' | 'products' | 'orders' | 'users' | 'retailers' | 'designers') => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      window.location.hash = `/admin/${tab}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Executive Operations Dashboard
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                  Live PostgreSQL Sync
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Real-time multi-tenant platform analytics, aggregated KPIs, and pending approval workflows.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span className="text-xs font-medium">Refresh Overview</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOverview}
            className="px-2.5 py-1 bg-rose-900/50 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !overview ? (
        <div className="p-16 text-center bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Aggregating PostgreSQL Business Metrics...</h3>
          <p className="text-xs text-slate-400 mt-1">Executing Prisma aggregations across Users, Orders, Retailers, and Designers.</p>
        </div>
      ) : overview ? (
        <>
          {/* Global Pending Action Banner (If items need approval) */}
          {overview.summary.pendingApprovalsTotal > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-amber-950/30 border border-amber-500/40 backdrop-blur-md relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                      <span>Action Required: {overview.summary.pendingApprovalsTotal} Pending Applications & Submissions</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {overview.pendingBreakdown.retailers} Store Applications,{' '}
                      {overview.pendingBreakdown.designs} Design Submissions,{' '}
                      {overview.pendingBreakdown.designers} Designer Badges,{' '}
                      {overview.pendingBreakdown.users} User Role Upgrades awaiting administrative review.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {overview.pendingBreakdown.retailers > 0 && (
                    <button
                      onClick={() => navigateTo('retailers')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Review Stores ({overview.pendingBreakdown.retailers})</span>
                    </button>
                  )}
                  {overview.pendingBreakdown.designs > 0 && (
                    <button
                      onClick={() => navigateTo('designers')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Review Designs ({overview.pendingBreakdown.designs})</span>
                    </button>
                  )}
                  {overview.pendingBreakdown.users > 0 && (
                    <button
                      onClick={() => navigateTo('users')}
                      className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Review Roles ({overview.pendingBreakdown.users})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Primary KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Platform GMV</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white">${overview.summary.totalRevenue.toLocaleString()}</span>
                <span className="text-xs text-emerald-400 font-medium">USD</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>Avg Order: ${overview.summary.avgOrderValue}</span>
                <span className="text-emerald-400 font-medium">{overview.orderStatusBreakdown.delivered} delivered</span>
              </div>
            </div>

            {/* Total Orders */}
            <div
              onClick={() => navigateTo('orders')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md relative overflow-hidden cursor-pointer group hover:border-sky-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Customer Orders</span>
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white">{overview.summary.totalOrders}</span>
                <span className="text-xs text-slate-400">orders in DB</span>
              </div>
              <div className="mt-2 text-xs text-sky-400 flex items-center justify-between font-medium">
                <span>{overview.orderStatusBreakdown.pending} pending fulfillment</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Total Platform Users */}
            <div
              onClick={() => navigateTo('users')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md relative overflow-hidden cursor-pointer group hover:border-purple-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">User Accounts</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white">{overview.summary.totalUsers}</span>
                <span className="text-xs text-purple-400">{overview.summary.activeUsers} Active</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>{overview.roleBreakdown.customer} Cust • {overview.roleBreakdown.designer} Des • {overview.roleBreakdown.retailer} Ret</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-purple-400" />
              </div>
            </div>

            {/* Product Catalog & Stock */}
            <div
              onClick={() => navigateTo('products')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md relative overflow-hidden cursor-pointer group hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Product SKUs</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white">{overview.summary.totalProducts}</span>
                <span className="text-xs text-slate-400">catalog items</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span className={overview.summary.lowStockProducts > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                  {overview.summary.lowStockProducts} low stock alerts
                </span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-amber-400" />
              </div>
            </div>
          </div>

          {/* Platform Pillar Operations Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Retailer Pillar */}
            <div
              onClick={() => navigateTo('retailers')}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer backdrop-blur-md space-y-3 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Retailer Stores</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Approved Flagships</span>
                  <span className="font-bold text-emerald-400">{overview.summary.approvedRetailers}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Pending Applications</span>
                  <span className={`font-semibold ${overview.pendingBreakdown.retailers > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    {overview.pendingBreakdown.retailers}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Total Store Records</span>
                  <span className="text-white font-medium">{overview.summary.totalRetailers}</span>
                </div>
              </div>
            </div>

            {/* Designer Guild Pillar */}
            <div
              onClick={() => navigateTo('designers')}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 cursor-pointer backdrop-blur-md space-y-3 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Designer Guild</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Verified Designers</span>
                  <span className="font-bold text-purple-400">{overview.summary.verifiedDesigners}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Runway Pieces</span>
                  <span className="text-white font-medium">{overview.summary.totalDesigns}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Pending Submissions</span>
                  <span className={`font-semibold ${overview.pendingBreakdown.designs > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    {overview.pendingBreakdown.designs}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Community Pillar */}
            <div
              onClick={() => navigateTo('users')}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 cursor-pointer backdrop-blur-md space-y-3 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">User Base</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Active Customers</span>
                  <span className="font-bold text-sky-400">{overview.roleBreakdown.customer}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Role Upgrade Requests</span>
                  <span className={`font-semibold ${overview.pendingBreakdown.users > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    {overview.pendingBreakdown.users}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Active User Ratio</span>
                  <span className="text-emerald-400 font-semibold">
                    {Math.round((overview.summary.activeUsers / Math.max(overview.summary.totalUsers, 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Order Fulfillment Pillar */}
            <div
              onClick={() => navigateTo('orders')}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer backdrop-blur-md space-y-3 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Order Pipeline</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Pending Fulfillment</span>
                  <span className="font-bold text-amber-400">{overview.orderStatusBreakdown.pending}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>In Processing / Shipped</span>
                  <span className="text-sky-400 font-medium">
                    {overview.orderStatusBreakdown.processing + overview.orderStatusBreakdown.shipped}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Delivered / Completed</span>
                  <span className="text-emerald-400 font-medium">{overview.orderStatusBreakdown.delivered}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Live PostgreSQL Activity Feed & Pending Approval Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Pending Approval Quick Queue */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Pending Approvals Queue
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  {overview.pendingQueue.length} Action Items
                </span>
              </div>

              {overview.pendingQueue.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-white block">All Approvals Cleared!</span>
                  <span className="text-[11px] text-slate-400">No pending store applications or design submissions.</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {overview.pendingQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            item.category === 'retailer'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.category === 'design'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : item.category === 'designer'
                              ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          {item.category === 'retailer' ? (
                            <Store className="w-4 h-4" />
                          ) : item.category === 'design' ? (
                            <Layers className="w-4 h-4" />
                          ) : item.category === 'designer' ? (
                            <Award className="w-4 h-4" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-white block truncate max-w-[200px]">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigateTo(item.linkTab as any)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-all"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Live PostgreSQL Activity Feed */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Platform Audit Feed
                </h3>
                <span className="text-xs text-slate-500 font-mono">Real-time DB Events</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {overview.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          act.badgeColor === 'emerald'
                            ? 'bg-emerald-400'
                            : act.badgeColor === 'amber'
                            ? 'bg-amber-400'
                            : act.badgeColor === 'purple'
                            ? 'bg-purple-400'
                            : 'bg-sky-400'
                        }`}
                      />
                      <div>
                        <span className="text-xs font-semibold text-white block">{act.title}</span>
                        <span className="text-[11px] text-slate-400 block">{act.subtitle}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">
                        {act.timestamp.includes('T')
                          ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : act.timestamp}
                      </span>
                      {act.status && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                            act.status === 'Delivered' || act.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : act.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {act.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders Preview Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                Latest Platform Orders
              </h3>
              <button
                onClick={() => navigateTo('orders')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {overview.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-white">{ord.orderNumber}</td>
                      <td className="py-2.5 px-4">{ord.customerName || 'Customer'}</td>
                      <td className="py-2.5 px-4 text-slate-400">{ord.date}</td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-400">${ord.totalAmount}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ord.status === 'Shipped'
                              ? 'bg-sky-500/20 text-sky-300'
                              : ord.status === 'Processing'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => navigateTo('orders')}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
