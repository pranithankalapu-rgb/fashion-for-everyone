import React, { useState } from 'react';
import {
  Settings,
  Store,
  User,
  MapPin,
  Sliders,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Key,
} from 'lucide-react';
import type { StoreSettings } from '../../types/fashion';

interface RetailerSettingsProps {
  settings: StoreSettings;
  onSaveSettings: (updated: StoreSettings) => void;
}

export const RetailerSettings: React.FC<RetailerSettingsProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'profile' | 'contact' | 'preferences' | 'notifications' | 'security'>('store');

  const handleChange = (field: keyof StoreSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Store Configuration Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            Retailer Settings
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Manage store profile, contact info, fulfillment preferences, notification alerts, and account security.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* Main Settings Navigation & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sub-nav (3 Cols) */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-3 space-y-1 border border-theme-main h-fit">
          {[
            { id: 'store', label: 'Store Information', icon: Store },
            { id: 'profile', label: 'Retailer Profile', icon: User },
            { id: 'contact', label: 'Contact Details', icon: MapPin },
            { id: 'preferences', label: 'Store Preferences', icon: Sliders },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Account & Security', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                    : 'text-theme-body hover:bg-surface-subtle-theme hover:text-theme-heading border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-theme-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Form Content (9 Cols) */}
        <div className="lg:col-span-9 glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-theme-main">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* 1. STORE INFORMATION */}
            {activeSubTab === 'store' && (
              <div className="space-y-4">
                <div className="border-b border-theme-subtle pb-3">
                  <h3 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-400" />
                    <span>Store Information</span>
                  </h3>
                  <p className="text-xs text-theme-muted">General brand details displayed on customer receipts and invoices</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Store Display Name</label>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => handleChange('storeName', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Store Logo URL</label>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => handleChange('logoUrl', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Tax ID / Business Registration #</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs font-mono text-theme-heading focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Store Base Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                    >
                      <option value="$">USD ($)</option>
                      <option value="€">EUR (€)</option>
                      <option value="£">GBP (£)</option>
                      <option value="₹">INR (₹)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RETAILER PROFILE */}
            {activeSubTab === 'profile' && (
              <div className="space-y-4">
                <div className="border-b border-theme-subtle pb-3">
                  <h3 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Retailer Manager Profile</span>
                  </h3>
                  <p className="text-xs text-theme-muted">Owner and store manager administrative identity</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Manager Full Name</label>
                    <input
                      type="text"
                      value={formData.managerName}
                      onChange={(e) => handleChange('managerName', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Manager Email Address</label>
                    <input
                      type="email"
                      value={formData.managerEmail}
                      onChange={(e) => handleChange('managerEmail', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Direct Phone Number</label>
                    <input
                      type="text"
                      value={formData.managerPhone}
                      onChange={(e) => handleChange('managerPhone', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. CONTACT INFORMATION */}
            {activeSubTab === 'contact' && (
              <div className="space-y-4">
                <div className="border-b border-theme-subtle pb-3">
                  <h3 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Contact Information & Support</span>
                  </h3>
                  <p className="text-xs text-theme-muted">Physical address and customer support contact channels</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">Physical Store Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-theme-muted mb-1">Customer Support Email</label>
                      <input
                        type="email"
                        value={formData.supportEmail}
                        onChange={(e) => handleChange('supportEmail', e.target.value)}
                        className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-theme-muted mb-1">Support Phone Hotline</label>
                      <input
                        type="text"
                        value={formData.supportPhone}
                        onChange={(e) => handleChange('supportPhone', e.target.value)}
                        className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. STORE PREFERENCES */}
            {activeSubTab === 'preferences' && (
              <div className="space-y-4">
                <div className="border-b border-theme-subtle pb-3">
                  <h3 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-rose-400" />
                    <span>Operational Store Preferences</span>
                  </h3>
                  <p className="text-xs text-theme-muted">Configure inventory triggers and order processing modes</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-theme border border-theme-main">
                    <div>
                      <div className="text-xs font-bold text-theme-heading">Auto-Fulfill Digital Orders</div>
                      <div className="text-[10px] text-theme-muted">Automatically mark paid orders as processing</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.autoFulfill}
                      onChange={(e) => handleChange('autoFulfill', e.target.checked)}
                      className="w-5 h-5 accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-theme border border-theme-main space-y-2">
                    <label className="block text-xs font-bold text-theme-heading">Low Stock Warning Threshold</label>
                    <p className="text-[10px] text-theme-muted">Trigger low stock alert when product inventory falls below:</p>
                    <input
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => handleChange('lowStockThreshold', Number(e.target.value))}
                      className="w-32 bg-surface-subtle-theme border border-theme-main rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. NOTIFICATIONS */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-4">
                <div className="border-b border-theme-subtle pb-3">
                  <h3 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Notification & Alert Preferences</span>
                  </h3>
                  <p className="text-xs text-theme-muted">Manage automated operational emails and SMS notifications</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-theme border border-theme-main">
                    <div>
                      <div className="text-xs font-bold text-theme-heading">Email Order Notifications</div>
                      <div className="text-[10px] text-theme-muted">Send immediate email whenever a new customer order is placed</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                      className="w-5 h-5 accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-theme border border-theme-main">
                    <div>
                      <div className="text-xs font-bold text-theme-heading">SMS Low Stock Alerts</div>
                      <div className="text-[10px] text-theme-muted">Send SMS text alert when item stock reaches critical level</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.smsAlerts}
                      onChange={(e) => handleChange('smsAlerts', e.target.checked)}
                      className="w-5 h-5 accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-theme border border-theme-main">
                    <div>
                      <div className="text-xs font-bold text-theme-heading">Weekly Performance Digest</div>
                      <div className="text-[10px] text-theme-muted">Receive weekly revenue summary report every Monday</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.weeklyReport}
                      onChange={(e) => handleChange('weeklyReport', e.target.checked)}
                      className="w-5 h-5 accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. ACCOUNT & SECURITY */}
            {activeSubTab === 'security' && (
              <div className="space-y-4">
                <div className="border-b border-theme-subtle pb-3">
                  <h3 className="text-base font-serif font-bold text-theme-heading flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Account & Security Settings</span>
                  </h3>
                  <p className="text-xs text-theme-muted">API credentials and password protection</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-theme border border-theme-main space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-theme-heading">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Retailer POS API Key</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        readOnly
                        value="sk_live_9482019482019482"
                        className="flex-1 bg-surface-subtle-theme border border-theme-main rounded-xl px-3 py-2 text-xs font-mono text-theme-muted outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => alert('API Key copied to clipboard!')}
                        className="px-3 py-2 rounded-xl bg-surface-subtle-theme hover:bg-surface-theme border border-theme-main text-xs font-bold text-amber-400 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-theme border border-theme-main space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-theme-heading">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>Password & Two-Factor Authentication</span>
                    </div>
                    <p className="text-[11px] text-theme-muted">Ensure your store account is protected with strong security standards.</p>
                    <button
                      type="button"
                      onClick={() => alert('Password reset link sent to manager email.')}
                      className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold cursor-pointer"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-theme-main">
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg hover:brightness-110 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save All Store Settings</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
