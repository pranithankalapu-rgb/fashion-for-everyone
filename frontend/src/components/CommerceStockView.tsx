import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, ExternalLink, Check, Clock, DollarSign } from 'lucide-react';
import type { RetailProduct, StoreStock } from '../types/fashion';
import { RETAIL_PRODUCTS, STORE_STOCKS } from '../data/fashionData';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface CommerceStockViewProps {
  selectedProduct: RetailProduct | null;
  onSelectProduct: (p: RetailProduct) => void;
  searchQuery?: string;
}

export const CommerceStockView: React.FC<CommerceStockViewProps> = ({
  selectedProduct,
  onSelectProduct,
  searchQuery = '',
}) => {
  const [maxBudget, setMaxBudget] = useState<number>(350);
  const [radiusMiles, setRadiusMiles] = useState<number>(5);
  const [products, setProducts] = useState<RetailProduct[]>(RETAIL_PRODUCTS);
  const [storeStocks, setStoreStocks] = useState<StoreStock[]>(STORE_STOCKS);
  const [activeProduct, setActiveProduct] = useState<RetailProduct>(selectedProduct || RETAIL_PRODUCTS[0]);
  
  // Reservation Modal state
  const [reservingStore, setReservingStore] = useState<StoreStock | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('S');
  const [customerName, setCustomerName] = useState<string>('Sophia Laurent');
  const [customerPhone, setCustomerPhone] = useState<string>('(206) 555-0192');
  const [reservationResult, setReservationResult] = useState<any>(null);

  useEffect(() => {
    if (selectedProduct) {
      setActiveProduct(selectedProduct);
    }
  }, [selectedProduct]);

  useEffect(() => {
    async function loadCommerceData() {
      try {
        const [prods, stores] = await Promise.all([
          api.getProducts(),
          api.getStoreStocks(activeProduct.id),
        ]);
        setProducts(prods);
        setStoreStocks(stores);
      } catch (err) {
        console.error('Error fetching commerce stock data:', err);
      }
    }
    loadCommerceData();
  }, [activeProduct.id]);

  const stocksForActiveProduct = storeStocks.filter((s) => s.productId === activeProduct.id || s.productId === 'prod_101');
  const filteredProducts = products.filter((p) => {
    const matchBudget = p.price <= maxBudget;
    if (!searchQuery.trim()) return matchBudget;
    const q = searchQuery.toLowerCase();
    return matchBudget && (
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservingStore) return;

    try {
      const res = await api.reserveStoreStock({
        storeId: reservingStore.id,
        productId: activeProduct.id,
        size: selectedSize,
        customerName,
        customerPhone,
      });

      setReservationResult(res);
      confetti({ particleCount: 60, spread: 70 });
    } catch (err: any) {
      alert(err?.message || 'Error processing store reservation');
    }
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
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-theme-heading tracking-tight">
              Stock Locator & <span className="gradient-text-gold">Budget Matching</span>
            </h1>
            <p className="text-sm text-theme-secondary">
              Bridge the gap between inspiration and purchase. Reserve exact items at nearby brick-and-mortar stockists or find AI visual alternatives tailored to your budget.
            </p>
          </div>

          <div className="bg-surface-theme border border-theme-main p-4 rounded-2xl text-xs space-y-2 text-theme-secondary min-w-[240px]">
            <div className="flex justify-between">
              <span className="text-theme-muted">User Geolocation:</span>
              <span className="text-emerald-300 font-semibold">Seattle, WA 98101</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">Stock Refresh:</span>
              <span className="text-theme-heading">Real-time (5-min cache)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Product Spotlight & In-Store Reserve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 5 Cols: Selected Product Focus */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Exact Item Spotlight
            </span>

            <div className="h-80 rounded-2xl overflow-hidden relative group">
              <img src={activeProduct.imageUrl} alt={activeProduct.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-surface-theme/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-theme-main">
                Visual Match: {activeProduct.similarityScore || 98}%
              </div>
            </div>

            <div>
              <div className="text-xs text-theme-muted font-medium">{activeProduct.brand} • {activeProduct.retailer}</div>
              <h2 className="font-serif font-bold text-2xl text-theme-heading mt-1">{activeProduct.title}</h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl font-bold text-amber-800 dark:text-amber-300">${activeProduct.price}</span>
                {activeProduct.originalPrice && (
                  <span className="text-sm text-theme-muted line-through">${activeProduct.originalPrice}</span>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-theme-main pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-theme-heading flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <span>Nearby In-Store Stock Lookup</span>
                </h3>
                <p className="text-xs text-theme-muted">PostGIS radius query for physical retailer availability</p>
              </div>

              {/* Radius Range Slider */}
              <div className="flex items-center gap-3 bg-surface-theme p-2 rounded-xl border border-theme-main">
                <span className="text-xs text-theme-muted">Radius:</span>
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
                <div key={store.id} className="bg-surface-theme border border-theme-main rounded-2xl p-5 space-y-4 hover:border-emerald-400/30 transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-theme-heading">{store.storeName}</h4>
                      <p className="text-xs text-theme-muted">{store.address}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap">
                      📍 {store.distanceMiles} miles away
                    </span>
                  </div>

                  {/* Size Stock Matrix */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-theme-muted mr-2">Available Sizes:</span>
                    {Object.entries(store.sizeStock).map(([size, count]) => (
                      <div
                        key={size}
                        className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                          count > 0
                            ? 'bg-surface-subtle-theme border-emerald-400/40 text-emerald-300'
                            : 'bg-surface-theme/40 border-theme-subtle text-theme-muted line-through'
                        }`}
                      >
                        <span>{size}</span>
                        {count > 0 && <span className="text-[10px] text-theme-muted">({count})</span>}
                      </div>
                    ))}
                  </div>

                  {/* Reserve for In-Store Pickup */}
                  <div className="flex items-center justify-between pt-3 border-t border-theme-subtle">
                    <div className="flex items-center gap-1.5 text-[11px] text-theme-muted">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Held for 24 hours upon confirmation</span>
                    </div>

                    {reservationResult?.storeName === store.storeName ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span>Reserved for Pickup!</span>
                      </div>
                    ) : (
                    <button
                      onClick={() => {
                        setReservingStore(store);
                        setReservationResult(null);
                      }}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-theme-main pb-4">
          <div>
            <h3 className="font-serif font-bold text-2xl text-theme-heading">Find Similar Items with Budget Filter</h3>
            <p className="text-xs text-theme-muted">CLIP vector embedding nearest-neighbor similarity search</p>
          </div>

          {/* Budget Slider */}
          <div className="flex items-center gap-4 bg-surface-theme p-3 rounded-2xl border border-theme-main min-w-[280px]">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-theme-muted">Max Budget:</span>
                <span className="text-amber-800 dark:text-amber-300">${maxBudget}</span>
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
          {filteredProducts.map((prod: RetailProduct) => (
            <div key={prod.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-56 relative overflow-hidden group">
                <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-surface-theme/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-theme-main">
                  {prod.similarityScore}% Visual Match
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-theme-muted font-semibold">{prod.brand}</div>
                  <h4 className="font-serif font-bold text-sm text-theme-heading mt-0.5 line-clamp-1">{prod.title}</h4>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-amber-800 dark:text-amber-300">${prod.price}</span>
                  <span className="text-[10px] text-theme-muted">{prod.retailer}</span>
                </div>

                <button
                  onClick={() => onSelectProduct(prod)}
                  className="w-full bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading py-2 rounded-xl transition-all"
                >
                  Inspect Stock & Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store Item Reservation Modal */}
      {reservingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-theme-heading">Reserve Item for In-Store Pickup</h2>

            {reservationResult ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-theme-heading">Reservation Confirmed!</h3>
                  <p className="text-xs text-theme-secondary mt-1">{reservationResult.message}</p>
                </div>

                <div className="bg-surface-theme border border-theme-main rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Confirmation Code:</span>
                    <span className="font-mono font-bold text-amber-800 dark:text-amber-300">{reservationResult.reservation.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Store:</span>
                    <span className="text-theme-heading font-semibold">{reservationResult.storeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Item & Size:</span>
                    <span className="text-emerald-300 font-semibold">{reservationResult.reservation.productTitle} ({reservationResult.reservation.size})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Hold Duration:</span>
                    <span className="text-theme-secondary">48 Hours</span>
                  </div>
                </div>

                <button
                  onClick={() => setReservingStore(null)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold py-3 rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmReservation} className="space-y-4">
                <div className="bg-surface-theme p-3 rounded-xl border border-theme-main text-xs space-y-1">
                  <div className="font-bold text-theme-heading">{activeProduct.title}</div>
                  <div className="text-theme-muted">{reservingStore.storeName} • {reservingStore.address}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Select Size</label>
                  <div className="flex gap-2">
                    {Object.keys(reservingStore.sizeStock).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedSize === size
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-surface-theme border-theme-main text-theme-muted hover:text-theme-heading'
                        }`}
                      >
                        {size} ({reservingStore.sizeStock[size]})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-emerald-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Phone Number (For SMS pickup reminder)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-emerald-400 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-main">
                  <button
                    type="button"
                    onClick={() => setReservingStore(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Confirm & Reserve Item
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
