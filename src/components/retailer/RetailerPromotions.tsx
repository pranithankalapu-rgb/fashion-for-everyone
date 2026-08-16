import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Calendar,
  Percent,
  DollarSign,
  Power,
  Edit2,
  X,
} from 'lucide-react';
import type { Promotion } from '../../types/fashion';

interface RetailerPromotionsProps {
  promotions: Promotion[];
  onCreatePromotion: (promo: Omit<Promotion, 'id' | 'usageCount'>) => void;
  onUpdatePromotion: (promo: Promotion) => void;
  onToggleDeactivate: (id: string) => void;
}

export const RetailerPromotions: React.FC<RetailerPromotionsProps> = ({
  promotions,
  onCreatePromotion,
  onUpdatePromotion,
  onToggleDeactivate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'Percentage' | 'Fixed Amount'>('Percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(20);
  const [formCategory, setFormCategory] = useState('All Categories');
  const [formStartDate, setFormStartDate] = useState('2026-08-01');
  const [formEndDate, setFormEndDate] = useState('2026-08-31');
  const [formMaxUses, setFormMaxUses] = useState<number>(500);
  const [formStatus, setFormStatus] = useState<'Active' | 'Scheduled' | 'Expired' | 'Inactive'>('Active');

  const filteredPromotions = promotions.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingPromo(null);
    setFormTitle('Autumn Tailoring Special');
    setFormCode(`PROMO-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDiscountType('Percentage');
    setFormDiscountValue(20);
    setFormCategory('Coats & Jackets');
    setFormStartDate('2026-09-01');
    setFormEndDate('2026-09-30');
    setFormMaxUses(300);
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setFormTitle(p.title);
    setFormCode(p.code);
    setFormDiscountType(p.discountType);
    setFormDiscountValue(p.discountValue);
    setFormCategory(p.category || 'All Categories');
    setFormStartDate(p.startDate);
    setFormEndDate(p.endDate);
    setFormMaxUses(p.maxUses);
    setFormStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCode) return;

    if (editingPromo) {
      onUpdatePromotion({
        ...editingPromo,
        title: formTitle,
        code: formCode,
        discountType: formDiscountType,
        discountValue: formDiscountValue,
        category: formCategory,
        startDate: formStartDate,
        endDate: formEndDate,
        maxUses: formMaxUses,
        status: formStatus,
      });
    } else {
      onCreatePromotion({
        title: formTitle,
        code: formCode,
        discountType: formDiscountType,
        discountValue: formDiscountValue,
        category: formCategory,
        startDate: formStartDate,
        endDate: formEndDate,
        maxUses: formMaxUses,
        status: formStatus,
      });
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Active':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'Scheduled':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'Expired':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'Inactive':
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
      default:
        return 'bg-surface-theme border-theme-subtle text-theme-muted';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Promotions & Campaigns Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Promotions & Discounts
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Create coupon codes, launch seasonal discount campaigns, set category offers, and manage promo statuses.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-3xl p-5 space-y-4 border border-theme-main">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search promotions by title or promo code (e.g. SUMMER2026)..."
              className="w-full h-10 pl-10 pr-4 bg-surface-theme border border-theme-main focus:border-amber-400/50 rounded-xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-theme rounded-xl border border-theme-main text-xs">
            {['All', 'Active', 'Scheduled', 'Expired', 'Inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st
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

      {/* Promotions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPromotions.map((promo) => (
          <div
            key={promo.id}
            className="glass-card rounded-3xl p-6 space-y-4 border border-theme-main flex flex-col justify-between hover:border-amber-400/40 transition-all shadow-md"
          >
            <div>
              {/* Top Row: Code Badge & Status */}
              <div className="flex items-center justify-between gap-2 border-b border-theme-subtle pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 font-mono text-xs font-bold text-amber-300 tracking-wider">
                    {promo.code}
                  </span>
                  <span className="text-xs text-theme-muted font-semibold">{promo.category || 'Storewide'}</span>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(promo.status)}`}>
                  {promo.status}
                </span>
              </div>

              {/* Title & Discount */}
              <div className="mt-4 space-y-1">
                <h3 className="font-serif font-bold text-base text-theme-heading">{promo.title}</h3>
                <div className="flex items-center gap-2 text-xl font-bold font-mono text-emerald-400">
                  {promo.discountType === 'Percentage' ? (
                    <span className="flex items-center gap-0.5">
                      <Percent className="w-5 h-5" />
                      <span>{promo.discountValue}% OFF</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <DollarSign className="w-5 h-5" />
                      <span>${promo.discountValue} OFF</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Campaign Schedule & Usage Bar */}
              <div className="mt-4 space-y-2 text-xs text-theme-muted bg-surface-theme p-3 rounded-2xl border border-theme-subtle">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Duration:</span>
                  </span>
                  <span className="text-theme-heading font-semibold">
                    {promo.startDate} to {promo.endDate}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-theme-subtle">
                  <span>Redemptions Used:</span>
                  <span className="font-mono font-bold text-theme-heading">
                    {promo.usageCount} / {promo.maxUses}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-surface-subtle-theme rounded-full overflow-hidden border border-theme-subtle">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((promo.usageCount / (promo.maxUses || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-theme-subtle">
              <button
                onClick={() => handleOpenEditModal(promo)}
                className="flex-1 py-2 px-3 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Campaign</span>
              </button>

              <button
                onClick={() => onToggleDeactivate(promo.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  promo.status === 'Active'
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{promo.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-theme-main pb-4">
              <h2 className="text-xl font-serif font-bold text-theme-heading">
                {editingPromo ? 'Edit Promotion Campaign' : 'Create New Promotion'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Summer Luxury Tailoring Sale"
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER2026"
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Discount Type *</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as 'Percentage' | 'Fixed Amount')}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Discount Value *</label>
                  <input
                    type="number"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-theme-heading focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Target Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Coats & Jackets"
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(Number(e.target.value))}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Expired">Expired</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg cursor-pointer"
                >
                  {editingPromo ? 'Save Changes' : 'Launch Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
