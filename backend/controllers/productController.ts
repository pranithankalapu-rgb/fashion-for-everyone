import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getDb, saveDb } from '../db';
import { sanitizeString, sanitizeObject, escapeRegex } from '../security';
import type { RetailProduct } from '../types/fashion';

export const productController = {
  // GET /api/products
  getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const queryParam = req.query.query ? sanitizeString(req.query.query as string) : '';
      const categoryParam = req.query.category ? sanitizeString(req.query.category as string) : '';
      const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
      let products = db.products || [];

      if (queryParam) {
        const safeRegex = new RegExp(escapeRegex(queryParam), 'i');
        products = products.filter(p => safeRegex.test(p.title) || safeRegex.test(p.brand));
      }
      if (categoryParam && categoryParam !== 'All') {
        products = products.filter(p => p.category.toLowerCase() === categoryParam.toLowerCase());
      }
      if (maxPrice !== null && !isNaN(maxPrice)) {
        products = products.filter(p => p.price <= maxPrice);
      }

      res.json(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  },

  // GET /api/products/:id
  getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const product = db.products.find(p => p.id === id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  },

  // POST /api/products
  create(req: AuthenticatedRequest, res: Response) {
    try {
      const db = getDb();
      const title = sanitizeString(req.body.title);
      const brand = sanitizeString(req.body.brand) || 'Fashion Studio';
      const category = sanitizeString(req.body.category) || 'Coats & Jackets';
      const price = Number(req.body.price);
      const originalPrice = req.body.originalPrice ? Number(req.body.originalPrice) : undefined;
      const imageUrl = sanitizeString(req.body.imageUrl);
      const silhouette = sanitizeString(req.body.silhouette) || 'Tailored';
      const retailer = sanitizeString(req.body.retailer) || 'Direct Flagship';
      const affiliateUrl = sanitizeString(req.body.affiliateUrl) || '#';
      const description = sanitizeString(req.body.description) || '';
      const stockQuantity = req.body.stockQuantity !== undefined ? Number(req.body.stockQuantity) : 10;
      const sku = sanitizeString(req.body.sku) || `SKU-${Date.now()}`;
      const colors = Array.isArray(req.body.colors) ? req.body.colors.map((c: string) => sanitizeString(c)) : ['#1E293B'];

      if (!title || !price || isNaN(price) || !imageUrl) {
        return res.status(400).json({ error: 'Title, price, and imageUrl are required fields.' });
      }

      const newProduct: RetailProduct = {
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
        status: stockQuantity === 0 ? 'Out of Stock' : stockQuantity <= 5 ? 'Low Stock' : 'Active',
        sizes: req.body.sizes || ['XS', 'S', 'M', 'L', 'XL'],
        stockQuantity,
        similarityScore: 95,
      };

      db.products.unshift(newProduct);
      saveDb(db);

      res.status(201).json(newProduct);
    } catch (err) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  },

  // PUT /api/products/:id
  update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const index = db.products.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const sanitizedBody = sanitizeObject(req.body);
      const updatedProduct: RetailProduct = {
        ...db.products[index],
        ...sanitizedBody,
        id, // preserve original ID
      };

      db.products[index] = updatedProduct;
      saveDb(db);

      res.json(updatedProduct);
    } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  },

  // DELETE /api/products/:id
  delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const db = getDb();
      const index = db.products.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const deleted = db.products.splice(index, 1)[0];
      saveDb(db);

      res.json({ message: 'Product deleted successfully', deletedProduct: deleted });
    } catch (err) {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  },

  // PATCH /api/products/:id/stock
  updateStock(req: AuthenticatedRequest, res: Response) {
    try {
      const id = sanitizeString(req.params.id);
      const newStock = Number(req.body.stockQuantity);

      if (isNaN(newStock) || newStock < 0) {
        return res.status(400).json({ error: 'Valid stock quantity is required.' });
      }

      const db = getDb();
      const product = db.products.find(p => p.id === id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      product.stockQuantity = newStock;
      product.status = newStock === 0 ? 'Out of Stock' : newStock <= 5 ? 'Low Stock' : 'Active';

      saveDb(db);
      res.json(product);
    } catch (err) {
      console.error('Error updating product stock:', err);
      res.status(500).json({ error: 'Failed to update product stock' });
    }
  },
};
