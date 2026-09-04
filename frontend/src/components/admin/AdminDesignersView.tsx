import React, { useState, useEffect } from 'react';
import type { Designer, Design } from '../../types/fashion';
import {
  Award,
  Sparkles,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
  X,
  Check,
} from 'lucide-react';

export const AdminDesignersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'designers' | 'designs'>('designers');
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Design Creation State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [collection, setCollection] = useState('Autumn Monochrome 2026');
  const [imageUrl, setImageUrl] = useState('');
  const [occasion, setOccasion] = useState('Work');
  const [price, setPrice] = useState('340');
  const [designerId, setDesignerId] = useState('des_1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'designers') {
        const res = await fetch('/api/designers');
        if (!res.ok) throw new Error('Failed to load designers');
        const data = await res.json();
        setDesigners(data);
      } else {
        const res = await fetch('/api/designs');
        if (!res.ok) throw new Error('Failed to load designs');
        const data = await res.json();
        setDesigns(data);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setTitle('Asymmetric Cashmere Blazer & Trousers');
    setCollection('Winter Atelier 2026');
    setImageUrl('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80');
    setOccasion('Work');
    setPrice('390');
    setDesignerId(designers[0]?.id || 'des_1');
    setIsModalOpen(true);
  };

  const handleCreateDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'designer',
        },
        body: JSON.stringify({
          title,
          collection,
          imageUrl,
          occasion,
          price: Number(price),
          designerId,
          palette: ['#1E293B', '#CBD5E1', '#D97706'],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create design');
      }

      showNotification('success', 'Design showcase entry created successfully!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error creating design');
    } finally {
      setSaving(false);
    }
  };

  const handleVoteDesign = async (id: string, designTitle: string) => {
    try {
      const res = await fetch(`/api/designs/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5 }),
      });
      if (!res.ok) throw new Error('Failed to submit vote');
      const updated = await res.json();
      showNotification('success', `Submitted 5-star rating for "${designTitle}". New rating: ${updated.rating}`);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error voting');
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
            <Award className="w-3.5 h-3.5" />
            <span>Designer Showcase & Merit System</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-theme-heading">Designer & Merit Control Center</h1>
          <p className="text-xs text-theme-muted">
            Manage independent designer profiles, review collection submissions, and monitor community merit ratings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading text-xs font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Showcase Design</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="bg-surface-theme border border-theme-main rounded-2xl p-2 flex items-center gap-2 w-fit">
        <button
          onClick={() => setActiveTab('designers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'designers'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Designer Profiles</span>
        </button>
        <button
          onClick={() => setActiveTab('designs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'designs'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Collection Showcase Entries</span>
        </button>
      </div>

      {/* TAB 1: DESIGNER PROFILES */}
      {activeTab === 'designers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-theme-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
              Loading designer profiles...
            </div>
          ) : (
            designers.map((d) => (
              <div key={d.id} className="bg-surface-theme border border-theme-main rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <img
                    src={d.avatar}
                    alt={d.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif font-bold text-theme-heading text-lg">{d.name}</h3>
                      {d.verified && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div className="text-xs text-amber-400 font-semibold">{d.handle}</div>
                  </div>
                </div>

                <p className="text-xs text-theme-muted line-clamp-2">{d.bio}</p>

                <div className="flex items-center justify-between pt-3 border-t border-theme-main text-xs">
                  <div className="flex items-center gap-1 text-amber-300 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{d.avgRating} / 5.0</span>
                  </div>
                  <div className="text-theme-heading font-semibold">{d.followers.toLocaleString()} followers</div>
                </div>

                <div className="flex gap-2">
                  {d.badges?.map((b) => (
                    <span
                      key={b}
                      className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: DESIGNS SHOWCASE */}
      {activeTab === 'designs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-theme-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
              Loading collection designs...
            </div>
          ) : (
            designs.map((dsg) => (
              <div key={dsg.id} className="bg-surface-theme border border-theme-main rounded-3xl overflow-hidden shadow-xl space-y-3 p-4">
                <img
                  src={dsg.imageUrl}
                  alt={dsg.title}
                  className="w-full h-52 object-cover rounded-2xl border border-theme-main"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{dsg.collection}</span>
                  <h4 className="font-serif font-bold text-theme-heading text-base">{dsg.title}</h4>
                  <div className="text-xs text-theme-muted">By {dsg.designerName}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-theme-main text-xs">
                  <div className="font-bold text-amber-300 text-sm">${dsg.price}</div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{dsg.rating} ({dsg.votesCount} votes)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleVoteDesign(dsg.id, dsg.title)}
                  className="w-full bg-surface-subtle-theme hover:bg-amber-500/20 border border-theme-main text-theme-heading hover:text-amber-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Submit 5★ Rating Vote</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Design Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-surface-theme text-theme-muted hover:text-theme-heading"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-bold text-theme-heading">Add Designer Showcase Entry</h3>
              <p className="text-xs text-theme-muted">Add a new high-fashion collection entry for community rating.</p>
            </div>

            <form onSubmit={handleCreateDesign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Collection Name</label>
                  <input
                    type="text"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Image URL *</label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-theme text-xs font-bold text-theme-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Create Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
