import React, { useState } from 'react';
import { Sparkles, X, RefreshCw, Wand2 } from 'lucide-react';
import { api } from '../services/api';
import type { RetailProduct } from '../types/fashion';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: RetailProduct | null;
}

export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [photoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [tryOnResult, setTryOnResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerateTryOn = async () => {
    setIsGenerating(true);
    try {
      const res = await api.virtualTryOn({
        userPhotoUrl: photoUrl,
        garmentId: product?.id,
        garmentUrl: product?.imageUrl,
      });
      setTryOnResult(res.job);
    } catch (err) {
      console.error('Try-on error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Next-Gen Virtual Try-On (VTON) Engine</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-100">
              Photorealistic Garment Simulation
            </h2>
            <p className="text-xs text-slate-400">
              Simulate draping, proportions, and silhouette alignment on your personal photo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Garment Details */}
        {product && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center gap-4">
            <img src={product.imageUrl} alt={product.title} className="w-14 h-14 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Selected Garment
              </span>
              <h4 className="text-sm font-semibold text-slate-100 truncate">{product.title}</h4>
              <p className="text-xs text-slate-400">
                {product.brand} • ${product.price}
              </p>
            </div>
          </div>
        )}

        {/* Visualization Grid: Input Photo vs Result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>1. Your Reference Portrait</span>
            </label>
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[3/4] group">
              <img src={photoUrl} alt="User portrait" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] text-slate-200 font-medium">Portrait Ready</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>2. AI Virtual Try-On Render</span>
            </label>
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[3/4] flex items-center justify-center">
              {tryOnResult ? (
                <>
                  <img
                    src={tryOnResult.resultUrl || product?.imageUrl || photoUrl}
                    alt="Try-on render"
                    className="w-full h-full object-cover animate-fadeIn"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-bold shadow">
                    Fit: {tryOnResult.fitConfidence}%
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3">
                    <p className="text-[11px] text-emerald-300 font-medium">
                      ✓ {tryOnResult.stylingNotes}
                    </p>
                  </div>
                </>
              ) : isGenerating ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-semibold">
                    Simulating fabric drape, texture mapping & silhouette...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-500">
                  <Sparkles className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">Click below to generate high-fidelity garment render</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleGenerateTryOn}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-rose-500/20 transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{tryOnResult ? 'Regenerate Simulation' : 'Generate Virtual Try-On'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
