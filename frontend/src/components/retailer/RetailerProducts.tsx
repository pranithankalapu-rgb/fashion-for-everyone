import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import type { RetailProduct, OccasionType, ProductStatus } from '../../types/fashion';

interface RetailerProductsProps {
  products: RetailProduct[];
  onAddProduct: (p: Omit<RetailProduct, 'id'>) => void;
  onUpdateProduct: (p: RetailProduct) => void;
  onDeleteProduct: (id: string) => void;
  initialAddModalOpen?: boolean;
}

const CATEGORIES = ['Coats & Jackets', 'Dresses', 'Pants', 'Shirts', 'Shoes', 'Accessories'];
const BRANDS = ['Aria Vance Studio', 'Mango Luxe', 'Zara Atelier', 'Elysian Atelier', 'Atelier Noir', 'Studio Chic'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const OCCASIONS: OccasionType[] = ['Work', 'Casual', 'Date night', 'Formal', 'Party', 'Travel'];
const STATUSES: ProductStatus[] = ['Active', 'Draft', 'Low Stock', 'Out of Stock', 'Archived'];

export const RetailerProducts: React.FC<RetailerProductsProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  initialAddModalOpen = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(700);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(initialAddModalOpen);
  const [editingProduct, setEditingProduct] = useState<RetailProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Form Field States
  const [formTitle, setFormTitle] = useState('');
  const [formBrand, setFormBrand] = useState(BRANDS[0]);
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formPrice, setFormPrice] = useState<number>(199);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(249);
  const [formDiscount, setFormDiscount] = useState<number>(20);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOccasion, setFormOccasion] = useState<OccasionType>('Casual');
  const [formStatus, setFormStatus] = useState<ProductStatus>('Active');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [formColors, setFormColors] = useState<string[]>(['#1E293B', '#D97706']);
  const [formSku, setFormSku] = useState('');

  // Filtered Products List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesBrand = selectedBrand === 'All' || p.brand.toLowerCase() === selectedBrand.toLowerCase();
    const matchesSize = selectedSize === 'All' || (p.sizes && p.sizes.includes(selectedSize));
    const matchesOccasion = selectedOccasion === 'All' || p.occasion === selectedOccasion;
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const matchesPrice = p.price <= maxPrice;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesBrand &&
      matchesSize &&
      matchesOccasion &&
      matchesStatus &&
      matchesPrice
    );
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormBrand(BRANDS[0]);
    setFormCategory(CATEGORIES[0]);
    setFormPrice(199);
    setFormOriginalPrice(249);
    setFormDiscount(20);
    setFormImageUrl('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80');
    setFormDescription('High-end tailored garment crafted with premium materials.');
    setFormOccasion('Casual');
    setFormStatus('Active');
    setFormSizes(['S', 'M', 'L']);
    setFormColors(['#1E293B', '#D97706']);
    setFormSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: RetailProduct) => {
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormBrand(product.brand);
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice || product.price);
    setFormDiscount(product.discountPercent || 0);
    setFormImageUrl(product.imageUrl);
    setFormDescription(product.description || '');
    setFormOccasion(product.occasion || 'Casual');
    setFormStatus(product.status || 'Active');
    setFormSizes(product.sizes || ['S', 'M', 'L']);
    setFormColors(product.colors || ['#1E293B']);
    setFormSku(product.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formImageUrl) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        title: formTitle,
        brand: formBrand,
        category: formCategory,
        price: formPrice,
        originalPrice: formOriginalPrice,
        discountPercent: formDiscount,
        imageUrl: formImageUrl,
        description: formDescription,
        occasion: formOccasion,
        status: formStatus,
        sizes: formSizes,
        colors: formColors,
        sku: formSku,
      });
    } else {
      onAddProduct({
        title: formTitle,
        brand: formBrand,
        category: formCategory,
        price: formPrice,
        originalPrice: formOriginalPrice,
        discountPercent: formDiscount,
        imageUrl: formImageUrl,
        silhouette: 'Custom Tailored',
        retailer: 'Nordstrom Flagship',
        affiliateUrl: '#',
        description: formDescription,
        occasion: formOccasion,
        status: formStatus,
        sizes: formSizes,
        colors: formColors,
        sku: formSku,
        stockQuantity: 15,
      });
    }
    setIsModalOpen(false);
  };

  const toggleSizeSelection = (sz: string) => {
    setFormSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Product Catalog & Attributes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Products Management
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Add, edit, filter, and organize store products by occasion, category, brand, and size.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel rounded-3xl p-5 space-y-4 border border-theme-main">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, brand, SKU..."
              className="w-full h-10 pl-10 pr-4 bg-surface-theme border border-theme-main focus:border-amber-400/50 rounded-xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
            />
          </div>

          {/* Quick Filter Count Badge */}
          <div className="text-xs text-theme-muted font-semibold flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>
              Showing <strong className="text-theme-heading">{filteredProducts.length}</strong> of {products.length} Products
            </span>
          </div>
        </div>

        {/* Multi-attribute Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-theme-subtle">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-surface-theme border border-theme-main rounded-xl px-2.5 py-1.5 text-xs text-theme-heading outline-none focus:border-amber-400"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase mb-1">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-surface-theme border border-theme-main rounded-xl px-2.5 py-1.5 text-xs text-theme-heading outline-none focus:border-amber-400"
            >
              <option value="All">All Brands</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase mb-1">Size</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full bg-surface-theme border border-theme-main rounded-xl px-2.5 py-1.5 text-xs text-theme-heading outline-none focus:border-amber-400"
            >
              <option value="All">All Sizes</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Occasion Filter */}
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase mb-1">Occasion</label>
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full bg-surface-theme border border-theme-main rounded-xl px-2.5 py-1.5 text-xs text-theme-heading outline-none focus:border-amber-400"
            >
              <option value="All">All Occasions</option>
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-surface-theme border border-theme-main rounded-xl px-2.5 py-1.5 text-xs text-theme-heading outline-none focus:border-amber-400"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Max Price Range Filter */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-theme-muted uppercase mb-1">
              <span>Max Price</span>
              <span className="text-amber-400">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {/* Products Grid Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="glass-card rounded-3xl overflow-hidden border border-theme-main flex flex-col justify-between group hover:border-amber-400/50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            {/* Image Spotlight */}
            <div className="h-56 relative overflow-hidden bg-surface-theme">
              <img
                src={prod.imageUrl}
                alt={prod.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs ${
                    prod.status === 'Active'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : prod.status === 'Low Stock'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : prod.status === 'Out of Stock'
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-surface-theme/80 border-theme-subtle text-theme-muted'
                  }`}
                >
                  {prod.status || 'Active'}
                </span>
              </div>

              {/* Occasion Badge */}
              {prod.occasion && (
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 border border-amber-400/40 text-amber-300 backdrop-blur-md">
                    {prod.occasion}
                  </span>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] text-theme-muted font-mono mb-1">
                  <span>SKU: {prod.sku || 'N/A'}</span>
                  <span>{prod.brand}</span>
                </div>

                <h3 className="font-serif font-bold text-sm text-theme-heading line-clamp-1 group-hover:text-amber-400 transition-colors">
                  {prod.title}
                </h3>

                {prod.description && (
                  <p className="text-[11px] text-theme-muted mt-1 line-clamp-2">{prod.description}</p>
                )}
              </div>

              {/* Price & Discount */}
              <div className="pt-2 border-t border-theme-subtle flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-amber-300 font-mono">${prod.price}</span>
                    {prod.originalPrice && (
                      <span className="text-xs text-theme-muted line-through font-mono">${prod.originalPrice}</span>
                    )}
                  </div>
                  {prod.discountPercent && prod.discountPercent > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">{prod.discountPercent}% OFF</span>
                  )}
                </div>

                {/* Available Sizes Swatches */}
                <div className="flex gap-1 text-[9px] font-bold">
                  {(prod.sizes || ['S', 'M', 'L']).map((sz) => (
                    <span key={sz} className="px-1.5 py-0.5 rounded bg-surface-theme border border-theme-subtle text-theme-secondary">
                      {sz}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-theme-subtle">
                <button
                  onClick={() => handleOpenEditModal(prod)}
                  className="flex-1 py-2 px-3 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-xs font-bold text-theme-heading flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeletingProductId(prod.id)}
                  className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-theme-main pb-4">
              <h2 className="text-xl font-serif font-bold text-theme-heading">
                {editingProduct ? 'Edit Product Attributes' : 'Add New Retail Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Product Title / Name *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Double-Breasted Italian Wool Trench Coat"
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Brand *</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  >
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Retail Price ($) *</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Original MSRP Price ($)</label>
                  <input
                    type="number"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  />
                </div>

                {/* Discount % */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">SKU Number</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  />
                </div>

                {/* Occasion Attribute */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Occasion Attribute *</label>
                  <select
                    value={formOccasion}
                    onChange={(e) => setFormOccasion(e.target.value as OccasionType)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  >
                    {OCCASIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Stock Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Product Image URL *</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                {/* Sizes Checkboxes */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-theme-muted">Available Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((sz) => {
                      const isSelected = formSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSizeSelection(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                              : 'bg-surface-theme border-theme-main text-theme-muted hover:text-theme-heading'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe tailoring details, fabric composition, fit rationale..."
                    className="w-full bg-surface-theme border border-theme-main rounded-xl p-3 text-xs text-theme-heading focus:border-amber-400 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-main">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg hover:brightness-110 cursor-pointer"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-theme-heading">Delete Product?</h3>
              <p className="text-xs text-theme-muted mt-1">
                Are you sure you want to remove this product from your retailer catalog? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-surface-theme border border-theme-main text-theme-heading cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(deletingProductId);
                  setDeletingProductId(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-500 text-slate-950 hover:bg-rose-400 transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
