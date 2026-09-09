import React, { createContext, useContext, useState, useCallback } from 'react';
import type { RetailProduct } from '../types/fashion';

interface WishlistContextType {
  items: RetailProduct[];
  toggleWishlist: (product: RetailProduct) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<RetailProduct[]>([]);

  const toggleWishlist = useCallback((product: RetailProduct) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  );

  const clearWishlist = useCallback(() => setItems([]), []);

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
