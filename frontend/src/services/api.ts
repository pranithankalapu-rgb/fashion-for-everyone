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

let currentActiveRole: 'customer' | 'designer' | 'retailer' = 'customer';

export function setCurrentRole(role: 'customer' | 'designer' | 'retailer') {
  currentActiveRole = role;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('admin_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': currentActiveRole,
    'x-user-id': 'user_01',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
}

export const api = {
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

  // --- ORDERS API (Customer & Retailer) ---
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

  // --- ADMIN ORDERS MANAGEMENT API ---
  async getAdminOrders(params?: {
    status?: string;
    search?: string;
    sortBy?: 'date' | 'totalAmount' | 'orderNumber' | 'status';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ orders: CustomerOrder[]; stats: AdminOrderStats; total: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const q = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ orders: CustomerOrder[]; stats: AdminOrderStats; total: number }>(`/admin/orders${q}`);
  },

  async getAdminOrderById(id: string): Promise<CustomerOrder> {
    return fetchJson<CustomerOrder>(`/admin/orders/${id}`);
  },

  async updateAdminOrderStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<{ success: boolean; message: string; order: CustomerOrder }> {
    return fetchJson<{ success: boolean; message: string; order: CustomerOrder }>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingNumber }),
    });
  },

  async deleteAdminOrder(id: string): Promise<{ success: boolean; message: string; deletedOrder: CustomerOrder }> {
    return fetchJson<{ success: boolean; message: string; deletedOrder: CustomerOrder }>(`/admin/orders/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminOrderStats(): Promise<AdminOrderStats> {
    return fetchJson<AdminOrderStats>('/admin/orders/stats');
  },

  // --- ADMIN USERS & ROLE APPROVALS API ---
  async getAdminUsers(params?: {
    role?: string;
    approvalStatus?: string;
    status?: string;
    search?: string;
    sortBy?: 'createdAt' | 'name' | 'email' | 'role' | 'approvalStatus' | 'status';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: AdminUser[]; stats: AdminUserStats; total: number }> {
    const query = new URLSearchParams();
    if (params?.role && params.role !== 'All') query.append('role', params.role);
    if (params?.approvalStatus && params.approvalStatus !== 'All') query.append('approvalStatus', params.approvalStatus);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const q = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ users: AdminUser[]; stats: AdminUserStats; total: number }>(`/admin/users${q}`);
  },

  async getAdminUserById(id: string): Promise<AdminUser> {
    return fetchJson<AdminUser>(`/admin/users/${id}`);
  },

  async updateAdminUserApproval(
    id: string,
    approvalStatus: UserApprovalStatus,
    rejectionReason?: string,
    approvedRole?: UserRole
  ): Promise<{ success: boolean; message: string; user: AdminUser }> {
    return fetchJson<{ success: boolean; message: string; user: AdminUser }>(`/admin/users/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason, approvedRole }),
    });
  },

  async updateAdminUserRole(
    id: string,
    role: UserRole
  ): Promise<{ success: boolean; message: string; user: AdminUser }> {
    return fetchJson<{ success: boolean; message: string; user: AdminUser }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async updateAdminUserStatus(
    id: string,
    status: UserAccountStatus
  ): Promise<{ success: boolean; message: string; user: AdminUser }> {
    return fetchJson<{ success: boolean; message: string; user: AdminUser }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async createAdminUser(
    userData: Partial<AdminUser>
  ): Promise<{ success: boolean; message: string; user: AdminUser }> {
    return fetchJson<{ success: boolean; message: string; user: AdminUser }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateAdminUser(
    id: string,
    userData: Partial<AdminUser>
  ): Promise<{ success: boolean; message: string; user: AdminUser }> {
    return fetchJson<{ success: boolean; message: string; user: AdminUser }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteAdminUser(id: string): Promise<{ success: boolean; message: string; user: AdminUser }> {
    return fetchJson<{ success: boolean; message: string; user: AdminUser }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminUserStats(): Promise<AdminUserStats> {
    return fetchJson<AdminUserStats>('/admin/users/stats');
  },

  // --- ADMIN RETAILER STORE APPROVALS API ---
  async getAdminRetailers(params?: {
    approvalStatus?: string;
    status?: string;
    search?: string;
    sortBy?: 'createdAt' | 'storeName' | 'managerName' | 'approvalStatus' | 'status';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ retailers: AdminRetailer[]; stats: AdminRetailerStats; total: number }> {
    const query = new URLSearchParams();
    if (params?.approvalStatus && params.approvalStatus !== 'All') query.append('approvalStatus', params.approvalStatus);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const q = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ retailers: AdminRetailer[]; stats: AdminRetailerStats; total: number }>(`/admin/retailers${q}`);
  },

  async getAdminRetailerById(id: string): Promise<AdminRetailer> {
    return fetchJson<AdminRetailer>(`/admin/retailers/${id}`);
  },

  async updateAdminRetailerApproval(
    id: string,
    approvalStatus: 'Approved' | 'Rejected',
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string; retailer: AdminRetailer }> {
    return fetchJson<{ success: boolean; message: string; retailer: AdminRetailer }>(`/admin/retailers/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason }),
    });
  },

  async updateAdminRetailerStatus(
    id: string,
    status: 'Active' | 'Inactive' | 'Suspended'
  ): Promise<{ success: boolean; message: string; retailer: AdminRetailer }> {
    return fetchJson<{ success: boolean; message: string; retailer: AdminRetailer }>(`/admin/retailers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async createAdminRetailer(
    data: Partial<AdminRetailer>
  ): Promise<{ success: boolean; message: string; retailer: AdminRetailer }> {
    return fetchJson<{ success: boolean; message: string; retailer: AdminRetailer }>('/admin/retailers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminRetailer(
    id: string,
    data: Partial<AdminRetailer>
  ): Promise<{ success: boolean; message: string; retailer: AdminRetailer }> {
    return fetchJson<{ success: boolean; message: string; retailer: AdminRetailer }>(`/admin/retailers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminRetailer(id: string): Promise<{ success: boolean; message: string; retailer: AdminRetailer }> {
    return fetchJson<{ success: boolean; message: string; retailer: AdminRetailer }>(`/admin/retailers/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminRetailerStats(): Promise<AdminRetailerStats> {
    return fetchJson<AdminRetailerStats>('/admin/retailers/stats');
  },

  // --- ADMIN DESIGNER SUBMISSIONS APPROVAL API ---
  async getAdminDesigners(params?: {
    type?: 'all' | 'designers' | 'designs';
    approvalStatus?: string;
    search?: string;
    sortBy?: 'createdAt' | 'name' | 'rating' | 'approvalStatus' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ designers: AdminDesigner[]; designs: AdminDesignSubmission[]; stats: AdminDesignerStats; total: number }> {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.approvalStatus && params.approvalStatus !== 'All') query.append('approvalStatus', params.approvalStatus);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const q = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ designers: AdminDesigner[]; designs: AdminDesignSubmission[]; stats: AdminDesignerStats; total: number }>(`/admin/designers${q}`);
  },

  async getAdminDesignerById(id: string): Promise<AdminDesigner> {
    return fetchJson<AdminDesigner>(`/admin/designers/${id}`);
  },

  async getAdminDesignById(id: string): Promise<AdminDesignSubmission> {
    return fetchJson<AdminDesignSubmission>(`/admin/designers/designs/${id}`);
  },

  async updateAdminDesignerApproval(
    id: string,
    approvalStatus: 'Approved' | 'Rejected',
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string; designer: AdminDesigner }> {
    return fetchJson<{ success: boolean; message: string; designer: AdminDesigner }>(`/admin/designers/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason }),
    });
  },

  async updateAdminDesignApproval(
    id: string,
    approvalStatus: 'Approved' | 'Rejected',
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string; design: AdminDesignSubmission }> {
    return fetchJson<{ success: boolean; message: string; design: AdminDesignSubmission }>(`/admin/designers/designs/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, rejectionReason }),
    });
  },

  async createAdminDesigner(
    data: Partial<AdminDesigner>
  ): Promise<{ success: boolean; message: string; designer: AdminDesigner }> {
    return fetchJson<{ success: boolean; message: string; designer: AdminDesigner }>('/admin/designers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminDesigner(
    id: string,
    data: Partial<AdminDesigner>
  ): Promise<{ success: boolean; message: string; designer: AdminDesigner }> {
    return fetchJson<{ success: boolean; message: string; designer: AdminDesigner }>(`/admin/designers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminDesigner(id: string): Promise<{ success: boolean; message: string; designer: AdminDesigner }> {
    return fetchJson<{ success: boolean; message: string; designer: AdminDesigner }>(`/admin/designers/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteAdminDesign(id: string): Promise<{ success: boolean; message: string; design: AdminDesignSubmission }> {
    return fetchJson<{ success: boolean; message: string; design: AdminDesignSubmission }>(`/admin/designers/designs/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminDesignerStats(): Promise<AdminDesignerStats> {
    return fetchJson<AdminDesignerStats>('/admin/designers/stats');
  },

  // --- ADMIN EXECUTIVE DASHBOARD OVERVIEW API ---
  async getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
    return fetchJson<AdminDashboardOverview>('/admin/dashboard/overview');
  },

  // --- RETAIL PRODUCTS API ---
  async getProducts(query?: string, category?: string, maxPrice?: number): Promise<RetailProduct[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    if (maxPrice) params.append('maxPrice', maxPrice.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<RetailProduct[]>(`/products${q}`);
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
    return fetchJson<RetailerCustomer[]>('/retailer/customers');
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
    return fetchJson<Promotion[]>('/promotions');
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
    }>('/ai/styling', {
      method: 'POST',
      body: JSON.stringify({ profile, occasion }),
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
};
