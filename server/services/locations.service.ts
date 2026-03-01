import { prisma } from '../db/prisma';
import type { CreateLocationInput, UpdateLocationInput, SearchLocationsInput } from '../validators/locations.schema';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class LocationsService {
  /**
   * Search and filter locations with pagination
   */
  static async searchLocations(params: SearchLocationsInput): Promise<PaginatedResult<any>> {
    const { query, category, minRating, priceRange, amenities, city, state, sortBy, sortOrder, page, limit } = params;

    // Build where clause
    const where: any = {};

    // Text search across multiple fields
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    if (priceRange) {
      where.priceRange = priceRange;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = state;
    }

    // Filter by amenities (location must have ALL selected amenities)
    if (amenities && amenities.length > 0) {
      where.amenities = {
        some: {
          amenity: {
            name: {
              in: amenities,
            },
          },
        },
      };
    }

    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: sortOrder };
        break;
      case 'distance':
        // Note: For real distance sorting, you'd need lat/lng and calculate distance
        orderBy = { distance: sortOrder };
        break;
      case 'priceAsc':
        orderBy = { priceRange: 'asc' };
        break;
      case 'priceDesc':
        orderBy = { priceRange: 'desc' };
        break;
      case 'reviewCount':
        orderBy = { reviewCount: sortOrder };
        break;
      case 'name':
        orderBy = { name: sortOrder };
        break;
      default:
        orderBy = { rating: 'desc' };
    }

    // Get total count
    const total = await prisma.location.count({ where });

    // Get paginated data
    const skip = (page - 1) * limit;
    const locations = await prisma.location.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
        _count: {
          select: {
            bookmarks: true,
            reviews: true,
          },
        },
      },
    });

    // Transform to match frontend format
    const data = locations.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      category: loc.category,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      phone: loc.phone,
      website: loc.website,
      email: loc.email,
      description: loc.description,
      image: loc.image,
      rating: loc.rating,
      reviewCount: loc.reviewCount,
      priceRange: loc.priceRange,
      distance: loc.distance,
      amenities: loc.amenities.map((la: any) => la.amenity.name),
      bookmarkCount: loc._count.bookmarks,
      coordinates: loc.latitude && loc.longitude ? { lat: loc.latitude, lng: loc.longitude } : undefined,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get location by ID
   */
  static async getLocationById(locationId: string) {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
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
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            bookmarks: true,
            reviews: true,
          },
        },
      },
    });

    if (!location) {
      return null;
    }

    return {
      id: location.id,
      name: location.name,
      category: location.category,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      phone: location.phone,
      website: location.website,
      email: location.email,
      description: location.description,
      image: location.image,
      rating: location.rating,
      reviewCount: location.reviewCount,
      priceRange: location.priceRange,
      distance: location.distance,
      amenities: location.amenities.map((la: any) => la.amenity.name),
      reviews: location.reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user.name || 'Anonymous',
        date: r.createdAt.toISOString(),
      })),
      bookmarkCount: location._count.bookmarks,
      coordinates: location.latitude && location.longitude ? { lat: location.latitude, lng: location.longitude } : undefined,
    };
  }

  /**
   * Create a new location
   */
  static async createLocation(data: CreateLocationInput) {
    const { amenityIds, ...locationData } = data;

    // Sanitize text fields to prevent XSS
    const sanitizedData: any = { ...locationData };
    if (sanitizedData.name) sanitizedData.name = sanitizeText(sanitizedData.name);
    if (sanitizedData.description) sanitizedData.description = sanitizeText(sanitizedData.description);
    if (sanitizedData.address) sanitizedData.address = sanitizeText(sanitizedData.address);
    if (sanitizedData.city) sanitizedData.city = sanitizeText(sanitizedData.city);
    if (sanitizedData.phone) sanitizedData.phone = sanitizeText(sanitizedData.phone);
    if (sanitizedData.email) sanitizedData.email = sanitizeText(sanitizedData.email);
    if (sanitizedData.website) sanitizedData.website = sanitizeUrl(sanitizedData.website);

    const location = await prisma.location.create({
      data: {
        ...sanitizedData,
        ...(amenityIds && amenityIds.length > 0
          ? {
              amenities: {
                create: amenityIds.map((amenityId: string) => ({
                  amenity: {
                    connect: { id: amenityId },
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    return location;
  }

  /**
   * Update a location
   */
  static async updateLocation(locationId: string, data: UpdateLocationInput) {
    const { amenityIds, ...locationData } = data;

    // Sanitize text fields to prevent XSS
    const sanitizedData: any = { ...locationData };
    if (sanitizedData.name) sanitizedData.name = sanitizeText(sanitizedData.name);
    if (sanitizedData.description) sanitizedData.description = sanitizeText(sanitizedData.description);
    if (sanitizedData.address) sanitizedData.address = sanitizeText(sanitizedData.address);
    if (sanitizedData.city) sanitizedData.city = sanitizeText(sanitizedData.city);
    if (sanitizedData.phone) sanitizedData.phone = sanitizeText(sanitizedData.phone);
    if (sanitizedData.email) sanitizedData.email = sanitizeText(sanitizedData.email);
    if (sanitizedData.website) sanitizedData.website = sanitizeUrl(sanitizedData.website);

    // If amenities are being updated, delete existing and create new ones
    if (amenityIds !== undefined) {
      await prisma.locationAmenity.deleteMany({
        where: { locationId },
      });
    }

    const location = await prisma.location.update({
      where: { id: locationId },
      data: {
        ...sanitizedData,
        ...(amenityIds && amenityIds.length > 0
          ? {
              amenities: {
                create: amenityIds.map((amenityId: string) => ({
                  amenity: {
                    connect: { id: amenityId },
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    return location;
  }

  /**
   * Delete a location
   */
  static async deleteLocation(locationId: string) {
    return prisma.location.delete({
      where: { id: locationId },
    });
  }

  /**
   * Get all unique categories
   */
  static async getCategories() {
    const locations = await prisma.location.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return locations.map((l: { category: string }) => l.category);
  }

  /**
   * Get all amenities
   */
  static async getAllAmenities() {
    return prisma.amenity.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Create or get amenity by name
   */
  static async createOrGetAmenity(name: string) {
    return prisma.amenity.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}
