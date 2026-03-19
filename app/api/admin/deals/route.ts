import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || '';
const isSuperAdmin = (email?: string) => email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();


/**
 * GET /api/admin/deals
 * Get all deals (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

/**
 * POST /api/admin/deals
 * Create new deal
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isSuperAdmin(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, discount, category, locationName, image, validUntil, isFeatured } = body;

    if (!title || !description || !discount || !category || !validUntil) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        description,
        discount,
        category,
        locationName,
        image: image || '🎁',
        validUntil: new Date(validUntil),
        isFeatured: isFeatured || false,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
