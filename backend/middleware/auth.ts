import type { Request, Response, NextFunction } from 'express';

export type UserRole = 'customer' | 'designer' | 'retailer';

export interface AuthenticatedRequest extends Request {
  userRole?: UserRole;
  userId?: string;
}

/**
 * Extracts and attaches role context from request headers (x-user-role or Authorization)
 */
export function authenticateRole(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const roleHeader = req.headers['x-user-role'] as string;
  
  if (roleHeader && ['customer', 'designer', 'retailer'].includes(roleHeader.toLowerCase())) {
    req.userRole = roleHeader.toLowerCase() as UserRole;
  } else {
    req.userRole = 'customer'; // Default role
  }
  
  req.userId = (req.headers['x-user-id'] as string) || 'user_01';
  next();
}

/**
 * Middleware factory enforcing role-based authorization for administrative operations
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentRole = req.userRole || 'customer';
    
    if (!allowedRoles.includes(currentRole)) {
      res.status(403).json({
        error: 'Forbidden: Insufficient privileges',
        message: `Your current role (${currentRole}) is not authorized to perform this operation. Allowed roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }
    
    next();
  };
}
