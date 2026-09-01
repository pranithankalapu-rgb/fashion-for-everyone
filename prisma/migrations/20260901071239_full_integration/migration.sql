-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "photoUrl" TEXT,
    "skinTone" TEXT NOT NULL,
    "undertone" TEXT NOT NULL,
    "hairColor" TEXT NOT NULL,
    "bodyShape" TEXT NOT NULL,
    "measurements" JSONB NOT NULL,
    "selectedOccasions" TEXT[],
    "styleVibes" TEXT[],
    "completedOnboarding" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorCombo" (
    "id" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "subType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "userVote" INTEGER,
    "trendingScore" INTEGER NOT NULL DEFAULT 0,
    "exampleImageUrl" TEXT NOT NULL,

    CONSTRAINT "ColorCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Designer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "designerName" TEXT NOT NULL,
    "designerAvatar" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "occasion" TEXT NOT NULL,
    "palette" TEXT[],
    "price" DOUBLE PRECISION NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailProduct" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "imageUrl" TEXT NOT NULL,
    "colors" TEXT[],
    "silhouette" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION,
    "sku" TEXT,
    "status" TEXT,
    "description" TEXT,
    "sizes" TEXT[],
    "occasion" TEXT,
    "discountPercent" DOUBLE PRECISION,
    "stockQuantity" INTEGER,

    CONSTRAINT "RetailProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "distanceMiles" DOUBLE PRECISION NOT NULL,
    "sizeStock" JSONB NOT NULL,
    "canReserve" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StoreStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutfitLook" (
    "id" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "creatorHandle" TEXT NOT NULL,
    "creatorAvatar" TEXT NOT NULL,
    "videoThumbnail" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "reshares" INTEGER NOT NULL DEFAULT 0,
    "occasion" TEXT NOT NULL,
    "taggedProducts" JSONB NOT NULL,
    "userLiked" BOOLEAN,

    CONSTRAINT "OutfitLook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT '$',
    "shippingAddress" TEXT NOT NULL,
    "deliveryDate" TEXT,
    "trackingNumber" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "paymentMethod" TEXT,

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "size" TEXT NOT NULL,
    "color" TEXT,
    "sku" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailerCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentOrderDate" TEXT NOT NULL,
    "recentOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "RetailerCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "productId" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT '$',
    "managerName" TEXT NOT NULL,
    "managerEmail" TEXT NOT NULL,
    "managerPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "supportEmail" TEXT NOT NULL,
    "supportPhone" TEXT NOT NULL,
    "autoFulfill" BOOLEAN NOT NULL DEFAULT false,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReport" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnalysisRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "photoUrl" TEXT NOT NULL,
    "occasion" TEXT,
    "confidence" DOUBLE PRECISION,
    "detectedSkinTone" TEXT,
    "detectedUndertone" TEXT,
    "detectedHairColor" TEXT,
    "detectedBodyShape" TEXT,
    "estimatedMeasurements" JSONB,
    "recommendedPalette" TEXT[],
    "paletteRationale" TEXT,
    "bodyShapeAdvice" TEXT,
    "colorHarmonyScore" DOUBLE PRECISION,
    "fitScore" DOUBLE PRECISION,
    "overallMatch" DOUBLE PRECISION,
    "providerUsed" TEXT NOT NULL DEFAULT 'rule-based',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnalysisRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_orderNumber_key" ON "CustomerOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreStock" ADD CONSTRAINT "StoreStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "RetailProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "RetailProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
