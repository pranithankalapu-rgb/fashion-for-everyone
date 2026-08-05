import React, { useState, useEffect } from 'react';
import { Award, Star, Upload, UserPlus, ShoppingCart, BarChart3, CheckCircle2 } from 'lucide-react';
import type { Designer, Design, RetailProduct } from '../types/fashion';
import { DESIGNERS, DESIGNS } from '../data/fashionData';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface DesignerShowcaseProps {
  onSelectProduct: (product: RetailProduct) => void;
  userRole: 'individual' | 'designer' | 'retailer';
}

export const DesignerShowcaseView: React.FC<DesignerShowcaseProps> = ({
  onSelectProduct,
}) => {
  const [designers, setDesigners] = useState<Designer[]>(DESIGNERS);
  const [designs, setDesigns] = useState<Design[]>(DESIGNS);
  const [activeTab, setActiveTab] = useState<'frontpage' | 'designers' | 'analytics'>('frontpage');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [followedDesigners, setFollowedDesigners] = useState<{ [key: string]: boolean }>({ des_1: true });

  // New design form state
  const [title, setTitle] = useState('');
  const [collection, setCollection] = useState('Autumn Monochromatic 2026');
  const [price, setPrice] = useState(340);
  const [occasion, setOccasion] = useState<'Work' | 'Casual' | 'Date night' | 'Formal'>('Work');
  const [imgUrl, setImgUrl] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80');

  useEffect(() => {
    async function loadData() {
      try {
        const [dList, desList] = await Promise.all([
          api.getDesigners(),
          api.getDesigns(),
        ]);
        setDesigners(dList);
        setDesigns(desList);
      } catch (err) {
        console.error('Error loading designers/designs:', err);
      }
    }
    loadData();
  }, []);

  const handleToggleFollow = (desId: string) => {
    setFollowedDesigners((prev) => {
      const isFollowing = !prev[desId];
      setDesigners((dList) =>
        dList.map((d) => (d.id === desId ? { ...d, followers: d.followers + (isFollowing ? 1 : -1) } : d))
      );
      return { ...prev, [desId]: isFollowing };
    });
  };

  const handleVoteDesign = async (designId: string, rating: number) => {
    confetti({ particleCount: 40, spread: 50 });
    try {
      const updated = await api.voteDesign(designId, rating);
      setDesigns((prev) => prev.map((d) => (d.id === designId ? updated : d)));
    } catch (err) {
      console.error('Error voting on design:', err);
    }
  };

  const handleUploadDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const created = await api.createDesign({
        title,
        collection,
        price,
        occasion,
        imageUrl: imgUrl,
        palette: ['#1E293B', '#CBD5E1', '#0F172A'],
      });

      setDesigns([created, ...designs]);
      setIsUploadOpen(false);
      setTitle('');
      confetti({ particleCount: 70, spread: 80 });
    } catch (err) {
      console.error('Error uploading design:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Merit-Based Storefront & Leaderboards</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-theme-heading tracking-tight">
              Designer <span className="gradient-text-gold">Showcase & Front Page</span>
            </h1>
            <p className="text-sm text-theme-secondary">
              No paid placement. Front-page eligibility is calculated by nightly job (Min 50 votes AND Avg Rating ≥ 4.2). Monthly leaderboard resets ensure emerging talent gets a fair shot.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-xl shadow-purple-500/20 text-xs transition-all hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Collection Design</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-theme-main pb-4">
        <div className="flex items-center gap-1 bg-surface-theme p-1.5 rounded-2xl border border-theme-main">
          <button
            onClick={() => setActiveTab('frontpage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'frontpage'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            Front Page Designs (Merit Ranked)
          </button>

          <button
            onClick={() => setActiveTab('designers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'designers'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            Top Designer Leaderboard
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Designer Analytics Portal</span>
          </button>
        </div>

        <div className="text-xs text-theme-muted hidden sm:block">
          Monthly Leaderboard Reset: <strong className="text-amber-800 dark:text-amber-400">28 Days Left</strong>
        </div>
      </div>

      {/* Front Page Designs Tab */}
      {activeTab === 'frontpage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div key={design.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
              
              <div className="relative h-72 overflow-hidden group">
                <img
                  src={design.imageUrl}
                  alt={design.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Designer Pill Header */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-center bg-surface-theme/90 backdrop-blur-md p-2 rounded-2xl border border-theme-main">
                  <div className="flex items-center gap-2">
                    <img src={design.designerAvatar} alt={design.designerName} className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-xs font-bold text-theme-heading">{design.designerName}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                    {design.occasion}
                  </span>
                </div>

                {/* Auto Extracted Color Palette Pill */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-surface-theme/90 backdrop-blur-md p-2 rounded-xl border border-theme-main">
                  <div className="text-[10px] text-theme-muted">Dominant Palette (K-Means):</div>
                  <div className="flex gap-1.5">
                    {design.palette.map((hex, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-theme-main" style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">{design.collection}</div>
                  <h3 className="font-serif font-bold text-lg text-theme-heading mt-1">{design.title}</h3>
                </div>

                <div className="bg-surface-theme p-3 rounded-2xl border border-theme-main flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-800 dark:text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{design.rating} ({design.votesCount} votes)</span>
                  </div>
                  <span className="text-theme-heading font-bold text-sm">${design.price}</span>
                </div>

                {/* Voting & Direct Purchase Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVoteDesign(design.id, 5)}
                    className="flex-1 bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-secondary hover:text-amber-300 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rate Design</span>
                  </button>

                  <button
                    onClick={() =>
                      onSelectProduct({
                        id: design.id,
                        title: design.title,
                        brand: design.designerName,
                        category: design.collection,
                        price: design.price,
                        imageUrl: design.imageUrl,
                        colors: design.palette,
                        silhouette: design.occasion,
                        retailer: 'Direct Designer Storefront',
                        affiliateUrl: '#',
                      })
                    }
                    className="flex-1 bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Buy Direct</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Designer Leaderboard Tab */}
      {activeTab === 'designers' && (
        <div className="space-y-4">
          {designers.map((designer, idx) => (
            <div key={designer.id} className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-theme border border-theme-main flex items-center justify-center font-serif font-bold text-lg text-amber-800 dark:text-amber-400">
                  #{idx + 1}
                </div>
                <img src={designer.avatar} alt={designer.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/30" />
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-theme-heading">{designer.name}</h3>
                    <span className="text-xs text-theme-muted">{designer.handle}</span>
                    {designer.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-theme-secondary max-w-lg mt-1">{designer.bio}</p>

                  <div className="flex items-center gap-2 mt-3">
                    {designer.badges.map((b) => (
                      <span
                        key={b}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          b === 'Top Rated' ? 'badge-top-rated' : b === 'Trending' ? 'badge-trending' : 'badge-new'
                        }`}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metrics & Follow Button */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-theme-main">
                <div className="text-right">
                  <div className="text-xs text-theme-muted">Average Rating</div>
                  <div className="text-lg font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 justify-end">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{designer.avgRating}</span>
                  </div>
                  <div className="text-[10px] text-theme-muted">{designer.totalVotes.toLocaleString()} votes</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-theme-muted">Followers</div>
                  <div className="text-lg font-bold text-theme-heading">{designer.followers.toLocaleString()}</div>
                </div>

                <button
                  onClick={() => handleToggleFollow(designer.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    followedDesigners[designer.id]
                      ? 'bg-surface-theme text-theme-heading border border-theme-main'
                      : 'bg-gradient-to-r from-purple-500 to-amber-500 text-slate-950 shadow-md shadow-purple-500/20'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{followedDesigners[designer.id] ? 'Following' : 'Follow Designer'}</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Designer Analytics Portal Tab */}
      {activeTab === 'analytics' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-theme-main pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-theme-heading">ClickHouse Analytics Dashboard</h2>
              <p className="text-xs text-theme-muted">Real-time rating breakdowns, demographic conversion, and revenue metrics for @ariavance.studio</p>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full">
              Live ClickHouse Stream
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface-theme p-5 rounded-2xl border border-theme-main space-y-1">
              <div className="text-xs text-theme-muted">Total Front-Page Impressions</div>
              <div className="text-2xl font-bold text-theme-heading">142,890</div>
              <div className="text-[10px] text-emerald-400">↑ 18.4% this month</div>
            </div>

            <div className="bg-surface-theme p-5 rounded-2xl border border-theme-main space-y-1">
              <div className="text-xs text-theme-muted">Community Rating Score</div>
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <span>4.92 / 5.0</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-[10px] text-theme-muted">3,210 verified community votes</div>
            </div>

            <div className="bg-surface-theme p-5 rounded-2xl border border-theme-main space-y-1">
              <div className="text-xs text-theme-muted">Direct Storefront Sales GMV</div>
              <div className="text-2xl font-bold text-emerald-400">$18,450.00</div>
              <div className="text-[10px] text-theme-muted">8% platform transaction fee applied</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload New Collection Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-theme-heading">Upload New Collection Item</h2>

            <form onSubmit={handleUploadDesign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Design Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sculptural Trench in Midnight Sand"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-sm text-theme-heading focus:border-purple-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Collection Name</label>
                <input
                  type="text"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-purple-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Price ($USD)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Occasion Tag</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value as any)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-purple-400 outline-none"
                  >
                    <option value="Work">Work</option>
                    <option value="Casual">Casual</option>
                    <option value="Date night">Date night</option>
                    <option value="Formal">Formal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Image URL</label>
                <input
                  type="url"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-purple-400 outline-none"
                />
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[11px] text-purple-200">
                ✨ Submitting triggers Lambda automated K-Means palette extraction & CLIP vector indexing.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-purple-500/20"
                >
                  Publish to Community Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
