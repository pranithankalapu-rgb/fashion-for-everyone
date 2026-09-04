import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db';
import { sanitizeString } from '../security';

export const productController = {
  // GET /api/products
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const queryParam = req.query.query ? sanitizeString(req.query.query as string) : '';
      const categoryParam = req.query.category ? sanitizeString(req.query.category as string) : '';
      const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

      const whereClause: any = {};

      if (queryParam) {
        whereClause.OR = [
          { title: { contains: queryParam, mode: 'insensitive' } },
          { brand: { contains: queryParam, mode: 'insensitive' } },
        ];
      }
      if (categoryParam && categoryParam.toLowerCase() !== 'all') {
        whereClause.category = { equals: categoryParam, mode: 'insensitive' };
      }
      if (maxPrice !== null && !isNaN(maxPrice)) {
        whereClause.price = { lte: maxPrice };
      }

      const products = await prisma.retailProduct.findMany({
        where: whereClause,
        orderBy: { id: 'desc' },
      });

      res.json(products);
    } catch (err) {
      console.error('Error fetching products via Prisma:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  },

  // GET /api/products/:id
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const product = await prisma.retailProduct.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (err) {
      console.error('Error fetching product by ID via Prisma:', err);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  },

  // POST /api/products (Supports JSON or multipart/form-data image upload)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const title = sanitizeString(req.body.title);
      const brand = sanitizeString(req.body.brand) || 'Fashion Studio';
      const category = sanitizeString(req.body.category) || 'Coats & Jackets';
      const price = Number(req.body.price);
      const originalPrice = req.body.originalPrice ? Number(req.body.originalPrice) : null;
      
      // If file was uploaded via multer, use uploaded path; otherwise use body imageUrl
      let imageUrl = '';
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.imageUrl) {
        imageUrl = sanitizeString(req.body.imageUrl);
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
      }

      const silhouette = sanitizeString(req.body.silhouette) || 'Tailored';
      const retailer = sanitizeString(req.body.retailer) || 'Direct Flagship';
      const affiliateUrl = sanitizeString(req.body.affiliateUrl) || '#';
      const description = sanitizeString(req.body.description) || '';
      const stockQuantity = req.body.stockQuantity !== undefined ? Number(req.body.stockQuantity) : 10;
      const sku = sanitizeString(req.body.sku) || `SKU-${Date.now()}`;
      const occasion = req.body.occasion ? sanitizeString(req.body.occasion) : null;

      let colors: string[] = ['#1E293B'];
      if (typeof req.body.colors === 'string') {
        try {
          colors = JSON.parse(req.body.colors);
        } catch {
          colors = req.body.colors.split(',').map((c: string) => c.trim());
        }
      } else if (Array.isArray(req.body.colors)) {
        colors = req.body.colors.map((c: string) => sanitizeString(c));
      }

      let sizes: string[] = ['XS', 'S', 'M', 'L', 'XL'];
      if (typeof req.body.sizes === 'string') {
        try {
          sizes = JSON.parse(req.body.sizes);
        } catch {
          sizes = req.body.sizes.split(',').map((s: string) => s.trim());
        }
      } else if (Array.isArray(req.body.sizes)) {
        sizes = req.body.sizes.map((s: string) => sanitizeString(s));
      }

      if (!title || !price || isNaN(price)) {
        return res.status(400).json({ error: 'Title and valid price are required fields.' });
      }

      const status = stockQuantity === 0 ? 'Out of Stock' : stockQuantity <= 5 ? 'Low Stock' : 'Active';

      const newProduct = await prisma.retailProduct.create({
        data: {
          id: `prod_${Date.now()}`,
          title,
          brand,
          category,
          price,
          originalPrice,
          imageUrl,
          colors,
          silhouette,
          retailer,
          affiliateUrl,
          sku,
          description,
          status,
          sizes,
          occasion,
          stockQuantity,
          similarityScore: 95,
        },
      });

      res.status(201).json(newProduct);
    } catch (err) {
      console.error('Error creating product via Prisma:', err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  },

  // PUT /api/products/:id (Supports JSON or multipart/form-data image upload)
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const existingProduct = await prisma.retailProduct.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updateData: any = {};

      if (req.body.title !== undefined) updateData.title = sanitizeString(req.body.title);
      if (req.body.brand !== undefined) updateData.brand = sanitizeString(req.body.brand);
      if (req.body.category !== undefined) updateData.category = sanitizeString(req.body.category);
      if (req.body.price !== undefined) updateData.price = Number(req.body.price);
      if (req.body.originalPrice !== undefined) updateData.originalPrice = Number(req.body.originalPrice);
      if (req.body.silhouette !== undefined) updateData.silhouette = sanitizeString(req.body.silhouette);
      if (req.body.retailer !== undefined) updateData.retailer = sanitizeString(req.body.retailer);
      if (req.body.affiliateUrl !== undefined) updateData.affiliateUrl = sanitizeString(req.body.affiliateUrl);
      if (req.body.sku !== undefined) updateData.sku = sanitizeString(req.body.sku);
      if (req.body.description !== undefined) updateData.description = sanitizeString(req.body.description);
      if (req.body.occasion !== undefined) updateData.occasion = sanitizeString(req.body.occasion);

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.imageUrl) {
        updateData.imageUrl = sanitizeString(req.body.imageUrl);
      }

      if (req.body.stockQuantity !== undefined) {
        const stockQuantity = Number(req.body.stockQuantity);
        updateData.stockQuantity = stockQuantity;
        updateData.status = stockQuantity === 0 ? 'Out of Stock' : stockQuantity <= 5 ? 'Low Stock' : 'Active';
      }

      if (req.body.colors !== undefined) {
        if (typeof req.body.colors === 'string') {
          try {
            updateData.colors = JSON.parse(req.body.colors);
          } catch {
            updateData.colors = req.body.colors.split(',').map((c: string) => c.trim());
          }
        } else if (Array.isArray(req.body.colors)) {
          updateData.colors = req.body.colors.map((c: string) => sanitizeString(c));
        }
      }

      if (req.body.sizes !== undefined) {
        if (typeof req.body.sizes === 'string') {
          try {
            updateData.sizes = JSON.parse(req.body.sizes);
          } catch {
            updateData.sizes = req.body.sizes.split(',').map((s: string) => s.trim());
          }
        } else if (Array.isArray(req.body.sizes)) {
          updateData.sizes = req.body.sizes.map((s: string) => sanitizeString(s));
        }
      }

      const updatedProduct = await prisma.retailProduct.update({
        where: { id },
        data: updateData,
      });

      res.json(updatedProduct);
    } catch (err) {
      console.error('Error updating product via Prisma:', err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  },

  // DELETE /api/products/:id
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);

      const existingProduct = await prisma.retailProduct.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Cleanly delete associated store stocks and order items before deleting the product
      await prisma.storeStock.deleteMany({ where: { productId: id } });
      await prisma.orderItem.deleteMany({ where: { productId: id } });

      const deleted = await prisma.retailProduct.delete({
        where: { id },
      });

      res.json({ message: 'Product deleted successfully', deletedProduct: deleted });
    } catch (err) {
      console.error('Error deleting product via Prisma:', err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  },

  // PATCH /api/products/:id/stock
  async updateStock(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const newStock = Number(req.body.stockQuantity);

      if (isNaN(newStock) || newStock < 0) {
        return res.status(400).json({ error: 'Valid stock quantity is required.' });
      }

      const status = newStock === 0 ? 'Out of Stock' : newStock <= 5 ? 'Low Stock' : 'Active';

      const updatedProduct = await prisma.retailProduct.update({
        where: { id },
        data: {
          stockQuantity: newStock,
          status,
        },
      });

      res.json(updatedProduct);
    } catch (err) {
      console.error('Error updating product stock via Prisma:', err);
      res.status(500).json({ error: 'Failed to update product stock' });
    }
  },
};
