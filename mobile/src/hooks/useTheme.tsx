import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NavigationBar } from 'expo-navigation-bar';
import { DarkColors, LightColors, type ThemeColors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const THEME_STORAGE_KEY = 'app_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (err) {
        console.warn('Failed to load saved theme mode:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Failed to persist theme mode:', err);
    }
  }, []);

  // Compute resolved theme: 'light' or 'dark'
  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'light') return 'light';
    if (themeMode === 'dark') return 'dark';
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }, [themeMode, systemColorScheme]);

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  // Sync Android system navigation bar style
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setStyle(isDark ? 'light' : 'dark');
      } catch {}
    }
  }, [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      colors,
      isDark,
      setThemeMode,
    }),
    [themeMode, resolvedTheme, colors, isDark, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
