import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import type {
  UserProfile,
  ColorCombo,
  Designer,
  Design,
  RetailProduct,
  StoreStock,
  OutfitLook,
  CustomerOrder,
  RetailerCustomer,
  Promotion,
  StoreSettings,
} from './types/fashion';

export const prisma = new PrismaClient();



export interface DatabaseSchema {
  userProfile: UserProfile;
  colorCombos: ColorCombo[];
  designers: Designer[];
  designs: Design[];
  products: RetailProduct[];
  storeStocks: StoreStock[];
  outfitLooks: OutfitLook[];
  orders: CustomerOrder[];
  retailerCustomers: RetailerCustomer[];
  promotions: Promotion[];
  storeSettings: StoreSettings;
  reservations: Array<{
    id: string;
    storeId: string;
    productId: string;
    productTitle: string;
    size: string;
    customerName: string;
    customerPhone: string;
    status: 'CONFIRMED' | 'READY_FOR_PICKUP';
    createdAt: string;
  }>;
}

import { validateSafePath } from './security';

const BACKEND_DIR = path.resolve(process.cwd(), 'backend');
const DB_PATH = validateSafePath(BACKEND_DIR, 'data.json');

const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user_01',
  name: 'Sophia Laurent',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  skinTone: 'Warm Golden',
  undertone: 'Warm',
  hairColor: 'Warm Chestnut Brown',
  bodyShape: 'Hourglass',
  measurements: {
    heightCm: 172,
    chestCm: 88,
    waistCm: 68,
    hipsCm: 94,
  },
  selectedOccasions: ['Work', 'Date night', 'Casual'],
  styleVibes: ['Minimalist', 'Smart casual', 'Classic'],
  completedOnboarding: true,
};

const INITIAL_COLOR_COMBINATIONS: ColorCombo[] = [
  {
    id: 'combo_1',
    occasion: 'Work',
    subType: 'Smart casual',
    title: 'Navy + Cream + Tan',
    colors: [
      { name: 'Midnight Navy', hex: '#1E293B' },
      { name: 'Silk Cream', hex: '#FDFBF7' },
      { name: 'Warm Tan', hex: '#D97706' },
    ],
    rating: 4.9,
    votesCount: 8240,
    trendingScore: 98,
    exampleImageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'combo_2',
    occasion: 'Casual',
    subType: 'Weekend',
    title: 'Forest + Sand + Mocha',
    colors: [
      { name: 'Deep Forest', hex: '#14532D' },
      { name: 'Sahara Sand', hex: '#EAB308' },
      { name: 'Rich Mocha', hex: '#78350F' },
    ],
    rating: 4.8,
    votesCount: 6510,
    trendingScore: 92,
    exampleImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'combo_3',
    occasion: 'Date night',
    subType: 'Fine dining',
    title: 'Monochrome Noir + Gold Accent',
    colors: [
      { name: 'Jet Noir', hex: '#0F172A' },
      { name: 'Charcoal Matte', hex: '#334155' },
      { name: 'Gilded Gold', hex: '#F59E0B' },
    ],
    rating: 4.95,
    votesCount: 11420,
    trendingScore: 99,
    exampleImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
  },
];

const INITIAL_DESIGNERS: Designer[] = [
  {
    id: 'des_1',
    name: 'Aria Vance',
    handle: '@ariavance.studio',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    bio: 'Sustainable minimalist tailoring & sculptural silhouettes. Crafted in Milan.',
    followers: 48200,
    avgRating: 4.92,
    totalVotes: 3210,
    badges: ['Top Rated', 'Trending'],
    verified: true,
  },
  {
    id: 'des_2',
    name: 'Kaelen Mercer',
    handle: '@kaelenmercer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    bio: 'Avant-garde streetwear meets organic Japanese denim and tech fabrics.',
    followers: 31400,
    avgRating: 4.85,
    totalVotes: 1840,
    badges: ['Trending'],
    verified: true,
  },
  {
    id: 'des_3',
    name: 'Elysian Atelier',
    handle: '@elysian.official',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    bio: 'Fluid silk resortwear & ethereal evening silhouettes for modern iconoclasts.',
    followers: 19800,
    avgRating: 4.79,
    totalVotes: 950,
    badges: ['New'],
    verified: true,
  },
];

