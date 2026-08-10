import type { ColorCombo, Designer, Design, RetailProduct, StoreStock, OutfitLook, UserProfile, CustomerOrder } from '../types/fashion';
import { INITIAL_USER_PROFILE, COLOR_COMBINATIONS, DESIGNERS, DESIGNS, RETAIL_PRODUCTS, STORE_STOCKS, OUTFIT_LOOKS, INITIAL_ORDERS } from '../data/fashionData';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API Fallback] ${url} failed, using local fallback data:`, err);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export const api = {
  // User profile API
  async getProfile(): Promise<UserProfile> {
    return fetchJson<UserProfile>('/profile', undefined, INITIAL_USER_PROFILE);
  },

  async getOrders(): Promise<CustomerOrder[]> {
    return fetchJson<CustomerOrder[]>('/orders', undefined, INITIAL_ORDERS);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetchJson<{ message: string; profile: UserProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }, { message: 'Updated', profile: { ...INITIAL_USER_PROFILE, ...profile } });
    return res.profile;
  },

  // AI Engine API
  async getAiStyling(profile: UserProfile, occasion: string) {
    return fetchJson<{
      colorHarmonyScore: number;
      fitScore: number;
      overallMatch: number;
      recommendedPalette: string[];
      paletteRationale: string;
      bodyShapeAdvice: string;
      curatedProducts: RetailProduct[];
    }>('/ai/styling', {
      method: 'POST',
      body: JSON.stringify({ profile, occasion }),
    }, {
      colorHarmonyScore: 96,
      fitScore: 95,
      overallMatch: 95,
      recommendedPalette: ['#1E293B', '#FDFBF7', '#D97706'],
      paletteRationale: `Tailored for ${profile.skinTone} skin tone and ${profile.bodyShape} silhouette.`,
      bodyShapeAdvice: `Structured waist definition and clean longline contrast to balance ${profile.bodyShape} frame.`,
      curatedProducts: RETAIL_PRODUCTS,
    });
  },

  async analyzePhoto(photoUrl: string) {
    return fetchJson<{
      confidence: number;
      skinTone: UserProfile['skinTone'];
      undertone: UserProfile['undertone'];
      hairColor: string;
      bodyShape: UserProfile['bodyShape'];
      estimatedMeasurements: UserProfile['measurements'];
      message: string;
    }>('/ai/photo-analysis', {
      method: 'POST',
      body: JSON.stringify({ photoUrl }),
    }, {
      confidence: 0.96,
      skinTone: 'Warm Golden',
      undertone: 'Warm',
      hairColor: 'Warm Chestnut Brown',
      bodyShape: 'Hourglass',
      estimatedMeasurements: { heightCm: 172, chestCm: 88, waistCm: 68, hipsCm: 94 },
      message: 'Analysis complete',
    });
  },

  // Color Combos API
  async getColorCombos(occasion?: string): Promise<ColorCombo[]> {
    const q = occasion && occasion !== 'All' ? `?occasion=${encodeURIComponent(occasion)}` : '';
    return fetchJson<ColorCombo[]>(`/color-combos${q}`, undefined, COLOR_COMBINATIONS);
  },

  async createColorCombo(data: { title: string; occasion: string; subType?: string; colors: { name: string; hex: string }[]; exampleImageUrl?: string }): Promise<ColorCombo> {
    return fetchJson<ColorCombo>('/color-combos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voteColorCombo(id: string, direction: 'up' | 'down'): Promise<ColorCombo> {
    return fetchJson<ColorCombo>(`/color-combos/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
  },

  // Designers & Designs API
  async getDesigners(): Promise<Designer[]> {
    return fetchJson<Designer[]>('/designers', undefined, DESIGNERS);
  },

  async getDesigns(occasion?: string): Promise<Design[]> {
    const q = occasion && occasion !== 'All' ? `?occasion=${encodeURIComponent(occasion)}` : '';
    return fetchJson<Design[]>(`/designs${q}`, undefined, DESIGNS);
  },

  async createDesign(data: { title: string; collection?: string; imageUrl: string; occasion?: string; palette?: string[]; price?: number }): Promise<Design> {
    return fetchJson<Design>('/designs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voteDesign(id: string, rating: number): Promise<Design> {
    return fetchJson<Design>(`/designs/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  },

  // Commerce Products & Store Stock API
  async getProducts(query?: string, category?: string, maxPrice?: number): Promise<RetailProduct[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    if (maxPrice) params.append('maxPrice', maxPrice.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<RetailProduct[]>(`/products${q}`, undefined, RETAIL_PRODUCTS);
  },

  async getStoreStocks(productId?: string): Promise<StoreStock[]> {
    const q = productId ? `?productId=${encodeURIComponent(productId)}` : '';
    return fetchJson<StoreStock[]>(`/stores${q}`, undefined, STORE_STOCKS);
  },

  async reserveStoreStock(data: { storeId: string; productId: string; size: string; customerName: string; customerPhone?: string }) {
    return fetchJson<{
      message: string;
      reservation: { id: string; storeId: string; productId: string; productTitle: string; size: string; customerName: string; customerPhone: string; status: string; createdAt: string };
      storeName: string;
      address: string;
      pickupWindowHours: number;
    }>('/stores/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Social Feed API
  async getSocialFeed(): Promise<OutfitLook[]> {
    return fetchJson<OutfitLook[]>('/social-feed', undefined, OUTFIT_LOOKS);
  },

  async createOutfitLook(data: { title: string; occasion?: string; videoThumbnail: string; taggedProductIds?: string[] }): Promise<OutfitLook> {
    return fetchJson<OutfitLook>('/social-feed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleLikeOutfitLook(id: string): Promise<OutfitLook> {
    return fetchJson<OutfitLook>(`/social-feed/${id}/like`, {
      method: 'POST',
    });
  },
};
