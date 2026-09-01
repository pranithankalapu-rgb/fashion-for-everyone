import { Router } from 'express';
import { verifyAdminToken } from '../../middleware/adminAuth';
import { adminOrderController } from '../../controllers/adminOrderController';

const router = Router();

// Protect all admin order endpoints with admin JWT token verification
router.use(verifyAdminToken);

// GET /api/admin/orders/stats - Retrieve aggregated summary KPIs
router.get('/stats', adminOrderController.getStats);

// GET /api/admin/orders - Retrieve all orders with search & status filters
router.get('/', adminOrderController.getAll);

// GET /api/admin/orders/:id - Retrieve order details by ID or orderNumber
router.get('/:id', adminOrderController.getById);

// PATCH /api/admin/orders/:id/status - Update order status and tracking details
router.patch('/:id/status', adminOrderController.updateStatus);

// DELETE /api/admin/orders/:id - Delete an order
router.delete('/:id', adminOrderController.delete);

export default router;
