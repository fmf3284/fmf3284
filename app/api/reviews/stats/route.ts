import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

/**
 * GET /api/reviews/stats
 * Get member review stats for multiple place IDs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeIds = searchParams.get('placeIds');
    
    if (!placeIds) {
      return NextResponse.json({ stats: {} });
    }

    const placeIdArray = placeIds.split(',').filter(Boolean);
    
    if (placeIdArray.length === 0) {
      return NextResponse.json({ stats: {} });
    }

    // Get approved reviews grouped by placeId
    const reviews = await prisma.review.groupBy({
      by: ['placeId'],
      where: {
        placeId: { in: placeIdArray },
        status: 'approved',
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // Convert to object keyed by placeId
    const stats: Record<string, { avgRating: number; count: number }> = {};
    
    reviews.forEach((review) => {
      if (review.placeId) {
        stats[review.placeId] = {
          avgRating: review._avg.rating || 0,
          count: review._count.id,
        };
      }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return NextResponse.json({ stats: {} });
  }
}
