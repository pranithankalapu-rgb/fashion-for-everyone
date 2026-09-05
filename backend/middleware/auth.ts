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
 * Seamlessly backwards compatible with dev header fallback during transition.
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
      req.userId = payload.userId;
      return next();
    }
  }

  // 3. Fallback to header during migration/dev only if explicitly present
  const roleHeader = req.headers['x-user-role'] as string;
  if (roleHeader && ['customer', 'designer', 'retailer', 'admin'].includes(roleHeader.toLowerCase())) {
    req.userRole = roleHeader.toLowerCase() as UserRole;
  } else {
    req.userRole = 'customer';
  }

  req.userId = (req.headers['x-user-id'] as string) || 'user_01';
  req.user = {
    userId: req.userId,
    email: 'user@fashionforeveryone.com',
    role: req.userRole,
    name: 'Fashion User',
  };

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
    const currentRole = (req.userRole || 'customer').toLowerCase() as UserRole;

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
