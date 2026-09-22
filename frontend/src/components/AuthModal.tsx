import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShoppingBag,
  Palette,
  Store,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import type { UserProfile, UserRole } from '../types/fashion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, role: UserRole) => void;
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  initialRole = 'customer',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'designer' | 'retailer'>(
    initialRole === 'admin' ? 'customer' : (initialRole as any)
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const roleOptions: Array<{
    id: 'customer' | 'designer' | 'retailer';
    label: string;
    tagline: string;
    icon: React.ElementType;
    iconColor: string;
    badgeColor: string;
    borderActive: string;
  }> = [
    {
      id: 'customer',
      label: 'Customer',
      tagline: 'AI styling, lookbooks & personalized shopping',
      icon: ShoppingBag,
      iconColor: 'text-amber-400',
      badgeColor: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
      borderActive: 'border-amber-400 ring-1 ring-amber-400/40 bg-amber-400/5',
    },
    {
      id: 'designer',
      label: 'Designer',
      tagline: 'Portfolio showcase, design studio & votes',
      icon: Palette,
      iconColor: 'text-purple-400',
      badgeColor: 'bg-purple-400/10 text-purple-300 border-purple-400/30',
      borderActive: 'border-purple-400 ring-1 ring-purple-400/40 bg-purple-400/5',
    },
    {
      id: 'retailer',
      label: 'Retailer',
      tagline: 'Store inventory, orders, products & CRM',
      icon: Store,
      iconColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
      borderActive: 'border-emerald-400 ring-1 ring-emerald-400/40 bg-emerald-400/5',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setErrorMessage('Please fill in your name, email, and password.');
          setIsLoading(false);
          return;
        }

        const res = await api.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
          phone: phone.trim() || undefined,
        });

        const authoritativeRole = (res.user?.role as UserRole) || selectedRole;
        onAuthSuccess(res.user, authoritativeRole);
        onClose();
      } else {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Please enter your email and password.');
          setIsLoading(false);
          return;
        }

        const res = await api.login({
          emailOrUsername: email.trim().toLowerCase(),
          password,
        });

        const authoritativeRole = (res.user?.role as UserRole) || 'customer';
        onAuthSuccess(res.user, authoritativeRole);
        onClose();
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-theme-body space-y-6">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title & Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Fashion for Everyone Authentication</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-theme-muted max-w-sm mx-auto">
            {mode === 'login'
              ? 'Sign in to access your curated style profile, dashboard, and orders.'
              : 'Join the community-powered AI fashion ecosystem.'}
          </p>
        </div>

        {/* Tab Switcher (Sign In vs Register) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-theme rounded-2xl border border-theme-main">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md'
                : 'text-theme-muted hover:text-theme-heading hover:bg-surface-subtle-theme'
            }`}
          >
            Register as New Member
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register As Role Selector (Only in Register Mode) */}
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-theme-heading">
                Register as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedRole === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedRole(opt.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                        isSelected
                          ? opt.borderActive
                          : 'bg-surface-theme hover:bg-surface-subtle-theme border-theme-subtle opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${opt.iconColor}`} />
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-theme-heading leading-tight">
                          {opt.label}
                        </div>
                        <div className="text-[9px] text-theme-muted mt-0.5 line-clamp-2">
                          {opt.tagline}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-theme-muted pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full h-11 pl-10 pr-4 bg-surface-theme hover:bg-surface-subtle-theme focus:bg-surface-subtle-theme border border-theme-main focus:border-amber-400/50 rounded-2xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-theme-secondary mb-1">
                Email Address / Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-theme-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  className="w-full h-11 pl-10 pr-4 bg-surface-theme hover:bg-surface-subtle-theme focus:bg-surface-subtle-theme border border-theme-main focus:border-amber-400/50 rounded-2xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-theme-muted pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 bg-surface-theme hover:bg-surface-subtle-theme focus:bg-surface-subtle-theme border border-theme-main focus:border-amber-400/50 rounded-2xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-theme-muted pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-11 pl-10 pr-4 bg-surface-theme hover:bg-surface-subtle-theme focus:bg-surface-subtle-theme border border-theme-main focus:border-amber-400/50 rounded-2xl text-xs text-theme-heading placeholder:text-theme-muted outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Account' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-theme-muted text-center pt-2 border-t border-theme-main">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-authenticated sessions secured with enterprise JWT</span>
        </div>
      </div>
    </div>
  );
};
