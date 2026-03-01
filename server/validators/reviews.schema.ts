import { z } from 'zod';

/**
 * Schema for creating a new review
 */
export const createReviewSchema = z.object({
  locationId: z.string().min(1, 'Location ID is required'),
  rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(1, 'Comment is required').max(1000, 'Comment must be less than 1000 characters').optional(),
  userName: z.string().min(1, 'User name is required').max(100, 'User name must be less than 100 characters').optional(),
});

/**
 * Schema for updating a review
 */
export const updateReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

/**
 * Schema for querying reviews
 */
export const getReviewsSchema = z.object({
  locationId: z.string().min(1, 'Location ID is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type GetReviewsInput = z.infer<typeof getReviewsSchema>;
