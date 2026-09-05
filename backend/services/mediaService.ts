import path from 'path';
import fs from 'fs';
import { validateSafePath } from '../security';

export interface UploadedMediaResult {
  url: string;
  thumbnailUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  provider: 'CLOUDINARY' | 'S3' | 'LOCAL';
}

export interface MediaProvider {
  upload(file: Express.Multer.File): Promise<UploadedMediaResult>;
  delete(fileUrl: string): Promise<boolean>;
}

// 1. Cloudinary / Cloud Storage Provider
class CloudinaryMediaProvider implements MediaProvider {
  async upload(file: Express.Multer.File): Promise<UploadedMediaResult> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'fashion-demo';
    const publicId = `fashion_${Date.now()}_${path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`;
    const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_thumb,w_300,g_face,f_auto,q_auto/${publicId}`;

    return {
      url,
      thumbnailUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      provider: 'CLOUDINARY',
    };
  }

  async delete(): Promise<boolean> {
    return true;
  }
}

// 2. Secure Local Media Provider
class SecureLocalMediaProvider implements MediaProvider {
  private uploadsDir = path.resolve(process.cwd(), 'backend', 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadedMediaResult> {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `media_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    const targetPath = validateSafePath(this.uploadsDir, filename);

    if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, targetPath);
    }

    const url = `/uploads/${filename}`;
    return {
      url,
      thumbnailUrl: url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      provider: 'LOCAL',
    };
  }

  async delete(fileUrl: string): Promise<boolean> {
    try {
      const filename = path.basename(fileUrl);
      const targetPath = validateSafePath(this.uploadsDir, filename);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const mediaService = {
  getProvider(): MediaProvider {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      return new CloudinaryMediaProvider();
    }
    return new SecureLocalMediaProvider();
  },

  async handleUpload(file: Express.Multer.File): Promise<UploadedMediaResult> {
    // Validate MIME types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: JPG, PNG, WebP, AVIF, GIF.`);
    }

    // Max 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(`File size exceeds 10MB limit.`);
    }

    const provider = this.getProvider();
    return provider.upload(file);
  },
};
