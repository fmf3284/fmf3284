import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

/**
 * POST /api/activity
 * Log user activity (search, view location, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    
    if (!user) {
      // Don't log for unauthenticated users, but don't error
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const { action, details } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress.split(',')[0].trim(),
        userAgent: userAgent.substring(0, 500),
      },
    });

    // Update user's lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't fail the request if logging fails
    return NextResponse.json({ success: true });
  }
}
