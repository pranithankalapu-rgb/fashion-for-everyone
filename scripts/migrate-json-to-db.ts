import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting JSON to PostgreSQL data migration...\n');

  const jsonPath = path.resolve(process.cwd(), 'backend', 'data.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Migration failed: ${jsonPath} does not exist.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(rawData);

  const stats: Record<string, number> = {};

  try {
    // 1. Migrate UserProfile
    const initialUsers = [
      {
        id: 'user_01',
        name: 'Sophia Laurent',
        email: 'sophia.laurent@fashionforeveryone.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        skinTone: 'Warm Golden',
        undertone: 'Warm',
        hairColor: 'Chestnut Brown',
        bodyShape: 'Hourglass',
        measurements: { heightCm: 172, chestCm: 88, waistCm: 68, hipsCm: 94 },
        selectedOccasions: ['Work', 'Date night', 'Casual'],
        styleVibes: ['Minimalist', 'Smart casual', 'Classic'],
        completedOnboarding: true,
        role: 'customer',
        approvalStatus: 'Approved',
        status: 'Active',
        phone: '+1 (555) 234-5678',
        bio: 'Fashion enthusiast, style curator, and classic minimalist explorer.',
      },
      {
        id: 'user_02',
        name: 'Elena Rostova',
        email: 'elena.rostova@couture.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        skinTone: 'Fair Porcelain',
        undertone: 'Cool',
        hairColor: 'Platinum Blonde',
        bodyShape: 'Hourglass',
        measurements: { heightCm: 178, chestCm: 86, waistCm: 64, hipsCm: 92 },
        selectedOccasions: ['Formal', 'Party'],
        styleVibes: ['Bold', 'Classic'],
        completedOnboarding: true,
        role: 'designer',
        approvalStatus: 'Approved',
        status: 'Active',
        phone: '+1 (555) 345-6789',
        bio: 'Haute couture designer specializing in sculptural silhouettes and luxury silk.',
      },
      {
        id: 'user_03',
        name: 'Marcus Vance',
        email: 'marcus.vance@streetwear.io',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        skinTone: 'Deep Rich',
        undertone: 'Neutral',
        hairColor: 'Black',
        bodyShape: 'Inverted Triangle',
        measurements: { heightCm: 185, chestCm: 102, waistCm: 80, hipsCm: 98 },
        selectedOccasions: ['Casual', 'Athletic', 'Party'],
        styleVibes: ['Streetwear', 'Bold'],
        completedOnboarding: true,
        role: 'customer',
        requestedRole: 'designer',
        approvalStatus: 'Pending',
        status: 'Active',
        phone: '+1 (555) 456-7890',
        bio: 'Urban fashion creator applying for certified Designer Showcase badge and leaderboard access.',
      },
      {
        id: 'user_04',
        name: 'Aria Chen',
        email: 'aria.chen@nordstromboutique.com',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        skinTone: 'Warm Golden',
        undertone: 'Warm',
        hairColor: 'Espresso Brown',
        bodyShape: 'Rectangle',
        measurements: { heightCm: 168, chestCm: 84, waistCm: 66, hipsCm: 90 },
        selectedOccasions: ['Work', 'Formal'],
        styleVibes: ['Minimalist', 'Smart casual'],
        completedOnboarding: true,
        role: 'customer',
        requestedRole: 'retailer',
        approvalStatus: 'Pending',
        status: 'Active',
        phone: '+1 (555) 567-8901',
        bio: 'Independent fashion boutique owner requesting Retailer access for multi-store inventory sync.',
      },
      {
        id: 'user_05',
        name: 'David Sterling',
        email: 'david.sterling@luxurythreads.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        skinTone: 'Olive Neutral',
        undertone: 'Neutral',
        hairColor: 'Dark Brown',
        bodyShape: 'Rectangle',
        measurements: { heightCm: 182, chestCm: 98, waistCm: 82, hipsCm: 96 },
        selectedOccasions: ['Work', 'Formal'],
        styleVibes: ['Classic', 'Smart casual'],
        completedOnboarding: true,
        role: 'retailer',
        approvalStatus: 'Approved',
        status: 'Active',
        phone: '+1 (555) 678-9012',
        bio: 'Luxury menswear retailer partner managing flagship inventory.',
      },
      {
        id: 'user_06',
        name: 'Chloe Bennett',
        email: 'chloe.b@bohostyle.org',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        skinTone: 'Cool Rose',
        undertone: 'Cool',
        hairColor: 'Auburn',
        bodyShape: 'Pear',
        measurements: { heightCm: 165, chestCm: 86, waistCm: 70, hipsCm: 98 },
        selectedOccasions: ['Casual', 'Travel'],
        styleVibes: ['Boho', 'Smart casual'],
        completedOnboarding: true,
        role: 'customer',
        requestedRole: 'designer',
        approvalStatus: 'Rejected',
        rejectionReason: 'Portfolio did not meet the mandatory 3-piece minimum runway-grade design requirement.',
        status: 'Active',
        phone: '+1 (555) 789-0123',
        bio: 'Bohemian resortwear designer.',
      },
      {
        id: 'user_07',
        name: 'Alexander Wright',
        email: 'alexander.w@modernfit.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        skinTone: 'Warm Golden',
        undertone: 'Warm',
        hairColor: 'Sandy Brown',
        bodyShape: 'Inverted Triangle',
        measurements: { heightCm: 180, chestCm: 100, waistCm: 80, hipsCm: 94 },
        selectedOccasions: ['Casual', 'Work'],
        styleVibes: ['Minimalist'],
        completedOnboarding: true,
        role: 'customer',
        approvalStatus: 'Approved',
        status: 'Inactive',
        phone: '+1 (555) 890-1234',
        bio: 'Casual tailoring customer.',
      },
      {
        id: 'user_08',
        name: 'Isabella Rossi',
        email: 'isabella.rossi@milanodesign.it',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
        skinTone: 'Olive Neutral',
        undertone: 'Warm',
        hairColor: 'Dark Chestnut',
        bodyShape: 'Hourglass',
        measurements: { heightCm: 175, chestCm: 90, waistCm: 65, hipsCm: 95 },
        selectedOccasions: ['Formal', 'Party', 'Work'],
        styleVibes: ['Bold', 'Classic'],
        completedOnboarding: true,
        role: 'designer',
        approvalStatus: 'Approved',
        status: 'Active',
        phone: '+1 (555) 901-2345',
        bio: 'Milan Fashion Week participant and luxury fabric curator.',
      }
    ];

    stats['UserProfile'] = 0;
    for (const u of initialUsers) {
      await prisma.userProfile.upsert({
        where: { id: u.id },
        update: {
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          photoUrl: u.photoUrl || null,
          skinTone: u.skinTone,
          undertone: u.undertone,
          hairColor: u.hairColor,
          bodyShape: u.bodyShape,
          measurements: u.measurements,
          selectedOccasions: u.selectedOccasions,
          styleVibes: u.styleVibes,
          completedOnboarding: u.completedOnboarding,
          role: u.role,
          approvalStatus: u.approvalStatus,
          status: u.status,
          requestedRole: (u as any).requestedRole || null,
          rejectionReason: (u as any).rejectionReason || null,
          phone: u.phone,
          bio: u.bio,
        },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          photoUrl: u.photoUrl || null,
          skinTone: u.skinTone,
          undertone: u.undertone,
          hairColor: u.hairColor,
          bodyShape: u.bodyShape,
          measurements: u.measurements,
          selectedOccasions: u.selectedOccasions,
          styleVibes: u.styleVibes,
          completedOnboarding: u.completedOnboarding,
          role: u.role,
          approvalStatus: u.approvalStatus,
          status: u.status,
          requestedRole: (u as any).requestedRole || null,
          rejectionReason: (u as any).rejectionReason || null,
          phone: u.phone,
          bio: u.bio,
        },
      });
      stats['UserProfile']++;
    }

    // 2. Migrate ColorCombos
    if (Array.isArray(data.colorCombos)) {
      stats['ColorCombo'] = 0;
      for (const item of data.colorCombos) {
        await prisma.colorCombo.upsert({
          where: { id: item.id },
          update: {
            occasion: item.occasion,
            subType: item.subType,
            title: item.title,
            colors: item.colors || [],
            rating: item.rating || 5.0,
            votesCount: item.votesCount || 0,
            userVote: item.userVote ?? null,
            trendingScore: item.trendingScore || 0,
            exampleImageUrl: item.exampleImageUrl || '',
          },
          create: {
            id: item.id,
            occasion: item.occasion,
            subType: item.subType,
            title: item.title,
            colors: item.colors || [],
            rating: item.rating || 5.0,
            votesCount: item.votesCount || 0,
            userVote: item.userVote ?? null,
            trendingScore: item.trendingScore || 0,
            exampleImageUrl: item.exampleImageUrl || '',
          },
        });
        stats['ColorCombo']++;
      }
    }

    // 3. Migrate Designers
    const initialDesigners = [
      {
        id: 'des_1',
        name: 'Elena Rostova',
        handle: '@elena_couture',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Haute couture & bespoke eveningwear. Master of architectural silhouettes, silk draping, and contemporary Parisian tailoring.',
        followers: 4850,
        avgRating: 4.95,
        totalVotes: 342,
        badges: ['Top Rated', 'Trending'],
        verified: true,
        approvalStatus: 'Approved',
        status: 'Active',
        email: 'elena.rostova@couture.com',
      },
      {
        id: 'des_2',
        name: 'Marcus Vance',
        handle: '@vance_atelier',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Minimalist luxury tailoring & gender-neutral silhouettes. Merging Scandinavian utility with Italian woolen craftsmanship.',
        followers: 3210,
        avgRating: 4.88,
        totalVotes: 215,
        badges: ['Top Rated'],
        verified: true,
        approvalStatus: 'Approved',
        status: 'Active',
        email: 'marcus.vance@streetwear.io',
      },
      {
        id: 'des_3',
        name: 'Aria Takahashi',
        handle: '@aria_minimal',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        bio: 'Sustainable structured outerwear & organic fiber experiments. Finalist at Tokyo Sustainable Design Week 2025.',
        followers: 1890,
        avgRating: 4.76,
        totalVotes: 148,
        badges: ['New', 'Trending'],
        verified: true,
        approvalStatus: 'Approved',
        status: 'Active',
        email: 'aria.takahashi@tokyodesign.jp',
      },
      {
        id: 'des_4',
        name: 'Julian Saint-Laurent',
        handle: '@julian_atelier',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: 'Avant-garde runway tailoring and recycled textile experimentation. Applying for certified Designer Showcase badge.',
        followers: 420,
        avgRating: 4.5,
        totalVotes: 18,
        badges: ['New'],
        verified: false,
        approvalStatus: 'Pending',
        status: 'Active',
        email: 'julian.stlaurent@avantgarde.fr',
      },
      {
        id: 'des_5',
        name: 'Claire Montagne',
        handle: '@claire_resort',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: 'Bohemian resortwear and linen leisure designs.',
        followers: 110,
        avgRating: 3.8,
        totalVotes: 5,
        badges: [],
        verified: false,
        approvalStatus: 'Rejected',
        rejectionReason: 'Portfolio does not meet high-density fabric and pattern grading standards.',
        status: 'Active',
        email: 'claire.montagne@resortwear.com',
      },
    ];

    stats['Designer'] = 0;
    for (const item of initialDesigners) {
      await prisma.designer.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          handle: item.handle,
          avatar: item.avatar,
          bio: item.bio,
          followers: item.followers,
          avgRating: item.avgRating,
          totalVotes: item.totalVotes,
          badges: item.badges,
          verified: item.verified,
          approvalStatus: item.approvalStatus,
          status: item.status,
          email: item.email,
          rejectionReason: item.rejectionReason || null,
        },
        create: {
          id: item.id,
          name: item.name,
          handle: item.handle,
          avatar: item.avatar,
          bio: item.bio,
          followers: item.followers,
          avgRating: item.avgRating,
          totalVotes: item.totalVotes,
          badges: item.badges,
          verified: item.verified,
          approvalStatus: item.approvalStatus,
          status: item.status,
          email: item.email,
          rejectionReason: item.rejectionReason || null,
        },
      });
      stats['Designer']++;
    }

    // 4. Migrate Designs
    const initialDesigns = [
      {
        id: 'design_01',
        designerId: 'des_1',
        designerName: 'Elena Rostova',
        designerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        title: 'Midnight Velvet Draped Gown',
        collection: 'Autumn Nocturne 2026',
        imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        rating: 4.96,
        votesCount: 184,
        occasion: 'Formal',
        palette: ['#0B0F19', '#312E81', '#C084FC'],
        price: 890,
        inStock: true,
        approvalStatus: 'Approved',
        createdAt: '2026-08-15',
      },
      {
        id: 'design_02',
        designerId: 'des_2',
        designerName: 'Marcus Vance',
        designerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        title: 'Structured Charcoal Trench Suit',
        collection: 'Urban Brutalism',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        rating: 4.88,
        votesCount: 122,
        occasion: 'Work',
        palette: ['#1F2937', '#6B7280', '#D97706'],
        price: 640,
        inStock: true,
        approvalStatus: 'Approved',
        createdAt: '2026-08-18',
      },
      {
        id: 'design_03',
        designerId: 'des_3',
        designerName: 'Aria Takahashi',
        designerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        title: 'Origami Layered Cocoon Coat',
        collection: 'Neo-Tokyo Autumn',
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
        rating: 4.79,
        votesCount: 95,
        occasion: 'Casual',
        palette: ['#F59E0B', '#78350F', '#FEF3C7'],
        price: 520,
        inStock: true,
        approvalStatus: 'Approved',
        createdAt: '2026-08-20',
      },
      {
        id: 'design_04',
        designerId: 'des_4',
        designerName: 'Julian Saint-Laurent',
        designerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        title: 'Asymmetric Deconstructed Silk Kimono Coat',
        collection: 'Metamorphosis SS26',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        rating: 4.5,
        votesCount: 12,
        occasion: 'Party',
        palette: ['#1E1B4B', '#9333EA', '#F43F5E'],
        price: 780,
        inStock: true,
        approvalStatus: 'Pending',
        createdAt: '2026-08-28',
      },
      {
        id: 'design_05',
        designerId: 'des_5',
        designerName: 'Claire Montagne',
        designerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        title: 'Raw Hem Patchwork Tunic',
        collection: 'Boho Sunset',
        imageUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80',
        rating: 3.5,
        votesCount: 4,
        occasion: 'Travel',
        palette: ['#D97706', '#92400E', '#FDE68A'],
        price: 260,
        inStock: false,
        approvalStatus: 'Rejected',
        rejectionReason: 'Fabric tension and stitch quality do not comply with luxury showcase requirements.',
        createdAt: '2026-08-22',
      },
    ];

    stats['Design'] = 0;
    for (const item of initialDesigns) {
      await prisma.design.upsert({
        where: { id: item.id },
        update: {
          designerId: item.designerId,
          designerName: item.designerName,
          designerAvatar: item.designerAvatar,
          title: item.title,
          collection: item.collection,
          imageUrl: item.imageUrl,
          rating: item.rating,
          votesCount: item.votesCount,
          occasion: item.occasion,
          palette: item.palette,
          price: item.price,
          inStock: item.inStock,
          approvalStatus: item.approvalStatus,
          rejectionReason: (item as any).rejectionReason || null,
          createdAt: item.createdAt,
        },
        create: {
          id: item.id,
          designerId: item.designerId,
          designerName: item.designerName,
          designerAvatar: item.designerAvatar,
          title: item.title,
          collection: item.collection,
          imageUrl: item.imageUrl,
          rating: item.rating,
          votesCount: item.votesCount,
          occasion: item.occasion,
          palette: item.palette,
          price: item.price,
          inStock: item.inStock,
          approvalStatus: item.approvalStatus,
          rejectionReason: (item as any).rejectionReason || null,
          createdAt: item.createdAt,
        },
      });
      stats['Design']++;
    }

    // 5. Migrate RetailProducts
    if (Array.isArray(data.products)) {
      stats['RetailProduct'] = 0;
      for (const item of data.products) {
        await prisma.retailProduct.upsert({
          where: { id: item.id },
          update: {
            title: item.title,
            brand: item.brand,
            category: item.category,
            price: item.price,
            originalPrice: item.originalPrice ?? null,
            imageUrl: item.imageUrl,
            colors: item.colors || [],
            silhouette: item.silhouette,
            retailer: item.retailer,
            affiliateUrl: item.affiliateUrl,
            similarityScore: item.similarityScore ?? null,
            sku: item.sku ?? null,
            status: item.status ?? 'Active',
            description: item.description ?? null,
            sizes: item.sizes || [],
            occasion: item.occasion ?? null,
            discountPercent: item.discountPercent ?? null,
            stockQuantity: item.stockQuantity ?? 10,
          },
          create: {
            id: item.id,
            title: item.title,
            brand: item.brand,
            category: item.category,
            price: item.price,
            originalPrice: item.originalPrice ?? null,
            imageUrl: item.imageUrl,
            colors: item.colors || [],
            silhouette: item.silhouette,
            retailer: item.retailer,
            affiliateUrl: item.affiliateUrl,
            similarityScore: item.similarityScore ?? null,
            sku: item.sku ?? null,
            status: item.status ?? 'Active',
            description: item.description ?? null,
            sizes: item.sizes || [],
            occasion: item.occasion ?? null,
            discountPercent: item.discountPercent ?? null,
            stockQuantity: item.stockQuantity ?? 10,
          },
        });
        stats['RetailProduct']++;
      }
    }

    // 6. Migrate StoreStocks
    if (Array.isArray(data.storeStocks)) {
      stats['StoreStock'] = 0;
      for (const item of data.storeStocks) {
        await prisma.storeStock.upsert({
          where: { id: item.id },
          update: {
            productId: item.productId,
            storeName: item.storeName,
            retailer: item.retailer,
            address: item.address,
            distanceMiles: item.distanceMiles,
            sizeStock: item.sizeStock || {},
            canReserve: item.canReserve ?? true,
          },
          create: {
            id: item.id,
            productId: item.productId,
            storeName: item.storeName,
            retailer: item.retailer,
            address: item.address,
            distanceMiles: item.distanceMiles,
            sizeStock: item.sizeStock || {},
            canReserve: item.canReserve ?? true,
          },
        });
        stats['StoreStock']++;
      }
    }

    // 7. Migrate OutfitLooks
    if (Array.isArray(data.outfitLooks)) {
      stats['OutfitLook'] = 0;
      for (const item of data.outfitLooks) {
        await prisma.outfitLook.upsert({
          where: { id: item.id },
          update: {
            creatorName: item.creatorName,
            creatorHandle: item.creatorHandle,
            creatorAvatar: item.creatorAvatar,
            videoThumbnail: item.videoThumbnail,
            title: item.title,
            likes: item.likes || 0,
            reshares: item.reshares || 0,
            occasion: item.occasion,
            taggedProducts: item.taggedProducts || [],
            userLiked: item.userLiked ?? null,
          },
          create: {
            id: item.id,
            creatorName: item.creatorName,
            creatorHandle: item.creatorHandle,
            creatorAvatar: item.creatorAvatar,
            videoThumbnail: item.videoThumbnail,
            title: item.title,
            likes: item.likes || 0,
            reshares: item.reshares || 0,
            occasion: item.occasion,
            taggedProducts: item.taggedProducts || [],
            userLiked: item.userLiked ?? null,
          },
        });
        stats['OutfitLook']++;
      }
    }

    // 8. Migrate CustomerOrders & OrderItems
    if (Array.isArray(data.orders)) {
      stats['CustomerOrder'] = 0;
      stats['OrderItem'] = 0;
      for (const item of data.orders) {
        await prisma.customerOrder.upsert({
          where: { id: item.id },
          update: {
            orderNumber: item.orderNumber,
            date: item.date,
            status: item.status,
            totalAmount: item.totalAmount,
            currency: item.currency || '$',
            shippingAddress: item.shippingAddress,
            deliveryDate: item.deliveryDate ?? null,
            trackingNumber: item.trackingNumber ?? null,
            customerName: item.customerName ?? null,
            customerEmail: item.customerEmail ?? null,
            customerPhone: item.customerPhone ?? null,
            paymentMethod: item.paymentMethod ?? null,
          },
          create: {
            id: item.id,
            orderNumber: item.orderNumber,
            date: item.date,
            status: item.status,
            totalAmount: item.totalAmount,
            currency: item.currency || '$',
            shippingAddress: item.shippingAddress,
            deliveryDate: item.deliveryDate ?? null,
            trackingNumber: item.trackingNumber ?? null,
            customerName: item.customerName ?? null,
            customerEmail: item.customerEmail ?? null,
            customerPhone: item.customerPhone ?? null,
            paymentMethod: item.paymentMethod ?? null,
          },
        });
        stats['CustomerOrder']++;

        if (Array.isArray(item.items)) {
          for (let index = 0; index < item.items.length; index++) {
            const orderItem = item.items[index];
            const orderItemId = `${item.id}_item_${index}`;
            await prisma.orderItem.upsert({
              where: { id: orderItemId },
              update: {
                orderId: item.id,
                productId: orderItem.productId,
                title: orderItem.title,
                brand: orderItem.brand,
                imageUrl: orderItem.imageUrl,
                price: orderItem.price,
                quantity: orderItem.quantity || 1,
                size: orderItem.size,
                color: orderItem.color ?? null,
                sku: orderItem.sku ?? null,
              },
              create: {
                id: orderItemId,
                orderId: item.id,
                productId: orderItem.productId,
                title: orderItem.title,
                brand: orderItem.brand,
                imageUrl: orderItem.imageUrl,
                price: orderItem.price,
                quantity: orderItem.quantity || 1,
                size: orderItem.size,
                color: orderItem.color ?? null,
                sku: orderItem.sku ?? null,
              },
            });
            stats['OrderItem']++;
          }
        }
      }
    }

    // 9. Migrate RetailerCustomers
    if (Array.isArray(data.retailerCustomers)) {
      stats['RetailerCustomer'] = 0;
      for (const item of data.retailerCustomers) {
        await prisma.retailerCustomer.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            email: item.email,
            phone: item.phone,
            ordersCount: item.ordersCount || 0,
            totalSpent: item.totalSpent || 0,
            recentOrderDate: item.recentOrderDate,
            recentOrderId: item.recentOrderId,
            status: item.status,
            avatar: item.avatar ?? null,
          },
          create: {
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone,
            ordersCount: item.ordersCount || 0,
            totalSpent: item.totalSpent || 0,
            recentOrderDate: item.recentOrderDate,
            recentOrderId: item.recentOrderId,
            status: item.status,
            avatar: item.avatar ?? null,
          },
        });
        stats['RetailerCustomer']++;
      }
    }

    // 10. Migrate Promotions
    if (Array.isArray(data.promotions)) {
      stats['Promotion'] = 0;
      for (const item of data.promotions) {
        await prisma.promotion.upsert({
          where: { code: item.code },
          update: {
            title: item.title,
            discountType: item.discountType,
            discountValue: item.discountValue,
            category: item.category ?? null,
            productId: item.productId ?? null,
            startDate: item.startDate,
            endDate: item.endDate,
            usageCount: item.usageCount || 0,
            maxUses: item.maxUses || 100,
            status: item.status || 'Active',
          },
          create: {
            id: item.id || `promo_${Date.now()}`,
            code: item.code,
            title: item.title,
            discountType: item.discountType,
            discountValue: item.discountValue,
            category: item.category ?? null,
            productId: item.productId ?? null,
            startDate: item.startDate,
            endDate: item.endDate,
            usageCount: item.usageCount || 0,
            maxUses: item.maxUses || 100,
            status: item.status || 'Active',
          },
        });
        stats['Promotion']++;
      }
    }

    // 11. Migrate StoreSettings & Retailer Stores
    const initialStores = [
      {
        id: 'default',
        storeName: 'Nordstrom NYC Flagship',
        logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80',
        taxId: 'US-TAX-8849201',
        currency: '$',
        managerName: 'David Sterling',
        managerEmail: 'david.sterling@luxurythreads.com',
        managerPhone: '+1 (212) 555-0199',
        address: '225 W 57th St, New York, NY 10019',
        supportEmail: 'concierge@nordstromflagship.com',
        supportPhone: '+1 (212) 555-0100',
        autoFulfill: false,
        lowStockThreshold: 5,
        emailNotifications: true,
        smsAlerts: true,
        weeklyReport: true,
        approvalStatus: 'Approved',
        status: 'Active',
        businessType: 'Department Flagship',
      },
      {
        id: 'store_02',
        storeName: 'Saks Fifth Avenue Beverly Hills',
        logoUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=300&q=80',
        taxId: 'US-TAX-9920145',
        currency: '$',
        managerName: 'Claire Beaumont',
        managerEmail: 'claire.beaumont@saksbh.com',
        managerPhone: '+1 (310) 555-0244',
        address: '9600 Wilshire Blvd, Beverly Hills, CA 90212',
        supportEmail: 'service@saksbh.com',
        supportPhone: '+1 (310) 555-0200',
        autoFulfill: true,
        lowStockThreshold: 8,
        emailNotifications: true,
        smsAlerts: false,
        weeklyReport: true,
        approvalStatus: 'Approved',
        status: 'Active',
        businessType: 'Luxury Boutique',
      },
      {
        id: 'store_03',
        storeName: 'Bloom & Thread Artisan Boutique',
        logoUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
        taxId: 'US-TAX-7740283',
        currency: '$',
        managerName: 'Aria Chen',
        managerEmail: 'aria.chen@nordstromboutique.com',
        managerPhone: '+1 (415) 555-8901',
        address: '580 Hayes St, San Francisco, CA 94102',
        supportEmail: 'contact@bloomandthread.com',
        supportPhone: '+1 (415) 555-8900',
        autoFulfill: false,
        lowStockThreshold: 4,
        emailNotifications: true,
        smsAlerts: true,
        weeklyReport: true,
        approvalStatus: 'Pending',
        status: 'Active',
        businessType: 'Independent Fashion Boutique',
      },
      {
        id: 'store_04',
        storeName: 'Velvet & Oak Menswear',
        logoUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=300&q=80',
        taxId: 'US-TAX-6619284',
        currency: '$',
        managerName: 'Robert Langdon',
        managerEmail: 'robert.langdon@velvetoak.com',
        managerPhone: '+1 (312) 555-4421',
        address: '830 N Michigan Ave, Chicago, IL 60611',
        supportEmail: 'help@velvetoak.com',
        supportPhone: '+1 (312) 555-4400',
        autoFulfill: false,
        lowStockThreshold: 3,
        emailNotifications: false,
        smsAlerts: false,
        weeklyReport: false,
        approvalStatus: 'Rejected',
        rejectionReason: 'Retail resale certificate was unverified and business insurance documents were missing.',
        status: 'Active',
        businessType: 'Menswear Studio',
      },
      {
        id: 'store_05',
        storeName: 'Atelier Marais Paris Outlet',
        logoUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=300&q=80',
        taxId: 'FR-TAX-5510294',
        currency: '$',
        managerName: 'Henri Dupont',
        managerEmail: 'henri.dupont@maraisparis.fr',
        managerPhone: '+33 1 42 68 55 00',
        address: '14 Rue de Bretagne, 75003 Paris, France',
        supportEmail: 'bonjour@maraisparis.fr',
        supportPhone: '+33 1 42 68 55 01',
        autoFulfill: false,
        lowStockThreshold: 5,
        emailNotifications: true,
        smsAlerts: true,
        weeklyReport: true,
        approvalStatus: 'Approved',
        status: 'Inactive',
        businessType: 'European Partner Store',
      }
    ];

    stats['StoreSettings'] = 0;
    for (const ss of initialStores) {
      await prisma.storeSettings.upsert({
        where: { id: ss.id },
        update: {
          storeName: ss.storeName,
          logoUrl: ss.logoUrl,
          taxId: ss.taxId,
          currency: ss.currency || '$',
          managerName: ss.managerName,
          managerEmail: ss.managerEmail,
          managerPhone: ss.managerPhone,
          address: ss.address,
          supportEmail: ss.supportEmail,
          supportPhone: ss.supportPhone,
          autoFulfill: ss.autoFulfill ?? false,
          lowStockThreshold: ss.lowStockThreshold || 5,
          emailNotifications: ss.emailNotifications ?? true,
          smsAlerts: ss.smsAlerts ?? true,
          weeklyReport: ss.weeklyReport ?? true,
          approvalStatus: ss.approvalStatus,
          status: ss.status,
          rejectionReason: (ss as any).rejectionReason || null,
          businessType: ss.businessType,
        },
        create: {
          id: ss.id,
          storeName: ss.storeName,
          logoUrl: ss.logoUrl,
          taxId: ss.taxId,
          currency: ss.currency || '$',
          managerName: ss.managerName,
          managerEmail: ss.managerEmail,
          managerPhone: ss.managerPhone,
          address: ss.address,
          supportEmail: ss.supportEmail,
          supportPhone: ss.supportPhone,
          autoFulfill: ss.autoFulfill ?? false,
          lowStockThreshold: ss.lowStockThreshold || 5,
          emailNotifications: ss.emailNotifications ?? true,
          smsAlerts: ss.smsAlerts ?? true,
          weeklyReport: ss.weeklyReport ?? true,
          approvalStatus: ss.approvalStatus,
          status: ss.status,
          rejectionReason: (ss as any).rejectionReason || null,
          businessType: ss.businessType,
        },
      });
      stats['StoreSettings']++;
    }

    // 12. Migrate Reservations
    if (Array.isArray(data.reservations)) {
      stats['Reservation'] = 0;
      for (const item of data.reservations) {
        await prisma.reservation.upsert({
          where: { id: item.id },
          update: {
            storeId: item.storeId,
            productId: item.productId,
            productTitle: item.productTitle,
            size: item.size,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            status: item.status || 'CONFIRMED',
          },
          create: {
            id: item.id,
            storeId: item.storeId,
            productId: item.productId,
            productTitle: item.productTitle,
            size: item.size,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            status: item.status || 'CONFIRMED',
          },
        });
        stats['Reservation']++;
      }
    }

    console.log('✅ Data migration completed successfully!\n');
    console.table(
      Object.entries(stats).map(([Table, Count]) => ({ Table, Count }))
    );
  } catch (err: any) {
    console.error('\n❌ Error during data migration:');
    if (err?.code === 'P1001' || err?.message?.includes('Authentication failed') || err?.message?.includes('database server')) {
      console.error('⚠️ Could not connect to PostgreSQL database.');
      console.error('Please verify that your PostgreSQL server is running and check your DATABASE_URL in .env:');
      console.error('Current DATABASE_URL in .env: ' + process.env.DATABASE_URL);
      console.error('Update .env with your PostgreSQL user, password, host, and database name, e.g.:');
      console.error('DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/fashion_db?schema=public"\n');
    } else {
      console.error(err);
    }
  } finally {
    await prisma.$disconnect();
  }

}

migrateData();
