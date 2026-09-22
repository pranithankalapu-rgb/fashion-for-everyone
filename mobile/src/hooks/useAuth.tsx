import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  api,
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  setCurrentRole,
  setCurrentUserId,
  getSavedRole,
  getSavedUserId,
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
  login: (emailOrUsername: string, password: string, role?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
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

  // Check for existing token and role on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const token = await getToken();
        const refreshToken = await getRefreshToken();
        const savedRole = await getSavedRole();
        const savedUserId = await getSavedUserId();

        if (savedUserId) {
          setCurrentUserId(savedUserId);
        }
        if (savedRole) {
          setCurrentRole(savedRole);
        }

        if (token || refreshToken) {
          try {
            // If access token is expired, the API interceptor automatically uses refreshToken
            const { user } = await api.getMe();
            if (isMounted && user) {
              const role = savedRole || (user?.role as UserRole) || 'customer';
              setCurrentRole(role);
              if (user?.id) setCurrentUserId(user.id);
              setState({ user, role, isAuthenticated: true, isLoading: false });
              return;
            }
          } catch (meErr) {
            console.warn('Persistent session restore attempt failed:', meErr);
          }
        }

        // If no tokens or restore failed
        if (isMounted) {
          await setToken(null);
          await setRefreshToken(null);
          setCurrentUserId(null);
          setState({ user: null, role: savedRole || 'customer', isAuthenticated: false, isLoading: false });
        }
      } catch {
        if (isMounted) {
          await setToken(null);
          await setRefreshToken(null);
          setCurrentUserId(null);
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
      const userRole = (role as UserRole) || (res.user?.role as UserRole) || 'customer';
      setCurrentRole(userRole);
      if (res.user?.id) setCurrentUserId(res.user.id);
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
      const userRole = (role as UserRole) || (res.user?.role as UserRole) || 'customer';
      setCurrentRole(userRole);
      if (res.user?.id) setCurrentUserId(res.user.id);
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
      setCurrentUserId(null);
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
      if (user) {
        setState((s) => ({ ...s, user }));
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
    <AuthContext.Provider value={{ ...state, login, register, logout, switchRole, refreshUser, updateUser }}>
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
