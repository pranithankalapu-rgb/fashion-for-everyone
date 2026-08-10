import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Award,
  ShoppingBag,
  Video,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  User,
  Store,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type UserRole = 'customer' | 'designer' | 'retailer' | 'individual';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
}) => {
  const { theme, setTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'ai-engine',
      label: 'AI Stylist',
      description: 'Get AI-powered outfit suggestions',
      icon: Sparkles,
      iconColor: 'text-amber-500 dark:text-amber-400',
      activeGradient: 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-theme-heading border-amber-500/40 shadow-sm',
    },
    {
      id: 'color-voting',
      label: 'Color Voting',
      description: 'Vote & discover trending colors',
      icon: Palette,
      iconColor: 'text-rose-500 dark:text-rose-400',
      activeGradient: 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-theme-heading border-rose-500/40 shadow-sm',
    },
    {
      id: 'designer-showcase',
      label: 'Designer Showcase',
      description: 'Explore featured designers',
      icon: Award,
      iconColor: 'text-purple-500 dark:text-purple-400',
      activeGradient: 'bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-theme-heading border-purple-500/40 shadow-sm',
    },
    {
      id: 'stock-locator',
      label: 'Stock & Budget',
      description: 'Manage inventory & budget',
      icon: ShoppingBag,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      activeGradient: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-theme-heading border-emerald-500/40 shadow-sm',
    },
  ];

  const contentFeedItems = [
    {
      id: 'social-feed',
      label: 'Social Feed',
      description: 'Explore community lookbooks',
      icon: Video,
      iconColor: 'text-orange-500 dark:text-orange-400',
      activeGradient: 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-theme-heading border-orange-500/40 shadow-sm',
    },
  ];

  const viewModes: {
    id: UserRole;
    label: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
  }[] = [
    {
      id: 'customer',
      label: 'Customer View',
      description: 'Personalized styling & shopping',
      icon: User,
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
      id: 'designer',
      label: 'Designer View',
      description: 'Create & showcase designs',
      icon: Award,
      iconColor: 'text-purple-500 dark:text-purple-400',
    },
    {
      id: 'retailer',
      label: 'Retailer View',
      description: 'Manage store & analytics',
      icon: Store,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
  ];

  const isCustomerView = userRole === 'customer' || userRole === 'individual';

  const visibleNavItems = navItems.filter((item) => {
    if (isCustomerView && item.id === 'stock-locator') {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 md:sticky md:top-24 space-y-4">
      {/* Mobile Toggle Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full glass-panel rounded-2xl px-4 py-3 flex items-center justify-between text-theme-heading font-bold text-sm shadow-md"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Quick Access Menu</span>
          </div>
          {isMobileOpen ? (
            <X className="w-5 h-5 text-theme-muted" />
          ) : (
            <Menu className="w-5 h-5 text-theme-muted" />
          )}
        </button>
      </div>

      {/* Sidebar Content Panel */}
      <div
        className={`${
          isMobileOpen ? 'block' : 'hidden'
        } md:block glass-panel rounded-3xl p-4 shadow-xl border border-theme-main space-y-4 transition-all duration-200`}
      >
        {/* Quick Access Section Header */}
        <div className="px-2 pt-1 pb-2 flex items-center justify-between border-b border-theme-subtle">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-theme-heading">
              Quick Access
            </span>
          </div>
          <span className="text-[10px] text-theme-muted font-mono">PANEL</span>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left border transition-all duration-200 group ${
                  isActive
                    ? item.activeGradient
                    : 'border-transparent text-theme-body hover:bg-surface-subtle-theme hover:text-theme-heading'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl bg-surface-theme border border-theme-subtle flex-shrink-0 group-hover:scale-105 transition-transform ${
                      isActive ? 'ring-1 ring-amber-400/40' : ''
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-theme-heading leading-tight truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-theme-muted truncate">
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    isActive
                      ? 'text-amber-400 translate-x-0.5'
                      : 'text-theme-muted group-hover:translate-x-1'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Divider 1 */}
        <div className="border-t border-theme-main my-2" />

        {/* CONTENT & FEED section */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">
            Content & Feed
          </div>
          {contentFeedItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left border transition-all duration-200 group ${
                  isActive
                    ? item.activeGradient
                    : 'border-transparent text-theme-body hover:bg-surface-subtle-theme hover:text-theme-heading'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl bg-surface-theme border border-theme-subtle flex-shrink-0 group-hover:scale-105 transition-transform ${
                      isActive ? 'ring-1 ring-orange-400/40' : ''
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-theme-heading leading-tight truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-theme-muted truncate">
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    isActive
                      ? 'text-orange-400 translate-x-0.5'
                      : 'text-theme-muted group-hover:translate-x-1'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Divider 2 */}
        <div className="border-t border-theme-main my-2" />

        {/* THEME Section */}
        <div className="space-y-2">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
            Theme
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-theme rounded-2xl border border-theme-main">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-amber-400/20 text-slate-900 dark:text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Light</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-amber-400/20 text-slate-900 dark:text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                theme === 'system'
                  ? 'bg-amber-400/20 text-slate-900 dark:text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">System</span>
            </button>
          </div>
        </div>

        {/* VIEW MODE Section */}
        <div className="space-y-2 pt-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
            View Mode
          </div>
          <div className="space-y-1.5">
            {viewModes.map((mode) => {
              const IconComponent = mode.icon;
              const isSelected = userRole === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setUserRole(mode.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left border transition-all duration-200 group ${
                    isSelected
                      ? 'bg-surface-subtle-theme border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                      : 'border-transparent text-theme-body hover:bg-surface-subtle-theme hover:text-theme-heading'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl bg-surface-theme border border-theme-subtle flex-shrink-0 ${
                        isSelected ? 'bg-amber-400/10' : ''
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 ${mode.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-theme-heading leading-tight truncate flex items-center gap-1.5">
                        <span>{mode.label}</span>
                      </div>
                      <div className="text-[10px] text-theme-muted truncate">
                        {mode.description}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400'
                        : 'border-theme-muted'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
