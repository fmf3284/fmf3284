import { NextRequest, NextResponse } from 'next/server';
import { CheckInsService } from '@/server/services/checkIns.service';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const readRateLimiter = rateLimit(rateLimitPresets.readOnly);

/**
 * GET /api/profile/checkins
 * Get current user's check-in history
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await readRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await CheckInsService.getUserCheckIns(user.id, page, limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch check-ins',
      },
      { status: 500 }
    );
  }
}
