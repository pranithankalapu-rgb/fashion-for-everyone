import { prisma } from '../db';
import { sanitizeString } from '../security';
import type {
  AdminRetailer,
  AdminRetailerStats,
} from '../types/fashion';

export const VALID_APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const VALID_ACCOUNT_STATUSES = ['Active', 'Inactive', 'Suspended'];

export interface GetRetailersFilter {
  approvalStatus?: string;
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'storeName' | 'managerName' | 'approvalStatus' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const adminRetailerService = {
  /**
   * Retrieves all retailer store applications with search, status filters, and live stats from PostgreSQL.
   */
  async getAllRetailers(filters: GetRetailersFilter = {}) {
    const {
      approvalStatus,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit,
      offset,
    } = filters;

    const where: any = {};

    // Filter by approval status
    if (approvalStatus && approvalStatus !== 'All') {
      const sanitizedApproval = sanitizeString(approvalStatus);
      where.approvalStatus = { equals: sanitizedApproval, mode: 'insensitive' };
    }

    // Filter by account status
    if (status && status !== 'All') {
      const sanitizedStatus = sanitizeString(status);
      where.status = { equals: sanitizedStatus, mode: 'insensitive' };
    }

    // Search across storeName, managerName, managerEmail, managerPhone, taxId, address, businessType
    if (search && search.trim()) {
      const sanitizedSearch = sanitizeString(search.trim());
      where.OR = [
        { storeName: { contains: sanitizedSearch, mode: 'insensitive' } },
        { managerName: { contains: sanitizedSearch, mode: 'insensitive' } },
        { managerEmail: { contains: sanitizedSearch, mode: 'insensitive' } },
        { managerPhone: { contains: sanitizedSearch, mode: 'insensitive' } },
        { taxId: { contains: sanitizedSearch, mode: 'insensitive' } },
        { address: { contains: sanitizedSearch, mode: 'insensitive' } },
        { businessType: { contains: sanitizedSearch, mode: 'insensitive' } },
      ];
    }

    // Order by mapping
    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === 'storeName') {
      orderBy = { storeName: sortOrder };
    } else if (sortBy === 'managerName') {
      orderBy = { managerName: sortOrder };
    } else if (sortBy === 'approvalStatus') {
      orderBy = { approvalStatus: sortOrder };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    }

    const [stores, totalMatching, allStoresForStats, allStoreStocks] = await Promise.all([
      prisma.storeSettings.findMany({
        where,
        orderBy,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
      }),
      prisma.storeSettings.count({ where }),
      prisma.storeSettings.findMany({
        select: {
          approvalStatus: true,
          status: true,
        },
      }),
      prisma.storeStock.findMany({
        select: {
          storeName: true,
          retailer: true,
        },
      }),
    ]);

    // Live KPI stats computation
    const stats: AdminRetailerStats = {
      totalStores: allStoresForStats.length,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      totalStockLocations: allStoreStocks.length,
    };

    for (const s of allStoresForStats) {
      const app = (s.approvalStatus || 'Approved').toLowerCase();
      if (app === 'pending') stats.pendingCount++;
      else if (app === 'approved') stats.approvedCount++;
      else if (app === 'rejected') stats.rejectedCount++;

      const st = (s.status || 'Active').toLowerCase();
      if (st === 'active') stats.activeCount++;
      else stats.inactiveCount++;
    }

    // Map store records and calculate stock locations count
    const retailers: AdminRetailer[] = stores.map((s) => {
      const stocksCount = allStoreStocks.filter(
        (st) =>
          st.storeName?.toLowerCase() === s.storeName.toLowerCase() ||
          st.retailer?.toLowerCase() === s.storeName.toLowerCase()
      ).length;

      return {
        id: s.id,
        storeName: s.storeName,
        logoUrl: s.logoUrl,
        taxId: s.taxId,
        currency: s.currency,
        managerName: s.managerName,
        managerEmail: s.managerEmail,
        managerPhone: s.managerPhone,
        address: s.address,
        supportEmail: s.supportEmail,
        supportPhone: s.supportPhone,
        autoFulfill: s.autoFulfill,
        lowStockThreshold: s.lowStockThreshold,
        emailNotifications: s.emailNotifications,
        smsAlerts: s.smsAlerts,
        weeklyReport: s.weeklyReport,
        approvalStatus: (s.approvalStatus as any) || 'Approved',
        status: (s.status as any) || 'Active',
        rejectionReason: s.rejectionReason,
        businessType: s.businessType,
        createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: s.updatedAt ? s.updatedAt.toISOString() : new Date().toISOString(),
        storeStocksCount: stocksCount,
        totalProductsStocked: stocksCount > 0 ? stocksCount * 4 : 0,
      };
    });

    return {
      retailers,
      stats,
      total: totalMatching,
    };
  },

