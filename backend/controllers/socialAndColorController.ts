import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeString, sanitizeObject } from '../security';

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

  // --- SOCIAL FEED ---
  async getSocialFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const looks = await prisma.outfitLook.findMany({
        orderBy: { likes: 'desc' },
      });
      res.json(looks);
    } catch (err) {
      console.error('Error fetching social feed:', err);
      res.status(500).json({ error: 'Failed to fetch social feed' });
    }
  },

  async createOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const title = sanitizeString(req.body.title);
      const occasion = sanitizeString(req.body.occasion);
      const videoThumbnail = sanitizeString(req.body.videoThumbnail);
      const rawTaggedProductIds = req.body.taggedProductIds;

      if (!title || !videoThumbnail) {
        return res.status(400).json({ error: 'Title and video thumbnail are required' });
      }

      // Fetch user profile for creator info
      const userId = (req as any).userId || 'user_01';
      const userProfile = await prisma.userProfile.findFirst({ where: { id: userId } });

      // Fetch tagged products
      const taggedProductIds = Array.isArray(rawTaggedProductIds) ? rawTaggedProductIds.map((id: string) => sanitizeString(id)) : [];
      let taggedProducts: any[] = [];
      if (taggedProductIds.length > 0) {
        taggedProducts = await prisma.retailProduct.findMany({
          where: { id: { in: taggedProductIds } },
        });
      }
      if (taggedProducts.length === 0) {
        const firstProduct = await prisma.retailProduct.findFirst();
        if (firstProduct) taggedProducts = [firstProduct];
      }

      const creatorName = userProfile?.name || 'Fashion User';

      const newLook = await prisma.outfitLook.create({
        data: {
          creatorName,
          creatorHandle: `@${creatorName.toLowerCase().replace(/\s+/g, '')}`,
          creatorAvatar: userProfile?.avatar || '',
          videoThumbnail,
          title,
          likes: 1,
          reshares: 0,
          occasion: occasion || 'Casual',
          taggedProducts: taggedProducts,
          userLiked: true,
        },
      });

      res.status(201).json(newLook);
    } catch (err) {
      console.error('Error creating outfit look:', err);
      res.status(500).json({ error: 'Failed to create outfit look' });
    }
  },

  async toggleLikeOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const look = await prisma.outfitLook.findUnique({ where: { id } });
      if (!look) {
        return res.status(404).json({ error: 'Outfit look not found' });
      }

      const newLiked = !look.userLiked;
      const updated = await prisma.outfitLook.update({
        where: { id },
        data: {
          userLiked: newLiked,
          likes: newLiked ? look.likes + 1 : Math.max(0, look.likes - 1),
        },
      });

      res.json(updated);
    } catch (err) {
      console.error('Error liking outfit look:', err);
      res.status(500).json({ error: 'Failed to update like status' });
    }
  },
};
