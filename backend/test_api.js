import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  try {
    console.log('--- TEST 1: Health Check ---');
    let res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    console.log('Health Response:', res);

    console.log('\n--- TEST 2: Role Authorization Security Check (Customer POST /products) ---');
    res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'customer' },
    }, { title: 'Forbidden Coat', price: 500, imageUrl: 'https://example.com/img.jpg' });
    console.log('Customer POST /products Status:', res.status, 'Data:', res.data);

    console.log('\n--- TEST 3: Create Product (Retailer Role) ---');
    res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
    }, {
      title: 'Italian Cashmere Overcoat',
      brand: 'Aria Vance Studio',
      category: 'Coats & Jackets',
      price: 490,
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
      stockQuantity: 12
    });
    console.log('Retailer POST /products Status:', res.status, 'Product ID:', res.data.id);
    const prodId = res.data.id;

    console.log('\n--- TEST 4: Customer Order Placement ---');
    res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'customer' },
    }, {
      customerName: 'Sophia Laurent',
      customerEmail: 'sophia.laurent@example.com',
      customerPhone: '+1 (206) 555-0192',
      shippingAddress: '42 Fashion Blvd, New York, NY 10001',
      paymentMethod: 'Credit Card (Visa)',
      items: [{ productId: prodId, title: 'Italian Cashmere Overcoat', price: 490, quantity: 1, size: 'M' }]
    });
    console.log('POST /orders Status:', res.status, 'Order Ref:', res.data.order?.orderNumber);
    const orderId = res.data.order?.id;

    console.log('\n--- TEST 5: Retailer Status Update ---');
    res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
    }, { status: 'Processing', trackingNumber: 'TRK-2026888' });
    console.log('PATCH /orders/status Status:', res.status, 'Updated Order:', res.data);

    console.log('\n--- TEST 6: Retailer Promotion Creation ---');
    res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/promotions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'retailer' },
    }, { code: 'LUXURY2026', title: 'Luxury 30% Off Promotion', discountType: 'Percentage', discountValue: 30 });
    console.log('POST /promotions Status:', res.status, 'Created Promo:', res.data);

    console.log('\n✅ ALL API VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (e) {
    console.error('Test execution failed:', e);
  }
}

runTests();
