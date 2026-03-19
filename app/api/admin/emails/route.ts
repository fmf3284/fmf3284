import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/admin/emails
 * Get email logs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status'); // sent, failed
    const type = url.searchParams.get('type'); // verification, welcome, etc.

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const emails = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get stats
    const stats = await prisma.emailLog.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const totalSent = stats.find(s => s.status === 'sent')?._count.status || 0;
    const totalFailed = stats.find(s => s.status === 'failed')?._count.status || 0;

    return NextResponse.json({ 
      emails,
      stats: {
        total: totalSent + totalFailed,
        sent: totalSent,
        failed: totalFailed,
      }
    });
  } catch (error: any) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
