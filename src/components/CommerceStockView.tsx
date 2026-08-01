import React, { useState } from 'react';
import { ShoppingBag, MapPin, ExternalLink, Check, Clock, DollarSign } from 'lucide-react';
import type { RetailProduct } from '../types/fashion';
import { RETAIL_PRODUCTS, STORE_STOCKS } from '../data/fashionData';
import confetti from 'canvas-confetti';

interface CommerceStockViewProps {
  selectedProduct: RetailProduct | null;
  onSelectProduct: (p: RetailProduct) => void;
}

export const CommerceStockView: React.FC<CommerceStockViewProps> = ({
  selectedProduct,
  onSelectProduct,
}) => {
  const [maxBudget, setMaxBudget] = useState<number>(350);
  const [radiusMiles, setRadiusMiles] = useState<number>(5);
  const [activeProduct] = useState<RetailProduct>(selectedProduct || RETAIL_PRODUCTS[0]);
  const [reservedStore, setReservedStore] = useState<string | null>(null);

  const stocksForActiveProduct = STORE_STOCKS.filter((s) => s.productId === activeProduct.id || s.productId === 'prod_101');
  const similarProducts = RETAIL_PRODUCTS.filter((p) => p.price <= maxBudget);

  const handleReserveInStore = (storeName: string) => {
    confetti({ particleCount: 50, spread: 60 });
    setReservedStore(storeName);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>In-Store Proximity & Visual Similarity Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Stock Locator & <span className="gradient-text-gold">Budget Matching</span>
            </h1>
            <p className="text-sm text-slate-300">
              Bridge the gap between inspiration and purchase. Reserve exact items at nearby brick-and-mortar stockists or find AI visual alternatives tailored to your budget.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl text-xs space-y-2 text-slate-300 min-w-[240px]">
            <div className="flex justify-between">
              <span className="text-slate-400">User Geolocation:</span>
              <span className="text-emerald-300 font-semibold">Seattle, WA 98101</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stock Refresh:</span>
              <span className="text-slate-200">Real-time (5-min cache)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Product Spotlight & In-Store Reserve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 5 Cols: Selected Product Focus */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Exact Item Spotlight
            </span>

            <div className="h-80 rounded-2xl overflow-hidden relative group">
              <img src={activeProduct.imageUrl} alt={activeProduct.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-white/10">
                Visual Match: {activeProduct.similarityScore || 98}%
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">{activeProduct.brand} • {activeProduct.retailer}</div>
              <h2 className="font-serif font-bold text-2xl text-white mt-1">{activeProduct.title}</h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl font-bold text-amber-300">${activeProduct.price}</span>
                {activeProduct.originalPrice && (
                  <span className="text-sm text-slate-400 line-through">${activeProduct.originalPrice}</span>
                )}
              </div>
            </div>

            <a
              href={activeProduct.affiliateUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold w-full py-3.5 rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              <span>Buy Direct via Tracked Affiliate Code</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Right 7 Cols: In-Store Radius Lookup & Size Stock */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <span>Nearby In-Store Stock Lookup</span>
                </h3>
                <p className="text-xs text-slate-400">PostGIS radius query for physical retailer availability</p>
              </div>

              {/* Radius Range Slider */}
              <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-white/10">
                <span className="text-xs text-slate-400">Radius:</span>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(Number(e.target.value))}
                  className="w-24 accent-emerald-400 cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-300">{radiusMiles} miles</span>
              </div>
            </div>

            {/* List of Nearby Stores */}
            <div className="space-y-4">
              {stocksForActiveProduct.map((store) => (
                <div key={store.id} className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-emerald-400/30 transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{store.storeName}</h4>
                      <p className="text-xs text-slate-400">{store.address}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap">
                      📍 {store.distanceMiles} miles away
                    </span>
                  </div>

                  {/* Size Stock Matrix */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-slate-400 mr-2">Available Sizes:</span>
                    {Object.entries(store.sizeStock).map(([size, count]) => (
                      <div
                        key={size}
                        className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                          count > 0
                            ? 'bg-slate-900 border-emerald-400/40 text-emerald-300'
                            : 'bg-slate-950/40 border-white/5 text-slate-600 line-through'
                        }`}
                      >
                        <span>{size}</span>
                        {count > 0 && <span className="text-[10px] text-slate-400">({count})</span>}
                      </div>
                    ))}
                  </div>

                  {/* Reserve for In-Store Pickup */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Held for 24 hours upon confirmation</span>
                    </div>

                    {reservedStore === store.storeName ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span>Reserved for Pickup!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReserveInStore(store.storeName)}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        Reserve for Pickup
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Visual Similarity & Budget Filter Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif font-bold text-2xl text-white">Find Similar Items with Budget Filter</h3>
            <p className="text-xs text-slate-400">CLIP vector embedding nearest-neighbor similarity search</p>
          </div>

          {/* Budget Slider */}
          <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-white/10 min-w-[280px]">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-400">Max Budget:</span>
                <span className="text-amber-300">${maxBudget}</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Similar Item Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarProducts.map((prod) => (
            <div key={prod.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-56 relative overflow-hidden group">
                <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-white/10">
                  {prod.similarityScore}% Visual Match
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">{prod.brand}</div>
                  <h4 className="font-serif font-bold text-sm text-white mt-0.5 line-clamp-1">{prod.title}</h4>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-amber-300">${prod.price}</span>
                  <span className="text-[10px] text-slate-400">{prod.retailer}</span>
                </div>

                <button
                  onClick={() => onSelectProduct(prod)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 py-2 rounded-xl transition-all"
                >
                  Inspect Stock & Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
