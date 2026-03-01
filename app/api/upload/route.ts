import { NextRequest, NextResponse } from 'next/server';
import { ImageUploadService } from '@/server/services/imageUpload.service';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * POST /api/upload
 * Upload image file
 *
 * Supports multipart/form-data with:
 * - file: Image file (required)
 * - folder: Upload folder (optional, default: "uploads")
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     url: "https://...",
 *     filename: "...",
 *     size: 12345,
 *     mimeType: "image/jpeg"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await writeRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = ImageUploadService.validateImage(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload file
    const result = await ImageUploadService.uploadImage(file, {
      folder: folder || 'uploads',
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Delete uploaded image
 *
 * Body:
 * {
 *   url: "https://...",
 *   publicId: "..." (for Cloudinary),
 *   key: "..." (for S3)
 * }
 */
export async function DELETE(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await writeRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, publicId, key } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Image URL required' },
        { status: 400 }
      );
    }

    // Delete image
    await ImageUploadService.deleteImage(url, publicId, key);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete image',
      },
      { status: 500 }
    );
  }
}