  /**
   * Retrieves single retailer store application by ID.
   */
  async getRetailerById(id: string): Promise<AdminRetailer | null> {
    const sanitizedId = sanitizeString(id);

    const store = await prisma.storeSettings.findUnique({
      where: { id: sanitizedId },
    });

    if (!store) return null;

    const stocks = await prisma.storeStock.findMany({
      where: {
        OR: [
          { storeName: { equals: store.storeName, mode: 'insensitive' } },
          { retailer: { equals: store.storeName, mode: 'insensitive' } },
        ],
      },
    });

    return {
      id: store.id,
      storeName: store.storeName,
      logoUrl: store.logoUrl,
      taxId: store.taxId,
      currency: store.currency,
      managerName: store.managerName,
      managerEmail: store.managerEmail,
      managerPhone: store.managerPhone,
      address: store.address,
      supportEmail: store.supportEmail,
      supportPhone: store.supportPhone,
      autoFulfill: store.autoFulfill,
      lowStockThreshold: store.lowStockThreshold,
      emailNotifications: store.emailNotifications,
      smsAlerts: store.smsAlerts,
      weeklyReport: store.weeklyReport,
      approvalStatus: (store.approvalStatus as any) || 'Approved',
      status: (store.status as any) || 'Active',
      rejectionReason: store.rejectionReason,
      businessType: store.businessType,
      createdAt: store.createdAt ? store.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: store.updatedAt ? store.updatedAt.toISOString() : new Date().toISOString(),
      storeStocksCount: stocks.length,
      totalProductsStocked: stocks.length * 4,
    };
  },

  /**
   * Approves or rejects a retailer store application.
   */
  async updateRetailerApproval(
    id: string,
    approvalStatus: string,
    rejectionReason?: string
  ): Promise<AdminRetailer | null> {
    const sanitizedId = sanitizeString(id);
    const sanitizedApproval = sanitizeString(approvalStatus);

    const matchedApproval = VALID_APPROVAL_STATUSES.find(
      (s) => s.toLowerCase() === sanitizedApproval.toLowerCase()
    );

    if (!matchedApproval) {
      throw new Error(`Invalid approval status '${approvalStatus}'. Permitted: ${VALID_APPROVAL_STATUSES.join(', ')}`);
    }

    const existingStore = await prisma.storeSettings.findUnique({
      where: { id: sanitizedId },
    });

    if (!existingStore) return null;

    const updateData: any = {
      approvalStatus: matchedApproval,
    };

    if (matchedApproval === 'Approved') {
      updateData.rejectionReason = null;
      updateData.status = 'Active';

      // If there is a UserProfile matching managerEmail, ensure their role is approved as retailer
      if (existingStore.managerEmail) {
        await prisma.userProfile.updateMany({
          where: { email: { equals: existingStore.managerEmail, mode: 'insensitive' } },
          data: {
            role: 'retailer',
            approvalStatus: 'Approved',
            requestedRole: null,
            status: 'Active',
          },
        }).catch(() => {});
      }
    } else {
      updateData.rejectionReason = rejectionReason
        ? sanitizeString(rejectionReason)
        : 'Retailer verification requirements were not fulfilled.';
    }

    const updated = await prisma.storeSettings.update({
      where: { id: existingStore.id },
      data: updateData,
    });

    return this.getRetailerById(updated.id);
  },

  /**
   * Updates retailer account status (Active, Inactive, Suspended).
   */
  async updateRetailerStatus(id: string, newStatus: string): Promise<AdminRetailer | null> {
    const sanitizedId = sanitizeString(id);
    const sanitizedStatus = sanitizeString(newStatus);

    const matchedStatus = VALID_ACCOUNT_STATUSES.find(
      (s) => s.toLowerCase() === sanitizedStatus.toLowerCase()
    );

    if (!matchedStatus) {
      throw new Error(`Invalid status '${newStatus}'. Permitted: ${VALID_ACCOUNT_STATUSES.join(', ')}`);
    }

    const existing = await prisma.storeSettings.findUnique({ where: { id: sanitizedId } });
    if (!existing) return null;

    const updated = await prisma.storeSettings.update({
      where: { id: existing.id },
      data: { status: matchedStatus },
    });

    return this.getRetailerById(updated.id);
  },

