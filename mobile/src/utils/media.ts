import { API_BASE_URL } from '../constants/config';

/**
 * Derives the server base URL from the configured API_BASE_URL
 * e.g., 'https://fashion-for-everyone-backend.onrender.com/api' -> 'https://fashion-for-everyone-backend.onrender.com'
 * e.g., 'http://10.0.2.2:5000/api' -> 'http://10.0.2.2:5000'
 */
export function getBackendBaseUrl(): string {
  const base = API_BASE_URL || 'https://fashion-for-everyone-backend.onrender.com/api';
  return base.replace(/\/api\/?$/, '');
}

/**
 * Resolves any relative media URL (like /uploads/media_123.jpg) to a fully qualified URL.
 * Also handles already absolute URLs (http, https, file, content, data) safely.
 */
export function resolveMediaUrl(url?: string | null, cacheBust?: boolean | string | number): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  let fullUrl = trimmed;

  // Already absolute or local scheme
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('data:')
  ) {
    fullUrl = trimmed;
  } else {
    // Relative URL (e.g. /uploads/media_... or uploads/media_...)
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const serverOrigin = getBackendBaseUrl();
    fullUrl = `${serverOrigin}${cleanPath}`;
  }

  // Optional cache busting (e.g. after uploading a new profile picture)
  if (cacheBust) {
    const timestamp = typeof cacheBust === 'boolean' ? Date.now() : cacheBust;
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}_t=${timestamp}`;
  }

  return fullUrl;
}

/**
 * Derives 1-2 letter user initials for safe avatar fallback rendering
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