const INITIAL_DESIGNS: Design[] = [
  {
    id: 'dsg_1',
    designerId: 'des_1',
    designerName: 'Aria Vance',
    designerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    title: 'Asymmetric Cashmere Blazer & Pleated Trousers',
    collection: 'Autumn Monochrome 2026',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    rating: 4.94,
    votesCount: 890,
    occasion: 'Work',
    palette: ['#1E293B', '#CBD5E1', '#0F172A'],
    price: 340,
    inStock: true,
    createdAt: '2026-07-15',
  },
  {
    id: 'dsg_2',
    designerId: 'des_1',
    designerName: 'Aria Vance',
    designerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    title: 'Sculptural Silk Midi Dress in Midnight Rose',
    collection: 'Resort Elegance',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    rating: 4.91,
    votesCount: 1240,
    occasion: 'Date night',
    palette: ['#881337', '#F472B6', '#1E1B4B'],
    price: 420,
    inStock: true,
    createdAt: '2026-07-20',
  },
];

const INITIAL_RETAIL_PRODUCTS: RetailProduct[] = [
  {
    id: 'prod_101',
    title: 'Double-Breasted Italian Wool Trench Coat',
    brand: 'Aria Vance Studio',
    category: 'Coats & Jackets',
    price: 340,
    originalPrice: 420,
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    colors: ['#1E293B', '#D97706'],
    silhouette: 'Tailored Longline',
    retailer: 'Nordstrom Flagship',
    affiliateUrl: 'https://nordstrom.com/item/101',
    similarityScore: 98,
    sku: 'AVS-TR-101',
    status: 'Active',
    description: 'Masterfully crafted double-breasted trench in 100% Italian virgin wool. Horn buttons and classic shoulder epaulets.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    occasion: 'Work',
    discountPercent: 19,
    stockQuantity: 18,
  },
  {
    id: 'prod_102',
    title: 'Minimalist Camel Wool Blend Overcoat',
    brand: 'Mango Luxe',
    category: 'Coats & Jackets',
    price: 160,
    originalPrice: 199,
    imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=600&q=80',
    colors: ['#D97706', '#FDFBF7'],
    silhouette: 'Relaxed Fit',
    retailer: 'Mango Direct',
    affiliateUrl: 'https://mango.com/item/102',
    similarityScore: 91,
    sku: 'MNG-CO-102',
    status: 'Active',
    description: 'Clean silhouette coat featuring a single-breasted front, notch lapels, and deep welt pockets.',
    sizes: ['S', 'M', 'L'],
    occasion: 'Casual',
    discountPercent: 20,
    stockQuantity: 7,
  },
  {
    id: 'prod_103',
    title: 'High-Waist Pleated Silk Trousers',
    brand: 'Zara Atelier',
    category: 'Pants',
    price: 89,
    originalPrice: 110,
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    colors: ['#FDFBF7', '#1E293B'],
    silhouette: 'Wide Leg Tapered',
    retailer: 'Zara Store Downtown',
    affiliateUrl: 'https://zara.com/item/103',
    similarityScore: 87,
    sku: 'ZRA-TR-103',
    status: 'Low Stock',
    description: 'Fluid drape trousers constructed from mulberry silk blend. Features double front pleats and side slip pockets.',
    sizes: ['XS', 'S', 'M'],
    occasion: 'Work',
    discountPercent: 19,
    stockQuantity: 3,
  },
  {
    id: 'prod_104',
    title: 'Emerald Satin Slip Dress with Cowl Neck',
    brand: 'Elysian Atelier',
    category: 'Dresses',
    price: 290,
    originalPrice: 350,
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    colors: ['#064E3B'],
    silhouette: 'Bias Cut Slip',
    retailer: 'Saks Fifth Avenue',
    affiliateUrl: 'https://saks.com/item/104',
    similarityScore: 95,
    sku: 'ELY-DR-104',
    status: 'Active',
    description: 'Ethereal bias-cut evening gown with delicate cross-back straps and a graceful cowl neckline.',
    sizes: ['XS', 'S', 'M', 'L'],
    occasion: 'Date night',
    discountPercent: 17,
    stockQuantity: 12,
  },
];

