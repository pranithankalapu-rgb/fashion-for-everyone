import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma, getDb } from '../db';
import { sanitizeString } from '../security';

export const designerController = {
  async getDesigners(req: AuthenticatedRequest, res: Response) {
    try {
      const designers = await prisma.designer.findMany({
        orderBy: { avgRating: 'desc' },
        include: { designs: true },
      });
      res.json(designers);
    } catch (err) {
      console.error('Error fetching designers:', err);
      res.status(500).json({ error: 'Failed to fetch designers' });
    }
  },

  async getDesignerById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Designer ID is required' });
      }

      try {
        const designer = await prisma.designer.findUnique({
          where: { id },
          include: { designs: true },
        });

        if (!designer) {
          return res.status(404).json({ error: 'Designer not found' });
        }

        return res.json(designer);
      } catch {
        const db = getDb();
        const designer = db.designers.find((d) => d.id === id);
        if (!designer) {
          return res.status(404).json({ error: 'Designer not found' });
        }
        const designerDesigns = db.designs.filter((dsg) => dsg.designerId === id);
        return res.json({ ...designer, designs: designerDesigns });
      }
    } catch (err) {
      console.error('Error fetching designer by id:', err);
      res.status(500).json({ error: 'Failed to fetch designer' });
    }
  },

  async getDesigns(req: AuthenticatedRequest, res: Response) {
    try {
      const occasion = sanitizeString(req.query.occasion as string);

      const whereClause: any = {};
      if (occasion && occasion !== 'All') {
        whereClause.occasion = { equals: occasion, mode: 'insensitive' };
      }

      const designs = await prisma.design.findMany({
        where: whereClause,
        orderBy: { rating: 'desc' },
      });
      res.json(designs);
    } catch (err) {
      console.error('Error fetching designs:', err);
      res.status(500).json({ error: 'Failed to fetch designs' });
    }
  },

  async getDesignById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Design ID is required' });
      }

      try {
        const design = await prisma.design.findUnique({
          where: { id },
          include: { designer: true },
        });

        if (!design) {
          return res.status(404).json({ error: 'Design not found' });
        }

        return res.json(design);
      } catch {
        const db = getDb();
        const design = db.designs.find((d) => d.id === id);
        if (!design) {
          return res.status(404).json({ error: 'Design not found' });
        }
        return res.json(design);
      }
    } catch (err) {
      console.error('Error fetching design by id:', err);
      res.status(500).json({ error: 'Failed to fetch design' });
    }
  },

  async createDesign(req: AuthenticatedRequest, res: Response) {
    try {
      const title = sanitizeString(req.body.title);
      const collection = sanitizeString(req.body.collection);
      const imageUrl = sanitizeString(req.body.imageUrl);
      const occasion = sanitizeString(req.body.occasion);
      const rawPalette = req.body.palette;
      const price = Number(req.body.price);
      const designerId = req.userId || sanitizeString(req.body.designerId) || 'des_1';

      if (!title || !imageUrl) {
        return res.status(400).json({ error: 'Title and image URL are required' });
      }

      const sanitizedPalette = Array.isArray(rawPalette) ? rawPalette.map((c: string) => sanitizeString(c)) : ['#1E293B', '#D97706'];

      // Look up the designer to populate denormalized fields
      let designer = await prisma.designer.findUnique({ where: { id: designerId } });
      if (!designer && req.user) {
        designer = await prisma.designer.findFirst({
          where: { OR: [{ email: req.user.email }, { name: req.user.name }] },
        });
      }

      const newDesign = await prisma.design.create({
        data: {
          designerId: designer?.id || designerId,
          designerName: designer?.name || req.user?.name || 'Creator',
          designerAvatar: designer?.avatar || req.user?.avatar || '',
          title,
          collection: collection || 'Spring / Summer Collection',
          imageUrl,
          rating: 5.0,
          votesCount: 1,
          occasion: occasion || 'Casual',
          palette: sanitizedPalette,
          price: price || 290,
          inStock: true,
          createdAt: new Date().toISOString().split('T')[0],
        },
      });

      // Update designer's total votes
      if (designer) {
        await prisma.designer.update({
          where: { id: designer.id },
          data: { totalVotes: { increment: 1 } },
        });
      }

      res.status(201).json(newDesign);
    } catch (err) {
      console.error('Error creating design:', err);
      res.status(500).json({ error: 'Failed to create design' });
    }
  },

  async deleteDesign(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const userRole = (req.userRole || 'customer').toLowerCase();
      const userId = req.userId;

      const design = await prisma.design.findUnique({ where: { id } });
      if (!design) {
        return res.status(404).json({ error: 'Design not found' });
      }

      if (userRole !== 'admin' && design.designerId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this design.' });
      }

      await prisma.design.delete({ where: { id } });
      res.json({ message: 'Design deleted successfully' });
    } catch (err) {
      console.error('Error deleting design:', err);
      res.status(500).json({ error: 'Failed to delete design' });
    }
  },

  async voteDesign(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const rating = Number(req.body.rating);

      const design = await prisma.design.findUnique({ where: { id } });
      if (!design) {
        return res.status(404).json({ error: 'Design not found' });
      }

      const totalPoints = design.rating * design.votesCount + (rating || 5);
      const newVotesCount = design.votesCount + 1;
      const newRating = Number((totalPoints / newVotesCount).toFixed(2));

      const updated = await prisma.design.update({
        where: { id },
        data: {
          votesCount: newVotesCount,
          rating: newRating,
        },
      });

      // Also update the designer's aggregate stats
      if (design.designerId) {
        const designerDesigns = await prisma.design.findMany({
          where: { designerId: design.designerId },
        });
        const totalDesignerVotes = designerDesigns.reduce((sum, d) => sum + d.votesCount, 0);
        const avgDesignerRating = designerDesigns.reduce((sum, d) => sum + d.rating * d.votesCount, 0) / Math.max(totalDesignerVotes, 1);

        await prisma.designer.update({
          where: { id: design.designerId },
          data: {
            totalVotes: totalDesignerVotes,
            avgRating: Number(avgDesignerRating.toFixed(2)),
          },
        });
      }

      res.json(updated);
    } catch (err) {
      console.error('Error voting design:', err);
      res.status(500).json({ error: 'Failed to submit vote' });
    }
  },
};
