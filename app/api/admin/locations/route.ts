import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/server/services/admin.service';
import { requireAdmin } from '@/server/middleware/admin';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const readRateLimiter = rateLimit(rateLimitPresets.readOnly);

/**
 * GET /api/admin/locations
 * Get all locations with pagination
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await readRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const adminCheck = await requireAdmin(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;

    const result = await AdminService.getLocations(page, limit, search);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch locations',
      },
      { status: 500 }
    );
  }
}