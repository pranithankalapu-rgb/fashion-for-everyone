import app from './index';
import { prisma } from './db';
import http from 'http';

async function runComprehensiveE2E() {
  console.log('====================================================');
  console.log('🚀 RUNNING ADMIN ORDERS MANAGEMENT COMPREHENSIVE E2E');
  console.log('====================================================\n');

  const testPort = 5088;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(testPort, '127.0.0.1', () => {
      console.log(`📡 Test server running on http://127.0.0.1:${testPort}\n`);
      resolve();
    });
  });

  const BASE_URL = `http://127.0.0.1:${testPort}/api`;

  try {
    // -------------------------------------------------------------
    // STEP 1: Security & Unauthorized Tests
    // -------------------------------------------------------------
    console.log('🔒 Step 1: Testing Security & Authorization Boundaries...');

    const unauthGet = await fetch(`${BASE_URL}/admin/orders`);
    console.log('   - Anonymous GET /api/admin/orders status:', unauthGet.status, '(Expected: 401)');
    if (unauthGet.status !== 401) throw new Error(`Expected 401, got ${unauthGet.status}`);

    const unauthPatch = await fetch(`${BASE_URL}/admin/orders/ord_1028/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Delivered' }),
    });
    console.log('   - Anonymous PATCH /api/admin/orders/:id/status status:', unauthPatch.status, '(Expected: 401)');
    if (unauthPatch.status !== 401) throw new Error(`Expected 401, got ${unauthPatch.status}`);

    // -------------------------------------------------------------
    // STEP 2: Customer Checkout Flow (Create a new order)
    // -------------------------------------------------------------
    console.log('\n🛒 Step 2: Placing Customer Order via Checkout Flow...');

    const testCheckoutData = {
      customerName: 'Eleanor Vance',
      customerEmail: 'eleanor.vance@fashionluxury.com',
      customerPhone: '+1 (206) 555-8899',
      shippingAddress: '88 Fashion Avenue, Penthouse 12, Seattle, WA 98101',
      paymentMethod: 'Apple Pay',
      items: [
        {
          productId: 'prod_101',
          title: 'Double-Breasted Italian Wool Trench Coat',
          brand: 'Aria Vance Studio',
          imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
          price: 340,
          quantity: 2,
          size: 'L',
          color: 'Midnight Navy',
          sku: 'AVS-TR-101',
        },
      ],
    };

    const checkoutRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'customer',
      },
      body: JSON.stringify(testCheckoutData),
    });

    if (!checkoutRes.ok) {
      const err = await checkoutRes.json();
      throw new Error(`Customer checkout failed: ${JSON.stringify(err)}`);
    }

    const checkoutResult = await checkoutRes.json();
    const createdOrder = checkoutResult.order;
    console.log(`   - Order created successfully! Order #: ${createdOrder.orderNumber}, ID: ${createdOrder.id}`);
    console.log(`   - Total Amount: $${createdOrder.totalAmount}, Status: ${createdOrder.status}`);

    // -------------------------------------------------------------
    // STEP 3: Admin Authentication & Login
    // -------------------------------------------------------------
    console.log('\n🔑 Step 3: Admin Staff Login & Token Generation...');

    const loginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fashionforeveryone.com',
        password: 'adminpassword123',
      }),
    });

    if (!loginRes.ok) throw new Error('Admin login failed');
    const loginData = await loginRes.json();
    const adminToken = loginData.token;
    console.log('   - Admin authenticated successfully! Token acquired.');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // -------------------------------------------------------------
    // STEP 4: Admin Fetch Orders & Verify New Order Appears
    // -------------------------------------------------------------
    console.log('\n📋 Step 4: Admin Querying All Orders from PostgreSQL...');

    const adminOrdersRes = await fetch(`${BASE_URL}/admin/orders`, { headers: authHeaders });
    if (!adminOrdersRes.ok) throw new Error('Admin fetch orders failed');
    const adminOrdersData = await adminOrdersRes.json();

    console.log(`   - Retrieved ${adminOrdersData.orders.length} orders from PostgreSQL.`);
    console.log('   - Live Stats:', adminOrdersData.stats);

    const foundCreatedOrder = adminOrdersData.orders.find((o: any) => o.id === createdOrder.id);
    if (!foundCreatedOrder) throw new Error(`Created order ${createdOrder.orderNumber} not found in admin list!`);
    console.log(`   - Verified order ${createdOrder.orderNumber} is present in admin list with ${foundCreatedOrder.items.length} item(s).`);

    // -------------------------------------------------------------
    // STEP 5: Search & Filter Tests
    // -------------------------------------------------------------
    console.log('\n🔍 Step 5: Testing Search & Filtering on PostgreSQL...');

    // Search by Order Number
    const searchOrderRes = await fetch(`${BASE_URL}/admin/orders?search=${createdOrder.orderNumber}`, {
      headers: authHeaders,
    });
    const searchOrderData = await searchOrderRes.json();
    console.log(`   - Search by '${createdOrder.orderNumber}': Found ${searchOrderData.orders.length} order(s).`);
    if (searchOrderData.orders.length !== 1 || searchOrderData.orders[0].id !== createdOrder.id) {
      throw new Error('Search by orderNumber failed');
    }

    // Search by Customer Email
    const searchEmailRes = await fetch(`${BASE_URL}/admin/orders?search=eleanor.vance`, {
      headers: authHeaders,
    });
    const searchEmailData = await searchEmailRes.json();
    console.log(`   - Search by customer email 'eleanor.vance': Found ${searchEmailData.orders.length} order(s).`);
    if (searchEmailData.orders.length < 1) throw new Error('Search by email failed');

    // Filter by Status = 'Pending'
    const filterPendingRes = await fetch(`${BASE_URL}/admin/orders?status=Pending`, {
      headers: authHeaders,
    });
    const filterPendingData = await filterPendingRes.json();
    console.log(`   - Filter by status 'Pending': Found ${filterPendingData.orders.length} order(s).`);

    // -------------------------------------------------------------
    // STEP 6: Inspect Order Details by ID
    // -------------------------------------------------------------
    console.log(`\n🔎 Step 6: Admin Inspecting Order Details (${createdOrder.id})...`);

    const orderDetailRes = await fetch(`${BASE_URL}/admin/orders/${createdOrder.id}`, {
      headers: authHeaders,
    });
    if (!orderDetailRes.ok) throw new Error('Fetch order detail failed');
    const orderDetail = await orderDetailRes.json();

    console.log(`   - Order #${orderDetail.orderNumber}`);
    console.log(`   - Customer: ${orderDetail.customerName} (${orderDetail.customerEmail})`);
    console.log(`   - Shipping Address: ${orderDetail.shippingAddress}`);
    console.log(`   - Items (${orderDetail.items.length}):`, orderDetail.items.map((i: any) => `${i.title} (Qty: ${i.quantity}, Size: ${i.size})`));

    // -------------------------------------------------------------
    // STEP 7: Status Updates (Lifecycle Flow)
    // -------------------------------------------------------------
    console.log('\n🔄 Step 7: Testing Order Status Progression Flow...');

    // 7a. Pending -> Processing
    console.log('   - Transition 1: Pending -> Processing');
    const update1Res = await fetch(`${BASE_URL}/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Processing' }),
    });
    if (!update1Res.ok) throw new Error('Status update to Processing failed');
    const update1Data = await update1Res.json();
    console.log(`     Status is now: ${update1Data.order.status}`);

    // 7b. Processing -> Shipped (with Tracking Number)
    console.log('   - Transition 2: Processing -> Shipped (Assigning tracking TRK-E2E-99481)');
    const update2Res = await fetch(`${BASE_URL}/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Shipped', trackingNumber: 'TRK-E2E-99481' }),
    });
    if (!update2Res.ok) throw new Error('Status update to Shipped failed');
    const update2Data = await update2Res.json();
    console.log(`     Status: ${update2Data.order.status}, Tracking Number: ${update2Data.order.trackingNumber}`);

    // 7c. Shipped -> Delivered
    console.log('   - Transition 3: Shipped -> Delivered');
    const update3Res = await fetch(`${BASE_URL}/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Delivered' }),
    });
    if (!update3Res.ok) throw new Error('Status update to Delivered failed');
    const update3Data = await update3Res.json();
    console.log(`     Status: ${update3Data.order.status}, Delivery Date: ${update3Data.order.deliveryDate}`);

    // 7d. Validation test: Invalid status rejected
    console.log('   - Validation: Attempting invalid status update (FooBarStatus)');
    const invalidStatusRes = await fetch(`${BASE_URL}/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'FooBarStatus' }),
    });
    console.log(`     Response Status: ${invalidStatusRes.status} (Expected: 400 Bad Request)`);
    if (invalidStatusRes.status !== 400) throw new Error('Invalid status was not rejected!');

    // -------------------------------------------------------------
    // STEP 8: Direct PostgreSQL Verification via Prisma
    // -------------------------------------------------------------
    console.log('\n🗄️ Step 8: Verifying PostgreSQL Record Directly via Prisma Client...');

    const dbRecord = await prisma.customerOrder.findUnique({
      where: { id: createdOrder.id },
      include: { items: true },
    });

    if (!dbRecord) throw new Error('Order record missing in PostgreSQL database!');
    console.log(`   - PostgreSQL ID: ${dbRecord.id}`);
    console.log(`   - PostgreSQL Status: ${dbRecord.status} (Verified matching 'Delivered')`);
    console.log(`   - PostgreSQL Tracking #: ${dbRecord.trackingNumber} (Verified matching 'TRK-E2E-99481')`);
    console.log(`   - PostgreSQL Delivery Date: ${dbRecord.deliveryDate}`);
    console.log(`   - PostgreSQL Items Count: ${dbRecord.items.length}`);

    if (dbRecord.status !== 'Delivered' || dbRecord.trackingNumber !== 'TRK-E2E-99481') {
      throw new Error('Database record values do not match expected updated values!');
    }

    // -------------------------------------------------------------
    // STEP 9: Clean Up (Delete Test Order)
    // -------------------------------------------------------------
    console.log('\n🧹 Step 9: Cleaning up test order from PostgreSQL...');

    const deleteRes = await fetch(`${BASE_URL}/admin/orders/${createdOrder.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!deleteRes.ok) throw new Error('Failed to delete test order');
    const deleteData = await deleteRes.json();
    console.log(`   - Deleted order: ${deleteData.message}`);

    const verifyDeleted = await prisma.customerOrder.findUnique({
      where: { id: createdOrder.id },
    });
    if (verifyDeleted !== null) throw new Error('Order still exists in database after deletion!');
    console.log('   - Confirmed order completely removed from PostgreSQL.');

    console.log('\n====================================================');
    console.log('✅ ALL ADMIN ORDERS MANAGEMENT E2E TESTS PASSED 100%!');
    console.log('====================================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runComprehensiveE2E().catch((err) => {
  console.error('\n❌ Comprehensive E2E Test failed:', err);
  process.exit(1);
});
