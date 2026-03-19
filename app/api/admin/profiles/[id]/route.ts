import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/admin/profiles/:id
 * Get full user profile with all data
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    
    const currentUser = await getRequestUser(request);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        loginCount: true,
        lastLoginAt: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        // Extended profile fields
        age: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        favoriteActivities: true,
        experienceLevel: true,
        fitnessGoals: true,
        // Relations
        reviews: {
          select: {
            id: true,
            placeId: true,
            placeName: true,
            rating: true,
            text: true,
            status: true,
            isAnonymous: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        bookmarks: {
          select: {
            id: true,
            locationId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          select: {
            id: true,
            action: true,
            details: true,
            ipAddress: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/profiles/:id
 * Update user profile (admin only)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    
    const currentUser = await getRequestUser(request);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      age,
      streetAddress,
      city,
      state,
      zipCode,
      favoriteActivities,
      experienceLevel,
      fitnessGoals,
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        age,
        streetAddress,
        city,
        state,
        zipCode,
        favoriteActivities,
        experienceLevel,
        fitnessGoals,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
