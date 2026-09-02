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
import { AdminGuard } from './components/admin/AdminGuard';
import type { AdminTab } from './components/admin/AdminLayout';
import type { UserProfile, RetailProduct } from './types/fashion';
import { INITIAL_USER_PROFILE } from './data/fashionData';
import { api, setCurrentRole } from './services/api';
import { X, MapPin, ShoppingBag, Heart } from 'lucide-react';

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
  const [selectedProduct, setSelectedProduct] = useState<RetailProduct | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<RetailProduct | null>(null);

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
        setUserProfile(p);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }
    loadInitialProfile();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    setCurrentRole(role);
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
    <div className="min-h-screen bg-app-theme text-theme-body flex flex-col font-sans transition-colors duration-200">

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

      {/* Main View Container with Left Sidebar & Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* LEFT SIDEBAR / QUICK ACCESS PANEL */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={userRole}
            setUserRole={handleRoleChange}
          />

          {/* MAIN APPLICATION CONTENT */}
          <div className="flex-1 min-w-0 w-full space-y-4">

            {/* Retailer Operational View Hub */}
            {userRole === 'retailer' ? (
              <RetailerView
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchQuery={searchQuery}
              />
            ) : (
              <>
                {/* Tab 1: AI Styling Engine */}
                {activeTab === 'ai-engine' && (
                  <AIEngineView
                    userProfile={userProfile}
                    onSelectProduct={handleSelectProduct}
                    onNavigateTab={setActiveTab}
                    searchQuery={searchQuery}
                  />
                )}

                {/* Tab 2: Community Color Voting Arena */}
                {activeTab === 'color-voting' && <ColorVotingView searchQuery={searchQuery} />}

                {/* Tab 3: Designer Showcase & Merit Leaderboard */}
                {activeTab === 'designer-showcase' && (
                  <DesignerShowcaseView
                    onSelectProduct={handleSelectProduct}
                    userRole={userRole}
                    searchQuery={searchQuery}
                  />
                )}

                {/* Tab 4: Stock Locator & Budget Finder */}
                {activeTab === 'stock-locator' && (
                  <CommerceStockView
                    selectedProduct={selectedProduct}
                    onSelectProduct={handleSelectProduct}
                    searchQuery={searchQuery}
                  />
                )}

                {/* Tab 5: Social Video Feed & Outfit Board Builder */}
                {activeTab === 'social-feed' && (
                  <SocialFeedView onSelectProduct={handleSelectProduct} searchQuery={searchQuery} />
                )}

                {/* Tab 6: Saved Wishlist View */}
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

                {/* Admin Portal Root */}
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


      {/* Footer */}
      <footer className="border-t border-theme-main bg-footer-theme py-8 text-center text-xs text-theme-muted space-y-2">
        <div className="flex justify-center items-center gap-2 font-serif font-bold text-theme-heading text-sm">
          <span>Fashion for Everyone</span>
          <span>•</span>
          <span className="text-amber-400 font-sans text-xs">Technical & Product Architecture Implementation</span>
        </div>
        <p>Built with React, Vite, Lucide Icons & Tailwind CSS | 2026 Platform Specification</p>
      </footer>

      {/* 5-Step Progressive Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        userProfile={userProfile}
        onSaveProfile={setUserProfile}
      />

      {/* Product Details & Purchase Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
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
                  setSelectedProduct(null);
                  setActiveTab('stock-locator');
                }}
                className="flex-1 bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Locate Nearby Stock</span>
              </button>

              <button
                onClick={() => {
                  const prod = selectedProduct;
                  setSelectedProduct(null);
                  setCheckoutProduct(prod);
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
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
          onOrderSuccess={() => {
            // Can switch tab or show notification if desired
          }}
        />
      )}

    </div>
  );
}

export default App;
