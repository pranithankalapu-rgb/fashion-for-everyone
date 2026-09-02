import { prisma } from './db';

const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('🧪 Starting End-to-End Test Suite against real PostgreSQL Database...\n');

  let passed = 0;
  let failed = 0;

  async function assertTest(name: string, fn: () => Promise<boolean>) {
    try {
      const ok = await fn();
      if (ok) {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: ${name}`);
        failed++;
      }
    } catch (err: any) {
      console.log(`  ❌ ERROR: ${name} - ${err.message}`);
      failed++;
    }
  }

  // 1. Health & DB
  await assertTest('Health & PostgreSQL connectivity', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    return data.status === 'ok' && data.database === 'connected';
  });

  // 2. Admin Auth
  let adminToken = '';
  await assertTest('Admin Auth Login', async () => {
    const res = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fashionforeveryone.com', password: 'adminpassword123' }),
    });
    const data = await res.json();
    adminToken = data.token;
    return res.status === 200 && !!data.token && data.admin.role === 'admin';
  });

  await assertTest('Admin Auth Protected /me', async () => {
    const res = await fetch(`${BASE_URL}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    return res.status === 200 && data.admin.email === 'admin@fashionforeveryone.com';
  });

  await assertTest('Admin Auth Reject unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/admin/auth/me`);
    return res.status === 401;
  });

  // 3. User Profile
  await assertTest('Get User Profile from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { 'x-user-id': 'user_01' },
    });
    const data = await res.json();
    return res.status === 200 && data.name === 'Sophia Laurent';
  });

  await assertTest('Update User Profile in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'user_01' },
      body: JSON.stringify({ skinTone: 'Warm Golden', hairColor: 'Chestnut Brown' }),
    });
    const data = await res.json();
    const dbProfile = await prisma.userProfile.findUnique({ where: { id: 'user_01' } });
    return res.status === 200 && dbProfile?.hairColor === 'Chestnut Brown';
  });

  // 4. Products CRUD
  let createdProductId = '';
  await assertTest('Get Products from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/products`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  });

  await assertTest('Create Product in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'E2E Test Velvet Blazer',
        brand: 'Aria Vance Studio',
        category: 'Coats & Jackets',
        price: 299,
        stockQuantity: 15,
        silhouette: 'Tailored',
      }),
    });
    const data = await res.json();
    createdProductId = data.id;
    const inDb = await prisma.retailProduct.findUnique({ where: { id: createdProductId } });
    return res.status === 201 && !!inDb && inDb.title === 'E2E Test Velvet Blazer';
  });

  await assertTest('Update Product Stock in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/products/${createdProductId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockQuantity: 4 }),
    });
    const data = await res.json();
    return res.status === 200 && data.status === 'Low Stock' && data.stockQuantity === 4;
  });

  await assertTest('Delete Product from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/products/${createdProductId}`, {
      method: 'DELETE',
    });
    const inDb = await prisma.retailProduct.findUnique({ where: { id: createdProductId } });
    return res.status === 200 && inDb === null;
  });

  // 5. Orders & Checkout Transaction
  let createdOrderId = '';
  await assertTest('Get Orders from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/orders`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 && !!data[0].items;
  });

  await assertTest('Create Order with Transaction (Order + Items + Stock + CRM)', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test Customer',
        customerEmail: 'test.customer@e2e.com',
        customerPhone: '+1 555-0199',
        shippingAddress: '100 E2E Way, Suite 100',
        paymentMethod: 'Credit Card',
        items: [
          {
            productId: 'prod_101',
            title: 'Double-Breasted Italian Wool Trench Coat',
            price: 340,
            quantity: 1,
            size: 'M',
          },
        ],
      }),
    });
    const data = await res.json();
    createdOrderId = data.order.id;
    const dbOrder = await prisma.customerOrder.findUnique({
      where: { id: createdOrderId },
      include: { items: true },
    });
    const dbCrm = await prisma.retailerCustomer.findFirst({
      where: { email: 'test.customer@e2e.com' },
    });
    return res.status === 201 && !!dbOrder && dbOrder.items.length === 1 && !!dbCrm;
  });

  await assertTest('Update Order Status in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
      body: JSON.stringify({ status: 'Delivered', trackingNumber: 'TRK-E2E-12345' }),
    });
    const data = await res.json();
    return res.status === 200 && data.status === 'Delivered' && data.trackingNumber === 'TRK-E2E-12345';
  });

  await assertTest('Delete Order from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
      method: 'DELETE',
      headers: { 'x-user-role': 'retailer' },
    });
    const inDb = await prisma.customerOrder.findUnique({ where: { id: createdOrderId } });
    return res.status === 200 && inDb === null;
  });

  // 5b. Admin Orders Management
  await assertTest('Admin Orders: Reject unauthorized access', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders`);
    return res.status === 401;
  });

  await assertTest('Admin Orders: GET all orders & stats with Admin Token', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    return res.status === 200 && Array.isArray(data.orders) && typeof data.stats?.totalOrders === 'number';
  });

  await assertTest('Admin Orders: GET single order by ID with Admin Token', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders/ord_1028`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    return res.status === 200 && (data.orderNumber === 'ORD-1028' || data.id === 'ord_1028');
  });

  await assertTest('Admin Orders: PATCH order status with tracking number', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders/ord_1028/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Processing', trackingNumber: 'TRK-ADMIN-99' }),
    });
    const data = await res.json();
    // restore
    await fetch(`${BASE_URL}/admin/orders/ord_1028/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Pending' }),
    });
    return res.status === 200 && data.order?.status === 'Processing' && data.order?.trackingNumber === 'TRK-ADMIN-99';
  });

  await assertTest('Admin Orders: Reject invalid order status', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders/ord_1028/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'BadStatus' }),
    });
    return res.status === 400;
  });

  // 6. Retailer CRM Customers
  let createdCustId = '';
  await assertTest('Get Retailer Customers from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/retailer/customers`, {
      headers: { 'x-user-role': 'retailer' },
    });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  });

  await assertTest('Create Retailer Customer in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/retailer/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: `jane.doe.${Date.now()}@e2e.com`,
        phone: '+1 555-0988',
        status: 'Active',
      }),
    });
    const data = await res.json();
    createdCustId = data.id;
    return res.status === 201 && data.name === 'Jane Doe';
  });

  await assertTest('Delete Retailer Customer from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/retailer/customers/${createdCustId}`, {
      method: 'DELETE',
      headers: { 'x-user-role': 'retailer' },
    });
    return res.status === 200;
  });

  // 7. Promotions
  let createdPromoId = '';
  await assertTest('Get Promotions from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/promotions`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  });

  await assertTest('Create Promotion in PostgreSQL', async () => {
    const code = `PROMO${Date.now()}`;
    const res = await fetch(`${BASE_URL}/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
      body: JSON.stringify({
        code,
        title: 'E2E 20% Discount',
        discountType: 'Percentage',
        discountValue: 20,
      }),
    });
    const data = await res.json();
    createdPromoId = data.id;
    return res.status === 201 && data.code === code;
  });

  await assertTest('Toggle Deactivate Promotion in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/promotions/${createdPromoId}/deactivate`, {
      method: 'PATCH',
      headers: { 'x-user-role': 'retailer' },
    });
    const data = await res.json();
    return res.status === 200 && data.status === 'Inactive';
  });

  await assertTest('Delete Promotion from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/promotions/${createdPromoId}`, {
      method: 'DELETE',
      headers: { 'x-user-role': 'retailer' },
    });
    return res.status === 200;
  });

  // 8. Store Settings
  await assertTest('Get & Update Store Settings in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/store-settings`, {
      headers: { 'x-user-role': 'retailer' },
    });
    const data = await res.json();
    const updateRes = await fetch(`${BASE_URL}/store-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
      body: JSON.stringify({ storeName: 'Updated Flagship Store' }),
    });
    const updateData = await updateRes.json();
    return updateRes.status === 200 && updateData.settings.storeName === 'Updated Flagship Store';
  });

  // 9. Designers & Designs
  let createdDesignId = '';
  await assertTest('Get Designers from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/designers`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  });

  await assertTest('Create & Vote Design in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'designer' },
      body: JSON.stringify({
        designerId: 'des_1',
        title: 'E2E Haute Couture Gown',
        collection: 'E2E Gala',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        price: 550,
        occasion: 'Formal',
      }),
    });
    const data = await res.json();
    createdDesignId = data.id;

    const voteRes = await fetch(`${BASE_URL}/designs/${createdDesignId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5 }),
    });
    const voteData = await voteRes.json();
    return res.status === 201 && voteRes.status === 200 && voteData.votesCount === 2;
  });

  // 10. Color Combos & Voting
  let createdComboId = '';
  await assertTest('Create & Vote Color Combo in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/color-combos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Amber + Indigo + Cream',
        occasion: 'Work',
        colors: [
          { name: 'Amber Gold', hex: '#F59E0B' },
          { name: 'Indigo Deep', hex: '#1E3A8A' },
        ],
      }),
    });
    const data = await res.json();
    createdComboId = data.id;

    const voteRes = await fetch(`${BASE_URL}/color-combos/${createdComboId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'up' }),
    });
    const voteData = await voteRes.json();
    return res.status === 201 && voteRes.status === 200 && voteData.votesCount === 2;
  });

  // 11. Social Feed
  let createdLookId = '';
  await assertTest('Create & Like Outfit Look in PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/social-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Chic Autumn Layering',
        occasion: 'Casual',
        videoThumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
      }),
    });
    const data = await res.json();
    createdLookId = data.id;

    const likeRes = await fetch(`${BASE_URL}/social-feed/${createdLookId}/like`, {
      method: 'POST',
    });
    const likeData = await likeRes.json();
    return res.status === 201 && likeRes.status === 200;
  });

  // 12. Store Reservation Transaction
  await assertTest('Create Store Reservation in PostgreSQL with Transaction', async () => {
    const res = await fetch(`${BASE_URL}/stores/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: 'store_1',
        productId: 'prod_101',
        size: 'S',
        customerName: 'E2E Reservation User',
        customerPhone: '+1 555-0933',
      }),
    });
    const data = await res.json();
    return res.status === 201 && data.reservation.status === 'CONFIRMED';
  });

  // 13. AI Styling & Photo Analysis
  await assertTest('AI Styling Engine with PostgreSQL persistence', async () => {
    const res = await fetch(`${BASE_URL}/ai/styling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occasion: 'Formal' }),
    });
    const data = await res.json();
    const lastRequest = await prisma.aiAnalysisRequest.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return res.status === 200 && !!data.recommendedPalette && !!lastRequest;
  });

  await assertTest('AI Photo Spectral Analysis with PostgreSQL persistence', async () => {
    const res = await fetch(`${BASE_URL}/ai/photo-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }),
    });
    const data = await res.json();
    const lastRequest = await prisma.aiAnalysisRequest.findFirst({
      where: { photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' },
      orderBy: { createdAt: 'desc' },
    });
    return res.status === 200 && !!data.skinTone && !!lastRequest;
  });

  console.log(`\n📊 Test Summary: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests.`);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

testAll();
