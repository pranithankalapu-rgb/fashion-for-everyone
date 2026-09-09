// Types mirrored from frontend/src/types/fashion.ts
// Keep in sync with web types

export type OccasionType = 'Work' | 'Casual' | 'Date night' | 'Formal' | 'Athletic' | 'Party' | 'Travel';
export type StyleVibe = 'Classic' | 'Streetwear' | 'Minimalist' | 'Bold' | 'Boho' | 'Smart casual';
export type UserApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserAccountStatus = 'Active' | 'Inactive' | 'Suspended';
export type UserRole = 'customer' | 'designer' | 'retailer' | 'admin';
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
export type ProductStatus = 'Active' | 'Draft' | 'Low Stock' | 'Out of Stock' | 'Archived';

export interface UserProfile {
  id: string;
  name: string;
  email?: string | null;
  avatar: string;
  photoUrl?: string | null;
  skinTone: string;
  undertone: string;
  hairColor: string;
  bodyShape: string;
  measurements: {
    heightCm: number;
    chestCm: number;
    waistCm: number;
    hipsCm: number;
  };
  selectedOccasions: OccasionType[];
  styleVibes: StyleVibe[];
  completedOnboarding: boolean;
  role?: UserRole;
  approvalStatus?: UserApprovalStatus;
  status?: UserAccountStatus;
  requestedRole?: string | null;
  rejectionReason?: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ColorCombo {
  id: string;
  occasion: OccasionType;
  subType: string;
  title: string;
  colors: { name: string; hex: string }[];
  rating: number;
  votesCount: number;
  userVote?: number;
  trendingScore: number;
  exampleImageUrl: string;
}

export interface Designer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followers: number;
  avgRating: number;
  totalVotes: number;
  badges: ('Top Rated' | 'Trending' | 'New')[];
  verified: boolean;
}

export interface Design {
  id: string;
  designerId: string;
  designerName: string;
  designerAvatar: string;
  title: string;
  collection: string;
  imageUrl: string;
  rating: number;
  votesCount: number;
  occasion: OccasionType;
  palette: string[];
  price: number;
  inStock: boolean;
  createdAt: string;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  title: string;
  brand: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  sku?: string;
  product?: RetailProduct;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  shippingAddress: string;
  deliveryDate?: string;
  trackingNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
}

export interface RetailProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  colors: string[];
  silhouette: string;
  retailer: string;
  affiliateUrl: string;
  similarityScore?: number;
  sku?: string;
  status?: ProductStatus;
  description?: string;
  sizes?: string[];
  occasion?: OccasionType;
  discountPercent?: number;
  stockQuantity?: number;
}

export interface StoreStock {
  id: string;
  productId: string;
  storeName: string;
  retailer: string;
  address: string;
  distanceMiles: number;
  sizeStock: { [key: string]: number };
  canReserve: boolean;
}

export interface OutfitLook {
  id: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  videoThumbnail: string;
  title: string;
  likes: number;
  reshares: number;
  occasion: OccasionType;
  taggedProducts: RetailProduct[];
  userLiked?: boolean;
}

export interface RetailerCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  recentOrderDate: string;
  recentOrderId: string;
  status: 'Active' | 'VIP' | 'New' | 'Inactive';
  avatar?: string;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  discountType: 'Percentage' | 'Fixed Amount';
  discountValue: number;
  category?: string;
  productId?: string;
  startDate: string;
  endDate: string;
  usageCount: number;
  maxUses: number;
  status: 'Active' | 'Scheduled' | 'Expired' | 'Inactive';
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  taxId: string;
  currency: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
  autoFulfill: boolean;
  lowStockThreshold: number;
  emailNotifications: boolean;
  smsAlerts: boolean;
  weeklyReport: boolean;
}

export interface CartItem {
  product: RetailProduct;
  quantity: number;
  size: string;
  color?: string;
}

export interface AiStylingResult {
  colorHarmonyScore: number;
  fitScore: number;
  overallMatch: number;
  recommendedPalette: string[];
  paletteRationale: string;
  bodyShapeAdvice: string;
  curatedProducts: RetailProduct[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: RetailProduct[];
}
