import { NextRequest, NextResponse } from 'next/server';
import { LocationsService } from '@/server/services/locations.service';
import { searchLocationsSchema, createLocationSchema } from '@/server/validators/locations.schema';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/locations
 * Search, filter, sort, and paginate locations
 *
 * Query params:
 * - q: Search query (name, address, city)
 * - category: Filter by category
 * - minRating: Minimum rating (0-5)
 * - priceRange: Filter by price ($, $$, $$$)
 * - amenities[]: Array of amenity names (must have ALL)
 * - city, state: Location filters
 * - sort: rating|distance|price|reviewCount (default: rating)
 * - page: Page number (default: 1)
 * - pageSize: Results per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters - support both 'q' and 'query'
    const params = {
      query: searchParams.get('q') || searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      minRating: searchParams.get('minRating') || undefined,
      priceRange: searchParams.get('priceRange') || undefined,
      amenities: searchParams.getAll('amenities') || searchParams.getAll('amenities[]') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      sortBy: searchParams.get('sort') || searchParams.get('sortBy') || 'rating',
      sortOrder: searchParams.get('order') || searchParams.get('sortOrder') || 'desc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('pageSize') || searchParams.get('limit') || '20',
    };

    // Validate with Zod schema
    const validated = searchLocationsSchema.parse(params);
    const result = await LocationsService.searchLocations(validated);

    // Return paginated result with data array
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching locations:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch locations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/locations
 * Create a new location (protected - requires auth)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role-based access control (only admins can create locations)
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();

    // Validate with Zod schema
    const validated = createLocationSchema.parse(body);
    const location = await LocationsService.createLocation(validated);

    return NextResponse.json({
      success: true,
      data: location,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating location:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid location data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create location',
      },
      { status: 500 }
    );
  }
}
