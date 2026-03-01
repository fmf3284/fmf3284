import { NextRequest, NextResponse } from 'next/server';
import { BookmarksService } from '@/server/services/bookmarks.service';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/bookmarks
 * Get all bookmarks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookmarks = await BookmarksService.getUserBookmarks(user.id);

    return NextResponse.json({
      success: true,
      data: bookmarks,
    });
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch bookmarks',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * Save a location as a bookmark
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      );
    }

    const bookmark = await BookmarksService.saveLocation(user.id, locationId);

    return NextResponse.json({
      success: true,
      data: bookmark,
    });
  } catch (error: any) {
    console.error('Error saving bookmark:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save bookmark',
      },
      { status: 500 }
    );
  }
}
