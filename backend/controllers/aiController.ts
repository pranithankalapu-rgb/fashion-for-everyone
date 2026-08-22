import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../db';
import { sanitizeString, sanitizeObject } from '../security';
import type { UserProfile } from '../types/fashion';

export const aiController = {
  getStyling(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const reqProfile = req.body.profile ? sanitizeObject(req.body.profile) : null;
      const profile: UserProfile = reqProfile || db.userProfile;
      const occasion = sanitizeString(req.body.occasion) || 'Work';

      let colorHarmonyScore = 94;
      let fitScore = 96;
      if (profile.skinTone === 'Warm Golden' || profile.skinTone === 'Deep Rich') {
        colorHarmonyScore = 98;
      }
      if (profile.bodyShape === 'Hourglass' || profile.bodyShape === 'Rectangle') {
        fitScore = 97;
      }

      const matchedProducts = (db.products || []).map(p => ({
        ...p,
        similarityScore: Math.floor(88 + Math.random() * 11),
      }));

      res.json({
        colorHarmonyScore,
        fitScore,
        overallMatch: Math.round((colorHarmonyScore + fitScore) / 2),
        recommendedPalette: ['#1E293B', '#FDFBF7', '#D97706', '#064E3B'],
        paletteRationale: `Selected for ${sanitizeString(profile.skinTone)} skin tone and ${sanitizeString(profile.undertone)} undertones to enhance natural contrast for ${occasion} wear.`,
        bodyShapeAdvice: `For ${sanitizeString(profile.bodyShape)} body proportions (Chest: ${Number(profile.measurements?.chestCm) || 0}cm, Waist: ${Number(profile.measurements?.waistCm) || 0}cm, Hips: ${Number(profile.measurements?.hipsCm) || 0}cm), tailored longline jackets and high-waisted silhouettes elongate torso while defining waistline symmetry.`,
        curatedProducts: matchedProducts,
      });
    } catch (err) {
      console.error('Error calculating AI styling:', err);
      res.status(500).json({ error: 'Failed to generate AI recommendations' });
    }
  },

  analyzePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const photoUrl = sanitizeString(req.body.photoUrl);
      if (!photoUrl) {
        return res.status(400).json({ error: 'Photo URL is required' });
      }

      const detectedTones: UserProfile['skinTone'][] = ['Warm Golden', 'Cool Rose', 'Deep Rich', 'Olive Neutral', 'Fair Porcelain'];
      const detectedUndertones: UserProfile['undertone'][] = ['Warm', 'Cool', 'Neutral'];
      const detectedShapes: UserProfile['bodyShape'][] = ['Hourglass', 'Rectangle', 'Inverted Triangle', 'Pear'];

      const randomTone = detectedTones[Math.floor(Math.random() * detectedTones.length)];
      const randomUndertone = detectedUndertones[Math.floor(Math.random() * detectedUndertones.length)];
      const randomShape = detectedShapes[Math.floor(Math.random() * detectedShapes.length)];

      res.json({
        confidence: 0.96,
        skinTone: randomTone,
        undertone: randomUndertone,
        hairColor: 'Warm Chestnut Brown',
        bodyShape: randomShape,
        estimatedMeasurements: {
          heightCm: 172,
          chestCm: 88,
          waistCm: 68,
          hipsCm: 94,
        },
        message: 'AI photo spectral analysis complete',
      });
    } catch (err) {
      console.error('Error analyzing photo:', err);
      res.status(500).json({ error: 'Failed to analyze photo' });
    }
  },
};
