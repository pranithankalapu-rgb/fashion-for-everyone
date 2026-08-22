import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { RetailProduct } from '../../types/fashion';

interface RetailerInventoryProps {
  products: RetailProduct[];
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const RetailerInventory: React.FC<RetailerInventoryProps> = ({
  products,
  onUpdateStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [editingStockProduct, setEditingStockProduct] = useState<RetailProduct | null>(null);
  const [customStockVal, setCustomStockVal] = useState<number>(0);

  // Helper to determine status based on stock quantity
  const getStockStatus = (qty: number | undefined) => {
    const q = qty ?? 10;
    if (q === 0) return 'Out of Stock';
    if (q <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const filteredProducts = products.filter((p) => {
    const qty = p.stockQuantity ?? 10;
    const status = getStockStatus(qty);

    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // KPI calculations
  const totalStockCount = products.reduce((acc, p) => acc + (p.stockQuantity ?? 10), 0);
  const lowStockCount = products.filter((p) => (p.stockQuantity ?? 10) > 0 && (p.stockQuantity ?? 10) <= 5).length;
  const outOfStockCount = products.filter((p) => (p.stockQuantity ?? 10) === 0).length;

  const handleOpenEditStock = (prod: RetailProduct) => {
    setEditingStockProduct(prod);
    setCustomStockVal(prod.stockQuantity ?? 10);
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockProduct) return;
    onUpdateStock(editingStockProduct.id, Math.max(0, customStockVal));
    setEditingStockProduct(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Boxes className="w-3.5 h-3.5" />
            <span>Real-time Inventory Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Monitor SKU availability, update physical stock counts, and manage low stock threshold alerts.
          </p>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-theme-main flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Total Units in Stock</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{totalStockCount} Units</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-theme-main flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Low Stock Items</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">{lowStockCount} SKUs</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-theme-main flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Out of Stock Alerts</div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-0.5">{outOfStockCount} SKUs</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-3xl p-5 space-y-4 border border-theme-main">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU..."
              className="w-full h-10 pl-10 pr-4 bg-surface-theme border border-theme-main focus:border-amber-400/50 rounded-xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-theme rounded-xl border border-theme-main text-xs">
            {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                    : 'text-theme-muted hover:text-theme-heading'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 bg-surface-theme border border-theme-main rounded-xl px-3 text-xs text-theme-heading outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-theme-main shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-main bg-surface-theme/50 text-theme-muted uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Sizes & Colors</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Status Indicator</th>
                <th className="py-3.5 px-4 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {filteredProducts.map((prod) => {
                const stock = prod.stockQuantity ?? 10;
                const status = getStockStatus(stock);

                return (
                  <tr key={prod.id} className="hover:bg-surface-subtle-theme/60 transition-colors">
                    {/* Product Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="w-10 h-12 object-cover rounded-xl border border-theme-subtle flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-theme-heading text-xs">{prod.title}</div>
                          <div className="text-[10px] text-theme-muted">{prod.brand} • {prod.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-theme-secondary">
                      {prod.sku || `SKU-${prod.id.replace('prod_', '')}`}
                    </td>

                    {/* Sizes & Colors */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex gap-1 text-[9px] font-bold">
                          {(prod.sizes || ['S', 'M', 'L']).map((sz) => (
                            <span key={sz} className="px-1.5 py-0.5 rounded bg-surface-theme border border-theme-subtle text-theme-secondary">
                              {sz}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {prod.colors.map((hex, i) => (
                            <span key={i} className="w-3 h-3 rounded-full border border-theme-subtle" style={{ backgroundColor: hex }} />
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Stock Level */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sm text-theme-heading">
                        {stock} Units
                      </div>
                      <div className="text-[10px] text-theme-muted">Available in warehouse</div>
                    </td>

                    {/* Status Indicator */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                          status === 'In Stock'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : status === 'Low Stock'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {status === 'In Stock' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {status === 'Low Stock' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {status === 'Out of Stock' && <XCircle className="w-3 h-3 text-rose-400" />}
                        <span>{status}</span>
                      </span>
                    </td>

                    {/* Quick Stock Adjustment */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUpdateStock(prod.id, Math.max(0, stock - 1))}
                          className="p-1.5 rounded-lg bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-muted hover:text-theme-heading transition-colors cursor-pointer"
                          title="Decrease Stock (-1)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold w-7 text-center text-xs text-theme-heading">{stock}</span>
                        <button
                          onClick={() => onUpdateStock(prod.id, stock + 1)}
                          className="p-1.5 rounded-lg bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-muted hover:text-theme-heading transition-colors cursor-pointer"
                          title="Increase Stock (+1)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditStock(prod)}
                          className="ml-2 px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Set Quantity
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Stock Modal */}
      {editingStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-lg font-serif font-bold text-theme-heading">Update Available Stock</h2>
            <div className="bg-surface-theme p-3 rounded-2xl border border-theme-main flex items-center gap-3">
              <img src={editingStockProduct.imageUrl} alt={editingStockProduct.title} className="w-12 h-14 object-cover rounded-xl" />
              <div>
                <div className="font-bold text-xs text-theme-heading">{editingStockProduct.title}</div>
                <div className="text-[10px] text-theme-muted">SKU: {editingStockProduct.sku || editingStockProduct.id}</div>
              </div>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Set Inventory Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={customStockVal}
                  onChange={(e) => setCustomStockVal(Number(e.target.value))}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-theme-heading focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStockProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-lg cursor-pointer"
                >
                  Save Stock Quantity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
