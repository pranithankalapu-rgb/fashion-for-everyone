import React, { useState } from 'react';
import { X, Camera, Ruler, Sparkles, Check, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';
import type { UserProfile, OccasionType, StyleVibe } from '../types/fashion';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
}) => {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<UserProfile>({ ...userProfile });
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    skinTone: UserProfile['skinTone'];
    undertone: UserProfile['undertone'];
    hairColor: string;
    bodyShape: UserProfile['bodyShape'];
  } | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.analyzePhoto(profile.photoUrl || profile.avatar);
      setScanResult({
        skinTone: res.skinTone,
        undertone: res.undertone,
        hairColor: res.hairColor,
        bodyShape: res.bodyShape,
      });
      setProfile((prev) => ({
        ...prev,
        skinTone: res.skinTone,
        undertone: res.undertone,
        hairColor: res.hairColor,
        bodyShape: res.bodyShape,
      }));
    } catch (err) {
      console.error('Error analyzing photo:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleOccasion = (occ: OccasionType) => {
    setProfile((prev) => {
      const exists = prev.selectedOccasions.includes(occ);
      return {
        ...prev,
        selectedOccasions: exists
          ? prev.selectedOccasions.filter((o) => o !== occ)
          : [...prev.selectedOccasions, occ],
      };
    });
  };

  const handleToggleVibe = (vibe: StyleVibe) => {
    setProfile((prev) => {
      const exists = prev.styleVibes.includes(vibe);
      if (!exists && prev.styleVibes.length >= 3) return prev; // max 3
      return {
        ...prev,
        styleVibes: exists ? prev.styleVibes.filter((v) => v !== vibe) : [...prev.styleVibes, vibe],
      };
    });
  };

  const handleFinishOnboarding = async () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    const updated = { ...profile, completedOnboarding: true };
    try {
      await api.updateProfile(updated);
    } catch (err) {
      console.error('Error saving profile to API:', err);
    }
    onSaveProfile(updated);
    onClose();
  };

  const ALL_OCCASIONS: OccasionType[] = ['Work', 'Casual', 'Date night', 'Formal', 'Athletic', 'Party', 'Travel'];
  const ALL_VIBES: StyleVibe[] = ['Classic', 'Streetwear', 'Minimalist', 'Bold', 'Boho', 'Smart casual'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl shadow-amber-500/10 relative overflow-hidden text-theme-body">

        {/* Top Progress Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-main">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Progressive Onboarding • Step {step} of 5
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-theme-heading mt-1">
              {step === 1 && 'Photo & Tone Analysis'}
              {step === 2 && 'Body Profile & Measurements'}
              {step === 3 && 'Primary Occasions'}
              {step === 4 && 'Style Aesthetics'}
              {step === 5 && 'AI Styling Ready!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Photo & Tone Analysis */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-theme-secondary">
              Upload a selfie or capture via camera. Our computer vision model extracts your skin undertone, hair color, and body shape vector to surface color harmonies tailored to you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="relative group rounded-2xl overflow-hidden border border-theme-main bg-surface-theme aspect-square flex flex-col items-center justify-center p-4">
                <img
                  src={profile.photoUrl || profile.avatar}
                  alt="Profile"
                  className={`w-full h-full object-cover rounded-xl transition-all ${isScanning ? 'brightness-50 blur-sm' : ''}`}
                />
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                    <span className="text-xs font-semibold text-amber-300 animate-pulse">Extracting undertone vectors...</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleSimulateScan}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isScanning ? 'Analyzing Photo...' : 'Scan / Upload Photo'}</span>
                </button>

                {scanResult && (
                  <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs space-y-2 animate-fadeIn">
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Skin Tone:</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">{scanResult.skinTone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Undertone:</span>
                      <span className="font-bold text-rose-300">{scanResult.undertone} Palette</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Hair Tone:</span>
                      <span className="font-bold text-theme-secondary">{scanResult.hairColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Body Silhouette:</span>
                      <span className="font-bold text-emerald-300">{scanResult.bodyShape}</span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-theme-muted italic">
                  💡 Note: Photo analysis is optional and skippable. Your photos are encrypted with AES-256 and never shared with third parties.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Body Measurements */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-theme-secondary">
              Provide body measurements for fit-aware recommendations (relaxed vs structured cuts). All fields are optional.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={profile.measurements.heightCm}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      measurements: { ...profile.measurements, heightCm: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-sm text-theme-heading focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Chest / Bust (cm)</label>
                <input
                  type="number"
                  value={profile.measurements.chestCm}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      measurements: { ...profile.measurements, chestCm: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-sm text-theme-heading focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Waist (cm)</label>
                <input
                  type="number"
                  value={profile.measurements.waistCm}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      measurements: { ...profile.measurements, waistCm: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-sm text-theme-heading focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Hips (cm)</label>
                <input
                  type="number"
                  value={profile.measurements.hipsCm}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      measurements: { ...profile.measurements, hipsCm: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-sm text-theme-heading focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-theme border border-theme-main flex items-center gap-3">
              <Ruler className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-theme-secondary">
                Calculated Body Shape Profile: <strong className="text-amber-800 dark:text-amber-300">{profile.bodyShape}</strong>.
                This adjusts silhouette recommendations (e.g., tapered trousers vs structured blazers).
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Occasion Taxonomy */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-theme-secondary">
              Select the occasions you dress for most frequently. The AI engine weights community color voting results based on these categories.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_OCCASIONS.map((occ) => {
                const selected = profile.selectedOccasions.includes(occ);
                return (
                  <button
                    key={occ}
                    onClick={() => handleToggleOccasion(occ)}
                    className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${selected
                        ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-amber-400 text-slate-900 dark:text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-surface-theme border-theme-main text-theme-muted hover:border-amber-400/40 hover:text-theme-heading'
                      }`}
                  >
                    <span>{occ}</span>
                    {selected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Style Aesthetics */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-theme-secondary">
              Select up to 3 style vibes to tune your personal recommendations.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_VIBES.map((vibe) => {
                const selected = profile.styleVibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    onClick={() => handleToggleVibe(vibe)}
                    className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${selected
                        ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-amber-400 text-slate-900 dark:text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-surface-theme border-theme-main text-theme-muted hover:border-amber-400/40 hover:text-theme-heading'
                      }`}
                  >
                    <span>{vibe}</span>
                    {selected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Ready / Summary */}
        {step === 5 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-rose-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
              <Sparkles className="w-8 h-8 text-slate-950" />
            </div>

            <div>
              <h3 className="text-2xl font-serif font-bold text-theme-heading">Profile Configured!</h3>
              <p className="text-xs text-theme-secondary max-w-md mx-auto mt-2">
                Your AI styling matrix is active. You will now receive personalized outfit recommendations backed by community voting metrics.
              </p>
            </div>

            <div className="bg-surface-theme border border-theme-main rounded-2xl p-4 text-xs text-theme-secondary text-left max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-theme-muted">Skin Undertone:</span>
                <span className="text-amber-800 dark:text-amber-300 font-semibold">{profile.skinTone} ({profile.undertone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Body Silhouette:</span>
                <span className="text-amber-800 dark:text-amber-300 font-semibold">{profile.bodyShape}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Primary Occasions:</span>
                <span className="text-theme-heading font-semibold">{profile.selectedOccasions.join(', ') || 'All'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Style Vibes:</span>
                <span className="text-theme-heading font-semibold">{profile.styleVibes.join(', ') || 'Minimalist'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-theme-main">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading bg-surface-theme hover:bg-surface-subtle-theme transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading transition-all"
            >
              Skip Setup
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 text-slate-950 font-bold px-8 py-3 rounded-xl shadow-xl shadow-amber-500/25 text-sm transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore My AI Feed</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