  /**
   * Creates a new retailer store application in PostgreSQL.
   */
  async createRetailer(data: Partial<AdminRetailer>): Promise<AdminRetailer> {
    if (!data.storeName || !data.storeName.trim()) {
      throw new Error('Store name is required.');
    }
    if (!data.managerName || !data.managerName.trim()) {
      throw new Error('Manager name is required.');
    }

    const storeName = sanitizeString(data.storeName.trim());
    const managerName = sanitizeString(data.managerName.trim());
    const managerEmail = data.managerEmail ? sanitizeString(data.managerEmail.trim().toLowerCase()) : 'retailer@store.com';
    const managerPhone = data.managerPhone ? sanitizeString(data.managerPhone.trim()) : '+1 (555) 000-0000';
    const address = data.address ? sanitizeString(data.address.trim()) : 'Flagship Location';
    const taxId = data.taxId ? sanitizeString(data.taxId.trim()) : `TAX-${Date.now().toString().slice(-6)}`;
    const businessType = data.businessType ? sanitizeString(data.businessType.trim()) : 'Boutique Flagship';
    const approvalStatus = (data.approvalStatus && VALID_APPROVAL_STATUSES.includes(data.approvalStatus))
      ? data.approvalStatus
      : 'Approved';
    const status = (data.status && VALID_ACCOUNT_STATUSES.includes(data.status))
      ? data.status
      : 'Active';

    const newStore = await prisma.storeSettings.create({
      data: {
        storeName,
        managerName,
        managerEmail,
        managerPhone,
        address,
        taxId,
        businessType,
        approvalStatus,
        status,
        logoUrl: data.logoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80',
        supportEmail: data.supportEmail || managerEmail,
        supportPhone: data.supportPhone || managerPhone,
        currency: data.currency || '$',
        autoFulfill: data.autoFulfill ?? false,
        lowStockThreshold: data.lowStockThreshold || 5,
        emailNotifications: data.emailNotifications ?? true,
        smsAlerts: data.smsAlerts ?? true,
        weeklyReport: data.weeklyReport ?? true,
      },
    });

    const created = await this.getRetailerById(newStore.id);
    return created!;
  },

  /**
   * Updates retailer store application details.
   */
  async updateRetailer(id: string, data: Partial<AdminRetailer>): Promise<AdminRetailer | null> {
    const sanitizedId = sanitizeString(id);

    const existing = await prisma.storeSettings.findUnique({ where: { id: sanitizedId } });
    if (!existing) return null;

    const updateData: any = {};
    if (data.storeName) updateData.storeName = sanitizeString(data.storeName);
    if (data.managerName) updateData.managerName = sanitizeString(data.managerName);
    if (data.managerEmail) updateData.managerEmail = sanitizeString(data.managerEmail);
    if (data.managerPhone) updateData.managerPhone = sanitizeString(data.managerPhone);
    if (data.address) updateData.address = sanitizeString(data.address);
    if (data.taxId) updateData.taxId = sanitizeString(data.taxId);
    if (data.businessType) updateData.businessType = sanitizeString(data.businessType);
    if (data.logoUrl) updateData.logoUrl = sanitizeString(data.logoUrl);
    if (data.supportEmail) updateData.supportEmail = sanitizeString(data.supportEmail);
    if (data.supportPhone) updateData.supportPhone = sanitizeString(data.supportPhone);
    if (data.approvalStatus && VALID_APPROVAL_STATUSES.includes(data.approvalStatus)) {
      updateData.approvalStatus = data.approvalStatus;
    }
    if (data.status && VALID_ACCOUNT_STATUSES.includes(data.status)) {
      updateData.status = data.status;
    }
    if (data.rejectionReason !== undefined) {
      updateData.rejectionReason = data.rejectionReason ? sanitizeString(data.rejectionReason) : null;
    }

    const updated = await prisma.storeSettings.update({
      where: { id: existing.id },
      data: updateData,
    });

    return this.getRetailerById(updated.id);
  },

  /**
   * Deletes a retailer store from PostgreSQL.
   */
  async deleteRetailer(id: string): Promise<AdminRetailer | null> {
    const sanitizedId = sanitizeString(id);

    const existing = await prisma.storeSettings.findUnique({ where: { id: sanitizedId } });
    if (!existing) return null;

    const details = await this.getRetailerById(existing.id);

    await prisma.storeSettings.delete({
      where: { id: existing.id },
    });

    return details;
  },

  /**
   * Returns live retailer stats.
   */
  async getRetailerStats(): Promise<AdminRetailerStats> {
    const [allStores, allStoreStocks] = await Promise.all([
      prisma.storeSettings.findMany({
        select: {
          approvalStatus: true,
          status: true,
        },
      }),
      prisma.storeStock.count(),
    ]);

    const stats: AdminRetailerStats = {
      totalStores: allStores.length,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      totalStockLocations: allStoreStocks,
    };

    for (const s of allStores) {
      const app = (s.approvalStatus || 'Approved').toLowerCase();
      if (app === 'pending') stats.pendingCount++;
      else if (app === 'approved') stats.approvedCount++;
      else if (app === 'rejected') stats.rejectedCount++;

      const st = (s.status || 'Active').toLowerCase();
      if (st === 'active') stats.activeCount++;
      else stats.inactiveCount++;
    }

    return stats;
  },
};
