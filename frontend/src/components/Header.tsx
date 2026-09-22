import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  Search,
  X,
  Heart,
  Package,
  CheckCircle2,
  Truck,
  Clock,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';
import type { UserProfile, CustomerOrder, UserRole } from '../types/fashion';
import { api } from '../services/api';
import { INITIAL_ORDERS } from '../data/fashionData';
import { OrderDetailsModal } from './OrderDetailsModal';

interface HeaderProps {
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenOnboarding: () => void;
  userRole?: UserRole;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
  wishlistCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  isAuthenticated,
  onOpenAuth,
  onLogout,
  onOpenOnboarding,
  userRole = 'customer',
  searchQuery = '',
  onSearchChange,
  activeTab,
  onNavigateTab,
  wishlistCount = 3,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [selectedOrderModal, setSelectedOrderModal] = useState<CustomerOrder | null>(null);

  const isCustomerView = userRole === 'customer';
  const isWishlistActive = activeTab === 'wishlist';

  // Fetch orders from API if authenticated customer
  useEffect(() => {
    async function loadOrders() {
      try {
        if (isAuthenticated && isCustomerView) {
          const data = await api.getOrders();
          if (data && Array.isArray(data)) {
            setOrders(data);
          }
        }
      } catch (err) {
        console.warn('Could not load customer orders:', err);
      }
    }
    loadOrders();
  }, [isAuthenticated, isCustomerView]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (isCustomerView) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomerView]);

  const defaultAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  return (
    <>
      <header className="sticky top-0 z-40 bg-header-theme backdrop-blur-xl border-b border-theme-main px-4 lg:px-8 py-3 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* LEFT: Brand & Tagline */}
          <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
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
                <p className="text-xs text-theme-muted hidden md:block">Community-Powered Intelligence & Social Commerce</p>
              </div>
            </div>

            {/* Mobile Profile / Auth Trigger */}
            <div className="sm:hidden flex items-center gap-2">
              {!isAuthenticated ? (
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-md"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 text-theme-secondary p-1.5 rounded-xl"
                  title="User Profile"
                >
                  <img
                    src={userProfile?.avatar || defaultAvatar}
                    alt={userProfile?.name || 'User'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/40"
                  />
                </button>
              )}
            </div>
          </div>

          {/* CENTER: Search Bar (Customer View Only) */}
          {isCustomerView && (
            <div className="w-full sm:flex-1 max-w-xl mx-0 sm:mx-2 md:mx-4 flex items-center my-1 sm:my-0">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-theme-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Search for outfits, designers, lookbooks, colors..."
                  className="w-full h-11 pl-10 pr-20 bg-surface-theme hover:bg-surface-subtle-theme focus:bg-surface-subtle-theme border border-theme-main focus:border-amber-400/50 rounded-2xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all shadow-sm focus:shadow-md focus:ring-1 focus:ring-amber-400/30"
                />
                <div className="absolute right-3 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange?.('')}
                      className="p-1 rounded-lg hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-lg bg-surface-subtle-theme border border-theme-subtle text-[10px] font-mono text-theme-muted pointer-events-none select-none shadow-2xs">
                    <span className="text-[11px]">⌘</span>
                    <span>K</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Wishlist & User Profile Card */}
          <div className="flex items-center gap-2.5 flex-shrink-0 relative" ref={profileDropdownRef}>
            
            {/* Wishlist Button (Customer View Only) */}
            {isCustomerView && (
              <button
                onClick={() => onNavigateTab?.('wishlist')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm group ${
                  isWishlistActive
                    ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-400/30'
                    : 'bg-surface-theme hover:bg-surface-subtle-theme border-theme-main text-theme-body hover:text-theme-heading hover:border-amber-400/40'
                }`}
                title="View Wishlist"
              >
                <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isWishlistActive ? 'fill-rose-500 text-rose-500' : 'text-rose-400 group-hover:fill-rose-400/30'
                }`} />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {/* If NOT Authenticated: Show Sign In Button */}
            {!isAuthenticated ? (
              <button
                onClick={onOpenAuth}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer hover:scale-105"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            ) : (
              /* If Authenticated: Show User Profile Card */
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`hidden sm:flex items-center gap-2.5 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border ${
                  isProfileOpen ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-amber-500/30 hover:border-amber-400'
                } text-theme-secondary hover:text-amber-300 px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer`}
              >
                <img
                  src={userProfile?.avatar || defaultAvatar}
                  alt={userProfile?.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/40"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold leading-tight text-theme-heading flex items-center gap-1">
                    <span>{userProfile?.name || 'User Account'}</span>
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="text-[10px] text-theme-muted uppercase font-mono tracking-wider">
                    {userRole}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* USER PROFILE PANEL / DROPDOWN */}
            {isProfileOpen && isAuthenticated && userProfile && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-panel rounded-3xl p-4 shadow-2xl border border-theme-main z-50 text-left space-y-4 animate-fadeIn">
                
                {/* 1. User Avatar & Account Info Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-theme-subtle">
                  <img
                    src={userProfile.avatar || defaultAvatar}
                    alt={userProfile.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400/40 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-theme-heading truncate">
                        {userProfile.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                        {userRole}
                      </span>
                    </div>
                    <p className="text-[11px] text-theme-muted truncate">
                      {userProfile.email || 'authenticated@fashionforeveryone.com'}
                    </p>
                    {userProfile.skinTone && (
                      <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
                        {userProfile.skinTone} • {userProfile.bodyShape}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Quick Action Buttons */}
                <div className={`grid ${isCustomerView ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <button
                    onClick={() => {
                      onOpenOnboarding();
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Style Profile</span>
                  </button>

                  {isCustomerView && (
                    <button
                      onClick={() => {
                        onNavigateTab?.('wishlist');
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading transition-all cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>Wishlist ({wishlistCount})</span>
                    </button>
                  )}
                </div>

                {/* 3. PREVIOUS ORDERS SECTION (CUSTOMER VIEW ONLY) */}
                {isCustomerView && (
                  <div className="pt-2 border-t border-theme-main space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-theme-heading">
                        <Package className="w-4 h-4 text-amber-400" />
                        <span>My Orders</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-theme text-theme-muted border border-theme-subtle">
                        {orders.length} Total
                      </span>
                    </div>

                    {/* Orders List */}
                    {orders.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {orders.slice(0, 3).map((order) => {
                          const firstItem = order.items?.[0];
                          return (
                            <div
                              key={order.id}
                              onClick={() => {
                                setSelectedOrderModal(order);
                                setIsProfileOpen(false);
                              }}
                              className="p-2.5 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main transition-all cursor-pointer group space-y-2 shadow-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {firstItem?.imageUrl && (
                                    <img
                                      src={firstItem.imageUrl}
                                      alt={firstItem.title}
                                      className="w-10 h-10 object-cover rounded-xl border border-theme-subtle flex-shrink-0"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold text-theme-heading truncate group-hover:text-amber-300 transition-colors">
                                      {firstItem?.title || `Order #${order.orderNumber}`}
                                    </div>
                                    <div className="text-[10px] text-theme-muted">
                                      #{order.orderNumber} • {order.date}
                                    </div>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 flex items-center gap-1 ${
                                    order.status === 'Delivered'
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                      : order.status === 'Shipped'
                                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                  }`}
                                >
                                  <span>{order.status}</span>
                                  {order.status === 'Delivered' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                  {order.status === 'Shipped' && <Truck className="w-3 h-3 text-blue-400" />}
                                  {order.status === 'Processing' && <Clock className="w-3 h-3 text-amber-400" />}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-theme-subtle">
                                <span className="text-theme-muted">Items: {order.items?.length || 1}</span>
                                <span className="font-bold text-amber-300">
                                  {order.currency || '$'}{order.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-theme-muted italic py-2">No orders placed yet.</p>
                    )}
                  </div>
                )}

                {/* Footer Action / Sign Out */}
                <div className="pt-2 border-t border-theme-main flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>

                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="text-theme-muted hover:text-theme-heading transition-colors font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>
      </header>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrderModal}
        onClose={() => setSelectedOrderModal(null)}
      />
    </>
  );
};
