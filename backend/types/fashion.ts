export type OccasionType = 'Work' | 'Casual' | 'Date night' | 'Formal' | 'Athletic' | 'Party' | 'Travel';

export type StyleVibe = 'Classic' | 'Streetwear' | 'Minimalist' | 'Bold' | 'Boho' | 'Smart casual';

export type UserApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserAccountStatus = 'Active' | 'Inactive' | 'Suspended';
export type UserRole = 'customer' | 'designer' | 'retailer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email?: string | null;
  avatar: string;
  photoUrl?: string | null;
  skinTone: 'Warm Golden' | 'Cool Rose' | 'Deep Rich' | 'Olive Neutral' | 'Fair Porcelain' | string;
  undertone: 'Warm' | 'Cool' | 'Neutral' | string;
  hairColor: string;
  bodyShape: 'Hourglass' | 'Rectangle' | 'Inverted Triangle' | 'Pear' | 'Oval' | string;
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  avatar: string;
  photoUrl?: string | null;
  skinTone?: string;
  undertone?: string;
  hairColor?: string;
  bodyShape?: string;
  measurements?: any;
  selectedOccasions?: string[];
  styleVibes?: string[];
  completedOnboarding?: boolean;
  role: UserRole;
  approvalStatus: UserApprovalStatus;
  status: UserAccountStatus;
  requestedRole?: string | null;
  rejectionReason?: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
  designerProfile?: Designer | null;
  ordersCount?: number;
}

export interface AdminUserStats {
  totalUsers: number;
  pendingApprovals: number;
  approvedCount: number;
  rejectedCount: number;
  activeCount: number;
  inactiveCount: number;
  roleCounts: {
    customer: number;
    designer: number;
    retailer: number;
    admin: number;
  };
}

export interface AdminRetailer {
  id: string;
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
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  status: 'Active' | 'Inactive' | 'Suspended';
  rejectionReason?: string | null;
  businessType?: string | null;
  createdAt: string;
  updatedAt: string;
  storeStocksCount?: number;
  totalProductsStocked?: number;
}

export interface AdminRetailerStats {
  totalStores: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  activeCount: number;
  inactiveCount: number;
  totalStockLocations: number;
}

export interface AdminDesigner {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followers: number;
  avgRating: number;
  totalVotes: number;
  badges: string[];
  verified: boolean;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  status: 'Active' | 'Inactive' | 'Suspended';
  email?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  designsCount?: number;
  designs?: Design[];
}

export interface AdminDesignSubmission {
  id: string;
  designerId: string;
  designerName: string;
  designerAvatar: string;
  title: string;
  collection: string;
  imageUrl: string;
  rating: number;
  votesCount: number;
  occasion: string;
  palette: string[];
  price: number;
  inStock: boolean;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string | null;
  status: 'Active' | 'Inactive';
  createdAt: string;
  submittedAt: string;
}

export interface AdminDesignerStats {
  totalDesigners: number;
  verifiedDesigners: number;
  pendingDesignerApprovals: number;
  rejectedDesigners: number;
  totalDesigns: number;
  approvedDesigns: number;
  pendingDesignApprovals: number;
  rejectedDesigns: number;
  totalShowcaseVotes: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'order' | 'user' | 'store' | 'designer' | 'design' | 'reservation';
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
  badgeColor?: string;
}

export interface AdminPendingQueueItem {
  id: string;
  category: 'retailer' | 'designer' | 'design' | 'user';
  title: string;
  subtitle: string;
  timestamp: string;
  requestedAction: string;
  linkTab: string;
}

export interface AdminDashboardOverview {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalUsers: number;
    activeUsers: number;
    totalRetailers: number;
    approvedRetailers: number;
    totalDesigners: number;
    verifiedDesigners: number;
    totalDesigns: number;
    totalProducts: number;
    lowStockProducts: number;
    pendingApprovalsTotal: number;
  };
  pendingBreakdown: {
    users: number;
    retailers: number;
    designers: number;
    designs: number;
  };
  roleBreakdown: {
    customer: number;
    designer: number;
    retailer: number;
    admin: number;
  };
  orderStatusBreakdown: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
  };
  recentActivity: AdminActivityItem[];
  recentOrders: CustomerOrder[];
  pendingQueue: AdminPendingQueueItem[];
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

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
export type ProductStatus = 'Active' | 'Draft' | 'Low Stock' | 'Out of Stock' | 'Archived';

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

export interface OrderItem {
  productId: string;
  title: string;
  brand: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  sku?: string;
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
