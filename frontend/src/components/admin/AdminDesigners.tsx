import React, { useState, useEffect, useCallback } from 'react';
import type {
  AdminDesigner,
  AdminDesignSubmission,
  AdminDesignerStats,
} from '../../types/fashion';
import { api } from '../../services/api';
import {
  Award,
  Sparkles,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Palette,
  AlertCircle,
  Trash2,
  Layers,
  X,
  Check,
  ChevronRight,
  UserPlus,
} from 'lucide-react';

const DESIGN_REJECTION_PRESETS = [
  'Fabric drape and seam finishing do not meet certified luxury showcase standards.',
  'Color harmony palette lacks adequate contrast or tonal balance for the designated occasion.',
  'High-resolution imagery or multi-angle garment renders are incomplete.',
  'Pattern specifications and silhouette grading are below platform submission criteria.',
  'Design aesthetic does not align with current seasonal showcase thematic guidelines.',
];

const DESIGNER_REJECTION_PRESETS = [
  'Portfolio lacks mandatory 3-piece minimum runway-grade design collection.',
  'Professional design credentials or fashion house affiliation could not be verified.',
  'Brand identity and high-res designer assets were incomplete.',
];

export const AdminDesigners: React.FC = () => {
  const [designers, setDesigners] = useState<AdminDesigner[]>([]);
  const [designs, setDesigns] = useState<AdminDesignSubmission[]>([]);
  const [stats, setStats] = useState<AdminDesignerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View Mode: 'designs' (Collection Submissions) vs 'designers' (Designer Profiles)
  const [viewMode, setViewMode] = useState<'designs' | 'designers'>('designs');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'rating' | 'approvalStatus' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedDesign, setSelectedDesign] = useState<AdminDesignSubmission | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<AdminDesigner | null>(null);

  const [rejectionModalItem, setRejectionModalItem] = useState<{
    type: 'design' | 'designer';
    id: string;
    name: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Add Designer Modal
  const [isAddDesignerModalOpen, setIsAddDesignerModalOpen] = useState(false);
  const [newDesignerName, setNewDesignerName] = useState('');
  const [newDesignerHandle, setNewDesignerHandle] = useState('');
  const [newDesignerBio, setNewDesignerBio] = useState('');
  const [newDesignerEmail, setNewDesignerEmail] = useState('');
  const [newDesignerVerified, setNewDesignerVerified] = useState(true);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.getAdminDesigners({
        type: 'all',
        approvalStatus: activeTab !== 'All' ? activeTab : undefined,
        search: searchQuery.trim() || undefined,
        sortBy,
        sortOrder,
      });

      setDesigners(res.designers);
      setDesigns(res.designs);
      setStats(res.stats);
    } catch (err: any) {
      console.error('Failed to fetch admin designer submissions:', err);
      setError(err.message || 'Failed to retrieve designer records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Handle Approve Design
  const handleApproveDesign = async (design: AdminDesignSubmission) => {
    try {
      setActionLoading(`design_${design.id}`);
      const res = await api.updateAdminDesignApproval(design.id, 'Approved');
      showToast('success', res.message || `Design '${design.title}' approved for public showcase`);
      if (selectedDesign?.id === design.id) {
        setSelectedDesign(res.design);
      }
      await fetchSubmissions();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve design submission');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Approve Designer
  const handleApproveDesigner = async (designer: AdminDesigner) => {
    try {
      setActionLoading(`designer_${designer.id}`);
      const res = await api.updateAdminDesignerApproval(designer.id, 'Approved');
      showToast('success', res.message || `Designer ${designer.name} verified successfully`);
      if (selectedDesigner?.id === designer.id) {
        setSelectedDesigner(res.designer);
      }
      await fetchSubmissions();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve designer');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Rejection Submit
  const handleRejectSubmit = async () => {
    if (!rejectionModalItem) return;
    if (!rejectionReason.trim()) {
      showToast('error', 'Please provide a rejection rationale for platform records.');
      return;
    }

    try {
      setActionLoading(`reject_${rejectionModalItem.id}`);
      if (rejectionModalItem.type === 'design') {
        const res = await api.updateAdminDesignApproval(
          rejectionModalItem.id,
          'Rejected',
          rejectionReason.trim()
        );
        showToast('success', res.message || `Design submission '${rejectionModalItem.name}' rejected`);
        if (selectedDesign?.id === rejectionModalItem.id) {
          setSelectedDesign(res.design);
        }
      } else {
        const res = await api.updateAdminDesignerApproval(
          rejectionModalItem.id,
          'Rejected',
          rejectionReason.trim()
        );
        showToast('success', res.message || `Designer '${rejectionModalItem.name}' application rejected`);
        if (selectedDesigner?.id === rejectionModalItem.id) {
          setSelectedDesigner(res.designer);
        }
      }

      setRejectionModalItem(null);
      setRejectionReason('');
      await fetchSubmissions();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to record rejection decision');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete Design
  const handleDeleteDesign = async (design: AdminDesignSubmission) => {
    if (!window.confirm(`Permanently delete design '${design.title}' from PostgreSQL?`)) {
      return;
    }

    try {
      setActionLoading(`design_${design.id}`);
      const res = await api.deleteAdminDesign(design.id);
      showToast('success', res.message || `Design '${design.title}' deleted`);
      if (selectedDesign?.id === design.id) {
        setSelectedDesign(null);
      }
      await fetchSubmissions();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete design submission');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete Designer
  const handleDeleteDesigner = async (designer: AdminDesigner) => {
    if (!window.confirm(`Permanently delete designer '${designer.name}' and all associated designs from PostgreSQL?`)) {
      return;
    }

    try {
      setActionLoading(`designer_${designer.id}`);
      const res = await api.deleteAdminDesigner(designer.id);
      showToast('success', res.message || `Designer '${designer.name}' deleted`);
      if (selectedDesigner?.id === designer.id) {
        setSelectedDesigner(null);
      }
      await fetchSubmissions();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete designer');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Create Designer
  const handleCreateDesigner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesignerName.trim()) {
      showToast('error', 'Designer name is required.');
      return;
    }

    try {
      setActionLoading('create_designer');
      const res = await api.createAdminDesigner({
        name: newDesignerName.trim(),
        handle: newDesignerHandle.trim() || `@${newDesignerName.toLowerCase().replace(/\s+/g, '')}`,
        bio: newDesignerBio.trim() || `Haute couture designer profile for ${newDesignerName}.`,
        email: newDesignerEmail.trim() || undefined,
        verified: newDesignerVerified,
        approvalStatus: 'Approved',
        status: 'Active',
      });

      showToast('success', res.message || `Designer ${newDesignerName} created in PostgreSQL`);
      setIsAddDesignerModalOpen(false);
      setNewDesignerName('');
      setNewDesignerHandle('');
      setNewDesignerBio('');
      setNewDesignerEmail('');
      await fetchSubmissions();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create designer');
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
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Designer Submissions & Verification
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium">
                  Prisma Live ORM
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Review collection designs, curate showcase runway looks, and verify certified designer portfolios.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchSubmissions()}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all disabled:opacity-50"
            title="Refresh from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span className="text-xs font-medium">Sync DB</span>
          </button>

          <button
            onClick={() => setIsAddDesignerModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-xs shadow-lg shadow-purple-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Designer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Showcase Designs */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Designs</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{stats?.totalDesigns ?? 0}</span>
            <span className="text-xs text-slate-400">runway pieces</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{stats?.approvedDesigns ?? 0} approved in public showcase</span>
          </div>
        </div>

        {/* Pending Design Submissions */}
        <div
          onClick={() => {
            setViewMode('designs');
            setActiveTab('Pending');
          }}
          className={`p-5 rounded-2xl border backdrop-blur-sm relative overflow-hidden cursor-pointer transition-all ${
            activeTab === 'Pending' && viewMode === 'designs'
              ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Pending Review</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 relative">
              <Clock className="w-4 h-4" />
              {((stats?.pendingDesignApprovals ?? 0) + (stats?.pendingDesignerApprovals ?? 0)) > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400">
              {(stats?.pendingDesignApprovals ?? 0) + (stats?.pendingDesignerApprovals ?? 0)}
            </span>
            <span className="text-xs text-amber-400/70">items awaiting action</span>
          </div>
          <div className="mt-2 text-xs text-amber-400/80 font-medium flex items-center gap-1">
            <span>{stats?.pendingDesignApprovals ?? 0} designs, {stats?.pendingDesignerApprovals ?? 0} designers</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Verified Designers */}
        <div
          onClick={() => {
            setViewMode('designers');
            setActiveTab('Approved');
          }}
          className={`p-5 rounded-2xl border backdrop-blur-sm relative overflow-hidden cursor-pointer transition-all ${
            activeTab === 'Approved' && viewMode === 'designers'
              ? 'bg-purple-950/20 border-purple-500/40 ring-1 ring-purple-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verified Designers</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-purple-400">{stats?.verifiedDesigners ?? 0}</span>
            <span className="text-xs text-slate-400">/ {stats?.totalDesigners ?? 0} total</span>
          </div>
          <div className="mt-2 text-xs text-purple-400/70 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Certified designer badge</span>
          </div>
        </div>

        {/* Community Engagement */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Showcase Engagement</span>
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-pink-400">{stats?.totalShowcaseVotes ?? 0}</span>
            <span className="text-xs text-slate-400">community votes</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Rejected: {stats?.rejectedDesigns ?? 0} designs</span>
          </div>
        </div>
      </div>

      {/* Main Filter & View Mode Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub-view Switcher: Designs vs Designers */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('designs')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'designs'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Design Submissions ({designs.length})</span>
            </button>
            <button
              onClick={() => setViewMode('designers')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'designers'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Designer Profiles ({designers.length})</span>
            </button>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? tab === 'Pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : tab === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                        : tab === 'Rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                        : 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab === 'All' ? 'All Submissions' : tab}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('_');
              setSortBy(by as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-purple-500/50"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="approvalStatus_asc">Approval Status</option>
          </select>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={
              viewMode === 'designs'
                ? 'Search designs by title, designer, collection, or occasion...'
                : 'Search designers by name, handle, bio, or email...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
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
            onClick={() => fetchSubmissions()}
            className="px-2.5 py-1 bg-rose-900/50 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Section: Mode 1 - Designs Submissions */}
      {viewMode === 'designs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading design collection submissions from PostgreSQL...</p>
            </div>
          ) : designs.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-2xl">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No design submissions found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || activeTab !== 'All'
                  ? 'Try clearing the search query or changing your approval status filter.'
                  : 'No design submissions are currently recorded in the database.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((design) => {
                const isActing = actionLoading === `design_${design.id}`;
                const isPending = design.approvalStatus === 'Pending';
                const isApproved = design.approvalStatus === 'Approved';
                const isRejected = design.approvalStatus === 'Rejected';

                return (
                  <div
                    key={design.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md hover:border-slate-700 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview & Status Badge */}
                      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                        <img
                          src={design.imageUrl}
                          alt={design.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border ${
                              isPending
                                ? 'bg-amber-950/80 border-amber-500/40 text-amber-300 animate-pulse'
                                : isApproved
                                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            {isPending ? (
                              <Clock className="w-3 h-3" />
                            ) : isApproved ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {design.approvalStatus}
                          </span>

                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white">
                            ${design.price}
                          </span>
                        </div>

                        {/* Bottom Designer Badge */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={design.designerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={design.designerName}
                              className="w-6 h-6 rounded-full object-cover border border-purple-400"
                            />
                            <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                              {design.designerName}
                            </span>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300">
                            {design.occasion}
                          </span>
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                            {design.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{design.collection}</p>
                        </div>

                        {/* Palette Swatches */}
                        <div className="flex items-center space-x-1.5 pt-1">
                          <Palette className="w-3 h-3 text-slate-500 shrink-0" />
                          <div className="flex items-center space-x-1">
                            {design.palette.map((colorHex, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                                style={{ backgroundColor: colorHex }}
                                title={colorHex}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono ml-1">
                            {design.votesCount} votes ({design.rating}★)
                          </span>
                        </div>

                        {/* Rejection notice if rejected */}
                        {isRejected && design.rejectionReason && (
                          <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20 text-[11px] text-rose-300 line-clamp-2">
                            <span className="font-semibold text-rose-200">Rejection: </span>
                            {design.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDesign(design)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        {design.approvalStatus !== 'Approved' && (
                          <button
                            onClick={() => handleApproveDesign(design)}
                            disabled={isActing}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {design.approvalStatus !== 'Rejected' && (
                          <button
                            onClick={() => {
                              setRejectionModalItem({
                                type: 'design',
                                id: design.id,
                                name: design.title,
                              });
                              setRejectionReason(DESIGN_REJECTION_PRESETS[0]);
                            }}
                            disabled={isActing}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteDesign(design)}
                          disabled={isActing}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content Section: Mode 2 - Designer Profiles */}
      {viewMode === 'designers' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading designer profiles from PostgreSQL...</p>
            </div>
          ) : designers.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No designer profiles found</h3>
              <p className="text-xs text-slate-400 mt-1">Try clearing your active filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Designer</th>
                    <th className="py-3.5 px-4">Portfolio & Bio</th>
                    <th className="py-3.5 px-4 text-center">Badges & Verification</th>
                    <th className="py-3.5 px-4 text-center">Approval Status</th>
                    <th className="py-3.5 px-4 text-center">Engagement</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {designers.map((designer) => {
                    const isActing = actionLoading === `designer_${designer.id}`;
                    const isPending = designer.approvalStatus === 'Pending';
                    const isApproved = designer.approvalStatus === 'Approved';

                    return (
                      <tr key={designer.id} className="hover:bg-slate-800/40 transition-colors group">
                        {/* Designer Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={designer.avatar}
                              alt={designer.name}
                              className="w-10 h-10 rounded-full object-cover border border-purple-500/40"
                            />
                            <div>
                              <span className="font-semibold text-white block text-sm group-hover:text-purple-300 transition-colors">
                                {designer.name}
                              </span>
                              <span className="text-[11px] text-purple-400 font-mono">{designer.handle}</span>
                            </div>
                          </div>
                        </td>

                        {/* Bio */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-300 line-clamp-2">{designer.bio}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {designer.designsCount ?? 0} submitted designs
                          </span>
                        </td>

                        {/* Badges & Verification */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {designer.verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                                Unverified
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              {designer.badges.map((b, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Approval Status */}
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Engagement Stats */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-white block">{designer.avgRating} ★</span>
                          <span className="text-[10px] text-slate-400">{designer.totalVotes} votes</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {designer.approvalStatus !== 'Approved' && (
                              <button
                                onClick={() => handleApproveDesigner(designer)}
                                disabled={isActing}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-all"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}

                            {designer.approvalStatus !== 'Rejected' && (
                              <button
                                onClick={() => {
                                  setRejectionModalItem({
                                    type: 'designer',
                                    id: designer.id,
                                    name: designer.name,
                                  });
                                  setRejectionReason(DESIGNER_REJECTION_PRESETS[0]);
                                }}
                                disabled={isActing}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedDesigner(designer)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteDesigner(designer)}
                              disabled={isActing}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all"
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
      )}

      {/* Modal 1: Design Inspection Modal */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {selectedDesign.title}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedDesign.approvalStatus === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedDesign.approvalStatus === 'Pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {selectedDesign.approvalStatus}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Collection: <strong className="text-slate-200">{selectedDesign.collection}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedDesign(null)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Preview Image */}
            <div className="rounded-xl overflow-hidden aspect-[16/9] bg-slate-950 border border-slate-800 relative">
              <img src={selectedDesign.imageUrl} alt={selectedDesign.title} className="w-full h-full object-cover" />
            </div>

            {/* Design Spec Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Occasion</span>
                <span className="font-semibold text-white">{selectedDesign.occasion}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Price</span>
                <span className="font-semibold text-emerald-400">${selectedDesign.price}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Rating</span>
                <span className="font-semibold text-amber-400">{selectedDesign.rating} ★ ({selectedDesign.votesCount})</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Showcase Status</span>
                <span className="font-semibold text-purple-400">
                  {selectedDesign.inStock ? 'Active' : 'Unpublished'}
                </span>
              </div>
            </div>

            {/* Palette Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Color Harmony Palette
              </span>
              <div className="flex items-center space-x-3">
                {selectedDesign.palette.map((colorHex, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: colorHex }} />
                    <span className="text-xs font-mono text-slate-300">{colorHex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                Designer: <strong className="text-slate-300">{selectedDesign.designerName}</strong>
              </span>

              <div className="flex items-center space-x-2">
                {selectedDesign.approvalStatus !== 'Approved' && (
                  <button
                    onClick={() => handleApproveDesign(selectedDesign)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve for Showcase</span>
                  </button>
                )}

                {selectedDesign.approvalStatus !== 'Rejected' && (
                  <button
                    onClick={() => {
                      setRejectionModalItem({
                        type: 'design',
                        id: selectedDesign.id,
                        name: selectedDesign.title,
                      });
                      setRejectionReason(DESIGN_REJECTION_PRESETS[0]);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Submission</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedDesign(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Rejection Feedback Modal */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Reject {rejectionModalItem.type === 'design' ? 'Design Submission' : 'Designer Application'}
              </h3>
              <button onClick={() => setRejectionModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide actionable review rationale for <strong className="text-white">{rejectionModalItem.name}</strong>.
            </p>

            {/* Preset chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Standard Reason:
              </span>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {(rejectionModalItem.type === 'design' ? DESIGN_REJECTION_PRESETS : DESIGNER_REJECTION_PRESETS).map(
                  (preset, idx) => (
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
                  )
                )}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Custom Feedback:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify aesthetic, technical, or fabric guideline reasons..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalItem(null)}
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

      {/* Modal 3: Add Designer Modal */}
      {isAddDesignerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                Add Certified Designer
              </h3>
              <button onClick={() => setIsAddDesignerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDesigner} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Designer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vivienne Vance"
                  value={newDesignerName}
                  onChange={(e) => setNewDesignerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Handle</label>
                  <input
                    type="text"
                    placeholder="@vivienne_atelier"
                    value={newDesignerHandle}
                    onChange={(e) => setNewDesignerHandle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="vivienne@couture.com"
                    value={newDesignerEmail}
                    onChange={(e) => setNewDesignerEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bio / Portfolio Highlights</label>
                <textarea
                  rows={3}
                  placeholder="Parisian tailored eveningwear and bespoke embroidery..."
                  value={newDesignerBio}
                  onChange={(e) => setNewDesignerBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="verifiedCheck"
                  checked={newDesignerVerified}
                  onChange={(e) => setNewDesignerVerified(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0"
                />
                <label htmlFor="verifiedCheck" className="text-slate-300">
                  Grant immediate Certified Designer badge
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDesignerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  Save Designer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
