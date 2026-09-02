import { Router } from 'express';
import { adminDashboardController } from '../../controllers/adminDashboardController';
import { verifyAdminToken } from '../../middleware/adminAuth';

const router = Router();

// Protect all admin dashboard endpoints
router.use(verifyAdminToken);

// Executive overview
router.get('/overview', adminDashboardController.getOverview);

export default router;
