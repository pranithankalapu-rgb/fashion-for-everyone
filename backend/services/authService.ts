import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma, getDb, saveDb } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'fashion-for-everyone-super-secret-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fashion-refresh-jwt-super-secret-key-2026';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d'; // 30-day rolling sliding window
const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

export type UserRole = 'customer' | 'designer' | 'retailer' | 'admin';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// In-memory cache for ultra-fast validation + database persistence backup
const refreshTokenStore = new Map<string, { userId: string; role: UserRole; expiresAt: Date }>();

export const authService = {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },

  generateTokens(payload: AuthUserPayload): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
      },
      REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);
    refreshTokenStore.set(refreshToken, { userId: payload.userId, role: payload.role, expiresAt });

    return { accessToken, refreshToken };
  },

  async persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);
      await prisma.userProfile.update({
        where: { id: userId },
        data: {
          refreshToken,
          refreshTokenExpiry: expiresAt,
        },
      });
    } catch (err) {
      // Non-fatal if DB is in fallback mode
      console.warn('Could not persist refresh token to database:', err);
    }
  },

  verifyAccessToken(token: string): AuthUserPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    } catch {
      return null;
    }
  },

  async verifyRefreshToken(token: string): Promise<{ userId: string; role: UserRole } | null> {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET) as { userId: string; role: UserRole };
      if (!decoded?.userId) return null;

      // 1. Check in-memory store
      const session = refreshTokenStore.get(token);

      // 2. Check PostgreSQL database persistence
      try {
        const user = await prisma.userProfile.findUnique({
          where: { id: decoded.userId },
        });

        if (!user || user.status !== 'Active') {
          refreshTokenStore.delete(token);
          return null;
        }

        // If refreshToken in DB is set, it must match the provided token
        if (user.refreshToken) {
          if (user.refreshToken === token) {
            if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
              return null;
            }
            return decoded;
          } else {
            // Token mismatch (already rotated or revoked)
            return null;
          }
        } else {
          // If DB has no token (revoked on logout)
          return null;
        }
      } catch {
        // In fallback DB mode
        if (session && session.expiresAt >= new Date()) {
          return decoded;
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  async revokeRefreshToken(userId?: string, token?: string): Promise<void> {
    if (token) {
      refreshTokenStore.delete(token);
    }

    if (userId) {
      try {
        await prisma.userProfile.update({
          where: { id: userId },
          data: {
            refreshToken: null,
            refreshTokenExpiry: null,
          },
        });
      } catch {}
    } else if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.userId) {
          await prisma.userProfile.update({
            where: { id: decoded.userId },
            data: {
              refreshToken: null,
              refreshTokenExpiry: null,
            },
          });
        }
      } catch {}
    }
  },

  async registerUser(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
  }) {
    const rawRole = (data.role || '').toLowerCase().trim();
    if (rawRole === 'admin') {
      throw new Error('Registration as admin is not permitted. Allowed roles: customer, designer, retailer.');
    }
    const ALLOWED_REGISTER_ROLES = ['customer', 'designer', 'retailer'] as const;
    if (rawRole && !ALLOWED_REGISTER_ROLES.includes(rawRole as any)) {
      throw new Error('Invalid registration role. Allowed roles: customer, designer, retailer.');
    }
    const role = (rawRole || 'customer') as UserRole;
    const passwordHash = await this.hashPassword(data.password);
    const email = data.email.toLowerCase().trim();

    // Check if user exists in database
    const existing = await prisma.userProfile.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const user = await prisma.userProfile.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
        role,
        phone: data.phone || null,
        approvalStatus: 'Approved',
        status: 'Active',
      },
    });

    // If designer role, ensure a linked Designer record exists in Designer table
    if (role === 'designer') {
      try {
        const existingDesigner = await prisma.designer.findFirst({
          where: { OR: [{ id: user.id }, { email: user.email }] },
        });
        if (!existingDesigner) {
          await prisma.designer.create({
            data: {
              id: user.id,
              name: user.name,
              handle: `@${user.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'designer'}`,
              avatar: user.avatar,
              bio: 'Fashion Designer & Creator',
              followers: 0,
              avgRating: 5.0,
              totalVotes: 0,
              badges: ['Verified Creator'],
              verified: true,
              email: user.email,
              approvalStatus: 'Approved',
              status: 'Active',
            },
          });
        }
      } catch (designerErr) {
        console.warn('Could not auto-create designer entity in db:', designerErr);
      }
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email || email,
      role: user.role as UserRole,
      name: user.name,
    });

    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  },

  async loginUser(credentials: { emailOrUsername: string; password: string; expectedRole?: UserRole }) {
    const input = credentials.emailOrUsername.trim().toLowerCase();

    // Check Admin credentials
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fashionforeveryone.com').toLowerCase();
    const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'adminpassword123';

    if ((input === adminEmail || input === adminUser) && credentials.password === adminPass) {
      const userPayload: AuthUserPayload = {
        userId: 'admin_root',
        email: adminEmail,
        role: 'admin',
        name: 'Super Admin',
      };
      const tokens = this.generateTokens(userPayload);
      return { user: userPayload, tokens };
    }

    // Check in PostgreSQL database
    const user = await prisma.userProfile.findFirst({
      where: { email: { equals: input, mode: 'insensitive' } },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status === 'Inactive' || user.status === 'Banned') {
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    // Verify password if hash is present; otherwise allow demo accounts with >= 6 chars
    const isMatch = (user as any).passwordHash
      ? await this.comparePassword(credentials.password, (user as any).passwordHash)
      : credentials.password.length >= 6;

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const userPayload: AuthUserPayload = {
      userId: user.id,
      email: user.email || input,
      role: (user.role as UserRole) || 'customer',
      name: user.name,
    };
    const tokens = this.generateTokens(userPayload);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return { user: userPayload, tokens };
  },
};
