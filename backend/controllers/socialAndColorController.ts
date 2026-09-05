import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma, getDb, saveDb } from '../db';
import { sanitizeString, sanitizeObject } from '../security';
import { socialFeedService } from '../services/socialFeedService';
import { emitColorVoteUpdate } from '../services/socketService';

export const socialAndColorController = {
  // --- COLOR COMBOS ---
  async getColorCombos(req: AuthenticatedRequest, res: Response) {
    try {
      const occasion = sanitizeString(req.query.occasion as string);

      const whereClause: any = {};
      if (occasion && occasion !== 'All') {
        whereClause.occasion = { equals: occasion, mode: 'insensitive' };
      }

      try {
        const combos = await prisma.colorCombo.findMany({
          where: whereClause,
          orderBy: { trendingScore: 'desc' },
        });
        return res.json(combos);
      } catch {
        const db = getDb();
        const combos = occasion && occasion !== 'All'
          ? db.colorCombos.filter(c => c.occasion.toLowerCase() === occasion.toLowerCase())
          : db.colorCombos;
        return res.json(combos);
      }
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

      try {
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
        emitColorVoteUpdate(newCombo);
        return res.status(201).json(newCombo);
      } catch {
        const db = getDb();
        const newCombo = {
          id: `combo_${Date.now()}`,
          title,
          occasion: occasion || 'Casual',
          subType: subType || 'Custom Palette',
          colors: sanitizedColors,
          rating: 5.0,
          votesCount: 1,
          trendingScore: 100,
          exampleImageUrl: exampleImageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        };
        db.colorCombos.unshift(newCombo);
        saveDb(db);
        emitColorVoteUpdate(newCombo);
        return res.status(201).json(newCombo);
      }
    } catch (err) {
      console.error('Error creating color combo:', err);
      res.status(500).json({ error: 'Failed to create color combination' });
    }
  },

  async voteColorCombo(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const direction = sanitizeString(req.body.direction);

      try {
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

        // Broadcast to all connected clients in real time
        emitColorVoteUpdate(updated);

        return res.json(updated);
      } catch {
        const db = getDb();
        const idx = db.colorCombos.findIndex(c => c.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Color combination not found' });

        const combo = db.colorCombos[idx];
        if (direction === 'up') {
          combo.votesCount += 1;
          combo.trendingScore += 1;
          combo.rating = Math.min(5.0, Number((combo.rating + 0.01).toFixed(2)));
          combo.userVote = 1;
        } else if (direction === 'down') {
          combo.votesCount = Math.max(0, combo.votesCount - 1);
          combo.userVote = -1;
        }
        db.colorCombos[idx] = combo;
        saveDb(db);
        emitColorVoteUpdate(combo);
        return res.json(combo);
      }
    } catch (err) {
      console.error('Error voting color combo:', err);
      res.status(500).json({ error: 'Failed to vote color combination' });
    }
  },

  // --- SOCIAL FEED ---
  async getSocialFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const occasion = sanitizeString(req.query.occasion as string);
      const sortBy = sanitizeString(req.query.sortBy as string);
      const looks = await socialFeedService.getFeed({ occasion, sortBy });
      res.json(looks);
    } catch (err) {
      console.error('Error fetching social feed:', err);
      res.status(500).json({ error: 'Failed to fetch social outfit feed' });
    }
  },

  async getLookById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const look = await socialFeedService.getLookById(id);
      if (!look) return res.status(404).json({ error: 'Outfit look not found' });
      res.json(look);
    } catch (err) {
      console.error('Error fetching outfit look:', err);
      res.status(500).json({ error: 'Failed to fetch outfit look' });
    }
  },

  async createOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, videoThumbnail, creatorName, creatorHandle, creatorAvatar, occasion, taggedProducts } = req.body;
      const created = await socialFeedService.createLook({
        title: sanitizeString(title),
        videoThumbnail: sanitizeString(videoThumbnail),
        creatorName: sanitizeString(creatorName) || 'Community Stylist',
        creatorHandle: sanitizeString(creatorHandle) || '@stylist',
        creatorAvatar: sanitizeString(creatorAvatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        occasion: sanitizeString(occasion) || 'Casual',
        taggedProducts: sanitizeObject(taggedProducts) || [],
      });
      res.status(201).json(created);
    } catch (err) {
      console.error('Error creating outfit look:', err);
      res.status(500).json({ error: 'Failed to create outfit look' });
    }
  },

  async toggleLikeOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const updated = await socialFeedService.toggleLike(id);
      res.json(updated);
    } catch (err) {
      console.error('Error toggling like on outfit look:', err);
      res.status(500).json({ error: 'Failed to update like status' });
    }
  },

  async deleteOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      await socialFeedService.deleteLook(id);
      res.json({ message: 'Outfit look deleted successfully' });
    } catch (err) {
      console.error('Error deleting outfit look:', err);
      res.status(500).json({ error: 'Failed to delete outfit look' });
    }
  },
};
