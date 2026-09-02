import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../types/fashion';
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit2,
  X,
  Sparkles,
  Ruler,
  Palette,
  Check,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [skinTone, setSkinTone] = useState<string>('Warm Golden');
  const [undertone, setUndertone] = useState<string>('Warm');
  const [hairColor, setHairColor] = useState<string>('Warm Chestnut Brown');
  const [bodyShape, setBodyShape] = useState<string>('Hourglass');
  const [heightCm, setHeightCm] = useState<string>('172');
  const [chestCm, setChestCm] = useState<string>('88');
  const [waistCm, setWaistCm] = useState<string>('68');
  const [hipsCm, setHipsCm] = useState<string>('94');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to load user profile');
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenEdit = () => {
    if (!profile) return;
    setName(profile.name);
    setSkinTone(profile.skinTone);
    setUndertone(profile.undertone);
    setHairColor(profile.hairColor);
    setBodyShape(profile.bodyShape);
    setHeightCm(profile.measurements?.heightCm?.toString() || '172');
    setChestCm(profile.measurements?.chestCm?.toString() || '88');
    setWaistCm(profile.measurements?.waistCm?.toString() || '68');
    setHipsCm(profile.measurements?.hipsCm?.toString() || '94');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedData: Partial<UserProfile> = {
        name,
        skinTone,
        undertone,
        hairColor,
        bodyShape,
        measurements: {
          heightCm: Number(heightCm) || 170,
          chestCm: Number(chestCm) || 85,
          waistCm: Number(waistCm) || 68,
          hipsCm: Number(hipsCm) || 94,
        },
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const resData = await res.json();

      setProfile(resData.profile || resData);
      showNotification('success', 'User profile parameters updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating profile');
    } finally {
      setSaving(false);
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
            <Users className="w-3.5 h-3.5" />
            <span>User Profiles & Onboarding Database</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-theme-heading">User Profile Control Panel</h1>
          <p className="text-xs text-theme-muted">
            View customer spectral color parameters, anatomical measurements, style vibes, and onboarding completion records.
          </p>
        </div>

        <button
          onClick={fetchProfile}
          className="p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Profile</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-theme border border-theme-main rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-theme-muted" />
          <input
            type="text"
            placeholder="Search profile name, skin tone, shape..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 transition-all"
          />
        </div>
      </div>

      {/* Main Profile Display Card */}
      {loading ? (
        <div className="bg-surface-theme border border-theme-main rounded-3xl p-12 text-center text-theme-muted">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
          <span>Loading user profile parameters from PostgreSQL database...</span>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="bg-surface-theme border border-theme-main rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar || profile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={profile.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg"
              />
              <div className="space-y-1 flex-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  Active Customer Profile
                </span>
                <h3 className="text-xl font-serif font-bold text-theme-heading">{profile.name}</h3>
                <div className="text-xs text-theme-muted font-mono">ID: {profile.id}</div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-theme-main">
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Skin Tone:</span>
                </span>
                <span className="font-bold text-theme-heading">{profile.skinTone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted">Undertone:</span>
                <span className="font-bold text-amber-300">{profile.undertone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted">Hair Color:</span>
                <span className="font-bold text-theme-heading">{profile.hairColor}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-cyan-400" />
                  <span>Body Shape:</span>
                </span>
                <span className="font-bold text-cyan-300">{profile.bodyShape}</span>
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit User Profile Attributes</span>
            </button>
          </div>

          {/* Anatomical Measurements */}
          <div className="bg-surface-theme border border-theme-main rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Ruler className="w-5 h-5" />
              <span>Anatomical Measurements</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-modal-theme p-4 rounded-2xl border border-theme-main space-y-1">
                <span className="text-[10px] uppercase font-bold text-theme-muted">Height</span>
                <div className="text-xl font-bold text-amber-300">{profile.measurements?.heightCm || 172} cm</div>
              </div>
              <div className="bg-modal-theme p-4 rounded-2xl border border-theme-main space-y-1">
                <span className="text-[10px] uppercase font-bold text-theme-muted">Chest</span>
                <div className="text-xl font-bold text-cyan-300">{profile.measurements?.chestCm || 88} cm</div>
              </div>
              <div className="bg-modal-theme p-4 rounded-2xl border border-theme-main space-y-1">
                <span className="text-[10px] uppercase font-bold text-theme-muted">Waist</span>
                <div className="text-xl font-bold text-emerald-300">{profile.measurements?.waistCm || 68} cm</div>
              </div>
              <div className="bg-modal-theme p-4 rounded-2xl border border-theme-main space-y-1">
                <span className="text-[10px] uppercase font-bold text-theme-muted">Hips</span>
                <div className="text-xl font-bold text-purple-300">{profile.measurements?.hipsCm || 94} cm</div>
              </div>
            </div>

            <div className="pt-4 border-t border-theme-main space-y-2">
              <span className="text-xs font-semibold text-theme-secondary">Onboarding Status:</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300">Onboarding Completed</span>
              </div>
            </div>
          </div>

          {/* Style Preferences & Vibes */}
          <div className="bg-surface-theme border border-theme-main rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              <span>Style Preferences & Occasions</span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-theme-secondary">Selected Occasions:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.selectedOccasions?.map((occ) => (
                    <span
                      key={occ}
                      className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold"
                    >
                      {occ}
                    </span>
                  )) || <span className="text-xs text-theme-muted">None specified</span>}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-theme-secondary">Style Vibes:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.styleVibes?.map((vibe) => (
                    <span
                      key={vibe}
                      className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
                    >
                      {vibe}
                    </span>
                  )) || <span className="text-xs text-theme-muted">None specified</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-theme border border-theme-main rounded-3xl p-12 text-center text-theme-muted">
          No profile found in the database.
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-bold text-theme-heading">Edit Profile Parameters</h3>
              <p className="text-xs text-theme-muted">
                Update customer skin tone, undertones, body shape, and anatomical measurements.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Skin Tone</label>
                  <select
                    value={skinTone}
                    onChange={(e) => setSkinTone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="Warm Golden">Warm Golden</option>
                    <option value="Cool Rose">Cool Rose</option>
                    <option value="Deep Rich">Deep Rich</option>
                    <option value="Olive Neutral">Olive Neutral</option>
                    <option value="Fair Porcelain">Fair Porcelain</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Undertone</label>
                  <select
                    value={undertone}
                    onChange={(e) => setUndertone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="Warm">Warm</option>
                    <option value="Cool">Cool</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Hair Color</label>
                  <input
                    type="text"
                    value={hairColor}
                    onChange={(e) => setHairColor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Body Shape</label>
                  <select
                    value={bodyShape}
                    onChange={(e) => setBodyShape(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    <option value="Hourglass">Hourglass</option>
                    <option value="Rectangle">Rectangle</option>
                    <option value="Inverted Triangle">Inverted Triangle</option>
                    <option value="Pear">Pear</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-theme-main">
                <span className="text-xs font-bold text-amber-400">Measurements (cm)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-theme-muted">Height</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-theme-muted">Chest</label>
                    <input
                      type="number"
                      value={chestCm}
                      onChange={(e) => setChestCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-theme-muted">Waist</label>
                    <input
                      type="number"
                      value={waistCm}
                      onChange={(e) => setWaistCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-theme-muted">Hips</label>
                    <input
                      type="number"
                      value={hipsCm}
                      onChange={(e) => setHipsCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
