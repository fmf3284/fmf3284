import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Get all users (including soft-deleted)
 * Query params:
 * - includeDeleted=true : Include deleted users
 * - deletedOnly=true : Show only deleted users
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    const deletedOnly = url.searchParams.get('deletedOnly') === 'true';

    // Build where clause
    let whereClause: any = {};
    if (deletedOnly) {
      whereClause.deletedAt = { not: null };
    } else if (!includeDeleted) {
      whereClause.deletedAt = null;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        deletedAt: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    // Calculate days until permanent deletion for deleted users
    const usersWithRetention = users.map(u => {
      if (u.deletedAt) {
        const deletedDate = new Date(u.deletedAt);
        const daysSinceDeleted = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilPermanentDelete = Math.max(0, 90 - daysSinceDeleted);
        return {
          ...u,
          daysSinceDeleted,
          daysUntilPermanentDelete,
          canRestore: daysUntilPermanentDelete > 0,
        };
      }
      return u;
    });

    return NextResponse.json({ users: usersWithRetention });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
