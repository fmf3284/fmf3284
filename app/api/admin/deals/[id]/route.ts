import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
const isSuperAdmin = (user: any) => user?.role === 'super_admin';


/**
 * GET /api/admin/deals/[id]
 * Get single deal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const deal = await prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/deals/[id]
 * Update deal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...body,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      },
    });

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/deals/[id]
 * Delete deal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.deal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
