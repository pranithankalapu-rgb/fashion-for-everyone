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
}

export interface StoreStock {
  id: string;
  productId: string;
  storeName: string;
  retailer: string;
  address: string;
  distanceMiles: number;
  sizeStock: { [key: string]: number }; // e.g. { XS: 0, S: 3, M: 5, L: 2 }
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

export type OrderStatus = 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled' | 'Returned';

export interface OrderItem {
  productId: string;
  title: string;
  brand: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
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
}
