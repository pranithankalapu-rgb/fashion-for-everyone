import { Router } from 'express';
import { verifyAdminToken } from '../../middleware/adminAuth';
import { adminUserController } from '../../controllers/adminUserController';

const router = Router();

// Protect all admin user endpoints with admin JWT token verification
router.use(verifyAdminToken);

// GET /api/admin/users/stats - Retrieve aggregated summary KPIs
router.get('/stats', adminUserController.getStats);

// GET /api/admin/users - Retrieve all users with search, role, approval, status filters & sorting
router.get('/', adminUserController.getAll);

// GET /api/admin/users/:id - Retrieve user details by ID or email
router.get('/:id', adminUserController.getById);

// PATCH /api/admin/users/:id/approval - Approve or reject user registration/role application
router.patch('/:id/approval', adminUserController.updateApproval);

// PATCH /api/admin/users/:id/role - Update user role directly
router.patch('/:id/role', adminUserController.updateRole);

// PATCH /api/admin/users/:id/status - Update user account active/suspended status
router.patch('/:id/status', adminUserController.updateStatus);

// PUT /api/admin/users/:id - Update user details
router.put('/:id', adminUserController.updateUser);

// POST /api/admin/users - Create new user
router.post('/', adminUserController.create);

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', adminUserController.delete);

export default router;
