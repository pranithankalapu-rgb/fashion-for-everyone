import type { Response } from 'express';
import type { AuthenticatedAdminRequest } from '../middleware/adminAuth';
import { adminDashboardService } from '../services/adminDashboardService';

export const adminDashboardController = {
  /**
   * GET /api/admin/dashboard/overview
   * Returns aggregated executive metrics, pending queue, and recent activity from PostgreSQL.
   */
  async getOverview(_req: AuthenticatedAdminRequest, res: Response) {
    try {
      const overview = await adminDashboardService.getExecutiveOverview();
      return res.json(overview);
    } catch (err: any) {
      console.error('Error fetching admin executive dashboard overview:', err);
      return res.status(500).json({ error: 'Failed to aggregate executive dashboard metrics from PostgreSQL' });
    }
  },
};
