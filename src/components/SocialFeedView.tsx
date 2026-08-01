import React, { useState } from 'react';
import { Video, Heart, Share2, Plus, Layers, Image as ImageIcon, Check } from 'lucide-react';
import type { OutfitLook, RetailProduct } from '../types/fashion';
import { OUTFIT_LOOKS, RETAIL_PRODUCTS } from '../data/fashionData';
import confetti from 'canvas-confetti';

interface SocialFeedViewProps {
  onSelectProduct: (p: RetailProduct) => void;
}

export const SocialFeedView: React.FC<SocialFeedViewProps> = ({ onSelectProduct }) => {
  const [looks, setLooks] = useState<OutfitLook[]>(OUTFIT_LOOKS);
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'board-builder'>('feed');
  
  // Board builder state
  const [selectedBoardItems, setSelectedBoardItems] = useState<RetailProduct[]>([
    RETAIL_PRODUCTS[0],
    RETAIL_PRODUCTS[2],
  ]);
  const [boardTitle, setBoardTitle] = useState<string>('Autumn Monochrome Smart Casual');
  const [isExported, setIsExported] = useState<boolean>(false);

  const handleToggleLike = (lookId: string) => {
    setLooks((prev) =>
      prev.map((l) => {
        if (l.id === lookId) {
          const isLiked = !l.userLiked;
          return {
            ...l,
            userLiked: isLiked,
            likes: l.likes + (isLiked ? 1 : -1),
          };
        }
        return l;
      })
    );
  };

  const handleAddItemToBoard = (prod: RetailProduct) => {
    if (!selectedBoardItems.find((p) => p.id === prod.id)) {
      setSelectedBoardItems([...selectedBoardItems, prod]);
    }
  };

  const handleRemoveFromBoard = (prodId: string) => {
    setSelectedBoardItems(selectedBoardItems.filter((p) => p.id !== prodId));
  };

  const handleExportBoard = () => {
    confetti({ particleCount: 70, spread: 80 });
    setIsExported(true);
    setTimeout(() => setIsExported(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Video className="w-3.5 h-3.5" />
              <span>Social Lookbooks & Tagged Commerce Feed</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Social Video Feed & <span className="gradient-text-rose">Outfit Board Builder</span>
            </h1>
            <p className="text-sm text-slate-300">
              Users and creators share video lookbooks tagged with exact products. Share pre-rendered preview cards to IG/TikTok/Pinterest to drive organic referral loops.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveSubTab('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'feed'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For You Feed
            </button>
            <button
              onClick={() => setActiveSubTab('board-builder')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'board-builder'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flat-Lay Board Builder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab 1: Video Lookbook Stream */}
      {activeSubTab === 'feed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {looks.map((look) => (
            <div key={look.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
              
              {/* Video Thumbnail & Hotspot Overlay */}
              <div className="relative h-96 overflow-hidden group">
                <img src={look.videoThumbnail} alt={look.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Creator Header */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-center bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <img src={look.creatorAvatar} alt={look.creatorName} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-white">{look.creatorName}</div>
                      <div className="text-[10px] text-slate-400">{look.creatorHandle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                    {look.occasion}
                  </span>
                </div>

                {/* Video Play Pill & Social Actions */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(look.id)}
                      className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white"
                    >
                      <Heart className={`w-4 h-4 ${look.userLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
                      <span>{look.likes.toLocaleString()}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      <span>{look.reshares.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tagged Products Bar */}
              <div className="p-5 space-y-4">
                <h3 className="font-serif font-bold text-base text-white">{look.title}</h3>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Tagged Items in Video ({look.taggedProducts.length})
                  </span>
                  {look.taggedProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => onSelectProduct(prod)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 w-full text-left transition-all"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img src={prod.imageUrl} alt={prod.title} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold text-white truncate">{prod.title}</div>
                          <div className="text-[10px] text-slate-400">{prod.brand}</div>
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
                    className="font-serif font-bold text-2xl text-white bg-transparent border-b border-transparent focus:border-amber-400 outline-none w-full mt-1"
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
              <div className="min-h-[320px] bg-slate-950/80 rounded-2xl border border-white/10 p-6 flex flex-wrap items-center justify-center gap-6 relative">
                {selectedBoardItems.length === 0 ? (
                  <div className="text-center text-slate-500 space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs">Click items from the catalog on the right to build your flat-lay outfit board.</p>
                  </div>
                ) : (
                  selectedBoardItems.map((prod) => (
                    <div key={prod.id} className="relative group w-40 glass-card p-3 rounded-2xl border border-white/10 text-center space-y-2 animate-fadeIn">
                      <button
                        onClick={() => handleRemoveFromBoard(prod.id)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <img src={prod.imageUrl} alt={prod.title} className="w-full h-32 object-cover rounded-xl" />
                      <div className="text-[11px] font-bold text-white truncate">{prod.title}</div>
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
              <h3 className="font-serif font-bold text-lg text-white">Indexed Catalogue Items</h3>
              <p className="text-xs text-slate-400">Click to add items directly to your canvas</p>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {RETAIL_PRODUCTS.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddItemToBoard(prod)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-900 border border-white/10 hover:border-amber-400/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={prod.imageUrl} alt={prod.title} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{prod.title}</div>
                        <div className="text-[10px] text-slate-400">{prod.brand}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-300">${prod.price}</span>
                      <Plus className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