const INITIAL_STORE_STOCKS: StoreStock[] = [
  {
    id: 'store_1',
    productId: 'prod_101',
    storeName: 'Nordstrom Flagship Downtown',
    retailer: 'Nordstrom',
    address: '500 Pine St, Seattle, WA 98101',
    distanceMiles: 1.2,
    sizeStock: { XS: 1, S: 4, M: 2, L: 0 },
    canReserve: true,
  },
  {
    id: 'store_2',
    productId: 'prod_101',
    storeName: 'Bloomingdale’s Fashion Center',
    retailer: 'Bloomingdale’s',
    address: '100 Bellevue Way NE, Bellevue, WA 98004',
    distanceMiles: 4.8,
    sizeStock: { XS: 0, S: 2, M: 5, L: 3 },
    canReserve: true,
  },
  {
    id: 'store_3',
    productId: 'prod_103',
    storeName: 'Zara City Centre Plaza',
    retailer: 'Zara',
    address: '400 Pine St #200, Seattle, WA 98101',
    distanceMiles: 0.8,
    sizeStock: { XS: 3, S: 5, M: 6, L: 4 },
    canReserve: true,
  },
];

const INITIAL_OUTFIT_LOOKS: OutfitLook[] = [
  {
    id: 'look_1',
    creatorName: 'Elena Rostova',
    creatorHandle: '@elena_styles',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    videoThumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    title: 'Styling Navy & Cream for 9-to-5 to Cocktail Hour ✨',
    likes: 14200,
    reshares: 3890,
    occasion: 'Work',
    taggedProducts: [INITIAL_RETAIL_PRODUCTS[0], INITIAL_RETAIL_PRODUCTS[2]],
    userLiked: true,
  },
];

const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: 'ord_1028',
    orderNumber: 'ORD-1028',
    date: 'Aug 16, 2026',
    status: 'Pending',
    customerName: 'Claire Vance',
    customerEmail: 'claire.vance@example.com',
    customerPhone: '+1 (206) 555-0144',
    paymentMethod: 'Credit Card (Visa)',
    items: [
      {
        productId: 'prod_101',
        title: 'Double-Breasted Italian Wool Trench Coat',
        brand: 'Aria Vance Studio',
        imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        price: 340,
        quantity: 1,
        size: 'M',
        color: 'Midnight Navy',
        sku: 'AVS-TR-101',
      },
    ],
    totalAmount: 340,
    currency: '$',
    shippingAddress: '742 Evergreen Terrace, Seattle, WA 98103',
  },
  {
    id: 'ord_1025',
    orderNumber: 'ORD-1025',
    date: 'Aug 14, 2026',
    status: 'Processing',
    customerName: 'Marcus Miller',
    customerEmail: 'marcus.m@example.com',
    customerPhone: '+1 (206) 555-0812',
    paymentMethod: 'Apple Pay',
    items: [
      {
        productId: 'prod_103',
        title: 'High-Waist Pleated Silk Trousers',
        brand: 'Zara Atelier',
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=300&q=80',
        price: 89,
        quantity: 2,
        size: 'S',
        color: 'Silk Cream',
        sku: 'ZRA-TR-103',
      },
    ],
    totalAmount: 178,
    currency: '$',
    shippingAddress: '1208 4th Ave, Apt 14B, Seattle, WA 98101',
  },
  {
    id: 'ord_1024',
    orderNumber: 'ORD-1024',
    date: 'Aug 05, 2026',
    status: 'Delivered',
    customerName: 'Sophia Laurent',
    customerEmail: 'sophia.laurent@example.com',
    customerPhone: '+1 (206) 555-0192',
    paymentMethod: 'Credit Card (Mastercard)',
    items: [
      {
        productId: 'prod_101',
        title: 'Double-Breasted Italian Wool Trench Coat',
        brand: 'Aria Vance Studio',
        imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        price: 340,
        quantity: 1,
        size: 'M',
        color: 'Warm Tan',
        sku: 'AVS-TR-101',
      },
    ],
    totalAmount: 340,
    currency: '$',
    shippingAddress: '42 Fashion Boulevard, Apt 7B, New York, NY 10001',
    deliveryDate: 'Aug 07, 2026',
    trackingNumber: 'TRK-948201948',
  },
];

