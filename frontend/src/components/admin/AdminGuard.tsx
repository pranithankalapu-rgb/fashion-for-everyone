import React, { useState, useEffect } from 'react';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminLayout, type AdminTab } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminUsersView } from './AdminUsersView';
import { AdminRetailersView } from './AdminRetailersView';
import { AdminDesignersView } from './AdminDesignersView';
import { AdminSocialAndAiView } from './AdminSocialAndAiView';
import { RefreshCw } from 'lucide-react';

interface AdminGuardProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  children?: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');

  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    const token = localStorage.getItem('admin_jwt_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminEmail(data.admin.email || localStorage.getItem('admin_email') || 'admin@fashionforeveryone.com');
      } else {
        localStorage.removeItem('admin_jwt_token');
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLoginSuccess = (token: string, email: string) => {
    localStorage.setItem('admin_jwt_token', token);
    localStorage.setItem('admin_email', email);
    setAdminEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_jwt_token');
    localStorage.removeItem('admin_email');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-app-theme flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-amber-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-xs font-semibold text-theme-muted">Verifying admin credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveAdminView = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'products':
        return <AdminDashboard onLogout={handleLogout} />;
      case 'orders':
        return <AdminOrdersView onLogout={handleLogout} />;
      case 'users':
        return <AdminUsersView />;
      case 'retailers':
        return <AdminRetailersView />;
      case 'designers':
        return <AdminDesignersView />;
      case 'social-ai':
        return <AdminSocialAndAiView />;
      default:
        return <AdminDashboard onLogout={handleLogout} />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      adminEmail={adminEmail}
      onLogout={handleLogout}
    >
      {renderActiveAdminView()}
    </AdminLayout>
  );
};

