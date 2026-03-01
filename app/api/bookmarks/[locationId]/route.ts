import { NextRequest, NextResponse } from 'next/server';
import { BookmarksService } from '@/server/services/bookmarks.service';
import { getRequestUser } from '@/server/auth/session';

/**
 * DELETE /api/bookmarks/[locationId]
 * Remove a bookmark (unsave a location)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { locationId } = await params;
    await BookmarksService.unsaveLocation(user.id, locationId);

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to remove bookmark',
      },
      { status: 500 }
    );
  }
}
