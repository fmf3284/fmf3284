import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/server/services/admin.service';
import { requireAdmin } from '@/server/middleware/admin';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const readRateLimiter = rateLimit(rateLimitPresets.readOnly);

/**
 * GET /api/admin/activity
 * Get recent system activity logs
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
    const limit = parseInt(searchParams.get('limit') || '50');

    const activities = await AdminService.getActivityLogs(limit);

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch activity logs',
      },
      { status: 500 }
    );
  }
}