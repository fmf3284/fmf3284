import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/server/services/admin.service';
import { requireAdmin } from '@/server/middleware/admin';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * DELETE /api/admin/locations/:id
 * Delete location
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await writeRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const adminCheck = await requireAdmin(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const { id: locationId } = await params;
    await AdminService.deleteLocation(locationId);

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete location',
      },
      { status: 500 }
    );
  }
}