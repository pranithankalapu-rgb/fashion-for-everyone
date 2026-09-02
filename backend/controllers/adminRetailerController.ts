import type { Response } from 'express';
import type { AuthenticatedAdminRequest } from '../middleware/adminAuth';
import { adminRetailerService } from '../services/adminRetailerService';
import { sanitizeString, sanitizeObject } from '../security';

export const adminRetailerController = {
  /**
   * GET /api/admin/retailers
   */
  async getAll(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const approvalStatus = req.query.approvalStatus ? sanitizeString(req.query.approvalStatus as string) : undefined;
      const status = req.query.status ? sanitizeString(req.query.status as string) : undefined;
      const search = req.query.search ? sanitizeString(req.query.search as string) : undefined;
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortOrder = (req.query.sortOrder as any) === 'asc' ? 'asc' : 'desc';
      const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10)) : undefined;
      const offset = req.query.offset ? Math.max(0, parseInt(req.query.offset as string, 10)) : undefined;

      const result = await adminRetailerService.getAllRetailers({
        approvalStatus,
        status,
        search,
        sortBy,
        sortOrder,
        limit,
        offset,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('Error fetching admin retailers:', err);
      return res.status(500).json({ error: 'Failed to retrieve retailer stores from PostgreSQL' });
    }
  },

  /**
   * GET /api/admin/retailers/stats
   */
  async getStats(_req: AuthenticatedAdminRequest, res: Response) {
    try {
      const stats = await adminRetailerService.getRetailerStats();
      return res.json(stats);
    } catch (err: any) {
      console.error('Error fetching admin retailer stats:', err);
      return res.status(500).json({ error: 'Failed to compute retailer statistics' });
    }
  },

  /**
   * GET /api/admin/retailers/:id
   */
  async getById(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Retailer ID is required' });

      const retailer = await adminRetailerService.getRetailerById(id);
      if (!retailer) return res.status(404).json({ error: `Retailer '${id}' not found` });

      return res.json(retailer);
    } catch (err: any) {
      console.error('Error fetching retailer by ID:', err);
      return res.status(500).json({ error: 'Failed to retrieve retailer details' });
    }
  },

  /**
   * PATCH /api/admin/retailers/:id/approval
   */
  async updateApproval(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const { approvalStatus, rejectionReason } = req.body;

      if (!id) return res.status(400).json({ error: 'Retailer ID is required' });
      if (!approvalStatus) return res.status(400).json({ error: 'Approval status is required' });

      const updated = await adminRetailerService.updateRetailerApproval(
        id,
        approvalStatus,
        rejectionReason
      );

      if (!updated) return res.status(404).json({ error: `Retailer '${id}' not found` });

      return res.json({
        success: true,
        message: `Retailer store ${updated.storeName} approval status updated to '${updated.approvalStatus}'`,
        retailer: updated,
      });
    } catch (err: any) {
      console.error('Error updating retailer approval status:', err);
      const isValidationError = err.message && (err.message.includes('Invalid') || err.message.includes('required'));
      return res.status(isValidationError ? 400 : 500).json({
        error: err.message || 'Failed to update retailer approval status',
      });
    }
  },

  /**
   * PATCH /api/admin/retailers/:id/status
   */
  async updateStatus(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const { status } = req.body;

      if (!id) return res.status(400).json({ error: 'Retailer ID is required' });
      if (!status) return res.status(400).json({ error: 'Status is required' });

      const updated = await adminRetailerService.updateRetailerStatus(id, status);
      if (!updated) return res.status(404).json({ error: `Retailer '${id}' not found` });

      return res.json({
        success: true,
        message: `Retailer store ${updated.storeName} status updated to '${updated.status}'`,
        retailer: updated,
      });
    } catch (err: any) {
      console.error('Error updating retailer status:', err);
      return res.status(400).json({ error: err.message || 'Failed to update status' });
    }
  },

  /**
   * POST /api/admin/retailers
   */
  async create(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const sanitized = sanitizeObject(req.body);
      const created = await adminRetailerService.createRetailer(sanitized);

      return res.status(201).json({
        success: true,
        message: `Retailer store '${created.storeName}' created in PostgreSQL`,
        retailer: created,
      });
    } catch (err: any) {
      console.error('Error creating retailer:', err);
      return res.status(400).json({ error: err.message || 'Failed to create retailer' });
    }
  },

  /**
   * PUT /api/admin/retailers/:id
   */
  async update(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Retailer ID is required' });

      const sanitized = sanitizeObject(req.body);
      const updated = await adminRetailerService.updateRetailer(id, sanitized);

      if (!updated) return res.status(404).json({ error: `Retailer '${id}' not found` });

      return res.json({
        success: true,
        message: `Retailer store '${updated.storeName}' updated`,
        retailer: updated,
      });
    } catch (err: any) {
      console.error('Error updating retailer:', err);
      return res.status(400).json({ error: err.message || 'Failed to update retailer' });
    }
  },

  /**
   * DELETE /api/admin/retailers/:id
   */
  async delete(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'Retailer ID is required' });

      const deleted = await adminRetailerService.deleteRetailer(id);
      if (!deleted) return res.status(404).json({ error: `Retailer '${id}' not found` });

      return res.json({
        success: true,
        message: `Retailer store '${deleted.storeName}' deleted from PostgreSQL`,
        retailer: deleted,
      });
    } catch (err: any) {
      console.error('Error deleting retailer:', err);
      return res.status(500).json({ error: 'Failed to delete retailer from PostgreSQL' });
    }
  },
};
