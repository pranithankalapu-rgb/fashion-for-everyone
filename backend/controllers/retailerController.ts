import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getDb, saveDb } from '../db';
import { sanitizeString, sanitizeObject } from '../security';
import type { RetailerCustomer, Promotion, StoreSettings } from '../types/fashion';

export const retailerController = {
  // --- CUSTOMERS CRM ---
  getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      res.json(db.retailerCustomers || []);
    } catch (err) {
      console.error('Error fetching retailer customers:', err);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  },

  createCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const name = sanitizeString(req.body.name);
      const email = sanitizeString(req.body.email);
      const phone = sanitizeString(req.body.phone) || '';
      const status = (sanitizeString(req.body.status) as RetailerCustomer['status']) || 'New';

      if (!name || !email) {
        return res.status(400).json({ error: 'Customer name and email are required.' });
      }

      const existing = db.retailerCustomers.find(c => c.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: 'A customer with this email already exists.' });
      }

      const newCustomer: RetailerCustomer = {
        id: `cust_${Date.now()}`,
        name,
        email,
        phone,
        ordersCount: Number(req.body.ordersCount) || 0,
        totalSpent: Number(req.body.totalSpent) || 0,
        recentOrderDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        recentOrderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        status,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      };

      db.retailerCustomers.unshift(newCustomer);
      saveDb(db);

      res.status(201).json(newCustomer);
    } catch (err) {
      console.error('Error creating retailer customer:', err);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  },

  updateCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const index = db.retailerCustomers.findIndex(c => c.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const sanitizedBody = sanitizeObject(req.body);
      db.retailerCustomers[index] = { ...db.retailerCustomers[index], ...sanitizedBody, id };
      saveDb(db);

      res.json(db.retailerCustomers[index]);
    } catch (err) {
      console.error('Error updating customer:', err);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  },

  deleteCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const index = db.retailerCustomers.findIndex(c => c.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const deleted = db.retailerCustomers.splice(index, 1)[0];
      saveDb(db);

      res.json({ message: 'Customer removed', deletedCustomer: deleted });
    } catch (err) {
      console.error('Error deleting customer:', err);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  },

  // --- PROMOTIONS ---
  getPromotions(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      res.json(db.promotions || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      res.status(500).json({ error: 'Failed to fetch promotions' });
    }
  },

  createPromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const code = sanitizeString(req.body.code).toUpperCase();
      const title = sanitizeString(req.body.title);
      const discountType = (sanitizeString(req.body.discountType) as Promotion['discountType']) || 'Percentage';
      const discountValue = Number(req.body.discountValue);
      const category = sanitizeString(req.body.category) || undefined;
      const startDate = sanitizeString(req.body.startDate) || new Date().toISOString().split('T')[0];
      const endDate = sanitizeString(req.body.endDate) || '2026-12-31';
      const maxUses = Number(req.body.maxUses) || 500;
      const status = (sanitizeString(req.body.status) as Promotion['status']) || 'Active';

      if (!code || !title || isNaN(discountValue) || discountValue <= 0) {
        return res.status(400).json({ error: 'Promo code, title, and positive discount value are required.' });
      }

      const newPromo: Promotion = {
        id: `promo_${Date.now()}`,
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
      };

      db.promotions.unshift(newPromo);
      saveDb(db);

      res.status(201).json(newPromo);
    } catch (err) {
      console.error('Error creating promotion:', err);
      res.status(500).json({ error: 'Failed to create promotion' });
    }
  },

  updatePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const index = db.promotions.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Promotion not found' });
      }

      const sanitizedBody = sanitizeObject(req.body);
      db.promotions[index] = { ...db.promotions[index], ...sanitizedBody, id };
      saveDb(db);

      res.json(db.promotions[index]);
    } catch (err) {
      console.error('Error updating promotion:', err);
      res.status(500).json({ error: 'Failed to update promotion' });
    }
  },

  toggleDeactivatePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const promo = db.promotions.find(p => p.id === id);

      if (!promo) {
        return res.status(404).json({ error: 'Promotion not found' });
      }

      promo.status = promo.status === 'Active' ? 'Inactive' : 'Active';
      saveDb(db);

      res.json(promo);
    } catch (err) {
      console.error('Error toggling promotion status:', err);
      res.status(500).json({ error: 'Failed to toggle promotion status' });
    }
  },

  deletePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const index = db.promotions.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Promotion not found' });
      }

      const deleted = db.promotions.splice(index, 1)[0];
      saveDb(db);

      res.json({ message: 'Promotion deleted', deletedPromotion: deleted });
    } catch (err) {
      console.error('Error deleting promotion:', err);
      res.status(500).json({ error: 'Failed to delete promotion' });
    }
  },

  // --- STORE SETTINGS ---
  getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      res.json(db.storeSettings);
    } catch (err) {
      console.error('Error fetching store settings:', err);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  },

  updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const sanitizedBody = sanitizeObject(req.body);
      const updatedSettings: StoreSettings = { ...db.storeSettings, ...sanitizedBody };
      db.storeSettings = updatedSettings;
      saveDb(db);

      res.json({ message: 'Store settings updated successfully', settings: updatedSettings });
    } catch (err) {
      console.error('Error updating store settings:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },
};
