-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpiry" TIMESTAMP(3),
    "avatar" TEXT NOT NULL,
    "photoUrl" TEXT,
    "skinTone" TEXT NOT NULL DEFAULT 'Warm Golden',
    "undertone" TEXT NOT NULL DEFAULT 'Warm',
    "hairColor" TEXT NOT NULL DEFAULT 'Chestnut Brown',
    "bodyShape" TEXT NOT NULL DEFAULT 'Hourglass',
    "measurements" JSONB NOT NULL DEFAULT '{"heightCm": 170, "chestCm": 88, "waistCm": 68, "hipsCm": 94}',
    "selectedOccasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "styleVibes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completedOnboarding" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "approvalStatus" TEXT NOT NULL DEFAULT 'Approved',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "requestedRole" TEXT,
    "rejectionReason" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "resendAfter" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ColorVote" (
    "id" TEXT NOT NULL,
    "colorComboId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL DEFAULT 'up',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColorVote_pkey" PRIMARY KEY ("id")
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
    "approvalStatus" TEXT NOT NULL DEFAULT 'Approved',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "email" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "approvalStatus" TEXT NOT NULL DEFAULT 'Approved',
    "rejectionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "userLiked" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutfitLook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT '$',
    "shippingAddress" TEXT NOT NULL,
    "deliveryDate" TEXT,
    "trackingNumber" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "paymentMethod" TEXT DEFAULT 'Credit Card',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "paymentIntentId" TEXT,
    "paymentGateway" TEXT NOT NULL DEFAULT 'MOCK',
    "idempotencyKey" TEXT,

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
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80',
    "taxId" TEXT NOT NULL DEFAULT 'TAX-998877',
    "currency" TEXT NOT NULL DEFAULT '$',
    "managerName" TEXT NOT NULL,
    "managerEmail" TEXT NOT NULL,
    "managerPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "supportEmail" TEXT NOT NULL DEFAULT 'support@store.com',
    "supportPhone" TEXT NOT NULL DEFAULT '+1 (555) 000-0000',
    "autoFulfill" BOOLEAN NOT NULL DEFAULT false,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReport" BOOLEAN NOT NULL DEFAULT true,
    "approvalStatus" TEXT NOT NULL DEFAULT 'Approved',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "rejectionReason" TEXT,
    "businessType" TEXT DEFAULT 'Boutique Flagship',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL DEFAULT 'retailer',
    "recipientId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryOnJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "garmentId" TEXT,
    "userPhotoUrl" TEXT NOT NULL,
    "garmentUrl" TEXT,
    "resultUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'virtual-tryon-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOnJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_phone_key" ON "UserProfile"("phone");

-- CreateIndex
CREATE INDEX "VerificationCode_userId_type_idx" ON "VerificationCode"("userId", "type");

-- CreateIndex
CREATE INDEX "VerificationCode_target_idx" ON "VerificationCode"("target");

-- CreateIndex
CREATE UNIQUE INDEX "ColorVote_colorComboId_userId_key" ON "ColorVote"("colorComboId", "userId");

-- CreateIndex
CREATE INDEX "OutfitLook_occasion_idx" ON "OutfitLook"("occasion");

-- CreateIndex
CREATE INDEX "OutfitLook_likes_idx" ON "OutfitLook"("likes");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_orderNumber_key" ON "CustomerOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- AddForeignKey
ALTER TABLE "ColorVote" ADD CONSTRAINT "ColorVote_colorComboId_fkey" FOREIGN KEY ("colorComboId") REFERENCES "ColorCombo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreStock" ADD CONSTRAINT "StoreStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "RetailProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "RetailProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

