import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getDb, saveDb } from '../db';
import { sanitizeObject } from '../security';
import type { UserProfile } from '../types/fashion';

export const profileController = {
  getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      res.json(db.userProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const sanitizedBody = sanitizeObject(req.body);
      const updatedProfile: UserProfile = { ...db.userProfile, ...sanitizedBody };
      db.userProfile = updatedProfile;
      saveDb(db);

      res.json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (err) {
      console.error('Error updating user profile:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },
};
