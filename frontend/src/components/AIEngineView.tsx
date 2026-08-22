import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ThumbsUp,
  Star,
  ShoppingBag,
  Heart,
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
} from 'lucide-react';
import type { UserProfile, OccasionType, ColorCombo, RetailProduct } from '../types/fashion';
import { COLOR_COMBINATIONS, RETAIL_PRODUCTS, DESIGNERS } from '../data/fashionData';
import { api } from '../services/api';

interface AIEngineViewProps {
  userProfile: UserProfile;
  onSelectProduct: (product: RetailProduct) => void;
  onNavigateTab: (tab: string) => void;
  searchQuery?: string;
}

export const AIEngineView: React.FC<AIEngineViewProps> = ({
  userProfile,
  onSelectProduct,
  onNavigateTab,
  searchQuery = '',
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>('Work');
  const [selectedStyleCategory, setSelectedStyleCategory] = useState<string>('All');
  const [combos, setCombos] = useState<ColorCombo[]>(COLOR_COMBINATIONS);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [wishlistItems, setWishlistItems] = useState<{ [key: string]: boolean }>({});

  const styleCategories = [
    'All',
    'Minimalist',
    'Streetwear',
    'Sustainable',
    'Vintage',
    'Athleisure',
    'Casual',
    'Formal',
    'Party',
  ];

  useEffect(() => {
    async function loadAiData() {
      try {
        const res = await api.getAiStyling(userProfile, selectedOccasion);
        setAiAnalysis(res);
      } catch (err) {
        console.error('Error fetching AI styling analysis:', err);
      }
    }
    loadAiData();
  }, [userProfile, selectedOccasion]);

  const filteredCombos = combos.filter((c) => {
    const matchOccasion = c.occasion === selectedOccasion || selectedOccasion === 'Work';
    const matchStyle =
      selectedStyleCategory === 'All' ||
      c.title.toLowerCase().includes(selectedStyleCategory.toLowerCase()) ||
      c.subType.toLowerCase().includes(selectedStyleCategory.toLowerCase());

    if (!searchQuery.trim()) return matchOccasion && matchStyle;
    const q = searchQuery.toLowerCase();
    return (
      matchOccasion &&
      matchStyle &&
      (c.title.toLowerCase().includes(q) ||
        c.subType.toLowerCase().includes(q) ||
        c.occasion.toLowerCase().includes(q))
    );
  });

  const handleToggleWishlist = (comboId: string) => {
    setWishlistItems((prev) => ({
      ...prev,
      [comboId]: !prev[comboId],
    }));
  };

  const handleUpvoteCombo = (comboId: string) => {
    setCombos((prev) =>
      prev.map((c) => {
        if (c.id === comboId) {
          const newVotes = c.votesCount + 1;
          const newRating = Math.min(5.0, Number((c.rating + 0.01).toFixed(2)));
          return { ...c, votesCount: newVotes, rating: newRating, userVote: 5 };
        }
        return c;
      })
    );
  };

  const scrollToOutfits = () => {
    const el = document.getElementById('recommended-outfits-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. CUSTOMER WELCOME BANNER */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-theme-main">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-gradient-to-br from-amber-500/20 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Personalized Fashion Feed</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-theme-heading tracking-tight">
              Welcome back, <span className="gradient-text-gold">{userProfile.name}</span>
            </h1>
            
            <p className="text-sm text-theme-secondary">
              Discover styles and outfits curated just for you based on your <strong className="text-amber-800 dark:text-amber-300">{userProfile.skinTone}</strong> undertones and <strong className="text-amber-800 dark:text-amber-300">{userProfile.bodyShape}</strong> silhouette preferences.
            </p>

            {/* Customer Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={scrollToOutfits}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Styles</span>
              </button>

              <button
                onClick={() => onNavigateTab('wishlist')}
                className="px-5 py-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                <span>View Wishlist</span>
              </button>

              <button
                onClick={() => onNavigateTab('stock-locator')}
                className="px-5 py-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>

          {/* Active Style Profile Card */}
          <div className="bg-surface-theme/90 backdrop-blur-md border border-theme-main p-4 rounded-2xl text-xs space-y-2.5 text-theme-secondary w-full lg:w-auto min-w-[250px] shadow-lg">
            <div className="flex justify-between items-center pb-2 border-b border-theme-main">
              <span className="font-bold text-theme-heading">Body Silhouette</span>
              <span className="text-amber-800 dark:text-amber-400 font-semibold">{userProfile.bodyShape}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">Color Palette:</span>
              <span className="text-rose-300 font-medium">{userProfile.undertone} undertones</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">Style Confidence:</span>
              <span className="text-emerald-400 font-bold">{aiAnalysis?.overallMatch || 98.4}% Match</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. TRENDING STYLES CATEGORIES (Clickable Filter Chips) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-theme-muted flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Trending Style Categories</span>
          </h2>
          <span className="text-xs text-theme-muted">Select a category to filter</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {styleCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedStyleCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStyleCategory === cat
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-xs'
                  : 'bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading border border-theme-main'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. OCCASION SHOPPING CATEGORIES BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-theme-muted">Shop By Occasion</h2>
        </div>

        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5 bg-surface-theme p-1.5 rounded-2xl border border-theme-main">
            {(['Work', 'Casual', 'Date night', 'Formal', 'Party', 'Travel'] as OccasionType[]).map((occ) => (
              <button
                key={occ}
                onClick={() => setSelectedOccasion(occ)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedOccasion === occ
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('color-voting')}
            className="flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-3.5 py-2 rounded-xl border border-amber-400/30 transition-all whitespace-nowrap cursor-pointer"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Vote on Colors</span>
          </button>
        </div>
      </div>

      {/* 4. RECOMMENDED FOR YOU (Outfit & Product Cards Grid) */}
      <div id="recommended-outfits-section" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-theme-heading">Recommended For You</h2>
            <p className="text-xs text-theme-muted">Tailored outfit combinations matching your occasion & color harmony</p>
          </div>
          <span className="text-xs text-amber-400 font-bold">{filteredCombos.length} Outfits Found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => (
            <div key={combo.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-theme-main hover:border-amber-400/40 transition-all shadow-md">
              
              {/* Image Preview & Wishlist Bookmark Button */}
              <div className="relative h-64 overflow-hidden group">
                <img
                  src={combo.exampleImageUrl}
                  alt={combo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                
                {/* Rating Badge */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="badge-top-rated px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{combo.rating} ({combo.votesCount.toLocaleString()} votes)</span>
                  </span>
                </div>

                {/* Wishlist Toggle Button */}
                <button
                  onClick={() => handleToggleWishlist(combo.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                    wishlistItems[combo.id]
                      ? 'bg-rose-500 text-white border-rose-400 shadow-lg scale-110'
                      : 'bg-surface-theme/80 text-theme-muted hover:text-rose-400 border-theme-main'
                  }`}
                  title="Bookmark to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${wishlistItems[combo.id] ? 'fill-white' : ''}`} />
                </button>

                {/* Color Palette Swatches */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-surface-theme/90 backdrop-blur-md p-2.5 rounded-2xl border border-theme-main">
                  <div className="flex items-center gap-2">
                    {combo.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-theme-main shadow-inner group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.name} (${c.hex})`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-theme-secondary font-medium">{combo.subType}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-theme-heading">{combo.title}</h3>
                  <p className="text-xs text-theme-muted mt-1">
                    Perfect for <strong className="text-theme-secondary">{combo.occasion}</strong>. Curated for <span className="text-amber-300 font-medium">{userProfile.skinTone}</span> undertones.
                  </p>
                </div>

                {/* Commerce Catalogue Products Match */}
                <div className="space-y-2 pt-2 border-t border-theme-main">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-theme-muted block">
                    Available Clothing Items
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {RETAIL_PRODUCTS.slice(0, 2).map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => onSelectProduct(prod)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-left transition-all cursor-pointer"
                      >
                        <img src={prod.imageUrl} alt={prod.title} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="overflow-hidden">
                          <div className="text-[11px] font-semibold text-theme-heading truncate">{prod.title}</div>
                          <div className="text-[10px] text-amber-400 font-bold">${prod.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating & Buy Button Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleUpvoteCombo(combo.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      combo.userVote
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                        : 'bg-surface-theme hover:bg-surface-subtle-theme text-theme-secondary border border-theme-main'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${combo.userVote ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span>{combo.userVote ? 'Voted' : 'Rate Combo'}</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('stock-locator')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Find Stock</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. RECOMMENDED DESIGNERS SECTION */}
      <div className="glass-panel rounded-3xl p-6 space-y-4 border border-theme-main shadow-lg">
        <div className="flex items-center justify-between border-b border-theme-subtle pb-3">
          <div>
            <h2 className="text-xl font-serif font-bold text-theme-heading flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Recommended Designers</span>
            </h2>
            <p className="text-xs text-theme-muted">Featured independent designers on the merit storefront</p>
          </div>
          <button
            onClick={() => onNavigateTab('designer-showcase')}
            className="text-xs text-purple-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All Designers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DESIGNERS.slice(0, 3).map((designer) => (
            <div key={designer.id} className="p-4 rounded-2xl bg-surface-theme border border-theme-main space-y-3 hover:border-purple-400/40 transition-all">
              <div className="flex items-center gap-3">
                <img src={designer.avatar} alt={designer.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500/30" />
                <div>
                  <div className="flex items-center gap-1">
                    <h4 className="font-serif font-bold text-sm text-theme-heading">{designer.name}</h4>
                    {designer.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-theme-muted">{designer.handle}</div>
                  <div className="text-[10px] text-purple-300 font-semibold">{designer.followers.toLocaleString()} Followers</div>
                </div>
              </div>
              <p className="text-[11px] text-theme-muted line-clamp-2">{designer.bio}</p>
              <button
                onClick={() => onNavigateTab('designer-showcase')}
                className="w-full py-2 px-3 rounded-xl bg-surface-subtle-theme hover:bg-surface-theme border border-theme-main text-xs font-bold text-theme-heading flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>View Profile</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
