import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeObject, sanitizeString } from '../security';
import { mediaService, resolveMediaUrl } from '../services/mediaService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

export const profileController = {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId || 'user_01';
      let profile = await prisma.userProfile.findFirst({
        where: { id: userId },
      });

      if (!profile) {
        // Fallback if initial demo user
        profile = await prisma.userProfile.findFirst();
      }

      if (!profile) {
        return res.status(404).json({ error: 'No user profile found. Complete onboarding first.' });
      }

      const cleanProfile = {
        ...profile,
        avatar: resolveMediaUrl(profile.avatar, req),
        photoUrl: profile.photoUrl ? resolveMediaUrl(profile.photoUrl, req) : resolveMediaUrl(profile.avatar, req),
      };

      res.json(cleanProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId || 'user_01';
      const sanitizedBody = sanitizeObject(req.body);

      // Prevent overwriting id or passwordHash directly through profile update
      const { id: _id, passwordHash: _ph, role: _r, ...updateData } = sanitizedBody as any;

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

  async updateEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      const emailRaw = req.body?.email;
      if (!emailRaw || typeof emailRaw !== 'string') {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const normalizedEmail = sanitizeString(emailRaw.trim().toLowerCase());
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email address format.' });
      }

      // Check if email is already used by another account
      const existingUser = await prisma.userProfile.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: 'insensitive' },
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'This email is already associated with another account.' });
      }

      const updatedProfile = await prisma.userProfile.update({
        where: { id: userId },
        data: { email: normalizedEmail },
      });

      return res.json({
        success: true,
        message: 'Email updated successfully',
        email: updatedProfile.email,
        profile: updatedProfile,
      });
    } catch (err) {
      console.error('Error updating email:', err);
      return res.status(500).json({ error: 'Failed to update email' });
    }
  },

  async updateMobile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      const phoneRaw = req.body?.phone || req.body?.mobile;
      if (!phoneRaw || typeof phoneRaw !== 'string') {
        return res.status(400).json({ error: 'A valid mobile number is required.' });
      }

      const normalizedPhone = sanitizeString(phoneRaw.trim());
      if (!PHONE_REGEX.test(normalizedPhone)) {
        return res.status(400).json({ error: 'Invalid mobile number format. Please enter a valid 7-15 digit phone number.' });
      }

      // Check if mobile is used by another account if unique constraint desired
      const existingUser = await prisma.userProfile.findFirst({
        where: {
          phone: normalizedPhone,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'This mobile number is already associated with another account.' });
      }

      const updatedProfile = await prisma.userProfile.update({
        where: { id: userId },
        data: { phone: normalizedPhone },
      });

      return res.json({
        success: true,
        message: 'Mobile number updated successfully',
        phone: updatedProfile.phone,
        mobile: updatedProfile.phone,
        profile: updatedProfile,
      });
    } catch (err) {
      console.error('Error updating mobile number:', err);
      return res.status(500).json({ error: 'Failed to update mobile number' });
    }
  },

  async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      let avatarUrl = '';

      if (req.file) {
        // Upload via mediaService (supports local upload or Cloudinary)
        const uploadResult = await mediaService.handleUpload(req.file);
        avatarUrl = uploadResult.url;
      } else if (req.body?.avatarUrl && typeof req.body.avatarUrl === 'string') {
        // Preset or pre-hosted avatar URL
        avatarUrl = sanitizeString(req.body.avatarUrl.trim());
      } else {
        return res.status(400).json({ error: 'No image file or avatarUrl provided.' });
      }

      const updatedProfile = await prisma.userProfile.update({
        where: { id: userId },
        data: {
          avatar: avatarUrl,
          photoUrl: avatarUrl,
        },
      });

      const resolvedUrl = resolveMediaUrl(avatarUrl, req);
      const cleanProfile = {
        ...updatedProfile,
        avatar: resolvedUrl,
        photoUrl: resolvedUrl,
      };

      return res.json({
        success: true,
        message: 'Profile picture updated successfully',
        avatar: resolvedUrl,
        profile: cleanProfile,
      });
    } catch (err: any) {
      console.error('Error updating avatar:', err);
      return res.status(400).json({ error: err.message || 'Failed to update profile picture' });
    }
  },
};
