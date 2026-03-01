import { prisma } from '../db/prisma';
import { sanitizeText } from '../utils/sanitize';

export interface UpdateProfileInput {
  bio?: string;
  avatar?: string;
  city?: string;
  state?: string;
}

export class UserProfilesService {
  /**
   * Get or create user profile
   */
  static async getUserProfile(userId: string) {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
      },
      update: {},
    });

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      ...profile,
      user,
    };
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: UpdateProfileInput) {
    // Sanitize text inputs
    const sanitizedData: any = {};
    if (data.bio) sanitizedData.bio = sanitizeText(data.bio);
    if (data.avatar) sanitizedData.avatar = data.avatar;
    if (data.city) sanitizedData.city = sanitizeText(data.city);
    if (data.state) sanitizedData.state = sanitizeText(data.state);

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...sanitizedData,
      },
      update: sanitizedData,
    });

    return profile;
  }

  /**
   * Get user stats (reviews, check-ins, etc.)
   */
  static async getUserStats(userId: string) {
    const [profile, reviewCount, checkInCount, bookmarkCount] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
      }),
      prisma.review.count({
        where: { userId },
      }),
      prisma.checkIn.count({
        where: { userId },
      }),
      prisma.bookmark.count({
        where: { userId },
      }),
    ]);

    // Update profile counts if they're out of sync
    if (profile && (profile.reviewCount !== reviewCount || profile.checkInCount !== checkInCount)) {
      await prisma.userProfile.update({
        where: { userId },
        data: {
          reviewCount,
          checkInCount,
        },
      });
    }

    return {
      reviewCount,
      checkInCount,
      bookmarkCount,
      friendCount: profile?.friendCount || 0,
      eliteYear: profile?.eliteYear || null,
    };
  }

  /**
   * Get user's full profile with stats
   */
  static async getFullProfile(userId: string) {
    const [profile, stats, user] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserStats(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      ...profile,
      ...stats,
      user,
    };
  }

  /**
   * Make user elite (Yelp-like feature)
   */
  static async makeElite(userId: string, year: number) {
    return await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        eliteYear: year,
      },
      update: {
        eliteYear: year,
      },
    });
  }
}
