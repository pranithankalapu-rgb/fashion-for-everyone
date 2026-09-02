import { Router } from 'express';
import { adminDesignerController } from '../../controllers/adminDesignerController';
import { verifyAdminToken } from '../../middleware/adminAuth';

const router = Router();

// Protect all admin designer endpoints
router.use(verifyAdminToken);

// Live stats
router.get('/stats', adminDesignerController.getStats);

// List & filter designer applications and design submissions
router.get('/', adminDesignerController.getAll);

// Single design submission details
router.get('/designs/:id', adminDesignerController.getDesignById);

// Single designer details
router.get('/:id', adminDesignerController.getDesignerById);

// Update designer approval status (Approve / Reject)
router.patch('/:id/approval', adminDesignerController.updateDesignerApproval);

// Update design submission approval status (Approve / Reject)
router.patch('/designs/:id/approval', adminDesignerController.updateDesignApproval);

// Create new designer
router.post('/', adminDesignerController.createDesigner);

// Update designer profile
router.put('/:id', adminDesignerController.updateDesigner);

// Delete designer
router.delete('/:id', adminDesignerController.deleteDesigner);

// Delete design submission
router.delete('/designs/:id', adminDesignerController.deleteDesign);

export default router;
