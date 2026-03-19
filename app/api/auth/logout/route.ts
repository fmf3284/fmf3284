import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/server/auth/session';
import { logActivity } from '@/server/utils/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request).catch(() => null);
    if (user) { await logActivity({ userId: user.id, action: 'logout', ipAddress: request.headers.get('x-forwarded-for'), userAgent: request.headers.get('user-agent') }); }
    // In production, invalidate session in database/cache

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
        redirect: '/',
      },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
