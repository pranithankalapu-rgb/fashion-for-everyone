import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeString, sanitizeObject } from '../security';

export const retailerController = {
  // --- CUSTOMERS CRM ---
  async getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const customers = await prisma.retailerCustomer.findMany({
        orderBy: { id: 'desc' },
      });
      res.json(customers);
    } catch (err) {
      console.error('Error fetching retailer customers:', err);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  },

  async createCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const name = sanitizeString(req.body.name);
      const email = sanitizeString(req.body.email);
      const phone = sanitizeString(req.body.phone) || '';
      const status = sanitizeString(req.body.status) || 'New';

      if (!name || !email) {
        return res.status(400).json({ error: 'Customer name and email are required.' });
      }

      const existing = await prisma.retailerCustomer.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      if (existing) {
        return res.status(400).json({ error: 'A customer with this email already exists.' });
      }

      const newCustomer = await prisma.retailerCustomer.create({
        data: {
          name,
          email,
          phone,
          ordersCount: Number(req.body.ordersCount) || 0,
          totalSpent: Number(req.body.totalSpent) || 0,
          recentOrderDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          recentOrderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          status,
          avatar: req.body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        },
      });

      res.status(201).json(newCustomer);
    } catch (err) {
      console.error('Error creating retailer customer:', err);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  },

  async updateCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const existing = await prisma.retailerCustomer.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const sanitizedBody = sanitizeObject(req.body);
      const { id: _id, ...updateData } = sanitizedBody as any;

      const updated = await prisma.retailerCustomer.update({
        where: { id },
        data: updateData,
      });

      res.json(updated);
    } catch (err) {
      console.error('Error updating customer:', err);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  },

  async deleteCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const existing = await prisma.retailerCustomer.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const deleted = await prisma.retailerCustomer.delete({ where: { id } });
      res.json({ message: 'Customer removed', deletedCustomer: deleted });
    } catch (err) {
      console.error('Error deleting customer:', err);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  },

  // --- PROMOTIONS ---
  async getPromotions(req: AuthenticatedRequest, res: Response) {
    try {
      const promotions = await prisma.promotion.findMany({
        orderBy: { id: 'desc' },
      });
      res.json(promotions);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      res.status(500).json({ error: 'Failed to fetch promotions' });
    }
  },

  async createPromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const code = sanitizeString(req.body.code).toUpperCase();
      const title = sanitizeString(req.body.title);
      const discountType = sanitizeString(req.body.discountType) || 'Percentage';
      const discountValue = Number(req.body.discountValue);
      const category = sanitizeString(req.body.category) || undefined;
      const startDate = sanitizeString(req.body.startDate) || new Date().toISOString().split('T')[0];
      const endDate = sanitizeString(req.body.endDate) || '2026-12-31';
      const maxUses = Number(req.body.maxUses) || 500;
      const status = sanitizeString(req.body.status) || 'Active';

      if (!code || !title || isNaN(discountValue) || discountValue <= 0) {
        return res.status(400).json({ error: 'Promo code, title, and positive discount value are required.' });
      }

      // Check for duplicate promo code
      const existingPromo = await prisma.promotion.findUnique({ where: { code } });
      if (existingPromo) {
        return res.status(400).json({ error: 'A promotion with this code already exists.' });
      }

      const newPromo = await prisma.promotion.create({
        data: {
          code,
          title,
          discountType,
          discountValue,
          category,
          startDate,
          endDate,
          usageCount: 0,
          maxUses,
          status,
        },
      });

      res.status(201).json(newPromo);
    } catch (err) {
      console.error('Error creating promotion:', err);
      res.status(500).json({ error: 'Failed to create promotion' });
    }
  },

  async updatePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const existing = await prisma.promotion.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Promotion not found' });
      }

      const sanitizedBody = sanitizeObject(req.body);
      const { id: _id, ...updateData } = sanitizedBody as any;

      const updated = await prisma.promotion.update({
        where: { id },
        data: updateData,
      });

      res.json(updated);
    } catch (err) {
      console.error('Error updating promotion:', err);
      res.status(500).json({ error: 'Failed to update promotion' });
    }
  },

  async toggleDeactivatePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const promo = await prisma.promotion.findUnique({ where: { id } });
      if (!promo) {
        return res.status(404).json({ error: 'Promotion not found' });
      }

      const updated = await prisma.promotion.update({
        where: { id },
        data: { status: promo.status === 'Active' ? 'Inactive' : 'Active' },
      });

      res.json(updated);
    } catch (err) {
      console.error('Error toggling promotion status:', err);
      res.status(500).json({ error: 'Failed to toggle promotion status' });
    }
  },

  async deletePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const existing = await prisma.promotion.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Promotion not found' });
      }

      const deleted = await prisma.promotion.delete({ where: { id } });
      res.json({ message: 'Promotion deleted', deletedPromotion: deleted });
    } catch (err) {
      console.error('Error deleting promotion:', err);
      res.status(500).json({ error: 'Failed to delete promotion' });
    }
  },

  // --- STORE SETTINGS ---
  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      let settings = await prisma.storeSettings.findUnique({
        where: { id: 'default' },
      });

      if (!settings) {
        return res.status(404).json({ error: 'Store settings not found. Seed the database first.' });
      }

      res.json(settings);
    } catch (err) {
      console.error('Error fetching store settings:', err);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  },

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const sanitizedBody = sanitizeObject(req.body);
      const { id: _id, ...updateData } = sanitizedBody as any;

      const updatedSettings = await prisma.storeSettings.upsert({
        where: { id: 'default' },
        update: updateData,
        create: {
          id: 'default',
          storeName: updateData.storeName || 'Fashion Store',
          logoUrl: updateData.logoUrl || '',
          taxId: updateData.taxId || '',
          currency: updateData.currency || '$',
          managerName: updateData.managerName || '',
          managerEmail: updateData.managerEmail || '',
          managerPhone: updateData.managerPhone || '',
          address: updateData.address || '',
          supportEmail: updateData.supportEmail || '',
          supportPhone: updateData.supportPhone || '',
          ...updateData,
        },
      });

      res.json({ message: 'Store settings updated successfully', settings: updatedSettings });
    } catch (err) {
      console.error('Error updating store settings:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },
};
