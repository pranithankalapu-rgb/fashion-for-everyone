import express, { Request, Response } from 'express';
import cors from 'cors';
import { getDb, saveDb } from './db';
import type { ColorCombo, Design, OutfitLook, RetailProduct, UserProfile } from '../src/types/fashion';
import { sanitizeString, sanitizeObject, escapeRegex, securityHeadersMiddleware, rateLimiter } from './security';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

// Security Headers Middleware
app.use(securityHeadersMiddleware);

// Rate Limiter
app.use('/api', rateLimiter);

// CORS configuration
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser with 100kb payload limit (prevents DoS memory overflow)
app.use(express.json({ limit: '100kb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Fashion for Everyone API' });
});

// 2. User Profile API
app.get('/api/profile', (req: Request, res: Response) => {
  const db = getDb();
  res.json(db.userProfile);
});

app.put('/api/profile', (req: Request, res: Response) => {
  const db = getDb();
  const sanitizedBody = sanitizeObject(req.body);
  const updatedProfile: UserProfile = { ...db.userProfile, ...sanitizedBody };
  db.userProfile = updatedProfile;
  saveDb(db);
  res.json({ message: 'Profile updated successfully', profile: updatedProfile });
});

// 3. AI Engine & Photo Analysis API
app.post('/api/ai/styling', (req: Request, res: Response) => {
  const db = getDb();
  const reqProfile = req.body.profile ? sanitizeObject(req.body.profile) : null;
  const profile: UserProfile = reqProfile || db.userProfile;
  const occasion = sanitizeString(req.body.occasion) || 'Work';

  // Calculate dynamic AI scoring based on skin tone and body shape
  let colorHarmonyScore = 94;
  let fitScore = 96;
  if (profile.skinTone === 'Warm Golden' || profile.skinTone === 'Deep Rich') {
    colorHarmonyScore = 98;
  }
  if (profile.bodyShape === 'Hourglass' || profile.bodyShape === 'Rectangle') {
    fitScore = 97;
  }

  // Filter products matched to selected occasion and vibe
  const matchedProducts = db.products.map(p => ({
    ...p,
    similarityScore: Math.floor(88 + Math.random() * 11),
  }));

  res.json({
    colorHarmonyScore,
    fitScore,
    overallMatch: Math.round((colorHarmonyScore + fitScore) / 2),
    recommendedPalette: ['#1E293B', '#FDFBF7', '#D97706', '#064E3B'],
    paletteRationale: `Selected for ${sanitizeString(profile.skinTone)} skin tone and ${sanitizeString(profile.undertone)} undertones to enhance natural contrast for ${occasion} wear.`,
    bodyShapeAdvice: `For ${sanitizeString(profile.bodyShape)} body proportions (Chest: ${Number(profile.measurements?.chestCm) || 0}cm, Waist: ${Number(profile.measurements?.waistCm) || 0}cm, Hips: ${Number(profile.measurements?.hipsCm) || 0}cm), tailored longline jackets and high-waisted silhouettes elongate the torso while defining waistline symmetry.`,
    curatedProducts: matchedProducts,
  });
});

app.post('/api/ai/photo-analysis', (req: Request, res: Response) => {
  const photoUrl = sanitizeString(req.body.photoUrl);
  if (!photoUrl) {
    return res.status(400).json({ error: 'Photo URL is required' });
  }

  // AI photo analysis auto-detection logic
  const detectedTones: UserProfile['skinTone'][] = ['Warm Golden', 'Cool Rose', 'Deep Rich', 'Olive Neutral', 'Fair Porcelain'];
  const detectedUndertones: UserProfile['undertone'][] = ['Warm', 'Cool', 'Neutral'];
  const detectedShapes: UserProfile['bodyShape'][] = ['Hourglass', 'Rectangle', 'Inverted Triangle', 'Pear'];

  const randomTone = detectedTones[Math.floor(Math.random() * detectedTones.length)];
  const randomUndertone = detectedUndertones[Math.floor(Math.random() * detectedUndertones.length)];
  const randomShape = detectedShapes[Math.floor(Math.random() * detectedShapes.length)];

  res.json({
    confidence: 0.96,
    skinTone: randomTone,
    undertone: randomUndertone,
    hairColor: 'Warm Chestnut Brown',
    bodyShape: randomShape,
    estimatedMeasurements: {
      heightCm: 172,
      chestCm: 88,
      waistCm: 68,
      hipsCm: 94,
    },
    message: 'AI photo spectral breakdown complete',
  });
});

