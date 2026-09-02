import { prisma } from '../db';
import type {
  AdminDashboardOverview,
  AdminActivityItem,
  AdminPendingQueueItem,
} from '../types/fashion';

export const adminDashboardService = {
  /**
   * Aggregates live executive business metrics across all PostgreSQL tables.
   */
  async getExecutiveOverview(): Promise<AdminDashboardOverview> {
    const [
      allUsers,
      allOrders,
      allProducts,
      allStores,
      allDesigners,
      allDesigns,
      recentCustomerOrders,
    ] = await Promise.all([
      prisma.userProfile.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          approvalStatus: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customerOrder.findMany({
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          status: true,
          date: true,
        },
        orderBy: { id: 'desc' },
      }),
      prisma.retailProduct.findMany({
        select: {
          id: true,
          title: true,
          price: true,
          stockQuantity: true,
          status: true,
        },
      }),
      prisma.storeSettings.findMany({
        select: {
          id: true,
          storeName: true,
          managerName: true,
          approvalStatus: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.designer.findMany({
        select: {
          id: true,
          name: true,
          handle: true,
          verified: true,
          approvalStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.design.findMany({
        select: {
          id: true,
          title: true,
          designerName: true,
          approvalStatus: true,
          submittedAt: true,
          createdAt: true,
          price: true,
        },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.customerOrder.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: {
          items: true,
        },
      }),
    ]);

    // Financial & Order calculations
    let totalRevenue = 0;
    const orderStatusBreakdown = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    };

    for (const ord of allOrders) {
      if (ord.status !== 'Cancelled') {
        totalRevenue += ord.totalAmount;
      }
      const st = ord.status.toLowerCase() as keyof typeof orderStatusBreakdown;
      if (orderStatusBreakdown[st] !== undefined) {
        orderStatusBreakdown[st]++;
      }
    }
    totalRevenue = Math.round(totalRevenue * 100) / 100;
    const nonCancelledOrders = allOrders.length - orderStatusBreakdown.cancelled;
    const avgOrderValue = nonCancelledOrders > 0 ? Math.round((totalRevenue / nonCancelledOrders) * 100) / 100 : 0;

    // User calculations
    const roleBreakdown = {
      customer: 0,
      designer: 0,
      retailer: 0,
      admin: 0,
    };
    let activeUsers = 0;
    let pendingUsersCount = 0;

    for (const u of allUsers) {
      if (u.status === 'Active') activeUsers++;
      if (u.approvalStatus === 'Pending') pendingUsersCount++;

      const r = (u.role || 'customer').toLowerCase() as keyof typeof roleBreakdown;
      if (roleBreakdown[r] !== undefined) {
        roleBreakdown[r]++;
      } else {
        roleBreakdown.customer++;
      }
    }

    // Product calculations
    let lowStockCount = 0;
    let inStockCount = 0;
    for (const p of allProducts) {
      const qty = p.stockQuantity ?? 10;
      if (qty <= 5) lowStockCount++;
      if (qty > 0) inStockCount++;
    }

    // Retailer & Designer calculations
    const pendingRetailersCount = allStores.filter((s) => (s.approvalStatus || 'Approved').toLowerCase() === 'pending').length;
    const approvedRetailersCount = allStores.filter((s) => (s.approvalStatus || 'Approved').toLowerCase() === 'approved').length;

    const pendingDesignersCount = allDesigners.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'pending').length;
    const verifiedDesignersCount = allDesigners.filter((d) => d.verified).length;

    const pendingDesignsCount = allDesigns.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'pending').length;

    const pendingApprovalsTotal =
      pendingUsersCount + pendingRetailersCount + pendingDesignersCount + pendingDesignsCount;

    // Recent Activity Feed compilation (Chronologically sorted)
    const recentActivity: AdminActivityItem[] = [];

    // Add recent orders
    for (const ord of allOrders.slice(0, 4)) {
      recentActivity.push({
        id: `act_ord_${ord.id}`,
        type: 'order',
        title: `Customer Order #${ord.orderNumber}`,
        subtitle: `${ord.customerName || 'Customer'} placed order for $${ord.totalAmount}`,
        timestamp: ord.date || new Date().toISOString(),
        status: ord.status,
        badgeColor: ord.status === 'Delivered' ? 'emerald' : ord.status === 'Pending' ? 'amber' : 'sky',
      });
    }

    // Add recent user registrations
    for (const u of allUsers.slice(0, 3)) {
      recentActivity.push({
        id: `act_usr_${u.id}`,
        type: 'user',
        title: `New User: ${u.name}`,
        subtitle: `Registered as ${u.role.toUpperCase()} (${u.approvalStatus})`,
        timestamp: u.createdAt.toISOString(),
        status: u.approvalStatus,
        badgeColor: u.approvalStatus === 'Pending' ? 'amber' : 'purple',
      });
    }

    // Add recent design submissions
    for (const dn of allDesigns.slice(0, 3)) {
      recentActivity.push({
        id: `act_dn_${dn.id}`,
        type: 'design',
        title: `Design: ${dn.title}`,
        subtitle: `Submitted by ${dn.designerName} ($${dn.price})`,
        timestamp: dn.submittedAt.toISOString(),
        status: dn.approvalStatus,
        badgeColor: dn.approvalStatus === 'Pending' ? 'amber' : 'emerald',
      });
    }

    // Add recent stores
    for (const st of allStores.slice(0, 2)) {
      recentActivity.push({
        id: `act_st_${st.id}`,
        type: 'store',
        title: `Retailer Store: ${st.storeName}`,
        subtitle: `Manager: ${st.managerName} (${st.approvalStatus})`,
        timestamp: st.createdAt.toISOString(),
        status: st.approvalStatus,
        badgeColor: st.approvalStatus === 'Pending' ? 'amber' : 'emerald',
      });
    }

    // Sort activity by timestamp desc
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pending Queue compilation for executive quick actions
    const pendingQueue: AdminPendingQueueItem[] = [];

    // Pending stores
    for (const s of allStores.filter((st) => st.approvalStatus === 'Pending')) {
      pendingQueue.push({
        id: s.id,
        category: 'retailer',
        title: s.storeName,
        subtitle: `Manager: ${s.managerName}`,
        timestamp: s.createdAt.toISOString(),
        requestedAction: 'Review Retailer Store Application',
        linkTab: 'retailers',
      });
    }

    // Pending designs
    for (const dn of allDesigns.filter((d) => d.approvalStatus === 'Pending')) {
      pendingQueue.push({
        id: dn.id,
        category: 'design',
        title: dn.title,
        subtitle: `Designer: ${dn.designerName}`,
        timestamp: dn.submittedAt.toISOString(),
        requestedAction: 'Review Collection Design Submission',
        linkTab: 'designers',
      });
    }

    // Pending designers
    for (const des of allDesigners.filter((d) => d.approvalStatus === 'Pending')) {
      pendingQueue.push({
        id: des.id,
        category: 'designer',
        title: des.name,
        subtitle: des.handle,
        timestamp: des.createdAt.toISOString(),
        requestedAction: 'Verify Designer Showcase Application',
        linkTab: 'designers',
      });
    }

    // Pending users
    for (const u of allUsers.filter((usr) => usr.approvalStatus === 'Pending')) {
      pendingQueue.push({
        id: u.id,
        category: 'user',
        title: u.name,
        subtitle: `Role Request: ${u.role}`,
        timestamp: u.createdAt.toISOString(),
        requestedAction: 'Approve User Role Upgrade',
        linkTab: 'users',
      });
    }

    return {
      summary: {
        totalRevenue,
        totalOrders: allOrders.length,
        avgOrderValue,
        totalUsers: allUsers.length,
        activeUsers,
        totalRetailers: allStores.length,
        approvedRetailers: approvedRetailersCount,
        totalDesigners: allDesigners.length,
        verifiedDesigners: verifiedDesignersCount,
        totalDesigns: allDesigns.length,
        totalProducts: allProducts.length,
        lowStockProducts: lowStockCount,
        pendingApprovalsTotal,
      },
      pendingBreakdown: {
        users: pendingUsersCount,
        retailers: pendingRetailersCount,
        designers: pendingDesignersCount,
        designs: pendingDesignsCount,
      },
      roleBreakdown,
      orderStatusBreakdown,
      recentActivity: recentActivity.slice(0, 10),
      recentOrders: recentCustomerOrders as any,
      pendingQueue: pendingQueue.slice(0, 8),
    };
  },
};
