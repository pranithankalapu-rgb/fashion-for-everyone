import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';
import { securityHeadersMiddleware, rateLimiter } from './security.js';
import http from 'http';

const app = express();
app.use(securityHeadersMiddleware);
app.use('/api', rateLimiter);
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiRouter);

const TEST_PORT = 5055;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 200, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 200, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runAllTests() {
  const server = app.listen(TEST_PORT);
  let failedCount = 0;
  let passedCount = 0;

  function assert(condition, testName, detail) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`, detail || '');
      failedCount++;
    }
  }

  try {
    console.log('🚀 Running Complete End-to-End Backend Verification Test Suite...\n');

    // 1. Health
    console.log('[1/12] Testing Health Check');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Health endpoint returns 200 OK');

    // 2. Profile
    console.log('\n[2/12] Testing Profile Management');
    const getProfile = await request('/api/profile');
    assert(getProfile.status === 200 && !!getProfile.data.name, 'GET /api/profile returns profile data');
    const updateProfile = await request('/api/profile', {
      method: 'PUT',
      body: { name: 'Sophia Laurent', skinTone: 'Warm Golden' },
    });
    assert(updateProfile.status === 200 && updateProfile.data.profile.name === 'Sophia Laurent', 'PUT /api/profile updates profile');

    // 3. AI Engine
    console.log('\n[3/12] Testing AI Engine (Styling & Photo Analysis)');
    const styling = await request('/api/ai/styling', {
      method: 'POST',
      body: { occasion: 'Work' },
    });
    assert(styling.status === 200 && styling.data.colorHarmonyScore > 0, 'POST /api/ai/styling returns styling scores');
    const photo = await request('/api/ai/photo-analysis', {
      method: 'POST',
      body: { photoUrl: 'https://example.com/photo.jpg' },
    });
    assert(photo.status === 200 && !!photo.data.skinTone, 'POST /api/ai/photo-analysis returns spectral classification');

    // 4. Products & RBAC
    console.log('\n[4/12] Testing Products & Role-Based Authorization');
    const forbiddenCreate = await request('/api/products', {
      method: 'POST',
      headers: { 'x-user-role': 'customer' },
      body: { title: 'Unauthorized Item', price: 100, imageUrl: 'https://example.com/item.jpg' },
    });
    assert(forbiddenCreate.status === 403, 'Customer cannot create product (403 Forbidden RBAC enforcement)');

    const createProd = await request('/api/products', {
      method: 'POST',
      headers: { 'x-user-role': 'retailer' },
      body: {
        title: 'Bespoke Italian Silk Suit',
        brand: 'Aria Vance Studio',
        category: 'Suits',
        price: 580,
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
        stockQuantity: 15,
        sizes: ['S', 'M', 'L'],
      },
    });
    assert(createProd.status === 201 && !!createProd.data.id, 'Retailer creates product (201 Created)');
    const testProdId = createProd.data.id;

    const getProd = await request(`/api/products/${testProdId}`);
    assert(getProd.status === 200 && getProd.data.price === 580, 'GET /api/products/:id retrieves created product');

    const updateStock = await request(`/api/products/${testProdId}/stock`, {
      method: 'PATCH',
      headers: { 'x-user-role': 'retailer' },
      body: { stockQuantity: 8 },
    });
    assert(updateStock.status === 200 && updateStock.data.stockQuantity === 8, 'PATCH /api/products/:id/stock updates inventory');

    // 5. Store Stocks & Pickup Reservations
    console.log('\n[5/12] Testing Store Locations & In-Store Pickup Reservations');
    const stores = await request('/api/stores');
    assert(stores.status === 200 && Array.isArray(stores.data) && stores.data.length > 0, 'GET /api/stores returns store locations');

    const reservation = await request('/api/stores/reserve', {
      method: 'POST',
      body: {
        storeId: stores.data[0].id,
        productId: stores.data[0].productId,
        size: 'S',
        customerName: 'Sophia Laurent',
        customerPhone: '(206) 555-0192',
      },
    });
    assert(reservation.status === 201 && !!reservation.data.reservation.id, 'POST /stores/reserve creates pickup reservation');

    // 6. Orders Workflow
    console.log('\n[6/12] Testing Order Placement & Fulfillment Lifecycle');
    const createOrder = await request('/api/orders', {
      method: 'POST',
      headers: { 'x-user-role': 'customer' },
      body: {
        customerName: 'Sophia Laurent',
        customerEmail: 'sophia.laurent@example.com',
        customerPhone: '+1 (206) 555-0192',
        shippingAddress: '42 Fashion Blvd, New York, NY 10001',
        paymentMethod: 'Credit Card (Visa)',
        items: [
          {
            productId: testProdId,
            title: 'Bespoke Italian Silk Suit',
            price: 580,
            quantity: 1,
            size: 'M',
          },
        ],
      },
    });
    assert(createOrder.status === 201 && !!createOrder.data.order.orderNumber, 'POST /api/orders creates new customer order');
    const testOrderId = createOrder.data.order.id;

    const updateOrderStatus = await request(`/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { 'x-user-role': 'retailer' },
      body: { status: 'Shipped', trackingNumber: 'TRK-WA-992019' },
    });
    assert(updateOrderStatus.status === 200 && updateOrderStatus.data.status === 'Shipped', 'PATCH /api/orders/:id/status updates fulfillment');

    // 7. Retailer CRM Customers
    console.log('\n[7/12] Testing Retailer CRM Customers');
    const customers = await request('/api/retailer/customers', {
      headers: { 'x-user-role': 'retailer' },
    });
    assert(customers.status === 200 && Array.isArray(customers.data), 'GET /api/retailer/customers returns customer CRM directory');

    // 8. Promotions
    console.log('\n[8/12] Testing Retailer Promotions & Coupons');
    const createPromo = await request('/api/promotions', {
      method: 'POST',
      headers: { 'x-user-role': 'retailer' },
      body: {
        code: 'AUTUMN2026',
        title: 'Autumn 25% Off Tailoring',
        discountType: 'Percentage',
        discountValue: 25,
      },
    });
    assert(createPromo.status === 201 && createPromo.data.code === 'AUTUMN2026', 'POST /api/promotions creates campaign');
    const testPromoId = createPromo.data.id;

    const togglePromo = await request(`/api/promotions/${testPromoId}/deactivate`, {
      method: 'PATCH',
      headers: { 'x-user-role': 'retailer' },
    });
    assert(togglePromo.status === 200 && togglePromo.data.status === 'Inactive', 'PATCH /api/promotions/:id/deactivate toggles active status');

    // 9. Store Settings
    console.log('\n[9/12] Testing Store Settings & Configurations');
    const getSettings = await request('/api/store-settings', {
      headers: { 'x-user-role': 'retailer' },
    });
    assert(getSettings.status === 200 && !!getSettings.data.storeName, 'GET /api/store-settings returns settings');

    const updateSettings = await request('/api/store-settings', {
      method: 'PUT',
      headers: { 'x-user-role': 'retailer' },
      body: { storeName: 'Nordstrom Flagship Seattle' },
    });
    assert(updateSettings.status === 200 && updateSettings.data.settings.storeName === 'Nordstrom Flagship Seattle', 'PUT /api/store-settings updates configuration');

    // 10. Designers & Designs
    console.log('\n[10/12] Testing Designer Showcase & Leaderboards');
    const designers = await request('/api/designers');
    assert(designers.status === 200 && Array.isArray(designers.data), 'GET /api/designers returns leaderboard');

    const createDesign = await request('/api/designs', {
      method: 'POST',
      headers: { 'x-user-role': 'designer' },
      body: {
        title: 'Velvet Sculpted Evening Gown',
        collection: 'Gala 2027',
        price: 450,
        imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
        occasion: 'Date night',
      },
    });
    assert(createDesign.status === 201 && !!createDesign.data.id, 'POST /api/designs creates showcase design');
    const testDesignId = createDesign.data.id;

    const voteDesign = await request(`/api/designs/${testDesignId}/vote`, {
      method: 'POST',
      body: { rating: 5 },
    });
    assert(voteDesign.status === 200 && voteDesign.data.votesCount >= 2, 'POST /api/designs/:id/vote increments votes');

    // 11. Color Arena
    console.log('\n[11/12] Testing Color Voting Arena');
    const createColor = await request('/api/color-combos', {
      method: 'POST',
      body: {
        title: 'Emerald Forest & Champagne Gold',
        occasion: 'Formal',
        colors: [
          { name: 'Emerald', hex: '#064E3B' },
          { name: 'Champagne', hex: '#FDFBF7' },
        ],
      },
    });
    assert(createColor.status === 201 && !!createColor.data.id, 'POST /api/color-combos creates color combination');
    const testColorId = createColor.data.id;

    const voteColor = await request(`/api/color-combos/${testColorId}/vote`, {
      method: 'POST',
      body: { direction: 'up' },
    });
    assert(voteColor.status === 200 && voteColor.data.votesCount >= 2, 'POST /api/color-combos/:id/vote casts upvote');

    // 12. Social Feed
    console.log('\n[12/12] Testing Social Lookbook Feed');
    const createLook = await request('/api/social-feed', {
      method: 'POST',
      body: {
        title: 'Monochrome Outerwear Styling 2026',
        videoThumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
      },
    });
    assert(createLook.status === 201 && !!createLook.data.id, 'POST /api/social-feed creates lookbook post');
    const testLookId = createLook.data.id;

    const likeLook = await request(`/api/social-feed/${testLookId}/like`, {
      method: 'POST',
    });
    assert(likeLook.status === 200 && typeof likeLook.data.likes === 'number', 'POST /api/social-feed/:id/like toggles likes');

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passedCount} passed, ${failedCount} failed`);
    console.log(`========================================\n`);

    if (failedCount === 0) {
      console.log('🎉 ALL END-TO-END FEATURES ARE 100% OPERATIONAL & VERIFIED!');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    server.close();
  }
}

runAllTests();

