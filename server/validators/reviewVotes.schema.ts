import { z } from 'zod';

/**
 * Schema for voting on a review
 */
export const voteReviewSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  isHelpful: z.boolean(),
});

export type VoteReviewInput = z.infer<typeof voteReviewSchema>;
