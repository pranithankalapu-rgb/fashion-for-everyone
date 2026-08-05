import React, { useState, useEffect } from 'react';
import { Palette, Star, Plus, Flame, ShieldCheck } from 'lucide-react';
import type { ColorCombo, OccasionType } from '../types/fashion';
import { COLOR_COMBINATIONS } from '../data/fashionData';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export const ColorVotingView: React.FC = () => {
  const [combos, setCombos] = useState<ColorCombo[]>(COLOR_COMBINATIONS);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [isSubmitOpen, setIsSubmitOpen] = useState<boolean>(false);

  // New combo form state
  const [newTitle, setNewTitle] = useState('');
  const [newOccasion, setNewOccasion] = useState<OccasionType>('Work');
  const [newSubType, setNewSubType] = useState('Smart casual');
  const [hex1, setHex1] = useState('#1E293B');
  const [hex2, setHex2] = useState('#FDFBF7');
  const [hex3, setHex3] = useState('#D97706');

  useEffect(() => {
    async function loadCombos() {
      try {
        const data = await api.getColorCombos(selectedOccasion);
        setCombos(data);
      } catch (err) {
        console.error('Error loading color combos from API:', err);
      }
    }
    loadCombos();
  }, [selectedOccasion]);

  const filtered = combos.filter(
    (c) => selectedOccasion === 'All' || c.occasion === selectedOccasion
  );

  const handleVote = async (id: string, starRating: number) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    try {
      const updated = await api.voteColorCombo(id, 'up');
      setCombos((prev) => prev.map((c) => (c.id === id ? { ...updated, userVote: starRating } : c)));
    } catch (err) {
      console.error('Error casting vote:', err);
    }
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await api.createColorCombo({
        title: newTitle,
        occasion: newOccasion,
        subType: newSubType,
        colors: [
          { name: 'Color A', hex: hex1 },
          { name: 'Color B', hex: hex2 },
          { name: 'Color C', hex: hex3 },
        ],
        exampleImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
      });

      setCombos([created, ...combos]);
      setIsSubmitOpen(false);
      setNewTitle('');
      confetti({ particleCount: 70, spread: 80 });
    } catch (err) {
      console.error('Error submitting new combo:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <Palette className="w-3.5 h-3.5" />
              <span>Signature Community Intelligence Asset</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-theme-heading tracking-tight">
              Community <span className="gradient-text-rose">Color Voting Arena</span>
            </h1>
            <p className="text-sm text-theme-secondary">
              Rate color palettes for each occasion. Every vote updates the real-time Bayesian leaderboard and powers the AI styling engine for 10,000+ users.
            </p>
          </div>

          <button
            onClick={() => setIsSubmitOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-xl shadow-rose-500/20 text-xs transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Color Combo</span>
          </button>
        </div>
      </div>

      {/* Occasion Filter & Redis Deduplication Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-surface-theme p-1.5 rounded-2xl border border-theme-main overflow-x-auto max-w-full">
          {['All', 'Work', 'Casual', 'Date night', 'Formal', 'Party', 'Travel'].map((occ) => (
            <button
              key={occ}
              onClick={() => setSelectedOccasion(occ)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedOccasion === occ
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-theme border border-theme-main text-[11px] text-theme-secondary">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Anti-Fraud Active: 1 vote/user/combo/day</span>
        </div>
      </div>

      {/* Voting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((combo) => (
          <div key={combo.id} className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-6">
            
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-widest text-theme-muted bg-surface-subtle-theme px-2.5 py-1 rounded-full border border-theme-main">
                  {combo.occasion} • {combo.subType}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{combo.trendingScore} Trending</span>
                </span>
              </div>
              
              <h3 className="font-serif font-bold text-xl text-theme-heading mt-3">{combo.title}</h3>
            </div>

            {/* Color Palette Display */}
            <div className="space-y-2">
              <div className="h-16 rounded-2xl overflow-hidden flex shadow-inner border border-theme-main">
                {combo.colors.map((c, i) => (
                  <div
                    key={i}
                    className="h-full flex-1 flex flex-col justify-end p-2 transition-all hover:flex-[1.5]"
                    style={{ backgroundColor: c.hex }}
                  >
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-white truncate max-w-full inline-block">
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voting Metrics & Star Inputs */}
            <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-theme-heading text-sm">{combo.rating}</strong>
                  <span className="text-theme-muted">/ 5.0</span>
                </div>
                <span className="text-theme-muted">{combo.votesCount.toLocaleString()} votes</span>
              </div>

              {/* Interactive 5-Star Vote Picker */}
              <div className="pt-2 border-t border-theme-main flex items-center justify-between">
                <span className="text-[11px] text-theme-muted">Cast Your Vote:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleVote(combo.id, star)}
                      className="p-1 text-theme-muted hover:text-amber-400 hover:scale-125 transition-all"
                      title={`Rate ${star} Stars`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          (combo.userVote || 0) >= star ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              {combo.userVote && (
                <div className="text-[10px] text-emerald-400 font-semibold text-right">
                  ✓ Rated {combo.userVote} Stars today
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Modal: Submit New Color Combo */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-theme-heading">Propose New Color Combination</h2>

            <form onSubmit={handleCreateCombo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Combination Title</label>
                <input
                  type="text"
                  placeholder="e.g., Midnight Plum & Champagne Gold"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-sm text-theme-heading focus:border-rose-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Occasion</label>
                  <select
                    value={newOccasion}
                    onChange={(e) => setNewOccasion(e.target.value as any)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-rose-400 outline-none"
                  >
                    <option value="Work">Work</option>
                    <option value="Casual">Casual</option>
                    <option value="Date night">Date night</option>
                    <option value="Formal">Formal</option>
                    <option value="Party">Party</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Sub-Type</label>
                  <input
                    type="text"
                    value={newSubType}
                    onChange={(e) => setNewSubType(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-rose-400 outline-none"
                  />
                </div>
              </div>

              {/* Hex Color Swatch Pickers */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-theme-muted">Color Palette Swatches</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="color"
                    value={hex1}
                    onChange={(e) => setHex1(e.target.value)}
                    className="w-full h-10 rounded-xl border border-theme-main cursor-pointer bg-surface-theme"
                  />
                  <input
                    type="color"
                    value={hex2}
                    onChange={(e) => setHex2(e.target.value)}
                    className="w-full h-10 rounded-xl border border-theme-main cursor-pointer bg-surface-theme"
                  />
                  <input
                    type="color"
                    value={hex3}
                    onChange={(e) => setHex3(e.target.value)}
                    className="w-full h-10 rounded-xl border border-theme-main cursor-pointer bg-surface-theme"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-rose-500/20"
                >
                  Submit & Open Voting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
