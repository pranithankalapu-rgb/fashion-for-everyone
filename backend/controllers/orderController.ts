import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeString } from '../security';

export const orderController = {
  // GET /api/orders
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const orders = await prisma.customerOrder.findMany({
        include: { items: true },
        orderBy: { id: 'desc' },
      });
      res.json(orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  // GET /api/orders/:id
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const order = await prisma.customerOrder.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
        include: { items: true },
      });

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
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const customerName = sanitizeString(req.body.customerName) || 'Customer';
      const customerEmail = sanitizeString(req.body.customerEmail) || 'customer@example.com';
      const customerPhone = sanitizeString(req.body.customerPhone) || '';
      const shippingAddress = sanitizeString(req.body.shippingAddress);
      const paymentMethod = sanitizeString(req.body.paymentMethod) || 'Credit Card';
      const rawItems = req.body.items;

      if (!shippingAddress || !rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
        return res.status(400).json({ error: 'Shipping address and items array are required.' });
      }

      // Validate items and check stock
      const itemsData = rawItems.map((item: any) => ({
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

      const totalAmount = itemsData.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
      const newOrderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

      // Use a transaction for atomicity: create order + items + deduct stock + upsert CRM customer
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the order
        const newOrder = await tx.customerOrder.create({
          data: {
            orderNumber: newOrderNum,
            date: orderDate,
            status: 'Pending',
            customerName,
            customerEmail,
            customerPhone,
            paymentMethod,
            totalAmount,
            currency: '$',
            shippingAddress,
            items: {
              create: itemsData.map((item: any) => ({
                productId: item.productId,
                title: item.title,
                brand: item.brand,
                imageUrl: item.imageUrl,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                sku: item.sku,
              })),
            },
          },
          include: { items: true },
        });

        // 2. Deduct stock for each product
        for (const item of itemsData) {
          if (item.productId) {
            const product = await tx.retailProduct.findUnique({ where: { id: item.productId } });
            if (product) {
              const newStock = Math.max(0, (product.stockQuantity || 10) - item.quantity);
              const newStatus = newStock === 0 ? 'Out of Stock' : newStock <= 5 ? 'Low Stock' : 'Active';
              await tx.retailProduct.update({
                where: { id: item.productId },
                data: { stockQuantity: newStock, status: newStatus },
              });
            }
          }
        }

        // 3. Upsert retailer CRM customer
        const existingCustomer = await tx.retailerCustomer.findFirst({
          where: { email: { equals: customerEmail, mode: 'insensitive' } },
        });

        if (existingCustomer) {
          const newTotalSpent = existingCustomer.totalSpent + totalAmount;
          await tx.retailerCustomer.update({
            where: { id: existingCustomer.id },
            data: {
              ordersCount: existingCustomer.ordersCount + 1,
              totalSpent: newTotalSpent,
              recentOrderDate: orderDate,
              recentOrderId: newOrderNum,
              status: newTotalSpent > 1500 ? 'VIP' : 'Active',
            },
          });
        } else {
          await tx.retailerCustomer.create({
            data: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
              ordersCount: 1,
              totalSpent: totalAmount,
              recentOrderDate: orderDate,
              recentOrderId: newOrderNum,
              status: 'New',
            },
          });
        }

        return newOrder;
      });

      res.status(201).json({ message: 'Order created successfully', order: result });
    } catch (err) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  // PATCH /api/orders/:id/status
  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const newStatus = sanitizeString(req.body.status);
      const trackingNumber = sanitizeString(req.body.trackingNumber);

      const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: `Invalid order status. Allowed: ${validStatuses.join(', ')}` });
      }

      const order = await prisma.customerOrder.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const updateData: any = { status: newStatus };
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }
      if (newStatus === 'Delivered' && !order.deliveryDate) {
        updateData.deliveryDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }

      const updated = await prisma.customerOrder.update({
        where: { id: order.id },
        data: updateData,
        include: { items: true },
      });

      res.json(updated);
    } catch (err) {
      console.error('Error updating order status:', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  },

  // DELETE /api/orders/:id
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      
      const order = await prisma.customerOrder.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const deleted = await prisma.customerOrder.delete({
        where: { id: order.id },
        include: { items: true },
      });

      res.json({ message: 'Order cancelled and deleted', deletedOrder: deleted });
    } catch (err) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  },
};
