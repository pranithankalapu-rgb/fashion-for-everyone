import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma, getDb, saveDb } from '../db';
import { sanitizeString } from '../security';
import { paymentService } from '../services/paymentService';
import { emitNotification } from '../services/socketService';

export const orderController = {
  // GET /api/orders
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = (req.userRole || 'customer').toLowerCase();
      const userEmail = req.user?.email;

      // Customers can only see their own orders unless admin or retailer
      const whereClause: any = {};
      if (userRole !== 'retailer' && userRole !== 'admin') {
        if (!userEmail) {
          return res.json([]);
        }
        whereClause.customerEmail = { equals: userEmail, mode: 'insensitive' };
      }

      try {
        const orders = await prisma.customerOrder.findMany({
          where: whereClause,
          include: { items: true },
          orderBy: { id: 'desc' },
        });
        return res.json(orders);
      } catch {
        const db = getDb();
        const orders = (userRole !== 'retailer' && userRole !== 'admin' && userEmail)
          ? db.orders.filter(o => o.customerEmail?.toLowerCase() === userEmail.toLowerCase())
          : db.orders;
        return res.json(orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  // GET /api/orders/:id
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const userRole = (req.userRole || 'customer').toLowerCase();
      const userEmail = req.user?.email;

      let order: any = null;
      try {
        order = await prisma.customerOrder.findFirst({
          where: {
            OR: [{ id }, { orderNumber: id }],
          },
          include: { items: true },
        });
      } catch {
        const db = getDb();
        order = db.orders.find(o => o.id === id || o.orderNumber === id);
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (userRole !== 'retailer' && userRole !== 'admin') {
        if (!userEmail || !order.customerEmail || order.customerEmail.toLowerCase() !== userEmail.toLowerCase()) {
          return res.status(403).json({ error: 'Forbidden: You cannot view another customer’s order.' });
        }
      }

      return res.json(order);
    } catch (err) {
      console.error('Error fetching order by ID:', err);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  },

  // POST /api/orders (Atomic transaction with inventory validation, locking & payment intent)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const customerName = sanitizeString(req.body.customerName) || req.user?.name || 'Valued Customer';
      const customerEmail = sanitizeString(req.body.customerEmail) || req.user?.email || 'customer@example.com';
      const customerPhone = sanitizeString(req.body.customerPhone) || '';
      const shippingAddress = sanitizeString(req.body.shippingAddress);
      const paymentMethod = sanitizeString(req.body.paymentMethod) || 'Credit Card';
      const paymentGateway = (sanitizeString(req.body.paymentGateway) || 'MOCK').toUpperCase();
      const rawItems = req.body.items;

      if (!shippingAddress || !rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
        return res.status(400).json({ error: 'Shipping address and items array are required.' });
      }

      // Validate items format
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

      let createdOrder: any = null;

      try {
        createdOrder = await prisma.$transaction(async (tx) => {
          // 1. Validate stock
          for (const item of itemsData) {
            if (item.productId) {
              const product = await tx.retailProduct.findUnique({
                where: { id: item.productId },
              });

              if (product) {
                const currentStock = product.stockQuantity ?? 10;
                if (currentStock < item.quantity) {
                  throw new Error(
                    `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${currentStock}`
                  );
                }
              }
            }
          }

          // 2. Create the Customer Order
          const orderPayload: any = {
            orderNumber: newOrderNum,
            date: orderDate,
            status: 'Processing',
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
          };

          const newOrder = await tx.customerOrder.create({
            data: orderPayload,
            include: { items: true },
          });

          // 3. Atomically deduct inventory
          for (const item of itemsData) {
            if (item.productId) {
              const product = await tx.retailProduct.findUnique({ where: { id: item.productId } });
              if (product) {
                const updatedStock = Math.max(0, (product.stockQuantity || 10) - item.quantity);
                const updatedStatus = updatedStock === 0 ? 'Out of Stock' : updatedStock <= 5 ? 'Low Stock' : 'Active';
                await tx.retailProduct.update({
                  where: { id: item.productId },
                  data: {
                    stockQuantity: updatedStock,
                    status: updatedStatus,
                  },
                });
              }
            }
          }

          return newOrder;
        });
      } catch (dbErr: any) {
        if (dbErr.message?.includes('Insufficient stock')) {
          return res.status(409).json({ error: dbErr.message });
        }

        // Fallback in json DB
        const db = getDb();
        createdOrder = {
          id: `ord_${Date.now()}`,
          orderNumber: newOrderNum,
          date: orderDate,
          status: 'Processing',
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod,
          totalAmount,
          currency: '$',
          shippingAddress,
          items: itemsData.map((i, idx) => ({ id: `item_${Date.now()}_${idx}`, orderId: newOrderNum, ...i })),
        };
        db.orders.unshift(createdOrder);
        saveDb(db);
      }

      // Generate Payment Intent via provider abstraction
      const paymentIntent = await paymentService.createOrderPaymentIntent({
        orderId: createdOrder.orderNumber,
        amount: totalAmount,
        currency: 'USD',
        gateway: paymentGateway,
        customerEmail,
        customerPhone,
      });

      // Broadcast real-time notification to retailers
      emitNotification({
        type: 'ORDER_CREATED',
        title: '🎉 New Order Placed',
        message: `Order #${createdOrder.orderNumber} for $${totalAmount.toFixed(2)} received from ${customerName}`,
        recipientRole: 'retailer',
        orderId: createdOrder.orderNumber,
      });

      return res.status(201).json({
        message: 'Order created successfully',
        order: createdOrder,
        paymentIntent,
      });
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  // POST /api/orders/webhook (Payment confirmation webhook)
  async handlePaymentWebhook(req: AuthenticatedRequest, res: Response) {
    try {
      const gateway = (req.query.gateway as string) || 'MOCK';
      const provider = paymentService.getProvider(gateway);

      const webhookResult = await provider.processWebhook(req.body);

      if (webhookResult.status === 'PAID') {
        try {
          await prisma.customerOrder.updateMany({
            where: { orderNumber: webhookResult.orderId },
            data: { status: 'Processing' },
          });
        } catch {
          const db = getDb();
          const target = db.orders.find(o => o.orderNumber === webhookResult.orderId);
          if (target) {
            target.status = 'Processing' as any;
            saveDb(db);
          }
        }

        emitNotification({
          type: 'PAYMENT_CONFIRMED',
          title: '💳 Payment Verified',
          message: `Payment confirmed for Order #${webhookResult.orderId} via ${webhookResult.gateway}`,
          recipientRole: 'retailer',
          orderId: webhookResult.orderId,
        });
      }

      return res.json({ success: true, processed: webhookResult });
    } catch (err: any) {
      console.error('Payment webhook error:', err);
      return res.status(400).json({ error: 'Webhook processing error' });
    }
  },

  // PATCH /api/orders/:id/status
  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const status = sanitizeString(req.body.status);
      const trackingNumber = req.body.trackingNumber ? sanitizeString(req.body.trackingNumber) : undefined;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const updateData: any = { status };
      if (trackingNumber !== undefined) {
        updateData.trackingNumber = trackingNumber;
      }

      try {
        const order = await prisma.customerOrder.update({
          where: { id },
          data: updateData,
          include: { items: true },
        });
        return res.json({
          message: 'Order status updated',
          order,
          status: order.status,
          trackingNumber: order.trackingNumber,
        });
      } catch {
        const db = getDb();
        const idx = db.orders.findIndex(o => o.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Order not found' });
        db.orders[idx].status = status as any;
        if (trackingNumber !== undefined) {
          db.orders[idx].trackingNumber = trackingNumber;
        }
        saveDb(db);
        return res.json({
          message: 'Order status updated',
          order: db.orders[idx],
          status: db.orders[idx].status,
          trackingNumber: db.orders[idx].trackingNumber,
        });
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  },

  // DELETE /api/orders/:id
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const userRole = (req.userRole || 'customer').toLowerCase();
      const userEmail = req.user?.email;

      let order: any = null;
      try {
        order = await prisma.customerOrder.findFirst({
          where: { OR: [{ id }, { orderNumber: id }] },
        });
      } catch {
        const db = getDb();
        order = db.orders.find(o => o.id === id || o.orderNumber === id);
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (userRole !== 'retailer' && userRole !== 'admin') {
        if (!userEmail || !order.customerEmail || order.customerEmail.toLowerCase() !== userEmail.toLowerCase()) {
          return res.status(403).json({ error: 'Forbidden: You cannot delete another customer’s order.' });
        }
      }

      try {
        await prisma.customerOrder.delete({ where: { id: order.id } });
      } catch {
        const db = getDb();
        db.orders = db.orders.filter(o => o.id !== order.id && o.orderNumber !== order.orderNumber);
        saveDb(db);
      }

      return res.json({ message: 'Order deleted successfully' });
    } catch (err) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  },
};
