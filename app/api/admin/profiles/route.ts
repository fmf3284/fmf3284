import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/admin/profiles
 * Get all user profiles with stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
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
        _count: {
          select: {
            reviews: true,
            bookmarks: true,
            activityLogs: true,
          },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}
