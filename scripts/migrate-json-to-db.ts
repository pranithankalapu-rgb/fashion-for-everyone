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
    if (data.userProfile) {
      const up = data.userProfile;
      await prisma.userProfile.upsert({
        where: { id: up.id || 'user_01' },
        update: {
          name: up.name,
          avatar: up.avatar,
          photoUrl: up.photoUrl || null,
          skinTone: up.skinTone,
          undertone: up.undertone,
          hairColor: up.hairColor,
          bodyShape: up.bodyShape,
          measurements: up.measurements || {},
          selectedOccasions: up.selectedOccasions || [],
          styleVibes: up.styleVibes || [],
          completedOnboarding: up.completedOnboarding ?? true,
        },
        create: {
          id: up.id || 'user_01',
          name: up.name,
          avatar: up.avatar,
          photoUrl: up.photoUrl || null,
          skinTone: up.skinTone,
          undertone: up.undertone,
          hairColor: up.hairColor,
          bodyShape: up.bodyShape,
          measurements: up.measurements || {},
          selectedOccasions: up.selectedOccasions || [],
          styleVibes: up.styleVibes || [],
          completedOnboarding: up.completedOnboarding ?? true,
        },
      });
      stats['UserProfile'] = 1;
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
    if (Array.isArray(data.designers)) {
      stats['Designer'] = 0;
      for (const item of data.designers) {
        await prisma.designer.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            handle: item.handle,
            avatar: item.avatar,
            bio: item.bio,
            followers: item.followers || 0,
            avgRating: item.avgRating || 5.0,
            totalVotes: item.totalVotes || 0,
            badges: item.badges || [],
            verified: item.verified ?? false,
          },
          create: {
            id: item.id,
            name: item.name,
            handle: item.handle,
            avatar: item.avatar,
            bio: item.bio,
            followers: item.followers || 0,
            avgRating: item.avgRating || 5.0,
            totalVotes: item.totalVotes || 0,
            badges: item.badges || [],
            verified: item.verified ?? false,
          },
        });
        stats['Designer']++;
      }
    }

    // 4. Migrate Designs
    if (Array.isArray(data.designs)) {
      stats['Design'] = 0;
      for (const item of data.designs) {
        await prisma.design.upsert({
          where: { id: item.id },
          update: {
            designerId: item.designerId,
            designerName: item.designerName,
            designerAvatar: item.designerAvatar,
            title: item.title,
            collection: item.collection,
            imageUrl: item.imageUrl,
            rating: item.rating || 5.0,
            votesCount: item.votesCount || 0,
            occasion: item.occasion,
            palette: item.palette || [],
            price: item.price,
            inStock: item.inStock ?? true,
            createdAt: item.createdAt || new Date().toISOString().split('T')[0],
          },
          create: {
            id: item.id,
            designerId: item.designerId,
            designerName: item.designerName,
            designerAvatar: item.designerAvatar,
            title: item.title,
            collection: item.collection,
            imageUrl: item.imageUrl,
            rating: item.rating || 5.0,
            votesCount: item.votesCount || 0,
            occasion: item.occasion,
            palette: item.palette || [],
            price: item.price,
            inStock: item.inStock ?? true,
            createdAt: item.createdAt || new Date().toISOString().split('T')[0],
          },
        });
        stats['Design']++;
      }
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
          where: { id: item.id },
          update: {
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
          create: {
            id: item.id,
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

    // 11. Migrate StoreSettings
    if (data.storeSettings) {
      const ss = data.storeSettings;
      await prisma.storeSettings.upsert({
        where: { id: 'default' },
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
        },
        create: {
          id: 'default',
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
        },
      });
      stats['StoreSettings'] = 1;
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
