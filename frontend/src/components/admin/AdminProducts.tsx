import React, { useState, useEffect } from 'react';
import type { RetailProduct } from '../../types/fashion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
  X,
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<RetailProduct | null>(null);

  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Coats & Jackets');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [silhouette, setSilhouette] = useState('Tailored');
  const [retailer, setRetailer] = useState('Direct Flagship');
  const [affiliateUrl, setAffiliateUrl] = useState('#');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = ['All', 'Coats & Jackets', 'Dresses', 'Pants', 'Tops', 'Accessories'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenCreateForm = () => {
    setEditingProduct(null);
    setTitle('');
    setBrand('Fashion Studio');
    setCategory('Coats & Jackets');
    setPrice('199');
    setOriginalPrice('249');
    setStockQuantity('15');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setDescription('Handcrafted tailored luxury garment designed for versatile styling.');
    setSilhouette('Tailored');
    setRetailer('Direct Flagship');
    setAffiliateUrl('#');
    setImageUrl('');
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (p: RetailProduct) => {
    setEditingProduct(p);
    setTitle(p.title);
    setBrand(p.brand);
    setCategory(p.category);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setStockQuantity(p.stockQuantity !== undefined ? p.stockQuantity.toString() : '10');
    setSku(p.sku || '');
    setDescription(p.description || '');
    setSilhouette(p.silhouette || 'Tailored');
    setRetailer(p.retailer || 'Direct Flagship');
    setAffiliateUrl(p.affiliateUrl || '#');
    setImageUrl(p.imageUrl);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('brand', brand);
      formData.append('category', category);
      formData.append('price', price);
      if (originalPrice) formData.append('originalPrice', originalPrice);
      formData.append('stockQuantity', stockQuantity);
      if (sku) formData.append('sku', sku);
      if (description) formData.append('description', description);
      formData.append('silhouette', silhouette);
      formData.append('retailer', retailer);
      formData.append('affiliateUrl', affiliateUrl);

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const token = localStorage.getItem('admin_jwt_token');
      const headers: Record<string, string> = {
        'x-user-role': 'retailer',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save product');
      }

      showNotification('success', editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setIsFormOpen(false);
      fetchProducts();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, productTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}"?`)) return;

    try {
      const token = localStorage.getItem('admin_jwt_token');
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'retailer',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to delete product');

      showNotification('success', 'Product deleted successfully');
      fetchProducts();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-400" />
            Product Catalog Inventory
          </h1>
          <p className="text-sm text-slate-400">Manage catalog merchandise, pricing, and stock levels in PostgreSQL.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span className="text-xs font-medium">Sync DB</span>
          </button>
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md group hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden">
                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white">
                  ${p.price}
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">{p.brand}</span>
                <h3 className="text-sm font-bold text-white line-clamp-1">{p.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{p.category}</span>
                  <span className={`font-semibold ${p.stockQuantity && p.stockQuantity <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {p.stockQuantity ?? 10} in stock
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleOpenEditForm(p)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(p.id, p.title)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Original Price ($)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
