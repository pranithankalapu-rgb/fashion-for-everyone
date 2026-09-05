import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, type UserRole } from './components/Sidebar';
import { OnboardingModal } from './components/OnboardingModal';
import { AIEngineView } from './components/AIEngineView';
import { ColorVotingView } from './components/ColorVotingView';
import { DesignerShowcaseView } from './components/DesignerShowcaseView';
import { CommerceStockView } from './components/CommerceStockView';
import { SocialFeedView } from './components/SocialFeedView';
import { RetailerView } from './components/RetailerView';
import { OrderCheckoutModal } from './components/OrderCheckoutModal';
import { AIStylistDrawer } from './components/AIStylistDrawer';
import { VirtualTryOnModal } from './components/VirtualTryOnModal';
import { AdminGuard } from './components/admin/AdminGuard';
import type { AdminTab } from './components/admin/AdminLayout';
import type { UserProfile, RetailProduct } from './types/fashion';
import { INITIAL_USER_PROFILE } from './data/fashionData';
import { api, setCurrentRole } from './services/api';
import { subscribeToNotifications } from './services/socket';
import { X, MapPin, ShoppingBag, Heart, Sparkles, Wand2, Bell } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === '/admin/orders' || path === '/admin/orders/') return 'admin-orders';
    if (path === '/admin/users' || path === '/admin/users/') return 'admin-users';
    if (path === '/admin/retailers' || path === '/admin/retailers/') return 'admin-retailers';
    if (path === '/admin/designers' || path === '/admin/designers/') return 'admin-designers';
    if (path === '/admin/products' || path === '/admin/products/') return 'admin-products';
    if (path.startsWith('/admin')) return 'admin';
    return 'ai-engine';
  });
  const [adminSubTab, setAdminSubTab] = useState<AdminTab>(() => {
    const path = window.location.pathname;
    if (path === '/admin/orders' || path === '/admin/orders/') return 'orders';
    if (path === '/admin/users' || path === '/admin/users/') return 'users';
    if (path === '/admin/retailers' || path === '/admin/retailers/') return 'retailers';
    if (path === '/admin/designers' || path === '/admin/designers/') return 'designers';
    if (path === '/admin/products' || path === '/admin/products/') return 'products';
    return 'dashboard';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [userRole, setUserRole] = useState<UserRole>('customer');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isStylistOpen, setIsStylistOpen] = useState<boolean>(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<RetailProduct | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<RetailProduct | null>(null);
  const [activeNotification, setActiveNotification] = useState<any | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin/orders' || path === '/admin/orders/') {
        setActiveTab('admin-orders');
        setAdminSubTab('orders');
      } else if (path === '/admin/users' || path === '/admin/users/') {
        setActiveTab('admin-users');
        setAdminSubTab('users');
      } else if (path === '/admin/retailers' || path === '/admin/retailers/') {
        setActiveTab('admin-retailers');
        setAdminSubTab('retailers');
      } else if (path === '/admin/designers' || path === '/admin/designers/') {
        setActiveTab('admin-designers');
        setAdminSubTab('designers');
      } else if (path === '/admin/products' || path === '/admin/products/') {
        setActiveTab('admin-products');
        setAdminSubTab('products');
      } else if (path.startsWith('/admin')) {
        setActiveTab('admin');
        setAdminSubTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    async function loadInitialProfile() {
      try {
        const p = await api.getProfile();
        if (p) setUserProfile(p);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }
    loadInitialProfile();
  }, []);

  // Subscribe to real-time notifications for active role
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userRole, (notif: any) => {
      setActiveNotification(notif);
      setTimeout(() => {
        setActiveNotification(null);
      }, 6000);
    });
    return () => {
      unsubscribe();
    };
  }, [userRole]);

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    setCurrentRole(role as any);
    if (role === 'retailer') {
      if (!activeTab.startsWith('retailer-')) {
        setActiveTab('retailer-dashboard');
      }
    } else if (role === 'designer') {
      setActiveTab('designer-showcase');
    } else {
      if (activeTab.startsWith('retailer-')) {
        setActiveTab('ai-engine');
      }
    }
  };

  const handleSelectProduct = (product: RetailProduct) => {
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-app-theme text-theme-body flex flex-col font-sans transition-colors duration-200 relative">
      
      {/* Real-Time Push Notification Toast */}
      {activeNotification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex items-start gap-3 max-w-sm animate-fadeIn">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <h4 className="font-bold text-slate-100">{activeNotification.title}</h4>
            <p className="text-slate-300 mt-0.5">{activeNotification.message}</p>
          </div>
          <button
            onClick={() => setActiveNotification(null)}
            className="text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        userProfile={userProfile}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        userRole={userRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        wishlistCount={3}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* LEFT SIDEBAR */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={userRole}
            setUserRole={handleRoleChange}
          />

          {/* MAIN APPLICATION CONTENT */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {userRole === 'retailer' ? (
              <RetailerView
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchQuery={searchQuery}
              />
            ) : (
              <>
                {activeTab === 'ai-engine' && (
                  <AIEngineView
                    userProfile={userProfile}
                    onSelectProduct={handleSelectProduct}
                    onNavigateTab={setActiveTab}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'color-voting' && <ColorVotingView searchQuery={searchQuery} />}

                {activeTab === 'designer-showcase' && (
                  <DesignerShowcaseView
                    onSelectProduct={handleSelectProduct}
                    userRole={userRole}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'stock-locator' && (
                  <CommerceStockView
                    selectedProduct={selectedProduct}
                    onSelectProduct={handleSelectProduct}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'social-feed' && (
                  <SocialFeedView onSelectProduct={handleSelectProduct} searchQuery={searchQuery} />
                )}

                {activeTab === 'wishlist' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex items-center justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          <span>Curated Favorites</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
                          Saved Wishlist Items (3)
                        </h1>
                        <p className="text-xs text-theme-muted mt-1">
                          Your bookmarked designer outfits, color combinations, and saved store items.
                        </p>
                      </div>
                    </div>

                    <CommerceStockView
                      selectedProduct={selectedProduct}
                      onSelectProduct={handleSelectProduct}
                      searchQuery={searchQuery}
                    />
                  </div>
                )}

                {(activeTab === 'admin' || activeTab.startsWith('admin-')) && (
                  <AdminGuard
                    activeTab={adminSubTab}
                    setActiveTab={(tab) => {
                      setAdminSubTab(tab);
                      setActiveTab(`admin-${tab}`);
                      if (tab === 'orders') {
                        window.history.pushState(null, '', '/admin/orders');
                      } else if (tab === 'users') {
                        window.history.pushState(null, '', '/admin/users');
                      } else if (tab === 'retailers') {
                        window.history.pushState(null, '', '/admin/retailers');
                      } else if (tab === 'designers') {
                        window.history.pushState(null, '', '/admin/designers');
                      } else if (tab === 'products') {
                        window.history.pushState(null, '', '/admin/products');
                      } else {
                        window.history.pushState(null, '', '/admin/dashboard');
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Buttons for Conversational Stylist & Virtual Try-On */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button
          onClick={() => setIsTryOnOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900/90 border border-rose-500/50 hover:border-rose-400 text-rose-300 font-bold text-xs shadow-2xl shadow-rose-500/20 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
        >
          <Wand2 className="w-4 h-4 text-rose-400" />
          <span>Virtual Try-On</span>
        </button>

        <button
          onClick={() => setIsStylistOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-500/30 transition-all hover:scale-105 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Stylist Chat</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-theme-main bg-footer-theme py-8 text-center text-xs text-theme-muted space-y-2">
        <div className="flex justify-center items-center gap-2 font-serif font-bold text-theme-heading text-sm">
          <span>Fashion for Everyone</span>
          <span>•</span>
          <span className="text-amber-400 font-sans text-xs">Enterprise AI Fashion E-Commerce Platform</span>
        </div>
        <p>Built with React 19, Express 5, TypeScript, Prisma PostgreSQL & Socket.io</p>
      </footer>

      {/* Modals & Drawers */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        userProfile={userProfile}
        onSaveProfile={setUserProfile}
      />

      <AIStylistDrawer
        isOpen={isStylistOpen}
        onClose={() => setIsStylistOpen(false)}
        onSelectProduct={handleSelectProduct}
        onAddToCart={(p) => setCheckoutProduct(p)}
      />

      <VirtualTryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        product={selectedProduct}
      />

      {/* Product Details & Purchase Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4">
              <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-28 h-36 object-cover rounded-2xl border border-theme-main" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{selectedProduct.brand}</span>
                <h3 className="font-serif font-bold text-lg text-theme-heading">{selectedProduct.title}</h3>
                <div className="text-xl font-bold text-amber-300">${selectedProduct.price}</div>
                <div className="text-xs text-theme-muted">{selectedProduct.retailer}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-theme-main">
              <div className="text-xs font-semibold text-theme-secondary">Dominant Color Swatches:</div>
              <div className="flex gap-2">
                {selectedProduct.colors.map((hex, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border border-theme-main" style={{ backgroundColor: hex }} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-theme-main">
              <button
                onClick={() => {
                  const prod = selectedProduct;
                  setSelectedProduct(null);
                  setIsTryOnOpen(true);
                }}
                className="flex-1 bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-rose-400" />
                <span>Virtual Try-On</span>
              </button>

              <button
                onClick={() => {
                  const prod = selectedProduct;
                  setSelectedProduct(null);
                  setCheckoutProduct(prod);
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Now (Checkout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Customer Order Checkout Modal */}
      {checkoutProduct && (
        <OrderCheckoutModal
          product={checkoutProduct}
          userProfile={userProfile}
          onClose={() => setCheckoutProduct(null)}
          onOrderSuccess={() => {}}
        />
      )}
    </div>
  );
}

export default App;
