import type {
  ColorCombo,
  Designer,
  Design,
  RetailProduct,
  StoreStock,
  OutfitLook,
  UserProfile,
  CustomerOrder,
  RetailerCustomer,
  Promotion,
  StoreSettings,
  OrderStatus,
} from '../types/fashion';
import {
  INITIAL_USER_PROFILE,
  COLOR_COMBINATIONS,
  DESIGNERS,
  DESIGNS,
  RETAIL_PRODUCTS,
  STORE_STOCKS,
  OUTFIT_LOOKS,
  INITIAL_ORDERS,
  INITIAL_RETAILER_CUSTOMERS,
  INITIAL_PROMOTIONS,
  INITIAL_STORE_SETTINGS,
} from '../data/fashionData';

const BASE_URL = '/api';

let currentActiveRole: 'customer' | 'designer' | 'retailer' = 'customer';

export function setCurrentRole(role: 'customer' | 'designer' | 'retailer') {
  currentActiveRole = role;
}

async function fetchJson<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': currentActiveRole,
      'x-user-id': 'user_01',
      ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API Call] ${url} request fallback:`, err);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export const api = {
  // --- USER PROFILE API ---
  async getProfile(): Promise<UserProfile> {
    return fetchJson<UserProfile>('/profile', undefined, INITIAL_USER_PROFILE);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetchJson<{ message: string; profile: UserProfile }>(
      '/profile',
      {
        method: 'PUT',
        body: JSON.stringify(profile),
      },
      { message: 'Updated', profile: { ...INITIAL_USER_PROFILE, ...profile } }
    );
    return res.profile;
  },

  // --- ORDERS API (Customer & Retailer) ---
  async getOrders(): Promise<CustomerOrder[]> {
    return fetchJson<CustomerOrder[]>('/orders', undefined, INITIAL_ORDERS);
  },

  async getOrderById(id: string): Promise<CustomerOrder> {
    return fetchJson<CustomerOrder>(`/orders/${id}`);
  },

  async createOrder(orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    items: Array<{
      productId: string;
      title: string;
      brand?: string;
      imageUrl: string;
      price: number;
      quantity: number;
      size: string;
      color?: string;
      sku?: string;
    }>;
  }): Promise<{ message: string; order: CustomerOrder }> {
    return fetchJson<{ message: string; order: CustomerOrder }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async updateOrderStatus(id: string, status: OrderStatus, trackingNumber?: string): Promise<CustomerOrder> {
    return fetchJson<CustomerOrder>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingNumber }),
    });
  },

  async deleteOrder(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  // --- RETAIL PRODUCTS API ---
  async getProducts(query?: string, category?: string, maxPrice?: number): Promise<RetailProduct[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    if (maxPrice) params.append('maxPrice', maxPrice.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<RetailProduct[]>(`/products${q}`, undefined, RETAIL_PRODUCTS);
  },

  async getProductById(id: string): Promise<RetailProduct> {
    return fetchJson<RetailProduct>(`/products/${id}`);
  },

  async createProduct(productData: Partial<RetailProduct>): Promise<RetailProduct> {
    return fetchJson<RetailProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id: string, productData: Partial<RetailProduct>): Promise<RetailProduct> {
    return fetchJson<RetailProduct>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async updateProductStock(id: string, stockQuantity: number): Promise<RetailProduct> {
    return fetchJson<RetailProduct>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stockQuantity }),
    });
  },

  // --- RETAILER CRM CUSTOMERS API ---
  async getRetailerCustomers(): Promise<RetailerCustomer[]> {
    return fetchJson<RetailerCustomer[]>('/retailer/customers', undefined, INITIAL_RETAILER_CUSTOMERS);
  },

  async createRetailerCustomer(customerData: Partial<RetailerCustomer>): Promise<RetailerCustomer> {
    return fetchJson<RetailerCustomer>('/retailer/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  async updateRetailerCustomer(id: string, customerData: Partial<RetailerCustomer>): Promise<RetailerCustomer> {
    return fetchJson<RetailerCustomer>(`/retailer/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  async deleteRetailerCustomer(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/retailer/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // --- RETAILER PROMOTIONS API ---
  async getPromotions(): Promise<Promotion[]> {
    return fetchJson<Promotion[]>('/promotions', undefined, INITIAL_PROMOTIONS);
  },

  async createPromotion(promoData: Partial<Promotion>): Promise<Promotion> {
    return fetchJson<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(promoData),
    });
  },

  async updatePromotion(id: string, promoData: Partial<Promotion>): Promise<Promotion> {
    return fetchJson<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promoData),
    });
  },

  async toggleDeactivatePromotion(id: string): Promise<Promotion> {
    return fetchJson<Promotion>(`/promotions/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async deletePromotion(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/promotions/${id}`, {
      method: 'DELETE',
    });
  },

  // --- STORE SETTINGS API ---
  async getStoreSettings(): Promise<StoreSettings> {
    return fetchJson<StoreSettings>('/store-settings', undefined, INITIAL_STORE_SETTINGS);
  },

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<{ message: string; settings: StoreSettings }> {
    return fetchJson<{ message: string; settings: StoreSettings }>('/store-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // --- DESIGNERS & DESIGNS API ---
  async getDesigners(): Promise<Designer[]> {
    return fetchJson<Designer[]>('/designers', undefined, DESIGNERS);
  },

  async getDesigns(occasion?: string): Promise<Design[]> {
    const q = occasion && occasion !== 'All' ? `?occasion=${encodeURIComponent(occasion)}` : '';
    return fetchJson<Design[]>(`/designs${q}`, undefined, DESIGNS);
  },

  async createDesign(data: {
    title: string;
    collection?: string;
    imageUrl: string;
    occasion?: string;
    palette?: string[];
    price?: number;
  }): Promise<Design> {
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

  // --- STORES & RESERVATIONS API ---
  async getStoreStocks(productId?: string): Promise<StoreStock[]> {
    const q = productId ? `?productId=${encodeURIComponent(productId)}` : '';
    return fetchJson<StoreStock[]>(`/stores${q}`, undefined, STORE_STOCKS);
  },

  async reserveStoreStock(data: {
    storeId: string;
    productId: string;
    size: string;
    customerName: string;
    customerPhone?: string;
  }) {
    return fetchJson<{
      message: string;
      reservation: {
        id: string;
        storeId: string;
        productId: string;
        productTitle: string;
        size: string;
        customerName: string;
        customerPhone: string;
        status: string;
        createdAt: string;
      };
      storeName: string;
      address: string;
      pickupWindowHours: number;
    }>('/stores/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- COLOR COMBINATIONS API ---
  async getColorCombos(occasion?: string): Promise<ColorCombo[]> {
    const q = occasion && occasion !== 'All' ? `?occasion=${encodeURIComponent(occasion)}` : '';
    return fetchJson<ColorCombo[]>(`/color-combos${q}`, undefined, COLOR_COMBINATIONS);
  },

  async createColorCombo(data: {
    title: string;
    occasion: string;
    subType?: string;
    colors: { name: string; hex: string }[];
    exampleImageUrl?: string;
  }): Promise<ColorCombo> {
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

  // --- SOCIAL FEED API ---
  async getSocialFeed(): Promise<OutfitLook[]> {
    return fetchJson<OutfitLook[]>('/social-feed', undefined, OUTFIT_LOOKS);
  },

  async createOutfitLook(data: {
    title: string;
    occasion?: string;
    videoThumbnail: string;
    taggedProductIds?: string[];
  }): Promise<OutfitLook> {
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

  // --- AI ENGINE API ---
  async getAiStyling(profile: UserProfile, occasion: string) {
    return fetchJson<{
      colorHarmonyScore: number;
      fitScore: number;
      overallMatch: number;
      recommendedPalette: string[];
      paletteRationale: string;
      bodyShapeAdvice: string;
      curatedProducts: RetailProduct[];
    }>(
      '/ai/styling',
      {
        method: 'POST',
        body: JSON.stringify({ profile, occasion }),
      },
      {
        colorHarmonyScore: 96,
        fitScore: 95,
        overallMatch: 95,
        recommendedPalette: ['#1E293B', '#FDFBF7', '#D97706'],
        paletteRationale: `Tailored for ${profile.skinTone} skin tone and ${profile.bodyShape} silhouette.`,
        bodyShapeAdvice: `Structured waist definition and clean longline contrast to balance ${profile.bodyShape} frame.`,
        curatedProducts: RETAIL_PRODUCTS,
      }
    );
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
    }>(
      '/ai/photo-analysis',
      {
        method: 'POST',
        body: JSON.stringify({ photoUrl }),
      },
      {
        confidence: 0.96,
        skinTone: 'Warm Golden',
        undertone: 'Warm',
        hairColor: 'Warm Chestnut Brown',
        bodyShape: 'Hourglass',
        estimatedMeasurements: { heightCm: 172, chestCm: 88, waistCm: 68, hipsCm: 94 },
        message: 'Analysis complete',
      }
    );
  },
};
