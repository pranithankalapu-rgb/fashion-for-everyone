import React, { useState, useEffect } from 'react';
import { Video, Heart, Share2, Plus, Layers, Image as ImageIcon, Check } from 'lucide-react';
import type { OutfitLook, RetailProduct } from '../types/fashion';
import { OUTFIT_LOOKS, RETAIL_PRODUCTS } from '../data/fashionData';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface SocialFeedViewProps {
  onSelectProduct: (p: RetailProduct) => void;
  searchQuery?: string;
}

export const SocialFeedView: React.FC<SocialFeedViewProps> = ({ onSelectProduct, searchQuery = '' }) => {
  const [looks, setLooks] = useState<OutfitLook[]>(OUTFIT_LOOKS);
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'board-builder'>('feed');
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  
  // Board builder state
  const [selectedBoardItems, setSelectedBoardItems] = useState<RetailProduct[]>([
    RETAIL_PRODUCTS[0],
    RETAIL_PRODUCTS[2],
  ]);
  const [boardTitle, setBoardTitle] = useState<string>('Autumn Monochrome Smart Casual');
  const [isExported, setIsExported] = useState<boolean>(false);

  // New Post Form state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostOccasion, setNewPostOccasion] = useState<'Work' | 'Casual' | 'Date night' | 'Formal'>('Casual');
  const [newPostThumb, setNewPostThumb] = useState('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80');

  useEffect(() => {
    async function loadSocialFeed() {
      try {
        const data = await api.getSocialFeed();
        setLooks(data);
      } catch (err) {
        console.error('Error fetching social feed:', err);
      }
    }
    loadSocialFeed();
  }, []);

  const filteredLooks = looks.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.creatorName.toLowerCase().includes(q) ||
      l.creatorHandle.toLowerCase().includes(q) ||
      l.occasion.toLowerCase().includes(q)
    );
  });

  const handleToggleLike = async (lookId: string) => {
    try {
      const updated = await api.toggleLikeOutfitLook(lookId);
      setLooks((prev) => prev.map((l) => (l.id === lookId ? updated : l)));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleAddItemToBoard = (prod: RetailProduct) => {
    if (!selectedBoardItems.find((p) => p.id === prod.id)) {
      setSelectedBoardItems([...selectedBoardItems, prod]);
    }
  };

  const handleRemoveFromBoard = (prodId: string) => {
    setSelectedBoardItems(selectedBoardItems.filter((p) => p.id !== prodId));
  };

  const handleExportBoard = async () => {
    confetti({ particleCount: 70, spread: 80 });
    try {
      const created = await api.createOutfitLook({
        title: boardTitle,
        occasion: 'Casual',
        videoThumbnail: selectedBoardItems[0]?.imageUrl || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
        taggedProductIds: selectedBoardItems.map((p) => p.id),
      });
      setLooks([created, ...looks]);
      setIsExported(true);
      setTimeout(() => setIsExported(false), 3000);
    } catch (err) {
      console.error('Error exporting outfit board:', err);
    }
  };

  const handleCreateNewLook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    try {
      const created = await api.createOutfitLook({
        title: newPostTitle,
        occasion: newPostOccasion,
        videoThumbnail: newPostThumb,
      });

      setLooks([created, ...looks]);
      setIsPostModalOpen(false);
      setNewPostTitle('');
      confetti({ particleCount: 60, spread: 70 });
    } catch (err) {
      console.error('Error publishing new video look:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-300 text-xs font-semibold">
              <Video className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              <span>Social Lookbooks & Tagged Commerce Feed</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-theme-heading tracking-tight">
              Social Video Feed & <span className="gradient-text-rose">Outfit Board Builder</span>
            </h1>
            <p className="text-sm text-theme-secondary">
              Users and creators share video lookbooks tagged with exact products. Share pre-rendered preview cards to IG/TikTok/Pinterest to drive organic referral loops.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Video Lookbook</span>
            </button>

            <div className="flex items-center gap-1 bg-surface-theme p-1.5 rounded-2xl border border-theme-main">
              <button
                onClick={() => setActiveSubTab('feed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSubTab === 'feed'
                    ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-slate-900 dark:text-orange-300 border border-orange-500/40 shadow-sm'
                    : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
                }`}
              >
                For You Feed
              </button>
              <button
                onClick={() => setActiveSubTab('board-builder')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'board-builder'
                    ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-slate-900 dark:text-orange-300 border border-orange-500/40 shadow-sm'
                    : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Flat-Lay Board Builder</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab 1: Video Lookbook Stream */}
      {activeSubTab === 'feed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLooks.map((look) => (
            <div key={look.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
              
              {/* Video Thumbnail & Hotspot Overlay */}
              <div className="relative h-96 overflow-hidden group">
                <img src={look.videoThumbnail} alt={look.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Creator Header */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-center bg-surface-theme/90 backdrop-blur-md p-2 rounded-2xl border border-theme-main">
                  <div className="flex items-center gap-2">
                    <img src={look.creatorAvatar} alt={look.creatorName} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-theme-heading">{look.creatorName}</div>
                      <div className="text-[10px] text-theme-muted">{look.creatorHandle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-300 bg-orange-500/15 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                    {look.occasion}
                  </span>
                </div>

                {/* Video Play Pill & Social Actions */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(look.id)}
                      className="flex items-center gap-1 bg-surface-theme/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-theme-main text-xs font-bold text-theme-heading"
                    >
                      <Heart className={`w-4 h-4 ${look.userLiked ? 'fill-rose-500 text-rose-500' : 'text-theme-muted'}`} />
                      <span>{look.likes.toLocaleString()}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-surface-theme/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-theme-main text-xs font-bold text-theme-heading">
                      <Share2 className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                      <span>{look.reshares.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tagged Products Bar */}
              <div className="p-5 space-y-4">
                <h3 className="font-serif font-bold text-base text-theme-heading">{look.title}</h3>

                <div className="space-y-2 pt-2 border-t border-theme-main">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-theme-muted">
                    Tagged Items in Video ({look.taggedProducts.length})
                  </span>
                  {look.taggedProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => onSelectProduct(prod)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main w-full text-left transition-all"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img src={prod.imageUrl} alt={prod.title} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold text-theme-heading truncate">{prod.title}</div>
                          <div className="text-[10px] text-theme-muted">{prod.brand}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-300">${prod.price}</span>
                    </button>
                  ))}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Subtab 2: Flat-Lay Outfit Board Builder */}
      {activeSubTab === 'board-builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 7 Cols: Interactive Flat-Lay Canvas */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-amber-400/20 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Flat-Lay Canvas</span>
                  <input
                    type="text"
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                    className="font-serif font-bold text-2xl text-theme-heading bg-transparent border-b border-transparent focus:border-amber-400 outline-none w-full mt-1"
                  />
                </div>
                <button
                  onClick={handleExportBoard}
                  className="bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isExported ? 'Exported Open Graph Card!' : 'Export Social Card'}</span>
                </button>
              </div>

              {/* Canvas Area */}
              <div className="min-h-[320px] bg-surface-theme rounded-2xl border border-theme-main p-6 flex flex-wrap items-center justify-center gap-6 relative">
                {selectedBoardItems.length === 0 ? (
                  <div className="text-center text-theme-muted space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-theme-muted" />
                    <p className="text-xs">Click items from the catalog on the right to build your flat-lay outfit board.</p>
                  </div>
                ) : (
                  selectedBoardItems.map((prod) => (
                    <div key={prod.id} className="relative group w-40 glass-card p-3 rounded-2xl border border-theme-main text-center space-y-2 animate-fadeIn">
                      <button
                        onClick={() => handleRemoveFromBoard(prod.id)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <img src={prod.imageUrl} alt={prod.title} className="w-full h-32 object-cover rounded-xl" />
                      <div className="text-[11px] font-bold text-theme-heading truncate">{prod.title}</div>
                      <div className="text-[10px] text-amber-400 font-bold">${prod.price}</div>
                    </div>
                  ))
                )}
              </div>

              {isExported && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Open Graph social preview card generated for Instagram & Pinterest export!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Addable Items */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h3 className="font-serif font-bold text-lg text-theme-heading">Indexed Catalogue Items</h3>
              <p className="text-xs text-theme-muted">Click to add items directly to your canvas</p>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {RETAIL_PRODUCTS.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddItemToBoard(prod)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main hover:border-amber-400/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={prod.imageUrl} alt={prod.title} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <div className="text-xs font-bold text-theme-heading">{prod.title}</div>
                        <div className="text-[10px] text-theme-muted">{prod.brand}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-300">${prod.price}</span>
                      <Plus className="w-4 h-4 text-theme-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modal: Post New Video Lookbook */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-theme-heading">Publish New Video Lookbook</h2>

            <form onSubmit={handleCreateNewLook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Lookbook Caption & Title</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Ways to Style a Cashmere Blazer ✨"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-sm text-theme-heading focus:border-orange-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Occasion</label>
                <select
                  value={newPostOccasion}
                  onChange={(e) => setNewPostOccasion(e.target.value as any)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-orange-400 outline-none"
                >
                  <option value="Casual">Casual</option>
                  <option value="Work">Work</option>
                  <option value="Date night">Date night</option>
                  <option value="Formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Video Thumbnail URL</label>
                <input
                  type="url"
                  value={newPostThumb}
                  onChange={(e) => setNewPostThumb(e.target.value)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-orange-400 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-rose-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-orange-500/20"
                >
                  Publish to Community Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
