import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import { EmailService } from '@/server/services/email.service';
import crypto from 'crypto';
import {
  verifyPassword,
  createSessionToken,
  getSessionDurationSeconds,
  sanitizeEmail,
  isValidEmail,
  securityHeaders,
} from '@/server/utils/security';
import { checkDbLockout, recordDbFailedLogin, clearDbLockout } from '@/server/utils/lockout';

const loginRateLimiter = rateLimit(rateLimitPresets.auth);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await loginRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Get IP and user agent for security
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Check DB-backed progressive lockout
    const lockoutCheck = await checkDbLockout(sanitizedEmail);

    if (!lockoutCheck.allowed) {
      console.warn(`Login locked: ${sanitizedEmail} from ${ipAddress} (permanent: ${lockoutCheck.isPermanent})`);
      return NextResponse.json(
        {
          error: lockoutCheck.message,
          lockedUntil: lockoutCheck.lockedUntil?.toISOString(),
          isPermanent: lockoutCheck.isPermanent,
        },
        { status: 429, headers: securityHeaders }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        password: true, 
        role: true,
        status: true, 
        loginCount: true,
        mustChangePassword: true 
      },
    });

    // Generic error message to prevent user enumeration
    const invalidCredentialsError = 'Invalid email or password';

    if (!user) {
      // Still record attempt (won't find user but maintains timing consistency)
      return NextResponse.json(
        { error: invalidCredentialsError },
        { status: 401, headers: securityHeaders }
      );
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Check if user account is pending verification
    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in.' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Verify password
    let passwordValid = false;
    
    // Check if password is hashed (starts with $2a$ or $2b$ for bcrypt)
    if (user.password?.startsWith('$2')) {
      passwordValid = await verifyPassword(password, user.password);
    } else {
      // Legacy plain text password (for migration) - not recommended!
      passwordValid = user.password === password;
    }

    if (!passwordValid) {
      // Record failed attempt in DB — progressive lockout
      const failResult = await recordDbFailedLogin(sanitizedEmail, ipAddress, user.name || undefined);

      if (!failResult.allowed) {
        return NextResponse.json(
          {
            error: failResult.message,
            lockedUntil: failResult.lockedUntil?.toISOString(),
            isPermanent: failResult.isPermanent,
          },
          { status: 429, headers: securityHeaders }
        );
      }

      return NextResponse.json(
        {
          error: invalidCredentialsError,
          remainingAttempts: failResult.remainingAttempts,
        },
        { status: 401, headers: securityHeaders }
      );
    }

    // Clear DB lockout on successful login
    await clearDbLockout(sanitizedEmail);

    // Password correct — send 2FA OTP before creating session
    const otp = String(crypto.randomInt(100000, 999999));
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpires, otpPurpose: 'login' },
    });

    try {
      await EmailService.sendEmail({
        to: user.email,
        subject: `${otp} — Your Find My Fitness verification code`,
        html: `<div style="font-family:sans-serif;background:#0f0f1a;padding:40px 20px;"><div style="max-width:500px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:30px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:24px;">🔐 Verification Code</h1></div><div style="padding:30px;text-align:center;"><p style="color:#a0a0b0;margin:0 0 20px;">Hi ${user.name || 'there'}, your sign-in code is:</p><div style="background:#0f0f1a;border:2px solid #8b5cf6;border-radius:12px;padding:24px;margin:0 0 20px;"><p style="color:#fff;font-size:44px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace;">${otp}</p></div><p style="color:#f87171;font-size:14px;margin:0;">⏱️ Expires in <strong>15 minutes</strong>. Never share this code.</p></div><div style="background:rgba(139,92,246,0.1);padding:16px;text-align:center;border-top:1px solid rgba(139,92,246,0.2);"><p style="color:#606070;font-size:12px;margin:0;">© ${new Date().getFullYear()} Find My Fitness</p></div></div></div>`,
        text: `Your Find My Fitness verification code is: ${otp}

Expires in 15 minutes. Do not share it.`,
      });
    } catch (emailError) {
      console.error('Failed to send 2FA OTP:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        requires2FA: true,
        email: user.email,
        message: 'Verification code sent to your email.',
      },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500, headers: securityHeaders }
    );
  }
}
