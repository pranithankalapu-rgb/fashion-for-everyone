import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getDb, saveDb } from '../db';
import { sanitizeString } from '../security';
import type { Design } from '../types/fashion';

export const designerController = {
  getDesigners(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const sorted = [...db.designers].sort((a, b) => b.avgRating - a.avgRating);
      res.json(sorted);
    } catch (err) {
      console.error('Error fetching designers:', err);
      res.status(500).json({ error: 'Failed to fetch designers' });
    }
  },

  getDesigns(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const occasion = sanitizeString(req.query.occasion as string);
      let designs = db.designs || [];

      if (occasion && occasion !== 'All') {
        designs = designs.filter(d => d.occasion.toLowerCase() === occasion.toLowerCase());
      }
      res.json(designs);
    } catch (err) {
      console.error('Error fetching designs:', err);
      res.status(500).json({ error: 'Failed to fetch designs' });
    }
  },

  createDesign(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const title = sanitizeString(req.body.title);
      const collection = sanitizeString(req.body.collection);
      const imageUrl = sanitizeString(req.body.imageUrl);
      const occasion = sanitizeString(req.body.occasion);
      const rawPalette = req.body.palette;
      const price = Number(req.body.price);

      if (!title || !imageUrl) {
        return res.status(400).json({ error: 'Title and image URL are required' });
      }

      const sanitizedPalette = Array.isArray(rawPalette) ? rawPalette.map(c => sanitizeString(c)) : ['#1E293B', '#D97706'];

      const newDesign: Design = {
        id: `dsg_${Date.now()}`,
        designerId: 'des_1',
        designerName: 'Aria Vance',
        designerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        title,
        collection: collection || 'Spring / Summer Collection',
        imageUrl,
        rating: 5.0,
        votesCount: 1,
        occasion: (occasion as any) || 'Casual',
        palette: sanitizedPalette,
        price: price || 290,
        inStock: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      db.designs.unshift(newDesign);
      saveDb(db);

      res.status(201).json(newDesign);
    } catch (err) {
      console.error('Error creating design:', err);
      res.status(500).json({ error: 'Failed to create design' });
    }
  },

  voteDesign(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const id = sanitizeString(req.params.id);
      const rating = Number(req.body.rating);

      const design = db.designs.find(d => d.id === id);
      if (!design) {
        return res.status(404).json({ error: 'Design not found' });
      }

      const totalPoints = design.rating * design.votesCount + (rating || 5);
      design.votesCount += 1;
      design.rating = Number((totalPoints / design.votesCount).toFixed(2));

      saveDb(db);
      res.json(design);
    } catch (err) {
      console.error('Error voting design:', err);
      res.status(500).json({ error: 'Failed to submit vote' });
    }
  },
};
