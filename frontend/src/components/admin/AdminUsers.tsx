import React, { useState, useEffect, useCallback } from 'react';
import type {
  AdminUser,
  AdminUserStats,
  UserApprovalStatus,
  UserAccountStatus,
  UserRole,
} from '../../types/fashion';
import { api } from '../../services/api';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Award,
  Store,
  User,
  UserPlus,
  AlertCircle,
  Trash2,
  Phone,
  Mail,
  Sparkles,
  X,
  Check,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

const ROLE_OPTIONS: { id: UserRole; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'customer', label: 'Customer', icon: User, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { id: 'designer', label: 'Designer', icon: Award, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'retailer', label: 'Retailer', icon: Store, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
];

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedApproval, setSelectedApproval] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'email' | 'role' | 'approvalStatus' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal / Drawer states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [userToReject, setUserToReject] = useState<AdminUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('customer');
  const [newApproval, setNewApproval] = useState<UserApprovalStatus>('Approved');
  const [newAccountStatus, setNewAccountStatus] = useState<UserAccountStatus>('Active');
  const [newPhone, setNewPhone] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newRequestedRole, setNewRequestedRole] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAdminUsers({
        role: selectedRole,
        approvalStatus: selectedApproval,
        status: selectedStatus,
        search: searchQuery,
        sortBy,
        sortOrder,
      });

      setUsers(response.users || []);
      setStats(response.stats || null);
    } catch (err: any) {
      console.error('Failed to load admin users:', err);
      setError(err.message || 'Failed to connect to PostgreSQL database.');
      showNotification('error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedApproval, selectedStatus, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // One-click or modal Approve
  const handleApprove = async (user: AdminUser, approvedRole?: UserRole) => {
    setUpdatingId(user.id);
    try {
      const targetRole = approvedRole || (user.requestedRole as UserRole) || user.role;
      const res = await api.updateAdminUserApproval(user.id, 'Approved', undefined, targetRole);

      showNotification('success', `User ${res.user.name} approved as ${res.user.role.toUpperCase()} in PostgreSQL.`);
      
      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      if (selectedUser?.id === res.user.id) setSelectedUser(res.user);

      // Refresh live KPI stats
      api.getAdminUserStats().then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to approve user');
    } finally {
      setUpdatingId(null);
    }
  };

  // Open reject modal
  const handleOpenRejectModal = (user: AdminUser) => {
    setUserToReject(user);
    setRejectionReason('Application does not meet platform verification standards.');
    setIsRejectModalOpen(true);
  };

  // Submit rejection
  const handleConfirmReject = async () => {
    if (!userToReject) return;
    setUpdatingId(userToReject.id);
    try {
      const res = await api.updateAdminUserApproval(userToReject.id, 'Rejected', rejectionReason);
      showNotification('success', `User ${res.user.name} registration / role rejected.`);

      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      if (selectedUser?.id === res.user.id) setSelectedUser(res.user);
      setIsRejectModalOpen(false);
      setUserToReject(null);

      api.getAdminUserStats().then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reject user');
    } finally {
      setUpdatingId(null);
    }
  };

  // Change Role directly
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      const res = await api.updateAdminUserRole(userId, newRole);
      showNotification('success', `User ${res.user.name} role updated to ${newRole.toUpperCase()} in PostgreSQL.`);

      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      if (selectedUser?.id === res.user.id) setSelectedUser(res.user);

      api.getAdminUserStats().then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to change user role');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle or change status
  const handleUpdateStatus = async (userId: string, newStatus: UserAccountStatus) => {
    setUpdatingId(userId);
    try {
      const res = await api.updateAdminUserStatus(userId, newStatus);
      showNotification('success', `User status updated to ${newStatus}.`);

      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      if (selectedUser?.id === res.user.id) setSelectedUser(res.user);

      api.getAdminUserStats().then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete user
  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email || user.id}) from PostgreSQL?`)) {
      return;
    }

    setUpdatingId(user.id);
    try {
      await api.deleteAdminUser(user.id);
      showNotification('success', `User ${user.name} deleted from PostgreSQL.`);

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
        setIsDetailModalOpen(false);
      }

      api.getAdminUserStats().then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete user');
    } finally {
      setUpdatingId(null);
    }
  };

  // Create new user submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const res = await api.createAdminUser({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        role: newRole,
        approvalStatus: newApproval,
        status: newAccountStatus,
        phone: newPhone.trim() || undefined,
        bio: newBio.trim() || undefined,
        requestedRole: newRequestedRole.trim() || undefined,
      });

      showNotification('success', `User "${res.user.name}" created successfully in PostgreSQL.`);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewBio('');
      setNewRequestedRole('');

      // Reload
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  // Open user details modal
  const handleOpenDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md animate-slideUp ${
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
          <button
            onClick={() => setNotification(null)}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg text-theme-muted hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner / Title Header */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Governance & RBAC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Admin User & Role Approvals
          </h1>
          <p className="text-xs text-theme-muted leading-relaxed">
            Manage all registered platform accounts, evaluate designer and retailer credential approval requests, and enforce role-based access control persisted in PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Users from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="glass-panel rounded-2xl p-5 border border-theme-main space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted">Total Accounts</span>
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-theme-heading">
            {stats ? stats.totalUsers : users.length}
          </div>
          <div className="text-[11px] text-theme-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>PostgreSQL live records</span>
          </div>
        </div>

        {/* Pending Approvals (Urgent) */}
        <div
          onClick={() => {
            setSelectedApproval('Pending');
            setSelectedRole('All');
          }}
          className={`glass-panel rounded-2xl p-5 border transition-all cursor-pointer space-y-2 ${
            selectedApproval === 'Pending'
              ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
              : 'border-theme-main hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-amber-300">
            {stats ? stats.pendingApprovals : users.filter((u) => u.approvalStatus === 'Pending').length}
          </div>
          <div className="text-[11px] text-amber-400/80 font-medium flex items-center gap-1">
            <span>Click to filter pending</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Approved Users */}
        <div className="glass-panel rounded-2xl p-5 border border-theme-main space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted">Approved Active</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-400">
            {stats ? stats.approvedCount : users.filter((u) => u.approvalStatus === 'Approved').length}
          </div>
          <div className="text-[11px] text-theme-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Verified credentials</span>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="glass-panel rounded-2xl p-5 border border-theme-main space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted">Role Distribution</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-bold">
              {stats?.roleCounts.customer ?? 0} Customers
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
              {stats?.roleCounts.designer ?? 0} Designers
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              {stats?.roleCounts.retailer ?? 0} Retailers
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-theme-main space-y-4">
        {/* Quick Tab Filter for Roles / Approvals */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 border-b border-theme-main/60">
          <button
            onClick={() => {
              setSelectedApproval('All');
              setSelectedRole('All');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedApproval === 'All' && selectedRole === 'All'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            All Users ({stats?.totalUsers ?? users.length})
          </button>

          <button
            onClick={() => {
              setSelectedApproval('Pending');
              setSelectedRole('All');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedApproval === 'Pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            {(stats?.pendingApprovals ?? 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-900 text-amber-200 text-[10px]">
                {stats?.pendingApprovals}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setSelectedRole('designer');
              setSelectedApproval('All');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedRole === 'designer'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-purple-400 hover:bg-purple-500/10'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Designers ({stats?.roleCounts.designer ?? 0})</span>
          </button>

          <button
            onClick={() => {
              setSelectedRole('retailer');
              setSelectedApproval('All');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedRole === 'retailer'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Retailers ({stats?.roleCounts.retailer ?? 0})</span>
          </button>

          <button
            onClick={() => {
              setSelectedRole('customer');
              setSelectedApproval('All');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedRole === 'customer'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-sky-400 hover:bg-sky-500/10'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customers ({stats?.roleCounts.customer ?? 0})</span>
          </button>
        </div>

        {/* Search & Fine Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, role, phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 transition-all placeholder:text-theme-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Approval Filter */}
            <select
              value={selectedApproval}
              onChange={(e) => setSelectedApproval(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-secondary focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
            >
              <option value="All">All Approvals</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>

            {/* Account Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-secondary focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* Sort Order */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [any, any];
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-secondary focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="role-asc">Role (A-Z)</option>
              <option value="approvalStatus-asc">Approval Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-rose-500/5 text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-300">Database Connection Issue</h3>
          <p className="text-xs text-theme-muted max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold"
          >
            Retry PostgreSQL Connection
          </button>
        </div>
      )}

      {/* Main Users Table */}
      <div className="glass-panel rounded-3xl border border-theme-main overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-amber-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="text-xs font-semibold text-theme-muted">
              Querying live users from PostgreSQL database...
            </span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-serif font-bold text-theme-heading">No matching users found</h3>
            <p className="text-xs text-theme-muted max-w-md mx-auto">
              No PostgreSQL user records match your search or filter criteria. Try clearing filters or adding a new user.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('All');
                setSelectedApproval('All');
                setSelectedStatus('All');
              }}
              className="px-4 py-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading text-xs font-bold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-modal-theme/60 text-theme-muted border-b border-theme-main uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">User</th>
                  <th className="py-3.5 px-4 font-bold">Current Role</th>
                  <th className="py-3.5 px-4 font-bold">Approval Status</th>
                  <th className="py-3.5 px-4 font-bold">Account Status</th>
                  <th className="py-3.5 px-4 font-bold">Registered</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-main">
                {users.map((user) => {
                  const isUpdating = updatingId === user.id;
                  const isPending = user.approvalStatus === 'Pending';
                  const roleConfig = ROLE_OPTIONS.find((r) => r.id === user.role) || ROLE_OPTIONS[0];
                  const RoleIcon = roleConfig.icon;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-surface-subtle-theme/60 transition-colors ${
                        isPending ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                            alt={user.name}
                            className="w-10 h-10 rounded-2xl object-cover border border-theme-main flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-theme-heading flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.completedOnboarding && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Onboarded" />
                              )}
                            </div>
                            <div className="text-[11px] text-theme-muted flex items-center gap-1">
                              <Mail className="w-3 h-3 text-theme-muted" />
                              <span>{user.email || 'No email provided'}</span>
                            </div>
                            {user.phone && (
                              <div className="text-[10px] text-theme-muted flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-theme-muted" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold capitalize ${roleConfig.color}`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>{user.role}</span>
                          </span>

                          {user.requestedRole && user.requestedRole !== user.role && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold animate-pulse">
                              <Sparkles className="w-3 h-3" />
                              <span>Requesting: {user.requestedRole}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {user.approvalStatus === 'Pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending Review</span>
                            </span>
                          ) : user.approvalStatus === 'Approved' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                          )}

                          {user.rejectionReason && user.approvalStatus === 'Rejected' && (
                            <p className="text-[10px] text-rose-300/80 line-clamp-1" title={user.rejectionReason}>
                              Note: {user.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={user.status}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(user.id, e.target.value as UserAccountStatus)}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold focus:outline-none transition-all cursor-pointer ${
                            user.status === 'Active'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : user.status === 'Inactive'
                              ? 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          <option value="Active" className="bg-slate-900 text-emerald-400">Active</option>
                          <option value="Inactive" className="bg-slate-900 text-slate-400">Inactive</option>
                          <option value="Suspended" className="bg-slate-900 text-rose-400">Suspended</option>
                        </select>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-theme-muted text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If pending, show Approve & Reject buttons */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(user)}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                title="Approve user registration / requested role"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Approve</span>
                              </button>

                              <button
                                onClick={() => handleOpenRejectModal(user)}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                title="Reject user application"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Reject</span>
                              </button>
                            </>
                          )}

                          {/* Change Role Quick Selector */}
                          <select
                            value={user.role}
                            disabled={isUpdating}
                            onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                            className="px-2 py-1 rounded-xl bg-surface-theme border border-theme-main text-[11px] text-theme-secondary hover:text-theme-heading focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                            title="Change Role"
                          >
                            <option value="customer" className="bg-slate-900">Role: Customer</option>
                            <option value="designer" className="bg-slate-900">Role: Designer</option>
                            <option value="retailer" className="bg-slate-900">Role: Retailer</option>
                            <option value="admin" className="bg-slate-900">Role: Admin</option>
                          </select>

                          {/* View Full Profile Details */}
                          <button
                            onClick={() => handleOpenDetails(user)}
                            className="p-1.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-muted hover:text-amber-400 transition-all cursor-pointer"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isUpdating}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all cursor-pointer disabled:opacity-50"
                            title="Delete User from PostgreSQL"
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

      {/* Modal: User Details & Approval Drawer */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <img
                src={selectedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={selectedUser.name}
                className="w-16 h-16 rounded-2xl object-cover border border-amber-500/30 shadow-lg"
              />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-serif font-bold text-theme-heading">{selectedUser.name}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                      selectedUser.role === 'designer'
                        ? 'text-purple-300 bg-purple-500/20 border-purple-500/40'
                        : selectedUser.role === 'retailer'
                        ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                        : selectedUser.role === 'admin'
                        ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                        : 'text-sky-300 bg-sky-500/20 border-sky-500/40'
                    }`}
                  >
                    {selectedUser.role}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                      selectedUser.approvalStatus === 'Approved'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : selectedUser.approvalStatus === 'Pending'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    {selectedUser.approvalStatus}
                  </span>
                </div>

                <p className="text-xs text-theme-muted">{selectedUser.email || 'No email specified'}</p>
                {selectedUser.phone && <p className="text-xs text-theme-muted">Phone: {selectedUser.phone}</p>}
                {selectedUser.bio && <p className="text-xs text-theme-secondary italic mt-1">"{selectedUser.bio}"</p>}
              </div>
            </div>

            {/* Role & Approval Evaluation Card */}
            <div className="p-4 rounded-2xl bg-surface-theme border border-theme-main space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-theme-heading flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Role & Access Evaluation</span>
                </span>
                {selectedUser.requestedRole && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    Requested Role: {selectedUser.requestedRole.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-theme-muted">Change Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => handleChangeRole(selectedUser.id, e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="customer">Customer</option>
                    <option value="designer">Designer (Showcase & Merits)</option>
                    <option value="retailer">Retailer (Inventory & Stores)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-theme-muted">Account Status</label>
                  <select
                    value={selectedUser.status}
                    onChange={(e) => handleUpdateStatus(selectedUser.id, e.target.value as UserAccountStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {selectedUser.approvalStatus === 'Pending' && (
                <div className="flex items-center gap-3 pt-3 border-t border-theme-main">
                  <button
                    onClick={() => handleApprove(selectedUser)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve User & Grant {selectedUser.requestedRole?.toUpperCase() || selectedUser.role.toUpperCase()}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleOpenRejectModal(selectedUser);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Styling & Physical Profile Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Styling Engine & Demographic Attributes</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-surface-theme border border-theme-main">
                  <span className="text-[10px] text-theme-muted block">Skin Tone</span>
                  <span className="font-bold text-theme-heading">{selectedUser.skinTone || 'Warm Golden'}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-theme border border-theme-main">
                  <span className="text-[10px] text-theme-muted block">Undertone</span>
                  <span className="font-bold text-theme-heading">{selectedUser.undertone || 'Warm'}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-theme border border-theme-main">
                  <span className="text-[10px] text-theme-muted block">Hair Color</span>
                  <span className="font-bold text-theme-heading">{selectedUser.hairColor || 'Brown'}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-theme border border-theme-main">
                  <span className="text-[10px] text-theme-muted block">Body Shape</span>
                  <span className="font-bold text-theme-heading">{selectedUser.bodyShape || 'Hourglass'}</span>
                </div>
              </div>

              {selectedUser.measurements && (
                <div className="p-3 rounded-xl bg-surface-theme border border-theme-main text-xs space-y-1">
                  <span className="text-[10px] font-semibold text-theme-muted block">Measurements:</span>
                  <div className="flex gap-4 text-theme-heading font-mono text-[11px]">
                    <span>Height: {selectedUser.measurements.heightCm || 170} cm</span>
                    <span>Chest: {selectedUser.measurements.chestCm || 88} cm</span>
                    <span>Waist: {selectedUser.measurements.waistCm || 68} cm</span>
                    <span>Hips: {selectedUser.measurements.hipsCm || 94} cm</span>
                  </div>
                </div>
              )}

              {selectedUser.styleVibes && selectedUser.styleVibes.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-theme-muted">Style Vibes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.styleVibes.map((vibe, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-modal-theme border border-theme-main text-[11px] text-theme-heading">
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="pt-4 border-t border-theme-main/60 flex items-center justify-between text-[11px] text-theme-muted">
              <span>Database ID: <code className="text-amber-300 font-mono text-[10px]">{selectedUser.id}</code></span>
              <span>Registered: {new Date(selectedUser.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason */}
      {isRejectModalOpen && userToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-heading">Reject Application</h3>
                <p className="text-xs text-theme-muted">User: {userToReject.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-theme-secondary">Specify Rejection Rationale</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain reason for rejection..."
                className="w-full p-3 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-rose-400 transition-all"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Portfolio did not meet minimum criteria',
                  'Business license verification incomplete',
                  'Insufficient design samples provided',
                ].map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-muted hover:text-white"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setUserToReject(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-muted text-xs font-bold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-theme-heading">Add New User</h3>
                <p className="text-xs text-theme-muted">Persist new user account directly in PostgreSQL</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Initial Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="customer">Customer</option>
                    <option value="designer">Designer</option>
                    <option value="retailer">Retailer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Approval Status</label>
                  <select
                    value={newApproval}
                    onChange={(e) => setNewApproval(e.target.value as UserApprovalStatus)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Account Status</label>
                  <select
                    value={newAccountStatus}
                    onChange={(e) => setNewAccountStatus(e.target.value as UserAccountStatus)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Bio / Designer Note</label>
                <textarea
                  rows={2}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Short background note..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme-main/60">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-muted text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to PostgreSQL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
