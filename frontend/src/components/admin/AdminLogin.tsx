import React, { useState } from 'react';
import { Lock, User, Key, AlertCircle, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_username', data.user.username);
      onLoginSuccess(data.token, data.user.username);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-modal-theme border border-amber-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-theme-heading">Admin Portal Login</h2>
          <p className="text-xs text-theme-muted">
            Enter authorized management credentials to access PostgreSQL store inventory & content.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full px-4 py-3 rounded-xl bg-surface-theme border border-theme-main text-theme-heading text-sm focus:outline-none focus:border-amber-400 transition-all placeholder:text-theme-muted"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-surface-theme border border-theme-main text-theme-heading text-sm focus:outline-none focus:border-amber-400 transition-all placeholder:text-theme-muted"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Log In to Admin Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-theme-main/50">
          <p className="text-[11px] text-theme-muted">
            Default credentials configured in environment: <code className="text-amber-300">admin</code> / <code className="text-amber-300">adminpassword123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
