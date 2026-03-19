import { NextRequest, NextResponse } from 'next/server';
import { CheckInsService } from '@/server/services/checkIns.service';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const readRateLimiter = rateLimit(rateLimitPresets.readOnly);
const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * POST /api/locations/:id/checkin
 * Check in to a location
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await writeRateLimiter(request);
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

    const { id: locationId } = await context.params;

    // Check if already checked in today
    const hasCheckedIn = await CheckInsService.hasCheckedInToday(user.id, locationId);
    if (hasCheckedIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already checked in to this location today',
        },
        { status: 409 }
      );
    }

    const checkIn = await CheckInsService.checkIn(user.id, locationId);

    return NextResponse.json(
      {
        success: true,
        data: checkIn,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error checking in:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check in',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/locations/:id/checkin
 * Get recent check-ins for a location
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await readRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id: locationId } = await context.params;
    const checkIns = await CheckInsService.getLocationCheckIns(locationId);
    const count = await CheckInsService.getLocationCheckInCount(locationId);

    return NextResponse.json({
      success: true,
      data: {
        checkIns,
        totalCheckIns: count,
      },
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
