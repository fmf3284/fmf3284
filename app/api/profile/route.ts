import { NextRequest, NextResponse } from 'next/server';
import { UserProfilesService } from '@/server/services/userProfiles.service';
import { updateProfileSchema } from '@/server/validators/userProfile.schema';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const readRateLimiter = rateLimit(rateLimitPresets.readOnly);
const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * GET /api/profile
 * Get current user's profile with stats
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

    const profile = await UserProfilesService.getFullProfile(user.id);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch profile',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const profile = await UserProfilesService.updateUserProfile(user.id, validated);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}
