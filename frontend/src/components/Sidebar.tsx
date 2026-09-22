import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Award,
  Video,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  Layers,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  TrendingUp,
  Tag,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { UserRole } from '../types/fashion';

export type { UserRole };

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  isAuthenticated?: boolean;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  isAuthenticated = false,
  onOpenAuth,
}) => {
  const { theme, setTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const customerNavItems = [
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
      id: 'social-feed',
      label: 'Social Feed',
      description: 'Explore community lookbooks',
      icon: Video,
      iconColor: 'text-orange-500 dark:text-orange-400',
      activeGradient: 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-theme-heading border-orange-500/40 shadow-sm',
    },
  ];

  const designerNavItems = [
    {
      id: 'designer-showcase',
      label: 'Designer Dashboard',
      description: 'Manage designs & collections',
      icon: Award,
      iconColor: 'text-purple-500 dark:text-purple-400',
      activeGradient: 'bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-theme-heading border-purple-500/40 shadow-sm',
    },
    {
      id: 'ai-engine',
      label: 'AI Stylist',
      description: 'Explore AI styling & fit analytics',
      icon: Sparkles,
      iconColor: 'text-amber-500 dark:text-amber-400',
      activeGradient: 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-theme-heading border-amber-500/40 shadow-sm',
    },
    {
      id: 'color-voting',
      label: 'Color Voting Arena',
      description: 'Trending palettes & crowd ratings',
      icon: Palette,
      iconColor: 'text-rose-500 dark:text-rose-400',
      activeGradient: 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-theme-heading border-rose-500/40 shadow-sm',
    },
    {
      id: 'social-feed',
      label: 'Community Feed',
      description: 'Lookbooks & creator tags',
      icon: Video,
      iconColor: 'text-orange-500 dark:text-orange-400',
      activeGradient: 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-theme-heading border-orange-500/40 shadow-sm',
    },
  ];

  const retailerNavItems = [
    {
      id: 'retailer-dashboard',
      label: 'Dashboard',
      description: 'Store overview & quick actions',
      icon: LayoutDashboard,
      iconColor: 'text-amber-500 dark:text-amber-400',
      activeGradient: 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-theme-heading border-amber-500/40 shadow-sm',
    },
    {
      id: 'retailer-products',
      label: 'Products Catalog',
      description: 'Manage catalog & attributes',
      icon: Package,
      iconColor: 'text-blue-500 dark:text-blue-400',
      activeGradient: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-theme-heading border-blue-500/40 shadow-sm',
    },
    {
      id: 'retailer-inventory',
      label: 'Inventory Control',
      description: 'Stock tracking & SKU updates',
      icon: Boxes,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      activeGradient: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-theme-heading border-emerald-500/40 shadow-sm',
    },
    {
      id: 'retailer-orders',
      label: 'Fulfillment & Orders',
      description: 'Status tracking & shipments',
      icon: ShoppingCart,
      iconColor: 'text-purple-500 dark:text-purple-400',
      activeGradient: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-theme-heading border-purple-500/40 shadow-sm',
    },
    {
      id: 'retailer-customers',
      label: 'Customer CRM',
      description: 'Client directory & spend analytics',
      icon: Users,
      iconColor: 'text-rose-500 dark:text-rose-400',
      activeGradient: 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-theme-heading border-rose-500/40 shadow-sm',
    },
    {
      id: 'retailer-analytics',
      label: 'Sales & Analytics',
      description: 'Revenue trends & conversion',
      icon: TrendingUp,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      activeGradient: 'bg-gradient-to-r from-emerald-500/20 to-amber-500/20 text-theme-heading border-emerald-500/40 shadow-sm',
    },
    {
      id: 'retailer-promotions',
      label: 'Campaigns & Discounts',
      description: 'Coupons & promo campaigns',
      icon: Tag,
      iconColor: 'text-amber-500 dark:text-amber-400',
      activeGradient: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-theme-heading border-amber-500/40 shadow-sm',
    },
    {
      id: 'retailer-settings',
      label: 'Store Settings',
      description: 'Preferences, tax & store profile',
      icon: Settings,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      activeGradient: 'bg-gradient-to-r from-indigo-500/20 to-slate-500/20 text-theme-heading border-indigo-500/40 shadow-sm',
    },
  ];

  const adminNavItems = [
    {
      id: 'admin',
      label: 'Admin Portal',
      description: 'Platform users, designers & retailers',
      icon: ShieldCheck,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      activeGradient: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-theme-heading border-emerald-500/40 shadow-sm',
    },
  ];

  const isRetailerRole = userRole === 'retailer';
  const isDesignerRole = userRole === 'designer';
  const isAdminRole = userRole === 'admin';

  const displayedNavItems = isRetailerRole
    ? retailerNavItems
    : isDesignerRole
    ? designerNavItems
    : isAdminRole
    ? adminNavItems
    : customerNavItems;

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
            <span>
              {isRetailerRole
                ? 'Retailer Hub'
                : isDesignerRole
                ? 'Designer Studio'
                : isAdminRole
                ? 'Admin Hub'
                : 'Customer Menu'}
            </span>
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
        {/* Section Header with Authenticated Role Indicator */}
        <div className="px-2 pt-1 pb-2 flex items-center justify-between border-b border-theme-subtle">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isRetailerRole
                  ? 'bg-emerald-400'
                  : isDesignerRole
                  ? 'bg-purple-400'
                  : isAdminRole
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              } animate-ping`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-theme-heading">
              {isRetailerRole
                ? 'Retailer Hub'
                : isDesignerRole
                ? 'Designer Studio'
                : isAdminRole
                ? 'Admin Portal'
                : 'Customer Experience'}
            </span>
          </div>
          <span className="text-[10px] text-theme-muted font-mono uppercase">
            {userRole}
          </span>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {displayedNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id || (item.id === 'admin' && activeTab.startsWith('admin-'));
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left border transition-all duration-200 group cursor-pointer ${
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

        {/* Unauthenticated Quick Banner */}
        {!isAuthenticated && (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Role-Specific Access</span>
            </div>
            <p className="text-[11px] text-theme-muted leading-tight">
              Sign up as a Customer, Designer, or Retailer to unlock tailored tools and workflows.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-sm hover:scale-[1.02] transition-all cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-theme-main my-2" />

        {/* THEME Section */}
        <div className="space-y-2">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
            Theme
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-theme rounded-2xl border border-theme-main">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
      </div>
    </aside>
  );
};
