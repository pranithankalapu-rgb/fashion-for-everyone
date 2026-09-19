import { prisma } from './db';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-fashion-for-everyone-2026';

function generateTestToken(userId: string, role: string = 'customer') {
  return jwt.sign({ userId, id: userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  console.log('🧪 Starting Profile & Settings End-to-End Test Suite...\n');

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

  // Ensure test users exist in DB
  const user1 = await prisma.userProfile.upsert({
    where: { id: 'test_user_profile_1' },
    update: {
      email: 'tester1@fashionforeveryone.com',
      phone: '+1 555-0199',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    },
    create: {
      id: 'test_user_profile_1',
      name: 'Test Profile User 1',
      email: 'tester1@fashionforeveryone.com',
      phone: '+1 555-0199',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      role: 'customer',
      skinTone: 'Warm Golden',
      undertone: 'Warm',
      bodyShape: 'Hourglass',
      hairColor: 'Chestnut Brown',
    },
  });

  const user2 = await prisma.userProfile.upsert({
    where: { id: 'test_user_profile_2' },
    update: {
      email: 'tester2@fashionforeveryone.com',
    },
    create: {
      id: 'test_user_profile_2',
      name: 'Test Profile User 2',
      email: 'tester2@fashionforeveryone.com',
      phone: '+1 555-0200',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      role: 'customer',
    },
  });

  const token1 = generateTestToken(user1.id);
  const token2 = generateTestToken(user2.id);

  // 1. GET /profile
  await assertTest('GET /api/profile returns user profile', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const data = await res.json();
    return res.status === 200 && data.email === 'tester1@fashionforeveryone.com';
  });

  // 2. PATCH /profile/email - validation rejection
  await assertTest('PATCH /api/profile/email rejects invalid email format', async () => {
    const res = await fetch(`${BASE_URL}/profile/email`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    return res.status === 400;
  });

  // 3. PATCH /profile/email - uniqueness conflict (409)
  await assertTest('PATCH /api/profile/email rejects duplicate email with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/profile/email`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ email: 'tester2@fashionforeveryone.com' }), // already belongs to user2
    });
    return res.status === 409;
  });

  // 4. PATCH /profile/email - successful update
  await assertTest('PATCH /api/profile/email successfully updates email in DB', async () => {
    const newEmail = 'tester1_updated@fashionforeveryone.com';
    const res = await fetch(`${BASE_URL}/profile/email`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ email: newEmail }),
    });
    const data = await res.json();
    const inDb = await prisma.userProfile.findUnique({ where: { id: user1.id } });
    return res.status === 200 && inDb?.email === newEmail && data.profile.email === newEmail;
  });

  // 5. PATCH /profile/mobile - validation rejection
  await assertTest('PATCH /api/profile/mobile rejects invalid phone format', async () => {
    const res = await fetch(`${BASE_URL}/profile/mobile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ mobile: '123' }), // too short
    });
    return res.status === 400;
  });

  // 6. PATCH /profile/mobile - successful update
  await assertTest('PATCH /api/profile/mobile successfully updates phone in DB', async () => {
    const newPhone = '+1 987-654-3210';
    const res = await fetch(`${BASE_URL}/profile/mobile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ mobile: newPhone }),
    });
    const data = await res.json();
    const inDb = await prisma.userProfile.findUnique({ where: { id: user1.id } });
    return res.status === 200 && inDb?.phone === newPhone && data.profile.phone === newPhone;
  });

  // 7. POST /profile/avatar - preset URL update
  await assertTest('POST /api/profile/avatar with preset URL updates avatar and photoUrl in DB', async () => {
    const newAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
    const res = await fetch(`${BASE_URL}/profile/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ avatarUrl: newAvatar }),
    });
    const data = await res.json();
    const inDb = await prisma.userProfile.findUnique({ where: { id: user1.id } });
    return res.status === 200 && inDb?.avatar === newAvatar && inDb?.photoUrl === newAvatar;
  });

  // 8. POST /profile/avatar - multipart/form-data file upload
  await assertTest('POST /api/profile/avatar with multipart/form-data uploads file and updates DB', async () => {
    const formData = new FormData();
    const fakeImage = new Blob(['fake-image-bytes-for-test'], { type: 'image/jpeg' });
    formData.append('avatar', fakeImage, 'test-avatar.jpg');

    const res = await fetch(`${BASE_URL}/profile/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
      },
      body: formData,
    });
    const data = await res.json();
    const inDb = await prisma.userProfile.findUnique({ where: { id: user1.id } });
    return res.status === 200 && data.success === true && !!inDb?.avatar && !!inDb?.photoUrl;
  });

  // 9. Clean up test users
  await prisma.userProfile.deleteMany({
    where: { id: { in: ['test_user_profile_1', 'test_user_profile_2'] } },
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
