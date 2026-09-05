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
  AdminOrderStats,
  AdminUser,
  AdminUserStats,
  UserApprovalStatus,
  UserAccountStatus,
  UserRole,
  AdminRetailer,
  AdminRetailerStats,
  AdminDesigner,
  AdminDesignSubmission,
  AdminDesignerStats,
  AdminDashboardOverview,
} from '../types/fashion';

const BASE_URL = '/api';

let currentActiveRole: 'customer' | 'designer' | 'retailer' | 'admin' = 'customer';

export function setCurrentRole(role: 'customer' | 'designer' | 'retailer' | 'admin') {
  currentActiveRole = role;
}

export function getCurrentRole(): string {
  return currentActiveRole;
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('admin_jwt_token', token);
  } else {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_jwt_token');
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token') || localStorage.getItem('admin_jwt_token');
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': currentActiveRole,
    'x-user-id': 'user_01',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

export const api = {
  // --- AUTHENTICATION API ---
  async register(data: { name: string; email: string; password: string; role?: string; phone?: string }) {
    const res = await fetchJson<{
      success: boolean;
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.accessToken) {
      setAuthToken(res.accessToken);
    }
    return res;
  },

  async login(credentials: { emailOrUsername: string; password: string; role?: string }) {
    const res = await fetchJson<{
      success: boolean;
      user: any;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const token = res.accessToken || res.token;
    if (token) {
      setAuthToken(token);
    }
    return res;
  },

  async logout() {
    try {
      await fetchJson('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  async getMe() {
    return fetchJson<{ success: boolean; user: any }>('/auth/me');
  },

  // --- USER PROFILE API ---
  async getProfile(): Promise<UserProfile> {
    return fetchJson<UserProfile>('/profile');
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetchJson<{ message: string; profile: UserProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    return res.profile;
  },

  // --- ORDERS & PAYMENTS API ---
  async getOrders(): Promise<CustomerOrder[]> {
    return fetchJson<CustomerOrder[]>('/orders');
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
    paymentGateway?: string;
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
  }): Promise<{ message: string; order: CustomerOrder; paymentIntent?: any }> {
    return fetchJson<{ message: string; order: CustomerOrder; paymentIntent?: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async createPaymentIntent(data: {
    orderId: string;
    amount: number;
    currency?: string;
    gateway?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) {
    return fetchJson<any>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyPayment(data: { paymentIntentId: string; gateway?: string; signature?: string; paymentId?: string }) {
    return fetchJson<{ success: boolean; status: string }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(id: string, status: string): Promise<CustomerOrder> {
    const res = await fetchJson<{ message: string; order: CustomerOrder }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.order;
  },

  async deleteOrder(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  // --- PRODUCTS API ---
  async getProducts(params?: { query?: string; category?: string; maxPrice?: number }): Promise<RetailProduct[]> {
    const q = new URLSearchParams();
    if (params?.query) q.append('query', params.query);
    if (params?.category) q.append('category', params.category);
    if (params?.maxPrice) q.append('maxPrice', String(params.maxPrice));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJson<RetailProduct[]>(`/products${qs}`);
  },

  async getProductById(id: string): Promise<RetailProduct> {
    return fetchJson<RetailProduct>(`/products/${id}`);
  },

  async createProduct(data: FormData | Partial<RetailProduct>): Promise<RetailProduct> {
    if (data instanceof FormData) {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'x-user-role': currentActiveRole,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data,
      });
      if (!res.ok) throw new Error('Failed to create product');
      return await res.json();
    }
    return fetchJson<RetailProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: FormData | Partial<RetailProduct>): Promise<RetailProduct> {
    if (data instanceof FormData) {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'x-user-role': currentActiveRole,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data,
      });
      if (!res.ok) throw new Error('Failed to update product');
      return await res.json();
    }
    return fetchJson<RetailProduct>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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
    return fetchJson<RetailerCustomer[]>('/retailer/customers');
  },

  async createRetailerCustomer(data: Omit<RetailerCustomer, 'id'>): Promise<RetailerCustomer> {
    return fetchJson<RetailerCustomer>('/retailer/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRetailerCustomer(id: string, data: Partial<RetailerCustomer>): Promise<RetailerCustomer> {
    return fetchJson<RetailerCustomer>(`/retailer/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteRetailerCustomer(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/retailer/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // --- RETAILER PROMOTIONS API ---
  async getPromotions(): Promise<Promotion[]> {
    return fetchJson<Promotion[]>('/promotions');
  },

  async createPromotion(promo: Omit<Promotion, 'id' | 'usageCount'>): Promise<Promotion> {
    return fetchJson<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(promo),
    });
  },

  async updatePromotion(id: string, promo: Partial<Promotion>): Promise<Promotion> {
    return fetchJson<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promo),
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
    return fetchJson<StoreSettings>('/store-settings');
  },

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<{ message: string; settings: StoreSettings }> {
    return fetchJson<{ message: string; settings: StoreSettings }>('/store-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // --- DESIGNERS & DESIGNS API ---
  async getDesigners(): Promise<Designer[]> {
    return fetchJson<Designer[]>('/designers');
  },

  async getDesigns(occasion?: string): Promise<Design[]> {
    const q = occasion && occasion !== 'All' ? `?occasion=${encodeURIComponent(occasion)}` : '';
    return fetchJson<Design[]>(`/designs${q}`);
  },

  async createDesign(data: {
    title: string;
    collection?: string;
    imageUrl: string;
    occasion?: string;
    palette?: string[];
    price?: number;
    designerId?: string;
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
    return fetchJson<StoreStock[]>(`/stores${q}`);
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
    return fetchJson<ColorCombo[]>(`/color-combos${q}`);
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
    return fetchJson<OutfitLook[]>('/social-feed');
  },

  async getLookById(id: string): Promise<OutfitLook> {
    return fetchJson<OutfitLook>(`/social-feed/${id}`);
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

  async deleteOutfitLook(id: string): Promise<{ success: boolean; id: string }> {
    return fetchJson<{ success: boolean; id: string }>(`/social-feed/${id}`, {
      method: 'DELETE',
    });
  },

  // --- AI ENGINE, CONVERSATIONAL STYLIST & VIRTUAL TRY-ON ---
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
    });
  },

  async chatStylist(message: string, options?: { budget?: number; occasion?: string }) {
    return fetchJson<{
      role: string;
      content: string;
      recommendedProducts?: RetailProduct[];
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, ...options }),
    });
  },

  async semanticSearch(q: string): Promise<RetailProduct[]> {
    return fetchJson<RetailProduct[]>(`/ai/search?q=${encodeURIComponent(q)}`);
  },

  async virtualTryOn(data: { userPhotoUrl: string; garmentId?: string; garmentUrl?: string }) {
    return fetchJson<{
      message: string;
      job: {
        jobId: string;
        resultUrl: string;
        status: string;
        fitConfidence: number;
        stylingNotes: string;
      };
    }>('/ai/try-on', {
      method: 'POST',
      body: JSON.stringify(data),
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
    });
  },

  // --- NOTIFICATIONS API ---
  async getNotifications() {
    return fetchJson<Array<{ id: string; title: string; message: string; type: string; read: boolean; createdAt: string }>>('/notifications');
  },

  // --- ADMIN APIs ---
  async getAdminStats(): Promise<AdminDashboardOverview> {
    return fetchJson<AdminDashboardOverview>('/admin/dashboard/stats');
  },

  async getAdminRecentActivities(): Promise<any[]> {
    return fetchJson<any[]>('/admin/dashboard/activities');
  },

  async getAdminUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    approvalStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: AdminUser[]; stats: AdminUserStats; total: number; page: number; totalPages: number }> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    if (params?.status) q.append('status', params.status);
    if (params?.approvalStatus) q.append('approvalStatus', params.approvalStatus);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJson(`/admin/users${qs}`);
  },

  async updateAdminUserApproval(id: string, approvalStatus: UserApprovalStatus, rejectionReason?: string) {
    return fetchJson(`/admin/users/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason }),
    });
  },

  async updateAdminUserStatus(id: string, status: UserAccountStatus) {
    return fetchJson(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async updateAdminUserRole(id: string, role: UserRole) {
    return fetchJson(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async getAdminRetailers(params?: any): Promise<{ retailers: AdminRetailer[]; stats: AdminRetailerStats }> {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/admin/retailers${q ? `?${q}` : ''}`);
  },

  async updateAdminRetailerApproval(id: string, approvalStatus: UserApprovalStatus, rejectionReason?: string) {
    return fetchJson(`/admin/retailers/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason }),
    });
  },

  async updateAdminRetailerStatus(id: string, status: UserAccountStatus) {
    return fetchJson(`/admin/retailers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getAdminDesigners(params?: any): Promise<{ designers: AdminDesigner[]; submissions: AdminDesignSubmission[]; stats: AdminDesignerStats }> {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/admin/designers${q ? `?${q}` : ''}`);
  },

  async updateAdminDesignerApproval(id: string, approvalStatus: UserApprovalStatus, rejectionReason?: string) {
    return fetchJson(`/admin/designers/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason }),
    });
  },

  async updateAdminDesignSubmission(id: string, approvalStatus: UserApprovalStatus, rejectionReason?: string) {
    return fetchJson(`/admin/designers/submissions/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason }),
    });
  },

  async getAdminOrders(params?: any): Promise<{ orders: CustomerOrder[]; stats: AdminOrderStats }> {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/admin/orders${q ? `?${q}` : ''}`);
  },

  async updateAdminOrderStatus(id: string, status: OrderStatus, trackingNumber?: string, deliveryDate?: string) {
    return fetchJson(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingNumber, deliveryDate }),
    });
  },
};
