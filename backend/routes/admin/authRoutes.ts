import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAdminToken, type AuthenticatedAdminRequest } from '../../middleware/adminAuth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fashion-admin-secret-jwt-key-2026';

// POST /api/admin/auth/login
router.post('/login', (req, res) => {
  const { email, username, password } = req.body;

  const expectedEmail = (process.env.ADMIN_EMAIL || 'admin@fashionforeveryone.com').toLowerCase();
  const expectedUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

  const providedEmailOrUser = (email || username || '').trim().toLowerCase();

  const isEmailMatch = providedEmailOrUser === expectedEmail;
  const isUsernameMatch = providedEmailOrUser === expectedUsername;

  if ((isEmailMatch || isUsernameMatch) && password === expectedPassword) {
    const token = jwt.sign(
      {
        email: expectedEmail,
        role: 'admin',
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        email: expectedEmail,
        name: 'Super Admin',
        role: 'admin',
      },
    });
  }

  return res.status(401).json({
    error: 'Invalid admin credentials provided.',
  });
});

// POST /api/admin/auth/logout
router.post('/logout', (_req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/auth/me (Protected)
router.get('/me', verifyAdminToken, (req: AuthenticatedAdminRequest, res) => {
  return res.json({
    success: true,
    admin: {
      email: req.admin?.email,
      name: 'Super Admin',
      role: 'admin',
    },
  });
});

export default router;
