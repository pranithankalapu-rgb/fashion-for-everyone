import { prisma } from '../db';
import { sanitizeString } from '../security';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';

export const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
];

export interface GetOrdersFilter {
  status?: string;
  search?: string;
  sortBy?: 'date' | 'totalAmount' | 'orderNumber' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AdminOrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  returnedCount: number;
  avgOrderValue: number;
}

export const adminOrderService = {
  /**
   * Retrieves all orders with optional search, status filtering, and sorting,
   * along with live calculated order statistics from PostgreSQL.
   */
  async getAllOrders(filters: GetOrdersFilter = {}) {
    const { status, search, sortBy = 'id', sortOrder = 'desc', limit, offset } = filters;

    const where: any = {};

    // Filter by order status
    if (status && status !== 'All') {
      const sanitizedStatus = sanitizeString(status);
      where.status = {
        equals: sanitizedStatus,
        mode: 'insensitive',
      };
    }

    // Search query across orderNumber, customerName, customerEmail, customerPhone, trackingNumber, or item title/sku
    if (search && search.trim()) {
      const sanitizedSearch = sanitizeString(search.trim());
      where.OR = [
        { orderNumber: { contains: sanitizedSearch, mode: 'insensitive' } },
        { customerName: { contains: sanitizedSearch, mode: 'insensitive' } },
        { customerEmail: { contains: sanitizedSearch, mode: 'insensitive' } },
        { customerPhone: { contains: sanitizedSearch, mode: 'insensitive' } },
        { shippingAddress: { contains: sanitizedSearch, mode: 'insensitive' } },
        { trackingNumber: { contains: sanitizedSearch, mode: 'insensitive' } },
        {
          items: {
            some: {
              OR: [
                { title: { contains: sanitizedSearch, mode: 'insensitive' } },
                { sku: { contains: sanitizedSearch, mode: 'insensitive' } },
                { brand: { contains: sanitizedSearch, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Sorting options
    let orderBy: any = { id: sortOrder };
    if (sortBy === 'totalAmount') {
      orderBy = { totalAmount: sortOrder };
    } else if (sortBy === 'orderNumber') {
      orderBy = { orderNumber: sortOrder };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    } else if (sortBy === 'date') {
      orderBy = { id: sortOrder };
    }

    const [orders, totalMatching, allOrdersForStats] = await Promise.all([
      prisma.customerOrder.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
      }),
      prisma.customerOrder.count({ where }),
      prisma.customerOrder.findMany({
        select: {
          status: true,
          totalAmount: true,
        },
      }),
    ]);

    // Calculate live operational metrics across all PostgreSQL orders
    const stats: AdminOrderStats = {
      totalOrders: allOrdersForStats.length,
      totalRevenue: 0,
      pendingCount: 0,
      processingCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      returnedCount: 0,
      avgOrderValue: 0,
    };

    for (const ord of allOrdersForStats) {
      if (ord.status !== 'Cancelled') {
        stats.totalRevenue += ord.totalAmount;
      }
      const st = ord.status.toLowerCase();
      if (st === 'pending') stats.pendingCount++;
      else if (st === 'processing') stats.processingCount++;
      else if (st === 'shipped') stats.shippedCount++;
      else if (st === 'delivered') stats.deliveredCount++;
      else if (st === 'cancelled') stats.cancelledCount++;
      else if (st === 'returned') stats.returnedCount++;
    }

    stats.totalRevenue = Math.round(stats.totalRevenue * 100) / 100;
    const activeCount = stats.totalOrders - stats.cancelledCount;
    stats.avgOrderValue = activeCount > 0 ? Math.round((stats.totalRevenue / activeCount) * 100) / 100 : 0;

    return {
      orders,
      stats,
      total: totalMatching,
    };
  },

  /**
   * Retrieves single order details by PostgreSQL ID or unique orderNumber.
   */
  async getOrderById(idOrOrderNumber: string) {
    const sanitizedId = sanitizeString(idOrOrderNumber);

    const order = await prisma.customerOrder.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { orderNumber: sanitizedId }],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return order;
  },

  /**
   * Updates an order's status and tracking number in PostgreSQL.
   */
  async updateOrderStatus(idOrOrderNumber: string, newStatus: string, trackingNumber?: string) {
    const sanitizedId = sanitizeString(idOrOrderNumber);
    const sanitizedStatus = sanitizeString(newStatus);
    const sanitizedTracking = trackingNumber !== undefined ? sanitizeString(trackingNumber) : undefined;

    // Validate that the status is permitted
    const matchedStatus = VALID_ORDER_STATUSES.find(
      (s) => s.toLowerCase() === sanitizedStatus.toLowerCase()
    );

    if (!matchedStatus) {
      throw new Error(
        `Invalid status '${newStatus}'. Permitted values: ${VALID_ORDER_STATUSES.join(', ')}`
      );
    }

    // Locate the order record
    const existingOrder = await prisma.customerOrder.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { orderNumber: sanitizedId }],
      },
    });

    if (!existingOrder) {
      return null;
    }

    const updateData: any = {
      status: matchedStatus,
    };

    if (sanitizedTracking !== undefined) {
      updateData.trackingNumber = sanitizedTracking || null;
    }

    // If marked delivered and deliveryDate not set, set it now
    if (matchedStatus === 'Delivered' && !existingOrder.deliveryDate) {
      updateData.deliveryDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }

    const updated = await prisma.customerOrder.update({
      where: { id: existingOrder.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return updated;
  },

  /**
   * Deletes an order from PostgreSQL.
   */
  async deleteOrder(idOrOrderNumber: string) {
    const sanitizedId = sanitizeString(idOrOrderNumber);

    const existingOrder = await prisma.customerOrder.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { orderNumber: sanitizedId }],
      },
    });

    if (!existingOrder) {
      return null;
    }

    const deleted = await prisma.customerOrder.delete({
      where: { id: existingOrder.id },
      include: {
        items: true,
      },
    });

    return deleted;
  },

  /**
   * Returns aggregated order statistics for the Admin dashboard.
   */
  async getOrderStats(): Promise<AdminOrderStats> {
    const allOrders = await prisma.customerOrder.findMany({
      select: {
        status: true,
        totalAmount: true,
      },
    });

    const stats: AdminOrderStats = {
      totalOrders: allOrders.length,
      totalRevenue: 0,
      pendingCount: 0,
      processingCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      returnedCount: 0,
      avgOrderValue: 0,
    };

    for (const ord of allOrders) {
      if (ord.status !== 'Cancelled') {
        stats.totalRevenue += ord.totalAmount;
      }
      const st = ord.status.toLowerCase();
      if (st === 'pending') stats.pendingCount++;
      else if (st === 'processing') stats.processingCount++;
      else if (st === 'shipped') stats.shippedCount++;
      else if (st === 'delivered') stats.deliveredCount++;
      else if (st === 'cancelled') stats.cancelledCount++;
      else if (st === 'returned') stats.returnedCount++;
    }

    stats.totalRevenue = Math.round(stats.totalRevenue * 100) / 100;
    const activeCount = stats.totalOrders - stats.cancelledCount;
    stats.avgOrderValue = activeCount > 0 ? Math.round((stats.totalRevenue / activeCount) * 100) / 100 : 0;

    return stats;
  },
};
