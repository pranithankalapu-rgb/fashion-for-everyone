import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getDb, saveDb } from '../db';
import { sanitizeString, sanitizeObject } from '../security';
import type { CustomerOrder, OrderItem, OrderStatus } from '../types/fashion';

export const orderController = {
  // GET /api/orders
  getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      res.json(db.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  // GET /api/orders/:id
  getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const order = db.orders.find(o => o.id === id || o.orderNumber === id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (err) {
      console.error('Error fetching order by ID:', err);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  },

  // POST /api/orders
  create(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const customerName = sanitizeString(req.body.customerName) || db.userProfile.name;
      const customerEmail = sanitizeString(req.body.customerEmail) || 'customer@example.com';
      const customerPhone = sanitizeString(req.body.customerPhone) || '+1 (206) 555-0192';
      const shippingAddress = sanitizeString(req.body.shippingAddress);
      const paymentMethod = sanitizeString(req.body.paymentMethod) || 'Credit Card';
      const rawItems = req.body.items;

      if (!shippingAddress || !rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
        return res.status(400).json({ error: 'Shipping address and items array are required.' });
      }

      const items: OrderItem[] = rawItems.map((item: any) => ({
        productId: sanitizeString(item.productId),
        title: sanitizeString(item.title),
        brand: sanitizeString(item.brand) || 'Fashion Brand',
        imageUrl: sanitizeString(item.imageUrl),
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        size: sanitizeString(item.size) || 'M',
        color: sanitizeString(item.color) || 'Default',
        sku: sanitizeString(item.sku) || `SKU-${item.productId}`,
      }));

      const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const newOrderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: CustomerOrder = {
        id: `ord_${Date.now()}`,
        orderNumber: newOrderNum,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Pending',
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        items,
        totalAmount,
        currency: '$',
        shippingAddress,
      };

      // Auto deduct stock for purchased items
      items.forEach(item => {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod) {
          prod.stockQuantity = Math.max(0, (prod.stockQuantity || 10) - item.quantity);
          prod.status = prod.stockQuantity === 0 ? 'Out of Stock' : prod.stockQuantity <= 5 ? 'Low Stock' : 'Active';
        }
      });

      // Synchronize with Retailer CRM customer list
      let customer = db.retailerCustomers.find(c => c.email.toLowerCase() === customerEmail.toLowerCase());
      if (customer) {
        customer.ordersCount += 1;
        customer.totalSpent += totalAmount;
        customer.recentOrderDate = newOrder.date;
        customer.recentOrderId = newOrderNum;
        customer.status = customer.totalSpent > 1500 ? 'VIP' : 'Active';
      } else {
        db.retailerCustomers.unshift({
          id: `cust_${Date.now()}`,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          ordersCount: 1,
          totalSpent: totalAmount,
          recentOrderDate: newOrder.date,
          recentOrderId: newOrderNum,
          status: 'New',
          avatar: db.userProfile.avatar,
        });
      }

      db.orders.unshift(newOrder);
      saveDb(db);

      res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (err) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  // PATCH /api/orders/:id/status
  updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const newStatus = sanitizeString(req.body.status) as OrderStatus;
      const trackingNumber = sanitizeString(req.body.trackingNumber);

      const validStatuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: `Invalid order status. Allowed: ${validStatuses.join(', ')}` });
      }

      const db = getDb();
      const order = db.orders.find(o => o.id === id || o.orderNumber === id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      order.status = newStatus;
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }
      if (newStatus === 'Delivered' && !order.deliveryDate) {
        order.deliveryDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }

      saveDb(db);
      res.json(order);
    } catch (err) {
      console.error('Error updating order status:', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  },

  // DELETE /api/orders/:id
  delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const index = db.orders.findIndex(o => o.id === id || o.orderNumber === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const deleted = db.orders.splice(index, 1)[0];
      saveDb(db);

      res.json({ message: 'Order cancelled and deleted', deletedOrder: deleted });
    } catch (err) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  },
};
