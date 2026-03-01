import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
  image: z.string().optional(),
  priceRange: z.enum(['$', '$$', '$$$']).optional(),
  distance: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  amenityIds: z.array(z.string()).optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const searchLocationsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  priceRange: z.enum(['$', '$$', '$$$']).optional(),
  amenities: z.array(z.string()).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  sortBy: z.enum(['rating', 'distance', 'priceAsc', 'priceDesc', 'reviewCount', 'name']).optional().default('rating'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type SearchLocationsInput = z.infer<typeof searchLocationsSchema>;
