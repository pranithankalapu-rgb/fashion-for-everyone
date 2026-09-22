import type { Request, Response, NextFunction } from 'express';
import { authService, type UserRole, type AuthUserPayload } from '../services/authService';

export type { UserRole };

export interface AuthenticatedRequest extends Request {
  userRole?: UserRole;
  userId?: string;
  user?: AuthUserPayload;
}

/**
 * Extracts and verifies JWT from Bearer token or HttpOnly cookie.
 * Does NOT set fake default users or fallback to user_01.
 */
export function authenticateRole(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // 1. Check Authorization Header: Bearer <token>
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // 2. Check Cookie if no header
  if (!token && (req as any).cookies?.accessToken) {
    token = (req as any).cookies.accessToken;
  }

  if (token) {
    const payload = authService.verifyAccessToken(token);
    if (payload) {
      req.user = payload;
      req.userRole = payload.role;
      req.userId = payload.userId || (payload.role === 'admin' ? 'admin_root' : undefined);
      return next();
    }
    // Token supplied but invalid or expired - do NOT fall back to fake users
    req.user = undefined;
    req.userId = undefined;
    req.userRole = undefined;
    return next();
  }

  // 3. Fallback header allowed ONLY in automated testing environments when explicitly enabled
  if (process.env.NODE_ENV === 'test' && process.env.ALLOW_TEST_HEADER_AUTH === 'true') {
    const roleHeader = req.headers['x-user-role'] as string;
    const testUserId = req.headers['x-user-id'] as string;
    if (testUserId) {
      req.userId = testUserId;
      req.userRole = (roleHeader && ['customer', 'designer', 'retailer', 'admin'].includes(roleHeader.toLowerCase()))
        ? (roleHeader.toLowerCase() as UserRole)
        : 'customer';
      req.user = {
        userId: testUserId,
        email: `${testUserId}@fashionforeveryone.com`,
        role: req.userRole,
        name: 'Test User',
      };
      return next();
    }
  }

  req.user = undefined;
  req.userId = undefined;
  req.userRole = undefined;
  next();
}

/**
 * Strict authentication guard requiring a valid logged-in session
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication is required to access this resource.',
    });
  }
  next();
}

/**
 * Middleware factory enforcing role-based authorization for protected operations
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.userId || !req.userRole) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication is required to access this resource.',
      });
    }

    const currentRole = req.userRole.toLowerCase() as UserRole;

    if (currentRole === 'admin') {
      // Super admin has omnipotent privileges
      return next();
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient privileges',
        message: `Your current role (${currentRole}) is not authorized. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Ownership validation guard
 */
export function requireOwnership(getOwnerId: (req: AuthenticatedRequest) => string | undefined) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.userRole === 'admin') return next();

    const ownerId = getOwnerId(req);
    if (ownerId && req.userId !== ownerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to modify this resource.',
      });
    }
    next();
  };
}

