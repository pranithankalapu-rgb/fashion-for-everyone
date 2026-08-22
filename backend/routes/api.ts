import { Router } from 'express';
import { authenticateRole, requireRole } from '../middleware/auth';
import { profileController } from '../controllers/profileController';
import { aiController } from '../controllers/aiController';
import { productController } from '../controllers/productController';
import { orderController } from '../controllers/orderController';
import { retailerController } from '../controllers/retailerController';
import { designerController } from '../controllers/designerController';
import { socialAndColorController } from '../controllers/socialAndColorController';
import { getDb, saveDb } from '../db';
import { sanitizeString } from '../security';

const router = Router();

// Apply role authentication middleware across all API routes
router.use(authenticateRole);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Fashion for Everyone Backend API Engine',
  });
});

// Profile Routes
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);

// AI Engine Routes
router.post('/ai/styling', aiController.getStyling);
router.post('/ai/photo-analysis', aiController.analyzePhoto);

// Product Management Routes
router.get('/products', productController.getAll);
router.get('/products/:id', productController.getById);
router.post('/products', requireRole(['retailer', 'designer']), productController.create);
router.put('/products/:id', requireRole(['retailer', 'designer']), productController.update);
router.delete('/products/:id', requireRole(['retailer', 'designer']), productController.delete);
router.patch('/products/:id/stock', requireRole(['retailer']), productController.updateStock);

// Store Stock Locations & Pickup Reservations
router.get('/stores', (req, res) => {
  const db = getDb();
  const productId = sanitizeString(req.query.productId as string);
  let stores = db.storeStocks || [];
  if (productId) {
    stores = stores.filter(s => s.productId === productId);
  }
  res.json(stores);
});

router.post('/stores/reserve', (req, res) => {
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

// Order Routes (Customer placement & Retailer management)
router.get('/orders', orderController.getAll);
router.get('/orders/:id', orderController.getById);
router.post('/orders', orderController.create);
router.patch('/orders/:id/status', requireRole(['retailer']), orderController.updateStatus);
router.delete('/orders/:id', requireRole(['customer', 'retailer']), orderController.delete);

// Retailer CRM Customer Routes
router.get('/retailer/customers', requireRole(['retailer']), retailerController.getCustomers);
router.post('/retailer/customers', requireRole(['retailer']), retailerController.createCustomer);
router.put('/retailer/customers/:id', requireRole(['retailer']), retailerController.updateCustomer);
router.delete('/retailer/customers/:id', requireRole(['retailer']), retailerController.deleteCustomer);

// Retailer Promotion Routes
router.get('/promotions', retailerController.getPromotions);
router.post('/promotions', requireRole(['retailer']), retailerController.createPromotion);
router.put('/promotions/:id', requireRole(['retailer']), retailerController.updatePromotion);
router.patch('/promotions/:id/deactivate', requireRole(['retailer']), retailerController.toggleDeactivatePromotion);
router.delete('/promotions/:id', requireRole(['retailer']), retailerController.deletePromotion);

// Retailer Store Settings Routes
router.get('/store-settings', requireRole(['retailer']), retailerController.getSettings);
router.put('/store-settings', requireRole(['retailer']), retailerController.updateSettings);

// Designer Showcase & Voting Routes
router.get('/designers', designerController.getDesigners);
router.get('/designs', designerController.getDesigns);
router.post('/designs', requireRole(['designer', 'retailer']), designerController.createDesign);
router.post('/designs/:id/vote', designerController.voteDesign);

// Color Arena & Social Outfit Feed Routes
router.get('/color-combos', socialAndColorController.getColorCombos);
router.post('/color-combos', socialAndColorController.createColorCombo);
router.post('/color-combos/:id/vote', socialAndColorController.voteColorCombo);

router.get('/social-feed', socialAndColorController.getSocialFeed);
router.post('/social-feed', socialAndColorController.createOutfitLook);
router.post('/social-feed/:id/like', socialAndColorController.toggleLikeOutfitLook);

export default router;
