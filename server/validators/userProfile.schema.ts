import { z } from 'zod';

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
