import { prisma } from '@/server/db/prisma';
import type { CreateReviewInput, GetReviewsInput, UpdateReviewInput } from '@/server/validators/reviews.schema';
import { sanitizeText } from '@/server/utils/sanitize';

export interface PaginatedReviews {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ReviewsService {
  /**
   * Get reviews for a location with pagination
   */
  static async getLocationReviews(params: GetReviewsInput): Promise<PaginatedReviews> {
    const { locationId, page, limit, sortBy, sortOrder } = params;

    const skip = (page - 1) * limit;

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    const total = await prisma.review.count({
      where: { locationId },
    });

    // Get paginated reviews
    const reviews = await prisma.review.findMany({
      where: { locationId },
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        userName: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Create a new review and update location rating aggregates
   * Uses a transaction to ensure data consistency
   */
  static async createReview(userId: string, data: CreateReviewInput) {
    const { locationId, rating, comment, userName } = data;

    // Sanitize user input to prevent XSS
    const sanitizedComment = comment ? sanitizeText(comment) : undefined;
    const sanitizedUserName = userName ? sanitizeText(userName) : undefined;

    return await prisma.$transaction(async (tx) => {
      // Check if user already reviewed this location
      const existingReview = await tx.review.findUnique({
        where: {
          userId_locationId: {
            userId,
            locationId,
          },
        },
      });

      if (existingReview) {
        throw new Error('You have already reviewed this location');
      }

      // Create the review
      const review = await tx.review.create({
        data: {
          userId,
          locationId,
          rating,
          comment: sanitizedComment,
          userName: sanitizedUserName,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Recalculate location rating aggregates
      const aggregates = await tx.review.aggregate({
        where: { locationId },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      });

      // Update location with new aggregates
      await tx.location.update({
        where: { id: locationId },
        data: {
          rating: aggregates._avg.rating || 0,
          reviewCount: aggregates._count.id || 0,
        },
      });

      return review;
    });
  }

  /**
   * Update a review and recalculate location rating aggregates
   */
  static async updateReview(userId: string, reviewId: string, data: UpdateReviewInput) {
    // Sanitize user input to prevent XSS
    const sanitizedData = { ...data };
    if (data.comment) {
      sanitizedData.comment = sanitizeText(data.comment);
    }

    return await prisma.$transaction(async (tx) => {
      // Get existing review
      const existingReview = await tx.review.findUnique({
        where: { id: reviewId },
      });

      if (!existingReview) {
        throw new Error('Review not found');
      }

      // Check ownership
      if (existingReview.userId !== userId) {
        throw new Error('You can only update your own reviews');
      }

      // Update the review
      const review = await tx.review.update({
        where: { id: reviewId },
        data: sanitizedData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Recalculate location rating aggregates
      const aggregates = await tx.review.aggregate({
        where: { locationId: existingReview.locationId },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      });

      // Update location with new aggregates
      await tx.location.update({
        where: { id: existingReview.locationId },
        data: {
          rating: aggregates._avg.rating || 0,
          reviewCount: aggregates._count.id || 0,
        },
      });

      return review;
    });
  }

  /**
   * Delete a review and recalculate location rating aggregates
   */
  static async deleteReview(userId: string, reviewId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get existing review
      const existingReview = await tx.review.findUnique({
        where: { id: reviewId },
      });

      if (!existingReview) {
        throw new Error('Review not found');
      }

      // Check ownership
      if (existingReview.userId !== userId) {
        throw new Error('You can only delete your own reviews');
      }

      // Delete the review
      await tx.review.delete({
        where: { id: reviewId },
      });

      // Recalculate location rating aggregates
      const aggregates = await tx.review.aggregate({
        where: { locationId: existingReview.locationId },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      });

      // Update location with new aggregates
      await tx.location.update({
        where: { id: existingReview.locationId },
        data: {
          rating: aggregates._avg.rating || 0,
          reviewCount: aggregates._count.id || 0,
        },
      });
    });
  }

  /**
   * Get a single review by ID
   */
  static async getReviewById(reviewId: string) {
    return await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get all reviews by a user
   */
  static async getUserReviews(userId: string) {
    return await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            category: true,
            image: true,
          },
        },
      },
    });
  }

  /**
   * Check if user has reviewed a location
   */
  static async hasUserReviewed(userId: string, locationId: string): Promise<boolean> {
    const review = await prisma.review.findUnique({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
    });
    return !!review;
  }
}
