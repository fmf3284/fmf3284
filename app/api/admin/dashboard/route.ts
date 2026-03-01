import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/server/services/admin.service';
import { requireAdmin } from '@/server/middleware/admin';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const readRateLimiter = rateLimit(rateLimitPresets.readOnly);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await readRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check admin access
  const adminCheck = await requireAdmin(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const stats = await AdminService.getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dashboard stats',
      },
      { status: 500 }
    );
  }
}