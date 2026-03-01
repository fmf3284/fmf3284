import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/reviews?placeId=ChIJ...
 * Get reviews for a Google Place
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('placeId');
    const locationId = searchParams.get('locationId');

    if (!placeId && !locationId) {
      return NextResponse.json(
        { error: 'placeId or locationId is required' },
        { status: 400 }
      );
    }

    // Try to find reviews by placeId first, then by locationId
    // Only return approved reviews for public viewing
    const reviews = await prisma.review.findMany({
      where: placeId 
        ? { placeId, status: 'approved' } 
        : { locationId, status: 'approved' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Create a new review for a Google Place
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication - try server session first, then demo user
    let user = await getRequestUser(request);
    
    // If no server session, check for demo user from request body or cookies
    if (!user) {
      // Try to get demo user from cookie/localStorage via a custom header
      const demoUserHeader = request.headers.get('x-demo-user');
      if (demoUserHeader) {
        try {
          user = JSON.parse(demoUserHeader);
        } catch {}
      }
    }

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'You must be logged in to write a review' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { placeId, placeName, rating, text, isAnonymous } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this place
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        placeId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this location' },
        { status: 409 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        placeId,
        placeName: placeName || 'Unknown Location',
        rating,
        text: text.trim(),
        isAnonymous: isAnonymous || false,
        status: 'approved', // Auto-approve for now
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, review },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}
