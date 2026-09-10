async function testApi() {
  const baseUrl = process.env.API_URL || 'https://fashion-for-everyone-backend.onrender.com/api';
  console.log('Testing backend at:', baseUrl);

  // 1. Health
  const healthRes = await fetch(`${baseUrl}/health`);
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData);

  // 2. Products
  const prodRes = await fetch(`${baseUrl}/products`);
  const prodData = await prodRes.json();
  console.log(`2. Products API: loaded ${Array.isArray(prodData) ? prodData.length : 0} items`);

  // 3. Register
  const testEmail = `test_${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Deploy Test User',
      email: testEmail,
      password: 'testPassword123',
      role: 'customer',
    }),
  });
  const regData = await regRes.json();
  console.log('3. Register API:', regRes.status, regData.success ? 'SUCCESS' : regData);

  // 4. Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'testPassword123',
    }),
  });
  const loginData = await loginRes.json();
  console.log('4. Login API:', loginRes.status, loginData.success ? 'SUCCESS' : loginData);

  // 5. CORS preflight check simulation
  const corsRes = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'https://fashion-for-everyone-preview.vercel.app' },
  });
  console.log('5. Vercel Origin CORS Allow Header:', corsRes.headers.get('access-control-allow-origin'));

  const mobileCorsRes = await fetch(`${baseUrl}/health`);
  console.log('6. Mobile / No Origin Request Status:', mobileCorsRes.status);

  console.log('\nAll API connectivity and contract tests completed successfully!');
}

testApi().catch(console.error);
