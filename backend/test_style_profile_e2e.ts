import { prisma } from './db';

const BASE_URL = 'http://localhost:5000/api';

async function assertTest(name: string, fn: () => Promise<boolean | void>) {
  try {
    const res = await fn();
    if (res === false) {
      console.error(`  ❌ FAIL: ${name}`);
      process.exit(1);
    }
    console.log(`  ✅ PASS: ${name}`);
  } catch (err: any) {
    console.error(`  ❌ ERROR: ${name} ->`, err?.message || err);
    process.exit(1);
  }
}

async function runStyleProfileTests() {
  console.log('🧪 Starting Profile Style Profile E2E Tests against PostgreSQL...');

  const testUserId = 'test_style_user_01';

  // Seed or reset test user
  await prisma.userProfile.upsert({
    where: { id: testUserId },
    create: {
      id: testUserId,
      name: 'Style Tester',
      email: 'styletest@fashionforeveryone.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      skinTone: 'Warm Golden',
      undertone: 'Warm',
      hairColor: 'Brown',
      bodyShape: 'Hourglass',
      measurements: { heightCm: 168, chestCm: 86, waistCm: 66, hipsCm: 92 },
      selectedOccasions: ['Casual', 'Date night'],
      styleVibes: ['Classic', 'Minimalist'],
      role: 'customer',
      status: 'Active',
    },
    update: {
      skinTone: 'Warm Golden',
      undertone: 'Warm',
      bodyShape: 'Hourglass',
      name: 'Style Tester',
    },
  });

  // 1. Test GET /profile
  await assertTest('1. GET /profile returns current style profile', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { 'x-user-id': testUserId },
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.bodyShape === 'Hourglass' &&
      data.skinTone === 'Warm Golden' &&
      data.undertone === 'Warm'
    );
  });

  // 2. Test saving each of the 5 requested Body Shape options
  const bodyShapeOptions = [
    'Hourglass',
    'Pear (Triangle)',
    'Apple (Oval)',
    'Rectangle (Straight)',
    'Inverted Triangle',
  ];

  for (const shape of bodyShapeOptions) {
    await assertTest(`2. PUT /profile updates bodyShape to "${shape}"`, async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
        body: JSON.stringify({ bodyShape: shape }),
      });
      const data = await res.json();
      return (
        res.status === 200 &&
        data.profile?.bodyShape === shape &&
        data.message === 'Profile updated successfully'
      );
    });
  }

  // 3. Test saving each of the 7 requested Skin Tone options
  const skinToneOptions = [
    'Very Fair',
    'Fair',
    'Light',
    'Medium',
    'Tan',
    'Deep',
    'Very Deep',
  ];

  for (const tone of skinToneOptions) {
    await assertTest(`3. PUT /profile updates skinTone to "${tone}"`, async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
        body: JSON.stringify({ skinTone: tone }),
      });
      const data = await res.json();
      return (
        res.status === 200 &&
        data.profile?.skinTone === tone &&
        data.message === 'Profile updated successfully'
      );
    });
  }

  // 4. Test saving each of the 4 requested Undertone options
  const undertoneOptions = ['Warm', 'Cool', 'Neutral', 'Olive'];

  for (const ut of undertoneOptions) {
    await assertTest(`4. PUT /profile updates undertone to "${ut}"`, async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
        body: JSON.stringify({ undertone: ut }),
      });
      const data = await res.json();
      return (
        res.status === 200 &&
        data.profile?.undertone === ut &&
        data.message === 'Profile updated successfully'
      );
    });
  }

  // 5. Test persistence: verify backend retains latest saved selections across requests
  await assertTest('5. Persistence: GET /profile verifies all updated style values in DB', async () => {
    // Set a known combo
    await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({
        bodyShape: 'Rectangle (Straight)',
        skinTone: 'Deep',
        undertone: 'Olive',
      }),
    });

    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { 'x-user-id': testUserId },
    });
    const profile = await res.json();

    const dbRecord = await prisma.userProfile.findUnique({ where: { id: testUserId } });

    return (
      res.status === 200 &&
      profile.bodyShape === 'Rectangle (Straight)' &&
      profile.skinTone === 'Deep' &&
      profile.undertone === 'Olive' &&
      dbRecord?.bodyShape === 'Rectangle (Straight)' &&
      dbRecord?.skinTone === 'Deep' &&
      dbRecord?.undertone === 'Olive'
    );
  });

  // 6. Test that unrelated fields are preserved (not wiped or altered)
  await assertTest('6. Integrity: Unrelated profile fields remain intact during style updates', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { 'x-user-id': testUserId },
    });
    const profile = await res.json();

    return (
      profile.name === 'Style Tester' &&
      profile.email === 'styletest@fashionforeveryone.com' &&
      profile.role === 'customer' &&
      Array.isArray(profile.selectedOccasions) &&
      profile.selectedOccasions.includes('Casual') &&
      profile.measurements?.heightCm === 168
    );
  });

  // 7. Validation rejection: Invalid bodyShape -> HTTP 400
  await assertTest('7. Validation: Rejects invalid bodyShape with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({ bodyShape: 'InvalidBodyShape123' }),
    });
    const data = await res.json();
    return res.status === 400 && data.error?.includes('Invalid bodyShape');
  });

  // 8. Validation rejection: Invalid skinTone -> HTTP 400
  await assertTest('8. Validation: Rejects invalid skinTone with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({ skinTone: 'NeonGreen' }),
    });
    const data = await res.json();
    return res.status === 400 && data.error?.includes('Invalid skinTone');
  });

  // 9. Validation rejection: Invalid undertone -> HTTP 400
  await assertTest('9. Validation: Rejects invalid undertone with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({ undertone: 'Metallic' }),
    });
    const data = await res.json();
    return res.status === 400 && data.error?.includes('Invalid undertone');
  });

  // 10. Security: Prevent updating another user's profile -> HTTP 403
  await assertTest('10. Security: Rejects attempt to update different user profile with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({ id: 'victim_user_999', bodyShape: 'Hourglass' }),
    });
    const data = await res.json();
    return res.status === 403 && data.error?.includes('only update your own profile');
  });

  // Clean up test record
  await prisma.userProfile.delete({ where: { id: testUserId } }).catch(() => {});

  console.log('\n🎉 ALL Profile Style Profile E2E Tests PASSED successfully!');
}

runStyleProfileTests();
