import type { Request, Response } from 'express';
import { authService, type UserRole } from '../services/authService';
import { sanitizeString } from '../security';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { resolveMediaUrl } from '../services/mediaService';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days sliding window
};

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const name = sanitizeString(req.body.name);
      const email = sanitizeString(req.body.email);
      const password = req.body.password;
      const role = sanitizeString(req.body.role) as UserRole;
      const phone = sanitizeString(req.body.phone);

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const { user, tokens } = await authService.registerUser({ name, email, password, role, phone });

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });

      const { passwordHash: _ph, refreshToken: _rt, ...cleanProfile } = user as any;

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: cleanProfile,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(400).json({ error: err.message || 'Registration failed' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const emailOrUsername = sanitizeString(req.body.email || req.body.emailOrUsername || req.body.username);
      const password = req.body.password;
      const expectedRole = req.body.role as UserRole | undefined;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: 'Email/Username and password are required.' });
      }

      const { user, tokens } = await authService.loginUser({ emailOrUsername, password, expectedRole });

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });

      return res.json({
        success: true,
        message: 'Login successful',
        user,
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(401).json({ error: err.message || 'Invalid credentials' });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token is missing.' });
      }

      const session = await authService.verifyRefreshToken(refreshToken);
      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired refresh token.' });
      }

      // Fetch user profile from DB to get accurate details & ensure account is still active
      const user = await prisma.userProfile.findUnique({
        where: { id: session.userId },
      });

      if (!user || user.status === 'Inactive' || user.status === 'Banned') {
        await authService.revokeRefreshToken(session.userId, refreshToken);
        return res.status(401).json({ error: 'Account is no longer active or valid.' });
      }

      // Rotate token: revoke old one, generate new access & rolling refresh tokens
      await authService.revokeRefreshToken(session.userId, refreshToken);
      const newTokens = authService.generateTokens({
        userId: user.id,
        email: user.email || '',
        role: (user.role as UserRole) || 'customer',
        name: user.name,
      });
      await authService.persistRefreshToken(user.id, newTokens.refreshToken);

      res.cookie('refreshToken', newTokens.refreshToken, COOKIE_OPTIONS);
      res.cookie('accessToken', newTokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });

      const { passwordHash: _ph, refreshToken: _rt, ...cleanProfile } = user as any;
      if (cleanProfile.avatar) cleanProfile.avatar = resolveMediaUrl(cleanProfile.avatar, req);
      if (cleanProfile.photoUrl) cleanProfile.photoUrl = resolveMediaUrl(cleanProfile.photoUrl, req);

      return res.json({
        success: true,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        user: cleanProfile,
      });
    } catch (err: any) {
      console.error('Token refresh error:', err);
      return res.status(401).json({ error: 'Failed to refresh token.' });
    }
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = (req as any).userId;
    if (refreshToken) {
      await authService.revokeRefreshToken(userId, refreshToken);
    }
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return res.json({ success: true, message: 'Logged out successfully' });
  },

  async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !req.userId) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }

    try {
      const profile = await prisma.userProfile.findUnique({
        where: { id: req.userId },
      });

      if (!profile) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      if (profile.status === 'Inactive' || profile.status === 'Banned') {
        return res.status(403).json({ error: 'Account is disabled.' });
      }

      const { passwordHash: _ph, refreshToken: _rt, ...cleanProfile } = profile as any;
      if (cleanProfile.avatar) {
        cleanProfile.avatar = resolveMediaUrl(cleanProfile.avatar, req);
      }
      if (cleanProfile.photoUrl) {
        cleanProfile.photoUrl = resolveMediaUrl(cleanProfile.photoUrl, req);
      }
      return res.json({
        success: true,
        user: cleanProfile,
      });
    } catch (err) {
      console.error('Error fetching me:', err);
      return res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  },
};
