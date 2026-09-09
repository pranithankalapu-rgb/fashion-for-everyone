import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';
import type {
  UserProfile,
  RetailProduct,
  CustomerOrder,
  ColorCombo,
  Designer,
  Design,
  OutfitLook,
  StoreStock,
  RetailerCustomer,
  Promotion,
  StoreSettings,
  AiStylingResult,
  ChatMessage,
  UserRole,
} from '../types/fashion';

// ---- Token storage ----

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Silently fail in unsupported environments
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
  } catch {}
}

// ---- Axios client ----

let currentRole: UserRole = 'customer';

export function setCurrentRole(role: UserRole) {
  currentRole = role;
}

export function getCurrentRole(): UserRole {
  return currentRole;
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach auth token & role
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-user-role'] = currentRole;
  config.headers['x-user-id'] = 'user_01'; // match web default for dev
  return config;
});

// Response interceptor – basic error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network error';
    return Promise.reject(new Error(message));
  }
);

// ---- API methods ----

export const api = {
  // --- Auth ---
  async register(data: { name: string; email: string; password: string; role?: string; phone?: string }) {
    const res = await client.post<{ success: boolean; user: any; accessToken: string; refreshToken: string }>(
      '/auth/register',
      data
    );
    if (res.data.accessToken) {
      await setToken(res.data.accessToken);
      await setRefreshToken(res.data.refreshToken);
    }
    return res.data;
  },

  async login(credentials: { emailOrUsername: string; password: string; role?: string }) {
    const res = await client.post<{
      success: boolean;
      user: any;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>('/auth/login', credentials);
    const token = res.data.accessToken || res.data.token;
    if (token) {
      await setToken(token);
      if (res.data.refreshToken) await setRefreshToken(res.data.refreshToken);
    }
    return res.data;
  },

  async logout() {
    try {
      await client.post('/auth/logout');
    } finally {
      await setToken(null);
      await setRefreshToken(null);
    }
  },

  async getMe() {
    const res = await client.get<{ success: boolean; user: any }>('/auth/me');
    return res.data;
  },

  // --- Profile ---
  async getProfile(): Promise<UserProfile> {
    const res = await client.get<UserProfile>('/profile');
    return res.data;
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await client.put<{ message: string; profile: UserProfile }>('/profile', profile);
    return res.data.profile;
  },

  // --- Products ---
  async getProducts(params?: { query?: string; category?: string; maxPrice?: number }): Promise<RetailProduct[]> {
    const res = await client.get<RetailProduct[]>('/products', { params });
    return res.data;
  },

  async getProductById(id: string): Promise<RetailProduct> {
    const res = await client.get<RetailProduct>(`/products/${id}`);
    return res.data;
  },

  async createProduct(data: Partial<RetailProduct>): Promise<RetailProduct> {
    const res = await client.post<RetailProduct>('/products', data);
    return res.data;
  },

  async updateProduct(id: string, data: Partial<RetailProduct>): Promise<RetailProduct> {
    const res = await client.put<RetailProduct>(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    const res = await client.delete<{ message: string }>(`/products/${id}`);
    return res.data;
  },

  async updateProductStock(id: string, stockQuantity: number): Promise<RetailProduct> {
    const res = await client.patch<RetailProduct>(`/products/${id}/stock`, { stockQuantity });
    return res.data;
  },

  // --- Orders ---
  async getOrders(): Promise<CustomerOrder[]> {
    const res = await client.get<CustomerOrder[]>('/orders');
    return res.data;
  },

  async getOrderById(id: string): Promise<CustomerOrder> {
    const res = await client.get<CustomerOrder>(`/orders/${id}`);
    return res.data;
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
    }>;
  }) {
    const res = await client.post<{ message: string; order: CustomerOrder }>('/orders', orderData);
    return res.data;
  },

  async updateOrderStatus(id: string, status: string): Promise<CustomerOrder> {
    const res = await client.patch<{ message: string; order: CustomerOrder }>(`/orders/${id}/status`, { status });
    return res.data.order;
  },

  async deleteOrder(id: string): Promise<{ message: string }> {
    const res = await client.delete<{ message: string }>(`/orders/${id}`);
    return res.data;
  },

  // --- Color Combos ---
  async getColorCombos(occasion?: string): Promise<ColorCombo[]> {
    const params = occasion && occasion !== 'All' ? { occasion } : undefined;
    const res = await client.get<ColorCombo[]>('/color-combos', { params });
    return res.data;
  },

  async voteColorCombo(id: string, direction: 'up' | 'down'): Promise<ColorCombo> {
    const res = await client.post<ColorCombo>(`/color-combos/${id}/vote`, { direction });
    return res.data;
  },

  // --- Designers & Designs ---
  async getDesigners(): Promise<Designer[]> {
    const res = await client.get<Designer[]>('/designers');
    return res.data;
  },

  async getDesigns(occasion?: string): Promise<Design[]> {
    const params = occasion && occasion !== 'All' ? { occasion } : undefined;
    const res = await client.get<Design[]>('/designs', { params });
    return res.data;
  },

  async voteDesign(id: string, rating: number): Promise<Design> {
    const res = await client.post<Design>(`/designs/${id}/vote`, { rating });
    return res.data;
  },

  // --- Social Feed ---
  async getSocialFeed(): Promise<OutfitLook[]> {
    const res = await client.get<OutfitLook[]>('/social-feed');
    return res.data;
  },

  async toggleLikeOutfitLook(id: string): Promise<OutfitLook> {
    const res = await client.post<OutfitLook>(`/social-feed/${id}/like`);
    return res.data;
  },

  // --- Stores ---
  async getStoreStocks(productId?: string): Promise<StoreStock[]> {
    const params = productId ? { productId } : undefined;
    const res = await client.get<StoreStock[]>('/stores', { params });
    return res.data;
  },

  // --- AI Engine ---
  async getAiStyling(profile: UserProfile, occasion: string): Promise<AiStylingResult> {
    const res = await client.post<AiStylingResult>('/ai/styling', { profile, occasion });
    return res.data;
  },

  async chatStylist(message: string, options?: { budget?: number; occasion?: string }) {
    const res = await client.post<ChatMessage>('/ai/chat', { message, ...options });
    return res.data;
  },

  async semanticSearch(q: string): Promise<RetailProduct[]> {
    const res = await client.get<RetailProduct[]>('/ai/search', { params: { q } });
    return res.data;
  },

  // --- Retailer ---
  async getRetailerCustomers(): Promise<RetailerCustomer[]> {
    const res = await client.get<RetailerCustomer[]>('/retailer/customers');
    return res.data;
  },

  async getPromotions(): Promise<Promotion[]> {
    const res = await client.get<Promotion[]>('/promotions');
    return res.data;
  },

  async getStoreSettings(): Promise<StoreSettings> {
    const res = await client.get<StoreSettings>('/store-settings');
    return res.data;
  },

  // --- Notifications ---
  async getNotifications() {
    const res = await client.get<Array<{ id: string; title: string; message: string; type: string; read: boolean; createdAt: string }>>('/notifications');
    return res.data;
  },
};

export default api;
