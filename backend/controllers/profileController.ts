import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeObject, sanitizeString } from '../security';
import { mediaService, resolveMediaUrl } from '../services/mediaService';
import { verificationService, VerificationError, sanitizeContact } from '../services/verificationService';
import { normalizePhoneNumber } from '../utils/phoneUtils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const VALID_BODY_SHAPES = [
  'Hourglass',
  'Pear (Triangle)',
  'Apple (Oval)',
  'Rectangle (Straight)',
  'Inverted Triangle',
  // Backward compatibility with legacy seeds/tests
  'Pear',
  'Rectangle',
  'Oval',
];

export const VALID_SKIN_TONES = [
  'Very Fair',
  'Fair',
  'Light',
  'Medium',
  'Tan',
  'Deep',
  'Very Deep',
  // Backward compatibility with legacy seeds/tests
  'Warm Golden',
  'Cool Rose',
  'Deep Rich',
  'Olive Neutral',
  'Fair Porcelain',
];

export const VALID_UNDERTONES = [
  'Warm',
  'Cool',
  'Neutral',
  'Olive',
];

export const profileController = {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required to access profile.' });
      }

      const profile = await prisma.userProfile.findUnique({
        where: { id: userId },
      });

      if (!profile) {
        return res.status(404).json({ error: 'No user profile found. Please complete onboarding or login.' });
      }

      const { passwordHash: _ph, refreshToken: _rt, ...cleanUser } = profile as any;
      const cleanProfile = {
        ...cleanUser,
        avatar: resolveMediaUrl(cleanUser.avatar, req),
        photoUrl: cleanUser.photoUrl ? resolveMediaUrl(cleanUser.photoUrl, req) : resolveMediaUrl(cleanUser.avatar, req),
      };

      res.json(cleanProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required to update profile.' });
      }

      const sanitizedBody = sanitizeObject(req.body);

      // Prevent unauthorized updates: users can only update their own profile
      if (sanitizedBody.id && sanitizedBody.id !== userId) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
      }
      if (sanitizedBody.userId && sanitizedBody.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
      }

      // Explicitly prevent overwriting id, passwordHash, role, email, or phone directly through general profile update
      const { id: _id, passwordHash: _ph, role: _r, email: _e, phone: _p, mobile: _m, ...updateData } = sanitizedBody as any;

      // Validate bodyShape against supported options
      if (updateData.bodyShape !== undefined) {
        if (!VALID_BODY_SHAPES.includes(updateData.bodyShape)) {
          return res.status(400).json({
            error: `Invalid bodyShape: "${updateData.bodyShape}". Supported options: Hourglass, Pear (Triangle), Apple (Oval), Rectangle (Straight), Inverted Triangle`,
          });
        }
      }

      // Validate skinTone against supported options
      if (updateData.skinTone !== undefined) {
        if (!VALID_SKIN_TONES.includes(updateData.skinTone)) {
          return res.status(400).json({
            error: `Invalid skinTone: "${updateData.skinTone}". Supported options: Very Fair, Fair, Light, Medium, Tan, Deep, Very Deep`,
          });
        }
      }

      // Validate undertone against supported options
      if (updateData.undertone !== undefined) {
        if (!VALID_UNDERTONES.includes(updateData.undertone)) {
          return res.status(400).json({
            error: `Invalid undertone: "${updateData.undertone}". Supported options: Warm, Cool, Neutral, Olive`,
          });
        }
      }

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

  // -------------------------------------------------------------
  // Dedicated Verification Endpoints
  // -------------------------------------------------------------

  async requestEmailVerification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      const email = req.body?.email;
      const result = await verificationService.requestEmailVerification(userId, email);
      return res.json(result);
    } catch (err: any) {
      if (err instanceof VerificationError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('Unexpected error requesting email verification:', err);
      return res.status(500).json({ error: 'Failed to process email verification request.' });
    }
  },

  async verifyEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      const email = req.body?.email;
      const code = req.body?.code;
      const result = await verificationService.verifyAndUpdateEmail(userId, email, code);

      const cleanProfile = {
        ...result.profile,
        avatar: resolveMediaUrl(result.profile.avatar, req),
        photoUrl: result.profile.photoUrl ? resolveMediaUrl(result.profile.photoUrl, req) : resolveMediaUrl(result.profile.avatar, req),
      };

      return res.json({
        ...result,
        profile: cleanProfile,
      });
    } catch (err: any) {
      if (err instanceof VerificationError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('Unexpected error verifying email:', err);
      return res.status(500).json({ error: 'Failed to verify email.' });
    }
  },

  async requestMobileVerification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      const phone = req.body?.phone || req.body?.mobile;
      const result = await verificationService.requestMobileVerification(userId, phone);
      return res.json(result);
    } catch (err: any) {
      if (err instanceof VerificationError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('Unexpected error requesting mobile verification:', err);
      return res.status(500).json({ error: 'Failed to process mobile verification request.' });
    }
  },

  async verifyMobile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      const phone = req.body?.phone || req.body?.mobile;
      const code = req.body?.code;
      const result = await verificationService.verifyAndUpdateMobile(userId, phone, code);

      const cleanProfile = {
        ...result.profile,
        avatar: resolveMediaUrl(result.profile.avatar, req),
        photoUrl: result.profile.photoUrl ? resolveMediaUrl(result.profile.photoUrl, req) : resolveMediaUrl(result.profile.avatar, req),
      };

      return res.json({
        ...result,
        profile: cleanProfile,
      });
    } catch (err: any) {
      if (err instanceof VerificationError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('Unexpected error verifying mobile:', err);
      return res.status(500).json({ error: 'Failed to verify mobile number.' });
    }
  },

  // -------------------------------------------------------------
  // Legacy / Backwards-Compatible Contact Update Endpoints
  // Protected: Requires OTP code, preventing unverified bypass
  // -------------------------------------------------------------

  async updateEmail(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const email = req.body?.email;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const sanitizedEmail = sanitizeContact(email).toLowerCase();
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Check duplicate email
    const existing = await prisma.userProfile.findFirst({
      where: {
        email: { equals: sanitizedEmail, mode: 'insensitive' },
        NOT: { id: userId },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'This email address cannot be used. Please choose another.' });
    }

    const code = req.body?.code;
    if (!code) {
      return res.status(400).json({
        error: 'Verification code is required to update email address. Please request a verification code first.',
        requiresVerification: true,
      });
    }
    return profileController.verifyEmail(req, res);
  },

  async updateMobile(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const phone = req.body?.phone || req.body?.mobile;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'A valid mobile number is required.' });
    }

    const normResult = normalizePhoneNumber(phone);
    if (!normResult.valid || !normResult.normalized) {
      return res.status(400).json({ error: normResult.error || 'Invalid phone number format.' });
    }

    const normalizedPhone = normResult.normalized;
    const sanitizedPhone = sanitizeContact(phone);

    // Check duplicate phone
    const existing = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: sanitizedPhone },
        ],
        NOT: { id: userId },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'This mobile number cannot be used. Please choose another.' });
    }

    const code = req.body?.code;
    if (!code) {
      return res.status(400).json({
        error: 'Verification code is required to update mobile number. Please request a verification code first.',
        requiresVerification: true,
      });
    }
    return profileController.verifyMobile(req, res);
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
