async function run() {
  const baseUrl = 'https://fashion-for-everyone-backend.onrender.com/api';
  console.log('Testing Production Render Backend at:', baseUrl);

  // 1. Health
  const healthRes = await fetch(baseUrl + '/health');
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData);

  // 2. Products
  const prodRes = await fetch(baseUrl + '/products');
  const prods = await prodRes.json();
  console.log('2. Products:', Array.isArray(prods) ? `${prods.length} products found` : prods);

  // 3. Register
  const testEmail = `prod_verify_${Date.now()}@fashionhub.com`;
  const regRes = await fetch(baseUrl + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Production Test User',
      email: testEmail,
      password: 'ProdTestPassword123!',
      role: 'customer'
    })
  });
  const regData = await regRes.json();
  console.log(`3. Register API (${regRes.status}):`, regData.success ? 'SUCCESS' : regData);

  // 4. Login
  const loginRes = await fetch(baseUrl + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'ProdTestPassword123!'
    })
  });
  const loginData = await loginRes.json();
  console.log(`4. Login API (${loginRes.status}):`, loginData.success ? 'SUCCESS - Token received' : loginData);

  // 5. CORS preflight check simulation
  const corsPreflightRes = await fetch(baseUrl + '/health', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://fashion-for-everyone.vercel.app',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });
  console.log('5. CORS Preflight Status:', corsPreflightRes.status);
  console.log('5. CORS Allow-Origin Header:', corsPreflightRes.headers.get('access-control-allow-origin'));
  console.log('5. CORS Allow-Methods:', corsPreflightRes.headers.get('access-control-allow-methods'));

  // 6. CORS actual request
  const corsActualRes = await fetch(baseUrl + '/health', {
    headers: { Origin: 'https://fashion-for-everyone.vercel.app' }
  });
  console.log('6. CORS Actual Allow-Origin:', corsActualRes.headers.get('access-control-allow-origin'));

  // 7. Mobile / No Origin Request
  const mobileRes = await fetch(baseUrl + '/health');
  console.log('7. Mobile (No Origin) Status:', mobileRes.status);
}

run().catch(console.error);
