export type OccasionType = 'Work' | 'Casual' | 'Date night' | 'Formal' | 'Athletic' | 'Party' | 'Travel';

export type StyleVibe = 'Classic' | 'Streetwear' | 'Minimalist' | 'Bold' | 'Boho' | 'Smart casual';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  photoUrl?: string;
  skinTone: 'Warm Golden' | 'Cool Rose' | 'Deep Rich' | 'Olive Neutral' | 'Fair Porcelain';
  undertone: 'Warm' | 'Cool' | 'Neutral';
  hairColor: string;
  bodyShape: 'Hourglass' | 'Rectangle' | 'Inverted Triangle' | 'Pear' | 'Oval';
  measurements: {
    heightCm: number;
    chestCm: number;
    waistCm: number;
    hipsCm: number;
  };
  selectedOccasions: OccasionType[];
  styleVibes: StyleVibe[];
  completedOnboarding: boolean;
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
