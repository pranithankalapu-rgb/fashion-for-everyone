import React, { useState, useEffect, useCallback } from 'react';
import type {
  AdminRetailer,
  AdminRetailerStats,
} from '../../types/fashion';
import { api } from '../../services/api';
import {
  Store,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
  UserPlus,
  AlertCircle,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  X,
  Check,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

const REJECTION_PRESETS = [
  'Retail resale tax permit could not be verified with the state authority.',
  'Missing commercial general liability insurance documentation.',
  'Physical storefront verification failed or address does not match business registration.',
  'Store portfolio does not meet platform luxury brand alignment requirements.',
  'Incomplete business banking and identity verification records.',
];

export const AdminRetailers: React.FC = () => {
  const [retailers, setRetailers] = useState<AdminRetailer[]>([]);
  const [stats, setStats] = useState<AdminRetailerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'createdAt' | 'storeName' | 'managerName' | 'approvalStatus' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedRetailer, setSelectedRetailer] = useState<AdminRetailer | null>(null);
  const [rejectionModalRetailer, setRejectionModalRetailer] = useState<AdminRetailer | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State for Add Retailer
  const [newStoreName, setNewStoreName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [newBusinessType, setNewBusinessType] = useState('Boutique Flagship');
  const [newApprovalStatus, setNewApprovalStatus] = useState<'Pending' | 'Approved'>('Approved');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRetailers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.getAdminRetailers({
        approvalStatus: activeTab !== 'All' ? activeTab : undefined,
        status: accountStatusFilter !== 'All' ? accountStatusFilter : undefined,
        search: searchQuery.trim() || undefined,
        sortBy,
        sortOrder,
      });

      setRetailers(res.retailers);
      setStats(res.stats);
    } catch (err: any) {
      console.error('Failed to fetch admin retailers:', err);
      setError(err.message || 'Failed to connect to backend server. Please verify PostgreSQL is running.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, accountStatusFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchRetailers();
  }, [fetchRetailers]);

  // Handle Approve
  const handleApprove = async (retailer: AdminRetailer) => {
    try {
      setActionLoading(retailer.id);
      const res = await api.updateAdminRetailerApproval(retailer.id, 'Approved');
      showToast('success', res.message || `Store ${retailer.storeName} approved successfully`);
      if (selectedRetailer?.id === retailer.id) {
        setSelectedRetailer(res.retailer);
      }
      await fetchRetailers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve retailer store');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async () => {
    if (!rejectionModalRetailer) return;
    if (!rejectionReason.trim()) {
      showToast('error', 'Please provide or select a rejection reason for platform audit compliance.');
      return;
    }

    try {
      setActionLoading(rejectionModalRetailer.id);
      const res = await api.updateAdminRetailerApproval(
        rejectionModalRetailer.id,
        'Rejected',
        rejectionReason.trim()
      );
      showToast('success', res.message || `Store ${rejectionModalRetailer.storeName} application rejected`);
      setRejectionModalRetailer(null);
      setRejectionReason('');
      if (selectedRetailer?.id === rejectionModalRetailer.id) {
        setSelectedRetailer(res.retailer);
      }
      await fetchRetailers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject retailer store application');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Status Update
  const handleStatusChange = async (retailer: AdminRetailer, newStatus: 'Active' | 'Inactive' | 'Suspended') => {
    try {
      setActionLoading(retailer.id);
      const res = await api.updateAdminRetailerStatus(retailer.id, newStatus);
      showToast('success', res.message || `Store status changed to ${newStatus}`);
      if (selectedRetailer?.id === retailer.id) {
        setSelectedRetailer(res.retailer);
      }
      await fetchRetailers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update store status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete
  const handleDelete = async (retailer: AdminRetailer) => {
    if (!window.confirm(`Are you sure you want to permanently delete store '${retailer.storeName}' from PostgreSQL?`)) {
      return;
    }

    try {
      setActionLoading(retailer.id);
      const res = await api.deleteAdminRetailer(retailer.id);
      showToast('success', res.message || `Store ${retailer.storeName} deleted`);
      if (selectedRetailer?.id === retailer.id) {
        setSelectedRetailer(null);
      }
      await fetchRetailers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete retailer store');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Create Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newManagerName.trim()) {
      showToast('error', 'Store name and manager name are required.');
      return;
    }

    try {
      setActionLoading('create');
      const res = await api.createAdminRetailer({
        storeName: newStoreName.trim(),
        managerName: newManagerName.trim(),
        managerEmail: newManagerEmail.trim() || 'retailer@store.com',
        managerPhone: newManagerPhone.trim() || '+1 (555) 000-0000',
        address: newAddress.trim() || 'Flagship Avenue',
        taxId: newTaxId.trim() || `TAX-${Date.now().toString().slice(-6)}`,
        businessType: newBusinessType.trim(),
        approvalStatus: newApprovalStatus,
        status: 'Active',
      });

      showToast('success', res.message || `Store ${newStoreName} created in PostgreSQL`);
      setIsAddModalOpen(false);
      // Reset form
      setNewStoreName('');
      setNewManagerName('');
      setNewManagerEmail('');
      setNewManagerPhone('');
      setNewAddress('');
      setNewTaxId('');
      await fetchRetailers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create retailer store');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Retailer Store Approvals
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                  PostgreSQL Verified
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Review retailer applications, verify tax credentials, and manage partner store locations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchRetailers()}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all disabled:opacity-50"
            title="Refresh from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="text-xs font-medium">Sync DB</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stores */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Retailer Stores</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{stats?.totalStores ?? 0}</span>
            <span className="text-xs text-slate-400">stores in DB</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <Package className="w-3 h-3 text-emerald-400" />
            <span>{stats?.totalStockLocations ?? 0} active stock depots</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setActiveTab('Pending')}
          className={`p-5 rounded-2xl border backdrop-blur-sm relative overflow-hidden cursor-pointer transition-all ${
            activeTab === 'Pending'
              ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Pending Approvals</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 relative">
              <Clock className="w-4 h-4" />
              {(stats?.pendingCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400">{stats?.pendingCount ?? 0}</span>
            <span className="text-xs text-amber-400/70">awaiting review</span>
          </div>
          <div className="mt-2 text-xs text-amber-400/80 font-medium flex items-center gap-1">
            <span>Requires administrative action</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Approved Retailers */}
        <div
          onClick={() => setActiveTab('Approved')}
          className={`p-5 rounded-2xl border backdrop-blur-sm relative overflow-hidden cursor-pointer transition-all ${
            activeTab === 'Approved'
              ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Approved Partners</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">{stats?.approvedCount ?? 0}</span>
            <span className="text-xs text-slate-400">verified</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400/70 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Active store catalog sync</span>
          </div>
        </div>

        {/* Active Account Status */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Operating Status</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-sky-400">{stats?.activeCount ?? 0}</span>
            <span className="text-xs text-slate-400">Active / {stats?.inactiveCount ?? 0} Inactive</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Rejected: {stats?.rejectedCount ?? 0} applications</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count =
                tab === 'All'
                  ? stats?.totalStores ?? 0
                  : tab === 'Pending'
                  ? stats?.pendingCount ?? 0
                  : tab === 'Approved'
                  ? stats?.approvedCount ?? 0
                  : stats?.rejectedCount ?? 0;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? tab === 'Pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : tab === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                        : tab === 'Rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                        : 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{tab === 'All' ? 'All Stores' : tab}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                      isActive ? 'bg-black/30' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Account Status Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Stores</option>
              <option value="Inactive">Inactive Stores</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('_');
                setSortBy(by as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="storeName_asc">Store Name (A-Z)</option>
              <option value="managerName_asc">Manager (A-Z)</option>
              <option value="approvalStatus_asc">Approval Status</option>
            </select>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search stores by name, manager, email, phone, tax ID, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchRetailers()}
            className="px-2.5 py-1 bg-rose-900/50 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table Content */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading retailer store records from PostgreSQL...</p>
          </div>
        ) : retailers.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No retailer store applications found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || activeTab !== 'All' || accountStatusFilter !== 'All'
                ? 'Try adjusting your search filters or clearing the active filter parameters.'
                : 'No store records have been registered in the PostgreSQL database yet.'}
            </p>
            {(searchQuery || activeTab !== 'All' || accountStatusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('All');
                  setAccountStatusFilter('All');
                }}
                className="mt-4 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-all"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Store & Business</th>
                  <th className="py-3.5 px-4">Manager & Contact</th>
                  <th className="py-3.5 px-4">Location & Tax ID</th>
                  <th className="py-3.5 px-4 text-center">Approval Status</th>
                  <th className="py-3.5 px-4 text-center">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {retailers.map((retailer) => {
                  const isActing = actionLoading === retailer.id;
                  const isPending = retailer.approvalStatus === 'Pending';
                  const isApproved = retailer.approvalStatus === 'Approved';

                  return (
                    <tr
                      key={retailer.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Store & Business */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={retailer.logoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=100&q=80'}
                            alt={retailer.storeName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700/60 bg-slate-800 shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-white block text-sm group-hover:text-emerald-300 transition-colors">
                              {retailer.storeName}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                                {retailer.businessType || 'Retail Store'}
                              </span>
                              <span>•</span>
                              <span>{retailer.storeStocksCount ?? 0} stock depots</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Manager & Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-200 block">{retailer.managerName}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {retailer.managerEmail}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {retailer.managerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Location & Tax ID */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={retailer.address}>
                              {retailer.address}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <FileText className="w-3 h-3 text-slate-500" />
                            {retailer.taxId}
                          </span>
                        </div>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        ) : (
                          <div className="inline-block" title={retailer.rejectionReason || 'Application rejected'}>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Account Status Selector */}
                      <td className="py-3 px-4 text-center">
                        <select
                          value={retailer.status}
                          disabled={isActing}
                          onChange={(e) => handleStatusChange(retailer, e.target.value as any)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium border focus:outline-none transition-all ${
                            retailer.status === 'Active'
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                              : retailer.status === 'Inactive'
                              ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Approve Button if Pending or Rejected */}
                          {retailer.approvalStatus !== 'Approved' && (
                            <button
                              onClick={() => handleApprove(retailer)}
                              disabled={isActing}
                              title="Approve Store Application"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Reject Button */}
                          {retailer.approvalStatus !== 'Rejected' && (
                            <button
                              onClick={() => {
                                setRejectionModalRetailer(retailer);
                                setRejectionReason(REJECTION_PRESETS[0]);
                              }}
                              disabled={isActing}
                              title="Reject Store Application with Rationale"
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}

                          {/* View Details Drawer */}
                          <button
                            onClick={() => setSelectedRetailer(retailer)}
                            title="View Store Details & Compliance"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(retailer)}
                            disabled={isActing}
                            title="Delete Store from PostgreSQL"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Retailer Store Details Modal */}
      {selectedRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedRetailer.logoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80'}
                  alt={selectedRetailer.storeName}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedRetailer.storeName}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        selectedRetailer.approvalStatus === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : selectedRetailer.approvalStatus === 'Pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {selectedRetailer.approvalStatus}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Store ID: <span className="font-mono text-slate-300">{selectedRetailer.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRetailer(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rejection Notice if rejected */}
            {selectedRetailer.approvalStatus === 'Rejected' && selectedRetailer.rejectionReason && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Rejection Rationale:</span>
                </div>
                <p className="pl-5 text-rose-300/90">{selectedRetailer.rejectionReason}</p>
              </div>
            )}

            {/* Business & Manager Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                  Store & Tax Credentials
                </span>
                <div>
                  <span className="text-slate-500 block">Business Category</span>
                  <span className="text-white font-medium">{selectedRetailer.businessType || 'Department Store'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tax Registration ID</span>
                  <span className="font-mono text-emerald-400 font-semibold">{selectedRetailer.taxId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Store Address</span>
                  <span className="text-slate-200">{selectedRetailer.address}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                  Manager & Support Contacts
                </span>
                <div>
                  <span className="text-slate-500 block">Store Manager</span>
                  <span className="text-white font-medium">{selectedRetailer.managerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Direct Email</span>
                  <span className="text-slate-300">{selectedRetailer.managerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phone</span>
                  <span className="text-slate-300">{selectedRetailer.managerPhone}</span>
                </div>
              </div>
            </div>

            {/* Store Operating Metrics */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                Inventory & Stock Configuration
              </span>
              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Stock Depots</span>
                  <span className="text-base font-bold text-white">{selectedRetailer.storeStocksCount ?? 0}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Low Stock Alert</span>
                  <span className="text-base font-bold text-amber-400">{selectedRetailer.lowStockThreshold} units</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Auto-Fulfill</span>
                  <span className="text-base font-bold text-emerald-400">
                    {selectedRetailer.autoFulfill ? 'Enabled' : 'Manual'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                Registered on: {new Date(selectedRetailer.createdAt).toLocaleDateString()}
              </span>

              <div className="flex items-center space-x-2">
                {selectedRetailer.approvalStatus !== 'Approved' && (
                  <button
                    onClick={() => handleApprove(selectedRetailer)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Application</span>
                  </button>
                )}

                {selectedRetailer.approvalStatus !== 'Rejected' && (
                  <button
                    onClick={() => {
                      setRejectionModalRetailer(selectedRetailer);
                      setRejectionReason(REJECTION_PRESETS[0]);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Application</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedRetailer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Rejection Reason Modal */}
      {rejectionModalRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Reject Store Application
              </h3>
              <button
                onClick={() => setRejectionModalRetailer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide compliance feedback for rejecting{' '}
              <strong className="text-white">{rejectionModalRetailer.storeName}</strong>. This decision will be persisted in PostgreSQL.
            </p>

            {/* Preset chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Compliance Reasons:
              </span>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`text-left text-xs p-2 rounded-lg border transition-all ${
                      rejectionReason === preset
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Custom Feedback / Actionable Reason:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify regulatory, tax, or documentation reasons..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalRetailer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading !== null}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Retailer Store Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                Register New Retailer Store
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bloomingdale's SoHo Flagship"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Manager Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Manager Email</label>
                  <input
                    type="email"
                    placeholder="manager@store.com"
                    value={newManagerEmail}
                    onChange={(e) => setNewManagerEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Manager Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={newManagerPhone}
                    onChange={(e) => setNewManagerPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tax ID / Permit</label>
                  <input
                    type="text"
                    placeholder="US-TAX-998811"
                    value={newTaxId}
                    onChange={(e) => setNewTaxId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Store Address</label>
                <input
                  type="text"
                  placeholder="504 Broadway, New York, NY 10012"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Business Type</label>
                  <select
                    value={newBusinessType}
                    onChange={(e) => setNewBusinessType(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Boutique Flagship">Boutique Flagship</option>
                    <option value="Department Store">Department Store</option>
                    <option value="Luxury Outlet">Luxury Outlet</option>
                    <option value="Independent Studio">Independent Studio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Approval Status</label>
                  <select
                    value={newApprovalStatus}
                    onChange={(e) => setNewApprovalStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  Save Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
