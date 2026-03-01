/**
 * Image Upload Service
 * 
 * Placeholder for image uploads - stores URLs only for now.
 * Can be extended to use Cloudinary, S3, etc.
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class ImageUploadService {
  /**
   * Validate image file before upload
   */
  static validateImage(file: File): ValidationResult {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum size is 10MB.' };
    }
    return { valid: true };
  }

  /**
   * Upload image - currently just validates URL
   */
  static async uploadImage(file: File | string, options?: { folder?: string }): Promise<UploadResult> {
    // If it's already a URL string, just validate and return it
    if (typeof file === 'string') {
      if (file.startsWith('http://') || file.startsWith('https://')) {
        return { success: true, url: file };
      }
      return { success: false, error: 'Invalid URL format' };
    }

    // For actual file uploads, return placeholder
    // In production, implement Cloudinary, S3, or similar
    return {
      success: false,
      error: 'File uploads not configured. Please use image URLs instead.'
    };
  }

  /**
   * Delete image - placeholder
   */
  static async deleteImage(url: string, publicId?: string, key?: string): Promise<boolean> {
    console.log('Image deletion requested:', url);
    return true;
  }
}
