import React from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingCart,
  Users,
  Store,
  Award,
  Sparkles,
  LogOut,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'users'
  | 'retailers'
  | 'designers'
  | 'social-ai';

interface AdminLayoutProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  adminEmail: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  adminEmail,
  onLogout,
  children,
}) => {
  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Products Inventory', icon: Package },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingCart },
    { id: 'users', label: 'User Profiles', icon: Users },
    { id: 'retailers', label: 'Retailer Operations & CRM', icon: Store },
    { id: 'designers', label: 'Designers & Merit', icon: Award },
    { id: 'social-ai', label: 'Color, Social & AI Control', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-app-theme text-theme-body flex flex-col font-sans">
      {/* Persistent Admin Portal Header */}
      <header className="sticky top-0 z-40 bg-surface-theme/90 backdrop-blur-md border-b border-theme-main shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-theme-heading text-lg">Fashion Admin Portal</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  PostgreSQL Engine
                </span>
              </div>
              <p className="text-[11px] text-theme-muted hidden sm:block">
                Restricted Administration & Operations Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-modal-theme border border-theme-main text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-theme-muted">{adminEmail}</span>
            </div>

            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Logout Admin Session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-Navigation Bar */}
        <div className="border-t border-theme-main/60 bg-modal-theme/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                      : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Subview Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-theme-main bg-footer-theme py-6 text-center text-xs text-theme-muted">
        <div className="flex justify-center items-center gap-2 font-serif font-bold text-theme-heading text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Fashion for Everyone Admin System</span>
          <span>•</span>
          <span className="text-amber-400 font-sans text-[11px]">PostgreSQL & Prisma Client v5.22.0</span>
        </div>
      </footer>
    </div>
  );
};
