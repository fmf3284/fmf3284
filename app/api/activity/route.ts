import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
import { logActivity } from '@/server/utils/activityLogger';

/**
 * POST /api/activity
 * Log user activity — search, view_location, etc.
 * Now captures: IP, geo location, device, browser, OS
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const { action, details } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Use logActivity which captures geo + device info
    await logActivity({
      userId: user.id,
      action,
      details,
      ipAddress,
      userAgent,
    });

    // Update user's lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {}); // non-blocking

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activity logging error:', error);
    return NextResponse.json({ success: true });
  }
}
