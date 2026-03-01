import { prisma } from '../db/prisma';

export class AdminService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const [
      totalUsers,
      totalLocations,
      totalReviews,
      totalBookmarks,
      totalCheckIns,
      recentUsers,
      recentLocations,
      recentReviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.location.count(),
      prisma.review.count(),
      prisma.bookmark.count(),
      prisma.checkIn.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.location.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          state: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
        },
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
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
      }),
    ]);

    return {
      stats: {
        totalUsers,
        totalLocations,
        totalReviews,
        totalBookmarks,
        totalCheckIns,
      },
      recent: {
        users: recentUsers,
        locations: recentLocations,
        reviews: recentReviews,
      },
    };
  }

  /**
   * Get all users with pagination
   */
  static async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reviews: true,
              bookmarks: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: string) {
    if (!['user', 'admin', 'business_owner'].includes(role)) {
      throw new Error('Invalid role');
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string) {
    return await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get all locations with pagination
   */
  static async getLocations(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          state: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.location.count({ where }),
    ]);

    return {
      data: locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete location
   */
  static async deleteLocation(locationId: string) {
    return await prisma.location.delete({
      where: { id: locationId },
    });
  }

  /**
   * Get all reviews with pagination
   */
  static async getReviews(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      prisma.review.count(),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete review
   */
  static async deleteReview(reviewId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get review before deletion
      const review = await tx.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Delete review
      await tx.review.delete({
        where: { id: reviewId },
      });

      // Recalculate location rating
      const reviews = await tx.review.findMany({
        where: { locationId: review.locationId },
        select: { rating: true },
      });

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      await tx.location.update({
        where: { id: review.locationId },
        data: {
          rating: avgRating,
          reviewCount: reviews.length,
        },
      });

      return review;
    });
  }

  /**
   * Get system activity logs (recent activities)
   */
  static async getActivityLogs(limit: number = 50) {
    const [recentReviews, recentCheckIns, recentBookmarks] = await Promise.all([
      prisma.review.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          rating: true,
          user: { select: { name: true, email: true } },
          location: { select: { name: true } },
        },
      }),
      prisma.checkIn.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          userId: true,
          locationId: true,
        },
      }),
      prisma.bookmark.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          location: { select: { name: true } },
        },
      }),
    ]);

    // Combine and sort by date
    const activities = [
      ...recentReviews.map(r => ({
        type: 'review',
        id: r.id,
        createdAt: r.createdAt,
        description: `${r.user.name || r.user.email} reviewed ${r.location.name}`,
        data: r,
      })),
      ...recentCheckIns.map(c => ({
        type: 'checkin',
        id: c.id,
        createdAt: c.createdAt,
        description: `User checked in`,
        data: c,
      })),
      ...recentBookmarks.map(b => ({
        type: 'bookmark',
        id: b.id,
        createdAt: b.createdAt,
        description: `${b.user.name || b.user.email} bookmarked ${b.location.name}`,
        data: b,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return activities;
  }
}