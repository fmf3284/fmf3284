import { prisma } from '../db/prisma';

export class ReviewVotesService {
  /**
   * Vote a review as helpful or not helpful
   */
  static async voteReview(userId: string, reviewId: string, isHelpful: boolean) {
    return await prisma.$transaction(async (tx) => {
      // Check if user already voted on this review
      const existingVote = await tx.reviewVote.findUnique({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      });

      if (existingVote) {
        // If voting the same way, remove the vote (toggle off)
        if (existingVote.isHelpful === isHelpful) {
          await tx.reviewVote.delete({
            where: { id: existingVote.id },
          });

          // Decrement the count
          await tx.review.update({
            where: { id: reviewId },
            data: {
              [isHelpful ? 'helpfulCount' : 'notHelpfulCount']: {
                decrement: 1,
              },
            },
          });

          return { voted: false, isHelpful };
        }

        // If voting differently, update the vote
        await tx.reviewVote.update({
          where: { id: existingVote.id },
          data: { isHelpful },
        });

        // Update counts: decrement old, increment new
        await tx.review.update({
          where: { id: reviewId },
          data: {
            [existingVote.isHelpful ? 'helpfulCount' : 'notHelpfulCount']: {
              decrement: 1,
            },
            [isHelpful ? 'helpfulCount' : 'notHelpfulCount']: {
              increment: 1,
            },
          },
        });

        return { voted: true, isHelpful, changed: true };
      }

      // Create new vote
      await tx.reviewVote.create({
        data: {
          reviewId,
          userId,
          isHelpful,
        },
      });

      // Increment the count
      await tx.review.update({
        where: { id: reviewId },
        data: {
          [isHelpful ? 'helpfulCount' : 'notHelpfulCount']: {
            increment: 1,
          },
        },
      });

      return { voted: true, isHelpful };
    });
  }

  /**
   * Get user's vote on a review
   */
  static async getUserVote(userId: string, reviewId: string) {
    const vote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    return vote;
  }

  /**
   * Get all votes for a review
   */
  static async getReviewVotes(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        helpfulCount: true,
        notHelpfulCount: true,
      },
    });

    return review;
  }
}
