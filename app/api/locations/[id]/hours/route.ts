import { NextRequest, NextResponse } from 'next/server';
import { BusinessHoursService } from '@/server/services/businessHours.service';
import { setBusinessHoursSchema } from '@/server/validators/businessHours.schema';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const readRateLimiter = rateLimit(rateLimitPresets.readOnly);
const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * GET /api/locations/:id/hours
 * Get business hours for a location
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
    const hours = await BusinessHoursService.getBusinessHours(locationId);
    const formatted = BusinessHoursService.formatBusinessHours(hours);
    const isOpenNow = await BusinessHoursService.isOpenNow(locationId);

    return NextResponse.json({
      success: true,
      data: {
        hours,
        formatted,
        isOpenNow,
      },
    });
  } catch (error: any) {
    console.error('Error fetching business hours:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch business hours',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/locations/:id/hours
 * Set business hours for a location (requires authentication)
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
    const body = await request.json();

    const validated = setBusinessHoursSchema.parse({
      locationId,
      hours: body.hours,
    });

    const result = await BusinessHoursService.setBusinessHours(
      validated.locationId,
      validated.hours
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error setting business hours:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid business hours data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to set business hours',
      },
      { status: 500 }
    );
  }
}
