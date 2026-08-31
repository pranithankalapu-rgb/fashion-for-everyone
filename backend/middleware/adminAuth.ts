import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminPayload {
  email: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fashion-admin-secret-jwt-key-2026';

export const verifyAdminToken = (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'] as string;
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized: Admin authentication token is required.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Insufficient privileges for admin portal.',
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired admin session token.',
    });
  }
};
