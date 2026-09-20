import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, PRODUCTION_API_URL, FALLBACK_API_URL } from '../constants/config';
import { resolveMediaUrl } from '../utils/media';
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

const ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';

let currentRole: UserRole = 'customer';
let currentUserId: string = 'user_01';

export function setCurrentRole(role: UserRole) {
  currentRole = role;
  SecureStore.setItemAsync(ROLE_KEY, role).catch(() => {});
}

export function getCurrentRole(): UserRole {
  return currentRole;
}

export function setCurrentUserId(userId: string) {
  currentUserId = userId;
  SecureStore.setItemAsync(USER_ID_KEY, userId).catch(() => {});
}

export async function getSavedRole(): Promise<UserRole | null> {
  try {
    const saved = await SecureStore.getItemAsync(ROLE_KEY);
    if (saved) {
      currentRole = saved as UserRole;
      return saved as UserRole;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSavedUserId(): Promise<string | null> {
  try {
    const saved = await SecureStore.getItemAsync(USER_ID_KEY);
    if (saved) {
      currentUserId = saved;
      return saved;
    }
    return null;
  } catch {
    return null;
  }
}

// 60-second timeout to safely accommodate Render free-tier cold starts (which take 30-50s)
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach auth token & role
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-user-role'] = currentRole;
  config.headers['x-user-id'] = currentUserId || 'user_01';
  return config;
});

/**
 * Diagnostic parser to categorize and provide informative error messages for mobile users
 */
function parseApiError(error: any): string {
  const code = error?.code || '';
  const rawMsg = (error?.message || '').toLowerCase();
  const status = error?.response?.status;
  const serverError = error?.response?.data?.error || error?.response?.data?.message;

  // 1. Backend validation or business logic error (HTTP 4xx with message)
  if (serverError) {
    return typeof serverError === 'string' ? serverError : JSON.stringify(serverError);
  }

  // 2. HTTP status specific handling
  if (status) {
    if (status === 400) return 'Invalid request. Please check the entered information.';
    if (status === 401) return 'Invalid credentials. Please verify your email and password.';
    if (status === 403) return 'Access denied. You do not have permission for this action.';
    if (status === 404) return 'Requested service or resource not found.';
    if (status === 429) return 'Too many requests. Please wait a few moments and try again.';
    if (status >= 500) return `Backend server error (${status}). Service is temporarily unavailable.`;
  }

  // 3. DNS resolution failure
  if (code === 'ENOTFOUND' || rawMsg.includes('enotfound') || rawMsg.includes('err_name_not_resolved') || rawMsg.includes('unknownhost')) {
    return 'DNS resolution failed. Your network cannot resolve the backend server address. Please check your DNS or mobile data connection.';
  }

  // 4. Request timeout (Render free instance waking up)
  if (code === 'ECONNABORTED' || rawMsg.includes('timeout') || rawMsg.includes('timed out')) {
    return 'Connection timed out. The backend server is spinning up from idle state. Please try again in 10 seconds.';
  }

  // 5. SSL / TLS Handshake failure
  if (code.startsWith('CERT_') || rawMsg.includes('cert') || rawMsg.includes('ssl') || rawMsg.includes('tls') || rawMsg.includes('handshake')) {
    return 'Secure connection failed (SSL/TLS error). Please verify your device system time and network security.';
  }

  // 6. Connection refused
  if (code === 'ECONNREFUSED' || rawMsg.includes('econnrefused') || rawMsg.includes('connection refused')) {
    return 'Connection refused by server. The backend may be rebooting.';
  }

  // 7. General network error
  if (rawMsg === 'network error' || rawMsg.includes('network request failed')) {
    return 'Network Error: Unable to reach the backend server. Please verify your internet connection.';
  }

  return error?.message || 'Network error occurred while connecting to the server.';
}

// Response interceptor – diagnostic error handling with automatic fallback retry
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request failed at network level (no response) and hasn't retried fallback yet
    if (
      !error.response &&
      originalRequest &&
      !originalRequest._hasRetriedFallback &&
      FALLBACK_API_URL &&
      originalRequest.baseURL !== FALLBACK_API_URL
    ) {
      originalRequest._hasRetriedFallback = true;
      console.warn(`[API] Primary backend connection failed (${error.message}). Retrying with fallback proxy ${FALLBACK_API_URL}...`);
      originalRequest.baseURL = FALLBACK_API_URL;
      try {
        return await client(originalRequest);
      } catch (fallbackError: any) {
        console.error('[API] Fallback also failed:', fallbackError.message);
        const detailedMessage = parseApiError(fallbackError);
        return Promise.reject(new Error(detailedMessage));
      }
    }

    const detailedMessage = parseApiError(error);
    console.error(`[API Error] URL: ${originalRequest?.url || 'unknown'} | Reason: ${detailedMessage}`);
    return Promise.reject(new Error(detailedMessage));
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
      await SecureStore.deleteItemAsync(ROLE_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(USER_ID_KEY).catch(() => {});
      currentRole = 'customer';
      currentUserId = 'user_01';
    }
  },

  async getMe() {
    const res = await client.get<{ success: boolean; user: any }>('/auth/me');
    const data = res.data;
    if (data.user?.avatar) {
      data.user.avatar = resolveMediaUrl(data.user.avatar);
    }
    if (data.user?.photoUrl) {
      data.user.photoUrl = resolveMediaUrl(data.user.photoUrl);
    }
    return data;
  },

  // --- Profile ---
  async getProfile(): Promise<UserProfile> {
    const res = await client.get<UserProfile>('/profile');
    const profile = res.data;
    if (profile?.avatar) {
      profile.avatar = resolveMediaUrl(profile.avatar);
    }
    if (profile?.photoUrl) {
      profile.photoUrl = resolveMediaUrl(profile.photoUrl);
    }
    return profile;
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await client.put<{ message: string; profile: UserProfile }>('/profile', profile);
    const updated = res.data.profile;
    if (updated?.avatar) updated.avatar = resolveMediaUrl(updated.avatar);
    if (updated?.photoUrl) updated.photoUrl = resolveMediaUrl(updated.photoUrl);
    return updated;
  },

  async patchProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await client.patch<{ message: string; profile: UserProfile }>('/profile', profile);
    const updated = res.data.profile;
    if (updated?.avatar) updated.avatar = resolveMediaUrl(updated.avatar);
    if (updated?.photoUrl) updated.photoUrl = resolveMediaUrl(updated.photoUrl);
    return updated;
  },

  async requestEmailVerification(email: string): Promise<{ success: boolean; message: string; resendCooldown?: number }> {
    const res = await client.post<{ success: boolean; message: string; resendCooldown?: number }>('/profile/email/request-verification', { email });
    return res.data;
  },

  async verifyAndUpdateEmail(email: string, code: string): Promise<{ success: boolean; message: string; email: string; profile: UserProfile }> {
    const res = await client.post<{ success: boolean; message: string; email: string; profile: UserProfile }>('/profile/email/verify', { email, code });
    const data = res.data;
    if (data.profile?.avatar) data.profile.avatar = resolveMediaUrl(data.profile.avatar);
    if (data.profile?.photoUrl) data.profile.photoUrl = resolveMediaUrl(data.profile.photoUrl);
    return data;
  },

  async requestMobileVerification(phone: string): Promise<{ success: boolean; message: string; resendCooldown?: number }> {
    const res = await client.post<{ success: boolean; message: string; resendCooldown?: number }>('/profile/mobile/request-verification', { phone });
    return res.data;
  },

  async verifyAndUpdateMobile(phone: string, code: string): Promise<{ success: boolean; message: string; phone: string; profile: UserProfile }> {
    const res = await client.post<{ success: boolean; message: string; phone: string; profile: UserProfile }>('/profile/mobile/verify', { phone, code });
    const data = res.data;
    if (data.profile?.avatar) data.profile.avatar = resolveMediaUrl(data.profile.avatar);
    if (data.profile?.photoUrl) data.profile.photoUrl = resolveMediaUrl(data.profile.photoUrl);
    return data;
  },

  async updateEmail(email: string, code?: string): Promise<{ success: boolean; message: string; email: string; profile: UserProfile }> {
    const res = await client.patch<{ success: boolean; message: string; email: string; profile: UserProfile }>('/profile/email', { email, code });
    const data = res.data;
    if (data.profile?.avatar) data.profile.avatar = resolveMediaUrl(data.profile.avatar);
    if (data.profile?.photoUrl) data.profile.photoUrl = resolveMediaUrl(data.profile.photoUrl);
    return data;
  },

  async updateMobile(phone: string, code?: string): Promise<{ success: boolean; message: string; phone: string; profile: UserProfile }> {
    const res = await client.patch<{ success: boolean; message: string; phone: string; profile: UserProfile }>('/profile/mobile', { phone, code });
    const data = res.data;
    if (data.profile?.avatar) data.profile.avatar = resolveMediaUrl(data.profile.avatar);
    if (data.profile?.photoUrl) data.profile.photoUrl = resolveMediaUrl(data.profile.photoUrl);
    return data;
  },

  async uploadAvatar(data: FormData | { avatarUrl: string }): Promise<{ success: boolean; message: string; avatar: string; profile: UserProfile }> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const res = await client.post<{ success: boolean; message: string; avatar: string; profile: UserProfile }>(
      '/profile/avatar',
      data,
      isFormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            transformRequest: (d) => d,
          }
        : undefined
    );
    const result = res.data;
    if (result.avatar) {
      result.avatar = resolveMediaUrl(result.avatar);
    }
    if (result.profile?.avatar) {
      result.profile.avatar = resolveMediaUrl(result.profile.avatar);
    }
    if (result.profile?.photoUrl) {
      result.profile.photoUrl = resolveMediaUrl(result.profile.photoUrl);
    }
    return result;
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

  async getDesignById(id: string): Promise<Design> {
    try {
      const res = await client.get<Design>(`/designs/${id}`);
      return res.data;
    } catch (err) {
      const all = await api.getDesigns().catch(() => []);
      const match = all.find((d) => d.id === id);
      if (match) return match;
      throw err;
    }
  },

  async voteDesign(id: string, rating: number): Promise<Design> {
    const res = await client.post<Design>(`/designs/${id}/vote`, { rating });
    return res.data;
  },

  async createDesign(data: {
    title: string;
    imageUrl: string;
    collection?: string;
    occasion?: string;
    palette?: string[];
    price?: number;
    designerId?: string;
  }): Promise<Design> {
    const res = await client.post<Design>('/designs', data);
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
