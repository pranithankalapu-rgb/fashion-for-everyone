import React, { useState, useEffect } from 'react';
import type { RetailProduct } from '../../types/fashion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  Tag,
  Package,
  Layers,
  DollarSign,
  X,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
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
    setDescription('');
    setSilhouette('Tailored');
    setRetailer('Nordstrom Flagship');
    setAffiliateUrl('#');
    setImageUrl('');
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (product: RetailProduct) => {
    setEditingProduct(product);
    setTitle(product.title);
    setBrand(product.brand);
    setCategory(product.category);
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setStockQuantity(product.stockQuantity !== undefined ? product.stockQuantity.toString() : '10');
    setSku(product.sku || '');
    setDescription(product.description || '');
    setSilhouette(product.silhouette || 'Tailored');
    setRetailer(product.retailer || 'Direct Flagship');
    setAffiliateUrl(product.affiliateUrl || '#');
    setImageUrl(product.imageUrl || '');
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || isNaN(Number(price))) {
      showNotification('error', 'Title and valid numerical price are required.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('brand', brand);
      formData.append('category', category);
      formData.append('price', price);
      if (originalPrice) formData.append('originalPrice', originalPrice);
      formData.append('stockQuantity', stockQuantity);
      formData.append('sku', sku);
      formData.append('description', description);
      formData.append('silhouette', silhouette);
      formData.append('retailer', retailer);
      formData.append('affiliateUrl', affiliateUrl);

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save product');
      }

      const savedProduct = await res.json();

      showNotification(
        'success',
        editingProduct ? `Updated product "${savedProduct.title}"` : `Created product "${savedProduct.title}"`
      );

      setIsFormOpen(false);
      fetchProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, productTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete product');

      showNotification('success', `Product "${productTitle}" deleted.`);
      fetchProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-slideDown max-w-md ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Admin Panel Header Banner */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Package className="w-3.5 h-3.5" />
            <span>PostgreSQL & Prisma Product Management</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-theme-heading">Admin Product Control Panel</h1>
          <p className="text-xs text-theme-muted">
            Manage live store inventory, upload product images via Multer, and monitor PostgreSQL database updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="p-3 rounded-2xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-theme-heading text-xs font-bold flex items-center gap-2 transition-all"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateForm}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <button
            onClick={onLogout}
            className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-theme border border-theme-main rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-theme-muted" />
          <input
            type="text"
            placeholder="Search by title, brand, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Layers className="w-4 h-4 text-amber-400 flex-shrink-0 hidden md:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'bg-modal-theme border border-theme-main text-theme-muted hover:text-theme-heading'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Inventory Table */}
      <div className="bg-surface-theme border border-theme-main rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-theme-main bg-modal-theme text-theme-muted font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-4">Category & SKU</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Stock</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-main/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-theme-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span>Loading products from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-theme-muted">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-subtle-theme/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-12 h-14 object-cover rounded-xl border border-theme-main bg-black/20"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            {product.brand}
                          </span>
                          <h4 className="font-bold text-theme-heading text-sm line-clamp-1">{product.title}</h4>
                          <span className="text-[11px] text-theme-muted">{product.retailer}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 text-theme-heading font-medium">
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span>{product.category}</span>
                        </div>
                        <div className="text-[11px] text-theme-muted font-mono">{product.sku || 'N/A'}</div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-amber-300">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-[11px] text-theme-muted line-through">${product.originalPrice}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-theme-heading">{product.stockQuantity ?? 0} units</td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          product.status === 'Active'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                            : product.status === 'Low Stock'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{product.status || 'Active'}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditForm(product)}
                        className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-amber-400 hover:text-amber-300 transition-all"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.title)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-theme-heading">
                {editingProduct ? 'Edit Product Record' : 'Create New Product Record'}
              </h2>
              <p className="text-xs text-theme-muted">
                Fill in the details below. You can upload a new product image directly to <code className="text-amber-300">backend/uploads/</code>.
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-theme-secondary">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Double-Breasted Italian Wool Trench Coat"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Aria Vance Studio"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Price ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="340.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Original Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="420.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">Stock Quantity</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="15"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="AVS-TR-101"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Multer File Upload Section */}
              <div className="space-y-2 pt-2 border-t border-theme-main">
                <label className="text-xs font-semibold text-theme-secondary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Product Image (Multer File Upload or URL)</span>
                  </span>
                  {imageFile && <span className="text-emerald-400 text-[10px]">File Selected</span>}
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <label className="w-full sm:w-auto flex-1 cursor-pointer bg-surface-theme hover:bg-surface-subtle-theme border border-dashed border-amber-500/40 rounded-xl p-3 text-center transition-all flex items-center justify-center gap-2 text-xs text-amber-300">
                    <ImageIcon className="w-4 h-4" />
                    <span>{imageFile ? imageFile.name : 'Choose File to Upload...'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-theme-muted">or</span>

                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL https://..."
                    className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masterfully crafted tailoring item..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
