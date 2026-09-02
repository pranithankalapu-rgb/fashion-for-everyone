import { prisma } from '../db';
import { sanitizeString } from '../security';
import type {
  AdminDesigner,
  AdminDesignSubmission,
  AdminDesignerStats,
} from '../types/fashion';

export const VALID_APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected'];

export interface GetDesignerSubmissionsFilter {
  type?: 'all' | 'designers' | 'designs';
  approvalStatus?: string;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'rating' | 'approvalStatus' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const adminDesignerService = {
  /**
   * Retrieves all designer applications and individual design submissions with live stats.
   */
  async getAllSubmissions(filters: GetDesignerSubmissionsFilter = {}) {
    const {
      type = 'all',
      approvalStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit,
      offset,
    } = filters;

    const designerWhere: any = {};
    const designWhere: any = {};

    // Filter by approval status
    if (approvalStatus && approvalStatus !== 'All') {
      const sanitizedApproval = sanitizeString(approvalStatus);
      designerWhere.approvalStatus = { equals: sanitizedApproval, mode: 'insensitive' };
      designWhere.approvalStatus = { equals: sanitizedApproval, mode: 'insensitive' };
    }

    // Search query
    if (search && search.trim()) {
      const sanitizedSearch = sanitizeString(search.trim());
      designerWhere.OR = [
        { name: { contains: sanitizedSearch, mode: 'insensitive' } },
        { handle: { contains: sanitizedSearch, mode: 'insensitive' } },
        { bio: { contains: sanitizedSearch, mode: 'insensitive' } },
        { email: { contains: sanitizedSearch, mode: 'insensitive' } },
      ];

      designWhere.OR = [
        { title: { contains: sanitizedSearch, mode: 'insensitive' } },
        { designerName: { contains: sanitizedSearch, mode: 'insensitive' } },
        { collection: { contains: sanitizedSearch, mode: 'insensitive' } },
        { occasion: { contains: sanitizedSearch, mode: 'insensitive' } },
      ];
    }

    // Ordering
    let designerOrderBy: any = { createdAt: sortOrder };
    let designOrderBy: any = { submittedAt: sortOrder };

    if (sortBy === 'name') {
      designerOrderBy = { name: sortOrder };
      designOrderBy = { designerName: sortOrder };
    } else if (sortBy === 'title') {
      designerOrderBy = { name: sortOrder };
      designOrderBy = { title: sortOrder };
    } else if (sortBy === 'rating') {
      designerOrderBy = { avgRating: sortOrder };
      designOrderBy = { rating: sortOrder };
    } else if (sortBy === 'approvalStatus') {
      designerOrderBy = { approvalStatus: sortOrder };
      designOrderBy = { approvalStatus: sortOrder };
    }

    const [
      designersList,
      designsList,
      allDesignersForStats,
      allDesignsForStats,
    ] = await Promise.all([
      type === 'designs'
        ? Promise.resolve([])
        : prisma.designer.findMany({
            where: designerWhere,
            orderBy: designerOrderBy,
            include: { designs: true },
            ...(limit ? { take: limit } : {}),
            ...(offset ? { skip: offset } : {}),
          }),
      type === 'designers'
        ? Promise.resolve([])
        : prisma.design.findMany({
            where: designWhere,
            orderBy: designOrderBy,
            ...(limit ? { take: limit } : {}),
            ...(offset ? { skip: offset } : {}),
          }),
      prisma.designer.findMany({
        select: {
          verified: true,
          approvalStatus: true,
          totalVotes: true,
        },
      }),
      prisma.design.findMany({
        select: {
          approvalStatus: true,
          votesCount: true,
        },
      }),
    ]);

    // Live Stats Computation
    const stats: AdminDesignerStats = {
      totalDesigners: allDesignersForStats.length,
      verifiedDesigners: allDesignersForStats.filter((d) => d.verified).length,
      pendingDesignerApprovals: allDesignersForStats.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'pending').length,
      rejectedDesigners: allDesignersForStats.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'rejected').length,
      totalDesigns: allDesignsForStats.length,
      approvedDesigns: allDesignsForStats.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'approved').length,
      pendingDesignApprovals: allDesignsForStats.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'pending').length,
      rejectedDesigns: allDesignsForStats.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'rejected').length,
      totalShowcaseVotes: allDesignsForStats.reduce((acc, d) => acc + (d.votesCount || 0), 0),
    };

    // Format output
    const designers: AdminDesigner[] = designersList.map((d) => ({
      id: d.id,
      name: d.name,
      handle: d.handle,
      avatar: d.avatar,
      bio: d.bio,
      followers: d.followers,
      avgRating: d.avgRating,
      totalVotes: d.totalVotes,
      badges: d.badges,
      verified: d.verified,
      approvalStatus: (d.approvalStatus as any) || 'Approved',
      status: (d.status as any) || 'Active',
      email: d.email,
      rejectionReason: d.rejectionReason,
      createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? d.updatedAt.toISOString() : new Date().toISOString(),
      designsCount: d.designs?.length || 0,
      designs: d.designs as any,
    }));

    const designs: AdminDesignSubmission[] = designsList.map((dn) => ({
      id: dn.id,
      designerId: dn.designerId,
      designerName: dn.designerName,
      designerAvatar: dn.designerAvatar,
      title: dn.title,
      collection: dn.collection,
      imageUrl: dn.imageUrl,
      rating: dn.rating,
      votesCount: dn.votesCount,
      occasion: dn.occasion,
      palette: dn.palette,
      price: dn.price,
      inStock: dn.inStock,
      approvalStatus: (dn.approvalStatus as any) || 'Approved',
      rejectionReason: dn.rejectionReason,
      status: (dn.status as any) || 'Active',
      createdAt: dn.createdAt,
      submittedAt: dn.submittedAt ? dn.submittedAt.toISOString() : new Date().toISOString(),
    }));

    return {
      designers,
      designs,
      stats,
      total: designers.length + designs.length,
    };
  },

  /**
   * Retrieves single designer details.
   */
  async getDesignerById(id: string): Promise<AdminDesigner | null> {
    const sanitizedId = sanitizeString(id);

    const designer = await prisma.designer.findUnique({
      where: { id: sanitizedId },
      include: { designs: true },
    });

    if (!designer) return null;

    return {
      id: designer.id,
      name: designer.name,
      handle: designer.handle,
      avatar: designer.avatar,
      bio: designer.bio,
      followers: designer.followers,
      avgRating: designer.avgRating,
      totalVotes: designer.totalVotes,
      badges: designer.badges,
      verified: designer.verified,
      approvalStatus: (designer.approvalStatus as any) || 'Approved',
      status: (designer.status as any) || 'Active',
      email: designer.email,
      rejectionReason: designer.rejectionReason,
      createdAt: designer.createdAt ? designer.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: designer.updatedAt ? designer.updatedAt.toISOString() : new Date().toISOString(),
      designsCount: designer.designs.length,
      designs: designer.designs as any,
    };
  },

  /**
   * Retrieves single design submission details.
   */
  async getDesignById(id: string): Promise<AdminDesignSubmission | null> {
    const sanitizedId = sanitizeString(id);

    const design = await prisma.design.findUnique({
      where: { id: sanitizedId },
      include: { designer: true },
    });

    if (!design) return null;

    return {
      id: design.id,
      designerId: design.designerId,
      designerName: design.designerName,
      designerAvatar: design.designerAvatar,
      title: design.title,
      collection: design.collection,
      imageUrl: design.imageUrl,
      rating: design.rating,
      votesCount: design.votesCount,
      occasion: design.occasion,
      palette: design.palette,
      price: design.price,
      inStock: design.inStock,
      approvalStatus: (design.approvalStatus as any) || 'Approved',
      rejectionReason: design.rejectionReason,
      status: (design.status as any) || 'Active',
      createdAt: design.createdAt,
      submittedAt: design.submittedAt ? design.submittedAt.toISOString() : new Date().toISOString(),
    };
  },

  /**
   * Approves or rejects a designer profile application.
   */
  async updateDesignerApproval(
    id: string,
    approvalStatus: string,
    rejectionReason?: string
  ): Promise<AdminDesigner | null> {
    const sanitizedId = sanitizeString(id);
    const sanitizedApproval = sanitizeString(approvalStatus);

    const matchedApproval = VALID_APPROVAL_STATUSES.find(
      (s) => s.toLowerCase() === sanitizedApproval.toLowerCase()
    );

    if (!matchedApproval) {
      throw new Error(`Invalid approval status '${approvalStatus}'. Permitted: ${VALID_APPROVAL_STATUSES.join(', ')}`);
    }

    const existingDesigner = await prisma.designer.findUnique({
      where: { id: sanitizedId },
    });

    if (!existingDesigner) return null;

    const updateData: any = {
      approvalStatus: matchedApproval,
    };

    if (matchedApproval === 'Approved') {
      updateData.verified = true;
      updateData.rejectionReason = null;
      updateData.status = 'Active';

      // Update associated UserProfile to approved designer
      await prisma.userProfile.updateMany({
        where: {
          OR: [
            { id: existingDesigner.id },
            { name: { equals: existingDesigner.name, mode: 'insensitive' } },
            ...(existingDesigner.email ? [{ email: { equals: existingDesigner.email, mode: 'insensitive' } }] : []),
          ],
        },
        data: {
          role: 'designer',
          approvalStatus: 'Approved',
          requestedRole: null,
          status: 'Active',
        },
      }).catch(() => {});
    } else {
      updateData.verified = false;
      updateData.rejectionReason = rejectionReason
        ? sanitizeString(rejectionReason)
        : 'Designer portfolio standards were not met.';
    }

    const updated = await prisma.designer.update({
      where: { id: existingDesigner.id },
      data: updateData,
    });

    return this.getDesignerById(updated.id);
  },

  /**
   * Approves or rejects an individual design submission.
   */
  async updateDesignApproval(
    id: string,
    approvalStatus: string,
    rejectionReason?: string
  ): Promise<AdminDesignSubmission | null> {
    const sanitizedId = sanitizeString(id);
    const sanitizedApproval = sanitizeString(approvalStatus);

    const matchedApproval = VALID_APPROVAL_STATUSES.find(
      (s) => s.toLowerCase() === sanitizedApproval.toLowerCase()
    );

    if (!matchedApproval) {
      throw new Error(`Invalid approval status '${approvalStatus}'. Permitted: ${VALID_APPROVAL_STATUSES.join(', ')}`);
    }

    const existingDesign = await prisma.design.findUnique({
      where: { id: sanitizedId },
    });

    if (!existingDesign) return null;

    const updateData: any = {
      approvalStatus: matchedApproval,
    };

    if (matchedApproval === 'Approved') {
      updateData.inStock = true;
      updateData.rejectionReason = null;
      updateData.status = 'Active';
    } else {
      updateData.inStock = false;
      updateData.rejectionReason = rejectionReason
        ? sanitizeString(rejectionReason)
        : 'Design submission does not meet showcase guidelines.';
    }

    const updated = await prisma.design.update({
      where: { id: existingDesign.id },
      data: updateData,
    });

    return this.getDesignById(updated.id);
  },

  /**
   * Creates a new designer profile in PostgreSQL.
   */
  async createDesigner(data: Partial<AdminDesigner>): Promise<AdminDesigner> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Designer name is required.');
    }

    const name = sanitizeString(data.name.trim());
    const handle = data.handle ? sanitizeString(data.handle.trim()) : `@${name.toLowerCase().replace(/\s+/g, '')}`;
    const avatar = data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
    const bio = data.bio ? sanitizeString(data.bio.trim()) : `Official certified designer portfolio for ${name}.`;
    const badges = data.badges || ['New'];
    const verified = data.verified ?? true;
    const approvalStatus = data.approvalStatus || 'Approved';
    const status = data.status || 'Active';
    const email = data.email ? sanitizeString(data.email.trim().toLowerCase()) : null;

    const newDesigner = await prisma.designer.create({
      data: {
        name,
        handle,
        avatar,
        bio,
        badges,
        verified,
        approvalStatus,
        status,
        email,
        followers: 120,
        avgRating: 5.0,
        totalVotes: 8,
      },
    });

    const created = await this.getDesignerById(newDesigner.id);
    return created!;
  },

  /**
   * Updates designer details.
   */
  async updateDesigner(id: string, data: Partial<AdminDesigner>): Promise<AdminDesigner | null> {
    const sanitizedId = sanitizeString(id);

    const existing = await prisma.designer.findUnique({ where: { id: sanitizedId } });
    if (!existing) return null;

    const updateData: any = {};
    if (data.name) updateData.name = sanitizeString(data.name);
    if (data.handle) updateData.handle = sanitizeString(data.handle);
    if (data.avatar) updateData.avatar = sanitizeString(data.avatar);
    if (data.bio) updateData.bio = sanitizeString(data.bio);
    if (data.badges) updateData.badges = data.badges;
    if (data.verified !== undefined) updateData.verified = data.verified;
    if (data.approvalStatus && VALID_APPROVAL_STATUSES.includes(data.approvalStatus)) {
      updateData.approvalStatus = data.approvalStatus;
    }
    if (data.status) updateData.status = data.status;
    if (data.email !== undefined) updateData.email = data.email ? sanitizeString(data.email) : null;
    if (data.rejectionReason !== undefined) {
      updateData.rejectionReason = data.rejectionReason ? sanitizeString(data.rejectionReason) : null;
    }

    const updated = await prisma.designer.update({
      where: { id: existing.id },
      data: updateData,
    });

    return this.getDesignerById(updated.id);
  },

  /**
   * Deletes a designer from PostgreSQL.
   */
  async deleteDesigner(id: string): Promise<AdminDesigner | null> {
    const sanitizedId = sanitizeString(id);

    const existing = await prisma.designer.findUnique({ where: { id: sanitizedId } });
    if (!existing) return null;

    const details = await this.getDesignerById(existing.id);

    await prisma.designer.delete({
      where: { id: existing.id },
    });

    return details;
  },

  /**
   * Deletes a design submission from PostgreSQL.
   */
  async deleteDesign(id: string): Promise<AdminDesignSubmission | null> {
    const sanitizedId = sanitizeString(id);

    const existing = await prisma.design.findUnique({ where: { id: sanitizedId } });
    if (!existing) return null;

    const details = await this.getDesignById(existing.id);

    await prisma.design.delete({
      where: { id: existing.id },
    });

    return details;
  },

  /**
   * Returns live stats.
   */
  async getDesignerStats(): Promise<AdminDesignerStats> {
    const [allDesigners, allDesigns] = await Promise.all([
      prisma.designer.findMany({
        select: {
          verified: true,
          approvalStatus: true,
        },
      }),
      prisma.design.findMany({
        select: {
          approvalStatus: true,
          votesCount: true,
        },
      }),
    ]);

    const stats: AdminDesignerStats = {
      totalDesigners: allDesigners.length,
      verifiedDesigners: allDesigners.filter((d) => d.verified).length,
      pendingDesignerApprovals: allDesigners.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'pending').length,
      rejectedDesigners: allDesigners.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'rejected').length,
      totalDesigns: allDesigns.length,
      approvedDesigns: allDesigns.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'approved').length,
      pendingDesignApprovals: allDesigns.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'pending').length,
      rejectedDesigns: allDesigns.filter((d) => (d.approvalStatus || 'Approved').toLowerCase() === 'rejected').length,
      totalShowcaseVotes: allDesigns.reduce((acc, d) => acc + (d.votesCount || 0), 0),
    };

    return stats;
  },
};
