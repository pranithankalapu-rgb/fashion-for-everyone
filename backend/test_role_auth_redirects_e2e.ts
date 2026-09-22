// Enforce test environment flags
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'fashion-for-everyone-super-secret-key-2026';
process.env.REFRESH_SECRET = 'fashion-refresh-jwt-super-secret-key-2026';

import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { prisma } from './db';
import apiRouter from './routes/api';
import { authService } from './services/authService';

const TEST_PORT = 5088;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runRoleAuthRedirectTests() {
  console.log('🧪 Starting Role-Specific Authentication, RBAC & Multi-User Isolation Test Suite...\n');

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', apiRouter);

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => {
    testServer.listen(TEST_PORT, '127.0.0.1', () => resolve());
  });

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
      console.log(`  ❌ ERROR: ${name} - ${err.message}`, err.cause || '');
      failed++;
    }
  }

  try {
    // 1. Clean up test users and entities from previous runs
    const testEmails = [
      'cust.role.test@example.com',
      'des.role.test@example.com',
      'des2.role.test@example.com',
      'ret.role.test@example.com',
      'admin.fake.test@example.com',
      'invalid.role.test@example.com',
    ];

    await prisma.customerOrder.deleteMany({
      where: {
        customerEmail: { in: testEmails },
      },
    }).catch(() => {});

    await prisma.design.deleteMany({
      where: {
        designerName: { in: ['Designer One Test', 'Designer Two Test'] },
      },
    }).catch(() => {});

    await prisma.designer.deleteMany({
      where: {
        email: { in: testEmails },
      },
    }).catch(() => {});

    await prisma.userProfile.deleteMany({
      where: {
        email: { in: testEmails },
      },
    }).catch(() => {});

    let customerTokens: { accessToken: string; refreshToken: string; user: any };
    let designerTokens: { accessToken: string; refreshToken: string; user: any };
    let designer2Tokens: { accessToken: string; refreshToken: string; user: any };
    let retailerTokens: { accessToken: string; refreshToken: string; user: any };
    let createdDesignId = '';
    let createdOrderId = '';

    // Test 1: Customer Registration
    await assertTest('1. Customer Registration saves role "customer" and returns customer JWT', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Customer Test',
          email: 'cust.role.test@example.com',
          password: 'Password123!',
          role: 'customer',
        }),
      });
      assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.user.role, 'customer', 'Body user role should be customer');
      assert.ok(body.accessToken, 'Access token must be returned');

      const decoded: any = jwt.decode(body.accessToken);
      assert.strictEqual(decoded.role, 'customer', 'JWT role should be customer');

      const dbUser = await prisma.userProfile.findUnique({
        where: { id: body.user.id },
      });
      assert.strictEqual(dbUser?.role, 'customer', 'Database record role must be customer');

      customerTokens = body;
      return true;
    });

    // Test 2: Designer Registration
    await assertTest('2. Designer Registration saves role "designer" and creates linked Designer record', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Designer One Test',
          email: 'des.role.test@example.com',
          password: 'Password123!',
          role: 'designer',
        }),
      });
      assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.user.role, 'designer', 'Body user role should be designer');

      const decoded: any = jwt.decode(body.accessToken);
      assert.strictEqual(decoded.role, 'designer', 'JWT role should be designer');

      const dbUser = await prisma.userProfile.findUnique({
        where: { id: body.user.id },
      });
      assert.strictEqual(dbUser?.role, 'designer', 'Database record role must be designer');

      const dbDesigner = await prisma.designer.findFirst({
        where: { email: 'des.role.test@example.com' },
      });
      assert.ok(dbDesigner, 'A Designer entity must be created in Designer table');
      assert.strictEqual(dbDesigner.name, 'Designer One Test');

      designerTokens = body;

      // Also register a second designer for ownership testing
      const res2 = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Designer Two Test',
          email: 'des2.role.test@example.com',
          password: 'Password123!',
          role: 'designer',
        }),
      });
      designer2Tokens = await res2.json();

      return true;
    });

    // Test 3: Retailer Registration
    await assertTest('3. Retailer Registration saves role "retailer" and returns retailer JWT', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Retailer Test',
          email: 'ret.role.test@example.com',
          password: 'Password123!',
          role: 'retailer',
        }),
      });
      assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.user.role, 'retailer', 'Body user role should be retailer');

      const decoded: any = jwt.decode(body.accessToken);
      assert.strictEqual(decoded.role, 'retailer', 'JWT role should be retailer');

      const dbUser = await prisma.userProfile.findUnique({
        where: { id: body.user.id },
      });
      assert.strictEqual(dbUser?.role, 'retailer', 'Database record role must be retailer');

      retailerTokens = body;
      return true;
    });

    // Test 4: Reject Admin Registration during normal signup
    await assertTest('4. Admin registration attempt is strictly rejected with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Fake Admin',
          email: 'admin.fake.test@example.com',
          password: 'Password123!',
          role: 'admin',
        }),
      });
      assert.strictEqual(res.status, 400, `Expected 400 Bad Request for admin signup, got ${res.status}`);
      const body = await res.json();
      assert.ok(body.error.includes('admin') || body.error.includes('not permitted'), 'Error must explain admin signup is forbidden');

      const dbCheck = await prisma.userProfile.findUnique({
        where: { email: 'admin.fake.test@example.com' },
      });
      assert.strictEqual(dbCheck, null, 'No user should be created in DB');
      return true;
    });

    // Test 5: Reject Invalid/Arbitrary Roles during signup
    await assertTest('5. Invalid registration role is rejected with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid Role',
          email: 'invalid.role.test@example.com',
          password: 'Password123!',
          role: 'super_hacker_role',
        }),
      });
      assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
      return true;
    });

    // Test 6: Authoritative Role Verification on Login
    await assertTest('6. Login returns authoritative DB role for Customer, Designer, Retailer, and Admin', async () => {
      // Customer Login
      const cRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cust.role.test@example.com', password: 'Password123!' }),
      });
      const cBody = await cRes.json();
      assert.strictEqual(cBody.user.role, 'customer', 'Customer login should return role: customer');

      // Designer Login
      const dRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'des.role.test@example.com', password: 'Password123!' }),
      });
      const dBody = await dRes.json();
      assert.strictEqual(dBody.user.role, 'designer', 'Designer login should return role: designer');

      // Retailer Login
      const rRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ret.role.test@example.com', password: 'Password123!' }),
      });
      const rBody = await rRes.json();
      assert.strictEqual(rBody.user.role, 'retailer', 'Retailer login should return role: retailer');

      // Admin Login
      const aRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@fashionforeveryone.com', password: 'adminpassword123' }),
      });
      const aBody = await aRes.json();
      assert.strictEqual(aBody.user.role, 'admin', 'Admin login should return role: admin');

      return true;
    });

    // Test 7: RBAC Protection on Retailer Endpoints
    await assertTest('7. Customer and Designer are blocked (403) from Retailer-only routes; Retailer succeeds', async () => {
      // Customer trying to create product
      const cRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerTokens.accessToken}`,
        },
        body: JSON.stringify({
          title: 'Hacked Product by Customer',
          price: 199,
        }),
      });
      assert.strictEqual(cRes.status, 403, `Customer should receive 403, got ${cRes.status}`);

      // Designer trying to access retailer CRM
      const dRes = await fetch(`${BASE_URL}/retailer/customers`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${designerTokens.accessToken}`,
        },
      });
      assert.strictEqual(dRes.status, 403, `Designer should receive 403 on retailer crm, got ${dRes.status}`);

      // Unauthenticated trying to access store settings
      const unauthRes = await fetch(`${BASE_URL}/store-settings`, {
        method: 'GET',
      });
      assert.strictEqual(unauthRes.status, 401, `Unauthenticated should receive 401, got ${unauthRes.status}`);

      // Retailer successfully creates product
      const rRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${retailerTokens.accessToken}`,
        },
        body: JSON.stringify({
          title: 'Official Retailer Silk Jacket',
          brand: 'Retailer Luxury',
          category: 'Jackets',
          price: 450,
          stockQuantity: 15,
        }),
      });
      assert.strictEqual(rRes.status, 201, `Retailer should create product (201), got ${rRes.status}`);
      const prodBody = await rRes.json();
      assert.strictEqual(prodBody.title, 'Official Retailer Silk Jacket');

      // Clean up product
      await prisma.retailProduct.delete({ where: { id: prodBody.id } }).catch(() => {});

      return true;
    });

    // Test 8: Designer Studio & Resource Ownership
    await assertTest('8. Designer can create design; other designers cannot delete it (ownership check)', async () => {
      // Designer 1 creates design
      const res = await fetch(`${BASE_URL}/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${designerTokens.accessToken}`,
        },
        body: JSON.stringify({
          title: 'Autumn Velvet Ensemble',
          collection: 'Autumn 2026',
          imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
          price: 320,
        }),
      });
      assert.strictEqual(res.status, 201, `Designer 1 should create design (201), got ${res.status}`);
      const design = await res.json();
      createdDesignId = design.id;

      // Customer trying to create design
      const cRes = await fetch(`${BASE_URL}/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerTokens.accessToken}`,
        },
        body: JSON.stringify({
          title: 'Customer Fake Design',
          imageUrl: 'https://example.com/fake.jpg',
        }),
      });
      assert.strictEqual(cRes.status, 403, `Customer should receive 403 when creating design, got ${cRes.status}`);

      // Designer 2 trying to delete Designer 1's design
      const d2Res = await fetch(`${BASE_URL}/designs/${createdDesignId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${designer2Tokens.accessToken}`,
        },
      });
      assert.strictEqual(d2Res.status, 403, `Designer 2 should receive 403 when deleting Designer 1 design, got ${d2Res.status}`);

      // Designer 1 deletes their own design
      const d1Res = await fetch(`${BASE_URL}/designs/${createdDesignId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${designerTokens.accessToken}`,
        },
      });
      assert.strictEqual(d1Res.status, 200, `Designer 1 should delete their own design (200), got ${d1Res.status}`);

      return true;
    });

    // Test 9: Customer Order Ownership & Privacy Isolation
    await assertTest('9. Customer Order Privacy: Customer only sees their own orders, cannot view/delete others', async () => {
      // 1. Retailer creates real product in DB
      const prodRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${retailerTokens.accessToken}`,
        },
        body: JSON.stringify({
          title: 'Exclusive Cashmere Coat',
          brand: 'Luxury Brand',
          price: 250,
          stockQuantity: 10,
        }),
      });
      const prod = await prodRes.json();

      // 2. Customer creates order with the product ID
      const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerTokens.accessToken}`,
        },
        body: JSON.stringify({
          customerName: 'Customer Test',
          customerEmail: 'cust.role.test@example.com',
          shippingAddress: '123 Fashion Ave, Suite 400',
          paymentMethod: 'Credit Card',
          items: [
            {
              productId: prod.id,
              title: 'Exclusive Cashmere Coat',
              price: 250,
              quantity: 1,
              size: 'M',
              imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
            },
          ],
        }),
      });
      assert.strictEqual(orderRes.status, 201, `Order creation should succeed (201), got ${orderRes.status}`);
      const orderBody = await orderRes.json();
      createdOrderId = orderBody.order.id;

      // Customer gets their own orders
      const myOrdersRes = await fetch(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${customerTokens.accessToken}` },
      });
      assert.strictEqual(myOrdersRes.status, 200);
      const myOrders = await myOrdersRes.json();
      console.log('      [DEBUG Test 9] myOrders received:', myOrders);
      assert.ok(myOrders.length >= 1);
      assert.ok(myOrders.every((o: any) => o.customerEmail.toLowerCase() === 'cust.role.test@example.com'));

      // Designer 1 trying to view Customer's order by ID
      const dViewRes = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${designerTokens.accessToken}` },
      });
      assert.strictEqual(dViewRes.status, 403, `Designer viewing customer order must get 403, got ${dViewRes.status}`);

      // Designer 1 trying to delete Customer's order
      const dDelRes = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${designerTokens.accessToken}` },
      });
      assert.strictEqual(dDelRes.status, 403, `Designer deleting customer order must get 403, got ${dDelRes.status}`);

      // Retailer can view order
      const rViewRes = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${retailerTokens.accessToken}` },
      });
      assert.strictEqual(rViewRes.status, 200, `Retailer can view orders, got ${rViewRes.status}`);

      // Clean up order
      await prisma.customerOrder.delete({ where: { id: createdOrderId } }).catch(() => {});

      return true;
    });

    // Test 10: Multi-User Isolation & Session Logout (User A -> Logout -> User B)
    await assertTest('10. Multi-User Isolation: User A Logout revokes session; User B login is fully isolated', async () => {
      // User A (Customer) checks profile
      const profARes = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${customerTokens.accessToken}` },
      });
      assert.strictEqual(profARes.status, 200);
      const profA = await profARes.json();
      assert.strictEqual(profA.email, 'cust.role.test@example.com');

      // Logout User A
      const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: customerTokens.refreshToken }),
      });
      assert.strictEqual(logoutRes.status, 200);

      // Attempting to refresh User A's revoked token fails with 401
      const refreshFailRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: customerTokens.refreshToken }),
      });
      assert.strictEqual(refreshFailRes.status, 401, 'Revoked refresh token must return 401 Unauthorized');

      // User B (Retailer) logs in
      const loginBRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ret.role.test@example.com', password: 'Password123!' }),
      });
      assert.strictEqual(loginBRes.status, 200);
      const loginB = await loginBRes.json();
      assert.strictEqual(loginB.user.email, 'ret.role.test@example.com');
      assert.strictEqual(loginB.user.role, 'retailer');

      // User B fetches /profile -> returns User B data with no trace of User A
      const profBRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${loginB.accessToken}` },
      });
      assert.strictEqual(profBRes.status, 200);
      const profB = await profBRes.json();
      assert.strictEqual(profB.email, 'ret.role.test@example.com');
      assert.strictEqual(profB.role, 'retailer');
      assert.notStrictEqual(profB.id, profA.id);

      return true;
    });

  } finally {
    testServer.close();
  }

  console.log('\n========================================');
  console.log(`Role Auth & RBAC Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRoleAuthRedirectTests().catch((err) => {
  console.error('Fatal error running role auth tests:', err);
  process.exit(1);
});