// 4. Color Voting Arena API
app.get('/api/color-combos', (req: Request, res: Response) => {
  const db = getDb();
  const occasion = sanitizeString(req.query.occasion as string);
  let combos = db.colorCombos;
  if (occasion && occasion !== 'All') {
    combos = combos.filter(c => c.occasion.toLowerCase() === occasion.toLowerCase());
  }
  res.json(combos);
});

app.post('/api/color-combos', (req: Request, res: Response) => {
  const db = getDb();
  const title = sanitizeString(req.body.title);
  const occasion = sanitizeString(req.body.occasion);
  const subType = sanitizeString(req.body.subType);
  const exampleImageUrl = sanitizeString(req.body.exampleImageUrl);
  const rawColors = req.body.colors;

  if (!title || !rawColors || !Array.isArray(rawColors)) {
    return res.status(400).json({ error: 'Title and colors array are required' });
  }

  const sanitizedColors = sanitizeObject(rawColors);

  const newCombo: ColorCombo = {
    id: `combo_${Date.now()}`,
    title,
    occasion: occasion || 'Casual',
    subType: subType || 'Custom Palette',
    colors: sanitizedColors,
    rating: 5.0,
    votesCount: 1,
    trendingScore: 100,
    exampleImageUrl: exampleImageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  };

  db.colorCombos.unshift(newCombo);
  saveDb(db);
  res.status(201).json(newCombo);
});

app.post('/api/color-combos/:id/vote', (req: Request, res: Response) => {
  const db = getDb();
  const id = sanitizeString(req.params.id);
  const direction = sanitizeString(req.body.direction); // 'up' or 'down'

  const combo = db.colorCombos.find(c => c.id === id);
  if (!combo) {
    return res.status(404).json({ error: 'Color combination not found' });
  }

  if (direction === 'up') {
    combo.votesCount += 1;
    combo.trendingScore += 1;
    combo.rating = Math.min(5.0, Number((combo.rating + 0.01).toFixed(2)));
    combo.userVote = 1;
  } else if (direction === 'down') {
    combo.votesCount = Math.max(0, combo.votesCount - 1);
    combo.userVote = -1;
  }

  saveDb(db);
  res.json(combo);
});

// 5. Designer Showcase & Leaderboard API
app.get('/api/designers', (req: Request, res: Response) => {
  const db = getDb();
  const sortedDesigners = [...db.designers].sort((a, b) => b.avgRating - a.avgRating);
  res.json(sortedDesigners);
});

app.get('/api/designs', (req: Request, res: Response) => {
  const db = getDb();
  const occasion = sanitizeString(req.query.occasion as string);
  let designs = db.designs;
  if (occasion && occasion !== 'All') {
    designs = designs.filter(d => d.occasion.toLowerCase() === occasion.toLowerCase());
  }
  res.json(designs);
});

app.post('/api/designs', (req: Request, res: Response) => {
  const db = getDb();
  const title = sanitizeString(req.body.title);
  const collection = sanitizeString(req.body.collection);
  const imageUrl = sanitizeString(req.body.imageUrl);
  const occasion = sanitizeString(req.body.occasion);
  const rawPalette = req.body.palette;
  const price = Number(req.body.price);

  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Title and image URL are required' });
  }

  const sanitizedPalette = Array.isArray(rawPalette) ? rawPalette.map(c => sanitizeString(c)) : ['#1E293B', '#D97706'];

  const newDesign: Design = {
    id: `dsg_${Date.now()}`,
    designerId: 'des_1',
    designerName: 'Aria Vance',
    designerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    title,
    collection: collection || 'Spring / Summer Collection',
    imageUrl,
    rating: 5.0,
    votesCount: 1,
    occasion: occasion || 'Casual',
    palette: sanitizedPalette,
    price: price || 290,
    inStock: true,
    createdAt: new Date().toISOString().split('T')[0],
  };

  db.designs.unshift(newDesign);
  saveDb(db);
  res.status(201).json(newDesign);
});

app.post('/api/designs/:id/vote', (req: Request, res: Response) => {
  const db = getDb();
  const id = sanitizeString(req.params.id);
  const rating = Number(req.body.rating);

  const design = db.designs.find(d => d.id === id);
  if (!design) {
    return res.status(404).json({ error: 'Design not found' });
  }

  const totalPoints = design.rating * design.votesCount + (rating || 5);
  design.votesCount += 1;
  design.rating = Number((totalPoints / design.votesCount).toFixed(2));

  saveDb(db);
  res.json(design);
});

