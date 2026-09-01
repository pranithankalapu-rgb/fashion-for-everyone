import { Router } from 'express';
import { authenticateRole, requireRole } from '../middleware/auth';
import { profileController } from '../controllers/profileController';
import { aiController } from '../controllers/aiController';
import { productController } from '../controllers/productController';
import { orderController } from '../controllers/orderController';
import { retailerController } from '../controllers/retailerController';
import { designerController } from '../controllers/designerController';
import { socialAndColorController } from '../controllers/socialAndColorController';
import { prisma } from '../db';
import { sanitizeString } from '../security';

const router = Router();

import { upload } from '../middleware/upload';

// Apply role authentication middleware across all API routes
router.use(authenticateRole);

import adminAuthRouter from './admin/authRoutes';

// Health check
router.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Fashion for Everyone Backend API Engine',
      database: 'connected',
    });
  } catch (err) {
    res.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      service: 'Fashion for Everyone Backend API Engine',
      database: 'disconnected',
    });
  }
});

// Admin Auth Routes under /api/admin/auth
router.use('/admin/auth', adminAuthRouter);


// Profile Routes
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);

// AI Engine Routes
router.post('/ai/styling', aiController.getStyling);
router.post('/ai/photo-analysis', aiController.analyzePhoto);

// Product Management Routes
router.get('/products', productController.getAll);
router.get('/products/:id', productController.getById);
router.post('/products', upload.single('image'), productController.create);
router.put('/products/:id', upload.single('image'), productController.update);
router.delete('/products/:id', productController.delete);
router.patch('/products/:id/stock', productController.updateStock);


// Store Stock Locations & Pickup Reservations (migrated to Prisma)
router.get('/stores', async (req, res) => {
  try {
    const productId = sanitizeString(req.query.productId as string);

    const whereClause: any = {};
    if (productId) {
      whereClause.productId = productId;
    }

    const stores = await prisma.storeStock.findMany({
      where: whereClause,
    });
    res.json(stores);
  } catch (err) {
    console.error('Error fetching store stocks:', err);
    res.status(500).json({ error: 'Failed to fetch store locations' });
  }
});

router.post('/stores/reserve', async (req, res) => {
  try {
    const storeId = sanitizeString(req.body.storeId);
    const productId = sanitizeString(req.body.productId);
    const size = sanitizeString(req.body.size);
    const customerName = sanitizeString(req.body.customerName);
    const customerPhone = sanitizeString(req.body.customerPhone);

    if (!storeId || !productId || !size || !customerName) {
      return res.status(400).json({ error: 'Missing required reservation fields' });
    }

    const store = await prisma.storeStock.findUnique({ where: { id: storeId } });
    const product = await prisma.retailProduct.findUnique({ where: { id: productId } });

    if (!store || !product) {
      return res.status(404).json({ error: 'Store or Product not found' });
    }

    const sizeStock = store.sizeStock as Record<string, number>;
    if ((sizeStock[size] || 0) <= 0) {
      return res.status(400).json({ error: `Size ${size} is currently out of stock at this location` });
    }

    // Use a transaction: update store stock + create reservation
    const result = await prisma.$transaction(async (tx) => {
      // Decrement size stock
      const updatedSizeStock = { ...sizeStock, [size]: sizeStock[size] - 1 };
      await tx.storeStock.update({
        where: { id: storeId },
        data: { sizeStock: updatedSizeStock },
      });

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          storeId,
          productId,
          productTitle: product.title,
          size,
          customerName,
          customerPhone: customerPhone || 'Not provided',
          status: 'CONFIRMED',
        },
      });

      return reservation;
    });

    res.status(201).json({
      message: 'Store reservation confirmed!',
      reservation: result,
      storeName: store.storeName,
      address: store.address,
      pickupWindowHours: 48,
    });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
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
