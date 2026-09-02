import React, { useState, useEffect } from 'react';
import type { ColorCombo, OutfitLook } from '../../types/fashion';
import {
  Palette,
  Video,
  Cpu,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Heart,
  X,
  Sparkles,
} from 'lucide-react';

export const AdminSocialAndAiView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'colors' | 'social' | 'ai-logs'>('colors');
  const [colorCombos, setColorCombos] = useState<ColorCombo[]>([]);
  const [socialFeed, setSocialFeed] = useState<OutfitLook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Color Combo Modal State
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);
  const [comboTitle, setComboTitle] = useState('');
  const [comboOccasion, setComboOccasion] = useState('Work');
  const [color1, setColor1] = useState('#1E293B');
  const [color2, setColor2] = useState('#FDFBF7');
  const [color3, setColor3] = useState('#D97706');

  // Social Look Modal State
  const [isSocialModalOpen, setIsSocialModalOpen] = useState<boolean>(false);
  const [feedTitle, setFeedTitle] = useState('');
  const [feedOccasion, setFeedOccasion] = useState('Casual');
  const [videoThumbnail, setVideoThumbnail] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'colors') {
        const res = await fetch('/api/color-combos');
        if (!res.ok) throw new Error('Failed to load color combinations');
        const data = await res.json();
        setColorCombos(data);
      } else if (activeSubTab === 'social') {
        const res = await fetch('/api/social-feed');
        if (!res.ok) throw new Error('Failed to load social feed');
        const data = await res.json();
        setSocialFeed(data);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColorCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/color-combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: comboTitle,
          occasion: comboOccasion,
          subType: 'Admin Palette',
          colors: [
            { name: 'Primary Accent', hex: color1 },
            { name: 'Secondary Base', hex: color2 },
            { name: 'Highlight', hex: color3 },
          ],
        }),
      });

      if (!res.ok) throw new Error('Failed to create color combination');
      showNotification('success', 'Color combination palette published successfully!');
      setIsColorModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error creating palette');
    }
  };

  const handleVoteColorCombo = async (id: string, dir: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/color-combos/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: dir }),
      });
      if (!res.ok) throw new Error('Failed to vote');
      showNotification('success', 'Vote registered successfully.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error voting');
    }
  };

  const handleCreateOutfitLook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/social-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: feedTitle,
          occasion: feedOccasion,
          videoThumbnail: videoThumbnail || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
        }),
      });

      if (!res.ok) throw new Error('Failed to post outfit look');
      showNotification('success', 'Outfit look published to Social Feed!');
      setIsSocialModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error creating post');
    }
  };

  const handleToggleLikeLook = async (id: string) => {
    try {
      const res = await fetch(`/api/social-feed/${id}/like`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to like post');
      showNotification('success', 'Like status updated.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error liking post');
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Social Arena & AI Engine Management</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-theme-heading">Color Arena, Social Feed & AI Analytics</h1>
          <p className="text-xs text-theme-muted">
            Moderate community color combinations, publish social video feed posts, and monitor AI spectral analysis requests.
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
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="bg-surface-theme border border-theme-main rounded-2xl p-2 flex items-center gap-2 w-fit">
        <button
          onClick={() => setActiveSubTab('colors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'colors'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Color Palettes ({colorCombos.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('social')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'social'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Social Video Feed ({socialFeed.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai-logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'ai-logs'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Request Analytics Log</span>
        </button>
      </div>

      {/* TAB 1: COLOR PALETTES */}
      {activeSubTab === 'colors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-theme-heading">Community Color Combinations</h3>
            <button
              onClick={() => {
                setComboTitle('Midnight Navy + Silk Cream + Warm Tan');
                setComboOccasion('Work');
                setIsColorModalOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Color Palette</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 py-12 text-center text-theme-muted">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                Loading color combinations...
              </div>
            ) : (
              colorCombos.map((combo) => (
                <div key={combo.id} className="bg-surface-theme border border-theme-main rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase">
                      {combo.occasion}
                    </span>
                    <span className="text-xs text-amber-400 font-bold">{combo.rating}★ ({combo.votesCount} votes)</span>
                  </div>

                  <h4 className="font-serif font-bold text-theme-heading text-base">{combo.title}</h4>

                  {/* Swatches */}
                  <div className="flex gap-2">
                    {combo.colors?.map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 h-12 rounded-xl border border-theme-main flex flex-col justify-end p-1.5 shadow-inner"
                        style={{ backgroundColor: c.hex }}
                      >
                        <span className="text-[9px] font-mono font-bold text-white drop-shadow">{c.hex}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-theme-main">
                    <button
                      onClick={() => handleVoteColorCombo(combo.id, 'up')}
                      className="px-3 py-1.5 rounded-xl bg-surface-subtle-theme hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Upvote</span>
                    </button>
                    <span className="text-xs text-theme-muted font-bold">Score: {combo.trendingScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL VIDEO FEED */}
      {activeSubTab === 'social' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-theme-heading">Social Outfit Posts</h3>
            <button
              onClick={() => {
                setFeedTitle('Styling Navy & Cream for 9-to-5 to Evening ✨');
                setFeedOccasion('Work');
                setVideoThumbnail('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80');
                setIsSocialModalOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Outfit Post</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 py-12 text-center text-theme-muted">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                Loading social feed...
              </div>
            ) : (
              socialFeed.map((look) => (
                <div key={look.id} className="bg-surface-theme border border-theme-main rounded-3xl overflow-hidden shadow-xl space-y-3 p-4">
                  <img
                    src={look.videoThumbnail}
                    alt={look.title}
                    className="w-full h-52 object-cover rounded-2xl border border-theme-main"
                  />
                  <div className="flex items-center gap-2">
                    <img src={look.creatorAvatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80'} alt="" className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-theme-heading">{look.creatorName}</div>
                      <div className="text-[10px] text-amber-400">{look.creatorHandle}</div>
                    </div>
                  </div>

                  <h4 className="font-serif font-bold text-theme-heading text-sm">{look.title}</h4>

                  <div className="flex items-center justify-between pt-2 border-t border-theme-main">
                    <button
                      onClick={() => handleToggleLikeLook(look.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        look.userLiked
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-surface-subtle-theme border-theme-main text-theme-muted'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${look.userLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{look.likes} Likes</span>
                    </button>
                    <span className="text-xs text-theme-muted font-bold">{look.reshares} Reshares</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AI REQUEST LOGS */}
      {activeSubTab === 'ai-logs' && (
        <div className="bg-surface-theme border border-theme-main rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Cpu className="w-5 h-5" />
            <span>PostgreSQL `AiAnalysisRequest` Execution Logs</span>
          </div>

          <p className="text-xs text-theme-muted">
            All AI recommendations and spectral photo analysis operations executed by users are automatically logged in PostgreSQL table <code className="text-amber-300">AiAnalysisRequest</code>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
            <div className="bg-modal-theme p-4 rounded-2xl border border-theme-main space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Rule-Based Spectral Match Engine</span>
              </div>
              <p className="text-xs text-theme-muted">
                Calculates skin tone contrast, undertone harmony scores (94%-98%), and anatomical fit ratios.
              </p>
            </div>

            <div className="bg-modal-theme p-4 rounded-2xl border border-theme-main space-y-2">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Live AI API Integration Slot</span>
              </div>
              <p className="text-xs text-theme-muted">
                Configured to accept <code className="text-amber-300">AI_PROVIDER</code> or Gemini API keys for real-time generative vision analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Color Combo Modal */}
      {isColorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setIsColorModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme text-theme-muted">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-serif font-bold text-theme-heading">Create Color Palette</h3>
            <form onSubmit={handleCreateColorCombo} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Palette Title"
                value={comboTitle}
                onChange={(e) => setComboTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              />
              <div className="grid grid-cols-3 gap-2">
                <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                <input type="color" value={color3} onChange={(e) => setColor3(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">
                  Create Palette
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Post Modal */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setIsSocialModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme text-theme-muted">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-serif font-bold text-theme-heading">Publish Social Outfit Post</h3>
            <form onSubmit={handleCreateOutfitLook} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Post Title"
                value={feedTitle}
                onChange={(e) => setFeedTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              />
              <input
                type="text"
                placeholder="Thumbnail Image URL"
                value={videoThumbnail}
                onChange={(e) => setVideoThumbnail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
