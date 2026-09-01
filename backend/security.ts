import type { Request, Response, NextFunction } from 'express';
import path from 'path';

/**
 * Escapes HTML entity characters to mitigate Cross-Site Scripting (XSS).
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Recursively sanitizes strings inside objects or arrays.
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
    }
    return sanitized as T;
  }
  return obj;
}

/**
 * Validates that a resolved path stays strictly within the intended base directory to prevent Path Traversal attacks.
 */
export function validateSafePath(baseDir: string, userPath: string): string {
  const safeBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(safeBase, userPath);
  if (!resolvedPath.startsWith(safeBase)) {
    throw new Error('Access denied: Invalid path traversal attempt');
  }
  return resolvedPath;
}

/**
 * Escapes special regex characters in user search queries to prevent ReDoS / Regex Injection.
 */
export function escapeRegex(query: string): string {
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Security Headers Middleware (Defense-in-depth against MIME sniffing, clickjacking, etc.)
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

/**
 * In-Memory Request Rate Limiter (Guards against automated spam and Denial of Service)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 600; // Max requests per window per IP

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(ip);
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
    return;
  }

  next();
}
