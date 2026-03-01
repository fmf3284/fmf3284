import { prisma } from '../db/prisma';

export interface BusinessHoursInput {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // Format: "09:00"
  closeTime: string; // Format: "21:00"
  isClosed?: boolean;
}

export class BusinessHoursService {
  /**
   * Set business hours for a location (full week)
   */
  static async setBusinessHours(locationId: string, hours: BusinessHoursInput[]) {
    return await prisma.$transaction(async (tx) => {
      // Delete existing hours
      await tx.businessHours.deleteMany({
        where: { locationId },
      });

      // Create new hours
      const createdHours = await tx.businessHours.createMany({
        data: hours.map((h) => ({
          locationId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed || false,
        })),
      });

      return createdHours;
    });
  }

  /**
   * Get business hours for a location
   */
  static async getBusinessHours(locationId: string) {
    const hours = await prisma.businessHours.findMany({
      where: { locationId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return hours;
  }

  /**
   * Update hours for a specific day
   */
  static async updateDayHours(
    locationId: string,
    dayOfWeek: number,
    hours: Omit<BusinessHoursInput, 'dayOfWeek'>
  ) {
    return await prisma.businessHours.upsert({
      where: {
        locationId_dayOfWeek: {
          locationId,
          dayOfWeek,
        },
      },
      create: {
        locationId,
        dayOfWeek,
        openTime: hours.openTime,
        closeTime: hours.closeTime,
        isClosed: hours.isClosed || false,
      },
      update: {
        openTime: hours.openTime,
        closeTime: hours.closeTime,
        isClosed: hours.isClosed || false,
      },
    });
  }

  /**
   * Check if location is currently open
   */
  static async isOpenNow(locationId: string): Promise<boolean> {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    const todayHours = await prisma.businessHours.findUnique({
      where: {
        locationId_dayOfWeek: {
          locationId,
          dayOfWeek,
        },
      },
    });

    if (!todayHours || todayHours.isClosed) {
      return false;
    }

    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  /**
   * Get formatted hours (human-readable)
   */
  static formatBusinessHours(hours: any[]) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return hours.map((h) => ({
      day: days[h.dayOfWeek],
      hours: h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`,
      isClosed: h.isClosed,
    }));
  }
}
