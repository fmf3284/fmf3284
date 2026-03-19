import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { logActivity } from '@/server/utils/activityLogger';
import {
  createSessionToken,
  getSessionDurationSeconds,
  securityHeaders,
} from '@/server/utils/security';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import crypto from 'crypto';

const rateLimiter = rateLimit(rateLimitPresets.auth);

/**
 * POST /api/auth/2fa/verify
 * Verify OTP and complete login — creates session cookie
 * Body: { email, otp }
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimiter(request);
  if (rl) return rl;

  try {
    const { email, otp } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400, headers: securityHeaders });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true, email: true, name: true, role: true,
        status: true, loginCount: true, mustChangePassword: true,
        otpCode: true, otpExpires: true, otpPurpose: true,
      },
    });

    if (!user || !user.otpCode || !user.otpExpires) {
      return NextResponse.json({ error: 'No verification code found. Please log in again.' }, { status: 400, headers: securityHeaders });
    }

    if (user.otpPurpose !== 'login') {
      return NextResponse.json({ error: 'Invalid code. Please log in again.' }, { status: 400, headers: securityHeaders });
    }

    // Check expiry
    if (new Date() > user.otpExpires) {
      await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpires: null, otpPurpose: null } });
      return NextResponse.json({ error: 'Code has expired. Please log in again.' }, { status: 400, headers: securityHeaders });
    }

    // Timing-safe compare
    let valid = false;
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(otp.trim().padEnd(6)),
        Buffer.from(user.otpCode.padEnd(6))
      );
    } catch {
      valid = false;
    }

    if (!valid) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400, headers: securityHeaders });
    }

    // Clear OTP
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpires: null, otpPurpose: null } });

    // Now create session
    const sessionToken = createSessionToken(
      user.id,
      user.email,
      user.role || 'user',
      ipAddress,
      userAgent
    );

    // Update login stats
    const now = new Date();
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: now, lastActiveAt: now, loginCount: (user.loginCount || 0) + 1 },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'login',
            details: JSON.stringify({ method: '2fa_email' }),
            ipAddress: ipAddress.split(',')[0].trim(),
            userAgent: userAgent.substring(0, 500),
          },
        }),
      ]);
    } catch (e) {
      console.error('Failed to update login stats:', e);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword || false,
        },
        redirect: user.mustChangePassword ? '/change-password' : '/dashboard',
      },
      { status: 200, headers: securityHeaders }
    );

    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getSessionDurationSeconds(),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500, headers: securityHeaders });
  }
}
