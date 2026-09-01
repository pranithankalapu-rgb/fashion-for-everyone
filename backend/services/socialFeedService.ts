import { prisma } from '../db';
import { sanitizeString } from '../security';
import type { OutfitLook, RetailProduct } from '../types/fashion';

export interface CreateOutfitLookDTO {
  title: string;
  occasion?: string;
  videoThumbnail: string;
  taggedProductIds?: string[];
  userId?: string;
}

export const socialFeedService = {
  /**
   * Retrieves all outfit lookbook posts from PostgreSQL, sorted by likes descending.
   * Optionally filters by occasion or search query.
   */
  async getSocialFeed(occasion?: string, searchQuery?: string): Promise<OutfitLook[]> {
    const whereClause: any = {};

    if (occasion && occasion !== 'All') {
      whereClause.occasion = { equals: occasion, mode: 'insensitive' };
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { creatorName: { contains: q, mode: 'insensitive' } },
        { creatorHandle: { contains: q, mode: 'insensitive' } },
        { occasion: { contains: q, mode: 'insensitive' } },
      ];
    }

    const looks = await prisma.outfitLook.findMany({
      where: whereClause,
      orderBy: { likes: 'desc' },
    });

    return looks as unknown as OutfitLook[];
  },

  /**
   * Retrieves a single outfit lookbook post by its unique ID.
   */
  async getLookById(id: string): Promise<OutfitLook | null> {
    const sanitizedId = sanitizeString(id);
    const look = await prisma.outfitLook.findUnique({
      where: { id: sanitizedId },
    });
    return (look as unknown as OutfitLook) || null;
  },

  /**
   * Creates a new outfit lookbook post in PostgreSQL.
   * Resolves creator details from the user's PostgreSQL profile and fetches tagged products.
   */
  async createOutfitLook(dto: CreateOutfitLookDTO): Promise<OutfitLook> {
    const title = sanitizeString(dto.title);
    const occasion = sanitizeString(dto.occasion || 'Casual');
    const videoThumbnail = sanitizeString(dto.videoThumbnail);
    const userId = sanitizeString(dto.userId || 'user_01');

    if (!title || !videoThumbnail) {
      throw new Error('Title and video thumbnail are required');
    }

    // Fetch user profile for creator info from PostgreSQL
    const userProfile = await prisma.userProfile.findFirst({
      where: { id: userId },
    });

    const creatorName = userProfile?.name || 'Fashion Creator';
    const creatorHandle = `@${creatorName.toLowerCase().replace(/\s+/g, '')}`;
    const creatorAvatar =
      userProfile?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

    // Fetch tagged products from PostgreSQL
    let taggedProducts: RetailProduct[] = [];
    if (dto.taggedProductIds && Array.isArray(dto.taggedProductIds) && dto.taggedProductIds.length > 0) {
      const sanitizedIds = dto.taggedProductIds.map((pid) => sanitizeString(pid));
      const dbProducts = await prisma.retailProduct.findMany({
        where: { id: { in: sanitizedIds } },
      });
      taggedProducts = dbProducts as unknown as RetailProduct[];
    }

    // Fallback if no products tagged: pick first retail product from PostgreSQL
    if (taggedProducts.length === 0) {
      const firstProduct = await prisma.retailProduct.findFirst();
      if (firstProduct) {
        taggedProducts = [firstProduct as unknown as RetailProduct];
      }
    }

    const newLook = await prisma.outfitLook.create({
      data: {
        creatorName,
        creatorHandle,
        creatorAvatar,
        videoThumbnail,
        title,
        likes: 1,
        reshares: 0,
        occasion,
        taggedProducts: taggedProducts as any,
        userLiked: true,
      },
    });

    return newLook as unknown as OutfitLook;
  },

  /**
   * Toggles the like state of an outfit lookbook post in PostgreSQL.
   */
  async toggleLikeOutfitLook(id: string): Promise<OutfitLook> {
    const sanitizedId = sanitizeString(id);

    const look = await prisma.outfitLook.findUnique({
      where: { id: sanitizedId },
    });

    if (!look) {
      throw new Error('Outfit look not found');
    }

    const newLiked = !look.userLiked;
    const newLikes = newLiked ? look.likes + 1 : Math.max(0, look.likes - 1);

    const updated = await prisma.outfitLook.update({
      where: { id: sanitizedId },
      data: {
        userLiked: newLiked,
        likes: newLikes,
      },
    });

    return updated as unknown as OutfitLook;
  },

  /**
   * Deletes an outfit lookbook post by ID from PostgreSQL.
   */
  async deleteOutfitLook(id: string): Promise<{ success: boolean; id: string }> {
    const sanitizedId = sanitizeString(id);
    await prisma.outfitLook.delete({
      where: { id: sanitizedId },
    });
    return { success: true, id: sanitizedId };
  },
};
