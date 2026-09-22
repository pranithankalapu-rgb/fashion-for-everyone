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

const TEST_PORT = 5059;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

async function runAuthProfilePersistenceTests() {
  console.log('🧪 Starting Persistent Authentication & Profile Isolation E2E Test Suite...\n');

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
      console.log(`  ❌ ERROR: ${name} - ${err.message}`);
      failed++;
    }
  }

  try {
    // Clean up test users from any previous runs
    await prisma.userProfile.deleteMany({
      where: {
        email: { in: ['alice.persistent@example.com', 'bob.isolated@example.com'] },
      },
    }).catch(() => {});

    let userATokens: { accessToken: string; refreshToken: string };
    let userAId: string;
    let userBTokens: { accessToken: string; refreshToken: string };
    let userBId: string;

    // --- TEST 1: User A Registration & Login ---
    await assertTest('1. User A Registration and Clean Token Generation', async () => {
      const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice Authenticated',
          email: 'alice.persistent@example.com',
          password: 'Password123!',
          role: 'customer',
        }),
      });
      const regData = await regRes.json();
      assert.strictEqual(regRes.status, 201, `Expected 201 Created, got ${regRes.status}`);
      assert.ok(regData.accessToken, 'Access token should be returned');
      assert.ok(regData.refreshToken, 'Refresh token should be returned');
      assert.strictEqual(regData.user.name, 'Alice Authenticated');
      userAId = regData.user.id;
      userATokens = { accessToken: regData.accessToken, refreshToken: regData.refreshToken };
      return true;
    });

    // --- TEST 2: GET /api/profile returns User A profile ---
    await assertTest('2. GET /api/profile returns User A profile with valid access token', async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${userATokens.accessToken}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      assert.strictEqual(data.id, userAId, 'Profile ID must match User A');
      assert.strictEqual(data.email, 'alice.persistent@example.com', 'Email must match User A');
      assert.strictEqual(data.name, 'Alice Authenticated', 'Name must match User A');
      return true;
    });

    // --- TEST 3: Expired access token strictly rejected (NO user_01 / fallback leak) ---
    await assertTest('3. Expired Access Token receives 401 Unauthorized (NO user_01 fallback)', async () => {
      // Create an expired access token (expired 2 hours ago)
      const expiredToken = jwt.sign(
        { userId: userAId, email: 'alice.persistent@example.com', role: 'customer', name: 'Alice Authenticated' },
        JWT_SECRET!,
        { expiresIn: '-2h' }
      );

      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 401, `Expected 401 Unauthorized for expired token, got ${res.status}`);
      assert.strictEqual(data.error, 'Unauthorized', 'Should have Unauthorized error');
      assert.ok(!data.name || data.name !== 'Sophia Laurent', 'Must NEVER fall back to Sophia Laurent');
      assert.ok(!data.id || data.id !== 'user_01', 'Must NEVER fall back to user_01');
      return true;
    });

    // --- TEST 4: Token Refresh Flow with Rolling Token Rotation ---
    let rotatedRefreshToken: string;
    let newAccessToken: string;
    await assertTest('4. POST /api/auth/refresh yields new access token + rotated refresh token', async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: userATokens.refreshToken }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200, `Expected 200 OK on refresh, got ${res.status}`);
      assert.ok(data.accessToken, 'Must return fresh access token');
      assert.ok(data.refreshToken, 'Must return rotated refresh token');
      assert.strictEqual(data.user.id, userAId, 'User payload must be User A');
      assert.strictEqual(data.user.name, 'Alice Authenticated', 'Name must be Alice');

      newAccessToken = data.accessToken;
      rotatedRefreshToken = data.refreshToken;
      return true;
    });

    // --- TEST 5: Using New Access Token from Refresh ---
    await assertTest('5. New Access Token successfully accesses User A profile', async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      assert.strictEqual(data.id, userAId, 'Profile ID must match User A');
      assert.strictEqual(data.name, 'Alice Authenticated');
      return true;
    });

    // --- TEST 6: Multi-Cycle Rolling Refresh (Simulating Continuous Persistent Login) ---
    let secondRotatedRefreshToken: string;
    let secondNewAccessToken: string;
    await assertTest('6. Multi-Cycle Rolling Refresh extends session indefinitely (No 7-day cliff)', async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rotatedRefreshToken }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200, `Expected 200 OK on 2nd cycle refresh, got ${res.status}`);
      assert.ok(data.accessToken);
      assert.ok(data.refreshToken);
      assert.strictEqual(data.user.id, userAId);

      secondNewAccessToken = data.accessToken;
      secondRotatedRefreshToken = data.refreshToken;

      // Verify access to profile with the 2nd cycle token
      const profileRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${secondNewAccessToken}` },
      });
      const profileData = await profileRes.json();
      assert.strictEqual(profileRes.status, 200);
      assert.strictEqual(profileData.id, userAId);
      return true;
    });

    // --- TEST 7: Logout of User A and Server-Side Session Revocation ---
    await assertTest('7. User A Logout revokes refresh token on server', async () => {
      const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondNewAccessToken}`,
        },
        body: JSON.stringify({ refreshToken: secondRotatedRefreshToken }),
      });
      assert.strictEqual(logoutRes.status, 200);

      // Attempting to refresh with the revoked token should now fail
      const refreshAttemptRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: secondRotatedRefreshToken }),
      });
      assert.strictEqual(refreshAttemptRes.status, 401, 'Revoked refresh token must return 401');
      return true;
    });

    // --- TEST 8: User B Login & Strict Profile Isolation ---
    await assertTest('8. User B Registration & Login isolates User B profile completely', async () => {
      const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bob Buyer',
          email: 'bob.isolated@example.com',
          password: 'Password456!',
          role: 'customer',
        }),
      });
      const regData = await regRes.json();
      assert.strictEqual(regRes.status, 201);
      userBId = regData.user.id;
      userBTokens = { accessToken: regData.accessToken, refreshToken: regData.refreshToken };

      // Verify User B profile
      const profileRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${userBTokens.accessToken}` },
      });
      const profileData = await profileRes.json();
      assert.strictEqual(profileRes.status, 200);
      assert.strictEqual(profileData.id, userBId);
      assert.strictEqual(profileData.name, 'Bob Buyer');
      assert.notStrictEqual(profileData.id, userAId, 'User B must not see User A ID');
      return true;
    });

    // --- TEST 9: Cross-User Modification Attack Blocked ---
    await assertTest('9. User B cannot update User A profile', async () => {
      const attackRes = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userBTokens.accessToken}`,
        },
        body: JSON.stringify({
          id: userAId,
          name: 'Hacked By User B',
        }),
      });
      // Should be 403 Forbidden because id !== req.userId
      assert.strictEqual(attackRes.status, 403, 'Cross-user profile update must be 403 Forbidden');

      // Verify User A profile in DB was not modified
      const userAInDb = await prisma.userProfile.findUnique({ where: { id: userAId } });
      assert.strictEqual(userAInDb?.name, 'Alice Authenticated', 'User A name must remain unchanged in DB');
      return true;
    });

    // --- TEST 10: Unauthenticated Request Rejection on Protected Endpoints ---
    await assertTest('10. Unauthenticated requests to /profile and /auth/me return 401 without leakage', async () => {
      const profileRes = await fetch(`${BASE_URL}/profile`);
      assert.strictEqual(profileRes.status, 401, 'Unauthenticated /profile must return 401');

      const meRes = await fetch(`${BASE_URL}/auth/me`);
      assert.strictEqual(meRes.status, 401, 'Unauthenticated /auth/me must return 401');

      const updateRes = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Anonymous Hacker' }),
      });
      assert.strictEqual(updateRes.status, 401, 'Unauthenticated PUT /profile must return 401');
      return true;
    });

    // Clean up created test users
    await prisma.userProfile.deleteMany({
      where: {
        id: { in: [userAId, userBId] },
      },
    }).catch(() => {});

  } finally {
    testServer.close();
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthProfilePersistenceTests().catch((err) => {
  console.error('Test suite runner failed:', err);
  process.exit(1);
});
