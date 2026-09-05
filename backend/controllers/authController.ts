import type { Request, Response } from 'express';
import { authService, type UserRole } from '../services/authService';
import { sanitizeString } from '../security';
import type { AuthenticatedRequest } from '../middleware/auth';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user,
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

      const session = authService.verifyRefreshToken(refreshToken);
      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired refresh token.' });
      }

      // Rotate token
      authService.revokeRefreshToken(refreshToken);
      const newTokens = authService.generateTokens({
        userId: session.userId,
        email: 'user@fashionforeveryone.com',
        role: session.role,
        name: 'Authenticated User',
      });

      res.cookie('refreshToken', newTokens.refreshToken, COOKIE_OPTIONS);
      res.cookie('accessToken', newTokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });

      return res.json({
        success: true,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
    } catch (err: any) {
      console.error('Token refresh error:', err);
      return res.status(401).json({ error: 'Failed to refresh token.' });
    }
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      authService.revokeRefreshToken(refreshToken);
    }
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return res.json({ success: true, message: 'Logged out successfully' });
  },

  async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    return res.json({
      success: true,
      user: req.user,
    });
  },
};
