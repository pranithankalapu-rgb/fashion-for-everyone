import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { RetailProduct } from '../types/fashion';

const WISHLIST_STORAGE_KEY = 'fashion_wishlist_items';

interface WishlistContextType {
  items: RetailProduct[];
  toggleWishlist: (product: RetailProduct) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<RetailProduct[]>([]);

  // Load wishlist from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(WISHLIST_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  const saveItems = (newItems: RetailProduct[]) => {
    SecureStore.setItemAsync(WISHLIST_STORAGE_KEY, JSON.stringify(newItems)).catch(() => {});
  };

  const toggleWishlist = useCallback((product: RetailProduct) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      const updated = exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
      saveItems(updated);
      return updated;
    });
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    SecureStore.deleteItemAsync(WISHLIST_STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isWishlisted, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
}
