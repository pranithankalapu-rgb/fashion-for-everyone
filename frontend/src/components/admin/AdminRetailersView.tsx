import React, { useState, useEffect } from 'react';
import type { RetailerCustomer, Promotion, StoreSettings, StoreStock } from '../../types/fashion';
import {
  Store,
  Users,
  Tag,
  MapPin,
  Settings,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Power,
  DollarSign,
  Building,
  Mail,
} from 'lucide-react';

export const AdminRetailersView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'crm' | 'promotions' | 'stores' | 'settings'>('crm');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // CRM State
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [loadingCrm, setLoadingCrm] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<RetailerCustomer | null>(null);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custStatus, setCustStatus] = useState('New');

  // Promotions State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState<boolean>(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountValue, setDiscountValue] = useState('20');
  const [promoCategory, setPromoCategory] = useState('');
  const [maxUses, setMaxUses] = useState('500');

  // Stores State
  const [stores, setStores] = useState<StoreStock[]>([]);
  const [loadingStores, setLoadingStores] = useState<boolean>(false);

  // Settings State
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  useEffect(() => {
    if (activeSubTab === 'crm') fetchCustomers();
    if (activeSubTab === 'promotions') fetchPromotions();
    if (activeSubTab === 'stores') fetchStores();
    if (activeSubTab === 'settings') fetchSettings();
  }, [activeSubTab]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- CRM CUSTOMERS ---
  const fetchCustomers = async () => {
    setLoadingCrm(true);
    try {
      const res = await fetch('/api/retailer/customers', { headers: { 'x-user-role': 'retailer' } });
      if (!res.ok) throw new Error('Failed to load CRM customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Error fetching CRM customers');
    } finally {
      setLoadingCrm(false);
    }
  };

  const handleOpenCreateCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustStatus('New');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: RetailerCustomer) => {
    setEditingCustomer(c);
    setCustName(c.name);
    setCustEmail(c.email);
    setCustPhone(c.phone || '');
    setCustStatus(c.status);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name: custName, email: custEmail, phone: custPhone, status: custStatus };
      const url = editingCustomer ? `/api/retailer/customers/${editingCustomer.id}` : '/api/retailer/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save customer');
      }

      showNotification('success', editingCustomer ? 'Customer updated' : 'Customer created');
      setIsCustomerModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving customer');
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Delete customer ${name}?`)) return;
    try {
      const res = await fetch(`/api/retailer/customers/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'retailer' },
      });
      if (!res.ok) throw new Error('Failed to delete customer');
      showNotification('success', `Customer ${name} deleted.`);
      fetchCustomers();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete customer');
    }
  };

  // --- PROMOTIONS ---
  const fetchPromotions = async () => {
    setLoadingPromos(true);
    try {
      const res = await fetch('/api/promotions');
      if (!res.ok) throw new Error('Failed to load promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Error fetching promotions');
    } finally {
      setLoadingPromos(false);
    }
  };

  const handleOpenCreatePromo = () => {
    setEditingPromo(null);
    setPromoCode(`PROMO${Math.floor(1000 + Math.random() * 9000)}`);
    setPromoTitle('Seasonal Tailoring Sale');
    setDiscountType('Percentage');
    setDiscountValue('20');
    setPromoCategory('Coats & Jackets');
    setMaxUses('500');
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: promoCode,
        title: promoTitle,
        discountType,
        discountValue: Number(discountValue),
        category: promoCategory || undefined,
        maxUses: Number(maxUses),
      };
      const url = editingPromo ? `/api/promotions/${editingPromo.id}` : '/api/promotions';
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save promotion');
      }

      showNotification('success', editingPromo ? 'Promotion updated' : 'Promotion created');
      setIsPromoModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving promotion');
    }
  };

  const handleTogglePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/promotions/${id}/deactivate`, {
        method: 'PATCH',
        headers: { 'x-user-role': 'retailer' },
      });
      if (!res.ok) throw new Error('Failed to toggle promotion');
      showNotification('success', 'Promotion status updated.');
      fetchPromotions();
    } catch (err: any) {
      showNotification('error', err.message || 'Error toggling promo');
    }
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (!window.confirm(`Delete promotion ${code}?`)) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'retailer' },
      });
      if (!res.ok) throw new Error('Failed to delete promo');
      showNotification('success', `Promotion ${code} deleted.`);
      fetchPromotions();
    } catch (err: any) {
      showNotification('error', err.message || 'Error deleting promo');
    }
  };

  // --- STORES ---
  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const res = await fetch('/api/stores');
      if (!res.ok) throw new Error('Failed to load store stocks');
      const data = await res.json();
      setStores(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Error fetching stores');
    } finally {
      setLoadingStores(false);
    }
  };

  // --- SETTINGS ---
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/store-settings', { headers: { 'x-user-role': 'retailer' } });
      if (!res.ok) throw new Error('Failed to load store settings');
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Error fetching settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      const data = await res.json();
      setSettings(data.settings || settings);
      showNotification('success', 'Store settings updated successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
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

      {/* Header Banner */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>Retailer Operations & Control</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-theme-heading">Retailer Operations Hub</h1>
          <p className="text-xs text-theme-muted">
            Manage retailer CRM customers, active promotional codes, store inventory locations, and global store configurations.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-surface-theme border border-theme-main rounded-2xl p-2 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('crm')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'crm'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>CRM Customers ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('promotions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'promotions'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promotions & Disounts ({promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'stores'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Store Locations ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'settings'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-theme-muted hover:text-theme-heading'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Store Configurations</span>
        </button>
      </div>

      {/* --- TAB 1: CRM CUSTOMERS --- */}
      {activeSubTab === 'crm' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-theme-heading flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Customer Relationship Management (CRM)</span>
            </h3>
            <button
              onClick={handleOpenCreateCustomer}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add CRM Customer</span>
            </button>
          </div>

          <div className="bg-surface-theme border border-theme-main rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-main bg-modal-theme text-theme-muted font-semibold uppercase">
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-4">Contact Info</th>
                    <th className="py-4 px-4">Total Spent</th>
                    <th className="py-4 px-4">Orders Count</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-main/60">
                  {loadingCrm ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-theme-muted">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                        Loading CRM customer database...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-theme-muted">
                        No CRM customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-subtle-theme/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-theme-heading flex items-center gap-3">
                          <img
                            src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={c.name}
                            className="w-9 h-9 rounded-full object-cover border border-theme-main"
                          />
                          <span>{c.name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-theme-heading">{c.email}</div>
                          <div className="text-[11px] text-theme-muted">{c.phone || 'No phone'}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-amber-300">${c.totalSpent}</td>
                        <td className="py-4 px-4 font-bold text-theme-heading">{c.ordersCount} order(s)</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              c.status === 'VIP'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditCustomer(c)}
                            className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-amber-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400"
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
        </div>
      )}

      {/* --- TAB 2: PROMOTIONS --- */}
      {activeSubTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-theme-heading flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Active Promotions & Coupon Codes</span>
            </h3>
            <button
              onClick={handleOpenCreatePromo}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promo Code</span>
            </button>
          </div>

          <div className="bg-surface-theme border border-theme-main rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-main bg-modal-theme text-theme-muted font-semibold uppercase">
                    <th className="py-4 px-6">Promo Code</th>
                    <th className="py-4 px-4">Title & Category</th>
                    <th className="py-4 px-4">Discount</th>
                    <th className="py-4 px-4">Usage</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-main/60">
                  {loadingPromos ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-theme-muted">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                        Loading promotions...
                      </td>
                    </tr>
                  ) : promotions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-theme-muted">
                        No promotions found.
                      </td>
                    </tr>
                  ) : (
                    promotions.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-subtle-theme/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-amber-300 text-sm">{p.code}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-theme-heading">{p.title}</div>
                          <div className="text-[11px] text-theme-muted">{p.category || 'All Categories'}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-emerald-300">
                          {p.discountType === 'Percentage' ? `${p.discountValue}% OFF` : `$${p.discountValue} OFF`}
                        </td>
                        <td className="py-4 px-4 text-theme-heading font-bold">
                          {p.usageCount} / {p.maxUses}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              p.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleTogglePromo(p.id)}
                            className="p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme border border-theme-main text-cyan-400"
                            title="Toggle Active/Inactive"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id, p.code)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400"
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
        </div>
      )}

      {/* --- TAB 3: STORE LOCATIONS --- */}
      {activeSubTab === 'stores' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-theme-heading flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Brick & Mortar Store Stock Locations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingStores ? (
              <div className="col-span-2 py-12 text-center text-theme-muted">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                Loading store stock locations...
              </div>
            ) : stores.map((s) => (
              <div key={s.id} className="bg-surface-theme border border-theme-main rounded-3xl p-6 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{s.retailer}</span>
                  <span className="text-xs text-theme-muted font-bold">{s.distanceMiles} miles away</span>
                </div>
                <h4 className="text-base font-serif font-bold text-theme-heading">{s.storeName}</h4>
                <p className="text-xs text-theme-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>{s.address}</span>
                </p>

                <div className="pt-3 border-t border-theme-main space-y-1.5">
                  <span className="text-[11px] font-semibold text-theme-secondary">Current Size Stock:</span>
                  <div className="flex gap-2">
                    {Object.entries(s.sizeStock || {}).map(([sz, qty]) => (
                      <span
                        key={sz}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          qty > 0 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-modal-theme text-theme-muted'
                        }`}
                      >
                        {sz}: {qty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: STORE SETTINGS --- */}
      {activeSubTab === 'settings' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-theme-heading flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Global Store & Flagship Configurations</span>
          </h3>

          {loadingSettings || !settings ? (
            <div className="py-12 text-center text-theme-muted bg-surface-theme rounded-3xl border border-theme-main">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
              Loading store configuration...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="bg-surface-theme border border-theme-main rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>Store Name</span>
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tax ID / Registration Code</span>
                  </label>
                  <input
                    type="text"
                    value={settings.taxId}
                    onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manager Name</span>
                  </label>
                  <input
                    type="text"
                    value={settings.managerName}
                    onChange={(e) => setSettings({ ...settings, managerName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manager Email</span>
                  </label>
                  <input
                    type="email"
                    value={settings.managerEmail}
                    onChange={(e) => setSettings({ ...settings, managerEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Store Flagship Address</span>
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-modal-theme border border-theme-main text-xs text-theme-heading"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-theme-main">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Store Configuration</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* CRM Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme text-theme-muted hover:text-theme-heading"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-serif font-bold text-theme-heading">
              {editingCustomer ? 'Edit CRM Customer' : 'Add CRM Customer'}
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Customer Full Name"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              />
              <input
                type="email"
                required
                placeholder="Customer Email Address"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              />
              <select
                value={custStatus}
                onChange={(e) => setCustStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              >
                <option value="New">New</option>
                <option value="Active">Active</option>
                <option value="VIP">VIP</option>
              </select>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsPromoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme text-theme-muted hover:text-theme-heading"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-serif font-bold text-theme-heading">
              {editingPromo ? 'Edit Promotion' : 'Create Promotion Code'}
            </h3>
            <form onSubmit={handleSavePromo} className="space-y-3">
              <input
                type="text"
                required
                placeholder="PROMO CODE (e.g. SUMMER2026)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading font-mono"
              />
              <input
                type="text"
                required
                placeholder="Promotion Title"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed Amount">Fixed Amount ($)</option>
                </select>
                <input
                  type="number"
                  required
                  placeholder="Value"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs text-theme-heading"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
