import { NextRequest, NextResponse } from 'next/server';
import { ReviewsService } from '@/server/services/reviews.service';
import { updateReviewSchema } from '@/server/validators/reviews.schema';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/reviews/[id]
 * Get a single review by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const review = await ReviewsService.getReviewById(id);

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: 'Review not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch review',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reviews/[id]
 * Update a review (requires authentication and ownership)
 * Automatically updates location rating aggregates
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate with Zod schema
    const validated = updateReviewSchema.parse(body);

    // Update review and recalculate location aggregates
    const review = await ReviewsService.updateReview(user.id, id, validated);

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error('Error updating review:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid review data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle not found and ownership errors
    if (error.message === 'Review not found') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (error.message === 'You can only update your own reviews') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update review',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Delete a review (requires authentication and ownership)
 * Automatically updates location rating aggregates
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Delete review and recalculate location aggregates
    await ReviewsService.deleteReview(user.id, id);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);

    // Handle not found and ownership errors
    if (error.message === 'Review not found') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (error.message === 'You can only delete your own reviews') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete review',
      },
      { status: 500 }
    );
  }
}
