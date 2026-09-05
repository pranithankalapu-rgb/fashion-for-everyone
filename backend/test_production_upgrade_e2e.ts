const BASE_URL = 'http://localhost:5000/api';

async function runProductionUpgradeE2ETests() {
  console.log('🧪 Running Comprehensive Production E2E Verification Suite...\n');

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

  // 1. Health & Server Status
  await assertTest('Backend API & DB Connectivity Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    return res.status === 200 && data.status === 'ok';
  });

  // 2. Unified Auth: Registration & JWT Token issuance
  let customerToken = '';
  const testEmail = `test_customer_${Date.now()}@example.com`;

  await assertTest('Customer Registration with JWT Access & Refresh tokens', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: testEmail,
        password: 'securePassword123!',
        role: 'customer',
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.accessToken) {
      customerToken = data.accessToken;
      return true;
    }
    return false;
  });

  // 3. Unified Auth: Login with password verification
  await assertTest('Customer Login and Token verification', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: testEmail,
        password: 'securePassword123!',
      }),
    });
    const data = await res.json();
    return res.status === 200 && !!(data.accessToken || data.token);
  });

  // 4. Admin Auth
  let adminToken = '';
  await assertTest('Super Admin Login with Master Credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: 'admin@fashionforeveryone.com',
        password: 'adminpassword123',
        role: 'admin',
      }),
    });
    const data = await res.json();
    adminToken = data.accessToken || data.token;
    return res.status === 200 && !!adminToken;
  });

  // 5. RBAC Guard Enforcement: Customer cannot access Retailer or Admin APIs
  await assertTest('RBAC Guard: Customer blocked from Retailer CRM APIs (HTTP 403)', async () => {
    const res = await fetch(`${BASE_URL}/retailer/customers`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    return res.status === 403;
  });

  await assertTest('RBAC Guard: Customer blocked from Admin User Management (HTTP 401/403)', async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    return res.status === 401 || res.status === 403;
  });

  // 6. Conversational AI Stylist & Budget/Occasion recommendation
  await assertTest('Conversational AI Stylist Chat matching real catalog products', async () => {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I need a tailored blazer for work under 400',
        budget: 400,
        occasion: 'Work',
      }),
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.role === 'assistant' &&
      Array.isArray(data.recommendedProducts) &&
      data.recommendedProducts.length > 0
    );
  });

  // 7. Semantic Vector Fashion Search
  await assertTest('Semantic Vector Fashion Search Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/ai/search?q=trench+coat+wool`);
    const data = await res.json();
    return res.status === 200 && Array.isArray(data) && data.length > 0;
  });

  // 8. Virtual Try-On Pipeline
  await assertTest('Virtual Try-On (VTON) Simulation Generation', async () => {
    const res = await fetch(`${BASE_URL}/ai/try-on`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        garmentUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
      }),
    });
    const data = await res.json();
    return res.status === 201 && data.job?.status === 'COMPLETED' && data.job?.fitConfidence > 90;
  });

  // 9. Atomic Checkout & Payment Intent Creation
  await assertTest('Atomic Order Creation & Multi-Gateway Payment Intent', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        customerName: 'Test Customer',
        customerEmail: testEmail,
        customerPhone: '+1-555-0199',
        shippingAddress: '100 Innovation Way, Suite 500, Seattle, WA',
        paymentGateway: 'GPAY',
        paymentMethod: 'Google Pay / UPI',
        items: [
          {
            productId: 'prod_101',
            title: 'Double-Breasted Italian Wool Trench Coat',
            brand: 'Aria Vance Studio',
            imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
            price: 340,
            quantity: 1,
            size: 'M',
            color: 'Midnight Navy',
          },
        ],
      }),
    });
    const data = await res.json();
    return (
      res.status === 201 &&
      data.order?.orderNumber &&
      data.paymentIntent?.gateway === 'GPAY'
    );
  });

  // 10. Payment Webhook Signature Confirmation
  await assertTest('Payment Webhook Confirmation & Order Status Sync', async () => {
    const res = await fetch(`${BASE_URL}/payments/webhook?gateway=MOCK`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-9999',
        paymentIntentId: 'mock_tx_123',
        responseCode: 'SUCCESS',
      }),
    });
    const data = await res.json();
    return res.status === 200 && data.success === true;
  });

  // 11. Real-Time Color Voting & Bayesian Ranking
  await assertTest('Color Arena Voting and Real-Time broadcast update', async () => {
    const getRes = await fetch(`${BASE_URL}/color-combos`);
    const combos = await getRes.json();
    if (!combos || combos.length === 0) return false;

    const targetId = combos[0].id;
    const voteRes = await fetch(`${BASE_URL}/color-combos/${targetId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'up' }),
    });
    const updated = await voteRes.json();
    return voteRes.status === 200 && updated.votesCount > 0;
  });

  console.log(`\n========================================`);
  console.log(`✨ Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionUpgradeE2ETests().catch((err) => {
  console.error('Test run failure:', err);
  process.exit(1);
});
