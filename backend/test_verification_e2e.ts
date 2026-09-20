// Enforce test mode flags before importing application services
process.env.NODE_ENV = 'test';
process.env.ALLOW_TEST_OTP_SINK = 'true';

import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from './db';
import apiRouter from './routes/api';
import { getLatestTestVerificationCode } from './services/communicationService';
import { authService } from './services/authService';

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runVerificationTestSuite() {
  console.log('\n🧪 ========================================================');
  console.log('🧪 Starting Profile Email & Mobile OTP Verification Test Suite');
  console.log('🧪 ========================================================\n');

  // Start isolated test server with test sink enabled
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', apiRouter);

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => {
    testServer.listen(TEST_PORT, '127.0.0.1', () => resolve());
  });
  console.log(`📡 Isolated test server active on http://127.0.0.1:${TEST_PORT}\n`);

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

  // Setup: Ensure test users exist in PostgreSQL
  const testUserA = await prisma.userProfile.upsert({
    where: { id: 'test_user_a' },
    update: {
      email: 'user_a_original@fashionforeveryone.com',
      phone: '+1 555-111-0001',
    },
    create: {
      id: 'test_user_a',
      name: 'User A Test',
      email: 'user_a_original@fashionforeveryone.com',
      phone: '+1 555-111-0001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      skinTone: 'Warm Golden',
      undertone: 'Warm',
      hairColor: 'Brown',
      bodyShape: 'Hourglass',
      measurements: { heightCm: 170, chestCm: 88, waistCm: 68, hipsCm: 94 },
      role: 'customer',
      approvalStatus: 'Approved',
      status: 'Active',
    },
  });

  const testUserB = await prisma.userProfile.upsert({
    where: { id: 'test_user_b' },
    update: {
      email: 'user_b_original@fashionforeveryone.com',
      phone: '+1 555-222-0002',
    },
    create: {
      id: 'test_user_b',
      name: 'User B Test',
      email: 'user_b_original@fashionforeveryone.com',
      phone: '+1 555-222-0002',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      skinTone: 'Fair',
      undertone: 'Cool',
      hairColor: 'Black',
      bodyShape: 'Rectangle',
      measurements: { heightCm: 175, chestCm: 90, waistCm: 72, hipsCm: 95 },
      role: 'customer',
      approvalStatus: 'Approved',
      status: 'Active',
    },
  });

  const tokensA = authService.generateTokens({
    userId: testUserA.id,
    email: testUserA.email!,
    role: 'customer',
    name: testUserA.name,
  });

  const tokensB = authService.generateTokens({
    userId: testUserB.id,
    email: testUserB.email!,
    role: 'customer',
    name: testUserB.name,
  });

  // Clean any old verification codes for test users
  await prisma.verificationCode.deleteMany({
    where: { userId: { in: [testUserA.id, testUserB.id] } },
  });

  const targetNewEmail = 'usera.newverified@example.com';
  const targetNewPhone = '+1 555-999-8888';

  try {
    // --- Test 1: Unconfigured Provider Rejection Safety ---
    await assertTest('1. Unconfigured provider safely rejects request with 503 and required variables', async () => {
      // Temporarily disable test sink to test unconfigured provider behavior
      process.env.ALLOW_TEST_OTP_SINK = 'false';

      const res = await fetch(`${BASE_URL}/profile/email/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail }),
      });

      const data = await res.json();
      // Re-enable test sink for remaining tests
      process.env.ALLOW_TEST_OTP_SINK = 'true';

      return (
        res.status === 503 &&
        data.code === 'PROVIDER_NOT_CONFIGURED' &&
        data.error.includes('SMTP_HOST')
      );
    });

    // --- Test 2: Request Email Verification Code ---
    await assertTest('2. Request Email Verification generates OTP, dispatches, and returns resend cooldown', async () => {
      const res = await fetch(`${BASE_URL}/profile/email/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail }),
      });

      const data = await res.json();
      return (
        res.status === 200 &&
        data.success === true &&
        data.resendCooldown === 60 &&
        data.code === undefined // OTP strictly NOT in response
      );
    });

    // --- Test 3: Verify Cryptographic Hash in Database ---
    await assertTest('3. Database persists only secure hash (no plaintext OTP) with short expiry', async () => {
      const record = await prisma.verificationCode.findFirst({
        where: { userId: testUserA.id, target: targetNewEmail, type: 'EMAIL_CHANGE' },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) return false;
      const capturedOtp = getLatestTestVerificationCode(targetNewEmail);

      const isHashed = record.codeHash.startsWith('$2') && record.codeHash !== capturedOtp;
      const hasExpiry = record.expiresAt.getTime() > Date.now();
      const zeroAttempts = record.attempts === 0;

      return isHashed && hasExpiry && zeroAttempts;
    });

    // --- Test 4: Resend Cooldown Enforcement ---
    await assertTest('4. Requesting OTP again before 60s cooldown returns 429 COOLDOWN_ACTIVE', async () => {
      const res = await fetch(`${BASE_URL}/profile/email/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail }),
      });

      const data = await res.json();
      return res.status === 429 && data.code === 'COOLDOWN_ACTIVE';
    });

    // --- Test 5: Incorrect OTP Rejection & Attempt Counter ---
    await assertTest('5. Incorrect OTP increments attempt counter and reports remaining attempts', async () => {
      const res = await fetch(`${BASE_URL}/profile/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail, code: '000000' }),
      });

      const data = await res.json();
      const record = await prisma.verificationCode.findFirst({
        where: { userId: testUserA.id, target: targetNewEmail, type: 'EMAIL_CHANGE' },
        orderBy: { createdAt: 'desc' },
      });

      return res.status === 400 && data.code === 'INVALID_CODE' && record?.attempts === 1;
    });

    // --- Test 6: Max Attempts Lockout (5 attempts) ---
    await assertTest('6. Exceeding max attempts (5 incorrect tries) permanently locks the code', async () => {
      // Submit 4 more incorrect attempts
      for (let i = 0; i < 4; i++) {
        await fetch(`${BASE_URL}/profile/email/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokensA.accessToken}`,
          },
          body: JSON.stringify({ email: targetNewEmail, code: '000000' }),
        });
      }

      // Now attempt 6: should return MAX_ATTEMPTS_EXCEEDED
      const res = await fetch(`${BASE_URL}/profile/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail, code: '000000' }),
      });

      const data = await res.json();
      return res.status === 400 && data.code === 'MAX_ATTEMPTS_EXCEEDED';
    });

    // --- Test 7: Expired OTP Rejection ---
    await assertTest('7. Expired OTP is rejected with 400 CODE_EXPIRED', async () => {
      // Create expired record in DB
      const expiredRecord = await prisma.verificationCode.create({
        data: {
          userId: testUserA.id,
          target: 'expired.test@example.com',
          type: 'EMAIL_CHANGE',
          codeHash: '$2a$10$fakehashforexpiredtest000000000000000000000000000000',
          expiresAt: new Date(Date.now() - 10000), // in the past
          resendAfter: new Date(Date.now() - 10000),
          attempts: 0,
          maxAttempts: 5,
        },
      });

      const res = await fetch(`${BASE_URL}/profile/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: 'expired.test@example.com', code: '123456' }),
      });

      const data = await res.json();
      await prisma.verificationCode.delete({ where: { id: expiredRecord.id } });
      return res.status === 400 && data.code === 'CODE_EXPIRED';
    });

    // --- Test 8: Valid Email Verification & Atomic Update ---
    let validEmailOtp = '';
    await assertTest('8. Valid OTP atomically updates email and marks code as consumed', async () => {
      // Clear previous record to allow fresh request
      await prisma.verificationCode.deleteMany({
        where: { userId: testUserA.id, target: targetNewEmail },
      });

      // 1. Request new code
      const reqRes = await fetch(`${BASE_URL}/profile/email/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail }),
      });
      if (reqRes.status !== 200) return false;

      validEmailOtp = getLatestTestVerificationCode(targetNewEmail)!;
      if (!validEmailOtp) return false;

      // 2. Verify with valid OTP
      const verifyRes = await fetch(`${BASE_URL}/profile/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail, code: validEmailOtp }),
      });

      const verifyData = await verifyRes.json();
      const updatedInDb = await prisma.userProfile.findUnique({ where: { id: testUserA.id } });
      const codeInDb = await prisma.verificationCode.findFirst({
        where: { userId: testUserA.id, target: targetNewEmail },
        orderBy: { createdAt: 'desc' },
      });

      return (
        verifyRes.status === 200 &&
        verifyData.success === true &&
        updatedInDb?.email === targetNewEmail &&
        codeInDb?.consumedAt !== null
      );
    });

    // --- Test 9: Replay Attack Prevention ---
    await assertTest('9. Replay attack: Already-consumed OTP cannot be reused', async () => {
      const res = await fetch(`${BASE_URL}/profile/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: targetNewEmail, code: validEmailOtp }),
      });

      const data = await res.json();
      return res.status === 400 && data.error.includes('No active verification request found');
    });

    // --- Test 10: Duplicate Email Rejection ---
    await assertTest('10. Duplicate email: Cannot request verification for another user\'s email', async () => {
      const res = await fetch(`${BASE_URL}/profile/email/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: testUserB.email }),
      });

      return res.status === 409;
    });

    // --- Test 11: Cross-User Authorization Isolation ---
    await assertTest('11. Cross-user isolation: User B cannot verify code belonging to User A', async () => {
      const crossTarget = 'cross.target@example.com';
      await fetch(`${BASE_URL}/profile/email/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: crossTarget }),
      });

      const code = getLatestTestVerificationCode(crossTarget)!;

      // User B attempts to verify User A's code
      const res = await fetch(`${BASE_URL}/profile/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensB.accessToken}`,
        },
        body: JSON.stringify({ email: crossTarget, code }),
      });

      const data = await res.json();
      return res.status === 400 && data.error.includes('No active verification request found');
    });

    // --- Test 12: Mobile Number Verification Flow ---
    let validMobileOtp = '';
    await assertTest('12. Mobile Number Verification: Request code, verify OTP, update phone', async () => {
      // 1. Request mobile verification
      const reqRes = await fetch(`${BASE_URL}/profile/mobile/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ phone: targetNewPhone }),
      });

      const reqData = await reqRes.json();
      if (reqRes.status !== 200 || !reqData.success) return false;

      validMobileOtp = getLatestTestVerificationCode(targetNewPhone)!;
      if (!validMobileOtp) return false;

      // 2. Verify with valid OTP
      const verifyRes = await fetch(`${BASE_URL}/profile/mobile/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ phone: targetNewPhone, code: validMobileOtp }),
      });

      const verifyData = await verifyRes.json();
      const updatedInDb = await prisma.userProfile.findUnique({ where: { id: testUserA.id } });

      return (
        verifyRes.status === 200 &&
        verifyData.success === true &&
        updatedInDb?.phone === targetNewPhone
      );
    });

    // --- Test 13: Duplicate Phone Number Rejection ---
    await assertTest('13. Duplicate mobile number: Blocked from claiming another user\'s phone', async () => {
      const res = await fetch(`${BASE_URL}/profile/mobile/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ phone: testUserB.phone }),
      });

      return res.status === 409;
    });

    // --- Test 14: Bypass Prevention on General Profile Endpoints ---
    await assertTest('14. Bypass prevention: PATCH profile cannot directly modify email or phone', async () => {
      const original = await prisma.userProfile.findUnique({ where: { id: testUserA.id } });

      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({
          email: 'bypassed_email@evil.com',
          phone: '+1 999-999-9999',
          hairColor: 'Platinum Blonde',
        }),
      });

      await res.json();
      const currentInDb = await prisma.userProfile.findUnique({ where: { id: testUserA.id } });

      return (
        res.status === 200 &&
        currentInDb?.hairColor === 'Platinum Blonde' &&
        currentInDb?.email === original?.email &&
        currentInDb?.phone === original?.phone
      );
    });

    // --- Test 15: Legacy PATCH Endpoints Reject Unverified Updates ---
    await assertTest('15. Legacy PATCH /profile/email and /profile/mobile reject requests without code', async () => {
      const emailRes = await fetch(`${BASE_URL}/profile/email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ email: 'unverified@example.com' }),
      });
      const emailData = await emailRes.json();

      const mobileRes = await fetch(`${BASE_URL}/profile/mobile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
        body: JSON.stringify({ phone: '+1 555-444-3333' }),
      });
      const mobileData = await mobileRes.json();

      return (
        emailRes.status === 400 &&
        emailData.requiresVerification === true &&
        mobileRes.status === 400 &&
        mobileData.requiresVerification === true
      );
    });

    // --- Test 16: Auth Profile Refresh State ---
    await assertTest('16. /api/auth/me returns updated email and mobile immediately', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokensA.accessToken}`,
        },
      });

      const data = await res.json();
      return (
        res.status === 200 &&
        data.user?.email === targetNewEmail &&
        data.user?.phone === targetNewPhone
      );
    });

  } finally {
    // Cleanup test users and server
    await prisma.verificationCode.deleteMany({
      where: { userId: { in: [testUserA.id, testUserB.id] } },
    });
    await prisma.userProfile.deleteMany({
      where: { id: { in: [testUserA.id, testUserB.id] } },
    });

    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });
  }

  console.log('\n--------------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('--------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerificationTestSuite()
  .catch((err) => {
    console.error('Fatal error running verification test suite:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
