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
  console.log('\n======================================================');
  console.log('🧪 Starting Admin Users & Role Approvals End-to-End Test Suite');
  console.log('======================================================\n');

  try {
    // Test 1: Health check
    console.log('--- 1. Health & Server Status ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.database === 'connected', 'Database is connected & healthy');

    // Test 2: Security - Unauthorized access to /api/admin/users
    console.log('\n--- 2. Security & Authorization Enforcement ---');
    const unauthRes = await fetch(`${BASE_URL}/api/admin/users`);
    assert(unauthRes.status === 401, 'Unauthenticated request receives 401 Unauthorized');

    const fakeToken = jwt.sign({ email: 'user@example.com', role: 'customer' }, JWT_SECRET);
    const forbiddenRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    assert(forbiddenRes.status === 403, 'Non-admin JWT receives 403 Forbidden');

    // Test 3: Admin Login
    console.log('\n--- 3. Admin Authentication Login ---');
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

    // Test 4: Retrieve All Users & Live Stats
    console.log('\n--- 4. Retrieve All Users & Live KPI Stats ---');
    const getUsersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders });
    const getUsersData = await getUsersRes.json();
    assert(getUsersRes.status === 200, 'GET /api/admin/users returned 200 OK');
    assert(Array.isArray(getUsersData.users) && getUsersData.users.length >= 8, 'Users array contains >= 8 PostgreSQL records');
    assert(getUsersData.stats && getUsersData.stats.totalUsers >= 8, 'Stats contain valid totalUsers metric');
    console.log(`    Total users in DB: ${getUsersData.stats.totalUsers}, Pending approvals: ${getUsersData.stats.pendingApprovals}`);

    // Test 5: Search & Filter functionality
    console.log('\n--- 5. Search & Filtering Logic ---');
    // Search by name "Sophia"
    const searchRes = await fetch(`${BASE_URL}/api/admin/users?search=Sophia`, { headers: authHeaders });
    const searchData = await searchRes.json();
    assert(searchData.users.some((u: any) => u.name.includes('Sophia')), 'Search by name "Sophia" returned matching user');

    // Filter by role "designer"
    const roleRes = await fetch(`${BASE_URL}/api/admin/users?role=designer`, { headers: authHeaders });
    const roleData = await roleRes.json();
    assert(roleData.users.every((u: any) => u.role.toLowerCase() === 'designer'), 'Role filter returns only designers');

    // Filter by approval status "Pending"
    const pendingRes = await fetch(`${BASE_URL}/api/admin/users?approvalStatus=Pending`, { headers: authHeaders });
    const pendingData = await pendingRes.json();
    assert(pendingData.users.every((u: any) => u.approvalStatus === 'Pending'), 'Approval status filter returns only pending users');

    // Test 6: Get User by ID
    console.log('\n--- 6. Get User Details by ID ---');
    const userDetailRes = await fetch(`${BASE_URL}/api/admin/users/user_01`, { headers: authHeaders });
    const userDetailData = await userDetailRes.json();
    assert(userDetailRes.status === 200 && userDetailData.id === 'user_01', 'GET /api/admin/users/user_01 returns user profile');
    assert(userDetailData.name === 'Sophia Laurent', 'User profile name matches Sophia Laurent');
    assert(userDetailData.measurements && userDetailData.measurements.heightCm === 172, 'User profile measurements are retrieved correctly');

    // Test 7: Approve User Role Request Flow
    console.log('\n--- 7. Approve Role Upgrade Request (Marcus Vance -> Designer) ---');
    // Before: user_03 is customer, requestedRole: designer, approvalStatus: Pending
    const marcusBefore = await prisma.userProfile.findUnique({ where: { id: 'user_03' } });
    console.log(`    Marcus Before: Role=${marcusBefore?.role}, RequestedRole=${marcusBefore?.requestedRole}, Approval=${marcusBefore?.approvalStatus}`);

    const approveRes = await fetch(`${BASE_URL}/api/admin/users/user_03/approval`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        approvalStatus: 'Approved',
        approvedRole: 'designer',
      }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200 && approveData.success, 'PATCH /approval returns success');
    assert(approveData.user.role === 'designer', 'Approved user role is upgraded to designer');
    assert(approveData.user.approvalStatus === 'Approved', 'Approved user status is Approved');
    assert(approveData.user.requestedRole === null, 'Requested role cleared after approval');

    // Direct DB Verification
    const marcusInDb = await prisma.userProfile.findUnique({ where: { id: 'user_03' } });
    assert(marcusInDb?.role === 'designer', 'Database record role is persisted as designer in PostgreSQL');
    assert(marcusInDb?.approvalStatus === 'Approved', 'Database record approvalStatus is persisted as Approved in PostgreSQL');

    // Check that Designer record exists and verified is true
    const designerInDb = await prisma.designer.findFirst({ where: { name: { contains: 'Marcus Vance', mode: 'insensitive' } } });
    assert(designerInDb !== null && designerInDb.verified === true, 'Designer record created and verified in PostgreSQL');

    // Test 8: Reject User Application Flow
    console.log('\n--- 8. Reject Role Application (Aria Chen) ---');
    const rejectRes = await fetch(`${BASE_URL}/api/admin/users/user_04/approval`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        approvalStatus: 'Rejected',
        rejectionReason: 'Business permit documentation could not be verified by platform compliance team.',
      }),
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200 && rejectData.success, 'PATCH /approval reject returns success');
    assert(rejectData.user.approvalStatus === 'Rejected', 'Rejected user approval status is Rejected');
    assert(rejectData.user.rejectionReason?.includes('Business permit'), 'Rejection reason is recorded');

    // Direct DB Verification
    const ariaInDb = await prisma.userProfile.findUnique({ where: { id: 'user_04' } });
    assert(ariaInDb?.approvalStatus === 'Rejected', 'Aria DB record approvalStatus persisted as Rejected in PostgreSQL');
    assert(ariaInDb?.rejectionReason?.includes('Business permit'), 'Aria DB record rejectionReason persisted in PostgreSQL');

    // Test 9: Change Role Directly
    console.log('\n--- 9. Change Role Directly (user_01 -> Retailer then back to Customer) ---');
    const changeRoleRes = await fetch(`${BASE_URL}/api/admin/users/user_01/role`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ role: 'retailer' }),
    });
    const changeRoleData = await changeRoleRes.json();
    assert(changeRoleRes.status === 200 && changeRoleData.user.role === 'retailer', 'User role updated to retailer');

    const dbUser01 = await prisma.userProfile.findUnique({ where: { id: 'user_01' } });
    assert(dbUser01?.role === 'retailer', 'user_01 persisted as retailer in PostgreSQL');

    // Restore to customer
    await fetch(`${BASE_URL}/api/admin/users/user_01/role`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ role: 'customer' }),
    });

    // Test 10: Update User Account Status (Active/Inactive/Suspended)
    console.log('\n--- 10. Update User Account Status ---');
    const statusRes = await fetch(`${BASE_URL}/api/admin/users/user_07/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Active' }),
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200 && statusData.user.status === 'Active', 'user_07 account status updated to Active');

    const dbUser07 = await prisma.userProfile.findUnique({ where: { id: 'user_07' } });
    assert(dbUser07?.status === 'Active', 'user_07 persisted as Active in PostgreSQL');

    // Test 11: Create New User in PostgreSQL
    console.log('\n--- 11. Create New User in PostgreSQL ---');
    const uniqueEmail = `test.user.${Date.now()}@fashiontest.com`;
    const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Giselle Monet',
        email: uniqueEmail,
        role: 'designer',
        approvalStatus: 'Approved',
        status: 'Active',
        phone: '+1 (555) 999-1234',
        bio: 'Parisian bridalwear designer and atelier master.',
        skinTone: 'Fair Porcelain',
        undertone: 'Cool',
        hairColor: 'Blonde',
        bodyShape: 'Hourglass',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success, 'POST /api/admin/users created new user');
    const createdUserId = createData.user.id;
    assert(createData.user.name === 'Giselle Monet', 'Created user name matches');

    // Direct DB Verification
    const dbCreatedUser = await prisma.userProfile.findUnique({ where: { id: createdUserId } });
    assert(dbCreatedUser !== null && dbCreatedUser.email === uniqueEmail, 'New user verified directly in PostgreSQL');

    // Test 12: Update User Profile Details
    console.log('\n--- 12. Update User Profile Details ---');
    const updateRes = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        bio: 'Updated bio: International couture winner 2026.',
        phone: '+1 (555) 888-9999',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.user.bio.includes('International couture winner'), 'User details updated');

    // Test 13: Delete User from PostgreSQL
    console.log('\n--- 13. Delete User from PostgreSQL ---');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteData.success, 'DELETE /api/admin/users deleted user');

    const dbDeletedCheck = await prisma.userProfile.findUnique({ where: { id: createdUserId } });
    assert(dbDeletedCheck === null, 'Deleted user verified removed from PostgreSQL');

    // Test 14: Refresh & Final Stats Check
    console.log('\n--- 14. Final Verification & Stats Recalculation ---');
    const finalStatsRes = await fetch(`${BASE_URL}/api/admin/users/stats`, { headers: authHeaders });
    const finalStatsData = await finalStatsRes.json();
    assert(finalStatsRes.status === 200, 'GET /api/admin/users/stats returned 200');
    assert(finalStatsData.totalUsers >= 8, 'Final stats totalUsers count verified');
    console.log('    Final DB Stats:', finalStatsData);

    console.log('\n======================================================');
    console.log(`🎉 ALL ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
