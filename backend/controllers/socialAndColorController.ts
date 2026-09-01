import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeString, sanitizeObject } from '../security';

import { socialFeedService } from '../services/socialFeedService';

export const socialAndColorController = {
  // --- COLOR COMBOS ---
  async getColorCombos(req: AuthenticatedRequest, res: Response) {
    try {
      const occasion = sanitizeString(req.query.occasion as string);

      const whereClause: any = {};
      if (occasion && occasion !== 'All') {
        whereClause.occasion = { equals: occasion, mode: 'insensitive' };
      }

      const combos = await prisma.colorCombo.findMany({
        where: whereClause,
        orderBy: { trendingScore: 'desc' },
      });
      res.json(combos);
    } catch (err) {
      console.error('Error fetching color combos:', err);
      res.status(500).json({ error: 'Failed to fetch color combinations' });
    }
  },

  async createColorCombo(req: AuthenticatedRequest, res: Response) {
    try {
      const title = sanitizeString(req.body.title);
      const occasion = sanitizeString(req.body.occasion);
      const subType = sanitizeString(req.body.subType);
      const exampleImageUrl = sanitizeString(req.body.exampleImageUrl);
      const rawColors = req.body.colors;

      if (!title || !rawColors || !Array.isArray(rawColors)) {
        return res.status(400).json({ error: 'Title and colors array are required' });
      }

      const sanitizedColors = sanitizeObject(rawColors);

      const newCombo = await prisma.colorCombo.create({
        data: {
          title,
          occasion: occasion || 'Casual',
          subType: subType || 'Custom Palette',
          colors: sanitizedColors,
          rating: 5.0,
          votesCount: 1,
          trendingScore: 100,
          exampleImageUrl: exampleImageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        },
      });

      res.status(201).json(newCombo);
    } catch (err) {
      console.error('Error creating color combo:', err);
      res.status(500).json({ error: 'Failed to create color combination' });
    }
  },

  async voteColorCombo(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const direction = sanitizeString(req.body.direction);

      const combo = await prisma.colorCombo.findUnique({ where: { id } });
      if (!combo) {
        return res.status(404).json({ error: 'Color combination not found' });
      }

      let updateData: any = {};

      if (direction === 'up') {
        updateData = {
          votesCount: { increment: 1 },
          trendingScore: { increment: 1 },
          rating: Math.min(5.0, Number((combo.rating + 0.01).toFixed(2))),
          userVote: 1,
        };
      } else if (direction === 'down') {
        updateData = {
          votesCount: Math.max(0, combo.votesCount - 1),
          userVote: -1,
        };
      }

      const updated = await prisma.colorCombo.update({
        where: { id },
        data: updateData,
      });

      res.json(updated);
    } catch (err) {
      console.error('Error voting color combo:', err);
      res.status(500).json({ error: 'Failed to vote color combination' });
    }
  },

  // --- SOCIAL OUTFIT LOOKBOOK FEED ---
  async getSocialFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const occasion = sanitizeString(req.query.occasion as string);
      const search = sanitizeString(req.query.search as string);
      const looks = await socialFeedService.getSocialFeed(occasion, search);
      res.json(looks);
    } catch (err) {
      console.error('Error fetching social feed via Prisma:', err);
      res.status(500).json({ error: 'Failed to fetch social feed' });
    }
  },

  async getLookById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const look = await socialFeedService.getLookById(id);
      if (!look) {
        return res.status(404).json({ error: 'Outfit look not found' });
      }
      res.json(look);
    } catch (err) {
      console.error('Error fetching outfit look by id:', err);
      res.status(500).json({ error: 'Failed to fetch outfit look' });
    }
  },

  async createOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const title = sanitizeString(req.body.title);
      const occasion = sanitizeString(req.body.occasion);
      const videoThumbnail = sanitizeString(req.body.videoThumbnail);
      const rawTaggedProductIds = req.body.taggedProductIds;
      const userId = (req as any).userId || (req.headers['x-user-id'] as string) || 'user_01';

      if (!title || !videoThumbnail) {
        return res.status(400).json({ error: 'Title and video thumbnail are required' });
      }

      const taggedProductIds = Array.isArray(rawTaggedProductIds)
        ? rawTaggedProductIds.map((id: string) => sanitizeString(id))
        : [];

      const newLook = await socialFeedService.createOutfitLook({
        title,
        occasion,
        videoThumbnail,
        taggedProductIds,
        userId,
      });

      res.status(201).json(newLook);
    } catch (err) {
      console.error('Error creating outfit look in PostgreSQL:', err);
      res.status(500).json({ error: 'Failed to create outfit look' });
    }
  },

  async toggleLikeOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const updated = await socialFeedService.toggleLikeOutfitLook(id);
      res.json(updated);
    } catch (err: any) {
      console.error('Error liking outfit look in PostgreSQL:', err);
      if (err.message === 'Outfit look not found') {
        return res.status(404).json({ error: 'Outfit look not found' });
      }
      res.status(500).json({ error: 'Failed to update like status' });
    }
  },

  async deleteOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const result = await socialFeedService.deleteOutfitLook(id);
      res.json(result);
    } catch (err) {
      console.error('Error deleting outfit look:', err);
      res.status(500).json({ error: 'Failed to delete outfit look' });
    }
  },
};
