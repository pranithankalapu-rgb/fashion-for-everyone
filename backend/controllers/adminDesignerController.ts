import type { Response } from 'express';
import type { AuthenticatedAdminRequest } from '../middleware/adminAuth';
import { adminDesignerService } from '../services/adminDesignerService';
import { sanitizeString, sanitizeObject } from '../security';

export const adminDesignerController = {
  /**
   * GET /api/admin/designers
   * Supports ?type=all|designers|designs, ?approvalStatus, ?search, ?sortBy, ?sortOrder, ?limit, ?offset
   */
  async getAll(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const type = (req.query.type as any) || 'all';
      const approvalStatus = req.query.approvalStatus ? sanitizeString(req.query.approvalStatus as string) : undefined;
      const search = req.query.search ? sanitizeString(req.query.search as string) : undefined;
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortOrder = (req.query.sortOrder as any) === 'asc' ? 'asc' : 'desc';
      const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10)) : undefined;
      const offset = req.query.offset ? Math.max(0, parseInt(req.query.offset as string, 10)) : undefined;

      const result = await adminDesignerService.getAllSubmissions({
        type,
        approvalStatus,
        search,
        sortBy,
        sortOrder,
        limit,
        offset,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('Error fetching admin designer submissions:', err);
      return res.status(500).json({ error: 'Failed to retrieve designer submissions from PostgreSQL' });
    }
  },

  /**
   * GET /api/admin/designers/stats
   */
  async getStats(_req: AuthenticatedAdminRequest, res: Response) {
    try {
      const stats = await adminDesignerService.getDesignerStats();
      return res.json(stats);
    } catch (err: any) {
      console.error('Error fetching admin designer stats:', err);
      return res.status(500).json({ error: 'Failed to compute designer statistics' });
    }
  },

  /**
   * GET /api/admin/designers/:id
   */
  async getDesignerById(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Designer ID is required' });

      const designer = await adminDesignerService.getDesignerById(id);
      if (!designer) return res.status(404).json({ error: `Designer '${id}' not found` });

      return res.json(designer);
    } catch (err: any) {
      console.error('Error fetching designer by ID:', err);
      return res.status(500).json({ error: 'Failed to retrieve designer profile' });
    }
  },

  /**
   * GET /api/admin/designers/designs/:id
   */
  async getDesignById(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Design ID is required' });

      const design = await adminDesignerService.getDesignById(id);
      if (!design) return res.status(404).json({ error: `Design '${id}' not found` });

      return res.json(design);
    } catch (err: any) {
      console.error('Error fetching design by ID:', err);
      return res.status(500).json({ error: 'Failed to retrieve design submission' });
    }
  },

  /**
   * PATCH /api/admin/designers/:id/approval
   */
  async updateDesignerApproval(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const { approvalStatus, rejectionReason } = req.body;

      if (!id) return res.status(400).json({ error: 'Designer ID is required' });
      if (!approvalStatus) return res.status(400).json({ error: 'Approval status is required' });

      const updated = await adminDesignerService.updateDesignerApproval(
        id,
        approvalStatus,
        rejectionReason
      );

      if (!updated) return res.status(404).json({ error: `Designer '${id}' not found` });

      return res.json({
        success: true,
        message: `Designer ${updated.name} verification status updated to '${updated.approvalStatus}' (Verified: ${updated.verified})`,
        designer: updated,
      });
    } catch (err: any) {
      console.error('Error updating designer approval status:', err);
      const isValidationError = err.message && (err.message.includes('Invalid') || err.message.includes('required'));
      return res.status(isValidationError ? 400 : 500).json({
        error: err.message || 'Failed to update designer approval status',
      });
    }
  },

  /**
   * PATCH /api/admin/designers/designs/:id/approval
   */
  async updateDesignApproval(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const { approvalStatus, rejectionReason } = req.body;

      if (!id) return res.status(400).json({ error: 'Design ID is required' });
      if (!approvalStatus) return res.status(400).json({ error: 'Approval status is required' });

      const updated = await adminDesignerService.updateDesignApproval(
        id,
        approvalStatus,
        rejectionReason
      );

      if (!updated) return res.status(404).json({ error: `Design '${id}' not found` });

      return res.json({
        success: true,
        message: `Design '${updated.title}' approval status updated to '${updated.approvalStatus}' (Showcase Active: ${updated.inStock})`,
        design: updated,
      });
    } catch (err: any) {
      console.error('Error updating design approval status:', err);
      const isValidationError = err.message && (err.message.includes('Invalid') || err.message.includes('required'));
      return res.status(isValidationError ? 400 : 500).json({
        error: err.message || 'Failed to update design approval status',
      });
    }
  },

  /**
   * POST /api/admin/designers
   */
  async createDesigner(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const sanitized = sanitizeObject(req.body);
      const created = await adminDesignerService.createDesigner(sanitized);

      return res.status(201).json({
        success: true,
        message: `Designer '${created.name}' created successfully in PostgreSQL`,
        designer: created,
      });
    } catch (err: any) {
      console.error('Error creating designer:', err);
      return res.status(400).json({ error: err.message || 'Failed to create designer' });
    }
  },

  /**
   * PUT /api/admin/designers/:id
   */
  async updateDesigner(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Designer ID is required' });

      const sanitized = sanitizeObject(req.body);
      const updated = await adminDesignerService.updateDesigner(id, sanitized);

      if (!updated) return res.status(404).json({ error: `Designer '${id}' not found` });

      return res.json({
        success: true,
        message: `Designer '${updated.name}' profile updated`,
        designer: updated,
      });
    } catch (err: any) {
      console.error('Error updating designer:', err);
      return res.status(400).json({ error: err.message || 'Failed to update designer' });
    }
  },

  /**
   * DELETE /api/admin/designers/:id
   */
  async deleteDesigner(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Designer ID is required' });

      const deleted = await adminDesignerService.deleteDesigner(id);
      if (!deleted) return res.status(404).json({ error: `Designer '${id}' not found` });

      return res.json({
        success: true,
        message: `Designer '${deleted.name}' deleted from PostgreSQL`,
        designer: deleted,
      });
    } catch (err: any) {
      console.error('Error deleting designer:', err);
      return res.status(500).json({ error: 'Failed to delete designer from PostgreSQL' });
    }
  },

  /**
   * DELETE /api/admin/designers/designs/:id
   */
  async deleteDesign(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Design ID is required' });

      const deleted = await adminDesignerService.deleteDesign(id);
      if (!deleted) return res.status(404).json({ error: `Design '${id}' not found` });

      return res.json({
        success: true,
        message: `Design submission '${deleted.title}' deleted from PostgreSQL`,
        design: deleted,
      });
    } catch (err: any) {
      console.error('Error deleting design submission:', err);
      return res.status(500).json({ error: 'Failed to delete design submission from PostgreSQL' });
    }
  },
};
