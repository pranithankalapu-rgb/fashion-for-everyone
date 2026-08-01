import { useState } from 'react';
import { Header } from './components/Header';
import { OnboardingModal } from './components/OnboardingModal';
import { AIEngineView } from './components/AIEngineView';
import { ColorVotingView } from './components/ColorVotingView';
import { DesignerShowcaseView } from './components/DesignerShowcaseView';
import { CommerceStockView } from './components/CommerceStockView';
import { SocialFeedView } from './components/SocialFeedView';
import type { UserProfile, RetailProduct } from './types/fashion';
import { INITIAL_USER_PROFILE } from './data/fashionData';
import { X, MapPin, ShoppingBag } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('ai-engine');
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [userRole, setUserRole] = useState<'individual' | 'designer' | 'retailer'>('individual');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<RetailProduct | null>(null);

  const handleSelectProduct = (product: RetailProduct) => {
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#e0e2ec] flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab 1: AI Styling Engine */}
        {activeTab === 'ai-engine' && (
          <AIEngineView
            userProfile={userProfile}
            onSelectProduct={handleSelectProduct}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab 2: Community Color Voting Arena */}
        {activeTab === 'color-voting' && <ColorVotingView />}

        {/* Tab 3: Designer Showcase & Merit Leaderboard */}
        {activeTab === 'designer-showcase' && (
          <DesignerShowcaseView
            onSelectProduct={handleSelectProduct}
            userRole={userRole}
          />
        )}

        {/* Tab 4: Stock Locator & Budget Finder */}
        {activeTab === 'stock-locator' && (
          <CommerceStockView
            selectedProduct={selectedProduct}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* Tab 5: Social Video Feed & Outfit Board Builder */}
        {activeTab === 'social-feed' && (
          <SocialFeedView onSelectProduct={handleSelectProduct} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#07080c] py-8 text-center text-xs text-slate-500 space-y-2">
        <div className="flex justify-center items-center gap-2 font-serif font-bold text-slate-300 text-sm">
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
          <div className="bg-[#0f111a] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4">
              <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-28 h-36 object-cover rounded-2xl border border-white/10" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{selectedProduct.brand}</span>
                <h3 className="font-serif font-bold text-lg text-white">{selectedProduct.title}</h3>
                <div className="text-xl font-bold text-amber-300">${selectedProduct.price}</div>
                <div className="text-xs text-slate-400">{selectedProduct.retailer}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-xs font-semibold text-slate-300">Dominant Color Swatches:</div>
              <div className="flex gap-2">
                {selectedProduct.colors.map((hex, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: hex }} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setActiveTab('stock-locator');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Locate Nearby Stock</span>
              </button>

              <a
                href={selectedProduct.affiliateUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buy Online</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
