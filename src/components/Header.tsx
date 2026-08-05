import React from 'react';
import { Sparkles, Palette, Award, ShoppingBag, Video, Sliders, ShieldCheck, Sun, Moon, Laptop } from 'lucide-react';
import type { UserProfile } from '../types/fashion';
import { useTheme } from '../context/ThemeContext';

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
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-header-theme backdrop-blur-xl border-b border-theme-main px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 p-[1px] flex items-center justify-center shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-app-theme rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-theme-heading">Fashion for Everyone</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                v1.0 AI
              </span>
            </div>
            <p className="text-xs text-theme-muted hidden sm:block">Community-Powered Intelligence & Social Commerce</p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-surface-theme p-1.5 rounded-2xl border border-theme-main overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('ai-engine')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ai-engine'
                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-slate-900 dark:text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>AI Stylist</span>
          </button>

          <button
            onClick={() => setActiveTab('color-voting')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'color-voting'
                ? 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-slate-900 dark:text-rose-300 border border-rose-500/40 shadow-md shadow-rose-500/10'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            <Palette className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Color Voting</span>
          </button>

          <button
            onClick={() => setActiveTab('designer-showcase')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'designer-showcase'
                ? 'bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-slate-900 dark:text-purple-300 border border-purple-500/40 shadow-md shadow-purple-500/10'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            <Award className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span>Designer Showcase</span>
          </button>

          {/* Stock & Budget Tab - Emerald Green Accent (#10B981) */}
          <button
            onClick={() => setActiveTab('stock-locator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'stock-locator'
                ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-slate-900 dark:text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Stock & Budget</span>
          </button>

          {/* Social Feed Tab - Warm Coral / Sunset Orange Accent */}
          <button
            onClick={() => setActiveTab('social-feed')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'social-feed'
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-slate-900 dark:text-orange-300 border border-orange-500/40 shadow-md shadow-orange-500/10'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            <Video className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span>Social Feed</span>
          </button>
        </nav>

        {/* User Role Switcher, Theme Switcher & Onboarding Trigger */}
        <div className="flex items-center gap-3">
          
          {/* Theme Selector Pill */}
          <div className="flex items-center gap-1 bg-surface-theme p-1 rounded-xl border border-theme-main text-xs">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                theme === 'light'
                  ? 'bg-amber-400/20 text-amber-900 dark:text-amber-400 font-bold border border-amber-400/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-heading'
              }`}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Light</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-amber-400/20 text-amber-900 dark:text-amber-400 font-bold border border-amber-400/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-heading'
              }`}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                theme === 'system'
                  ? 'bg-amber-400/20 text-amber-900 dark:text-amber-400 font-bold border border-amber-400/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-heading'
              }`}
              title="System Default Theme"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">System</span>
            </button>
          </div>

          <div className="relative group">
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="bg-surface-theme text-xs font-medium text-theme-secondary border border-theme-main rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-theme-main focus:border-amber-400/50"
            >
              <option value="individual">👤 Individual User</option>
              <option value="designer">🎨 Designer View</option>
              <option value="retailer">🛍️ Retailer View</option>
            </select>
          </div>

          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 hover:border-amber-400 text-theme-secondary hover:text-amber-300 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/40"
            />
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold leading-tight text-theme-heading flex items-center gap-1">
                <span>{userProfile.name}</span>
                <ShieldCheck className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-[10px] text-theme-muted">{userProfile.skinTone} • {userProfile.bodyShape}</div>
            </div>
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>
        </div>

      </div>
    </header>
  );
};