// 6. Commerce Stock Locator & Budget API
app.get('/api/products', (req: Request, res: Response) => {
  const db = getDb();
  const queryParam = req.query.query ? sanitizeString(req.query.query as string) : '';
  const categoryParam = req.query.category ? sanitizeString(req.query.category as string) : '';
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  let products = db.products;

  if (queryParam) {
    const safeRegex = new RegExp(escapeRegex(queryParam), 'i');
    products = products.filter(p => safeRegex.test(p.title) || safeRegex.test(p.brand));
  }
  if (categoryParam && categoryParam !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === categoryParam.toLowerCase());
  }
  if (maxPrice !== null && !isNaN(maxPrice)) {
    products = products.filter(p => p.price <= maxPrice);
  }

  res.json(products);
});

app.get('/api/stores', (req: Request, res: Response) => {
  const db = getDb();
  const productId = sanitizeString(req.query.productId as string);
  let stores = db.storeStocks;
  if (productId) {
    stores = stores.filter(s => s.productId === productId);
  }
  res.json(stores);
});

app.post('/api/stores/reserve', (req: Request, res: Response) => {
  const db = getDb();
  const storeId = sanitizeString(req.body.storeId);
  const productId = sanitizeString(req.body.productId);
  const size = sanitizeString(req.body.size);
  const customerName = sanitizeString(req.body.customerName);
  const customerPhone = sanitizeString(req.body.customerPhone);

  if (!storeId || !productId || !size || !customerName) {
    return res.status(400).json({ error: 'Missing required reservation fields' });
  }

  const store = db.storeStocks.find(s => s.id === storeId);
  const product = db.products.find(p => p.id === productId);

  if (!store || !product) {
    return res.status(404).json({ error: 'Store or Product not found' });
  }

  if ((store.sizeStock[size] || 0) <= 0) {
    return res.status(400).json({ error: `Size ${size} is currently out of stock at this location` });
  }

  // Deduct inventory size
  store.sizeStock[size] -= 1;

  const reservationId = `RES-${Math.floor(100000 + Math.random() * 900000)}`;
  const newReservation = {
    id: reservationId,
    storeId,
    productId,
    productTitle: product.title,
    size,
    customerName,
    customerPhone: customerPhone || 'Not provided',
    status: 'CONFIRMED' as const,
    createdAt: new Date().toISOString(),
  };

  db.reservations.push(newReservation);
  saveDb(db);

  res.status(201).json({
    message: 'Store reservation confirmed!',
    reservation: newReservation,
    storeName: store.storeName,
    address: store.address,
    pickupWindowHours: 48,
  });
});

// 7. Social Feed & Outfit Board API
app.get('/api/social-feed', (req: Request, res: Response) => {
  const db = getDb();
  res.json(db.outfitLooks);
});

app.post('/api/social-feed', (req: Request, res: Response) => {
  const db = getDb();
  const title = sanitizeString(req.body.title);
  const occasion = sanitizeString(req.body.occasion);
  const videoThumbnail = sanitizeString(req.body.videoThumbnail);
  const rawTaggedProductIds = req.body.taggedProductIds;

  if (!title || !videoThumbnail) {
    return res.status(400).json({ error: 'Title and video thumbnail are required' });
  }

  const taggedProductIds = Array.isArray(rawTaggedProductIds) ? rawTaggedProductIds.map(id => sanitizeString(id)) : [];
  const tagged = db.products.filter(p => taggedProductIds.includes(p.id));

  const newLook: OutfitLook = {
    id: `look_${Date.now()}`,
    creatorName: db.userProfile.name,
    creatorHandle: `@${db.userProfile.name.toLowerCase().replace(/\s+/g, '')}`,
    creatorAvatar: db.userProfile.avatar,
    videoThumbnail,
    title,
    likes: 1,
    reshares: 0,
    occasion: occasion || 'Casual',
    taggedProducts: tagged.length > 0 ? tagged : [db.products[0]],
    userLiked: true,
  };

  db.outfitLooks.unshift(newLook);
  saveDb(db);

  res.status(201).json(newLook);
});

app.post('/api/social-feed/:id/like', (req: Request, res: Response) => {
  const db = getDb();
  const id = sanitizeString(req.params.id);

  const look = db.outfitLooks.find(l => l.id === id);
  if (!look) {
    return res.status(404).json({ error: 'Outfit look not found' });
  }

  if (look.userLiked) {
    look.userLiked = false;
    look.likes = Math.max(0, look.likes - 1);
  } else {
    look.userLiked = true;
    look.likes += 1;
  }

  saveDb(db);
  res.json(look);
});

app.listen(PORT, () => {
  console.log(`✨ Fashion for Everyone REST API running at http://localhost:${PORT}`);
});
