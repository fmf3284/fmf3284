import { prisma } from '../db/prisma';

export class CheckInsService {
  /**
   * Create a check-in
   */
  static async checkIn(userId: string, locationId: string) {
    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new Error('Location not found');
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        locationId,
      },
    });

    // Update user profile check-in count
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        checkInCount: 1,
      },
      update: {
        checkInCount: {
          increment: 1,
        },
      },
    });

    return checkIn;
  }

  /**
   * Get user's check-in history
   */
  static async getUserCheckIns(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [checkIns, total] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          ci.id,
          ci."createdAt",
          l.id as "locationId",
          l.name as "locationName",
          l.category,
          l.image,
          l.city,
          l.state
        FROM check_ins ci
        LEFT JOIN locations l ON ci."locationId" = l.id
        WHERE ci."userId" = ${userId}
        ORDER BY ci."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `,
      prisma.checkIn.count({ where: { userId } }),
    ]);

    return {
      data: checkIns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get location's recent check-ins
   */
  static async getLocationCheckIns(locationId: string, limit: number = 10) {
    const checkIns = await prisma.$queryRaw<any[]>`
      SELECT
        ci.id,
        ci."createdAt",
        up.avatar,
        u.name as "userName"
      FROM check_ins ci
      LEFT JOIN users u ON ci."userId" = u.id
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE ci."locationId" = ${locationId}
      ORDER BY ci."createdAt" DESC
      LIMIT ${limit}
    `;

    return checkIns;
  }

  /**
   * Get check-in count for a location
   */
  static async getLocationCheckInCount(locationId: string) {
    const count = await prisma.checkIn.count({
      where: { locationId },
    });

    return count;
  }

  /**
   * Check if user has checked in today
   */
  static async hasCheckedInToday(userId: string, locationId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        userId,
        locationId,
        createdAt: {
          gte: today,
        },
      },
    });

    return !!checkIn;
  }
}
