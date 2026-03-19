import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '200');
    const page = parseInt(url.searchParams.get('page') || '1');
    const days = parseInt(url.searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [logs, total, uniqueVisitors, topPages, topCountries, deviceBreakdown] = await Promise.all([
      // Recent logs
      prisma.visitorLog.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),

      // Total visits
      prisma.visitorLog.count({ where: { createdAt: { gte: since } } }),

      // Unique visitors by sessionId
      prisma.visitorLog.groupBy({
        by: ['sessionId'],
        where: { createdAt: { gte: since } },
        _count: true,
      }).then(r => r.length),

      // Top pages
      prisma.visitorLog.groupBy({
        by: ['page'],
        where: { createdAt: { gte: since } },
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10,
      }),

      // Top countries
      prisma.visitorLog.groupBy({
        by: ['country', 'countryCode'],
        where: { createdAt: { gte: since }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),

      // Device breakdown
      prisma.visitorLog.groupBy({
        by: ['device'],
        where: { createdAt: { gte: since } },
        _count: { device: true },
      }),
    ]);

    return NextResponse.json({
      logs,
      stats: {
        total,
        uniqueVisitors,
        topPages,
        topCountries,
        deviceBreakdown,
      },
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('Visitor logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch visitor logs' }, { status: 500 });
  }
}
