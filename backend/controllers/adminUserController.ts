import type { Response } from 'express';
import type { AuthenticatedAdminRequest } from '../middleware/adminAuth';
import { adminUserService } from '../services/adminUserService';
import { sanitizeString, sanitizeObject } from '../security';

export const adminUserController = {
  /**
   * GET /api/admin/users
   * Supports ?role, ?approvalStatus, ?status, ?search, ?sortBy, ?sortOrder, ?limit, ?offset
   */
  async getAll(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const role = req.query.role ? sanitizeString(req.query.role as string) : undefined;
      const approvalStatus = req.query.approvalStatus ? sanitizeString(req.query.approvalStatus as string) : undefined;
      const status = req.query.status ? sanitizeString(req.query.status as string) : undefined;
      const search = req.query.search ? sanitizeString(req.query.search as string) : undefined;
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortOrder = (req.query.sortOrder as any) === 'asc' ? 'asc' : 'desc';
      const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10)) : undefined;
      const offset = req.query.offset ? Math.max(0, parseInt(req.query.offset as string, 10)) : undefined;

      const result = await adminUserService.getAllUsers({
        role,
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
      console.error('Error fetching admin users:', err);
      return res.status(500).json({ error: 'Failed to retrieve users from PostgreSQL' });
    }
  },

  /**
   * GET /api/admin/users/stats
   * Returns live summary KPI metrics
   */
  async getStats(_req: AuthenticatedAdminRequest, res: Response) {
    try {
      const stats = await adminUserService.getUserStats();
      return res.json(stats);
    } catch (err: any) {
      console.error('Error fetching admin user stats:', err);
      return res.status(500).json({ error: 'Failed to compute user statistics' });
    }
  },

  /**
   * GET /api/admin/users/:id
   */
  async getById(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'User ID parameter is required' });
      }

      const user = await adminUserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: `User '${id}' not found in PostgreSQL` });
      }

      return res.json(user);
    } catch (err: any) {
      console.error('Error fetching user by ID:', err);
      return res.status(500).json({ error: 'Failed to retrieve user details' });
    }
  },

  /**
   * PATCH /api/admin/users/:id/approval
   * Body: { approvalStatus: 'Approved' | 'Rejected', rejectionReason?: string, approvedRole?: string }
   */
  async updateApproval(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const { approvalStatus, rejectionReason, approvedRole } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      if (!approvalStatus) {
        return res.status(400).json({ error: 'Approval status field is required' });
      }

      const updated = await adminUserService.updateUserApproval(
        id,
        approvalStatus,
        rejectionReason,
        approvedRole
      );

      if (!updated) {
        return res.status(404).json({ error: `User '${id}' not found` });
      }

      return res.json({
        success: true,
        message: `User ${updated.name} approval status updated to '${updated.approvalStatus}' (Role: ${updated.role})`,
        user: updated,
      });
    } catch (err: any) {
      console.error('Error updating user approval status:', err);
      const isValidationError = err.message && (err.message.includes('Invalid') || err.message.includes('required'));
      return res.status(isValidationError ? 400 : 500).json({
        error: err.message || 'Failed to update approval status',
      });
    }
  },

  /**
   * PATCH /api/admin/users/:id/role
   * Body: { role: 'customer' | 'designer' | 'retailer' | 'admin' }
   */
  async updateRole(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const { role } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      if (!role) {
        return res.status(400).json({ error: 'Role field is required' });
      }

      const updated = await adminUserService.updateUserRole(id, role);

      if (!updated) {
        return res.status(404).json({ error: `User '${id}' not found` });
      }

      return res.json({
        success: true,
        message: `User ${updated.name} role changed to '${updated.role}'`,
        user: updated,
      });
    } catch (err: any) {
      console.error('Error updating user role:', err);
      const isValidationError = err.message && (err.message.includes('Invalid') || err.message.includes('required'));
      return res.status(isValidationError ? 400 : 500).json({
        error: err.message || 'Failed to update user role',
      });
    }
  },

  /**
   * PATCH /api/admin/users/:id/status
   * Body: { status: 'Active' | 'Inactive' | 'Suspended' }
   */
  async updateStatus(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      const { status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      if (!status) {
        return res.status(400).json({ error: 'Status field is required' });
      }

      const updated = await adminUserService.updateUserStatus(id, status);

      if (!updated) {
        return res.status(404).json({ error: `User '${id}' not found` });
      }

      return res.json({
        success: true,
        message: `User ${updated.name} account status updated to '${updated.status}'`,
        user: updated,
      });
    } catch (err: any) {
      console.error('Error updating user account status:', err);
      const isValidationError = err.message && (err.message.includes('Invalid') || err.message.includes('required'));
      return res.status(isValidationError ? 400 : 500).json({
        error: err.message || 'Failed to update user status',
      });
    }
  },

  /**
   * PUT /api/admin/users/:id
   * Body: Partial<AdminUser>
   */
  async updateUser(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const sanitizedData = sanitizeObject(req.body);
      const updated = await adminUserService.updateUser(id, sanitizedData);

      if (!updated) {
        return res.status(404).json({ error: `User '${id}' not found` });
      }

      return res.json({
        success: true,
        message: `User profile for '${updated.name}' updated successfully`,
        user: updated,
      });
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      return res.status(400).json({
        error: err.message || 'Failed to update user profile',
      });
    }
  },

  /**
   * POST /api/admin/users
   * Body: Partial<AdminUser>
   */
  async create(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const sanitizedData = sanitizeObject(req.body);
      const newUser = await adminUserService.createUser(sanitizedData);

      return res.status(201).json({
        success: true,
        message: `User '${newUser.name}' created successfully in PostgreSQL`,
        user: newUser,
      });
    } catch (err: any) {
      console.error('Error creating user:', err);
      return res.status(400).json({
        error: err.message || 'Failed to create user',
      });
    }
  },

  /**
   * DELETE /api/admin/users/:id
   */
  async delete(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const deleted = await adminUserService.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: `User '${id}' not found` });
      }

      return res.json({
        success: true,
        message: `User '${deleted.name}' successfully deleted from PostgreSQL`,
        user: deleted,
      });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: 'Failed to delete user from PostgreSQL' });
    }
  },
};
