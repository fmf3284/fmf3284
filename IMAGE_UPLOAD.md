# Image Upload System

This document describes the image upload system that supports multiple storage providers.

## Supported Providers

The system supports three storage providers:

1. **AWS S3** - Production recommended
2. **Cloudinary** - Easy setup, good for MVP
3. **Local Filesystem** - Development only

## Configuration

### Environment Variables

```env
# Choose provider: "s3" | "cloudinary" | "local"
IMAGE_PROVIDER=local

# AWS S3 Configuration
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Local Storage (dev only)
LOCAL_UPLOAD_DIR=public/uploads
```

## Setup Instructions

### Option 1: AWS S3 (Production)

**Step 1**: Install AWS SDK
```bash
npm install @aws-sdk/client-s3
```

**Step 2**: Create S3 Bucket
1. Go to AWS Console > S3
2. Create new bucket
3. Enable public access for the bucket
4. Add CORS configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

**Step 3**: Create IAM User
1. Go to AWS Console > IAM
2. Create user with programmatic access
3. Attach policy: `AmazonS3FullAccess`
4. Copy Access Key ID and Secret Access Key

**Step 4**: Configure Environment
```env
IMAGE_PROVIDER=s3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Option 2: Cloudinary (Easy Setup)

**Step 1**: Install Cloudinary SDK
```bash
npm install cloudinary
```

**Step 2**: Sign up for Cloudinary
1. Go to [cloudinary.com](https://cloudinary.com)
2. Create free account
3. Get credentials from dashboard

**Step 3**: Configure Environment
```env
IMAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Option 3: Local Storage (Development Only)

**Step 1**: Configure Environment
```env
IMAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=public/uploads
```

**Step 2**: Create upload directory
```bash
mkdir -p public/uploads/images
```

**Note**: Local storage is NOT recommended for production because:
- Files are lost when container/server restarts
- Doesn't work with serverless deployments (Vercel, Netlify)
- No CDN for fast delivery

## API Endpoints

### Upload Image

**POST** `/api/upload`

**Headers**:
- `Content-Type: multipart/form-data`
- Authentication required

**Body** (FormData):
- `file`: Image file (required)
- `folder`: Upload folder (optional, default: "uploads")

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://bucket.s3.region.amazonaws.com/folder/filename.jpg",
    "filename": "1234567890-abc123.jpg",
    "size": 123456,
    "mimeType": "image/jpeg",
    "key": "folder/filename.jpg",
    "publicId": "folder/filename"
  }
}
```

### Delete Image

**DELETE** `/api/upload`

**Headers**:
- `Content-Type: application/json`
- Authentication required

**Body**:
```json
{
  "url": "https://...",
  "key": "folder/filename.jpg",
  "publicId": "folder/filename"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Usage Examples

### Frontend Upload (React)

```typescript
import { apiClient } from '@/lib/api';

async function uploadImage(file: File) {
  // Validate file on client first
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large. Max 5MB');
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type');
    return;
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'reviews'); // Optional

  try {
    // Upload
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'x-demo-user-id': 'user123', // Your auth headers
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log('Uploaded:', result.data.url);
      return result.data;
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed');
  }
}

// Usage in component
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  }}
/>
```

### Upload with Review

```typescript
// Upload image first
const image = await uploadImage(file);

// Create review with image URL
const review = await apiClient.post('/reviews', {
  locationId: 'loc123',
  rating: 5,
  comment: 'Great place!',
  photos: [image.url], // Add image URL
});
```

### Update User Avatar

```typescript
// Upload avatar
const avatar = await uploadImage(avatarFile);

// Update profile
await apiClient.patch('/profile', {
  avatar: avatar.url,
});
```

## Service Methods

### ImageUploadService

```typescript
import { ImageUploadService } from '@/server/services/imageUpload.service';

// Upload image
const result = await ImageUploadService.uploadImage(file, {
  folder: 'avatars',
  filename: 'custom-name.jpg', // Optional
  maxSize: 2 * 1024 * 1024, // 2MB (optional)
  allowedTypes: ['image/jpeg', 'image/png'], // Optional
});

// Delete image
await ImageUploadService.deleteImage(
  result.url,
  result.publicId, // For Cloudinary
  result.key       // For S3
);

// Validate image (client-side helper)
const validation = ImageUploadService.validateImage(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

## File Validation

### Server-Side (Automatic)
- Max size: 5MB
- Allowed types: JPEG, PNG, WebP, GIF
- Validates before upload

### Client-Side (Recommended)
```typescript
const validation = ImageUploadService.validateImage(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

## Security Features

- Authentication required for all uploads
- Rate limiting (100 requests per 15 minutes)
- File type validation
- File size validation (5MB max)
- Unique filenames prevent overwrites
- Public read access for images

## Folder Structure

Images are organized by folder:

- `uploads/` - General uploads
- `reviews/` - Review photos
- `avatars/` - User avatars
- `locations/` - Location images

Specify folder in upload:
```typescript
formData.append('folder', 'reviews');
```

## Error Handling

Common errors:

**"File too large"**
- Max size: 5MB
- Reduce image quality or resize

**"Invalid file type"**
- Only: JPEG, PNG, WebP, GIF
- Convert to supported format

**"S3 not configured"**
- Add AWS credentials to .env
- Verify bucket exists

**"Cloudinary not configured"**
- Add Cloudinary credentials to .env
- Verify account is active

**"AWS SDK not installed"**
```bash
npm install @aws-sdk/client-s3
```

**"Cloudinary SDK not installed"**
```bash
npm install cloudinary
```

## Cost Estimates

### AWS S3
- Storage: $0.023 per GB/month
- GET requests: $0.0004 per 1000
- PUT requests: $0.005 per 1000
- ~$1-5/month for small apps

### Cloudinary (Free Tier)
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Free for small apps

### Local Storage
- Free but NOT production-ready
- Files lost on restart

## Best Practices

1. **Always validate on client first** - Better UX
2. **Show upload progress** - Use XMLHttpRequest for progress events
3. **Resize images before upload** - Save bandwidth
4. **Use WebP format** - Smaller file sizes
5. **Delete old images** - When user updates avatar/photos
6. **Use CDN** - S3/Cloudinary have built-in CDN
7. **Lazy load images** - Better page performance
8. **Optimize for mobile** - Accept camera uploads

## Image Optimization (Client-Side)

```typescript
async function compressImage(file: File): Promise<File> {
  // Use browser-image-compression library
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  const compressed = await imageCompression(file, options);
  return compressed;
}

// Compress before upload
const compressed = await compressImage(originalFile);
await uploadImage(compressed);
```

## Production Deployment

### Vercel (Recommended)

1. Add environment variables in Vercel dashboard
2. Use S3 or Cloudinary (NOT local)
3. Increase function timeout if needed:
```json
// vercel.json
{
  "functions": {
    "app/api/upload/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### Other Platforms

Same setup - just add environment variables and choose S3 or Cloudinary.

## Troubleshooting

**Issue**: "Module not found"
**Solution**: Install the required SDK

**Issue**: "Access Denied" (S3)
**Solution**: Check IAM permissions and bucket policy

**Issue**: "Upload fails on Vercel"
**Solution**: Check function timeout and payload size limits

**Issue**: "Images not loading"
**Solution**: Verify CORS settings on S3/Cloudinary

## Next Steps

To integrate with reviews:

1. Upload images via `/api/upload`
2. Get back image URLs
3. Pass URLs array to review creation:
```typescript
await apiClient.post('/reviews', {
  locationId: 'loc123',
  rating: 5,
  comment: 'Great!',
  photos: [url1, url2, url3], // From uploads
});
```

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0