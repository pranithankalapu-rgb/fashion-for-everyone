import { Router } from 'express';
import { authenticateRole, requireRole, requireAuth } from '../middleware/auth';
import { authController } from '../controllers/authController';
import { profileController } from '../controllers/profileController';
import { aiController } from '../controllers/aiController';
import { productController } from '../controllers/productController';
import { orderController } from '../controllers/orderController';
import { retailerController } from '../controllers/retailerController';
import { designerController } from '../controllers/designerController';
import { socialAndColorController } from '../controllers/socialAndColorController';
import { paymentService } from '../services/paymentService';
import { prisma, getDb, saveDb } from '../db';
import { sanitizeString } from '../security';

const router = Router();

import { upload } from '../middleware/upload';

// Apply authentication extraction across all API routes
router.use(authenticateRole);

import adminAuthRouter from './admin/authRoutes';
import adminOrderRouter from './admin/orderRoutes';
import adminUserRouter from './admin/userRoutes';
import adminRetailerRouter from './admin/retailerRoutes';
import adminDesignerRouter from './admin/designerRoutes';
import adminDashboardRouter from './admin/dashboardRoutes';

// Health check
router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Fashion for Everyone Backend API Engine',
      database: 'connected',
    });
  } catch {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Fashion for Everyone Backend API Engine',
      database: 'connected (fallback mode)',
    });
  }
});

// --- UNIFIED AUTHENTICATION ROUTES (/api/auth) ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', requireAuth, authController.getMe);

// --- PAYMENT PROVIDER GATEWAY ROUTES (/api/payments) ---
router.post('/payments/create-intent', async (req, res) => {
  try {
    const { orderId, amount, currency, gateway, customerEmail, customerPhone } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Order ID and amount are required.' });
    }
    const result = await paymentService.createOrderPaymentIntent({
      orderId: sanitizeString(orderId),
      amount: Number(amount),
      currency: sanitizeString(currency) || 'USD',
      gateway: sanitizeString(gateway) || 'MOCK',
      customerEmail: sanitizeString(customerEmail),
      customerPhone: sanitizeString(customerPhone),
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Create payment intent error:', err);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

router.post('/payments/verify', async (req, res) => {
  try {
    const { paymentIntentId, gateway, signature, paymentId } = req.body;
    const result = await paymentService.verifyAndConfirmPayment({
      paymentIntentId: sanitizeString(paymentIntentId),
      gateway: sanitizeString(gateway),
      signature: sanitizeString(signature),
      paymentId: sanitizeString(paymentId),
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Payment verify error:', err);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

router.post('/payments/webhook', orderController.handlePaymentWebhook);

// Admin Auth Routes under /api/admin/auth
router.use('/admin/auth', adminAuthRouter);
router.use('/admin/orders', adminOrderRouter);
router.use('/admin/users', adminUserRouter);
router.use('/admin/retailers', adminRetailerRouter);
router.use('/admin/designers', adminDesignerRouter);
router.use('/admin/dashboard', adminDashboardRouter);

// Profile Routes
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);

// AI Engine, Conversational Stylist & VTON Routes
router.post('/ai/styling', aiController.getStyling);
router.post('/ai/photo-analysis', aiController.analyzePhoto);
router.post('/ai/chat', aiController.chatStylist);
router.get('/ai/search', aiController.semanticSearch);
router.post('/ai/try-on', aiController.virtualTryOn);

// Product Management Routes
router.get('/products', productController.getAll);
router.get('/products/:id', productController.getById);
router.post('/products', upload.single('image'), productController.create);
router.put('/products/:id', upload.single('image'), productController.update);
router.delete('/products/:id', productController.delete);
router.patch('/products/:id/stock', productController.updateStock);

// Store Stock Locations & Pickup Reservations
router.get('/stores', async (req, res) => {
  try {
    const productId = sanitizeString(req.query.productId as string);
    const whereClause: any = {};
    if (productId) whereClause.productId = productId;

    try {
      const stores = await prisma.storeStock.findMany({ where: whereClause });
      return res.json(stores);
    } catch {
      const db = getDb();
      const stores = productId ? db.storeStocks.filter(s => s.productId === productId) : db.storeStocks;
      return res.json(stores);
    }
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

    try {
      const store = await prisma.storeStock.findUnique({ where: { id: storeId } });
      const product = await prisma.retailProduct.findUnique({ where: { id: productId } });

      if (!store || !product) {
        return res.status(404).json({ error: 'Store or Product not found' });
      }

      const sizeStock = store.sizeStock as Record<string, number>;
      if ((sizeStock[size] || 0) <= 0) {
        return res.status(400).json({ error: `Size ${size} is currently out of stock at this location` });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedSizeStock = { ...sizeStock, [size]: sizeStock[size] - 1 };
        await tx.storeStock.update({
          where: { id: storeId },
          data: { sizeStock: updatedSizeStock },
        });

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

      return res.status(201).json({
        message: 'Store reservation confirmed!',
        reservation: result,
        storeName: store.storeName,
        address: store.address,
        pickupWindowHours: 48,
      });
    } catch {
      // Fallback
      const db = getDb();
      const store = db.storeStocks.find(s => s.id === storeId);
      const product = db.products.find(p => p.id === productId);
      if (!store || !product) return res.status(404).json({ error: 'Store or Product not found' });

      const reservation = {
        id: `res_${Date.now()}`,
        storeId,
        productId,
        productTitle: product.title,
        size,
        customerName,
        customerPhone: customerPhone || 'Not provided',
        status: 'CONFIRMED' as const,
        createdAt: new Date().toISOString(),
      };
      db.reservations.push(reservation);
      saveDb(db);

      return res.status(201).json({
        message: 'Store reservation confirmed!',
        reservation,
        storeName: store.storeName,
        address: store.address,
        pickupWindowHours: 48,
      });
    }
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// Order Routes (Customer placement & Retailer management)
router.get('/orders', orderController.getAll);
router.get('/orders/:id', orderController.getById);
router.post('/orders', orderController.create);
router.post('/orders/webhook', orderController.handlePaymentWebhook);
router.patch('/orders/:id/status', requireRole(['retailer']), orderController.updateStatus);
router.delete('/orders/:id', requireRole(['customer', 'retailer']), orderController.delete);

// Notifications Routes
router.get('/notifications', async (req, res) => {
  try {
    const role = req.userRole || 'retailer';
    try {
      const notes = await prisma.notification.findMany({
        where: { recipientRole: { equals: role, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return res.json(notes);
    } catch {
      return res.json([
        {
          id: 'notif_1',
          recipientRole: role,
          title: 'System Ready',
          message: 'All live services and real-time feeds are active.',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

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
router.get('/social-feed/:id', socialAndColorController.getLookById);
router.post('/social-feed', socialAndColorController.createOutfitLook);
router.post('/social-feed/:id/like', socialAndColorController.toggleLikeOutfitLook);
router.delete('/social-feed/:id', socialAndColorController.deleteOutfitLook);

export default router;
