import { NextRequest, NextResponse } from 'next/server';
import { ReviewVotesService } from '@/server/services/reviewVotes.service';
import { voteReviewSchema } from '@/server/validators/reviewVotes.schema';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * POST /api/reviews/:id/vote
 * Vote on a review as helpful or not helpful
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResponse = await writeRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
    const { id: reviewId } = await params;

    // Validate input
    const validated = voteReviewSchema.parse({
      reviewId,
      isHelpful: body.isHelpful,
    });

    // Vote on review
    const result = await ReviewVotesService.voteReview(
      user.id,
      validated.reviewId,
      validated.isHelpful
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error voting on review:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid vote data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to vote on review',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/:id/vote
 * Get user's vote on a review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;
    const vote = await ReviewVotesService.getUserVote(user.id, reviewId);

    return NextResponse.json({
      success: true,
      data: vote,
    });
  } catch (error: any) {
    console.error('Error fetching vote:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch vote',
      },
      { status: 500 }
    );
  }
}
