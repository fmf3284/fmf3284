import { prisma } from '../db/prisma';

export class BookmarksService {
  /**
   * Save/bookmark a location for a user
   */
  static async saveLocation(userId: string, locationId: string) {
    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new Error('Location not found');
    }

    // Create bookmark (upsert to handle duplicates gracefully)
    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
      create: {
        userId,
        locationId,
      },
      update: {},
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

    return bookmark;
  }

  /**
   * Unsave/unbookmark a location for a user
   */
  static async unsaveLocation(userId: string, locationId: string) {
    try {
      await prisma.bookmark.delete({
        where: {
          userId_locationId: {
            userId,
            locationId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      // Bookmark doesn't exist - that's fine
      return { success: true };
    }
  }

  /**
   * Toggle bookmark status
   */
  static async toggleBookmark(userId: string, locationId: string) {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
    });

    if (existing) {
      await this.unsaveLocation(userId, locationId);
      return { saved: false };
    } else {
      await this.saveLocation(userId, locationId);
      return { saved: true };
    }
  }

  /**
   * Get all bookmarked locations for a user
   */
  static async getUserBookmarks(userId: string) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        location: {
          include: {
            amenities: {
              include: {
                amenity: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bookmarks.map((bookmark: any) => ({
      id: bookmark.id,
      savedAt: bookmark.createdAt.toISOString(),
      location: {
        id: bookmark.location.id,
        name: bookmark.location.name,
        category: bookmark.location.category,
        address: bookmark.location.address,
        city: bookmark.location.city,
        state: bookmark.location.state,
        phone: bookmark.location.phone,
        image: bookmark.location.image,
        rating: bookmark.location.rating,
        reviewCount: bookmark.location.reviewCount,
        priceRange: bookmark.location.priceRange,
        distance: bookmark.location.distance,
        amenities: bookmark.location.amenities.map((la: any) => la.amenity.name),
      },
    }));
  }

  /**
   * Check if a location is bookmarked by a user
   */
  static async isLocationBookmarked(userId: string, locationId: string) {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
    });

    return !!bookmark;
  }

  /**
   * Get bookmark count for a location
   */
  static async getLocationBookmarkCount(locationId: string) {
    return prisma.bookmark.count({
      where: { locationId },
    });
  }

  /**
   * Get user's bookmarked location IDs (for quick lookup)
   */
  static async getUserBookmarkedLocationIds(userId: string): Promise<string[]> {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: {
        locationId: true,
      },
    });

    return bookmarks.map((bookmark: { locationId: string }) => bookmark.locationId);
  }
}
