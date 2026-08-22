import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getDb, saveDb } from '../db';
import { sanitizeString, sanitizeObject } from '../security';
import type { ColorCombo, OutfitLook } from '../types/fashion';

export const socialAndColorController = {
  // --- COLOR COMBOS ---
  getColorCombos(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const occasion = sanitizeString(req.query.occasion as string);
      let combos = db.colorCombos || [];
      if (occasion && occasion !== 'All') {
        combos = combos.filter(c => c.occasion.toLowerCase() === occasion.toLowerCase());
      }
      res.json(combos);
    } catch (err) {
      console.error('Error fetching color combos:', err);
      res.status(500).json({ error: 'Failed to fetch color combinations' });
    }
  },

  createColorCombo(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const title = sanitizeString(req.body.title);
      const occasion = sanitizeString(req.body.occasion);
      const subType = sanitizeString(req.body.subType);
      const exampleImageUrl = sanitizeString(req.body.exampleImageUrl);
      const rawColors = req.body.colors;

      if (!title || !rawColors || !Array.isArray(rawColors)) {
        return res.status(400).json({ error: 'Title and colors array are required' });
      }

      const sanitizedColors = sanitizeObject(rawColors);

      const newCombo: ColorCombo = {
        id: `combo_${Date.now()}`,
        title,
        occasion: (occasion as any) || 'Casual',
        subType: subType || 'Custom Palette',
        colors: sanitizedColors,
        rating: 5.0,
        votesCount: 1,
        trendingScore: 100,
        exampleImageUrl: exampleImageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
      };

      db.colorCombos.unshift(newCombo);
      saveDb(db);
      res.status(201).json(newCombo);
    } catch (err) {
      console.error('Error creating color combo:', err);
      res.status(500).json({ error: 'Failed to create color combination' });
    }
  },

  voteColorCombo(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const id = sanitizeString(req.params.id);
      const direction = sanitizeString(req.body.direction);

      const combo = db.colorCombos.find(c => c.id === id);
      if (!combo) {
        return res.status(404).json({ error: 'Color combination not found' });
      }

      if (direction === 'up') {
        combo.votesCount += 1;
        combo.trendingScore += 1;
        combo.rating = Math.min(5.0, Number((combo.rating + 0.01).toFixed(2)));
        combo.userVote = 1;
      } else if (direction === 'down') {
        combo.votesCount = Math.max(0, combo.votesCount - 1);
        combo.userVote = -1;
      }

      saveDb(db);
      res.json(combo);
    } catch (err) {
      console.error('Error voting color combo:', err);
      res.status(500).json({ error: 'Failed to vote color combination' });
    }
  },

  // --- SOCIAL FEED ---
  getSocialFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      res.json(db.outfitLooks || []);
    } catch (err) {
      console.error('Error fetching social feed:', err);
      res.status(500).json({ error: 'Failed to fetch social feed' });
    }
  },

  createOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const title = sanitizeString(req.body.title);
      const occasion = sanitizeString(req.body.occasion);
      const videoThumbnail = sanitizeString(req.body.videoThumbnail);
      const rawTaggedProductIds = req.body.taggedProductIds;

      if (!title || !videoThumbnail) {
        return res.status(400).json({ error: 'Title and video thumbnail are required' });
      }

      const taggedProductIds = Array.isArray(rawTaggedProductIds) ? rawTaggedProductIds.map(id => sanitizeString(id)) : [];
      const tagged = db.products.filter(p => taggedProductIds.includes(p.id));

      const newLook: OutfitLook = {
        id: `look_${Date.now()}`,
        creatorName: db.userProfile.name,
        creatorHandle: `@${db.userProfile.name.toLowerCase().replace(/\s+/g, '')}`,
        creatorAvatar: db.userProfile.avatar,
        videoThumbnail,
        title,
        likes: 1,
        reshares: 0,
        occasion: (occasion as any) || 'Casual',
        taggedProducts: tagged.length > 0 ? tagged : [db.products[0]],
        userLiked: true,
      };

      db.outfitLooks.unshift(newLook);
      saveDb(db);

      res.status(201).json(newLook);
    } catch (err) {
      console.error('Error creating outfit look:', err);
      res.status(500).json({ error: 'Failed to create outfit look' });
    }
  },

  toggleLikeOutfitLook(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const id = sanitizeString(req.params.id);

      const look = db.outfitLooks.find(l => l.id === id);
      if (!look) {
        return res.status(404).json({ error: 'Outfit look not found' });
      }

      if (look.userLiked) {
        look.userLiked = false;
        look.likes = Math.max(0, look.likes - 1);
      } else {
        look.userLiked = true;
        look.likes += 1;
      }

      saveDb(db);
      res.json(look);
    } catch (err) {
      console.error('Error liking outfit look:', err);
      res.status(500).json({ error: 'Failed to update like status' });
    }
  },
};
