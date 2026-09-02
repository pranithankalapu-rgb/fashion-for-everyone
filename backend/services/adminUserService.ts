import { prisma } from '../db';
import { sanitizeString } from '../security';
import type {
  AdminUser,
  AdminUserStats,
  UserApprovalStatus,
  UserAccountStatus,
  UserRole,
} from '../types/fashion';

export const VALID_ROLES: UserRole[] = ['customer', 'designer', 'retailer', 'admin'];
export const VALID_APPROVAL_STATUSES: UserApprovalStatus[] = ['Pending', 'Approved', 'Rejected'];
export const VALID_ACCOUNT_STATUSES: UserAccountStatus[] = ['Active', 'Inactive', 'Suspended'];

export interface GetUsersFilter {
  role?: string;
  approvalStatus?: string;
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'email' | 'role' | 'approvalStatus' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const adminUserService = {
  /**
   * Retrieves all users from PostgreSQL with filtering, search, sorting, and live stats.
   */
  async getAllUsers(filters: GetUsersFilter = {}) {
    const {
      role,
      approvalStatus,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit,
      offset,
    } = filters;

    const where: any = {};

    // Filter by role
    if (role && role !== 'All') {
      const sanitizedRole = sanitizeString(role).toLowerCase();
      where.role = { equals: sanitizedRole, mode: 'insensitive' };
    }

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

    // Search query across name, email, phone, role, requestedRole, id
    if (search && search.trim()) {
      const sanitizedSearch = sanitizeString(search.trim());
      where.OR = [
        { name: { contains: sanitizedSearch, mode: 'insensitive' } },
        { email: { contains: sanitizedSearch, mode: 'insensitive' } },
        { phone: { contains: sanitizedSearch, mode: 'insensitive' } },
        { role: { contains: sanitizedSearch, mode: 'insensitive' } },
        { requestedRole: { contains: sanitizedSearch, mode: 'insensitive' } },
        { id: { contains: sanitizedSearch, mode: 'insensitive' } },
      ];
    }

    // Order by mapping
    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'email') {
      orderBy = { email: sortOrder };
    } else if (sortBy === 'role') {
      orderBy = { role: sortOrder };
    } else if (sortBy === 'approvalStatus') {
      orderBy = { approvalStatus: sortOrder };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    }

    const [userProfiles, totalMatching, allUsersForStats] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        orderBy,
        ...(limit ? { take: limit } : {}),
        ...(offset ? { skip: offset } : {}),
      }),
      prisma.userProfile.count({ where }),
      prisma.userProfile.findMany({
        select: {
          role: true,
          approvalStatus: true,
          status: true,
        },
      }),
    ]);

    // Compute live operational statistics
    const stats: AdminUserStats = {
      totalUsers: allUsersForStats.length,
      pendingApprovals: 0,
      approvedCount: 0,
      rejectedCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      roleCounts: {
        customer: 0,
        designer: 0,
        retailer: 0,
        admin: 0,
      },
    };

    for (const u of allUsersForStats) {
      const approval = (u.approvalStatus || 'Approved').toLowerCase();
      if (approval === 'pending') stats.pendingApprovals++;
      else if (approval === 'approved') stats.approvedCount++;
      else if (approval === 'rejected') stats.rejectedCount++;

      const st = (u.status || 'Active').toLowerCase();
      if (st === 'active') stats.activeCount++;
      else stats.inactiveCount++;

      const r = (u.role || 'customer').toLowerCase() as keyof typeof stats.roleCounts;
      if (stats.roleCounts[r] !== undefined) {
        stats.roleCounts[r]++;
      } else {
        stats.roleCounts.customer++;
      }
    }

    // Map profiles into AdminUser structure
    const users: AdminUser[] = userProfiles.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      avatar: p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      photoUrl: p.photoUrl,
      skinTone: p.skinTone,
      undertone: p.undertone,
      hairColor: p.hairColor,
      bodyShape: p.bodyShape,
      measurements: p.measurements,
      selectedOccasions: p.selectedOccasions,
      styleVibes: p.styleVibes,
      completedOnboarding: p.completedOnboarding,
      role: (p.role as UserRole) || 'customer',
      approvalStatus: (p.approvalStatus as UserApprovalStatus) || 'Approved',
      status: (p.status as UserAccountStatus) || 'Active',
      requestedRole: p.requestedRole,
      rejectionReason: p.rejectionReason,
      phone: p.phone,
      bio: p.bio,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return {
      users,
      stats,
      total: totalMatching,
    };
  },

  /**
   * Retrieves a single user by ID or Email, including linked designer or order count.
   */
  async getUserById(id: string): Promise<AdminUser | null> {
    const sanitizedId = sanitizeString(id);

    const user = await prisma.userProfile.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { email: sanitizedId }],
      },
    });

    if (!user) return null;

    let designerProfile = null;
    let ordersCount = 0;

    // Check if designer profile exists
    if (user.role === 'designer' || user.requestedRole === 'designer') {
      designerProfile = await prisma.designer.findFirst({
        where: {
          OR: [
            { name: { equals: user.name, mode: 'insensitive' } },
            { id: user.id },
          ],
        },
      });
    }

    // Check customer orders count if email exists
    if (user.email) {
      ordersCount = await prisma.customerOrder.count({
        where: { customerEmail: { equals: user.email, mode: 'insensitive' } },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      photoUrl: user.photoUrl,
      skinTone: user.skinTone,
      undertone: user.undertone,
      hairColor: user.hairColor,
      bodyShape: user.bodyShape,
      measurements: user.measurements,
      selectedOccasions: user.selectedOccasions,
      styleVibes: user.styleVibes,
      completedOnboarding: user.completedOnboarding,
      role: (user.role as UserRole) || 'customer',
      approvalStatus: (user.approvalStatus as UserApprovalStatus) || 'Approved',
      status: (user.status as UserAccountStatus) || 'Active',
      requestedRole: user.requestedRole,
      rejectionReason: user.rejectionReason,
      phone: user.phone,
      bio: user.bio,
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
      designerProfile,
      ordersCount,
    };
  },

  /**
   * Approves or rejects a user registration or role upgrade request.
   */
  async updateUserApproval(
    id: string,
    approvalStatus: string,
    rejectionReason?: string,
    approvedRole?: string
  ): Promise<AdminUser | null> {
    const sanitizedId = sanitizeString(id);
    const sanitizedApproval = sanitizeString(approvalStatus);

    const matchedApproval = VALID_APPROVAL_STATUSES.find(
      (s) => s.toLowerCase() === sanitizedApproval.toLowerCase()
    );

    if (!matchedApproval) {
      throw new Error(`Invalid approval status '${approvalStatus}'. Permitted: ${VALID_APPROVAL_STATUSES.join(', ')}`);
    }

    const existingUser = await prisma.userProfile.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { email: sanitizedId }],
      },
    });

    if (!existingUser) return null;

    const updateData: any = {
      approvalStatus: matchedApproval,
    };

    if (matchedApproval === 'Approved') {
      updateData.rejectionReason = null;
      let finalRole: UserRole = existingUser.role as UserRole;

      if (approvedRole) {
        const sanitizedApprovedRole = sanitizeString(approvedRole).toLowerCase() as UserRole;
        if (VALID_ROLES.includes(sanitizedApprovedRole)) {
          finalRole = sanitizedApprovedRole;
        }
      } else if (existingUser.requestedRole) {
        const requested = existingUser.requestedRole.toLowerCase() as UserRole;
        if (VALID_ROLES.includes(requested)) {
          finalRole = requested;
        }
      }

      updateData.role = finalRole;
      updateData.requestedRole = null;

      // If approved as a designer, ensure Designer record exists and verified is true
      if (finalRole === 'designer') {
        const existingDesigner = await prisma.designer.findFirst({
          where: {
            OR: [
              { name: { equals: existingUser.name, mode: 'insensitive' } },
              { id: existingUser.id },
            ],
          },
        });

        if (existingDesigner) {
          await prisma.designer.update({
            where: { id: existingDesigner.id },
            data: { verified: true },
          });
        } else {
          const handle = `@${existingUser.name.toLowerCase().replace(/\s+/g, '')}`;
          await prisma.designer.create({
            data: {
              id: existingUser.id,
              name: existingUser.name,
              handle,
              avatar: existingUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
              bio: existingUser.bio || `Official certified designer portfolio for ${existingUser.name}.`,
              followers: 120,
              avgRating: 5.0,
              totalVotes: 10,
              badges: ['New', 'Top Rated'],
              verified: true,
            },
          });
        }
      }
    } else {
      // Rejected
      updateData.rejectionReason = rejectionReason
        ? sanitizeString(rejectionReason)
        : 'Application rejected according to platform governance standards.';
    }

    const updated = await prisma.userProfile.update({
      where: { id: existingUser.id },
      data: updateData,
    });

    return this.getUserById(updated.id);
  },

  /**
   * Directly updates a user's role (customer, designer, retailer, admin).
   */
  async updateUserRole(id: string, newRole: string): Promise<AdminUser | null> {
    const sanitizedId = sanitizeString(id);
    const sanitizedRole = sanitizeString(newRole).toLowerCase() as UserRole;

    if (!VALID_ROLES.includes(sanitizedRole)) {
      throw new Error(`Invalid role '${newRole}'. Permitted roles: ${VALID_ROLES.join(', ')}`);
    }

    const existingUser = await prisma.userProfile.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { email: sanitizedId }],
      },
    });

    if (!existingUser) return null;

    const updateData: any = {
      role: sanitizedRole,
      approvalStatus: 'Approved',
      requestedRole: null,
      rejectionReason: null,
    };

    // If upgraded to designer, ensure Designer table record is verified
    if (sanitizedRole === 'designer') {
      const existingDesigner = await prisma.designer.findFirst({
        where: {
          OR: [
            { name: { equals: existingUser.name, mode: 'insensitive' } },
            { id: existingUser.id },
          ],
        },
      });

      if (existingDesigner) {
        await prisma.designer.update({
          where: { id: existingDesigner.id },
          data: { verified: true },
        });
      } else {
        const handle = `@${existingUser.name.toLowerCase().replace(/\s+/g, '')}`;
        await prisma.designer.create({
          data: {
            id: existingUser.id,
            name: existingUser.name,
            handle,
            avatar: existingUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            bio: existingUser.bio || `Official certified designer portfolio for ${existingUser.name}.`,
            followers: 150,
            avgRating: 5.0,
            totalVotes: 12,
            badges: ['New', 'Top Rated'],
            verified: true,
          },
        });
      }
    }

    const updated = await prisma.userProfile.update({
      where: { id: existingUser.id },
      data: updateData,
    });

    return this.getUserById(updated.id);
  },

  /**
   * Updates a user's account status (Active, Inactive, Suspended).
   */
  async updateUserStatus(id: string, newStatus: string): Promise<AdminUser | null> {
    const sanitizedId = sanitizeString(id);
    const sanitizedStatus = sanitizeString(newStatus);

    const matchedStatus = VALID_ACCOUNT_STATUSES.find(
      (s) => s.toLowerCase() === sanitizedStatus.toLowerCase()
    );

    if (!matchedStatus) {
      throw new Error(`Invalid status '${newStatus}'. Permitted: ${VALID_ACCOUNT_STATUSES.join(', ')}`);
    }

    const existingUser = await prisma.userProfile.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { email: sanitizedId }],
      },
    });

    if (!existingUser) return null;

    const updated = await prisma.userProfile.update({
      where: { id: existingUser.id },
      data: { status: matchedStatus },
    });

    return this.getUserById(updated.id);
  },

  /**
   * Creates a new user profile record in PostgreSQL.
   */
  async createUser(data: Partial<AdminUser>): Promise<AdminUser> {
    if (!data.name || !data.name.trim()) {
      throw new Error('User name is required.');
    }

    const name = sanitizeString(data.name.trim());
    const email = data.email ? sanitizeString(data.email.trim().toLowerCase()) : null;

    if (email) {
      const existingEmail = await prisma.userProfile.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new Error(`A user with email '${email}' already exists.`);
      }
    }

    const role = (data.role && VALID_ROLES.includes(data.role as UserRole))
      ? (data.role as UserRole)
      : 'customer';

    const approvalStatus = (data.approvalStatus && VALID_APPROVAL_STATUSES.includes(data.approvalStatus as UserApprovalStatus))
      ? (data.approvalStatus as UserApprovalStatus)
      : 'Approved';

    const status = (data.status && VALID_ACCOUNT_STATUSES.includes(data.status as UserAccountStatus))
      ? (data.status as UserAccountStatus)
      : 'Active';

    const avatar = data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

    const newUser = await prisma.userProfile.create({
      data: {
        name,
        email,
        avatar,
        photoUrl: data.photoUrl ? sanitizeString(data.photoUrl) : null,
        phone: data.phone ? sanitizeString(data.phone) : null,
        bio: data.bio ? sanitizeString(data.bio) : null,
        role,
        approvalStatus,
        status,
        requestedRole: data.requestedRole ? sanitizeString(data.requestedRole) : null,
        skinTone: data.skinTone ? sanitizeString(data.skinTone) : 'Warm Golden',
        undertone: data.undertone ? sanitizeString(data.undertone) : 'Warm',
        hairColor: data.hairColor ? sanitizeString(data.hairColor) : 'Chestnut Brown',
        bodyShape: data.bodyShape ? sanitizeString(data.bodyShape) : 'Hourglass',
        measurements: data.measurements || { heightCm: 170, chestCm: 88, waistCm: 68, hipsCm: 94 },
        selectedOccasions: data.selectedOccasions || ['Work', 'Date night', 'Casual'],
        styleVibes: data.styleVibes || ['Minimalist', 'Smart casual'],
        completedOnboarding: true,
      },
    });

    // If created directly as a designer, ensure Designer record exists
    if (role === 'designer') {
      const handle = `@${name.toLowerCase().replace(/\s+/g, '')}`;
      await prisma.designer.create({
        data: {
          id: newUser.id,
          name: newUser.name,
          handle,
          avatar: newUser.avatar,
          bio: newUser.bio || `Official certified designer portfolio for ${newUser.name}.`,
          followers: 100,
          avgRating: 5.0,
          totalVotes: 5,
          badges: ['New'],
          verified: true,
        },
      }).catch(() => {});
    }

    const created = await this.getUserById(newUser.id);
    return created!;
  },

  /**
   * Updates user details in PostgreSQL.
   */
  async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser | null> {
    const sanitizedId = sanitizeString(id);

    const existing = await prisma.userProfile.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { email: sanitizedId }],
      },
    });

    if (!existing) return null;

    const updateData: any = {};

    if (data.name) updateData.name = sanitizeString(data.name);
    if (data.email !== undefined) {
      const email = data.email ? sanitizeString(data.email.trim().toLowerCase()) : null;
      if (email && email !== existing.email) {
        const taken = await prisma.userProfile.findUnique({ where: { email } });
        if (taken) throw new Error(`Email '${email}' is already in use by another user.`);
      }
      updateData.email = email;
    }
    if (data.avatar) updateData.avatar = sanitizeString(data.avatar);
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl ? sanitizeString(data.photoUrl) : null;
    if (data.phone !== undefined) updateData.phone = data.phone ? sanitizeString(data.phone) : null;
    if (data.bio !== undefined) updateData.bio = data.bio ? sanitizeString(data.bio) : null;
    if (data.role && VALID_ROLES.includes(data.role as UserRole)) updateData.role = data.role;
    if (data.approvalStatus && VALID_APPROVAL_STATUSES.includes(data.approvalStatus as UserApprovalStatus)) {
      updateData.approvalStatus = data.approvalStatus;
    }
    if (data.status && VALID_ACCOUNT_STATUSES.includes(data.status as UserAccountStatus)) {
      updateData.status = data.status;
    }
    if (data.requestedRole !== undefined) updateData.requestedRole = data.requestedRole ? sanitizeString(data.requestedRole) : null;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason ? sanitizeString(data.rejectionReason) : null;
    if (data.skinTone) updateData.skinTone = sanitizeString(data.skinTone);
    if (data.undertone) updateData.undertone = sanitizeString(data.undertone);
    if (data.hairColor) updateData.hairColor = sanitizeString(data.hairColor);
    if (data.bodyShape) updateData.bodyShape = sanitizeString(data.bodyShape);
    if (data.measurements) updateData.measurements = data.measurements;
    if (data.selectedOccasions) updateData.selectedOccasions = data.selectedOccasions;
    if (data.styleVibes) updateData.styleVibes = data.styleVibes;

    await prisma.userProfile.update({
      where: { id: existing.id },
      data: updateData,
    });

    return this.getUserById(existing.id);
  },

  /**
   * Deletes a user profile from PostgreSQL.
   */
  async deleteUser(id: string): Promise<AdminUser | null> {
    const sanitizedId = sanitizeString(id);

    const existing = await prisma.userProfile.findFirst({
      where: {
        OR: [{ id: sanitizedId }, { email: sanitizedId }],
      },
    });

    if (!existing) return null;

    const userDetails = await this.getUserById(existing.id);

    await prisma.userProfile.delete({
      where: { id: existing.id },
    });

    return userDetails;
  },

  /**
   * Returns summary counts and KPI metrics across all users.
   */
  async getUserStats(): Promise<AdminUserStats> {
    const allUsers = await prisma.userProfile.findMany({
      select: {
        role: true,
        approvalStatus: true,
        status: true,
      },
    });

    const stats: AdminUserStats = {
      totalUsers: allUsers.length,
      pendingApprovals: 0,
      approvedCount: 0,
      rejectedCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      roleCounts: {
        customer: 0,
        designer: 0,
        retailer: 0,
        admin: 0,
      },
    };

    for (const u of allUsers) {
      const approval = (u.approvalStatus || 'Approved').toLowerCase();
      if (approval === 'pending') stats.pendingApprovals++;
      else if (approval === 'approved') stats.approvedCount++;
      else if (approval === 'rejected') stats.rejectedCount++;

      const st = (u.status || 'Active').toLowerCase();
      if (st === 'active') stats.activeCount++;
      else stats.inactiveCount++;

      const r = (u.role || 'customer').toLowerCase() as keyof typeof stats.roleCounts;
      if (stats.roleCounts[r] !== undefined) {
        stats.roleCounts[r]++;
      } else {
        stats.roleCounts.customer++;
      }
    }

    return stats;
  },
};
