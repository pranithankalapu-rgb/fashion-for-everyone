import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  api,
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  setCurrentRole,
  setCurrentUserId,
  setSessionExpiredHandler,
} from '../services/api';
import type { UserProfile, UserRole } from '../types/fashion';

interface AuthState {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (emailOrUsername: string, password: string, role?: string) => Promise<{ user: any; role: UserRole }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ user: any; role: UserRole }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: 'customer',
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token and restore authoritative role on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const token = await getToken();
        const refreshToken = await getRefreshToken();

        if (token || refreshToken) {
          try {
            // Validate session and retrieve authoritative database profile
            const { user } = await api.getMe();
            if (isMounted && user) {
              const authoritativeRole = (user?.role as UserRole) || 'customer';
              setCurrentRole(authoritativeRole);
              if (user?.id) setCurrentUserId(user.id);
              setState({ user, role: authoritativeRole, isAuthenticated: true, isLoading: false });
              return;
            }
          } catch (meErr) {
            console.warn('Persistent session restore attempt failed:', meErr);
          }
        }

        // If no tokens or restore failed, purge state
        if (isMounted) {
          await setToken(null);
          await setRefreshToken(null);
          setCurrentUserId(null);
          setCurrentRole('customer');
          setState({ user: null, role: 'customer', isAuthenticated: false, isLoading: false });
        }
      } catch {
        if (isMounted) {
          await setToken(null);
          await setRefreshToken(null);
          setCurrentUserId(null);
          setCurrentRole('customer');
          setState({ user: null, role: 'customer', isAuthenticated: false, isLoading: false });
        }
      }
    })();

    setSessionExpiredHandler(() => {
      if (isMounted) {
        setState({ user: null, role: 'customer', isAuthenticated: false, isLoading: false });
      }
    });

    return () => {
      isMounted = false;
      setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string, role?: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await api.login({ emailOrUsername, password, role });
      const authoritativeRole = (res.user?.role as UserRole) || 'customer';
      setCurrentRole(authoritativeRole);
      if (res.user?.id) setCurrentUserId(res.user.id);
      setState({ user: res.user, role: authoritativeRole, isAuthenticated: true, isLoading: false });
      return { user: res.user, role: authoritativeRole };
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await api.register({ name, email, password, role });
      const authoritativeRole = (res.user?.role as UserRole) || (role as UserRole) || 'customer';
      setCurrentRole(authoritativeRole);
      if (res.user?.id) setCurrentUserId(res.user.id);
      setState({ user: res.user, role: authoritativeRole, isAuthenticated: true, isLoading: false });
      return { user: res.user, role: authoritativeRole };
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
      setCurrentUserId(null);
      setState({ user: null, role: 'customer', isAuthenticated: false, isLoading: false });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      if (user) {
        const authoritativeRole = (user?.role as UserRole) || 'customer';
        setCurrentRole(authoritativeRole);
        setState((s) => ({ ...s, user, role: authoritativeRole }));
      }
    } catch {}
  }, []);

  const updateUser = useCallback((partial: Partial<UserProfile>) => {
    setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, ...partial } : (partial as any),
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser, updateUser }}>
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
