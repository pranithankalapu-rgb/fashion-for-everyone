import React, { useState } from 'react';
import {
  Award,
  Star,
  Plus,
  FolderPlus,
  Eye,
  Sparkles,
  Layers,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  FileEdit,
  Flame,
} from 'lucide-react';
import type { Designer, Design, RetailProduct } from '../../types/fashion';

interface DesignerDashboardProps {
  designerProfile: Designer;
  designs: Design[];
  activeCollectionsCount?: number;
  onNavigateTab: (tab: string) => void;
  onOpenUploadModal: () => void;
  onOpenNewCollectionModal?: () => void;
  onSelectProduct: (p: RetailProduct) => void;
}

export const DesignerDashboard: React.FC<DesignerDashboardProps> = ({
  designerProfile,
  designs,
  activeCollectionsCount = 5,
  onNavigateTab,
  onOpenUploadModal,
  onOpenNewCollectionModal,
  onSelectProduct,
}) => {
  const [selectedDesignModal, setSelectedDesignModal] = useState<Design | null>(null);

  // Statistics calculation
  const totalDesignsCount = 24; // Total catalog & archive designs
  const draftDesignsCount = 4; // Saved concepts in progress
  const publishedDesignsCount = designs.length > 0 ? designs.length : 20;
  const totalPortfolioViews = '142.8k';
  const totalLikesVotes = designs.reduce((acc, d) => acc + d.votesCount, 3210);

  // Identify Most Popular Design (highest votes/rating)
  const mostPopularDesign = designs.length > 0
    ? [...designs].sort((a, b) => b.votesCount * b.rating - a.votesCount * a.rating)[0]
    : {
        id: 'dsg_1',
        designerId: designerProfile.id,
        designerName: designerProfile.name,
        designerAvatar: designerProfile.avatar,
        title: 'Asymmetric Cashmere Blazer & Pleated Trousers',
        collection: 'Autumn Monochromatic 2026',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        rating: 4.94,
        votesCount: 890,
        occasion: 'Work' as const,
        palette: ['#1E293B', '#CBD5E1', '#0F172A'],
        price: 340,
        inStock: true,
        createdAt: '2026-07-15',
      };

  // Recent Activity Feed mock
  const recentActivities = [
    {
      id: 'act_1',
      icon: Sparkles,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Published New Design',
      description: 'Sculptural Silk Midi Dress in Midnight Rose added to Resort Elegance collection',
      timestamp: '2 hours ago',
    },
    {
      id: 'act_2',
      icon: Award,
      iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Leaderboard Ranking Milestone',
      description: 'Asymmetric Cashmere Blazer reached #1 Top Rated on Community Merit Board',
      timestamp: '5 hours ago',
    },
    {
      id: 'act_3',
      icon: FolderPlus,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Created New Collection',
      description: 'Initialized "Resort Elegance 2026" with 4 preliminary color palettes',
      timestamp: 'Yesterday',
    },
    {
      id: 'act_4',
      icon: Star,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Received 45 New 5-Star Ratings',
      description: 'Community members rated your tailoring silhouette & fabric drape',
      timestamp: 'Yesterday',
    },
    {
      id: 'act_5',
      icon: Eye,
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      title: 'Portfolio Impressions Threshold',
      description: 'Your creative showcase passed 140,000 total verified impressions',
      timestamp: '3 days ago',
    },
  ];

  // Trending Styles relevant for Designers
  const trendingStyles = [
    {
      id: 'trend_1',
      title: 'Minimalist Sculptural Tailoring',
      description: 'Clean architectural blazers, padded shoulders, and asymmetric lapels in monochrome tones.',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
      growth: '+94% Search Interest',
      tag: 'Tailoring & Outerwear',
    },
    {
      id: 'trend_2',
      title: 'Avant-Garde Organic Denim',
      description: 'Raw Japanese denim paired with tech utility pockets and relaxed cocoon trousers.',
      imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=400&q=80',
      growth: '+82% Community Vote',
      tag: 'Streetwear & Denim',
    },
    {
      id: 'trend_3',
      title: 'Fluid Silk Resortwear',
      description: 'Bias-cut gowns, cowl necklines, and emerald jewel tones engineered for fluid drape.',
      imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=400&q=80',
      growth: '+76% Engagement',
      tag: 'Evening & Resort',
    },
    {
      id: 'trend_4',
      title: 'Monochrome Noir & Gold Accents',
      description: 'High-contrast black velvet and satin peaked lapels featuring metallic hardware.',
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      growth: '+88% Saved Wishlist',
      tag: 'Formal & Gala',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. DASHBOARD HEADER */}
      <div className="glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-500/5 bg-surface-theme/90 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <img
              src={designerProfile.avatar}
              alt={designerProfile.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20 flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
                  Welcome back, <span className="gradient-text-gold">{designerProfile.name}</span>
                </h1>
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-theme-secondary mt-1">
                Manage your designs, collections and creative portfolio.
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-theme-muted font-mono">
                <span>{designerProfile.handle}</span>
                <span>•</span>
                <span className="text-purple-300 font-semibold">{designerProfile.followers.toLocaleString()} Followers</span>
                <span>•</span>
                <span className="text-amber-300 font-semibold">{designerProfile.avgRating} ★ Rating</span>
              </div>
            </div>
          </div>

          {/* Quick Header Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Design</span>
            </button>
            <button
              onClick={() => onNavigateTab('showcase')}
              className="px-4 py-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>View Portfolio</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. KEY STATISTICS CARDS (6 Metrics Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Metric 1: Total Designs */}
        <div className="glass-card rounded-2xl p-4.5 space-y-2 bg-surface-theme/80 backdrop-blur-md border border-theme-main hover:border-purple-500/40 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Total Designs</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-theme-heading font-mono">{totalDesignsCount}</div>
          <div className="text-[10px] text-purple-400 font-semibold">+3 created this month</div>
        </div>

        {/* Metric 2: Active Collections */}
        <div className="glass-card rounded-2xl p-4.5 space-y-2 bg-surface-theme/80 backdrop-blur-md border border-theme-main hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Active Collections</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-theme-heading font-mono">{activeCollectionsCount}</div>
          <div className="text-[10px] text-theme-muted">Spring/Autumn 2026</div>
        </div>

        {/* Metric 3: Draft Designs */}
        <div className="glass-card rounded-2xl p-4.5 space-y-2 bg-surface-theme/80 backdrop-blur-md border border-theme-main hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Draft Designs</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <FileEdit className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">{draftDesignsCount} Drafts</div>
          <div className="text-[10px] text-theme-muted">In concept development</div>
        </div>

        {/* Metric 4: Published Designs */}
        <div className="glass-card rounded-2xl p-4.5 space-y-2 bg-surface-theme/80 backdrop-blur-md border border-theme-main hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Published Designs</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{publishedDesignsCount} Live</div>
          <div className="text-[10px] text-emerald-400 font-semibold">100% merit verified</div>
        </div>

        {/* Metric 5: Portfolio Views */}
        <div className="glass-card rounded-2xl p-4.5 space-y-2 bg-surface-theme/80 backdrop-blur-md border border-theme-main hover:border-blue-500/40 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Portfolio Views</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-theme-heading font-mono">{totalPortfolioViews}</div>
          <div className="text-[10px] text-blue-400 font-semibold">↑ 18.4% impressions</div>
        </div>

        {/* Metric 6: Design Likes / Votes */}
        <div className="glass-card rounded-2xl p-4.5 space-y-2 bg-surface-theme/80 backdrop-blur-md border border-theme-main hover:border-rose-500/40 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Likes / Votes</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
              <Star className="w-4 h-4 fill-rose-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{totalLikesVotes.toLocaleString()}</div>
          <div className="text-[10px] text-rose-300 font-semibold">Avg Rating 4.92 ★</div>
        </div>

      </div>

      {/* 3. MOST POPULAR DESIGN & 5. RECENT ACTIVITY (Main Content Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Most Popular Design (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-[2rem] p-6 sm:p-8 space-y-5 border border-theme-main shadow-xl bg-surface-theme/90 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-theme-subtle">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Spotlight Feature</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-theme-heading">Most Popular Design</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              Rank #1 Merit Leaderboard
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* Design Image Spotlight */}
            <div className="sm:col-span-5 h-64 rounded-2xl overflow-hidden relative border border-theme-main group">
              <img
                src={mostPopularDesign.imageUrl}
                alt={mostPopularDesign.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 bg-surface-theme/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-theme-main">
                {mostPopularDesign.occasion}
              </div>
            </div>

            {/* Design Details */}
            <div className="sm:col-span-7 space-y-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider mb-1">
                  Collection: {mostPopularDesign.collection}
                </div>
                <h3 className="font-serif font-bold text-xl text-theme-heading leading-tight">
                  {mostPopularDesign.title}
                </h3>
                <div className="text-xs text-theme-muted mt-1">Category: Tailored Outerwear & Suits</div>
              </div>

              {/* Stats Matrix */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-surface-theme rounded-2xl border border-theme-main text-xs">
                <div>
                  <div className="text-theme-muted text-[10px]">Rating Score</div>
                  <div className="font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{mostPopularDesign.rating} / 5.0</span>
                  </div>
                </div>
                <div>
                  <div className="text-theme-muted text-[10px]">Total Votes</div>
                  <div className="font-bold text-theme-heading font-mono mt-0.5">{mostPopularDesign.votesCount} Votes</div>
                </div>
                <div>
                  <div className="text-theme-muted text-[10px]">Estimated Price</div>
                  <div className="font-bold text-emerald-400 font-mono mt-0.5">${mostPopularDesign.price}</div>
                </div>
                <div>
                  <div className="text-theme-muted text-[10px]">Status</div>
                  <div className="font-bold text-purple-300 mt-0.5">Published & Featured</div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedDesignModal(mostPopularDesign)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>View Design Details & Palette</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. Recent Activity Timeline (Right 5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-[2rem] p-6 space-y-4 border border-theme-main shadow-xl bg-surface-theme/90 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-theme-subtle">
              <h2 className="text-lg font-serif font-bold text-theme-heading flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Recent Activity</span>
              </h2>
              <span className="text-[10px] font-mono text-theme-muted">Real-time Feed</span>
            </div>

            <div className="space-y-3 pt-2">
              {recentActivities.map((act) => {
                const IconComp = act.icon;
                return (
                  <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-2xl bg-surface-subtle-theme/70 border border-theme-subtle transition-colors">
                    <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${act.iconColor}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-theme-heading truncate">{act.title}</div>
                        <span className="text-[9px] text-theme-muted font-mono flex-shrink-0 ml-1">{act.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-theme-muted line-clamp-1 mt-0.5">{act.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-theme-subtle flex items-center justify-between text-xs text-theme-muted">
            <span>Automatic Sync Enabled</span>
            <span className="text-purple-300 font-semibold">5 items logged</span>
          </div>
        </div>

      </div>

      {/* 4. RECENT DESIGNS & 6. TRENDING STYLES (Design Content Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Designs Gallery (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-[2rem] p-6 space-y-5 border border-theme-main shadow-xl bg-surface-theme/90 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-theme-subtle">
            <div>
              <h2 className="text-lg font-serif font-bold text-theme-heading">Recent Designs</h2>
              <p className="text-xs text-theme-muted">Your latest creations submitted to the storefront catalog</p>
            </div>
            <button
              onClick={() => onNavigateTab('showcase')}
              className="text-xs text-purple-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Designs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {designs.slice(0, 4).map((design) => (
              <div
                key={design.id}
                className="glass-card rounded-2xl p-3 border border-theme-main flex flex-col justify-between group hover:border-purple-400/40 transition-all cursor-pointer"
                onClick={() => setSelectedDesignModal(design)}
              >
                <div className="h-44 rounded-xl overflow-hidden relative bg-surface-theme mb-3">
                  <img
                    src={design.imageUrl}
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-theme/90 border border-theme-main text-emerald-300 backdrop-blur-md">
                    Published
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-purple-300 uppercase font-semibold">{design.collection}</div>
                  <h4 className="font-serif font-bold text-xs text-theme-heading line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {design.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-theme-subtle">
                    <div className="flex items-center gap-1 text-amber-300 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{design.rating}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">${design.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Trending Styles (Right 5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-[2rem] p-6 space-y-4 border border-theme-main shadow-xl bg-surface-theme/90 backdrop-blur-xl">
          <div className="border-b border-theme-subtle pb-3">
            <h2 className="text-lg font-serif font-bold text-theme-heading flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Trending Fashion Styles</span>
            </h2>
            <p className="text-xs text-theme-muted">Creative market trends for portfolio inspiration</p>
          </div>

          <div className="space-y-3 pt-1">
            {trendingStyles.map((style) => (
              <div key={style.id} className="p-3 rounded-2xl bg-surface-theme border border-theme-main flex items-center gap-3 hover:border-emerald-400/30 transition-all">
                <img src={style.imageUrl} alt={style.title} className="w-12 h-14 object-cover rounded-xl border border-theme-subtle flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-purple-300">{style.tag}</span>
                    <span className="text-[10px] font-bold text-emerald-400">{style.growth}</span>
                  </div>
                  <h4 className="font-serif font-bold text-xs text-theme-heading truncate mt-0.5">{style.title}</h4>
                  <p className="text-[10px] text-theme-muted line-clamp-1 mt-0.5">{style.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Inspect Design Modal */}
      {selectedDesignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-theme-main pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Design Overview</span>
                <h3 className="text-xl font-serif font-bold text-theme-heading">{selectedDesignModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDesignModal(null)}
                className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4">
              <img src={selectedDesignModal.imageUrl} alt={selectedDesignModal.title} className="w-32 h-44 object-cover rounded-2xl border border-theme-main" />
              <div className="space-y-2 text-xs flex-1">
                <div>
                  <span className="text-theme-muted">Designer:</span>
                  <span className="font-bold text-theme-heading ml-1">{selectedDesignModal.designerName}</span>
                </div>
                <div>
                  <span className="text-theme-muted">Collection:</span>
                  <span className="text-purple-300 font-semibold ml-1">{selectedDesignModal.collection}</span>
                </div>
                <div>
                  <span className="text-theme-muted">Occasion:</span>
                  <span className="text-amber-300 font-semibold ml-1">{selectedDesignModal.occasion}</span>
                </div>
                <div>
                  <span className="text-theme-muted">Community Votes:</span>
                  <span className="text-theme-heading font-mono font-bold ml-1">{selectedDesignModal.votesCount} Votes</span>
                </div>
                <div>
                  <span className="text-theme-muted">Price Rationale:</span>
                  <span className="text-emerald-400 font-bold font-mono ml-1">${selectedDesignModal.price}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-theme-main">
              <div className="text-xs font-semibold text-theme-secondary">Dominant Palette (K-Means Extracted):</div>
              <div className="flex gap-2">
                {selectedDesignModal.palette.map((hex, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-xl bg-surface-theme border border-theme-main text-[10px] font-mono">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: hex }} />
                    <span>{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-theme-main">
              <button
                onClick={() => setSelectedDesignModal(null)}
                className="flex-1 bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Close Details
              </button>
              <button
                onClick={() => {
                  onSelectProduct({
                    id: selectedDesignModal.id,
                    title: selectedDesignModal.title,
                    brand: selectedDesignModal.designerName,
                    category: selectedDesignModal.collection,
                    price: selectedDesignModal.price,
                    imageUrl: selectedDesignModal.imageUrl,
                    colors: selectedDesignModal.palette,
                    silhouette: selectedDesignModal.occasion,
                    retailer: 'Direct Designer Storefront',
                    affiliateUrl: '#',
                  });
                  setSelectedDesignModal(null);
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
              >
                Inspect Commerce Stock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
