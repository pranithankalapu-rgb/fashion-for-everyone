import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, getToken, setToken, setCurrentRole } from '../services/api';
import type { UserProfile, UserRole } from '../types/fashion';

interface AuthState {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (emailOrUsername: string, password: string, role?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: 'customer',
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const { user } = await api.getMe();
          const role = (user?.role as UserRole) || 'customer';
          setCurrentRole(role);
          setState({ user, role, isAuthenticated: true, isLoading: false });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        await setToken(null);
        setState({ user: null, role: 'customer', isAuthenticated: false, isLoading: false });
      }
    })();
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string, role?: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await api.login({ emailOrUsername, password, role });
      const userRole = (res.user?.role as UserRole) || (role as UserRole) || 'customer';
      setCurrentRole(userRole);
      setState({ user: res.user, role: userRole, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await api.register({ name, email, password, role });
      const userRole = (res.user?.role as UserRole) || (role as UserRole) || 'customer';
      setCurrentRole(userRole);
      setState({ user: res.user, role: userRole, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setCurrentRole('customer');
      setState({ user: null, role: 'customer', isAuthenticated: false, isLoading: false });
    }
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    setState((s) => ({ ...s, role }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      setState((s) => ({ ...s, user }));
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
