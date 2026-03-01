import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

/**
 * GET /api/deals
 * Get active deals
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');

    const where: any = {
      isActive: true,
      validUntil: { gte: new Date() },
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const deals = await prisma.deal.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { validUntil: 'asc' },
      ],
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}
