import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
import { adminUnlockUser } from '@/server/utils/lockout';
import { securityHeaders } from '@/server/utils/security';

/**
 * POST /api/admin/users/[id]/unlock
 * Admin unlocks a permanently or temporarily locked user account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getRequestUser(request);

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, failedLoginCount: true, lockedUntil: true },
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await adminUnlockUser(userId);

    // Log the unlock action
    try {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'admin_unlock_account',
          details: JSON.stringify({
            unlockedUserId: userId,
            unlockedEmail: targetUser.email,
            previousFailedCount: targetUser.failedLoginCount,
            previousLockedUntil: targetUser.lockedUntil,
            unlockedBy: currentUser.email,
          }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
          userAgent: request.headers.get('user-agent')?.substring(0, 500) || '',
        },
      });
    } catch (e) { /* non-blocking */ }

    return NextResponse.json({
      success: true,
      message: `Account for ${targetUser.name || targetUser.email} has been unlocked successfully.`,
    }, { headers: securityHeaders });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json({ error: 'Failed to unlock account.' }, { status: 500 });
  }
}
