import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/admin/logs
 * Get activity logs for admin with time filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '200');
    const page = parseInt(searchParams.get('page') || '1');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
    // Time filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get logs with user info
    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Get total count
    const total = await prisma.activityLog.count({ where });

    // Get action type counts for this filter
    const actionCounts = await prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    });

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      actionCounts: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

/**
 * POST /api/admin/logs
 * Get user activity statistics
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get users with their activity stats
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        lastLoginAt: true,
        lastActiveAt: true,
        loginCount: true,
        createdAt: true,
        _count: {
          select: {
            activityLogs: true,
          },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    // Get recent activity summary (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.activityLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: oneDayAgo } },
      _count: { action: true },
    });

    // Get active users in last 24 hours
    const activeUsers = await prisma.user.count({
      where: { lastActiveAt: { gte: oneDayAgo } },
    });

    return NextResponse.json({
      users,
      recentActivity: recentActivity.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>),
      activeUsersLast24h: activeUsers,
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
