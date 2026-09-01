import type { Response } from 'express';
import type { AuthenticatedAdminRequest } from '../middleware/adminAuth';
import { adminOrderService } from '../services/adminOrderService';
import { sanitizeString } from '../security';

export const adminOrderController = {
  /**
   * GET /api/admin/orders
   * Supports ?status, ?search, ?sortBy, ?sortOrder, ?limit, ?offset
   */
  async getAll(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const status = req.query.status ? sanitizeString(req.query.status as string) : undefined;
      const search = req.query.search ? sanitizeString(req.query.search as string) : undefined;
      const sortBy = (req.query.sortBy as any) || 'id';
      const sortOrder = (req.query.sortOrder as any) === 'asc' ? 'asc' : 'desc';
      const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10)) : undefined;
      const offset = req.query.offset ? Math.max(0, parseInt(req.query.offset as string, 10)) : undefined;

      const result = await adminOrderService.getAllOrders({
        status,
        search,
        sortBy,
        sortOrder,
        limit,
        offset,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('Error fetching admin orders:', err);
      return res.status(500).json({ error: 'Failed to retrieve orders from PostgreSQL' });
    }
  },

  /**
   * GET /api/admin/orders/stats
   * Returns summary counts and revenue
   */
  async getStats(_req: AuthenticatedAdminRequest, res: Response) {
    try {
      const stats = await adminOrderService.getOrderStats();
      return res.json(stats);
    } catch (err: any) {
      console.error('Error fetching admin order stats:', err);
      return res.status(500).json({ error: 'Failed to compute order statistics' });
    }
  },

  /**
   * GET /api/admin/orders/:id
   */
  async getById(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Order ID parameter is required' });
      }

      const order = await adminOrderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: `Order '${id}' not found` });
      }

      return res.json(order);
    } catch (err: any) {
      console.error('Error fetching order by ID:', err);
      return res.status(500).json({ error: 'Failed to retrieve order details' });
    }
  },

  /**
   * PATCH /api/admin/orders/:id/status
   * Body: { status: string, trackingNumber?: string }
   */
  async updateStatus(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const status = req.body.status;
      const trackingNumber = req.body.trackingNumber;

      if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      if (!status) {
        return res.status(400).json({ error: 'Status field is required' });
      }

      const updated = await adminOrderService.updateOrderStatus(id, status, trackingNumber);

      if (!updated) {
        return res.status(404).json({ error: `Order '${id}' not found` });
      }

      return res.json({
        success: true,
        message: `Order status updated to '${updated.status}'`,
        order: updated,
      });
    } catch (err: any) {
      console.error('Error updating admin order status:', err);
      const isValidationError = err.message && err.message.includes('Invalid status');
      return res.status(isValidationError ? 400 : 500).json({
        error: err.message || 'Failed to update order status',
      });
    }
  },

  /**
   * DELETE /api/admin/orders/:id
   */
  async delete(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const deleted = await adminOrderService.deleteOrder(id);
      if (!deleted) {
        return res.status(404).json({ error: `Order '${id}' not found` });
      }

      return res.json({
        success: true,
        message: `Order ${deleted.orderNumber} successfully deleted`,
        deletedOrder: deleted,
      });
    } catch (err: any) {
      console.error('Error deleting admin order:', err);
      return res.status(500).json({ error: 'Failed to delete order from PostgreSQL' });
    }
  },
};
