import { prisma } from './db';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'fashion-admin-secret-jwt-key-2026';

let adminToken = '';
let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, extraInfo?: any) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, extraInfo ? extraInfo : '');
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 Starting End-to-End Test Suite for 3 Admin Modules:');
  console.log('   1. Retailer Store Approvals (/admin/retailers)');
  console.log('   2. Designer Submissions Approval (/admin/designers)');
  console.log('   3. Executive Dashboard (/admin/dashboard)');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SECTION 1: Health & Authentication
    // -------------------------------------------------------------
    console.log('--- SECTION 1: Security & Authentication Enforcement ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.database === 'connected', 'Database is connected & healthy');

    // Security: Test unauthenticated calls
    const unauthRetailers = await fetch(`${BASE_URL}/api/admin/retailers`);
    assert(unauthRetailers.status === 401, 'Unauthenticated /api/admin/retailers returns 401');

    const unauthDesigners = await fetch(`${BASE_URL}/api/admin/designers`);
    assert(unauthDesigners.status === 401, 'Unauthenticated /api/admin/designers returns 401');

    const unauthDashboard = await fetch(`${BASE_URL}/api/admin/dashboard/overview`);
    assert(unauthDashboard.status === 401, 'Unauthenticated /api/admin/dashboard/overview returns 401');

    // Security: Test non-admin token
    const customerToken = jwt.sign({ email: 'customer@fashion.com', role: 'customer' }, JWT_SECRET);
    const forbiddenDashboard = await fetch(`${BASE_URL}/api/admin/dashboard/overview`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(forbiddenDashboard.status === 403, 'Non-admin token receives 403 Forbidden');

    // Admin Login
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fashionforeveryone.com',
        password: 'adminpassword123',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success && !!loginData.token, 'Admin login succeeded and returned JWT');
    adminToken = loginData.token;

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // -------------------------------------------------------------
    // SECTION 2: Retailer Store Approvals (/admin/retailers)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Admin Retailer Store Approvals (/admin/retailers) ---');

    // 2.1 Fetch All Retailer Stores
    const getRetailersRes = await fetch(`${BASE_URL}/api/admin/retailers`, { headers: authHeaders });
    const getRetailersData = await getRetailersRes.json();
    assert(getRetailersRes.status === 200, 'GET /api/admin/retailers returned 200 OK');
    assert(Array.isArray(getRetailersData.retailers) && getRetailersData.retailers.length >= 5, 'Retailers array contains >= 5 PostgreSQL records');
    assert(getRetailersData.stats && getRetailersData.stats.totalStores >= 5, 'Retailer stats totalStores count is valid');
    console.log(`    Total stores in DB: ${getRetailersData.stats.totalStores}, Pending: ${getRetailersData.stats.pendingCount}, Approved: ${getRetailersData.stats.approvedCount}`);

    // 2.2 Filter by Pending (ensure store_03 is pending for test flow)
    await prisma.storeSettings.update({
      where: { id: 'store_03' },
      data: { approvalStatus: 'Pending' },
    });

    const pendingRetailersRes = await fetch(`${BASE_URL}/api/admin/retailers?approvalStatus=Pending`, { headers: authHeaders });
    const pendingRetailersData = await pendingRetailersRes.json();
    assert(pendingRetailersData.retailers.every((r: any) => r.approvalStatus === 'Pending'), 'Filter by approvalStatus=Pending returns only pending stores');

    // 2.3 Search by store name "Avenue"
    const searchRetailerRes = await fetch(`${BASE_URL}/api/admin/retailers?search=Avenue`, { headers: authHeaders });
    const searchRetailerData = await searchRetailerRes.json();
    assert(searchRetailerData.retailers.some((r: any) => r.storeName.includes('Avenue')), 'Search "Avenue" returned matching store');

    // 2.4 Get Single Retailer by ID
    const singleRetailerRes = await fetch(`${BASE_URL}/api/admin/retailers/store_02`, { headers: authHeaders });
    const singleRetailerData = await singleRetailerRes.json();
    assert(singleRetailerRes.status === 200 && singleRetailerData.id === 'store_02', 'GET /api/admin/retailers/store_02 returned store details');
    assert(singleRetailerData.taxId === 'US-TAX-9920145', 'Store taxId matches PostgreSQL record');

    // 2.5 Approve Retailer Store Application (store_03: Bloom & Thread)
    const store03Before = await prisma.storeSettings.findUnique({ where: { id: 'store_03' } });
    console.log(`    Store 03 Before: Name=${store03Before?.storeName}, Approval=${store03Before?.approvalStatus}`);

    const approveRetailerRes = await fetch(`${BASE_URL}/api/admin/retailers/store_03/approval`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ approvalStatus: 'Approved' }),
    });
    const approveRetailerData = await approveRetailerRes.json();
    assert(approveRetailerRes.status === 200 && approveRetailerData.success, 'PATCH /api/admin/retailers/:id/approval returned success');
    assert(approveRetailerData.retailer.approvalStatus === 'Approved', 'Retailer store approvalStatus is updated to Approved');

    // Direct DB Verification in PostgreSQL
    const store03InDb = await prisma.storeSettings.findUnique({ where: { id: 'store_03' } });
    assert(store03InDb?.approvalStatus === 'Approved', 'Store approvalStatus is persisted as Approved in PostgreSQL');

    // 2.6 Reject Retailer Store Application (store_04: Velvet & Oak)
    const rejectRetailerRes = await fetch(`${BASE_URL}/api/admin/retailers/store_04/approval`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        approvalStatus: 'Rejected',
        rejectionReason: 'Missing commercial general liability insurance documentation.',
      }),
    });
    const rejectRetailerData = await rejectRetailerRes.json();
    assert(rejectRetailerRes.status === 200 && rejectRetailerData.success, 'PATCH /api/admin/retailers/:id/approval reject returned success');
    assert(rejectRetailerData.retailer.approvalStatus === 'Rejected', 'Retailer store approvalStatus is Rejected');

    // Direct DB Verification
    const store04InDb = await prisma.storeSettings.findUnique({ where: { id: 'store_04' } });
    assert(store04InDb?.approvalStatus === 'Rejected', 'store_04 approvalStatus persisted as Rejected in PostgreSQL');
    assert(store04InDb?.rejectionReason?.includes('liability insurance'), 'store_04 rejectionReason persisted in PostgreSQL');

    // 2.7 Update Retailer Account Status
    const statusRetailerRes = await fetch(`${BASE_URL}/api/admin/retailers/store_05/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Active' }),
    });
    const statusRetailerData = await statusRetailerRes.json();
    assert(statusRetailerRes.status === 200 && statusRetailerData.retailer.status === 'Active', 'Retailer store status updated to Active');

    // Direct DB Verification
    const store05InDb = await prisma.storeSettings.findUnique({ where: { id: 'store_05' } });
    assert(store05InDb?.status === 'Active', 'store_05 status persisted as Active in PostgreSQL');

    // 2.8 Create & Delete Retailer Store in PostgreSQL
    const uniqueTax = `TAX-TEST-${Date.now().toString().slice(-4)}`;
    const createRetailerRes = await fetch(`${BASE_URL}/api/admin/retailers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        storeName: 'Maison Vivienne Soho',
        managerName: 'Vivienne St. Cloud',
        managerEmail: 'vivienne@maisonsoho.com',
        managerPhone: '+1 (212) 555-7788',
        address: '420 West Broadway, New York, NY 10012',
        taxId: uniqueTax,
        businessType: 'Luxury Boutique',
        approvalStatus: 'Approved',
        status: 'Active',
      }),
    });
    const createRetailerData = await createRetailerRes.json();
    assert(createRetailerRes.status === 201 && createRetailerData.success, 'POST /api/admin/retailers created store in PostgreSQL');
    const createdStoreId = createRetailerData.retailer.id;

    const dbCreatedStore = await prisma.storeSettings.findUnique({ where: { id: createdStoreId } });
    assert(dbCreatedStore !== null && dbCreatedStore.taxId === uniqueTax, 'Created store verified directly in PostgreSQL');

    // Delete created store
    const deleteRetailerRes = await fetch(`${BASE_URL}/api/admin/retailers/${createdStoreId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(deleteRetailerRes.status === 200, 'DELETE /api/admin/retailers/:id deleted store');
    const dbDeletedStore = await prisma.storeSettings.findUnique({ where: { id: createdStoreId } });
    assert(dbDeletedStore === null, 'Deleted store confirmed removed from PostgreSQL');

    // -------------------------------------------------------------
    // SECTION 3: Designer Submissions Approval (/admin/designers)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Admin Designer Submissions Approval (/admin/designers) ---');

    // 3.1 Fetch All Designer Submissions & Stats
    const getDesignersRes = await fetch(`${BASE_URL}/api/admin/designers`, { headers: authHeaders });
    const getDesignersData = await getDesignersRes.json();
    assert(getDesignersRes.status === 200, 'GET /api/admin/designers returned 200 OK');
    assert(Array.isArray(getDesignersData.designers) && getDesignersData.designers.length >= 5, 'Designers list contains >= 5 records');
    assert(Array.isArray(getDesignersData.designs) && getDesignersData.designs.length >= 5, 'Designs list contains >= 5 records');
    assert(getDesignersData.stats && getDesignersData.stats.totalDesigns >= 5, 'Designer stats totalDesigns count is valid');
    console.log(`    Total Designers: ${getDesignersData.stats.totalDesigners}, Verified: ${getDesignersData.stats.verifiedDesigners}, Designs: ${getDesignersData.stats.totalDesigns}, Showcase Approved: ${getDesignersData.stats.approvedDesigns}`);

    // 3.2 Filter Design Submissions by Pending
    await prisma.designer.update({
      where: { id: 'des_4' },
      data: { verified: false, approvalStatus: 'Pending' },
    });
    await prisma.design.update({
      where: { id: 'design_04' },
      data: { approvalStatus: 'Pending', inStock: false },
    });

    const pendingDesignsRes = await fetch(`${BASE_URL}/api/admin/designers?type=designs&approvalStatus=Pending`, { headers: authHeaders });
    const pendingDesignsData = await pendingDesignsRes.json();
    assert(pendingDesignsData.designs.every((d: any) => d.approvalStatus === 'Pending'), 'Filter type=designs&approvalStatus=Pending returns only pending designs');

    // 3.3 Search Designs
    const searchDesignRes = await fetch(`${BASE_URL}/api/admin/designers?search=Kimono`, { headers: authHeaders });
    const searchDesignData = await searchDesignRes.json();
    assert(searchDesignData.designs.some((d: any) => d.title.includes('Kimono')), 'Search "Kimono" returned matching design');

    // 3.4 Approve Designer Application (des_4: Julian Saint-Laurent)
    const des4Before = await prisma.designer.findUnique({ where: { id: 'des_4' } });
    console.log(`    Designer 04 Before: Name=${des4Before?.name}, Verified=${des4Before?.verified}, Approval=${des4Before?.approvalStatus}`);

    const approveDesignerRes = await fetch(`${BASE_URL}/api/admin/designers/des_4/approval`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ approvalStatus: 'Approved' }),
    });
    const approveDesignerData = await approveDesignerRes.json();
    assert(approveDesignerRes.status === 200 && approveDesignerData.success, 'PATCH /api/admin/designers/:id/approval returned success');
    assert(approveDesignerData.designer.verified === true, 'Approved designer is now verified: true');
    assert(approveDesignerData.designer.approvalStatus === 'Approved', 'Designer approvalStatus is Approved');

    // Direct DB Verification
    const des4InDb = await prisma.designer.findUnique({ where: { id: 'des_4' } });
    assert(des4InDb?.verified === true, 'des_4 verified=true persisted in PostgreSQL');
    assert(des4InDb?.approvalStatus === 'Approved', 'des_4 approvalStatus=Approved persisted in PostgreSQL');

    // 3.5 Approve Design Submission (design_04: Kimono Coat)
    const approveDesignRes = await fetch(`${BASE_URL}/api/admin/designers/designs/design_04/approval`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ approvalStatus: 'Approved' }),
    });
    const approveDesignData = await approveDesignRes.json();
    assert(approveDesignRes.status === 200 && approveDesignData.success, 'PATCH /api/admin/designers/designs/:id/approval returned success');
    assert(approveDesignData.design.approvalStatus === 'Approved', 'Design approvalStatus is updated to Approved');
    assert(approveDesignData.design.inStock === true, 'Approved design is active in public showcase');

    // Direct DB Verification
    const design04InDb = await prisma.design.findUnique({ where: { id: 'design_04' } });
    assert(design04InDb?.approvalStatus === 'Approved', 'design_04 approvalStatus=Approved persisted in PostgreSQL');
    assert(design04InDb?.inStock === true, 'design_04 inStock=true persisted in PostgreSQL');

    // 3.6 Reject Design Submission (design_05)
    const rejectDesignRes = await fetch(`${BASE_URL}/api/admin/designers/designs/design_05/approval`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        approvalStatus: 'Rejected',
        rejectionReason: 'Fabric tension and stitch quality do not comply with luxury showcase requirements.',
      }),
    });
    const rejectDesignData = await rejectDesignRes.json();
    assert(rejectDesignRes.status === 200 && rejectDesignData.success, 'Reject design submission returned success');
    assert(rejectDesignData.design.approvalStatus === 'Rejected', 'Design approvalStatus is Rejected');

    // Direct DB Verification
    const design05InDb = await prisma.design.findUnique({ where: { id: 'design_05' } });
    assert(design05InDb?.approvalStatus === 'Rejected', 'design_05 approvalStatus=Rejected persisted in PostgreSQL');
    assert(design05InDb?.rejectionReason?.includes('Fabric tension'), 'design_05 rejectionReason persisted in PostgreSQL');

    // 3.7 Create & Delete Designer in PostgreSQL
    const createDesRes = await fetch(`${BASE_URL}/api/admin/designers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Camille Dubois',
        handle: '@camille_dubois',
        bio: 'Bespoke silk gowns and sustainable embroidery master.',
        verified: true,
        approvalStatus: 'Approved',
        status: 'Active',
      }),
    });
    const createDesData = await createDesRes.json();
    assert(createDesRes.status === 201 && createDesData.success, 'POST /api/admin/designers created designer');
    const createdDesId = createDesData.designer.id;

    const dbCreatedDes = await prisma.designer.findUnique({ where: { id: createdDesId } });
    assert(dbCreatedDes !== null && dbCreatedDes.name === 'Camille Dubois', 'Created designer verified directly in PostgreSQL');

    // Delete created designer
    const deleteDesRes = await fetch(`${BASE_URL}/api/admin/designers/${createdDesId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(deleteDesRes.status === 200, 'DELETE /api/admin/designers/:id deleted designer');

    const dbDeletedDes = await prisma.designer.findUnique({ where: { id: createdDesId } });
    assert(dbDeletedDes === null, 'Deleted designer verified removed from PostgreSQL');

    // -------------------------------------------------------------
    // SECTION 4: Executive Dashboard (/admin/dashboard)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Executive Dashboard (/admin/dashboard) ---');

    // 4.1 Fetch Executive Dashboard Overview
    const dashboardRes = await fetch(`${BASE_URL}/api/admin/dashboard/overview`, { headers: authHeaders });
    const dashboardData = await dashboardRes.json();
    assert(dashboardRes.status === 200, 'GET /api/admin/dashboard/overview returned 200 OK');

    // 4.2 Verify Real PostgreSQL Aggregations
    const dbOrderCount = await prisma.customerOrder.count();
    const dbUserCount = await prisma.userProfile.count();
    const dbStoreCount = await prisma.storeSettings.count();
    const dbDesignerCount = await prisma.designer.count();
    const dbDesignCount = await prisma.design.count();
    const dbProductCount = await prisma.retailProduct.count();

    assert(dashboardData.summary.totalOrders === dbOrderCount, `totalOrders (${dashboardData.summary.totalOrders}) matches PostgreSQL CustomerOrder count (${dbOrderCount})`);
    assert(dashboardData.summary.totalUsers === dbUserCount, `totalUsers (${dashboardData.summary.totalUsers}) matches PostgreSQL UserProfile count (${dbUserCount})`);
    assert(dashboardData.summary.totalRetailers === dbStoreCount, `totalRetailers (${dashboardData.summary.totalRetailers}) matches PostgreSQL StoreSettings count (${dbStoreCount})`);
    assert(dashboardData.summary.totalDesigners === dbDesignerCount, `totalDesigners (${dashboardData.summary.totalDesigners}) matches PostgreSQL Designer count (${dbDesignerCount})`);
    assert(dashboardData.summary.totalDesigns === dbDesignCount, `totalDesigns (${dashboardData.summary.totalDesigns}) matches PostgreSQL Design count (${dbDesignCount})`);
    assert(dashboardData.summary.totalProducts === dbProductCount, `totalProducts (${dashboardData.summary.totalProducts}) matches PostgreSQL RetailProduct count (${dbProductCount})`);
    assert(dashboardData.summary.totalRevenue > 0, `totalRevenue ($${dashboardData.summary.totalRevenue}) is positive and calculated from live orders`);

    // 4.3 Verify Pending Breakdown and Grand Total
    const calculatedPendingSum =
      dashboardData.pendingBreakdown.users +
      dashboardData.pendingBreakdown.retailers +
      dashboardData.pendingBreakdown.designers +
      dashboardData.pendingBreakdown.designs;

    assert(
      dashboardData.summary.pendingApprovalsTotal === calculatedPendingSum,
      `pendingApprovalsTotal (${dashboardData.summary.pendingApprovalsTotal}) equals sum of category breakdowns (${calculatedPendingSum})`
    );

    // 4.4 Verify Recent Activity & Orders
    assert(Array.isArray(dashboardData.recentActivity) && dashboardData.recentActivity.length > 0, 'recentActivity array contains live chronological database events');
    assert(Array.isArray(dashboardData.recentOrders) && dashboardData.recentOrders.length > 0, 'recentOrders array contains latest customer orders with items');
    assert(Array.isArray(dashboardData.pendingQueue), 'pendingQueue array is populated');

    console.log('    Executive Summary Metrics:');
    console.log(`      GMV / Revenue: $${dashboardData.summary.totalRevenue}`);
    console.log(`      Total Orders: ${dashboardData.summary.totalOrders} (Avg: $${dashboardData.summary.avgOrderValue})`);
    console.log(`      Total Users: ${dashboardData.summary.totalUsers} (Active: ${dashboardData.summary.activeUsers})`);
    console.log(`      Retailer Stores: ${dashboardData.summary.totalRetailers} (Approved: ${dashboardData.summary.approvedRetailers})`);
    console.log(`      Designers: ${dashboardData.summary.totalDesigners} (Verified: ${dashboardData.summary.verifiedDesigners})`);
    console.log(`      Runway Designs: ${dashboardData.summary.totalDesigns}`);
    console.log(`      Pending Approvals Total: ${dashboardData.summary.pendingApprovalsTotal}`);

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests} / ${totalTests} INTEGRATION TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
