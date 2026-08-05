import fs from 'fs';
import path from 'path';
import type { UserProfile, ColorCombo, Designer, Design, RetailProduct, StoreStock, OutfitLook } from '../src/types/fashion';

export interface DatabaseSchema {
  userProfile: UserProfile;
  colorCombos: ColorCombo[];
  designers: Designer[];
  designs: Design[];
  products: RetailProduct[];
  storeStocks: StoreStock[];
  outfitLooks: OutfitLook[];
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

const DB_PATH = path.join(process.cwd(), 'server', 'data.json');

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
  {
    id: 'combo_4',
    occasion: 'Formal',
    subType: 'Black tie',
    title: 'Midnight Navy + Sterling Silver',
    colors: [
      { name: 'Midnight Blue', hex: '#0F172A' },
      { name: 'Sterling Silver', hex: '#94A3B8' },
      { name: 'Pure Frost', hex: '#F8FAFC' },
    ],
    rating: 4.87,
    votesCount: 5120,
    trendingScore: 88,
    exampleImageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'combo_5',
    occasion: 'Party',
    subType: 'Cocktail',
    title: 'Emerald Luxe + Rose Champagne',
    colors: [
      { name: 'Emerald Velvet', hex: '#064E3B' },
      { name: 'Rose Gold', hex: '#F472B6' },
      { name: 'Obsidian', hex: '#020617' },
    ],
    rating: 4.76,
    votesCount: 4390,
    trendingScore: 85,
    exampleImageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'combo_6',
    occasion: 'Travel',
    subType: 'City break',
    title: 'Oatmeal + Sage + Denim Blue',
    colors: [
      { name: 'Oatmeal Tweed', hex: '#E2E8F0' },
      { name: 'Sage Linen', hex: '#475569' },
      { name: 'Indigo Denim', hex: '#1D4ED8' },
    ],
    rating: 4.82,
    votesCount: 3890,
    trendingScore: 86,
    exampleImageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
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
  {
    id: 'dsg_3',
    designerId: 'des_2',
    designerName: 'Kaelen Mercer',
    designerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    title: 'Oversized Raw Denim Trench & Utility Pants',
    collection: 'Tokyo Underground',
    imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=600&q=80',
    rating: 4.86,
    votesCount: 610,
    occasion: 'Casual',
    palette: ['#1E3A8A', '#475569', '#F1F5F9'],
    price: 280,
    inStock: true,
    createdAt: '2026-07-10',
  },
  {
    id: 'dsg_4',
    designerId: 'des_3',
    designerName: 'Elysian Atelier',
    designerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    title: 'Draped Emerald Backless Gala Gown',
    collection: 'Celestial Gala',
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
    rating: 4.88,
    votesCount: 340,
    occasion: 'Formal',
    palette: ['#064E3B', '#10B981', '#F59E0B'],
    price: 650,
    inStock: true,
    createdAt: '2026-07-28',
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
  },
  {
    id: 'prod_104',
    title: 'Emerald Satin Slip Dress with Cowl Neck',
    brand: 'Elysian Atelier',
    category: 'Dresses',
    price: 290,
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    colors: ['#064E3B'],
    silhouette: 'Bias Cut Slip',
    retailer: 'Saks Fifth Avenue',
    affiliateUrl: 'https://saks.com/item/104',
    similarityScore: 95,
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
  {
    id: 'look_2',
    creatorName: 'Marcus Sterling',
    creatorHandle: '@marcus.fits',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    videoThumbnail: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=600&q=80',
    title: 'Earth Tone Layering Guide for Coffee & Art Galleries ☕🎨',
    likes: 9810,
    reshares: 1740,
    occasion: 'Casual',
    taggedProducts: [INITIAL_RETAIL_PRODUCTS[1]],
    userLiked: false,
  },
  {
    id: 'look_3',
    creatorName: 'Chloe Bennett',
    creatorHandle: '@chloe.minimalist',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    videoThumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    title: 'Date Night Silhouette Breakdown: Silk & Structured Wool 🌙',
    likes: 18400,
    reshares: 4520,
    occasion: 'Date night',
    taggedProducts: [INITIAL_RETAIL_PRODUCTS[3], INITIAL_RETAIL_PRODUCTS[0]],
    userLiked: true,
  },
];

const initialData: DatabaseSchema = {
  userProfile: INITIAL_USER_PROFILE,
  colorCombos: INITIAL_COLOR_COMBINATIONS,
  designers: INITIAL_DESIGNERS,
  designs: INITIAL_DESIGNS,
  products: INITIAL_RETAIL_PRODUCTS,
  storeStocks: INITIAL_STORE_STOCKS,
  outfitLooks: INITIAL_OUTFIT_LOOKS,
  reservations: [],
};

export function getDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const serverDir = path.dirname(DB_PATH);
      if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database, resetting to default schema:', err);
    return initialData;
  }
}

export function saveDb(data: DatabaseSchema): void {
  try {
    const serverDir = path.dirname(DB_PATH);
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database:', err);
  }
}
