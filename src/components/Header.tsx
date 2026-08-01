import React from 'react';
import { Sparkles, Palette, Award, ShoppingBag, Video, Sliders, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../types/fashion';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  onOpenOnboarding: () => void;
  userRole: 'individual' | 'designer' | 'retailer';
  setUserRole: (role: 'individual' | 'designer' | 'retailer') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onOpenOnboarding,
  userRole,
  setUserRole,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 p-[1px] flex items-center justify-center shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#090a0f] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-white">Fashion for Everyone</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                v1.0 AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Community-Powered Intelligence & Social Commerce</p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('ai-engine')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'ai-engine'
                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Stylist</span>
          </button>

          <button
            onClick={() => setActiveTab('color-voting')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'color-voting'
                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4 text-rose-400" />
            <span>Color Voting</span>
          </button>

          <button
            onClick={() => setActiveTab('designer-showcase')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'designer-showcase'
                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>Designer Showcase</span>
          </button>

          <button
            onClick={() => setActiveTab('stock-locator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stock-locator'
                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Stock & Budget</span>
          </button>

          <button
            onClick={() => setActiveTab('social-feed')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'social-feed'
                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 text-cyan-400" />
            <span>Social Feed</span>
          </button>
        </nav>

        {/* User Role Switcher & Onboarding Trigger */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="bg-slate-900 text-xs font-medium text-slate-300 border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-white/20 focus:border-amber-400/50"
            >
              <option value="individual">👤 Individual User</option>
              <option value="designer">🎨 Designer View</option>
              <option value="retailer">🛍️ Retailer View</option>
            </select>
          </div>

          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 hover:border-amber-400 text-slate-200 hover:text-amber-300 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/40"
            />
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold leading-tight text-white flex items-center gap-1">
                <span>{userProfile.name}</span>
                <ShieldCheck className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-[10px] text-slate-400">{userProfile.skinTone} • {userProfile.bodyShape}</div>
            </div>
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>
        </div>

      </div>
    </header>
  );
};
