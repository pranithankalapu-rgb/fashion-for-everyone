import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeObject } from '../security';

export const profileController = {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId || 'user_01';
      let profile = await prisma.userProfile.findFirst({
        where: { id: userId },
      });

      if (!profile) {
        // Return default profile structure if none exists yet
        profile = await prisma.userProfile.findFirst();
      }

      if (!profile) {
        return res.status(404).json({ error: 'No user profile found. Complete onboarding first.' });
      }

      res.json(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId || 'user_01';
      const sanitizedBody = sanitizeObject(req.body);

      // Remove id from body to prevent overwriting
      const { id: _id, ...updateData } = sanitizedBody as any;

      const updatedProfile = await prisma.userProfile.upsert({
        where: { id: userId },
        update: updateData,
        create: {
          id: userId,
          name: updateData.name || 'New User',
          avatar: updateData.avatar || '',
          skinTone: updateData.skinTone || 'Warm Golden',
          undertone: updateData.undertone || 'Warm',
          hairColor: updateData.hairColor || 'Brown',
          bodyShape: updateData.bodyShape || 'Rectangle',
          measurements: updateData.measurements || { heightCm: 170, chestCm: 85, waistCm: 70, hipsCm: 90 },
          selectedOccasions: updateData.selectedOccasions || [],
          styleVibes: updateData.styleVibes || [],
          completedOnboarding: updateData.completedOnboarding ?? false,
          ...(updateData.photoUrl && { photoUrl: updateData.photoUrl }),
        },
      });

      res.json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (err) {
      console.error('Error updating user profile:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },
};
