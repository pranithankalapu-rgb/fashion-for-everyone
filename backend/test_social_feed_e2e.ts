import { prisma } from './db';
import { socialFeedService } from './services/socialFeedService';

const BASE_URL = 'http://localhost:5000/api';

async function runSocialFeedE2ETests() {
  console.log('✨========================================================✨');
  console.log('  SOCIAL OUTFIT LOOKBOOK FEED - E2E & DATABASE TEST SUITE  ');
  console.log('✨========================================================✨\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<boolean>) {
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

  // 1. Direct Prisma & PostgreSQL Database Verification
  console.log('\n--- 1. Database & Prisma ORM Direct Verification ---');

  await test('PostgreSQL connection is alive and healthy', async () => {
    const result = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected`;
    return result.length > 0 && result[0].connected === 1;
  });

  await test('Prisma model OutfitLook exists and can query PostgreSQL', async () => {
    const count = await prisma.outfitLook.count();
    return typeof count === 'number';
  });

  await test('Direct Prisma CRUD: Create, Read, Update, Delete on OutfitLook', async () => {
    // Create
    const created = await prisma.outfitLook.create({
      data: {
        creatorName: 'Prisma Tester',
        creatorHandle: '@prismatester',
        creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        videoThumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        title: 'Prisma Direct DB Look',
        likes: 10,
        reshares: 2,
        occasion: 'Work',
        taggedProducts: [],
        userLiked: false,
      },
    });
    if (!created.id) return false;

    // Read
    const fetched = await prisma.outfitLook.findUnique({ where: { id: created.id } });
    if (!fetched || fetched.title !== 'Prisma Direct DB Look') return false;

    // Update
    const updated = await prisma.outfitLook.update({
      where: { id: created.id },
      data: { likes: 15, userLiked: true },
    });
    if (updated.likes !== 15 || updated.userLiked !== true) return false;

    // Delete
    await prisma.outfitLook.delete({ where: { id: created.id } });
    const afterDelete = await prisma.outfitLook.findUnique({ where: { id: created.id } });
    return afterDelete === null;
  });

  // 2. Service Layer Verification
  console.log('\n--- 2. Service Layer (socialFeedService) Verification ---');

  let serviceLookId = '';
  await test('socialFeedService.createOutfitLook with user resolution & products from PostgreSQL', async () => {
    const product = await prisma.retailProduct.findFirst();
    const productIds = product ? [product.id] : [];

    const look = await socialFeedService.createOutfitLook({
      title: 'Service Layer Autumn Look',
      occasion: 'Casual',
      videoThumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
      taggedProductIds: productIds,
      userId: 'user_01',
    });

    serviceLookId = look.id;
    return (
      !!look.id &&
      look.title === 'Service Layer Autumn Look' &&
      look.creatorName === 'Sophia Laurent' &&
      Array.isArray(look.taggedProducts) &&
      look.taggedProducts.length > 0
    );
  });

  await test('socialFeedService.getSocialFeed retrieves from PostgreSQL', async () => {
    const list = await socialFeedService.getSocialFeed();
    const found = list.find((l) => l.id === serviceLookId);
    return Array.isArray(list) && !!found;
  });

  await test('socialFeedService.toggleLikeOutfitLook updates like state in PostgreSQL', async () => {
    const lookBefore = await socialFeedService.getLookById(serviceLookId);
    const initialLiked = lookBefore?.userLiked ?? false;
    const initialLikes = lookBefore?.likes ?? 0;

    const toggled = await socialFeedService.toggleLikeOutfitLook(serviceLookId);
    const expectedLiked = !initialLiked;
    const expectedLikes = expectedLiked ? initialLikes + 1 : Math.max(0, initialLikes - 1);

    return toggled.userLiked === expectedLiked && toggled.likes === expectedLikes;
  });

  await test('socialFeedService.deleteOutfitLook cleans up record', async () => {
    const res = await socialFeedService.deleteOutfitLook(serviceLookId);
    const lookAfter = await socialFeedService.getLookById(serviceLookId);
    return res.success && lookAfter === null;
  });

  // 3. Complete End-to-End API Flow Verification
  console.log('\n--- 3. End-to-End API & Controller Flow Verification ---');

  await test('GET /api/social-feed returns list ordered by likes desc', async () => {
    const res = await fetch(`${BASE_URL}/social-feed`);
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data)) return false;

    // Check descending order of likes
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1].likes < data[i].likes) return false;
    }
    return true;
  });

  await test('POST /api/social-feed validation: rejects request missing title or videoThumbnail', async () => {
    const res1 = await fetch(`${BASE_URL}/social-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occasion: 'Work' }),
    });
    const res2 = await fetch(`${BASE_URL}/social-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No Thumb' }),
    });
    return res1.status === 400 && res2.status === 400;
  });

  let e2eLookId = '';
  await test('POST /api/social-feed creates look with user context & tagged products in PostgreSQL', async () => {
    // Pick an existing product from DB
    const products = await prisma.retailProduct.findMany({ take: 2 });
    const taggedProductIds = products.map((p) => p.id);

    const res = await fetch(`${BASE_URL}/social-feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user_01',
      },
      body: JSON.stringify({
        title: 'E2E Haute Velvet Lookbook ✨',
        occasion: 'Date night',
        videoThumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
        taggedProductIds,
      }),
    });

    const data = await res.json();
    e2eLookId = data.id;

    // Verify DB directly
    const dbLook = await prisma.outfitLook.findUnique({ where: { id: e2eLookId } });

    return (
      res.status === 201 &&
      data.title === 'E2E Haute Velvet Lookbook ✨' &&
      data.creatorName === 'Sophia Laurent' &&
      data.occasion === 'Date night' &&
      Array.isArray(data.taggedProducts) &&
      data.taggedProducts.length === taggedProductIds.length &&
      dbLook !== null &&
      dbLook.title === 'E2E Haute Velvet Lookbook ✨'
    );
  });

  await test('GET /api/social-feed/:id returns the newly created look from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/social-feed/${e2eLookId}`);
    const data = await res.json();
    return res.status === 200 && data.id === e2eLookId && data.title === 'E2E Haute Velvet Lookbook ✨';
  });

  await test('GET /api/social-feed?occasion=Date night filters correctly', async () => {
    const res = await fetch(`${BASE_URL}/social-feed?occasion=Date%20night`);
    const data = await res.json();
    return res.status === 200 && Array.isArray(data) && data.every((l: any) => l.occasion.toLowerCase() === 'date night');
  });

  await test('GET /api/social-feed?search=Velvet searches correctly', async () => {
    const res = await fetch(`${BASE_URL}/social-feed?search=Velvet`);
    const data = await res.json();
    return res.status === 200 && Array.isArray(data) && data.some((l: any) => l.id === e2eLookId);
  });

  await test('POST /api/social-feed/:id/like toggles like on look in PostgreSQL', async () => {
    // First like toggle (look was created with userLiked: true, likes: 1)
    const res1 = await fetch(`${BASE_URL}/social-feed/${e2eLookId}/like`, {
      method: 'POST',
    });
    const data1 = await res1.json();

    // Verify in PostgreSQL database
    const db1 = await prisma.outfitLook.findUnique({ where: { id: e2eLookId } });
    if (res1.status !== 200 || data1.userLiked !== false || data1.likes !== 0 || db1?.userLiked !== false || db1?.likes !== 0) {
      return false;
    }

    // Second like toggle (from false -> true, likes: 0 -> 1)
    const res2 = await fetch(`${BASE_URL}/social-feed/${e2eLookId}/like`, {
      method: 'POST',
    });
    const data2 = await res2.json();

    // Verify in PostgreSQL database
    const db2 = await prisma.outfitLook.findUnique({ where: { id: e2eLookId } });
    return res2.status === 200 && data2.userLiked === true && data2.likes === 1 && db2?.userLiked === true && db2?.likes === 1;
  });

  await test('POST /api/social-feed/:id/like returns 404 for non-existent look', async () => {
    const res = await fetch(`${BASE_URL}/social-feed/non-existent-uuid-1234/like`, {
      method: 'POST',
    });
    return res.status === 404;
  });

  // 4. Persistence and Cleanup Verification
  console.log('\n--- 4. Persistence & Database Verification ---');

  await test('Data persists in PostgreSQL after independent Prisma queries', async () => {
    // Query directly via fresh Prisma connection
    const freshPrisma = new (await import('@prisma/client')).PrismaClient();
    const persisted = await freshPrisma.outfitLook.findUnique({ where: { id: e2eLookId } });
    await freshPrisma.$disconnect();
    return persisted !== null && persisted.id === e2eLookId;
  });

  await test('DELETE /api/social-feed/:id removes look from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/social-feed/${e2eLookId}`, {
      method: 'DELETE',
    });
    const dbAfter = await prisma.outfitLook.findUnique({ where: { id: e2eLookId } });
    return res.status === 200 && dbAfter === null;
  });

  console.log('\n✨========================================================✨');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('✨========================================================✨\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSocialFeedE2ETests()
  .catch((err) => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
