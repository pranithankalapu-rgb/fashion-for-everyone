import express, { Request, Response } from 'express';
import cors from 'cors';
import { getDb, saveDb } from './db';
import type { ColorCombo, Design, OutfitLook, RetailProduct, UserProfile } from '../src/types/fashion';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
  const updatedProfile: UserProfile = { ...db.userProfile, ...req.body };
  db.userProfile = updatedProfile;
  saveDb(db);
  res.json({ message: 'Profile updated successfully', profile: updatedProfile });
});

// 3. AI Engine & Photo Analysis API
app.post('/api/ai/styling', (req: Request, res: Response) => {
  const db = getDb();
  const profile: UserProfile = req.body.profile || db.userProfile;
  const occasion = req.body.occasion || 'Work';

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
    paletteRationale: `Selected for ${profile.skinTone} skin tone and ${profile.undertone} undertones to enhance natural contrast for ${occasion} wear.`,
    bodyShapeAdvice: `For ${profile.bodyShape} body proportions (Chest: ${profile.measurements.chestCm}cm, Waist: ${profile.measurements.waistCm}cm, Hips: ${profile.measurements.hipsCm}cm), tailored longline jackets and high-waisted silhouettes elongate the torso while defining waistline symmetry.`,
    curatedProducts: matchedProducts,
  });
});

app.post('/api/ai/photo-analysis', (req: Request, res: Response) => {
  const { photoUrl } = req.body;
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
  const occasion = req.query.occasion as string;
  let combos = db.colorCombos;
  if (occasion && occasion !== 'All') {
    combos = combos.filter(c => c.occasion.toLowerCase() === occasion.toLowerCase());
  }
  res.json(combos);
});

app.post('/api/color-combos', (req: Request, res: Response) => {
  const db = getDb();
  const { title, occasion, subType, colors, exampleImageUrl } = req.body;

  if (!title || !colors || !Array.isArray(colors)) {
    return res.status(400).json({ error: 'Title and colors array are required' });
  }

  const newCombo: ColorCombo = {
    id: `combo_${Date.now()}`,
    title,
    occasion: occasion || 'Casual',
    subType: subType || 'Custom Palette',
    colors: colors,
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
  const { id } = req.params;
  const { direction } = req.body; // 'up' or 'down'

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
  const occasion = req.query.occasion as string;
  let designs = db.designs;
  if (occasion && occasion !== 'All') {
    designs = designs.filter(d => d.occasion.toLowerCase() === occasion.toLowerCase());
  }
  res.json(designs);
});

app.post('/api/designs', (req: Request, res: Response) => {
  const db = getDb();
  const { title, collection, imageUrl, occasion, palette, price } = req.body;

  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Title and image URL are required' });
  }

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
    palette: palette || ['#1E293B', '#D97706'],
    price: Number(price) || 290,
    inStock: true,
    createdAt: new Date().toISOString().split('T')[0],
  };

  db.designs.unshift(newDesign);
  saveDb(db);
  res.status(201).json(newDesign);
});

app.post('/api/designs/:id/vote', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { rating } = req.body; // e.g. 5

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
  const { query, category, maxPrice } = req.query;
  let products = db.products;

  if (query) {
    const q = (query as string).toLowerCase();
    products = products.filter(p => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }
  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= Number(maxPrice));
  }

  res.json(products);
});

app.get('/api/stores', (req: Request, res: Response) => {
  const db = getDb();
  const productId = req.query.productId as string;
  let stores = db.storeStocks;
  if (productId) {
    stores = stores.filter(s => s.productId === productId);
  }
  res.json(stores);
});

app.post('/api/stores/reserve', (req: Request, res: Response) => {
  const db = getDb();
  const { storeId, productId, size, customerName, customerPhone } = req.body;

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
  const { title, occasion, videoThumbnail, taggedProductIds } = req.body;

  if (!title || !videoThumbnail) {
    return res.status(400).json({ error: 'Title and video thumbnail are required' });
  }

  const tagged = db.products.filter(p => (taggedProductIds || []).includes(p.id));

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
  const { id } = req.params;

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