const INITIAL_RETAILER_CUSTOMERS: RetailerCustomer[] = [
  {
    id: 'cust_101',
    name: 'Sophia Laurent',
    email: 'sophia.laurent@example.com',
    phone: '+1 (206) 555-0192',
    ordersCount: 8,
    totalSpent: 2450,
    recentOrderDate: 'Aug 05, 2026',
    recentOrderId: 'ORD-1024',
    status: 'VIP',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'cust_102',
    name: 'Claire Vance',
    email: 'claire.vance@example.com',
    phone: '+1 (206) 555-0144',
    ordersCount: 3,
    totalSpent: 840,
    recentOrderDate: 'Aug 16, 2026',
    recentOrderId: 'ORD-1028',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'cust_103',
    name: 'Marcus Miller',
    email: 'marcus.m@example.com',
    phone: '+1 (206) 555-0812',
    ordersCount: 1,
    totalSpent: 178,
    recentOrderDate: 'Aug 14, 2026',
    recentOrderId: 'ORD-1025',
    status: 'New',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
];

const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo_1',
    code: 'SUMMER2026',
    title: 'Summer Luxury Tailoring Sale',
    discountType: 'Percentage',
    discountValue: 20,
    category: 'Coats & Jackets',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    usageCount: 142,
    maxUses: 500,
    status: 'Active',
  },
  {
    id: 'promo_2',
    code: 'ELEVATE50',
    title: '$50 Off Eveningwear Orders Over $250',
    discountType: 'Fixed Amount',
    discountValue: 50,
    category: 'Dresses',
    startDate: '2026-08-10',
    endDate: '2026-09-15',
    usageCount: 68,
    maxUses: 200,
    status: 'Active',
  },
];

const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'Nordstrom Flagship Studio',
  logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80',
  taxId: 'US-WA-948201948',
  currency: '$',
  managerName: 'Eleanor Vance',
  managerEmail: 'eleanor.vance@nordstrom-partner.com',
  managerPhone: '+1 (206) 555-0100',
  address: '500 Pine Street, Suite 400, Seattle, WA 98101',
  supportEmail: 'retailer-support@fashionforeveryone.com',
  supportPhone: '+1 (800) 555-FASHION',
  autoFulfill: false,
  lowStockThreshold: 5,
  emailNotifications: true,
  smsAlerts: true,
  weeklyReport: true,
};

const initialData: DatabaseSchema = {
  userProfile: INITIAL_USER_PROFILE,
  colorCombos: INITIAL_COLOR_COMBINATIONS,
  designers: INITIAL_DESIGNERS,
  designs: INITIAL_DESIGNS,
  products: INITIAL_RETAIL_PRODUCTS,
  storeStocks: INITIAL_STORE_STOCKS,
  outfitLooks: INITIAL_OUTFIT_LOOKS,
  orders: INITIAL_ORDERS,
  retailerCustomers: INITIAL_RETAILER_CUSTOMERS,
  promotions: INITIAL_PROMOTIONS,
  storeSettings: INITIAL_STORE_SETTINGS,
  reservations: [],
};

export function getDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return {
      ...initialData,
      ...data,
    };
  } catch (err) {
    console.error('Error reading backend database, restoring defaults:', err);
    return initialData;
  }
}

export function saveDb(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving backend database:', err);
  }
}
