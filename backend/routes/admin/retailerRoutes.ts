import { Router } from 'express';
import { adminRetailerController } from '../../controllers/adminRetailerController';
import { verifyAdminToken } from '../../middleware/adminAuth';

const router = Router();

// Protect all admin retailer endpoints
router.use(verifyAdminToken);

// Live stats
router.get('/stats', adminRetailerController.getStats);

// List & filter retailer stores
router.get('/', adminRetailerController.getAll);

// Single retailer store details
router.get('/:id', adminRetailerController.getById);

// Update retailer approval status (Approve / Reject)
router.patch('/:id/approval', adminRetailerController.updateApproval);

// Update retailer account status (Active / Inactive / Suspended)
router.patch('/:id/status', adminRetailerController.updateStatus);

// Create new retailer store application
router.post('/', adminRetailerController.create);

// Update retailer store details
router.put('/:id', adminRetailerController.update);

// Delete retailer store
router.delete('/:id', adminRetailerController.delete);

export default router;
